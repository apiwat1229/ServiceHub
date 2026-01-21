import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { isValid, parse } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRawMaterialPlanDto } from './dto/create-raw-material-plan.dto';

@Injectable()
export class RawMaterialPlansService {
    constructor(private prisma: PrismaService) { }

    private parseDate(dateStr: string | Date): Date {
        if (dateStr instanceof Date) return dateStr;
        if (!dateStr) return new Date();

        // Try parsing 'dd MMM yy' e.g. '21 Jan 26'
        // Note: year '26' -> 2026. 'yy' handles this.
        const parsed = parse(dateStr, 'dd MMM yy', new Date());
        if (isValid(parsed)) return parsed;

        // Fallback to standard date parse
        const standard = new Date(dateStr);
        return isValid(standard) ? standard : new Date();
    }

    private cleanNumber(val: any): number | null {
        if (val === '-' || val === '' || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
    }

    async create(createDto: CreateRawMaterialPlanDto) {
        const {
            rows,
            poolDetails,
            issueBy,
            verifiedBy,
            issuedDate,
            ...mainRemaining
        } = createDto;

        // Ensure we don't accidentally pass id or other clashing fields to Prisma
        const { id: _, status: __, createdAt: ___, updatedAt: ____, ...mainData } = mainRemaining as any;
        console.log('[RawMaterialPlansService] Creating plan:', createDto.planNo);
        console.log('[RawMaterialPlansService] Incoming DTO keys:', Object.keys(createDto));
        console.log('[RawMaterialPlansService] Rows count:', rows?.length);
        console.log('[RawMaterialPlansService] PoolDetails count:', poolDetails?.length);

        try {
            // Transform Row Data (with safety guard)
            let lastValidDate: Date | null = null;
            const formattedRows = (rows || []).map((row, idx) => {
                const currentDate = row.date ? this.parseDate(row.date) : lastValidDate;
                if (row.date) lastValidDate = currentDate;

                return {
                    date: currentDate || new Date(),
                    dayOfWeek: row.dayOfWeek,
                    shift: row.shift,
                    grade: row.grade,

                    ratioUSS: this.cleanNumber(row.ratioUSS),
                    ratioCL: this.cleanNumber(row.ratioCL),
                    ratioBK: this.cleanNumber(row.ratioBK),
                    productTarget: this.cleanNumber(row.productTarget),
                    clConsumption: this.cleanNumber(row.clConsumption),
                    ratioBorC: this.cleanNumber(row.ratioBorC),

                    // Handle Arrays to Strings
                    plan1Pool: Array.isArray(row.plan1Pool) ? row.plan1Pool.join(',') : row.plan1Pool,
                    plan1Note: `Scoops: ${row.plan1Scoops || 0}, Grades: ${Array.isArray(row.plan1Grades) ? row.plan1Grades.join(',') : ''}`,

                    plan2Pool: Array.isArray(row.plan2Pool) ? row.plan2Pool.join(',') : row.plan2Pool,
                    plan2Note: `Scoops: ${row.plan2Scoops || 0}, Grades: ${Array.isArray(row.plan2Grades) ? row.plan2Grades.join(',') : ''}`,

                    plan3Pool: Array.isArray(row.plan3Pool) ? row.plan3Pool.join(',') : row.plan3Pool,
                    plan3Note: `Scoops: ${row.plan3Scoops || 0}, Grades: ${Array.isArray(row.plan3Grades) ? row.plan3Grades.join(',') : ''}`,

                    cuttingPercent: this.cleanNumber(row.cuttingPercent),
                    cuttingPalette: this.cleanNumber(row.cuttingPalette) !== null ? Math.round(Number(this.cleanNumber(row.cuttingPalette))) : null,

                    remarks: row.remarks,
                    specialIndicator: row.productionMode // Mapping productionMode to specialIndicator
                };
            });

            // Transform Pool Details (with safety guard)
            const formattedPools = (poolDetails || []).map(pool => ({
                poolNo: pool.poolNo,
                grossWeight: this.cleanNumber(pool.grossWeight),
                netWeight: this.cleanNumber(pool.netWeight),
                drc: this.cleanNumber(pool.drc),
                moisture: this.cleanNumber(pool.moisture),
                p0: this.cleanNumber(pool.p0),
                pri: this.cleanNumber(pool.pri),
                clearDate: pool.clearDate ? this.parseDate(pool.clearDate) : null,
                grade: Array.isArray(pool.grade) ? pool.grade.join(',') : pool.grade,
            }));

            const result = await this.prisma.rawMaterialPlan.create({
                data: {
                    ...mainData,
                    issuedDate: this.parseDate(issuedDate),
                    creator: issueBy || 'System',
                    checker: verifiedBy,
                    status: 'DRAFT',
                    rows: {
                        create: formattedRows
                    },
                    poolDetails: {
                        create: formattedPools
                    }
                },
                include: {
                    rows: true,
                    poolDetails: true
                }
            });
            console.log('[RawMaterialPlansService] Plan created successfully:', result.id);
            return result;
        } catch (error: any) {
            console.error('[RawMaterialPlansService] FATAL ERROR creating plan:', error);
            if (error.code === 'P2002') {
                throw new ConflictException(`Plan number "${createDto.planNo}" already exists in the system.`);
            }
            // Return a more descriptive error if possible
            const message = error.message || 'Unknown database error occurred';
            throw new InternalServerErrorException(`Backend Error: ${message}. Please check if database migrations are up to date.`);
        }
    }

    async findAll() {
        return this.prisma.rawMaterialPlan.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                rows: true,
                poolDetails: true
            }
        });
    }

    async findOne(id: string) {
        return this.prisma.rawMaterialPlan.findUnique({
            where: { id },
            include: {
                rows: true,
                poolDetails: true
            }
        });
    }

    async update(id: string, updateDto: CreateRawMaterialPlanDto) {
        const { rows, poolDetails, ...mainData } = updateDto;

        try {
            return await this.prisma.$transaction(async (tx) => {
                // 1. Delete children
                await tx.rawMaterialPlanRow.deleteMany({ where: { planId: id } });
                await tx.rawMaterialPlanPoolDetail.deleteMany({ where: { planId: id } });

                // 2. Update parent
                const plan = await tx.rawMaterialPlan.update({
                    where: { id },
                    data: {
                        ...mainData,
                        issuedDate: new Date(mainData.issuedDate),
                        rows: {
                            create: (rows || []).map(r => ({
                                ...r,
                                date: r.date ? new Date(r.date) : null,
                                ratioUSS: Number(r.ratioUSS) || 0,
                                ratioCL: Number(r.ratioCL) || 0,
                                ratioBK: Number(r.ratioBK) || 0,
                                productTarget: Number(r.productTarget) || 0,
                                clConsumption: Number(r.clConsumption) || 0,
                                ratioBorC: Number(r.ratioBorC) || 0,
                                plan1Scoops: Number(r.plan1Scoops) || 0,
                                plan2Scoops: Number(r.plan2Scoops) || 0,
                                plan3Scoops: Number(r.plan3Scoops) || 0,
                                cuttingPercent: Number(r.cuttingPercent) || 0,
                                cuttingPalette: Math.floor(Number(r.cuttingPalette)) || 0,
                                plan1Pool: Array.isArray(r.plan1Pool) ? r.plan1Pool.join(',') : String(r.plan1Pool || ''),
                                plan1Grades: Array.isArray(r.plan1Grades) ? r.plan1Grades.join(',') : String(r.plan1Grades || ''),
                                plan2Pool: Array.isArray(r.plan2Pool) ? r.plan2Pool.join(',') : String(r.plan2Pool || ''),
                                plan2Grades: Array.isArray(r.plan2Grades) ? r.plan2Grades.join(',') : String(r.plan2Grades || ''),
                                plan3Pool: Array.isArray(r.plan3Pool) ? r.plan3Pool.join(',') : String(r.plan3Pool || ''),
                                plan3Grades: Array.isArray(r.plan3Grades) ? r.plan3Grades.join(',') : String(r.plan3Grades || ''),
                            }))
                        },
                        poolDetails: {
                            create: (poolDetails || []).map(p => ({
                                ...p,
                                grossWeight: Number(p.grossWeight) || 0,
                                netWeight: Number(p.netWeight) || 0,
                                drc: Number(p.drc) || 0,
                                moisture: Number(p.moisture) || 0,
                                p0: Number(p.p0) || 0,
                                pri: Number(p.pri) || 0,
                                clearDate: p.clearDate ? new Date(p.clearDate) : null,
                                grade: Array.isArray(p.grade) ? p.grade.join(',') : String(p.grade || '')
                            }))
                        }
                    },
                    include: {
                        rows: true,
                        poolDetails: true
                    }
                });

                return plan;
            });
        } catch (error: any) {
            console.error('[RawMaterialPlansService] Error updating plan:', error);
            throw new InternalServerErrorException(`Failed to update plan: ${error.message || 'Unknown error'}`);
        }
    }
}
