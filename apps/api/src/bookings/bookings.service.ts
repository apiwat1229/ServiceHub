import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SLOT_QUEUE_CONFIG: Record<string, { start: number; limit: number | null }> = {
    '08:00-09:00': { start: 1, limit: 4 },
    '09:00-10:00': { start: 5, limit: 4 },
    '10:00-11:00': { start: 9, limit: 4 },
    '11:00-12:00': { start: 13, limit: 4 },
    '13:00-14:00': { start: 17, limit: null }, // Unlimited
};

function getSlotConfig(slot: string, date: Date) {
    const dayOfWeek = new Date(date).getDay();
    // Saturday special rule: 10:00-11:00 becomes unlimited
    if (dayOfWeek === 6 && slot === '10:00-11:00') {
        return { start: 9, limit: null };
    }
    return SLOT_QUEUE_CONFIG[slot] ?? { start: 1, limit: null };
}

function genBookingCode(date: Date, queueNo: number): string {
    const d = new Date(date);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const q = String(queueNo).padStart(2, '0');
    return `${yy}${mm}${dd}${q}`;
}

import { ApprovalsService } from '../approvals/approvals.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private approvalsService: ApprovalsService
    ) { }

    async create(data: any) {
        const { date, startTime, endTime, supplierId, supplierCode, supplierName, truckType, truckRegister, rubberType, estimatedWeight, recorder } = data;

        const slot = `${startTime}-${endTime}`;
        const slotConfig = getSlotConfig(slot, new Date(date));

        // Generate the date prefix (YYMMDD) using Local time to match genBookingCode
        const d = new Date(date);
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const codePrefix = `${yy}${mm}${dd}`;

        console.log('--- DEBUG BOOKING CREATION ---');
        console.log('Incoming Data:', JSON.stringify(data, null, 2));
        console.log('Target Slot:', slot);

        // Get ACTIVE bookings for this date to calculate queue number and check collisions.
        // We now rename cancelled bookings, so we don't need to check them for collisions anymore.
        const dayBookings = await this.prisma.booking.findMany({
            where: {
                date: new Date(date),
                deletedAt: null,
            },
        });

        // Filter for active bookings in the specific slot for the capacity check
        const isUSS = rubberType && (rubberType.toUpperCase().includes('USS'));
        const prefix = isUSS ? 'U' : 'C';

        // Filter bookings by type (USS vs CL) for queue calculation
        // Same slot capacity applies independently if they are different warehouses (as requested)
        const relevantBookings = dayBookings.filter(b => {
            const bIsUSS = b.rubberType && (b.rubberType.toUpperCase().includes('USS'));
            return bIsUSS === isUSS;
        });

        // Filter for active bookings in the specific slot and type for capacity check
        const activeBookingsInSlot = relevantBookings.filter(b => b.slot === slot && !b.deletedAt);

        // Check if slot is full (only counting active ones of the same type)
        if (slotConfig.limit && activeBookingsInSlot.length >= slotConfig.limit) {
            throw new BadRequestException(`This time slot is full for ${isUSS ? 'USS' : 'Cuplump'}`);
        }

        // Check for duplicate booking (Same Supplier, Same Truck, Same Slot - Active Only)
        // Truck check should be GLOBAL (same truck cannot be in two places)
        if (truckRegister) {
            const duplicateBooking = dayBookings.find(b =>
                !b.deletedAt &&
                b.checkinAt === null && // Only check against non-completed? Or just active? Let's say all active.
                b.supplierId === supplierId &&
                b.slot === slot &&
                b.truckRegister === truckRegister
            );
            if (duplicateBooking) {
                throw new BadRequestException(`This truck (${truckRegister}) already has a booking for this slot.`);
            }
        }

        // Calculate next queue number based on RELEVANT bookings (including deleted) to maintain sequence per type
        // For USS, we ignore slots and calculate sequentially for the whole day
        const existingBookingsForQueue = isUSS
            ? relevantBookings // All USS bookings for the day
            : relevantBookings.filter(b => b.slot === slot); // CL bookings for specific slot

        const usedNumbers = existingBookingsForQueue.map((b) => b.queueNo).sort((a, b) => a - b);
        let queueNo = slotConfig.start; // Default start

        // If USS, start from 1 (or config start) and increment irrespective of slot gaps, 
        // but actually the gap logic below handles it.

        for (const num of usedNumbers) {
            if (num === queueNo) {
                queueNo++;
            } else if (num > queueNo) {
                break;
            }
        }

        // Generate initial code
        let bookingCode = prefix + genBookingCode(new Date(date), queueNo);

        // EXTRA ROBUST: Ensure code is unique across ALL slots and even soft-deleted records for this day
        const allCodesToday = new Set(dayBookings.map(b => b.bookingCode));
        while (allCodesToday.has(bookingCode)) {
            console.warn(`[BookingsService] Code collision in memory for ${bookingCode}. Incrementing queueNo...`);
            queueNo++;
            bookingCode = prefix + genBookingCode(new Date(date), queueNo);
        }

        // ONE LAST DB CHECK: Just in case a race condition happened between findMany and now
        const finalDuplicate = await this.prisma.booking.findUnique({
            where: { bookingCode },
        });

        if (finalDuplicate) {
            // If the duplicate is a soft-deleted record, we rename it on-the-fly to free up the code
            if (finalDuplicate.deletedAt) {
                console.warn(`[BookingsService] Stale deleted record found for ${bookingCode}. Renaming to free up code...`);
                await this.prisma.booking.update({
                    where: { id: finalDuplicate.id },
                    data: { bookingCode: `STALE-${finalDuplicate.bookingCode}-${Date.now()}` }
                });
                // Now we can proceed with the original bookingCode
            } else {
                console.warn(`[BookingsService] Last-second DB collision detected with active record for ${bookingCode}. Finding next available...`);

                // Find max queueNo for the day AND type to jump ahead
                // We need to filter by prefix in search or just logic
                // Since 'startsWith' works with prefix, we can use it.
                const searchPrefix = prefix + codePrefix; // e.g., U240101 or 240101

                const maxBooking = await this.prisma.booking.findFirst({
                    where: { bookingCode: { startsWith: searchPrefix }, deletedAt: null },
                    orderBy: { queueNo: 'desc' },
                    select: { queueNo: true }
                });
                queueNo = (maxBooking?.queueNo || queueNo) + 1;
                bookingCode = prefix + genBookingCode(new Date(date), queueNo);
            }
        }

        try {
            const createdBooking = await this.prisma.booking.create({
                data: {
                    queueNo,
                    bookingCode,
                    date: new Date(date),
                    startTime,
                    endTime,
                    slot,
                    supplierId,
                    supplierCode,
                    supplierName,
                    truckType,
                    truckRegister,
                    rubberType,
                    estimatedWeight: estimatedWeight ? parseFloat(estimatedWeight) : null,
                    recorder,
                },
            });

            // Trigger Notification
            await this.triggerNotification('Booking', 'CREATE', {
                title: 'New Booking Created',
                message: `Booking ${bookingCode} created for ${supplierName} at ${slot}`,
                actionUrl: `/bookings/${bookingCode}`,
            });

            return createdBooking;
        } catch (error: any) {
            console.error('Error creating booking:', error);
            // Include actual error message for debugging
            throw new BadRequestException(`Failed to create booking: ${error.message || 'Unknown error'}`);
        }
    }

    async checkIn(id: string, data?: any, user?: any) {
        const booking = await this.findOne(id);

        if (booking.checkinAt) {
            throw new BadRequestException('This booking has already been checked in.');
        }

        const updated = await this.prisma.booking.update({
            where: { id },
            data: {
                checkinAt: new Date(),
                checkedInBy: user?.displayName || user?.username || 'System',
                truckType: data?.truckType,
                truckRegister: data?.truckRegister,
                note: data?.note,
            },
        });

        // Trigger Notification
        await this.triggerNotification('Booking', 'UPDATE', {
            title: 'Truck Checked In',
            message: `Truck ${booking.truckRegister} (${booking.bookingCode}) checked in.`,
            actionUrl: `/bookings/${booking.bookingCode}`,
        });

        return updated;
    }

    async startDrain(id: string, user?: any) {
        return this.prisma.booking.update({
            where: { id },
            data: {
                startDrainAt: new Date(),
                startDrainBy: user?.displayName || user?.username || 'System',
            },
        });
    }

    async stopDrain(id: string, data?: any, user?: any) {
        return this.prisma.booking.update({
            where: { id },
            data: {
                stopDrainAt: new Date(),
                stopDrainBy: user?.displayName || user?.username || 'System',
                drainNote: data?.note,
            },
        });
    }

    async saveWeightIn(id: string, data: any, user?: any) {
        return this.prisma.booking.update({
            where: { id },
            data: {
                rubberSource: data.rubberSource,
                rubberType: data.rubberType,
                weightIn: parseFloat(data.weightIn),
                weightInBy: user?.displayName || user?.username || 'System',
                trailerRubberSource: data.trailerRubberSource,
                trailerRubberType: data.trailerRubberType,
                trailerWeightIn: data.trailerWeightIn ? parseFloat(data.trailerWeightIn) : null,
            },
        });
    }

    async saveWeightOut(id: string, data: any, user?: any) {
        return this.prisma.booking.update({
            where: { id },
            data: {
                weightOut: parseFloat(data.weightOut),
                weightOutBy: user?.displayName || user?.username || 'System',
            },
        });
    }

    async findAll(date?: string, slot?: string, code?: string) {
        const where: any = {};

        if (code) {
            where.OR = [
                { bookingCode: code },
                { bookingCode: { startsWith: `CANCELLED-${code}-` } }
            ];
        } else {
            if (date) where.date = new Date(date);
            if (slot) where.slot = slot;
            // Default: Exclude soft deleted items unless searching by code
            where.deletedAt = null;
        }

        return this.prisma.booking.findMany({
            where,
            orderBy: { queueNo: 'asc' },
        });
    }

    async findOne(id: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
        });

        // Allow finding deleted bookings? Yes, findUnique returns them.
        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }

        return booking;
    }

    async update(id: string, data: any, user?: any) {
        const booking = await this.findOne(id); // Check if exists

        // Permission Check logic
        const permissions: string[] = user?.roleRecord?.permissions || user?.permissions || [];
        const canApprove = permissions.includes('bookings:approve') || permissions.includes('bookings:all');
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin' || user?.role === 'SUPER_ADMIN' || canApprove;

        if (!isAdmin && user) {
            console.log(`[BookingsService] User ${user.displayName} is not admin/approver. Creating approval request for UPDATE.`);
            const request = await this.approvalsService.createRequest(user.id, {
                requestType: 'แก้ไขการจอง (Booking Update)',
                entityType: 'Booking',
                entityId: id,
                actionType: 'UPDATE',
                currentData: booking,
                proposedData: data,
                reason: 'แก้ไขรายละเอียดการจอง',
                sourceApp: 'Booking',
            });

            // Notify Approvers
            await this.triggerNotification('Booking', 'APPROVAL_REQUEST', {
                title: 'Approval Requested: Booking Update',
                message: `User ${user.displayName} requested to update Booking ${booking.bookingCode}.`,
                actionUrl: `/admin/approvals/${request.id}`,
            });

            return {
                status: 'PENDING_APPROVAL',
                message: 'คำขอแก้ไขถูกส่งไปยังผู้อนุมัติแล้ว',
                requestId: request.id
            };
        }

        const safeFloat = (val: any) => safeParseFloat(val);

        const updateData: any = {
            supplierId: data.supplierId,
            supplierCode: data.supplierCode,
            supplierName: data.supplierName,
            truckType: data.truckType,
            truckRegister: data.truckRegister,
            rubberType: data.rubberType,
            estimatedWeight: safeFloat(data.estimatedWeight),
            recorder: data.recorder,
            lotNo: data.lotNo,
            trailerLotNo: data.trailerLotNo,
            moisture: safeFloat(data.moisture),
            drcEst: safeFloat(data.drcEst),
            drcRequested: safeFloat(data.drcRequested),
            drcActual: safeFloat(data.drcActual),
            trailerMoisture: safeFloat(data.trailerMoisture),
            trailerDrcEst: safeFloat(data.trailerDrcEst),
            trailerDrcRequested: safeFloat(data.trailerDrcRequested),
            trailerDrcActual: safeFloat(data.trailerDrcActual),
        };

        if (data.status === 'APPROVED') {
            updateData.status = 'APPROVED';
            updateData.approvedBy = user?.displayName || user?.username || 'System';
            updateData.approvedAt = new Date();
        }

        try {
            console.log(`[BookingsService] Updating booking ${id} with:`, JSON.stringify(updateData, null, 2));
            const result = await this.prisma.booking.update({
                where: { id },
                data: updateData,
            });

            // Trigger Notification
            await this.triggerNotification('Booking', 'UPDATE', {
                title: 'Booking Updated',
                message: `Booking ${result.bookingCode} (${result.supplierName}) at ${result.slot} has been updated.`,
                actionUrl: `/bookings?code=${result.bookingCode}`,
            });

            return result;
        } catch (error: any) {
            console.error('[BookingsService] Update booking error:', error);
            throw new BadRequestException(`Failed to update booking: ${error.message || 'Unknown error'}`);
        }
    }

    async remove(id: string, user?: any) {
        const booking = await this.findOne(id);

        const permissions: string[] = user?.roleRecord?.permissions || user?.permissions || [];
        const canApprove = permissions.includes('bookings:approve') || permissions.includes('bookings:all');
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin' || user?.role === 'SUPER_ADMIN' || canApprove;

        console.log(`[BookingsService] Delete Request by ${user?.username} (${user?.id})`);
        console.log(`[BookingsService] Roles: ${user?.role}, Admin/Approve: ${isAdmin}`);

        /*
        if (!isAdmin && user) {
            console.log(`[BookingsService] User ${user.displayName} is not admin/approver. Creating approval request for DELETE.`);
            try {
                const request = await this.approvalsService.createRequest(user.id, {
                    requestType: 'ยกเลิกการจอง (Booking Cancellation)',
                    entityType: 'Booking',
                    entityId: id,
                    actionType: 'DELETE',
                    currentData: booking,
                    proposedData: {},
                    reason: 'ต้องการยกเลิกการจอง',
                    sourceApp: 'Booking',
                });
    
                // Notify Approvers
                await this.triggerNotification('Booking', 'APPROVAL_REQUEST', {
                    title: 'Approval Requested: Booking Cancellation',
                    message: `User ${user.displayName} requested to cancel Booking ${booking.bookingCode}.`,
                    actionUrl: `/admin/approvals/${request.id}`,
                });
    
                return {
                    status: 'PENDING_APPROVAL',
                    message: 'คำขอยกเลิกถูกส่งไปยังผู้อนุมัติแล้ว',
                    requestId: request.id
                };
            } catch (error) {
                console.error('[BookingsService] Error creating approval request:', error);
                throw error;
            }
        }
        */

        // Switch to Soft Delete to preserve data for historical view
        try {
            const result = await this.prisma.booking.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    deletedBy: user?.displayName || user?.username || 'System',
                    status: 'CANCELLED',
                    bookingCode: `CANCELLED-${booking.bookingCode}-${Date.now()}`, // Free up the original code
                },
            });

            await this.triggerNotification('Booking', 'DELETE', {
                title: 'Booking Cancelled',
                message: `Booking ${booking.bookingCode} (${booking.supplierName}) at ${booking.slot} has been cancelled.`,
                actionUrl: `/bookings/${booking.bookingCode}`,
            });

            return result;
        } catch (error) {
            console.error('[BookingsService] Error deleting booking:', error);
            throw error;
        }
    }

    private async triggerNotification(sourceApp: string, actionType: string, payload: { title: string; message: string; actionUrl?: string }) {
        try {
            // 1. Get Settings for this event
            const settings = await this.prisma.notificationSetting.findUnique({
                where: {
                    sourceApp_actionType: { sourceApp, actionType }
                }
            });

            if (!settings || !settings.isActive) {
                console.log(`Notification skipped for ${sourceApp}:${actionType} (Disabled or Not Configured)`);
                return;
            }

            const recipientRoles = (settings.recipientRoles as unknown as string[]) || [];
            const recipientGroups = (settings.recipientGroups as unknown as string[]) || [];

            let targetUserIds: string[] = [];

            // 2. Find Users with these Roles
            if (recipientRoles.length > 0) {
                const users = await this.prisma.user.findMany({
                    where: {
                        OR: [
                            { role: { in: recipientRoles } },
                            { roleRecord: { name: { in: recipientRoles } } },
                            // Also check by ID if role IDs are stored
                            { roleRecord: { id: { in: recipientRoles } } }
                        ]
                    },
                    select: { id: true }
                });
                targetUserIds.push(...users.map(u => u.id));
            }

            // 3. Find Users in these Groups
            if (recipientGroups.length > 0) {
                const groups = await this.prisma.notificationGroup.findMany({
                    where: { id: { in: recipientGroups } },
                    include: { members: { select: { id: true } } }
                });
                const groupUserIds = groups.flatMap(g => g.members.map(m => m.id));
                targetUserIds.push(...groupUserIds);
            }

            // Deduplicate
            targetUserIds = [...new Set(targetUserIds)];

            // 4. Send Notification to each user
            for (const userId of targetUserIds) {
                await this.notificationsService.create({
                    userId: userId,
                    title: payload.title,
                    message: payload.message,
                    type: actionType === 'APPROVAL_REQUEST' ? 'REQUEST' : 'INFO',
                    sourceApp,
                    actionType,
                    actionUrl: payload.actionUrl
                });
            }

            console.log(`Notification sent for ${sourceApp}:${actionType} to ${targetUserIds.length} users.`);

        } catch (error) {
            console.error('Error triggering notification:', error);
        }
    }

    async getStats(date: string) {
        const bookings = await this.findAll(date);

        const total = bookings.length;
        const checkedIn = bookings.filter((b) => b.checkinAt).length;
        const pending = total - checkedIn;

        const slotStats: Record<string, any> = {};
        Object.keys(SLOT_QUEUE_CONFIG).forEach((slot) => {
            const slotBookings = bookings.filter((b) => b.slot === slot);
            slotStats[slot] = {
                count: slotBookings.length,
                checkedIn: slotBookings.filter((b) => b.checkinAt).length,
                bookings: slotBookings,
            };
        });

        return {
            total,
            checkedIn,
            pending,
            slots: slotStats,
        };
    }
    // Samples
    async getSamples(bookingId: string) {
        return this.prisma.bookingLabSample.findMany({
            where: { bookingId },
            orderBy: { sampleNo: 'asc' },
        });
    }

    async saveSample(bookingId: string, data: any) {
        // If ID provided, update. Else create.
        if (data.id) {
            return this.prisma.bookingLabSample.update({
                where: { id: data.id },
                data: {
                    beforePress: data.beforePress ? parseFloat(data.beforePress) : null,
                    basketWeight: data.basketWeight ? parseFloat(data.basketWeight) : null,
                    cuplumpWeight: data.cuplumpWeight ? parseFloat(data.cuplumpWeight) : null,
                    afterPress: data.afterPress ? parseFloat(data.afterPress) : null,
                    percentCp: data.percentCp ? parseFloat(data.percentCp) : null,
                    beforeBaking1: data.beforeBaking1 ? parseFloat(data.beforeBaking1) : null,
                    beforeBaking2: data.beforeBaking2 ? parseFloat(data.beforeBaking2) : null,
                    beforeBaking3: data.beforeBaking3 ? parseFloat(data.beforeBaking3) : null,
                    // If sampleNo needs update? Usually locked.
                }
            });
        }
        console.log(`[BookingsService] saveSample input for booking ${bookingId}:`, JSON.stringify(data, null, 2));

        try {
            // Ensure isTrailer is boolean
            const isTrailer = data.isTrailer === true || data.isTrailer === 'true';
            console.log(`[BookingsService] Interpreted isTrailer: ${isTrailer} (raw: ${data.isTrailer})`);

            // Auto-assign sampleNo if not provided
            let sampleNo = data.sampleNo;
            if (!sampleNo) {
                const last = await this.prisma.bookingLabSample.findFirst({
                    where: { bookingId, isTrailer },
                    orderBy: { sampleNo: 'desc' }
                });
                sampleNo = (last?.sampleNo || 0) + 1;
            }
            console.log(`[BookingsService] Assigned sampleNo: ${sampleNo}`);

            const result = await this.prisma.bookingLabSample.create({
                data: {
                    bookingId,
                    sampleNo,
                    isTrailer,
                    beforePress: safeParseFloat(data.beforePress),
                    basketWeight: safeParseFloat(data.basketWeight),
                    cuplumpWeight: safeParseFloat(data.cuplumpWeight),
                    afterPress: safeParseFloat(data.afterPress),
                    percentCp: safeParseFloat(data.percentCp),
                    beforeBaking1: safeParseFloat(data.beforeBaking1),
                    beforeBaking2: safeParseFloat(data.beforeBaking2),
                    beforeBaking3: safeParseFloat(data.beforeBaking3),
                }
            });
            console.log(`[BookingsService] Sample saved successfully: ${result.id}`);
            return result;
        } catch (error: any) {
            console.error('[BookingsService] Failed to save sample:', error);
            throw new BadRequestException(`Failed to save sample: ${error.message}`);
        }
    }

    async deleteSample(bookingId: string, sampleId: string) {
        // Verify ownership?
        return this.prisma.bookingLabSample.delete({
            where: { id: sampleId }
        });
    }
}

const safeParseFloat = (val: any): number | null | undefined => {
    if (val === undefined) return undefined;
    if (val === null || val === '') return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
};
