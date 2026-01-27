import { defineStore } from 'pinia';
import { getAvatarUrl } from '../lib/utils';
import api, { setAuthToken } from '../services/api';
import { storage } from '../services/storage';
import { useThemeStore } from './theme';

export const useAuthStore = defineStore('auth', {
    state: () => {
        const user = storage.get('user') || null;
        const accessToken = storage.get('accessToken') || null;

        // Initialize axios header if we have a persisted token
        if (accessToken) {
            setAuthToken(accessToken);
        }

        return {
            user,
            accessToken,
            tempToken: null as string | null,
        };
    },
    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        userAvatarUrl: (state) => {
            return getAvatarUrl(state.user?.avatar);
        },
        // ... (rest of the getters remain same)
        userPermissions: (state): string[] => {
            return state.user?.permissions || [];
        },
        hasPermission: (state) => (permission: string): boolean => {
            const permissions = state.user?.permissions || [];
            return permissions.includes(permission);
        },
        hasAnyPermission: (state) => (permissions: string[]): boolean => {
            const userPermissions = state.user?.permissions || [];
            return permissions.some(p => userPermissions.includes(p));
        },
        hasAllPermissions: (state) => (permissions: string[]): boolean => {
            const userPermissions = state.user?.permissions || [];
            return permissions.every(p => userPermissions.includes(p));
        },
    },
    actions: {
        setTempToken(token: string) {
            this.tempToken = token;
        },
        clearTempToken() {
            this.tempToken = null;
        },
        async login(credentials: any, remember: boolean) {
            try {
                const response = await api.post('/auth/login', {
                    email: credentials.email,
                    password: credentials.password
                });

                this.accessToken = response.data.accessToken;
                this.user = response.data.user;

                // Set token globally in axios
                setAuthToken(this.accessToken);

                // Always persist token and user for session persistence across reloads
                storage.set('accessToken', this.accessToken);
                storage.set('user', this.user);

                // Load preferences
                const themeStore = useThemeStore();
                themeStore.loadFromUser(this.user);

                console.log(`[Auth] Login success. Remember me (form): ${remember}`);
            } catch (error: any) {
                if (error.response && error.response.data && error.response.data.code === 'MUST_CHANGE_PASSWORD') {
                    this.tempToken = error.response.data.tempToken;
                    throw error;
                }
                console.error('Login failed:', error);
                throw error;
            }
        },
        async fetchUser() {
            try {
                const response = await api.get('/auth/me');
                this.user = response.data;

                const themeStore = useThemeStore();
                themeStore.loadFromUser(this.user);

                if (storage.get('accessToken')) {
                    storage.set('user', this.user);
                }
            } catch (error) {
                console.error('Fetch user failed:', error);
            }
        },
        logout() {
            this.user = null;
            this.accessToken = null;
            setAuthToken(null);
            storage.delete('accessToken');
            storage.delete('user');
        }
    }
});
