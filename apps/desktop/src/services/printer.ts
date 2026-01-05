import {
    ApiResponse,
    CreatePrinterDepartmentDto,
    PrinterDepartmentDto,
    PrinterUserMappingDto,
    SavePrinterUsageRecordDto,
    UpdatePrinterDepartmentDto,
    UpsertPrinterUserMappingDto
} from '@my-app/types';
import api from './api';

export const printerService = {
    // Departments
    async getDepartments(): Promise<ApiResponse<PrinterDepartmentDto[]>> {
        const response = await api.get('/printer-usage/departments');
        return { success: true, data: response.data };
    },

    async createDepartment(data: CreatePrinterDepartmentDto): Promise<ApiResponse<PrinterDepartmentDto>> {
        const response = await api.post('/printer-usage/departments', data);
        return { success: true, data: response.data };
    },

    async updateDepartment(id: string, data: UpdatePrinterDepartmentDto): Promise<ApiResponse<PrinterDepartmentDto>> {
        const response = await api.put(`/printer-usage/departments/${id}`, data);
        return { success: true, data: response.data };
    },

    async deleteDepartment(id: string): Promise<ApiResponse<void>> {
        await api.delete(`/printer-usage/departments/${id}`);
        return { success: true };
    },

    // Mappings
    async getMappings(): Promise<ApiResponse<PrinterUserMappingDto[]>> {
        const response = await api.get('/printer-usage/mappings');
        return { success: true, data: response.data };
    },

    async upsertMapping(data: UpsertPrinterUserMappingDto): Promise<ApiResponse<PrinterUserMappingDto>> {
        const response = await api.post('/printer-usage/mappings', data);
        return { success: true, data: response.data };
    },

    // Records
    async saveUsageRecords(records: SavePrinterUsageRecordDto[]): Promise<ApiResponse<any[]>> {
        const response = await api.post('/printer-usage/records', records);
        return { success: true, data: response.data };
    },

    async getHistory(): Promise<ApiResponse<any[]>> {
        const response = await api.get('/printer-usage/history');
        return { success: true, data: response.data };
    }
};
