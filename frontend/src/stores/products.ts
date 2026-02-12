import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import { socket } from '../socket'; // Ensure socket is imported

export interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    image_url: string;
    is_active: boolean;
    is_available: boolean;
    description?: string;
}

export const useProductStore = defineStore('products', () => {
    const products = ref<Product[]>([]);
    const authStore = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const formattedProducts = computed(() => {
        return products.value.map(p => ({
            ...p,
            price: Number(p.price)
        }));
    });

    const categories = computed(() => {
        const cats = new Set(products.value.map(p => p.category));
        return Array.from(cats);
    });

    async function fetchProducts() {
        try {
            const response = await fetch(`${API_URL}/api/products`, {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });
            if (response.ok) {
                products.value = await response.json();
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    async function addProduct(productData: Partial<Product>) {
        try {
            const response = await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify(productData)
            });
            if (response.ok) {
                await fetchProducts();
                return true;
            } else {
                const data = await response.json();
                alert(`Error: ${data.message || 'Error desconocido'}`);
                return false;
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión al guardar producto');
            return false;
        }
    }

    async function updateProduct(id: number, productData: Partial<Product>) {
        try {
            const response = await fetch(`${API_URL}/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify(productData)
            });
            if (response.ok) await fetchProducts();
            return response.ok;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async function deleteProduct(id: number) {
        try {
            const response = await fetch(`${API_URL}/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });
            if (response.ok) await fetchProducts();
            return response.ok;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async function toggleAvailability(id: number) {
        // Optimistic update
        const index = products.value.findIndex(p => p.id === id);
        if (index !== -1) {
            products.value[index].is_available = !products.value[index].is_available;
        }

        try {
            const response = await fetch(`${API_URL}/api/products/${id}/availability`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            });

            if (!response.ok) {
                // Revert if failed
                if (index !== -1) {
                    products.value[index].is_available = !products.value[index].is_available;
                }
            }
            return response.ok;
        } catch (error) {
            console.error(error);
            // Revert on error
            if (index !== -1) {
                products.value[index].is_available = !products.value[index].is_available;
            }
            return false;
        }
    }

    // Listen for real-time updates
    socket.on('product_updated', (updatedProduct: Product) => {
        const index = products.value.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
            products.value[index] = updatedProduct;
        } else {
            products.value.push(updatedProduct);
        }
    });

    return {
        products,
        formattedProducts,
        categories,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleAvailability
    };
});
