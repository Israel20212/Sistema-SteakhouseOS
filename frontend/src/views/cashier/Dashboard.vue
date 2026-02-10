<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useCashierStore } from '../../stores/cashier';
import { useAuthStore } from '../../stores/auth';
import { useSettingsStore } from '../../stores/settings';
import { useRouter } from 'vue-router';
import { socket } from '../../socket';

const cashierStore = useCashierStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();

const paymentMethods = ref<Record<number, string>>({});

onMounted(async () => {
  await cashierStore.fetchActiveOrders();
  await settingsStore.fetchSettings();
  
  socket.on('new_order', (order: any) => {
      cashierStore.orders.push(order);
  });

  socket.on('order_updated', (updatedOrder: any) => {
      const index = cashierStore.orders.findIndex(o => o.id === updatedOrder.id);
      if (index !== -1) {
          cashierStore.orders[index] = updatedOrder;
      }
  });

  socket.on('order_paid', ({ orderId }: { orderId: number }) => {
      const index = cashierStore.orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
          cashierStore.orders.splice(index, 1);
      }
  });
});

// Initialize default payment method
const getPaymentMethod = (orderId: number) => {
    if (!paymentMethods.value[orderId]) {
        paymentMethods.value[orderId] = 'Efectivo';
    }
    return paymentMethods.value[orderId];
};

onUnmounted(() => {
    socket.off('new_order');
    socket.off('order_updated');
    socket.off('order_paid');
});

const calculateTotal = (order: any) => {
    return Number(order.total).toFixed(2);
};

import { jsPDF } from 'jspdf';

const handlePay = async (orderId: number, tableNumber: string, total: string) => {
    const method = paymentMethods.value[orderId] || 'Efectivo';
    
    // Removed auto-print to allow user to choose when to print
    // printTicket(cashierStore.orders.find(o => o.id === orderId));

    if (!confirm(`¿Cobrar $${total} a la Mesa ${tableNumber} con ${method}?`)) return;
    
    const success = await cashierStore.payOrder(orderId);
    if (success) {
        // Optional: Ask to print after payment success? 
        // For now, we rely on the manual button or we could ask here.
        // if(confirm("¿Imprimir recibo?")) printTicket(...);
        alert('Cobro realizado y mesa liberada.');
    } else {
        alert('Error al procesar el cobro');
    }
};

const printTicket = (order: any) => {
    if (!order) return;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200]
    });

    const centerX = 40;
    let y = 10;

    // Header - Use settings from store
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(settingsStore.restaurantName || "Restaurant", centerX, y, { align: "center" });
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Slogan (if exists)
    if (settingsStore.ticketSlogan) {
        doc.text(settingsStore.ticketSlogan, centerX, y, { align: "center" });
        y += 5;
    }
    
    // Address (if exists)
    if (settingsStore.ticketAddress) {
        doc.text(settingsStore.ticketAddress, centerX, y, { align: "center" });
        y += 5;
    }
    
    // Phone (if exists)
    if (settingsStore.ticketPhone) {
        doc.text(settingsStore.ticketPhone, centerX, y, { align: "center" });
        y += 5;
    }
    
    doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, centerX, y, { align: "center" });
    y += 5;
    doc.text("---------------------------------------------", centerX, y, { align: "center" });
    y += 5;

    // Order Info
    doc.text(`Orden: #${order.id}`, 5, y);
    
    // Show customer name for takeout, table number for dine-in
    const orderType = (order as any).order_type;
    const customerName = (order as any).customer_name;
    
    if (orderType === 'takeout' || orderType === 'pickup') {
        doc.text(`Cliente: ${customerName || 'Para Llevar'}`, 75, y, { align: "right" });
    } else {
        doc.text(`Mesa: ${order.Table?.number || 'N/A'}`, 75, y, { align: "right" });
    }
    
    y += 5;
    doc.text("---------------------------------------------", centerX, y, { align: "center" });
    y += 5;

    // Items
    doc.setFontSize(9);
    order.OrderItems.forEach((item: any) => {
        const name = item.Product.name.length > 20 ? item.Product.name.substring(0, 20) + '...' : item.Product.name;
        doc.text(`${item.quantity}x ${name}`, 5, y);
        const price = (Number(item.Product.price) * item.quantity).toFixed(2);
        doc.text(`$${price}`, 75, y, { align: "right" });
        y += 5;
    });

    y += 2;
    doc.text("---------------------------------------------", centerX, y, { align: "center" });
    y += 5;

    // Totals
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const total = Number(order.total).toFixed(2);
    doc.text(`TOTAL: $${total}`, 75, y, { align: "right" });
    y += 8;

    // Takeout indicator
    if (orderType === 'takeout' || orderType === 'pickup') {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("*** PARA LLEVAR ***", centerX, y, { align: "center" });
        y += 6;
    }

    // Footer - Use settings from store
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    
    if (settingsStore.ticketFooter) {
        doc.text(settingsStore.ticketFooter, centerX, y, { align: "center" });
        y += 5;
    }
    
    if (settingsStore.ticketFooter2) {
        doc.text(settingsStore.ticketFooter2, centerX, y, { align: "center" });
    }

    // Print via silent iframe
    const pdfBlobUrl: string = doc.output('bloburl').toString();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfBlobUrl;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
        iframe.contentWindow?.print();
        // Clean up after 1 minute (sufficient time for print dialog)
        setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(pdfBlobUrl);
        }, 60000);
    };
};


const logout = () => {
    authStore.logout();
    router.push('/');
};

const sortedOrders = computed(() => {
    // Sort by status priority (Ready/Served first, then Cooking/Pending)
    return [...cashierStore.orders].sort((a, b) => {
        const priority: Record<string, number> = { 'served': 0, 'ready': 1, 'cooking': 2, 'pending': 3, 'paid': 4 };
        return (priority[a.status] || 99) - (priority[b.status] || 99);
    });
});

const dineInOrders = computed(() => {
    return sortedOrders.value.filter(o => !o.order_type || o.order_type === 'dine-in');
});

const takeoutOrders = computed(() => {
    return sortedOrders.value.filter(o => o.order_type === 'takeout' || o.order_type === 'pickup');
});
</script>

<template>
  <div class="min-h-screen bg-primary pb-20">
    
    <!-- Header -->
    <header class="bg-primary-panel border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-90 flex justify-between items-center">
      <div>
        <h1 class="text-xl text-gold font-bold font-serif">Caja Principal</h1>
        <p class="text-xs text-gray-500">Turno de {{ authStore.user?.username }}</p>
      </div>
      <button @click="logout" class="text-xs text-red-400 border border-red-900/50 px-3 py-1 rounded hover:bg-red-900/20">
        Cerrar Turno
      </button>
    </header>

    <!-- Section Headers -->
    <div class="p-6">
        <!-- Dine-In Orders Section -->
        <div class="mb-8">
            <h2 class="text-2xl font-serif text-gold mb-4 flex items-center">
                <i class="fas fa-utensils mr-2"></i>
                Órdenes en Mesa ({{ dineInOrders.length }})
            </h2>
            
            <div v-if="dineInOrders.length === 0" class="text-center py-10 bg-white/5 rounded-xl">
                <p class="text-gray-500">No hay cuentas de mesa abiertas</p>
            </div>
            
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                    v-for="order in dineInOrders" 
                    :key="order.id"
                    class="bg-primary-panel border rounded-xl overflow-hidden shadow-lg transition-all hover:border-gold/30"
                    :class="{
                        'border-green-500/50': order.status === 'served',
                        'border-yellow-500/50': order.status === 'ready',
                        'border-white/10': ['pending', 'cooking'].includes(order.status)
                    }"
                >
                    <!-- Card Header -->
                    <div class="p-4 bg-white/5 flex justify-between items-start border-b border-white/5">
                        <div>
                            <h3 class="text-2xl font-serif text-white font-bold">Mesa {{ order.Table?.number || 'N/A' }}</h3>
                            <span class="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded"
                                :class="{
                                    'bg-green-500/20 text-green-400': order.status === 'served',
                                    'bg-yellow-500/20 text-yellow-400': order.status === 'ready',
                                    'bg-red-500/20 text-red-400': ['pending', 'cooking'].includes(order.status)
                                }"
                            >
                                {{ order.status === 'served' ? 'LISTO PARA PAGAR' : order.status }}
                            </span>
                        </div>
                        <div class="text-right">
                            <div class="text-3xl font-bold text-gold">${{ calculateTotal(order) }}</div>
                            <div class="text-xs text-gray-500">Orden #{{ order.id }}</div>
                        </div>
                    </div>

            <!-- Validation Info -->
            <div class="p-4 space-y-3">
                
                <!-- Items Summary (First 3) -->
                <div class="bg-black/20 rounded p-3 text-sm text-gray-300">
                    <ul class="space-y-1">
                        <li v-for="item in order.OrderItems.slice(0, 3)" :key="item.id" class="flex justify-between">
                            <span>{{ item.quantity }}x {{ item.Product.name }}</span>
                        </li>
                        <li v-if="order.OrderItems.length > 3" class="text-xs text-gray-500 italic text-center pt-1">
                            +{{ order.OrderItems.length - 3 }} items más...
                        </li>
                    </ul>
                </div>

                <!-- Payment Action -->
                <div class="pt-2">
                    <label class="block text-xs uppercase text-gray-500 mb-1">Método de Pago</label>
                    <select 
                        :value="getPaymentMethod(order.id)" 
                        @input="(e) => paymentMethods[order.id] = (e.target as HTMLSelectElement).value"
                        class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white mb-3 focus:border-gold outline-none"
                    >
                        <option>Efectivo</option>
                        <option>Tarjeta de Crédito</option>
                        <option>Tarjeta de Débito</option>
                        <option>Transferencia</option>
                    </select>

                    <div class="flex space-x-2">
                        <button 
                            @click="printTicket(order)"
                            class="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest rounded shadow px-4"
                            title="Imprimir Ticket"
                        >
                            <i class="fas fa-print"></i>
                        </button>
                        <button 
                            @click="handlePay(order.id, order.Table?.number || 'N/A', calculateTotal(order))"
                            class="flex-[3] py-3 bg-gold hover:bg-yellow-500 text-black font-bold uppercase tracking-widest rounded shadow-lg transition-colors flex justify-center items-center"
                        >
                            <i class="fas fa-cash-register mr-2"></i> Cobrar
                        </button>
                    </div>
                </div>

            </div>
        </div>
            </div>
        </div>

        <!-- Takeout Orders Section -->
        <div class="mb-8">
            <h2 class="text-2xl font-serif text-gold mb-4 flex items-center">
                <i class="fas fa-shopping-bag mr-2"></i>
                Órdenes Para Llevar ({{ takeoutOrders.length }})
            </h2>
            
            <div v-if="takeoutOrders.length === 0" class="text-center py-10 bg-white/5 rounded-xl">
                <p class="text-gray-500">No hay órdenes para llevar</p>
            </div>
            
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                    v-for="order in takeoutOrders" 
                    :key="order.id"
                    class="bg-primary-panel border rounded-xl overflow-hidden shadow-lg transition-all hover:border-gold/30 border-purple-500/50"
                >
                    <!-- Card Header -->
                    <div class="p-4 bg-gradient-to-r from-purple-900/30 to-purple-800/20 flex justify-between items-start border-b border-purple-500/20">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <i class="fas fa-shopping-bag text-purple-400"></i>
                                <h3 class="text-xl font-serif text-white font-bold">Para Llevar</h3>
                            </div>
                            <p v-if="(order as any).customer_name" class="text-sm text-purple-300">{{ (order as any).customer_name }}</p>
                            <span class="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                {{ order.status === 'served' ? 'LISTO PARA RECOGER' : order.status }}
                            </span>
                        </div>
                        <div class="text-right">
                            <div class="text-3xl font-bold text-gold">${{ calculateTotal(order) }}</div>
                            <div class="text-xs text-gray-500">Orden #{{ order.id }}</div>
                        </div>
                    </div>

                    <!-- Items Summary -->
                    <div class="p-4 space-y-3">
                        <div class="bg-black/20 rounded p-3 text-sm text-gray-300">
                            <ul class="space-y-1">
                                <li v-for="item in order.OrderItems.slice(0, 3)" :key="item.id" class="flex justify-between">
                                    <span>{{ item.quantity }}x {{ item.Product.name }}</span>
                                </li>
                                <li v-if="order.OrderItems.length > 3" class="text-xs text-gray-500 italic text-center pt-1">
                                    +{{ order.OrderItems.length - 3 }} items más...
                                </li>
                            </ul>
                        </div>

                        <!-- Payment Action -->
                        <div class="pt-2">
                            <label class="block text-xs uppercase text-gray-500 mb-1">Método de Pago</label>
                            <select 
                                :value="getPaymentMethod(order.id)" 
                                @input="(e) => paymentMethods[order.id] = (e.target as HTMLSelectElement).value"
                                class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white mb-3 focus:border-purple-500 outline-none"
                            >
                                <option>Efectivo</option>
                                <option>Tarjeta de Crédito</option>
                                <option>Tarjeta de Débito</option>
                                <option>Transferencia</option>
                            </select>

                            <div class="flex space-x-2">
                                <button 
                                    @click="printTicket(order)"
                                    class="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest rounded shadow px-4"
                                    title="Imprimir Ticket"
                                >
                                    <i class="fas fa-print"></i>
                                </button>
                                <button 
                                    @click="handlePay(order.id, 'PARA LLEVAR', calculateTotal(order))"
                                    class="flex-[3] py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest rounded shadow-lg transition-colors flex justify-center items-center"
                                >
                                    <i class="fas fa-cash-register mr-2"></i> Cobrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>
