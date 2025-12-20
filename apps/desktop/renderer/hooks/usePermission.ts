
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRolesStore } from '../stores/rolesStore';

type Action = 'read' | 'create' | 'update' | 'delete' | 'approve';

export const usePermission = () => {
    const { user } = useAuthStore();
    const { roles, fetchRoles, getRole } = useRolesStore();

    // Ensure roles are loaded
    useEffect(() => {
        if (roles.length === 0) {
            fetchRoles();
        }
    }, [roles.length, fetchRoles]);

    const can = (action: Action, module: string): boolean => {
        if (!user) return false;

        // Admin passes all checks
        if (user.role === 'admin') return true;

        const userRole = getRole(user.role);
        if (!userRole) return false;

        // Check specific permission
        return userRole.permissions?.[module]?.[action] === true;
    };

    return { can };
};
