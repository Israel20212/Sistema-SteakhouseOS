<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useProductStore } from '../../stores/products';
import { useCartStore } from '../../stores/cart';
import { useSettingsStore } from '../../stores/settings';

const productStore = useProductStore();
const cartStore = useCartStore();
const settingsStore = useSettingsStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const selectedCategory = ref('Todos');
const activeProduct = ref<any>(null);
const showCart = ref(false);
const orderStatus = ref<'idle' | 'sending' | 'success'>('idle');
const customerName = ref('');

const categories = computed(() => ['Todos', ...productStore.categories]);

const filteredProducts = computed(() => {
    let prods = productStore.products.filter(p => p.is_active && p.is_available);
    if (selectedCategory.value !== 'Todos') {
        prods = prods.filter(p => p.category === selectedCategory.value);
    }
    return prods;
});

onMounted(async () => {
    await settingsStore.fetchSettings();
    await productStore.fetchProducts();
});

const openDetail = (product: any) => {
    activeProduct.value = product;
};

const addToCart = () => {
    cartStore.addItem(activeProduct.value);
    activeProduct.value = null;
};

const sendOrder = async () => {
    if (cartStore.items.length === 0) return;
    
    orderStatus.value = 'sending';
    
    try {
        const payload = {
            items: cartStore.items.map(i => ({
                productId: i.product.id,
                quantity: i.quantity
            })),
            customer_name: customerName.value.trim() || null
        };

        const response = await fetch(`${API_URL}/api/orders/takeout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            orderStatus.value = 'success';
            cartStore.clearCart();
            customerName.value = '';
            
            // Show success message with order number
            setTimeout(() => {
                showCart.value = false;
                orderStatus.value = 'idle';
            }, 5000);
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
</script>

<template>
  <div class="min-h-screen bg-black font-sans pb-24 text-white">
    
    <!-- Hero Section -->
    <div class="relative h-64 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-primary via-black to-black"></div>
        <div class="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
            <h1 class="text-4xl font-serif text-gold mb-2">Menú Para Llevar</h1>
            <p class="text-gray-300 text-sm">Ordena y recoge en minutos</p>
        </div>
    </div>

    <!-- Categories Tabs -->
    <div class="sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-white/10 py-3 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div class="flex space-x-3">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          class="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all border"
          :class="selectedCategory === cat ? 'bg-gold text-black border-gold' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        @click="openDetail(product)"
        class="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-gold/50 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
      >
        <div class="aspect-square bg-black/50 relative overflow-hidden">
          <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover" />
          <i v-else class="fas fa-utensils absolute inset-0 flex items-center justify-center text-4xl text-gray-600"></i>
        </div>
        <div class="p-3">
          <h3 class="font-bold text-sm leading-tight mb-1">{{ product.name }}</h3>
          <p class="text-gold font-bold">${{ product.price }}</p>
        </div>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <div v-if="activeProduct" class="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm" @click="activeProduct = null">
      <div class="bg-primary-panel rounded-t-3xl w-full max-w-lg p-6 animate-slide-up" @click.stop>
        <div class="aspect-square bg-black/50 rounded-xl overflow-hidden mb-4">
          <img v-if="activeProduct.image_url" :src="activeProduct.image_url" class="w-full h-full object-cover" />
        </div>
        <h2 class="text-2xl font-serif text-gold mb-2">{{ activeProduct.name }}</h2>
        <p class="text-gray-400 text-sm mb-4">{{ activeProduct.description || 'Sin descripción' }}</p>
        <p class="text-3xl font-bold text-white mb-6">${{ activeProduct.price }}</p>
        <button @click="addToCart" class="w-full py-4 bg-gold text-black font-bold uppercase rounded-xl hover:brightness-110 transition">
          Agregar al Carrito
        </button>
      </div>
    </div>

    <!-- Floating Cart Button -->
    <button
      v-if="cartStore.items.length > 0"
      @click="showCart = true"
      class="fixed bottom-4 right-4 bg-gold text-black w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition"
    >
      <i class="fas fa-shopping-cart text-xl"></i>
      <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
        {{ cartStore.items.reduce((a, b) => a + b.quantity, 0) }}
      </span>
    </button>

    <!-- Cart Modal -->
    <div v-if="showCart" class="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm" @click="showCart = false">
      <div class="bg-primary-panel rounded-t-3xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-serif text-gold">Tu Orden</h2>
          <button @click="showCart = false" class="text-gray-400 hover:text-white">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Customer Name Input -->
        <div class="mb-4">
          <label class="text-sm text-gray-400 mb-2 block">Nombre (Opcional)</label>
          <input
            v-model="customerName"
            type="text"
            placeholder="Tu nombre"
            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold outline-none"
          />
        </div>

        <!-- Cart Items -->
        <div class="space-y-3 mb-4">
          <div v-for="item in cartStore.items" :key="item.product.id" class="flex items-center justify-between bg-white/5 p-3 rounded-xl">
            <div class="flex-1">
              <h4 class="font-bold text-sm">{{ item.product.name }}</h4>
              <p class="text-gold text-sm">${{ item.product.price }} x {{ item.quantity }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="cartStore.removeItem(item.product.id)" class="px-2 py-1 bg-white/10 rounded hover:bg-red-500/20">-</button>
              <span class="font-bold">{{ item.quantity }}</span>
              <button @click="cartStore.addItem(item.product)" class="px-2 py-1 bg-white/10 rounded hover:bg-gold/20">+</button>
            </div>
          </div>
        </div>

        <!-- Total -->
        <div class="flex justify-between items-center mb-6 pt-4 border-t border-white/10">
          <span class="text-xl font-bold text-white">Total:</span>
          <span class="text-2xl font-bold text-gold">${{ cartStore.total.toFixed(2) }}</span>
        </div>

        <!-- Send Order Button -->
        <button
          v-if="orderStatus === 'idle'"
          @click="sendOrder"
          class="w-full py-4 bg-gold text-black font-bold uppercase rounded-xl hover:brightness-110 transition"
        >
          Confirmar Orden
        </button>
        <div v-else-if="orderStatus === 'sending'" class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-gold text-3xl"></i>
        </div>
        <div v-else class="text-center py-4">
          <i class="fas fa-check-circle text-green-500 text-5xl mb-3"></i>
          <p class="text-green-400 font-bold text-lg">¡Orden Enviada!</p>
          <p class="text-gray-400 text-sm">Recibirás tu pedido pronto</p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
