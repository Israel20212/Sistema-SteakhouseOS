import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface CartItem {
    product: any;
    quantity: number;
}

export const useCartStore = defineStore('cart', () => {
    const items = ref<CartItem[]>([]);

    const total = computed(() => {
        return items.value.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
    });

    const totalItems = computed(() => {
        return items.value.reduce((sum, item) => sum + item.quantity, 0);
    });

    function addItem(product: any) {
        if (!product || !product.id) return;
        const existing = items.value.find(i => i.product?.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            items.value.push({ product, quantity: 1 });
        }
    }

    function removeItem(productId: number) {
        const index = items.value.findIndex(i => i.product.id === productId);
        if (index !== -1) {
            const item = items.value[index];
            if (item) {
                if (item.quantity > 1) {
                    item.quantity--;
                } else {
                    items.value.splice(index, 1);
                }
            }
        }
    }

    function clearCart() {
        items.value = [];
    }

    return {
        items,
        total,
        totalItems,
        addItem,
        removeItem,
        clearCart
    };
});
