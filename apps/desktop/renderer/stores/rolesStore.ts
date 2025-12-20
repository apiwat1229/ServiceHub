
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rolesApi } from '../lib/api';

interface RolesState {
    roles: any[];
    isLoading: boolean;
    fetchRoles: () => Promise<void>;
    getRole: (roleId: string) => any;
}

export const useRolesStore = create<RolesState>()(
    persist(
        (set, get) => ({
            roles: [],
            isLoading: false,
            fetchRoles: async () => {
                set({ isLoading: true });
                try {
                    const roles = await rolesApi.getAll();
                    set({ roles, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch roles:', error);
                    set({ isLoading: false });
                }
            },
            getRole: (roleId: string) => {
                return get().roles.find((r) => r.id === roleId);
            },
        }),
        {
            name: 'roles-storage',
        }
    )
);
