import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'login',
            component: () => import('../views/Login.vue')
        },
        {
            path: '/waiter',
            name: 'waiter-dashboard',
            component: () => import('../views/waiter/Dashboard.vue'),
            meta: { allowedRoles: ['waiter'] }
        },
        {
            path: '/waiter/table/:id/order',
            name: 'order-taking',
            component: () => import('../views/waiter/OrderTaking.vue'),
            meta: { allowedRoles: ['waiter'] }
        },
        {
            path: '/kitchen',
            name: 'kitchen-display',
            component: () => import('../views/kitchen/KitchenDisplay.vue'),
            meta: { allowedRoles: ['kitchen'] }
        },
        {
            path: '/cashier',
            name: 'cashier-dashboard',
            component: () => import('../views/cashier/Dashboard.vue'),
            meta: { allowedRoles: ['cashier'] }
        },
        {
            path: '/admin',
            name: 'admin-dashboard',
            component: () => import('../views/admin/Dashboard.vue'),
            meta: { allowedRoles: ['admin', 'superuser'] }
        },
        {
            path: '/admin/analytics',
            name: 'admin-analytics',
            component: () => import('../views/admin/Analytics.vue'),
            meta: { allowedRoles: ['admin', 'superuser'] }
        },
        {
            path: '/admin/users',
            name: 'admin-users',
            component: () => import('../views/admin/Users.vue'),
            meta: { allowedRoles: ['admin', 'superuser'] }
        },
        {
            path: '/admin/qrs',
            name: 'admin-qrs',
            component: () => import('../views/admin/QrPrint.vue'),
            meta: { allowedRoles: ['admin', 'superuser'] }
        },
        {
            path: '/menu/table/:tableId',
            name: 'public-menu-table',
            component: () => import('../views/public/MenuQR.vue')
        },
        {
            path: '/menu',
            name: 'public-menu',
            component: () => import('../views/public/MenuQR.vue')
        },
        {
            path: '/menu/takeout',
            name: 'TakeoutMenu',
            component: () => import('../views/public/MenuTakeout.vue'),
            meta: { public: true }
        },
        {
            path: '/superuser',
            name: 'superuser-dashboard',
            component: () => import('../views/superuser/Dashboard.vue'),
            meta: { allowedRoles: ['superuser'] }
        }
    ]
})

router.beforeEach((to, from, next) => {
    const publicPages = ['/', '/menu'];
    const authRequired = !publicPages.includes(to.path) && !to.path.startsWith('/menu/');
    const token = sessionStorage.getItem('token');
    const userString = sessionStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (authRequired && !token) {
        return next('/');
    }

    if (token && to.path === '/') {
        // Redirect to dashboard if trying to access login while logged in
        if (user) {
            switch (user.role) {
                case 'waiter': return next('/waiter');
                case 'kitchen': return next('/kitchen');
                case 'cashier': return next('/cashier');
                case 'admin': return next('/admin');
                case 'superuser': return next('/superuser');
            }
        }
    }

    if (authRequired && user && to.meta.allowedRoles) {
        const allowedRoles = to.meta.allowedRoles as string[];
        if (!allowedRoles.includes(user.role)) {
            // Role mismatch - Redirect to correct dashboard
            switch (user.role) {
                case 'waiter': return next('/waiter');
                case 'kitchen': return next('/kitchen');
                case 'cashier': return next('/cashier');
                case 'admin': return next('/admin');
                case 'superuser': return next('/superuser');
                default: return next('/');
            }
        }
    }

    next();
});

export default router
