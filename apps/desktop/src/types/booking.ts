export interface TimeSlot {
    label: string;
    value: string;
    startTime: string;
    endTime: string;
    limit: number | null;
}

export interface Booking {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    queueNo: number;
    bookingCode: string;

    supplierId: string;
    supplierCode: string;
    supplierName: string;

    truckType?: string;
    truckRegister?: string;

    rubberType: string;
    rubberTypeName?: string;

    recorder: string;
    createdAt: string;
    updatedAt: string;
}

export type CreateBookingDto = Omit<Booking, 'id' | 'queueNo' | 'bookingCode' | 'createdAt' | 'updatedAt' | 'rubberTypeName'>;
export type UpdateBookingDto = Partial<CreateBookingDto>;
