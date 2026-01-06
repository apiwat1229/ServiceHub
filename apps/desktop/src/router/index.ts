import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';

const routes = [
    {
        path: '/',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard', // Changed from Home to Dashboard to match Sidebar
                component: Home,
            },
            {
                path: 'queue',
                name: 'Queue & Booking',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'my-notifications',
                name: 'MyNotifications',
                component: () => import('../views/MyNotifications.vue'),
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/Profile.vue'),
            },
            {
                path: 'bookings',
                name: 'BookingQueue',
                component: () => import('../views/admin/BookingQueue.vue'),
            },
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true }
    },
    {
        path: '/signup',
        name: 'Signup',
        component: () => import('../views/Signup.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/pending-approval',
        name: 'PendingApproval',
        component: () => import('../views/PendingApproval.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/mrp',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'MRP System',
                component: () => import('../views/admin/Mrp.vue'),
            }
        ]
    },
    {
        path: '/admin',
        name: 'AdminPanel',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'AdminDashboard',
                component: () => import('../views/admin/Dashboard.vue'),
            },
            {
                path: 'roles',
                name: 'Roles',
                component: () => import('../views/admin/Roles.vue'),
            },
            {
                path: 'users',
                name: 'Users Management',
                component: () => import('../views/admin/UsersManagement.vue'),
            },
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: () => import('../views/admin/Suppliers.vue'),
            },
            {
                path: 'rubber-types',
                name: 'Rubber Types',
                component: () => import('../views/admin/RubberTypes.vue'),
            },
            {
                path: 'notifications',
                name: 'Notifications',
                component: () => import('../views/admin/NotificationsManagement.vue'),
            },
            {
                path: 'purchasing',
                name: 'Purchasing',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'cuplump',
                name: 'Cuplump',
                component: () => import('../views/admin/Cuplump.vue'),
            },
            {
                path: 'cuplump/:id',
                name: 'CuplumpDetail',
                component: () => import('../views/admin/CuplumpDetail.vue'),
            },
            {
                path: 'uss',
                name: 'USS',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'project-timeline',
                name: 'ProjectTimeline',
                component: () => import('../views/admin/ProjectTimeline.vue'),
            },
            {
                path: 'contracts',
                name: 'Contracts',
                component: () => import('../views/admin/Contracts.vue'),
            },
            {
                path: 'contact-management',
                name: 'ContactManagement',
                component: () => import('../views/admin/ContactManagement.vue'),
            },
            {
                path: 'bookings',
                redirect: '/bookings',
            },
            {
                path: 'approvals',
                name: 'Approvals',
                component: () => import('../views/approvals/ApprovalsList.vue'),
            },
            {
                path: 'approvals/:id',
                name: 'ApprovalDetail',
                component: () => import('../views/approvals/ApprovalDetail.vue'),
            },
            {
                path: 'analytics',
                name: 'Analytics',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'helpdesk',
                name: 'HelpDesk',
                component: () => import('../views/admin/HelpDesk.vue'),
            },
        ]
    },
    {
        path: '/change-password',
        name: 'ChangePassword',
        component: () => import('../views/ChangePassword.vue'),
    },

    {
        path: '/error',
        name: 'Error',
        component: () => import('../views/Error.vue'),
    },
    {
        path: '/scale',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'TruckScale',
                component: () => import('../views/admin/TruckScale.vue'),
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFound.vue'),
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else if (to.meta.requiresGuest && isAuthenticated) {
        next('/');
    } else {
        next();
    }
});

export default router;
