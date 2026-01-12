import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    console.log('Querying for date: 2026-01-12');

    const bookings = await prisma.booking.findMany({
        where: {
            date: {
                gte: new Date('2026-01-12T00:00:00.000Z'),
                lt: new Date('2026-01-13T00:00:00.000Z'),
            }
        }
    });

    console.log('Found bookings:', bookings.length);
    bookings.forEach(b => {
        console.log('ID:', b.id);
        console.log('Code:', b.bookingCode);
        console.log('Date:', b.date);
        console.log('Slot:', b.slot, `(Type: ${typeof b.slot})`);
        console.log('RubberType:', b.rubberType);
        console.log('Slot Length:', b.slot ? b.slot.length : 0);
        console.log('Slot CharCodes:', b.slot ? b.slot.split('').map(c => c.charCodeAt(0)) : 'null');
        console.log('-------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        const prisma = new PrismaClient();
        await prisma.$disconnect();
    });
