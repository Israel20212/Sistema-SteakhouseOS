<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useTableStore } from '../../stores/tables';
import QRCode from 'qrcode';

const tableStore = useTableStore();
const qrCodes = ref<Record<number, string>>({});

const generateQRs = async () => {
    const origin = window.location.origin;
    qrCodes.value = {}; // Reset
    for (const table of tableStore.tables) {
        try {
            const url = `${origin}/menu/table/${table.id}`;
            qrCodes.value[table.id] = await QRCode.toDataURL(url, { width: 300, margin: 2 });
        } catch (err) {
            console.error(err);
        }
    }
};

const createTable = async () => {
    await tableStore.addTable();
    await generateQRs(); // Regenerate for new table
};

onMounted(async () => {
    await tableStore.fetchTables();
    await generateQRs();
});

const print = () => {
    window.print();
};
</script>

<template>
    <div class="min-h-screen bg-white text-black p-8">
        
        <!-- No-Print Controls -->
        <div class="print:hidden flex justify-between items-center mb-8 bg-gray-100 p-4 rounded-lg shadow">
            <div>
                <h1 class="text-2xl font-bold font-serif">Fábrica de QRs</h1>
                <p class="text-gray-600">Genera e imprime los códigos para tus mesas.</p>
            </div>
            <div class="space-x-4">
                <button @click="$router.push('/admin')" class="px-4 py-2 text-gray-600 hover:text-black font-bold">
                    Volver
                </button>
                <button @click="createTable" class="px-4 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 transition">
                    <i class="fas fa-plus mr-2"></i> Mesa
                </button>
                <button @click="print" class="px-6 py-2 bg-black text-gold font-bold rounded shadow hover:bg-gray-800 transition">
                    <i class="fas fa-print mr-2"></i> Imprimir
                </button>
            </div>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-8 print:grid-cols-2">
            <div 
                v-for="table in tableStore.tables" 
                :key="table.id"
                class="border-4 border-black p-6 flex flex-col items-center justify-center text-center break-inside-avoid relative group"
            >
                <!-- Delete Button (Hidden on Print) -->
                <button 
                    @click="tableStore.deleteTable(table.id).then(generateQRs)" 
                    class="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition print:hidden bg-white rounded-full p-1"
                >
                    <i class="fas fa-trash"></i>
                </button>

                <div class="absolute top-0 left-0 w-full h-4 bg-black"></div>
                
                <h2 class="text-4xl font-serif font-bold mt-4 mb-2">MESA {{ table.number }}</h2>
                <p class="text-xs tracking-[0.3em] uppercase mb-4">Escanea para pedir</p>
                
                <img v-if="qrCodes[table.id]" :src="qrCodes[table.id]" class="w-48 h-48" />
                <div v-else class="w-48 h-48 bg-gray-200 animate-pulse"></div>

                <div class="mt-4 text-sm font-bold">STEAKHOUSE OS</div>
                
                <div class="absolute bottom-0 left-0 w-full h-4 bg-gold"></div>
            </div>
        </div>
    </div>
</template>

<style>
@media print {
    @page { margin: 1cm; }
    body { background: white; }
    .print\:hidden { display: none !important; }
    .print\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
