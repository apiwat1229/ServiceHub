import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthState, User } from '../types/store';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            login: (user: User, token: string) => {
                set({
                    user,
                    accessToken: token,
                    isAuthenticated: true,
                });
            },

            logout: () => {
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                });
            },

            updateUser: (userData: Partial<User>) => {
                set((state) => {
                    if (!state.user) return state;
                    const updatedUser = { ...state.user, ...userData };
                    return { user: updatedUser };
                });
            },

            verifySession: async () => {
                try {
                    const { authApi } = await import('../lib/api');
                    const user = await authApi.getMe();
                    set({ user, isAuthenticated: true });
                } catch (error) {
                    console.error('Session verification failed', error);
                    // If verification fails (e.g. 401), allow logout
                    set({ user: null, accessToken: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage), // Use SessionStorage for tab isolation
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
