import { create } from 'zustand';

interface BookingState {
    selectedDate: Date;
    selectedSlot: string;
    setSelectedDate: (date: Date) => void;
    setSelectedSlot: (slot: string) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    selectedDate: new Date(),
    selectedSlot: '08:00-09:00',

    setSelectedDate: (date) => set({ selectedDate: date }),
    setSelectedSlot: (slot) => set({ selectedSlot: slot }),
}));
