<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTableStore } from '../../stores/tables';
import { useAuthStore } from '../../stores/auth';
import { socket } from '../../socket';

const tableStore = useTableStore();
const authStore = useAuthStore();
const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const roleLabel = computed(() => {
  switch (authStore.user?.role) {
    case 'superuser': return 'Superusuario';
    case 'admin': return 'Administrador';
    case 'waiter': return 'Mesero';
    case 'kitchen': return 'Cocina';
    case 'cashier': return 'Cajero';
    default: return 'Usuario';
  }
});


onMounted(() => {
  tableStore.fetchTables();
  
  socket.on('table_updated', (updatedTable: any) => {
    const index = tableStore.tables.findIndex(t => t.id === updatedTable.id);
    if (index !== -1) {
      tableStore.tables[index] = updatedTable;
    } else {
      // Typically tables are static, but if dynamic, add it
      tableStore.tables.push(updatedTable);
    }
  });

  // Listen for calls
  socket.on('waiter_called', (tableId: number) => {
    // Play sound (optional, browser policy requires interaction first)
    // alert(`¡Atención! La Mesa ${tableId} solicita ayuda.`); 
    // Better: Add to notification list
    showNotification(`¡Mesa ${tableId} solicita ayuda!`);
  });
});

const notifications = ref<string[]>([]);
const showNotification = (msg: string) => {
    notifications.value.push(msg);
    setTimeout(() => {
        notifications.value.shift();
    }, 10000);
};

onUnmounted(() => {
    socket.off('table_updated');
});

const handleTableClick = async (table: any) => {
  const token = sessionStorage.getItem('token');
  
  try {
    switch (table.status) {
      case 'free':
        // Occupy the table
      const response = await fetch(`${API_URL}/api/tables/${table.id}/occupy`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        showNotification(`Mesa ${table.number} marcada como ocupada`);
        break;
        
      case 'occupied':
      case 'waiting_food':
      case 'eating':
        // Go to order page
        router.push(`/waiter/table/${table.id}/order`);
        break;
        
      case 'paying':
        // Just view, cashier handles payment
        router.push(`/waiter/table/${table.id}/order`);
        break;
        
      case 'dirty':
        // Clean the table
      const response = await fetch(`${API_URL}/api/tables/${table.id}/clean`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        showNotification(`Mesa ${table.number} limpiada y lista`);
        break;
    }
  } catch (error) {
    console.error('Error handling table action:', error);
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'free': return 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gold';
    case 'occupied': return 'bg-yellow-900/40 border-yellow-600 text-yellow-500';
    case 'waiting_food': return 'bg-orange-900/40 border-orange-600 text-orange-500';
    case 'eating': return 'bg-green-900/40 border-green-600 text-green-400';
    case 'paying': return 'bg-blue-900/40 border-blue-600 text-blue-400';
    case 'dirty': return 'bg-purple-900/40 border-purple-600 text-purple-400';
    default: return 'bg-gray-800';
  }
};

</script>

<template>
  <div class="min-h-screen bg-primary pb-20">
    <!-- Header -->
    <header class="bg-primary-panel border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-90 flex justify-between items-center">
      <div>
        <h1 class="text-xl text-gold font-bold">{{ roleLabel }}: {{ authStore.user?.username }}</h1>
        <p class="text-xs text-gray-500">Zona Principal</p>
      </div>
      <button @click="authStore.logout()" class="text-xs text-red-400 border border-red-900/50 px-3 py-1 rounded hover:bg-red-900/20">
        Salir
      </button>
    </header>

    <!-- Tables Grid -->
    <div class="p-6">
      <h2 class="text-white/60 text-sm uppercase tracking-widest mb-4">Mapa de Mesas</h2>
      
      <div v-if="tableStore.isLoading" class="text-center text-gray-500 py-20 flex flex-col items-center">
        <i class="fas fa-spinner fa-spin text-3xl mb-4 text-gold"></i>
        <p>Cargando mesas...</p>
      </div>

      <div v-else-if="tableStore.tables.length === 0" class="text-center py-20 border-2 border-dashed border-gray-700 rounded-2xl bg-gray-900/50">
        <div class="mb-4 text-gray-400">
            <i class="fas fa-chair text-4xl mb-2 opacity-50"></i>
            <p class="text-lg">No hay mesas configuradas</p>
            <p class="text-xs text-gray-500">El sistema está limpio.</p>
        </div>
        <button 
            v-if="authStore.user?.role === 'admin' || authStore.user?.role === 'superuser'"
            @click="tableStore.addTable()" 
            class="px-6 py-2 bg-gold text-black font-bold rounded hover:bg-gold-hover transition-colors shadow-lg shadow-gold/10"
        >
            <i class="fas fa-plus mr-2"></i> Inicializar Mesas
        </button>
        <p v-else class="text-xs text-red-400 mt-2">
            <i class="fas fa-lock mr-1"></i> Solo el Administrador puede crear mesas.
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div 
          v-for="table in tableStore.tables" 
          :key="table.id"
          @click="handleTableClick(table)"
          class="aspect-square rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg relative overflow-hidden group"
          :class="getStatusColor(table.status)"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <span class="text-3xl font-serif font-bold mb-1">{{ table.number }}</span>
          <span class="text-xs uppercase tracking-wider font-bold opacity-80">{{ table.status.replace('_', ' ') }}</span>
          
          <!-- Action Label based on Status -->
          <div class="absolute bottom-3 text-[10px] uppercase tracking-widest opacity-60">
            <template v-if="table.status === 'free'">Tocar para Ocupar</template>
            <template v-else-if="table.status === 'occupied'">Tocar para Orden</template>
            <template v-else-if="table.status === 'dirty'">Tocar para Limpiar</template>
            <template v-else>Ver Detalles</template>
          </div>
          
          <!-- Status Indicator Dot -->
          <div class="absolute top-3 right-3 w-3 h-3 rounded-full shadow-current shadow-[0_0_8px] bg-current"></div>
        </div>
      </div>
    </div>

    <!-- Floating Action Button (Example for creating quick order, maybe not needed if clicking table works) -->

    <!-- Notifications Toast -->
    <div class="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        <div 
            v-for="(note, idx) in notifications" 
            :key="idx"
            class="bg-red-600 text-white px-4 py-3 rounded shadow-2xl flex items-center animate-bounce pointer-events-auto border border-red-400"
        >
            <i class="fas fa-bell mr-3 text-xl"></i>
            <span class="font-bold uppercase tracking-wider">{{ note }}</span>
            <button @click="notifications.splice(idx, 1)" class="ml-4 text-white/50 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
  </div>
</template>
