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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const stats = ref<{ sales: number, orders: number, active: number, averageTicket: number } | null>(null);
const topProducts = ref<any[]>([]);

onMounted(async () => {
    await fetchStats();
    await fetchTopProducts();
});

const fetchStats = async () => {
    try {
        const response = await fetch(`${API_URL}/api/reports/stats`);
        if (response.ok) stats.value = await response.json();
    } catch (error) {
        console.error(error);
    }
};

const fetchTopProducts = async () => {
    try {
        const response = await fetch(`${API_URL}/api/reports/top-products`);
        if (response.ok) topProducts.value = await response.json();
    } catch (error) {
        console.error(error);
    }
};

const chartData = computed(() => {
    return {
        labels: topProducts.value.map(p => p.name),
        datasets: [
            {
                label: 'Cantidad Vendida',
                backgroundColor: '#D4AF37',
                data: topProducts.value.map(p => p.total_quantity)
            }
        ]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: 'white' }
        }
    },
    scales: {
        x: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
        }
    }
}
</script>

<template>
  <div class="min-h-screen bg-primary pb-20 font-sans text-white">
    
    <header class="bg-primary-panel border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-90 flex justify-between items-center">
        <div>
            <h1 class="text-xl text-gold font-bold font-serif">Reportes y Analíticas</h1>
            <p class="text-xs text-gray-500">Métricas de rendimiento en tiempo real</p>
        </div>
        <div class="flex space-x-3">
             <button @click="router.push('/admin')" class="border border-gold/50 text-gold px-4 py-2 rounded font-bold text-sm hover:bg-gold/10">
                <i class="fas fa-arrow-left mr-1"></i> Volver a Menú
            </button>
            <button @click="authStore.logout()" class="text-red-400 border border-red-900/50 px-3 py-2 rounded hover:bg-red-900/20 text-sm">
                Salir
            </button>
        </div>
    </header>

    <div class="p-6 max-w-6xl mx-auto space-y-6">
        
        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-primary-panel border border-white/10 rounded-xl p-6 shadow-lg">
                <div class="text-gray-400 text-xs uppercase mb-1">Ventas Totales</div>
                <div class="text-2xl font-bold text-green-400">${{ stats?.sales || 0 }}</div>
            </div>
            <div class="bg-primary-panel border border-white/10 rounded-xl p-6 shadow-lg">
                <div class="text-gray-400 text-xs uppercase mb-1">Pedidos Totales</div>
                <div class="text-2xl font-bold text-blue-400">{{ stats?.orders || 0 }}</div>
            </div>
             <div class="bg-primary-panel border border-white/10 rounded-xl p-6 shadow-lg">
                <div class="text-gray-400 text-xs uppercase mb-1">Ticket Promedio</div>
                <div class="text-2xl font-bold text-purple-400">${{ stats?.averageTicket?.toFixed(2) || 0 }}</div>
            </div>
             <div class="bg-primary-panel border border-white/10 rounded-xl p-6 shadow-lg">
                <div class="text-gray-400 text-xs uppercase mb-1">Pedidos Activos</div>
                <div class="text-2xl font-bold text-yellow-400">{{ stats?.active || 0 }}</div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-primary-panel border border-white/10 rounded-xl p-6 shadow-lg h-96">
                <h3 class="text-lg font-bold mb-4 border-b border-white/5 pb-2">Top Productos Vendidos</h3>
                <div class="h-full pb-10">
                    <Bar :data="chartData" :options="chartOptions" />
                </div>
            </div>
             <div class="bg-primary-panel border border-white/10 rounded-xl p-6 shadow-lg flex items-center justify-center text-gray-500">
                <p>Próximamente más reportes...</p>
            </div>
        </div>

    </div>

  </div>
</template>
