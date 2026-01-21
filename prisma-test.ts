import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected!');

        console.log('Checking RawMaterialPlan count...');
        const count = await prisma.rawMaterialPlan.count();
        console.log('Count:', count);

        // Test a basic create with minimal data to see if it works
        /*
        const test = await prisma.rawMaterialPlan.create({
          data: {
            planNo: 'TEST-CONN-' + Date.now(),
            revisionNo: '0',
            refProductionNo: 'CONN-TEST',
            issuedDate: new Date(),
            creator: 'Test System',
            status: 'DRAFT'
          }
        });
        console.log('Test create success:', test.id);
        */
    } catch (e: any) {
        console.error('Prisma Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
