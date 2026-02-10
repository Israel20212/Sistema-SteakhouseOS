<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const authStore = useAuthStore();
const router = useRouter();

const stats = ref<{ sales: number, orders: number, active: number, averageTicket: number } | null>(null);
const topProducts = ref<any[]>([]);

onMounted(async () => {
    await fetchStats();
    await fetchTopProducts();
});

const fetchStats = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/reports/stats');
        if (response.ok) stats.value = await response.json();
    } catch (error) {
        console.error(error);
    }
};

const fetchTopProducts = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/reports/top-products');
        if (response.ok) topProducts.value = await response.json();
    } catch (error) {
        console.error(error);
    }
};

const chartData = computed(() => {
    return {
        labels: topProducts.value.map(p => p.Product?.name || 'Desconocido'),
        datasets: [
            {
                label: 'Cantidad Vendida (Histórico)',
                backgroundColor: '#D4AF37', // Gold
                data: topProducts.value.map(p => p.total_quantity)
            }
        ]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: 'white' } },
        title: { display: true, text: 'Top 5 Productos Más Vendidos', color: 'white' }
    },
    scales: {
        y: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        x: { ticks: { color: 'gray' }, grid: { display: false } }
    }
};

const logout = () => {
    authStore.logout();
    router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-primary pb-20 font-sans text-white">
    
    <header class="bg-primary-panel border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-90 flex justify-between items-center">
        <div>
            <h1 class="text-xl text-gold font-bold font-serif">Analíticas</h1>
            <p class="text-xs text-gray-500">Reporte del Día: {{ new Date().toLocaleDateString() }}</p>
        </div>
        <div class="flex space-x-3">
             <button @click="router.push('/admin')" class="border border-gold/50 text-gold px-4 py-2 rounded font-bold text-sm hover:bg-gold/10">
                <i class="fas fa-arrow-left mr-1"></i> Volver a Menú
            </button>
            <button @click="logout" class="text-red-400 border border-red-900/50 px-3 py-2 rounded hover:bg-red-900/20 text-sm">
                Salir
            </button>
        </div>
    </header>

    <div class="p-6 max-w-7xl mx-auto space-y-8">
        
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-primary-panel border border-white/10 p-6 rounded-xl shadow-lg">
                <p class="text-gray-400 text-xs uppercase font-bold tracking-widest">Ventas Hoy</p>
                <div class="mt-2 text-3xl font-serif font-bold text-gold">${{ stats?.sales.toFixed(2) || '0.00' }}</div>
            </div>
             <div class="bg-primary-panel border border-white/10 p-6 rounded-xl shadow-lg">
                <p class="text-gray-400 text-xs uppercase font-bold tracking-widest">Ordenes Pagadas</p>
                <div class="mt-2 text-3xl font-serif font-bold text-white">{{ stats?.orders || 0 }}</div>
            </div>
             <div class="bg-primary-panel border border-white/10 p-6 rounded-xl shadow-lg">
                <p class="text-gray-400 text-xs uppercase font-bold tracking-widest">Ticket Promedio</p>
                <div class="mt-2 text-3xl font-serif font-bold text-green-400">${{ stats?.averageTicket.toFixed(2) || '0.00' }}</div>
            </div>
             <div class="bg-primary-panel border border-white/10 p-6 rounded-xl shadow-lg">
                <p class="text-gray-400 text-xs uppercase font-bold tracking-widest">En Cocina</p>
                <div class="mt-2 text-3xl font-serif font-bold text-red-400 animate-pulse">{{ stats?.active || 0 }}</div>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Top Products Chart -->
            <div class="bg-primary-panel border border-white/10 p-6 rounded-xl shadow-lg h-96">
                <Bar v-if="topProducts.length > 0" :data="chartData" :options="chartOptions" />
                <div v-else class="h-full flex flex-col items-center justify-center text-gray-500">
                    <i class="fas fa-chart-bar text-4xl mb-3 opacity-50"></i>
                    <p>No hay datos de ventas registrados aún.</p>
                </div>
            </div>

            <!-- Recent Activity List (Mockup/Simple list) -->
            <div class="bg-primary-panel border border-white/10 p-6 rounded-xl shadow-lg h-96 overflow-y-auto custom-scrollbar">
                <h3 class="text-lg font-bold text-white mb-4">Productos Top</h3>
                <ul class="space-y-3">
                    <li v-for="(prod, index) in topProducts" :key="index" class="flex justify-between items-center bg-white/5 p-3 rounded">
                        <div class="flex items-center">
                            <span class="text-gold font-bold mr-3 text-xl">#{{ index + 1 }}</span>
                            <div>
                                <p class="font-bold text-white">{{ prod.Product?.name }}</p>
                                <p class="text-xs text-gray-400">${{ prod.Product?.price }} c/u</p>
                            </div>
                        </div>
                        <span class="bg-gold/20 text-gold px-2 py-1 rounded text-sm font-bold">{{ prod.total_quantity }} vendidos</span>
                    </li>
                </ul>
            </div>
        </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
</style>
