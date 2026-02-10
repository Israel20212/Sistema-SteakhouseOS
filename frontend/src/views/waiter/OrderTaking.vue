<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '../../stores/products';
import { useOrderStore } from '../../stores/order';
import { useAuthStore } from '../../stores/auth'; // For token auth if needed later

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const orderStore = useOrderStore();
const authStore = useAuthStore(); // Added authStore usage
const token = authStore.token;

const tableId = Number(route.params.id);
const selectedCategory = ref('');
const tableStatus = ref('occupied'); // Default, will fetch actual status

onMounted(async () => {
  orderStore.setTable(tableId);
  await productStore.fetchProducts();
  if (productStore.categories.length > 0) {
    selectedCategory.value = productStore.categories[0] || '';
  }
  
  // Fetch table status
  try {
    const response = await fetch(`http://localhost:3000/api/tables`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const tables = await response.json();
      const currentTable = tables.find((t: any) => t.id === tableId);
      if (currentTable) tableStatus.value = currentTable.status;
    }
  } catch (error) {
    console.error('Error fetching table status:', error);
  }
});

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return productStore.products;
  return productStore.products.filter(p => p.category === selectedCategory.value);
});

const goBack = () => {
  router.push('/waiter');
};

const sendToKitchen = async () => {
  if (orderStore.cart.length === 0) return;
  
  const confirmSend = confirm(`¿Enviar pedido por $${orderStore.total.toFixed(2)}?`);
  if (!confirmSend) return;

  try {
    const items = orderStore.cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Need token here
      },
      body: JSON.stringify({
        tableId: tableId,
        items
      })
    });

    if (response.ok) {
      alert('¡Pedido enviado a cocina!');
      orderStore.cart = []; // Clear cart
      router.push('/waiter'); // Go back to dashboard
    } else {
      alert('Error al enviar pedido');
    }
  } catch (error) {
    console.error('Error sending order:', error);
    alert('Error de conexión');
  }
};

const requestPayment = async () => {
  const confirmRequest = confirm('¿Cliente desea pagar?');
  if (!confirmRequest) return;
  
  try {
    const response = await fetch(`http://localhost:3000/api/tables/${tableId}/request-payment`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      alert('Mesa marcada como lista para pagar. El cajero la atenderá.');
      router.push('/waiter');
    } else {
      alert('Error al solicitar pago');
    }
  } catch (error) {
    console.error('Error requesting payment:', error);
    alert('Error de conexión');
  }
};
</script>

<template>
  <div class="min-h-screen bg-primary pb-32"> <!-- pb-32 for floating cart -->
    
    <!-- Header -->
    <header class="bg-primary-panel border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-90 flex items-center justify-between">
      <button @click="goBack" class="text-gold p-2 -ml-2">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1 class="text-lg text-white font-serif font-bold">Mesa {{ route.params.id }}</h1> <!-- Assuming ID is visible logic, usually convert ID to Table Number via Store -->
      <div class="w-8"></div> <!-- Spacer -->
    </header>

    <!-- Categories Horizontal Scroll -->
    <div class="sticky top-16 z-10 bg-primary/95 backdrop-blur-sm p-3 border-b border-white/5 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div class="flex space-x-3 px-1">
        <button 
          v-for="cat in productStore.categories" 
          :key="cat"
          @click="selectedCategory = cat"
          class="px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all border"
          :class="selectedCategory === cat ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id"
        class="bg-primary-panel border border-white/5 rounded-xl overflow-hidden flex shadow-lg hover:border-gold/30 transition-colors group"
      >
        <!-- Image placeholder -->
        <div class="w-24 h-24 bg-gray-800 flex-shrink-0 relative">
            <img :src="product.image_url" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div class="p-3 flex-1 flex flex-col justify-between" :class="{ 'opacity-50 grayscale': !product.is_available }">
          <div>
            <h3 class="font-bold text-gray-100 leading-tight mb-1">{{ product.name }}</h3>
            <span class="text-gold font-bold">${{ product.price.toFixed(2) }}</span>
            <span v-if="!product.is_available" class="block text-red-500 text-xs font-bold uppercase mt-1">Agotado</span>
          </div>
          <button 
            @click="product.is_available ? orderStore.addItem(product) : null"
            :disabled="!product.is_available"
            class="self-end mt-2 px-3 py-1 bg-white/10 text-xs border border-white/20 rounded transition-all uppercase font-bold tracking-wider"
            :class="product.is_available ? 'hover:bg-gold hover:text-black text-gold border-gold/30 cursor-pointer' : 'cursor-not-allowed text-gray-500'"
          >
            {{ product.is_available ? 'Agregar' : 'No disp.' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Cart Sheet -->
    <div v-if="orderStore.cart.length > 0" class="fixed bottom-0 left-0 right-0 bg-primary-panel border-t border-gold/30 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30 p-5 transform transition-transform">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-gold font-serif text-lg">Tu Pedido <span class="text-gray-500 text-sm font-sans">({{  orderStore.cart.reduce((a, b) => a + b.quantity, 0) }} items)</span></h2>
        <span class="text-2xl font-bold text-white">${{ orderStore.total.toFixed(2) }}</span>
      </div>

      <!-- Mini List of items (last 3 maybe?) -->
      <div class="flex space-x-3 overflow-x-auto pb-4 mb-2 scrollbar-hide">
         <div v-for="item in orderStore.cart" :key="item.product.id" class="flex-shrink-0 bg-white/5 rounded-lg p-2 min-w-[120px] border border-white/5 relative">
             <p class="text-xs text-gray-300 truncate w-24">{{ item.product.name }}</p>
             <div class="flex justify-between items-center mt-1">
                 <span class="text-xs text-gold">${{ item.product.price }}</span>
                 <div class="flex items-center space-x-2 bg-black/50 rounded px-1">
                    <button @click="orderStore.removeItem(item.product.id)" class="text-gray-400 hover:text-white">-</button>
                    <span class="text-xs font-bold">{{ item.quantity }}</span>
                    <button @click="orderStore.addItem(item.product)" class="text-gold hover:text-white">+</button>
                 </div>
             </div>
         </div>
      </div>

      <button 
        @click="sendToKitchen"
        class="w-full py-4 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold uppercase tracking-widest rounded-xl shadow-lg hover:brightness-110 transition-all flex justify-center items-center space-x-2"
      >
        <i class="fas fa-paper-plane"></i>
        <span>Enviar a Cocina</span>
      </button>
      
      <!-- Request Payment Button (only when eating) -->
      <button 
        v-if="tableStatus === 'eating'"
        @click="requestPayment"
        class="w-full py-4 mt-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg hover:brightness-110 transition-all flex justify-center items-center space-x-2"
      >
        <i class="fas fa-credit-card"></i>
        <span>Solicitar Cuenta</span>
      </button>
    </div>

  </div>
</template>
