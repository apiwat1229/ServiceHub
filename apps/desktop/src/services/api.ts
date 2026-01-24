import axios from 'axios';
import router from '../router';
import { storage } from '../services/storage';
import { socketService } from './socket';

let memoryToken: string | null = null;

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'https://app.ytrc.co.th';
    // Remove trailing slash if present
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    // Append /api if not already present
    if (!url.endsWith('/api')) {
        url += '/api';
    }
    return url;
};

const baseURL = getBaseUrl();
console.log('[API] Initialized with Base URL:', baseURL);

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // 1. Priority: Manual Token Override (already set in config)
        if (config.headers.Authorization) return config;

        // 2. Memory Token (for non-persisted sessions)
        const token = memoryToken || storage.get('accessToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Set the authorization header globally for all future requests
 */
export const setAuthToken = (token: string | null) => {
    memoryToken = token;
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[API] Global Authorization header updated (Memory Sync)');
        // Also trigger socket connection when token is set/updated
        socketService.connect();
    } else {
        delete api.defaults.headers.common['Authorization'];
        console.log('[API] Global Authorization header removed');
        socketService.disconnect();
    }
};

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            storage.delete('accessToken');
            storage.delete('user');
            router.push('/login');
        }
        return Promise.reject(error);
    }
);

export default api;
