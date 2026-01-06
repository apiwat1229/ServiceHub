import api from './api';

export interface ITTicket {
    id: string;
    ticketNo: string;
    title: string;
    description?: string;
    category: string;
    priority: string;
    status: string;
    requesterId: string;
    requester?: {
        id: string;
        displayName: string;
        email?: string;
        avatar?: string;
        firstName?: string;
        username?: string;
    };
    assigneeId?: string;
    assignee?: {
        id: string;
        displayName: string;
        email?: string;
        avatar?: string;
        firstName?: string;
        username?: string;
    };
    location?: string;
    createdAt: string;
    updatedAt: string;
    comments?: TicketComment[];
}

export interface TicketComment {
    id: string;
    content: string;
    ticketId: string;
    userId: string;
    user: {
        id: string;
        displayName: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
    };
    createdAt: string;
}

export interface CreateITTicketDto {
    title: string;
    description?: string;
    category: string;
    priority?: string;
    location?: string;
}

export interface UpdateITTicketDto {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    location?: string;
    assigneeId?: string;
}

export const itTicketsApi = {
    getAll: async (): Promise<ITTicket[]> => {
        const response = await api.get('/it-tickets');
        return response.data;
    },

    getById: async (id: string): Promise<ITTicket> => {
        const response = await api.get(`/it-tickets/${id}`);
        return response.data;
    },

    create: async (data: CreateITTicketDto): Promise<ITTicket> => {
        const response = await api.post('/it-tickets', data);
        return response.data;
    },

    addComment: async (id: string, content: string): Promise<TicketComment> => {
        const response = await api.post(`/it-tickets/${id}/comments`, { content });
        return response.data;
    },

    update: async (id: string, data: UpdateITTicketDto): Promise<ITTicket> => {
        const response = await api.patch(`/it-tickets/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/it-tickets/${id}`);
    },
};
