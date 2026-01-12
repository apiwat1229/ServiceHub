import api from './api';

export interface Db54Data {
    brightness: number;
    positions: {
        color: number;
        text: number;
    }[];
}

export interface LineUseData {
    line1: boolean;
    line2: boolean;
    line3: boolean;
    line4: boolean;
}

export interface PlcStatus {
    isConnected: boolean;
    ip: string;
}

export const plcApi = {
    getStatus: () => api.get<PlcStatus>('/plc/status').then(res => res.data),
    getDb54: () => api.get<Db54Data>('/plc/db54').then(res => res.data),
    updateDb54: (data: Db54Data) => api.post('/plc/db54', data).then(res => res.data),
    getLineUse: () => api.get<LineUseData>('/plc/line-use').then(res => res.data),
    updateLineUse: (index: number, value: boolean) =>
        api.post(`/plc/line-use/${index}`, { value }).then(res => res.data),
};
