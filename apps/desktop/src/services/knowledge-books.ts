import api from '@/services/api';

export interface KnowledgeBook {
    id: string;
    title: string;
    description?: string;
    category: string;
    fileType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    coverImage?: string;
    author?: string;
    uploadedBy: string;
    views: number;
    downloads: number;
    tags: string[];
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    uploader?: {
        id: string;
        displayName?: string;
        firstName?: string;
        lastName?: string;
    };
    _count?: {
        viewHistory: number;
    };
}

export interface UploadBookData {
    file: File;
    title: string;
    description?: string;
    category: string;
    author?: string;
    tags?: string[];
    trainingDate?: string;
    attendees?: number;
}

export interface BookFilters {
    category?: string;
    search?: string;
    tags?: string[];
    uploadedBy?: string;
}

class KnowledgeBooksApi {
    async upload(data: UploadBookData): Promise<KnowledgeBook> {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        formData.append('category', data.category);
        if (data.author) formData.append('author', data.author);
        if (data.tags) formData.append('tags', JSON.stringify(data.tags));
        if (data.trainingDate) formData.append('trainingDate', data.trainingDate);
        if (data.attendees !== undefined) formData.append('attendees', data.attendees.toString());

        const response = await api.post('/knowledge-books/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async getAll(filters?: BookFilters): Promise<KnowledgeBook[]> {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.tags) params.append('tags', filters.tags.join(','));
        if (filters?.uploadedBy) params.append('uploadedBy', filters.uploadedBy);

        const response = await api.get(`/knowledge-books?${params}`);
        return response.data;
    }

    async getOne(id: string): Promise<KnowledgeBook> {
        const response = await api.get(`/knowledge-books/${id}`);
        return response.data;
    }

    async update(
        id: string,
        data: Partial<KnowledgeBook>
    ): Promise<KnowledgeBook> {
        const response = await api.patch(`/knowledge-books/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/knowledge-books/${id}`);
    }

    async trackView(id: string): Promise<void> {
        await api.post(`/knowledge-books/${id}/view`, {});
    }

    getFileUrl(id: string): string {
        return `knowledge-books/${id}/file`;
    }

    getDownloadUrl(id: string): string {
        return `knowledge-books/${id}/download`;
    }

    async getCategories(): Promise<string[]> {
        const response = await api.get('/knowledge-books/categories');
        return response.data;
    }

    async getStats(): Promise<unknown> {
        const response = await api.get('/knowledge-books/stats');
        return response.data;
    }
}

export const knowledgeBooksApi = new KnowledgeBooksApi();
