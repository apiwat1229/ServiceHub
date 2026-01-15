import api from './api';

export interface PoolItem {
    id: string;
    poolId: string;
    bookingId: string;
    lotNumber: string;
    supplierName: string;
    supplierCode: string;
    date: string;
    netWeight: number;
    grossWeight: number;
    grade: string;
    rubberType: string;
    createdAt: string;
}

export interface Pool {
    id: string;
    name: string;
    status: 'empty' | 'filling' | 'open' | 'closed';
    grade: string;
    rubberType: string;
    capacity: number;
    totalWeight: number;
    totalGrossWeight: number;
    items?: PoolItem[];
    fillingDate?: string;
    closeDate?: string;
    _count?: {
        items: number;
    };
}

const USE_MOCK = true; // Toggle for testing without BE deployment

const mockPools: Pool[] = Array.from({ length: 23 }, (_, i) => {
    const grades = ['AA', 'A', 'B', 'C', 'D'];
    const status: Pool['status'] = i === 2 ? 'closed' : (i < 2 ? 'filling' : 'empty');
    const grade = i < 3 ? grades[i % grades.length] : '-';
    const weight = i < 3 ? 125000 : 0;

    return {
        id: `mock-pool-${i + 1}`,
        name: `Pool ${i + 1}`,
        status: status,
        grade: grade,
        rubberType: i < 3 ? 'North East CL' : '-',
        capacity: 260000,
        totalWeight: weight,
        totalGrossWeight: weight * 1.05,
        fillingDate: weight > 0 ? new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString() : undefined,
        closeDate: status === 'closed' ? new Date().toISOString() : undefined,
        _count: { items: i < 3 ? 12 : 0 }
    };
});

export const poolsApi = {
    getAll: () => {
        if (USE_MOCK) return Promise.resolve(mockPools);
        return api.get<Pool[]>('/pools').then(res => res.data);
    },
    getOne: (id: string) => {
        if (USE_MOCK) return Promise.resolve(mockPools.find(p => p.id === id) || mockPools[0]);
        return api.get<Pool>(`/pools/${id}`).then(res => res.data);
    },
    create: (data: Partial<Pool>) => api.post<Pool>('/pools', data).then(res => res.data),
    update: (id: string, data: Partial<Pool>) => api.put<Pool>(`/pools/${id}`, data).then(res => res.data),
    addItems: (poolId: string, items: { displayWeight?: number; displayGrade?: string; displayRubberType?: string }[]) => {
        if (USE_MOCK) {
            const pool = mockPools.find(p => p.id === poolId);
            if (pool) {
                const addedWeight = items.reduce((sum, item) => sum + (item.displayWeight || 0), 0);
                pool.totalWeight += addedWeight;
                pool.status = 'open';
                pool.grade = items[0]?.displayGrade || 'AA';
                pool.rubberType = items[0]?.displayRubberType || 'North East CL';
                pool._count = { items: (pool._count?.items || 0) + items.length };
            }
            return Promise.resolve(pool!);
        }
        return api.post<Pool>(`/pools/${poolId}/items`, items).then(res => res.data);
    },
    removeItem: (poolId: string, bookingId: string) => api.delete(`/pools/${poolId}/items/${bookingId}`).then(res => res.data),
    close: (id: string, closeDate?: string) => {
        if (USE_MOCK) {
            const pool = mockPools.find(p => p.id === id);
            if (pool) pool.status = 'closed';
            return Promise.resolve(pool!);
        }
        return api.post<Pool>(`/pools/${id}/close`, { close_date: closeDate }).then(res => res.data);
    },
    reopen: (id: string) => {
        if (USE_MOCK) {
            const pool = mockPools.find(p => p.id === id);
            if (pool) pool.status = 'open';
            return Promise.resolve(pool!);
        }
        return api.post<Pool>(`/pools/${id}/reopen`).then(res => res.data);
    },
    seed: () => Promise.resolve({ message: 'Mock data initialized' }),
};
