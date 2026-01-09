import axios from 'axios';
import router from '../router';
import { storage } from '../services/storage';

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:2530';
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
        const token = storage.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

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
