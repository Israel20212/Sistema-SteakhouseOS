import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export interface Table {
    id: number;
    number: string;
    status: 'free' | 'occupied' | 'waiting_food' | 'eating' | 'paying' | 'dirty';
    current_order_id: number | null;
}

export const useTableStore = defineStore('tables', () => {
    const tables = ref<Table[]>([]);
    const isLoading = ref(false);
    const authStore = useAuthStore();

    async function fetchTables() {
        isLoading.value = true;
        try {
            const response = await fetch('http://localhost:3000/api/tables', {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });

            if (response.status === 401) {
                authStore.logout();
                return;
            }

            if (response.ok) {
                tables.value = await response.json();
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            isLoading.value = false;
        }
    }

    async function addTable() {
        try {
            const response = await fetch('http://localhost:3000/api/tables', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });
            if (response.ok) await fetchTables();
        } catch (error) {
            console.error(error);
        }
    }

    async function deleteTable(id: number) {
        if (!confirm('¿Seguro que deseas eliminar esta mesa?')) return;
        try {
            const response = await fetch(`http://localhost:3000/api/tables/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });
            if (response.ok) await fetchTables();
        } catch (error) {
            console.error(error);
        }
    }

    return {
        tables,
        isLoading,
        fetchTables,
        addTable,
        deleteTable
    };
});
