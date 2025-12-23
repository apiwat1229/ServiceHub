import type { CreateRoleDto, RoleDto, UpdateRoleDto } from '@my-app/types';
import api from './api';

export const rolesApi = {
    getAll: () => api.get<RoleDto[]>('/roles').then((res) => res.data),
    getById: (id: string) => api.get<RoleDto>(`/roles/${id}`).then((res) => res.data),
    create: (data: CreateRoleDto) => api.post<RoleDto>('/roles', data).then((res) => res.data),
    update: (id: string, data: UpdateRoleDto) =>
        api.patch<RoleDto>(`/roles/${id}`, data).then((res) => res.data),
    delete: (id: string) => api.delete<void>(`/roles/${id}`).then((res) => res.data),
};
