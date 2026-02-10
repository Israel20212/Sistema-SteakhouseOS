<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useKitchenStore } from '../../stores/kitchen';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import { socket } from '../../socket';

import { useProductStore, type Product } from '../../stores/products';

const kitchenStore = useKitchenStore();
const productStore = useProductStore(); // Use product store
const authStore = useAuthStore();
const router = useRouter();

const showStockModal = ref(false);

onMounted(() => {
  kitchenStore.fetchOrders();
  productStore.fetchProducts(); // Load products for stock management
  
  socket.on('new_order', (order: any) => {
      // Add to list if pending/cooking
      if (['pending', 'cooking'].includes(order.status)) {
          kitchenStore.orders.push(order);
      }
  });

  socket.on('order_updated', (updatedOrder: any) => {
      const index = kitchenStore.orders.findIndex(o => o.id === updatedOrder.id);
      if (index !== -1) {
          if (['pending', 'cooking'].includes(updatedOrder.status)) {
             kitchenStore.orders[index] = updatedOrder;
          } else {
             // Remove if served/paid/ready (depending on view logic, KDS usually keeps Ready until Served)
             // If KDS shows Ready, keep it. If Served, remove.
             if (updatedOrder.status === 'served') {
                 kitchenStore.orders.splice(index, 1);
             } else {
                 kitchenStore.orders[index] = updatedOrder;
             }
          }
      } 
  });
});

onUnmounted(() => {
  socket.off('new_order');
  socket.off('order_updated');
});

const pendingOrders = computed(() => kitchenStore.orders.filter(o => o.status === 'pending'));
const cookingOrders = computed(() => kitchenStore.orders.filter(o => o.status === 'cooking'));

const logout = () => {
  authStore.logout();
  router.push('/');
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const toggleStock = async (product: Product) => {
    // Optimistic UI update handled by socket, but we trigger the action
    await productStore.toggleAvailability(product.id);
};
</script>

<template>
  <div class="min-h-screen bg-black text-white p-4 font-sans">
    
    <!-- Header -->
    <header class="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
      <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-serif text-gold">Cocina / KDS</h1>
          <button @click="showStockModal = true" class="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-sm font-bold border border-white/20 flex items-center">
              <i class="fas fa-boxes mr-2"></i> Stock (86)
          </button>
      </div>
      <button @click="logout" class="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition">
        Cerrar Turno
      </button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-100px)]">
      
      <!-- PENDING COLUMN -->
      <div class="bg-primary-panel rounded-xl p-4 border border-white/5 flex flex-col">
        <h2 class="text-xl font-bold mb-4 flex items-center text-red-400">
          <i class="fas fa-receipt mr-2"></i> PENDIENTES ({{ pendingOrders.length }})
        </h2>
        <div class="overflow-y-auto space-y-4 pr-2 custom-scrollbar flex-1">
          <div 
            v-for="order in pendingOrders" 
            :key="order.id"
            class="bg-white/5 border-l-4 border-red-500 rounded-r-lg p-4 shadow-lg animate-pulse"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <span v-if="order.Table" class="text-2xl font-bold text-white">Mesa {{ order.Table.number }}</span>
                <span v-else class="text-xl font-bold text-purple-400">
                    <i class="fas fa-shopping-bag mr-1"></i> {{ order.customer_name || 'PARA LLEVAR' }}
                </span>
                <p class="text-xs text-gray-400">Orden #{{ order.id }} • {{ formatTime(order.createdAt) }}</p>
              </div>
              <button 
                @click="kitchenStore.updateOrderStatus(order.id, 'cooking')"
                class="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500 rounded hover:bg-red-500 hover:text-white transition uppercase text-xs font-bold"
              >
                Empezar
              </button>
            </div>
            
            <ul class="space-y-1 mt-3">
              <li v-for="item in order.OrderItems" :key="item.id" class="flex justify-between items-center text-gray-200">
                <span class="font-bold text-lg text-gold">{{ item.quantity }}x</span>
                <span class="flex-1 ml-3 text-lg">{{ item.Product.name }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- COOKING COLUMN -->
      <div class="bg-primary-panel rounded-xl p-4 border border-white/5 flex flex-col">
        <h2 class="text-xl font-bold mb-4 flex items-center text-yellow-400">
          <i class="fas fa-fire mr-2"></i> PREPARANDO ({{ cookingOrders.length }})
        </h2>
        <div class="overflow-y-auto space-y-4 pr-2 custom-scrollbar flex-1">
          <div 
            v-for="order in cookingOrders" 
            :key="order.id"
            class="bg-white/5 border-l-4 border-yellow-500 rounded-r-lg p-4 shadow-lg"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <span v-if="order.Table" class="text-2xl font-bold text-white">Mesa {{ order.Table.number }}</span>
                <span v-else class="text-xl font-bold text-purple-400">
                    <i class="fas fa-shopping-bag mr-1"></i> {{ order.customer_name || 'PARA LLEVAR' }}
                </span>
                 <p class="text-xs text-gray-400">Orden #{{ order.id }} • {{ formatTime(order.createdAt) }}</p>
              </div>
              <button 
                @click="kitchenStore.updateOrderStatus(order.id, 'ready')"
                class="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500 rounded hover:bg-green-500 hover:text-white transition uppercase text-xs font-bold"
              >
                Terminar
              </button>
            </div>
            
            <ul class="space-y-1 mt-3">
              <li v-for="item in order.OrderItems" :key="item.id" class="flex justify-between items-center text-gray-200 opacity-80">
                <span class="font-bold">{{ item.quantity }}x</span>
                <span class="flex-1 ml-3">{{ item.Product.name }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>

    <!-- Stock Management Modal -->
    <div v-if="showStockModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-primary-panel border border-white/20 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div class="p-4 border-b border-white/10 flex justify-between items-center bg-black/40 rounded-t-xl">
                <h2 class="text-xl font-bold text-white"><i class="fas fa-boxes mr-2"></i> Gestión de Stock (86)</h2>
                <button @click="showStockModal = false" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            
            <div v-if="productStore.products.length === 0" class="p-6 text-center">
                <i class="fas fa-box-open text-6xl text-gray-600 mb-4"></i>
                <p class="text-gray-400 text-lg mb-2">No hay productos en el menú</p>
                <p class="text-gray-500 text-sm">Ve al Admin Dashboard para agregar productos primero.</p>
            </div>
            
            <div v-else class="p-6 overflow-y-auto custom-scrollbar grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div 
                    v-for="product in productStore.products" 
                    :key="product.id"
                    class="relative bg-white/5 border rounded-lg p-3 cursor-pointer transition-all hover:scale-105 active:scale-95 select-none"
                    :class="product.is_available ? 'border-green-500/30 hover:bg-green-500/10' : 'border-red-500 hover:bg-red-500/10 opacity-75'"
                    @click="toggleStock(product)"
                >
                    <div class="text-center">
                        <div class="mb-2 h-24 overflow-hidden rounded bg-black/50 flex items-center justify-center relative">
                            <span v-if="!product.is_available" class="absolute inset-0 flex items-center justify-center bg-black/60 text-red-500 font-black text-2xl uppercase tracking-widest border-2 border-red-500 m-2 rotate-12 z-10">AGOTADO</span>
                            <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover opacity-80" />
                            <i v-else class="fas fa-utensils text-2xl text-gray-600"></i>
                        </div>
                        <h3 class="font-bold text-sm leading-tight mb-1">{{ product.name }}</h3>
                        <p class="text-xs" :class="product.is_available ? 'text-green-400' : 'text-red-400 font-bold'">
                            {{ product.is_available ? 'DISPONIBLE' : 'NO DISPONIBLE' }}
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="p-4 border-t border-white/10 bg-black/40 text-center text-xs text-gray-500 rounded-b-xl">
                Toca un producto para cambiar su disponibilidad. Los meseros verán el cambio instantáneamente.
            </div>
        </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
</style>
