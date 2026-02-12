<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useProductStore, type Product } from '../../stores/products';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';

const productStore = useProductStore();
const authStore = useAuthStore();
const router = useRouter();

const showModal = ref(false);
const editingProduct = ref<Partial<Product> | null>(null);

// Form Data
const form = ref({
    name: '',
    price: 0,
    category: '',
    image_url: '',
    description: ''
});

onMounted(() => {
    productStore.fetchProducts();
});

const openModal = (product?: Product) => {
    if (product) {
        editingProduct.value = product;
        form.value = { 
            name: product.name,
            price: product.price,
            category: product.category,
            image_url: product.image_url,
            description: product.description || ''
        };
    } else {
        editingProduct.value = null;
        form.value = { name: '', price: 0, category: 'Cortes', image_url: '', description: '' };
    }
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    editingProduct.value = null;
};

const saveProduct = async () => {
    let success = false;
    if (editingProduct.value && editingProduct.value.id) {
        success = await productStore.updateProduct(editingProduct.value.id, form.value);
    } else {
        success = await productStore.addProduct(form.value);
    }

    if (success) {
        closeModal();
    } else {
        alert('Error al guardar el producto');
    }
};

const deleteProduct = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        await productStore.deleteProduct(id);
    }
};

const logout = () => {
    authStore.logout();
    router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-primary pb-20 font-sans text-white">
    
    <!-- Header -->
    <header class="bg-primary-panel border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-90 flex justify-between items-center">
        <div>
            <h1 class="text-xl text-gold font-bold font-serif">Administración</h1>
            <p class="text-xs text-gray-500">Gestión de Menú</p>
        </div>
        <div class="flex items-center space-x-3">
            <button @click="router.push('/admin/analytics')" class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold text-sm transition border border-white/20">
                <i class="fas fa-chart-line mr-1"></i> Analíticas
            </button>
             <button @click="router.push('/admin/users')" class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold text-sm transition border border-white/20">
                <i class="fas fa-users mr-1"></i> Personal
            </button>
             <button @click="router.push('/admin/qrs')" class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold text-sm transition border border-white/20">
                <i class="fas fa-qrcode mr-1"></i> Factory QR
            </button>
             <button @click="openModal()" class="bg-gold hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold text-sm transition shadow-lg">
                <i class="fas fa-plus mr-1"></i> Nuevo Platillo
            </button>
            <button @click="logout" class="text-red-400 border border-red-900/50 px-3 py-2 rounded hover:bg-red-900/20 text-sm">
                Salir
            </button>
        </div>
    </header>

    <div class="p-6 max-w-7xl mx-auto">
        
        <!-- Categories Filter (Optional, or just list all) -->
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div 
                v-for="product in productStore.formattedProducts" 
                :key="product.id"
                class="bg-primary-panel border border-white/10 rounded-xl overflow-hidden shadow-lg group hover:border-gold/30 transition-all flex flex-col"
            >
                <!-- Image -->
                <div class="h-48 overflow-hidden relative bg-black/50">
                     <img 
                        v-if="product.image_url" 
                        :src="product.image_url" 
                        class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                        onerror="this.style.display='none'"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-600">
                        <i class="fas fa-image text-4xl"></i>
                    </div>
                    
                    <div class="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-gold font-bold uppercase backdrop-blur-sm">
                        {{ product.category }}
                    </div>
                </div>

                <!-- Info -->
                <div class="p-4 flex-1 flex flex-col">
                    <h3 class="text-lg font-bold font-serif mb-1">{{ product.name }}</h3>
                    <p class="text-2xl text-gold font-bold mb-4">${{ product.price.toFixed(2) }}</p>
                    
                    <div class="mt-auto flex space-x-2">
                        <button 
                            @click="openModal(product)"
                            class="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded text-sm font-bold transition"
                        >
                            Editar
                        </button>
                        <button 
                            @click="deleteProduct(product.id)"
                            class="bg-red-500/10 hover:bg-red-500/30 text-red-500 py-2 px-4 rounded text-sm font-bold transition"
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-primary-panel border border-gold/30 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <h2 class="text-2xl font-serif text-gold mb-6 text-center">
                {{ editingProduct ? 'Editar Platillo' : 'Nuevo Platillo' }}
            </h2>
            
            <form @submit.prevent="saveProduct" class="space-y-4">
                <div>
                    <label class="block text-xs uppercase text-gray-400 mb-1">Nombre</label>
                    <input v-model="form.name" type="text" required class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold transition" />
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="block text-xs uppercase text-gray-400 mb-1">Precio</label>
                        <input v-model.number="form.price" type="number" step="0.01" required class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold transition" />
                    </div>
                    <div>
                        <label class="block text-xs uppercase text-gray-400 mb-1">Categoría</label>
                        <select v-model="form.category" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold transition">
                            <option>Cortes</option>
                            <option>Entradas</option>
                            <option>Bebidas</option>
                            <option>Postres</option>
                            <option>Guarniciones</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-xs uppercase text-gray-400 mb-1">URL Imagen</label>
                    <input v-model="form.image_url" type="text" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold transition" placeholder="https://..." />
                </div>

                <div>
                    <label class="block text-xs uppercase text-gray-400 mb-1">Descripción (Ingredientes, Info)</label>
                    <textarea v-model="form.description" rows="3" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold transition" placeholder="Descripción detallada para el Menú QR..."></textarea>
                </div>

                <div class="pt-4 flex space-x-3">
                    <button type="button" @click="closeModal" class="flex-1 py-3 border border-white/20 rounded text-gray-300 hover:bg-white/5 transition">
                        Cancelar
                    </button>
                    <button type="submit" class="flex-1 py-3 bg-gold hover:bg-yellow-500 text-black font-bold rounded shadow-lg transition">
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    </div>

  </div>
</template>
