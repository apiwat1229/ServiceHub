import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '../types/store';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            login: (user: User, token: string) => {
                // Also update localStorage for backward compatibility
                localStorage.setItem('accessToken', token);
                localStorage.setItem('user', JSON.stringify(user));

                set({
                    user,
                    accessToken: token,
                    isAuthenticated: true,
                });
            },

            logout: () => {
                // Clear localStorage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');

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
                    localStorage.setItem('user', JSON.stringify(updatedUser));

                    return { user: updatedUser };
                });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
