import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product } from './products';

export interface CartItem {
    product: Product;
    quantity: number;
}

export const useOrderStore = defineStore('order', () => {
    const currentTableId = ref<number | null>(null);
    const cart = ref<CartItem[]>([]);

    const total = computed(() => {
        return cart.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    });

    function setTable(tableId: number) {
        currentTableId.value = tableId;
        cart.value = []; // Clear cart when switching tables (or load existing draft if implemented)
    }

    function addItem(product: Product) {
        const existing = cart.value.find(item => item.product.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.value.push({ product, quantity: 1 });
        }
    }

    function removeItem(productId: number) {
        const index = cart.value.findIndex(item => item.product.id === productId);
        if (index !== -1) {
            if (cart.value[index].quantity > 1) {
                cart.value[index].quantity--;
            } else {
                cart.value.splice(index, 1);
            }
        }
    }

    return {
        currentTableId,
        cart,
        total,
        setTable,
        addItem,
        removeItem
    };
});
