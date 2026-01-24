import axios from 'axios';
import router from '../router';
import { storage } from '../services/storage';

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
        // If we already have an Authorization header set via setAuthToken (api.defaults), 
        // it will be naturally sent. But if we need to explicitly inject from storage:
        const token = storage.get('accessToken');
        if (token && !config.headers.Authorization) {
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
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[API] Global Authorization header updated');
    } else {
        delete api.defaults.headers.common['Authorization'];
        console.log('[API] Global Authorization header removed');
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
