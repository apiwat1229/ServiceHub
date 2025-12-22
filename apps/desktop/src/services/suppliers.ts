import api from './api';

export interface Supplier {
    id: string;
    code: string;
    name: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    taxId?: string;
    address?: string;
    provinceId?: number;
    districtId?: number;
    subdistrictId?: number;
    zipCode?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    certificateNumber?: string;
    certificateExpire?: string;
    score?: number;
    eudrQuotaUsed?: number;
    eudrQuotaCurrent?: number;
    notes?: string;
    rubberTypeCodes: string[];
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    province?: {
        id: number;
        name_th: string;
    };
    rubberTypeDetails?: {
        code: string;
        name: string;
        category: string;
    }[];
}

export const suppliersApi = {
    getAll: async (): Promise<Supplier[]> => {
        const response = await api.get('/suppliers');
        return response.data;
    },

    getById: async (id: string): Promise<Supplier> => {
        const response = await api.get(`/suppliers/${id}`);
        return response.data;
    },

    create: async (data: Partial<Supplier>): Promise<Supplier> => {
        const response = await api.post('/suppliers', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
        const response = await api.patch(`/suppliers/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/suppliers/${id}`);
    },
};
