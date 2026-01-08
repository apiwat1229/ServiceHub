import api from './api';

export interface RubberType {
    id: string;
    code: string;
    name: string;
    category?: string;
    description?: string;
    is_active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const rubberTypesApi = {
    getAll: async () => {
        const response = await api.get<RubberType[]>('/rubber-types');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<RubberType>(`/rubber-types/${id}`);
        return response.data;
    },

    create: async (data: Partial<RubberType>) => {
        const response = await api.post<RubberType>('/rubber-types', data);
        return response.data;
    },

    update: async (id: string, data: Partial<RubberType>) => {
        const response = await api.patch<RubberType>(`/rubber-types/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/rubber-types/${id}`);
        return response.data;
    }
};
