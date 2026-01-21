import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const plan = await prisma.rawMaterialPlan.upsert({
        where: { planNo: '2024#PL03' },
        update: {},
        create: {
            planNo: '2024#PL03',
            revisionNo: '01',
            refProductionNo: '2024#P03',
            issuedDate: new Date('2024-01-17'),
            creator: 'Admin System',
            status: 'APPROVED',
        },
    });
    console.log('Created/Updated plan:', plan.planNo);

    const plan2 = await prisma.rawMaterialPlan.upsert({
        where: { planNo: '2024#PL02' },
        update: {},
        create: {
            planNo: '2024#PL02',
            revisionNo: '00',
            refProductionNo: '2024#P02',
            issuedDate: new Date('2024-01-10'),
            creator: 'Admin System',
            status: 'CLOSED',
        },
    });
    console.log('Created/Updated plan:', plan2.planNo);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
