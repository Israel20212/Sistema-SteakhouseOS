import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface User {
    id: number;
    username: string;
    role: 'superuser' | 'admin' | 'waiter' | 'kitchen' | 'cashier';
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const token = ref<string | null>(sessionStorage.getItem('token'));
    const router = useRouter();

    const isAuthenticated = computed(() => !!token.value);
    const userRole = computed(() => user.value?.role);

    async function login(username: string, password: string) {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            token.value = data.token;
            user.value = data.user;

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user)); // Persist user for refresh in this tab only

            // Redirect based on role
            switch (data.user.role) {
                case 'waiter': router.push('/waiter'); break;
                case 'kitchen': router.push('/kitchen'); break;
                case 'cashier': router.push('/cashier'); break;
                case 'admin': router.push('/admin'); break;
                case 'superuser': router.push('/superuser'); break; // SaaS Admin
            }

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    function logout() {
        token.value = null;
        user.value = null;
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        router.push('/');
    }

    function initializeAuth() {
        const storedUser = sessionStorage.getItem('user');
        if (token.value && storedUser) {
            user.value = JSON.parse(storedUser);
        }
    }

    return {
        user,
        token,
        isAuthenticated,
        userRole,
        login,
        logout,
        initializeAuth
    };
});
