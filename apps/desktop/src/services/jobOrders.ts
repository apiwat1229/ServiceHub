import api from './api';

export interface JobOrderLog {
    id?: string;
    date: string;
    shift: '1st' | '2nd';
    lotStart: string;
    lotEnd: string;
    quantity: number;
    sign?: string;
}

export interface JobOrder {
    id?: string;
    bookNo?: string;
    no?: number;
    jobOrderNo: string;
    contractNo: string;
    grade: string;
    otherGrade?: string;
    quantityBale: 35 | 36;
    palletType: string;
    orderQuantity: number;
    palletMarking: boolean;
    note?: string;
    qaName: string;
    qaDate: string;
    isClosed: boolean;
    productionName?: string;
    productionDate?: string;
    logs: JobOrderLog[];
    createdAt?: string;
    updatedAt?: string;
}

export const jobOrdersApi = {
    getAll: async () => {
        const { data } = await api.get<JobOrder[]>('/job-orders');
        return data;
    },

    getById: async (id: string) => {
        const { data } = await api.get<JobOrder>(`/job-orders/${id}`);
        return data;
    },

    create: async (jobOrder: Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
        const { data } = await api.post<JobOrder>('/job-orders', jobOrder);
        return data;
    },

    update: async (id: string, jobOrder: Partial<JobOrder>) => {
        const { data } = await api.patch<JobOrder>(`/job-orders/${id}`, jobOrder);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/job-orders/${id}`);
    },

    closeJob: async (id: string, productionInfo: { productionName: string; productionDate: string }) => {
        const { data } = await api.post<JobOrder>(`/job-orders/${id}/close`, productionInfo);
        return data;
    },
};
