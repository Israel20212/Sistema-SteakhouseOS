<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useProductStore } from '../../stores/products';
import { useCartStore } from '../../stores/cart';
import { useRoute } from 'vue-router';
import { socket } from '../../socket';

const productStore = useProductStore();
const cartStore = useCartStore();
import { useSettingsStore } from '../../stores/settings';
const settingsStore = useSettingsStore();

onMounted(async () => {
    await settingsStore.fetchSettings();
});

const route = useRoute();

const tableId = ref(route.params.tableId);
const selectedCategory = ref('Todos');
const activeProduct = ref<any>(null);
const showCart = ref(false);
const orderStatus = ref<'idle' | 'sending' | 'success'>('idle');
const waiterCalled = ref(false);
const customerName = ref('');

// Detect mode: dine-in (with table) or takeout (without table)
const isTakeoutMode = computed(() => !tableId.value);

const categories = computed(() => ['Todos', ...productStore.categories]);

const filteredProducts = computed(() => {
    let prods = productStore.products.filter(p => p.is_active && p.is_available);
    if (selectedCategory.value !== 'Todos') {
        prods = prods.filter(p => p.category === selectedCategory.value);
    }
    return prods;
});

onMounted(async () => {
    await productStore.fetchProducts();
});

const openDetail = (product: any) => {
    activeProduct.value = product;
};

const addToCart = () => {
    cartStore.addItem(activeProduct.value);
    activeProduct.value = null; // Close modal
};

const sendOrder = async () => {
    if (cartStore.items.length === 0) return;
    
    // Validate customer name for takeout
    if (isTakeoutMode.value && !customerName.value.trim()) {
        alert('Por favor ingresa tu nombre para identificar tu orden');
        return;
    }
    
    orderStatus.value = 'sending';
    
    try {
        let endpoint = '';
        let payload: any = {};

        if (isTakeoutMode.value) {
            // Takeout mode - no table
            endpoint = 'http://localhost:3000/api/orders/takeout';
            payload = {
                items: cartStore.items.map(i => ({
                    productId: i.product.id,
                    quantity: i.quantity
                })),
                customer_name: customerName.value.trim() || null
            };
        } else {
            // Dine-in mode - with table
            endpoint = 'http://localhost:3000/api/orders/public';
            payload = {
                tableId: tableId.value,
                items: cartStore.items.map(i => ({
                    productId: i.product.id,
                    quantity: i.quantity
                }))
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            orderStatus.value = 'success';
            cartStore.clearCart();
            customerName.value = '';
            setTimeout(() => {
                showCart.value = false;
                orderStatus.value = 'idle';
            }, 3000);
        } else {
            alert('Error al enviar la orden. Intente de nuevo.');
            orderStatus.value = 'idle';
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión.');
        orderStatus.value = 'idle';
    }
};

const callWaiter = () => {
    if (tableId.value) {
        socket.emit('call_waiter', tableId.value);
        waiterCalled.value = true;
        setTimeout(() => { waiterCalled.value = false; }, 5000);
    }
};
</script>

<template>
  <div class="min-h-screen bg-black font-sans pb-24 text-white">
    
    <!-- Hero Section -->
    <div class="relative h-64 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10"></div>
        <img src="https://images.unsplash.com/photo-1546241072-48010ad2862c?q=80&w=2500&auto=format&fit=crop" class="w-full h-full object-cover animate-pan" alt="Steakhouse banner">
        <div class="absolute bottom-0 left-0 p-6 z-20">
            <h1 class="text-4xl font-serif font-bold text-gold drop-shadow-md uppercase">{{ settingsStore.restaurantName }}</h1>
            <p class="text-gray-300 text-sm tracking-widest uppercase mt-1">Prime Cuts & Drinks</p>
            <div v-if="tableId" class="mt-2 inline-block bg-white/10 backdrop-blur px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-white/20">
                <i class="fas fa-chair mr-2"></i>Mesa {{ tableId }}
            </div>
        </div>
    </div>

    <!-- Categories Scroll -->
    <div class="sticky top-0 z-30 bg-black/95 backdrop-blur border-b border-white/10 py-4 overflow-x-auto scrollbar-hide">
        <div class="flex space-x-2 px-4">
            <button 
                v-for="cat in categories" 
                :key="cat"
                @click="selectedCategory = cat"
                class="px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-all border"
                :class="selectedCategory === cat ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-gray-400 border-white/10'"
            >
                {{ cat }}
            </button>
        </div>
    </div>

    <!-- Products Grid -->
    <div class="p-4 space-y-6">
        <div v-if="filteredProducts.length === 0" class="text-center py-20 text-gray-500">
            <i class="fas fa-utensils text-4xl mb-3 opacity-50"></i>
            <p>No hay productos disponibles en esta categoría.</p>
        </div>

        <div 
            v-for="product in filteredProducts" 
            :key="product.id"
            @click="openDetail(product)"
            class="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 shadow-lg active:scale-95 transition-transform duration-200"
        >
            <div class="h-48 overflow-hidden relative">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <!-- Price Tag -->
                <div class="absolute bottom-3 right-3 z-20 bg-gold text-black font-bold px-3 py-1 rounded-lg shadow-lg">
                    ${{ product.price.toFixed(2) }}
                </div>
                 <!-- Count Badge if in cart -->
                 <div v-for="item in cartStore.items" :key="item.product.id">
                    <div v-if="item.product.id === product.id" class="absolute top-3 right-3 z-20 bg-green-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        {{ item.quantity }}
                    </div>
                </div>

                <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div v-else class="w-full h-full bg-gray-800 flex items-center justify-center">
                    <i class="fas fa-image text-4xl text-gray-600"></i>
                </div>
            </div>
            
            <div class="p-4 relative">
                <h3 class="text-xl font-serif font-bold text-white mb-1">{{ product.name }}</h3>
                <p class="text-xs text-gray-400 line-clamp-2">{{ product.description || 'Sin descripción disponible.' }}</p>
            </div>
        </div>

        <div class="pt-8 text-center text-gray-600 text-xs pb-8">
            <p>© {{ new Date().getFullYear() }} {{ settingsStore.restaurantName }}</p>
            <p class="mt-1">Precios incluyen IVA. Propina no incluida.</p>
        </div>
    </div>

    <!-- Product Detail Modal -->
    <div v-if="activeProduct" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        <div class="absolute inset-0 bg-black/90 backdrop-blur-sm pointer-events-auto" @click="activeProduct = null"></div>
        <div class="bg-primary-panel w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl pointer-events-auto relative animate-slide-up">
            <button @click="activeProduct = null" class="absolute top-4 right-4 z-20 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/80">
                <i class="fas fa-times"></i>
            </button>
            <div class="h-72 relative">
                 <img v-if="activeProduct.image_url" :src="activeProduct.image_url" class="w-full h-full object-cover" />
                 <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
            </div>
            <div class="p-6 -mt-12 relative z-10">
                <span class="bg-gold text-black text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">{{ activeProduct.category }}</span>
                <h2 class="text-3xl font-serif font-bold text-white mb-2">{{ activeProduct.name }}</h2>
                <p class="text-2xl text-gold font-bold mb-6">${{ activeProduct.price.toFixed(2) }}</p>
                <p class="text-gray-300 leading-relaxed mb-8">{{ activeProduct.description || 'Sin descripción disponible.' }}</p>
                <button @click="addToCart" class="w-full py-4 rounded-xl bg-gold text-black font-bold uppercase tracking-widest text-sm hover:bg-yellow-500 shadow-lg shadow-gold/20 flex justify-center items-center">
                    <i class="fas fa-cart-plus mr-2"></i> Agregar a la Orden
                </button>
            </div>
        </div>
    </div>

    <!-- Floating Cart Button -->
    <transition name="pop">
        <div v-if="cartStore.items.length > 0 && !showCart" class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-11/12 max-w-sm">
            <button @click="showCart = true" class="w-full bg-gold text-black py-4 rounded-xl shadow-2xl flex items-center justify-between px-6 font-bold text-lg active:scale-95 transition-transform">
                <span class="bg-black/10 px-3 py-1 rounded-lg">{{ cartStore.totalItems }} items</span>
                <span>Ver Orden</span>
                <span>${{ cartStore.total.toFixed(2) }}</span>
            </button>
        </div>
    </transition>

    <!-- Cart Modal/Drawer -->
    <div v-if="showCart" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="showCart = false"></div>
        <div class="bg-primary-panel w-full sm:max-w-md h-[85vh] rounded-t-3xl sm:rounded-2xl relative animate-slide-up flex flex-col p-6">
            
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-serif font-bold text-gold">Tu Orden</h2>
                <button @click="showCart = false" class="text-gray-400 hover:text-white"><i class="fas fa-times text-xl"></i></button>
            </div>

            <!-- Customer Name Input (Takeout Mode Only) -->
            <div v-if="isTakeoutMode" class="mb-4">
                <label class="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                    <i class="fas fa-user"></i>
                    Tu Nombre <span class="text-red-500">*</span>
                </label>
                <input
                    v-model="customerName"
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    required
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold outline-none"
                />
                <p class="text-xs text-gray-500 mt-1">* Campo obligatorio para identificar tu orden</p>
            </div>

            <div v-if="orderStatus === 'success'" class="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <i class="fas fa-check text-4xl text-white"></i>
                </div>
                <h3 class="text-2xl font-bold text-white">¡Orden Enviada!</h3>
                <p class="text-gray-400">La cocina ya está preparando tus alimentos.</p>
            </div>

            <div v-else class="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                <div v-for="item in cartStore.items" :key="item.product.id" class="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <div>
                        <p class="font-bold text-white">{{ item.product.name }}</p>
                        <p class="text-gold text-sm">${{ (item.quantity * item.product.price).toFixed(2) }}</p>
                    </div>
                    <div class="flex items-center space-x-3 bg-black/30 rounded-lg p-1">
                        <button @click="cartStore.removeItem(item.product.id)" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">-</button>
                        <span class="font-bold w-4 text-center">{{ item.quantity }}</span>
                        <button @click="cartStore.addItem(item.product)" class="w-8 h-8 flex items-center justify-center text-gold hover:text-white">+</button>
                    </div>
                </div>
            </div>

            <div v-if="orderStatus !== 'success'" class="mt-6 border-t border-white/10 pt-4 space-y-4">
                <div class="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span class="text-gold">${{ cartStore.total.toFixed(2) }}</span>
                </div>
                <button 
                    @click="sendOrder" 
                    :disabled="orderStatus === 'sending'"
                    class="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg shadow-green-900/20"
                >
                    <span v-if="orderStatus === 'sending'"><i class="fas fa-spinner fa-spin mr-2"></i> Enviando...</span>
                    <span v-else>Ordenar Ahora <i class="fas fa-arrow-right ml-2"></i></span>
                </button>
            </div>
        </div>
    </div>

    <!-- Waiter Call Button (Always visible) -->
    <div v-if="tableId && !showCart" class="fixed bottom-6 right-6 z-30">
        <button 
            @click="callWaiter" 
            class="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-90 border-2"
            :class="waiterCalled ? 'bg-green-500 border-green-400 rotate-12' : 'bg-gray-800 border-gray-600 text-gray-400'"
        >
            <i class="fas text-xl" :class="waiterCalled ? 'fa-check text-white' : 'fa-bell'"></i>
        </button>
    </div>

  </div>
</template>

<style scoped>
.animate-bounce-slow {
    animation: bounce 3s infinite;
}
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.animate-pan {
    animation: pan-image 20s linear infinite alternate;
}
@keyframes pan-image {
    from { object-position: center top; transform: scale(1); }
    to { object-position: center bottom; transform: scale(1.1); }
}
.animate-slide-up {
    animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slide-up {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
