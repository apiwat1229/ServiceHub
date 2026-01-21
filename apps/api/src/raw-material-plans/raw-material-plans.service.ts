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
        const {
            rows,
            poolDetails,
            issueBy,
            verifiedBy,
            issuedDate,
            ...mainRemaining
        } = updateDto;

        // Ensure we don't accidentally pass id or other clashing fields to Prisma
        const { id: _, status: __, createdAt: ___, updatedAt: ____, ...mainData } = mainRemaining as any;

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
                        creator: issueBy,
                        checker: verifiedBy,
                        issuedDate: new Date(issuedDate),
                        rows: {
                            create: (rows || []).map(r => ({
                                date: r.date ? new Date(r.date) : new Date(),
                                dayOfWeek: r.dayOfWeek,
                                shift: r.shift,
                                grade: r.grade,
                                ratioUSS: this.cleanNumber(r.ratioUSS),
                                ratioCL: this.cleanNumber(r.ratioCL),
                                ratioBK: this.cleanNumber(r.ratioBK),
                                productTarget: this.cleanNumber(r.productTarget),
                                clConsumption: this.cleanNumber(r.clConsumption),
                                ratioBorC: this.cleanNumber(r.ratioBorC),
                                plan1Pool: Array.isArray(r.plan1Pool) ? r.plan1Pool.join(',') : String(r.plan1Pool || ''),
                                plan1Note: `Scoops: ${r.plan1Scoops || 0}, Grades: ${Array.isArray(r.plan1Grades) ? r.plan1Grades.join(',') : ''}`,
                                plan2Pool: Array.isArray(r.plan2Pool) ? r.plan2Pool.join(',') : String(r.plan2Pool || ''),
                                plan2Note: `Scoops: ${r.plan2Scoops || 0}, Grades: ${Array.isArray(r.plan2Grades) ? r.plan2Grades.join(',') : ''}`,
                                plan3Pool: Array.isArray(r.plan3Pool) ? r.plan3Pool.join(',') : String(r.plan3Pool || ''),
                                plan3Note: `Scoops: ${r.plan3Scoops || 0}, Grades: ${Array.isArray(r.plan3Grades) ? r.plan3Grades.join(',') : ''}`,
                                cuttingPercent: this.cleanNumber(r.cuttingPercent),
                                cuttingPalette: this.cleanNumber(r.cuttingPalette) !== null ? Math.floor(Number(this.cleanNumber(r.cuttingPalette))) : null,
                                remarks: r.remarks,
                                specialIndicator: r.productionMode
                            }))
                        },
                        poolDetails: {
                            create: (poolDetails || []).map(p => ({
                                poolNo: p.poolNo,
                                grossWeight: this.cleanNumber(p.grossWeight),
                                netWeight: this.cleanNumber(p.netWeight),
                                drc: this.cleanNumber(p.drc),
                                moisture: this.cleanNumber(p.moisture),
                                p0: this.cleanNumber(p.p0),
                                pri: this.cleanNumber(p.pri),
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
    async remove(id: string) {
        try {
            return await this.prisma.rawMaterialPlan.delete({
                where: { id }
            });
        } catch (error: any) {
            console.error('[RawMaterialPlansService] Error deleting plan:', error);
            throw new InternalServerErrorException(`Failed to delete plan: ${error.message || 'Unknown error'}`);
        }
    }
}
