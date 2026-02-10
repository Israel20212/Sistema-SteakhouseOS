import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export interface Product {
    name: string;
}

export interface OrderItem {
    id: number;
    quantity: number;
    Product: Product;
}

export interface Table {
    number: string;
}

export interface Order {
    id: number;
    status: 'pending' | 'cooking' | 'ready' | 'served' | 'paid';
    total: number;
    createdAt: string;
    Table: Table | null;
    OrderItems: OrderItem[];
    order_type: 'dine_in' | 'takeout';
    customer_name?: string;
}

export const useKitchenStore = defineStore('kitchen', () => {
    const orders = ref<Order[]>([]);
    const authStore = useAuthStore();

    async function fetchOrders() {
        try {
            const response = await fetch('http://localhost:3000/api/orders', {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });
            if (response.ok) {
                orders.value = await response.json();
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    async function updateOrderStatus(orderId: number, status: 'cooking' | 'ready' | 'served') {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                // Optimistic update or wait for socket event
                // We'll rely on socket event to update the list to avoid duplicate logic
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating status:', error);
            return false;
        }
    }

    return {
        orders,
        fetchOrders,
        updateOrderStatus
    };
});
