import api from './api';

export interface RawMaterialPlanRow {
    id?: string;
    date: string;
    dayOfWeek: string;
    shift: '1st' | '2nd';
    grade?: string;
    ratioUSS?: number;
    ratioCL?: number;
    ratioBK?: number;
    productTarget?: number;
    clConsumption?: number;
    ratioBorC?: number;
    plan1Pool?: string;
    plan1Note?: string;
    plan2Pool?: string;
    plan2Note?: string;
    plan3Pool?: string;
    plan3Note?: string;
    cuttingPercent?: number;
    cuttingPalette?: number;
    remarks?: string;
    specialIndicator?: string;
    is24hr?: boolean;
}

export interface RawMaterialPlanPoolDetail {
    poolNo: string;
    grossWeight?: number;
    netWeight?: number;
    drc?: number;
    moisture?: number;
    p0?: number;
    pri?: number;
    clearDate?: string;
    grade?: string;
    remark?: string;
}

export interface RawMaterialPlan {
    id?: string;
    planNo: string;
    revisionNo: string;
    refProductionNo: string;
    issuedDate: string;
    rows: RawMaterialPlanRow[];
    poolDetails: RawMaterialPlanPoolDetail[];
    creator: string;
    checker?: string;
    status: 'DRAFT' | 'APPROVED' | 'CLOSED';
}

export const rawMaterialPlansApi = {
    getAll: async () => {
        const { data } = await api.get<RawMaterialPlan[]>('/raw-material-plans');
        return data;
    },
    getById: async (id: string) => {
        const { data } = await api.get<RawMaterialPlan>(`/raw-material-plans/${id}`);
        return data;
    },
    create: async (rawMaterialPlan: Omit<RawMaterialPlan, 'id'>) => {
        const { data } = await api.post<RawMaterialPlan>('/raw-material-plans', rawMaterialPlan);
        return data;
    },
    update: async (id: string, rawMaterialPlan: Partial<RawMaterialPlan>) => {
        const { data } = await api.patch<RawMaterialPlan>(`/raw-material-plans/${id}`, rawMaterialPlan);
        return data;
    },
    delete: async (id: string) => {
        await api.delete(`/raw-material-plans/${id}`);
    },
};
