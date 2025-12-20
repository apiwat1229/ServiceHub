import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface BookingState {
    selectedDate: Date;
    selectedSlot: string;
    setSelectedDate: (date: Date) => void;
    setSelectedSlot: (slot: string) => void;
}

export const useBookingStore = create<BookingState>()(
    persist(
        (set) => ({
            selectedDate: new Date(),
            selectedSlot: '08:00-09:00',
            setSelectedDate: (date) => set({ selectedDate: date }),
            setSelectedSlot: (slot) => set({ selectedSlot: slot }),
        }),
        {
            name: 'booking-storage',
            storage: createJSONStorage(() => localStorage),
            // Handle Date object hydration
            onRehydrateStorage: () => (state) => {
                if (state && typeof state.selectedDate === 'string') {
                    state.selectedDate = new Date(state.selectedDate);
                }
            },
        }
    )
);
