import { usePermissions } from '@/composables/usePermissions';
import {
    Bell,
    ClipboardCheck,
    Layers,
    LayoutDashboard,
    Server,
    Shield,
    Truck,
    Users,
} from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export function useSidebarMenu() {
    const { hasPermission, isAdmin } = usePermissions();
    const { t } = useI18n();

    const allMenuGroups = computed(() => [
        {
            title: t('admin.sidebar.main'),
            items: [
                { name: t('admin.sidebar.dashboard'), path: '/admin', icon: LayoutDashboard }, // Public for admin panel
                {
                    name: t('admin.sidebar.roles'),
                    path: '/admin/roles',
                    icon: Shield,
                    permission: 'roles:read',
                },
                {
                    name: t('admin.sidebar.users'),
                    path: '/admin/users',
                    icon: Users,
                    permission: 'users:read',
                },
                {
                    name: t('admin.sidebar.suppliers'),
                    path: '/admin/suppliers',
                    icon: Truck,
                    permission: 'suppliers:read',
                },
                {
                    name: t('admin.sidebar.rubberTypes'),
                    path: '/admin/rubber-types',
                    icon: Layers,
                    permission: 'rubberTypes:read',
                },
                {
                    name: t('admin.sidebar.notifications'),
                    path: '/admin/notifications',
                    icon: Bell,
                    permission: 'notifications:read',
                },
                { name: t('admin.sidebar.approvals'), path: '/approvals', icon: ClipboardCheck },
            ],
        },
        {
            title: t('admin.sidebar.system'),
            items: [
                { name: t('admin.systemStatus.title'), path: '/admin/system-status', icon: Server },
            ],
        },
    ]);

    const menuGroups = computed(() => {
        return allMenuGroups.value
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => {
                    if (!item.permission) return true;
                    if (isAdmin.value) return true;
                    return hasPermission(item.permission);
                }),
            }))
            .filter((group) => group.items.length > 0);
    });

    return {
        menuGroups,
    };
}
