
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Fix axios adapter for node environment issues if any (usually fine in recent versions)

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();
const API_URL = 'http://localhost:2530/api';

const bcrypt = require('bcrypt'); // Use require required for script if import fails or just consistent to commonjs script style

async function main() {
    console.log('--- 🛡️ Verifying Full System Functionality 🛡️ ---');

    // 1. Create Temporary Admin
    const tempEmail = `temp_admin_${Date.now()}@test.com`;
    const tempPassword = 'password123';
    console.log(`\n1. Creating Temp Admin: ${tempEmail}`);

    try {
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create user directly in DB
        const user = await prisma.user.create({
            data: {
                email: tempEmail,
                password: hashedPassword,
                username: `temp_${Date.now()}`,
                firstName: 'Temp',
                lastName: 'Admin',
                role: 'admin', // Make admin directly
                status: 'ACTIVE'
            }
        });
        console.log(`   ✅ User Created via Prisma: ${user.id}`);

        // 2. Login to get Token
        console.log('\n2. Logging in...');
        let token = '';
        let userId = user.id;

        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: tempEmail,
                password: tempPassword
            });
            token = loginRes.data.accessToken;
            // userId = loginRes.data.user.id; // Already have it
            console.log('   ✅ Login Successful. Token obtained.');
        } catch (e: any) {
            console.error('   ❌ Login Failed:', e.response?.data || e.message);
            throw new Error('Login failed');
        }

        // 3. Verify Server-Side Session (/auth/me)
        console.log('\n3. Verifying Session (/auth/me)...');
        try {
            const meRes = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (meRes.data.email === tempEmail || meRes.data.id === userId) {
                console.log(`   ✅ /auth/me Verified! Returned User: ${meRes.data.email}`);
            } else {
                console.error(`   ❌ /auth/me returned mismatch:`, meRes.data);
            }
        } catch (e: any) {
            console.error('   ❌ /auth/me Failed:', e.response?.data || e.message);
        }

        // 4. Send Broadcast
        console.log('\n4. Sending Broadcast...');
        const broadcastTitle = `Test Broadcast ${Date.now()}`;
        let broadcastId = '';
        try {
            // Need to be ADMIN to broadcast usually.
            // Let's upgrade our user to ADMIN using Prisma
            await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } });
            console.log('   ℹ️ Upgraded user to ADMIN for testing.');

            const broadcastRes = await axios.post(`${API_URL}/notifications/broadcast`, {
                title: broadcastTitle,
                message: 'This is a test broadcast for deleting.',
                type: 'INFO',
                recipientUsers: [userId] // Send to self
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`   ✅ Broadcast Sent. Result:`, broadcastRes.data);
        } catch (e: any) {
            console.error('   ❌ Broadcast Failed:', e.response?.data || e.message);
        }

        // 5. Verify Receipt (Check Notification History via API)
        console.log('\n5. Verifying History...');
        try {
            const historyRes = await axios.get(`${API_URL}/notifications/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const found = historyRes.data.find((b: any) => b.title === broadcastTitle);
            if (found) {
                console.log(`   ✅ Found in History: ${found.title} (ID: ${found.id})`);
                broadcastId = found.id;
            } else {
                console.error('   ❌ Broadcast NOT found in History.');
            }
        } catch (e: any) {
            console.error('   ❌ Get History Failed:', e.response?.data || e.message);
        }

        // 6. Delete Broadcast
        if (broadcastId) {
            console.log(`\n6. Deleting Broadcast (ID: ${broadcastId})...`);
            try {
                const deleteRes = await axios.delete(`${API_URL}/notifications/broadcast/${broadcastId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`   ✅ Delete Response:`, deleteRes.data);

                // 7. Verify Deletion
                console.log('\n7. Verifying Deletion (Should be gone)...');
                // Check History again
                const historyRes2 = await axios.get(`${API_URL}/notifications/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const found2 = historyRes2.data.find((b: any) => b.title === broadcastTitle);
                if (!found2) {
                    console.log('   ✅ Validated: Broadcast is GONE from History.');
                } else {
                    console.error('   ❌ Broadcast STILL EXISTS in History!');
                }

                // Check Prisma for underlying notifications
                const remaining = await prisma.notification.count({
                    where: { title: broadcastTitle }
                });
                if (remaining === 0) {
                    console.log('   ✅ Validated: Underlying notifications removed from DB.');
                } else {
                    console.log(`   ❌ Underlying notifications still exist: ${remaining}`);
                }

            } catch (e: any) {
                console.error('   ❌ Delete Failed:', e.response?.data || e.message);
            }
        }

    } catch (err: any) {
        console.error('Unexpected Error:', err);
    } finally {
        // Cleanup
        console.log('\n--- Cleanup ---');
        await prisma.user.deleteMany({ where: { email: { startsWith: 'temp_admin_' } } });
        console.log('Temp users deleted.');
        await prisma.$disconnect();
    }
}

main();
