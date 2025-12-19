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

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        const { date, startTime, endTime, supplierId, supplierCode, supplierName, truckType, truckRegister, rubberType, recorder } = data;

        const slot = `${startTime}-${endTime}`;
        const slotConfig = getSlotConfig(slot, new Date(date));

        // Get existing bookings for this slot
        const existingBookings = await this.prisma.booking.findMany({
            where: {
                date: new Date(date),
                slot,
            },
            orderBy: { queueNo: 'asc' },
        });

        // Check if slot is full
        if (slotConfig.limit && existingBookings.length >= slotConfig.limit) {
            throw new BadRequestException('This time slot is full');
        }

        // Calculate next queue number
        let queueNo: number;
        if (!slotConfig.limit) {
            // Unlimited slot: use 0 or sequential
            queueNo = 0;
        } else {
            const usedNumbers = existingBookings.map((b) => b.queueNo).sort((a, b) => a - b);
            queueNo = slotConfig.start;
            for (const num of usedNumbers) {
                if (num === queueNo) {
                    queueNo++;
                } else {
                    break;
                }
            }
        }

        const bookingCode = genBookingCode(new Date(date), queueNo);

        return this.prisma.booking.create({
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
                recorder,
            },
        });
    }

    async findAll(date?: string, slot?: string) {
        const where: any = {};

        if (date) {
            where.date = new Date(date);
        }

        if (slot) {
            where.slot = slot;
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

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }

        return booking;
    }

    async update(id: string, data: any) {
        await this.findOne(id); // Check if exists

        return this.prisma.booking.update({
            where: { id },
            data: {
                supplierId: data.supplierId,
                supplierCode: data.supplierCode,
                supplierName: data.supplierName,
                truckType: data.truckType,
                truckRegister: data.truckRegister,
                rubberType: data.rubberType,
                recorder: data.recorder,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Check if exists

        return this.prisma.booking.delete({
            where: { id },
        });
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
}
