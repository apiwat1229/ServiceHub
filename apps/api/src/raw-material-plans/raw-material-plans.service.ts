import { Injectable } from '@nestjs/common';
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
            ...mainData
        } = createDto;

        // Transform Row Data
        const formattedRows = rows.map(row => ({
            date: this.parseDate(row.date),
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
            // Note: Schema doesn't have plan1Scoops logic specifically mapped to separate columns except maybe notes?
            // Schema has: plan1Pool, plan1Note. 
            // User frontend has scoops and grades. I'll store scoops/grades in note or similar if needed.
            // Wait, Schema has NO scoops column?
            // Looking at Schema: plan1Pool (String), plan1Note (String).
            // I will combine Scoops/Grades into plan1Note for now: "Scoops: 5, Grades: A,B"
            plan1Note: `Scoops: ${row.plan1Scoops || 0}, Grades: ${Array.isArray(row.plan1Grades) ? row.plan1Grades.join(',') : ''}`,

            plan2Pool: Array.isArray(row.plan2Pool) ? row.plan2Pool.join(',') : row.plan2Pool,
            plan2Note: `Scoops: ${row.plan2Scoops || 0}, Grades: ${Array.isArray(row.plan2Grades) ? row.plan2Grades.join(',') : ''}`,

            plan3Pool: Array.isArray(row.plan3Pool) ? row.plan3Pool.join(',') : row.plan3Pool,
            plan3Note: `Scoops: ${row.plan3Scoops || 0}, Grades: ${Array.isArray(row.plan3Grades) ? row.plan3Grades.join(',') : ''}`,

            cuttingPercent: this.cleanNumber(row.cuttingPercent),
            cuttingPalette: this.cleanNumber(row.cuttingPalette) ? Number(row.cuttingPalette) : null,

            remarks: row.remarks,
            specialIndicator: row.productionMode // Mapping productionMode to specialIndicator
        }));

        // Transform Pool Details
        const formattedPools = poolDetails.map(pool => ({
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

        return this.prisma.rawMaterialPlan.create({
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
}
