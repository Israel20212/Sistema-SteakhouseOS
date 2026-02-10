import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export interface Product {
    name: string;
    price: number;
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
    Table: Table;
    OrderItems: OrderItem[];
}

export const useCashierStore = defineStore('cashier', () => {
    const orders = ref<Order[]>([]);
    const authStore = useAuthStore();

    async function fetchActiveOrders() {
        try {
            const response = await fetch('http://localhost:3000/api/orders/active', {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });
            if (response.ok) {
                orders.value = await response.json();
            }
        } catch (error) {
            console.error('Error fetching active orders:', error);
        }
    }

    async function payOrder(orderId: number) {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}/pay`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });

            if (response.ok) {
                await fetchActiveOrders(); // Refresh list
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error paying order:', error);
            return false;
        }
    }

    return {
        orders,
        fetchActiveOrders,
        payOrder
    };
});
