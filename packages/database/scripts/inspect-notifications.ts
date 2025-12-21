
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- Notification Inspector ---');

    // 1. Find our users
    const users = await prisma.user.findMany({
        where: { username: { in: ['inwaui1229', 'apiwat.s'] } }
    });

    for (const user of users) {
        console.log(`\nUser: ${user.username} (${user.id}) [Role: ${user.role}]`);

        // 2. Get last 5 notifications
        const notifs = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        if (notifs.length === 0) {
            console.log('  - No notifications.');
            continue;
        }

        notifs.forEach(n => {
            console.log(`  - [${n.status}] ${n.title} (Source: ${n.sourceApp})`);
            console.log(`    Msg: ${n.message}`);
            // Check metadata if it contains targeting info? No, schema doesn't store targeting info in metadata usually.
        });
    }

    console.log('\n--- Checking Groups ---');
    const groups = await prisma.notificationGroup.findMany({
        include: { members: { select: { username: true } } }
    });
    groups.forEach(g => {
        const members = g.members.map(m => m.username).join(', ');
        console.log(`Group: ${g.name} (Members: ${members})`);
    });
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
