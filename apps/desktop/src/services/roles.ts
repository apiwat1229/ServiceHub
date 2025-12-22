import type { Role, UpdateRoleDto } from '@my-app/types';
import api from './api';

export const rolesApi = {
    getAll: () => api.get<Role[]>('/roles').then((res) => res.data),
    getById: (id: string) => api.get<Role>(`/roles/${id}`).then((res) => res.data),
    update: (id: string, data: UpdateRoleDto) =>
        api.patch<Role>(`/roles/${id}`, data).then((res) => res.data),
    delete: (id: string) => api.delete<void>(`/roles/${id}`).then((res) => res.data),
};
