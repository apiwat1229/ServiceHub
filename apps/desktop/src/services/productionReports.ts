import api from './api';

export interface ProductionReportRow {
    id?: string;
    startTime: string;
    palletType: string;
    lotNo: string;
    weight1?: number;
    weight2?: number;
    weight3?: number;
    weight4?: number;
    weight5?: number;
    sampleCount?: number;
}

export interface ProductionReport {
    id?: string;
    dryerName: string;
    bookNo: string;
    pageNo: string;
    productionDate: string | Date;
    shift: string;
    grade: string;
    ratioCL?: number;
    ratioUSS?: number;
    ratioCutting?: number;
    weightPalletRemained?: number;
    sampleAccum1?: number;
    sampleAccum2?: number;
    sampleAccum3?: number;
    sampleAccum4?: number;
    sampleAccum5?: number;
    rows: ProductionReportRow[];
    baleBagLotNo?: string;
    checkedBy?: string;
    judgedBy?: string;
    issuedBy?: string;
    issuedAt?: string | Date;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const productionReportsApi = {
    getAll: async () => {
        const response = await api.get<ProductionReport[]>('/production-reports');
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get<ProductionReport>(`/production-reports/${id}`);
        return response.data;
    },
    create: async (data: ProductionReport) => {
        const response = await api.post<ProductionReport>('/production-reports', data);
        return response.data;
    },
    update: async (id: string, data: ProductionReport) => {
        const response = await api.patch<ProductionReport>(`/production-reports/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/production-reports/${id}`);
        return response.data;
    },
};
