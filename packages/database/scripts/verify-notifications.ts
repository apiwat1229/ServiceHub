
import { NotificationType, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Notification Isolation Verification ---');

    // 1. Setup: Find the specific users (inwaui1229 and apiwat.s)
    const userA = await prisma.user.findUnique({ where: { username: 'inwaui1229' } });
    const userB = await prisma.user.findUnique({ where: { username: 'apiwat.s' } });

    if (!userA || !userB) {
        console.error('❌ One or both users not found!');
        if (!userA) console.error('  - Missing: inwaui1229');
        if (!userB) console.error('  - Missing: apiwat.s');
        process.exit(1);
    }

    console.log(`User A: ${userA.username} (${userA.id})`);
    console.log(`User B: ${userB.username} (${userB.id})`);

    // 2. Simulate Broadcast: Create notification for both
    const broadcastId = `TEST-${Date.now()}`;
    const notifData = {
        title: 'Test Broadcast',
        message: `Verification Msg ${broadcastId}`,
        type: NotificationType.INFO,
        sourceApp: 'TEST_SCRIPT',
        actionType: 'VERIFY',
        metadata: { broadcastId },
    };

    console.log('\n--- Sending Broadcast ---');
    await prisma.notification.createMany({
        data: [
            { ...notifData, userId: userA.id, status: 'UNREAD' },
            { ...notifData, userId: userB.id, status: 'UNREAD' },
        ],
    });
    console.log('✅ Broadcast sent to both users.');

    // 3. Verify Initial State
    // We use filter by metadata to find the exact ones we just created
    // Note: Prisma JSON filter syntax might vary, but let's try path based or just fetch all recent
    const notifA = await prisma.notification.findFirst({
        where: {
            userId: userA.id,
            sourceApp: 'TEST_SCRIPT',
            message: notifData.message
        },
        orderBy: { createdAt: 'desc' }
    });
    const notifB = await prisma.notification.findFirst({
        where: {
            userId: userB.id,
            sourceApp: 'TEST_SCRIPT',
            message: notifData.message
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!notifA || !notifB) {
        console.error('❌ Failed to find created notifications');
        process.exit(1);
    }
    console.log(`[Initial] User A Notification Status: ${notifA.status}`);
    console.log(`[Initial] User B Notification Status: ${notifB.status}`);

    if (notifA.status !== 'UNREAD' || notifB.status !== 'UNREAD') {
        console.error('❌ Initial status check failed');
        process.exit(1);
    }

    // 4. Action: User A reads the notification
    console.log('\n--- User A reads the notification ---');
    await prisma.notification.update({
        where: { id: notifA.id },
        data: { status: 'READ' },
    });

    // 5. Verify Final State
    const notifAFinal = await prisma.notification.findUnique({ where: { id: notifA.id } });
    const notifBFinal = await prisma.notification.findUnique({ where: { id: notifB.id } });

    console.log(`[Final]   User A Notification Status: ${notifAFinal?.status}`);
    console.log(`[Final]   User B Notification Status: ${notifBFinal?.status}`);

    // 6. Assertion
    const success = notifAFinal?.status === 'READ' && notifBFinal?.status === 'UNREAD';

    if (success) {
        console.log('\n✅ VERIFICATION SUCCESSFUL: statuses are independent.');
    } else {
        console.error('\n❌ VERIFICATION FAILED: statuses are linked or incorrect.');
    }

    // Cleanup
    await prisma.notification.deleteMany({
        where: {
            id: { in: [notifA.id, notifB.id] }
        }
    });
    console.log('Cleanup done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
