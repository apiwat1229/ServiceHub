import type { CreateITAssetDto, UpdateITAssetDto } from '@my-app/types';
import api from './api';

export interface ITAsset {
    id: string;
    code: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    location?: string;
    description?: string;
    image?: string;
    price?: number;
    receivedDate?: string;
    receiver?: string;
    serialNumber?: string;
    barcode?: string;
    createdAt: string;
    updatedAt: string;
}

export const itAssetsApi = {
    getAll: async (): Promise<ITAsset[]> => {
        const response = await api.get('/it-assets');
        return response.data;
    },

    getById: async (id: string): Promise<ITAsset> => {
        const response = await api.get(`/it-assets/${id}`);
        return response.data;
    },

    create: async (data: CreateITAssetDto): Promise<ITAsset> => {
        const response = await api.post('/it-assets', data);
        return response.data;
    },

    update: async (id: string, data: UpdateITAssetDto): Promise<ITAsset> => {
        const response = await api.patch(`/it-assets/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/it-assets/${id}`);
    },

    uploadImage: async (id: string, file: File): Promise<ITAsset> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/it-assets/${id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
