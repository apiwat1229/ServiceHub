import { usePermissions } from '@/composables/usePermissions';
import {
    BarChart3,
    BookOpen,
    ClipboardList,
    FileText,
    Headset,
    LayoutDashboard,
    Monitor,
    Package,
    Server,
    Settings,
    Shield,
    Users,
    Wrench
} from 'lucide-vue-next';
import { computed, type FunctionalComponent } from 'vue';
import { useI18n } from 'vue-i18n';

export interface MenuItem {
    name: string;
    path: string;
    icon: FunctionalComponent;
    permission?: string;
    children?: MenuItem[];
}

export interface MenuGroup {
    title: string;
    items: MenuItem[];
}

export function useSidebarMenu() {
    const { hasPermission, isAdmin } = usePermissions();
    const { t } = useI18n();

    const allMenuGroups = computed<MenuGroup[]>(() => [
        {
            title: t('admin.sidebar.main'),
            items: [
                { name: t('admin.sidebar.dashboard'), path: '/', icon: LayoutDashboard },
                {
                    name: t('services.maintenance.name'),
                    path: '/maintenance',
                    icon: Wrench,
                    permission: 'maintenance:read',
                    children: [
                        { name: t('services.maintenance.tabs.overview'), path: '/maintenance?tab=dashboard', icon: LayoutDashboard },
                        { name: t('services.maintenance.tabs.machines'), path: '/maintenance?tab=machines', icon: Settings },
                        { name: t('services.maintenance.tabs.repairs'), path: '/maintenance?tab=repairs', icon: ClipboardList },
                        { name: t('services.maintenance.tabs.parts'), path: '/maintenance?tab=stock', icon: Package },
                    ]
                },
                {
                    name: t('services.itHelp.name'),
                    path: '/admin/helpdesk',
                    icon: Headset,
                    permission: 'helpdesk:read',
                    children: [
                        { name: t('services.itHelp.tabs.kb'), path: '/admin/helpdesk?tab=kb', icon: BookOpen },
                        { name: t('services.itHelp.tabs.tickets'), path: '/admin/helpdesk?tab=tickets', icon: FileText },
                        { name: t('services.itHelp.tabs.reports'), path: '/admin/helpdesk?tab=reports', icon: BarChart3 },
                        { name: t('services.itHelp.tabs.assetRequests'), path: '/admin/helpdesk?tab=asset-requests', icon: Monitor },
                        { name: t('services.itHelp.tabs.stock'), path: '/admin/helpdesk?tab=stock', icon: Package },
                        { name: t('services.itHelp.tabs.analytics'), path: '/admin/helpdesk?tab=analytics', icon: BarChart3 },
                    ]
                },
            ],
        },
        {
            title: t('admin.sidebar.system'),
            items: [
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
