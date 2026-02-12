<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const form = ref({
    restaurant_name: '',
    primary_color: '#000000',
    secondary_color: '#FFFFFF',
    accent_color: '#D4AF37',
    logo_url: '',
    // Ticket customization
    ticket_slogan: '',
    ticket_address: '',
    ticket_phone: '',
    ticket_footer: '',
    ticket_footer_2: ''
});

const isSaving = ref(false);

onMounted(async () => {
    await settingsStore.fetchSettings();
    form.value.restaurant_name = settingsStore.restaurantName;
    form.value.primary_color = settingsStore.primaryColor;
    form.value.secondary_color = settingsStore.secondaryColor;
    form.value.accent_color = settingsStore.accentColor;
    form.value.logo_url = settingsStore.logoUrl || '';
    form.value.ticket_slogan = settingsStore.ticketSlogan || '';
    form.value.ticket_address = settingsStore.ticketAddress || '';
    form.value.ticket_phone = settingsStore.ticketPhone || '';
    form.value.ticket_footer = settingsStore.ticketFooter || '';
    form.value.ticket_footer_2 = settingsStore.ticketFooter2 || '';
});

const saveSettings = async () => {
    isSaving.value = true;
    try {
        const response = await fetch(`${API_URL}/api/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.token}`
            },
            body: JSON.stringify(form.value)
        });

        if (response.ok) {
            await settingsStore.fetchSettings(); // Refresh global state
            alert('Configuración guardada exitosamente.');
        } else {
            alert('Error al guardar configuración.');
        }
    } catch (e) {
        console.error(e);
        alert('Error de red');
    } finally {
        isSaving.value = false;
    }
};

const resetSettings = async () => {
    if(!confirm('¿Estás seguro de restablecer la configuración de fábrica? Se perderán todos los cambios de diseño.')) return;

    try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/settings/reset`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Configuración restablecida. Recargando...');
            window.location.reload();
        } else {
            alert('Error al restablecer');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
};
</script>

<template>
  <div class="min-h-screen bg-primary pb-20 font-sans text-white">
    
    <header class="bg-primary-panel border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-90 flex justify-between items-center">
        <div>
            <h1 class="text-xl text-gold font-bold font-serif">Panel de Control</h1>
            <p class="text-xs text-gray-500">Configuración global del sistema</p>
        </div>
        <div class="flex space-x-3">
             <button @click="router.push('/dashboard')" class="border border-gold/50 text-gold px-4 py-2 rounded font-bold text-sm hover:bg-gold/10">
                <i class="fas fa-arrow-left mr-1"></i> Ir a POS
            </button>
            <button @click="authStore.logout()" class="text-red-400 border border-red-900/50 px-3 py-2 rounded hover:bg-red-900/20 text-sm">
                Salir
            </button>
        </div>
    </header>

    <div class="p-6 max-w-4xl mx-auto space-y-8">
        
        <!-- Branding Section -->
        <section class="bg-primary-panel border border-white/10 rounded-xl p-6 shadow-lg">
            <h2 class="text-lg font-bold mb-4 text-gold border-b border-white/5 pb-2">Identidad de Marca</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Nombre del Restaurante</label>
                    <input v-model="form.restaurant_name" type="text" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">URL del Logo</label>
                    <input v-model="form.logo_url" type="text" placeholder="https://..." class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Color Primario</label>
                    <div class="flex items-center space-x-2">
                        <input v-model="form.primary_color" type="color" class="h-10 w-10 rounded cursor-pointer border-none bg-transparent" />
                        <span class="text-xs font-mono text-gray-400">{{ form.primary_color }}</span>
                    </div>
                </div>
                 <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Color Secundario</label>
                    <div class="flex items-center space-x-2">
                        <input v-model="form.secondary_color" type="color" class="h-10 w-10 rounded cursor-pointer border-none bg-transparent" />
                        <span class="text-xs font-mono text-gray-400">{{ form.secondary_color }}</span>
                    </div>
                </div>
                 <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Color Acento (Gold)</label>
                    <div class="flex items-center space-x-2">
                        <input v-model="form.accent_color" type="color" class="h-10 w-10 rounded cursor-pointer border-none bg-transparent" />
                        <span class="text-xs font-mono text-gray-400">{{ form.accent_color }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Ticket Customization Section -->
        <section class="bg-primary-panel border border-white/10 rounded-xl p-6 shadow-lg">
            <h2 class="text-lg font-bold mb-4 text-gold border-b border-white/5 pb-2">Personalización de Tickets</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="col-span-2">
                    <label class="block text-xs uppercase text-gray-500 mb-1">Slogan del Restaurante</label>
                    <input v-model="form.ticket_slogan" type="text" placeholder="Ej: Prime Cuts & Drinks" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Dirección</label>
                    <input v-model="form.ticket_address" type="text" placeholder="Ej: Calle Principal #123" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Teléfono</label>
                    <input v-model="form.ticket_phone" type="text" placeholder="Ej: 555-0199" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Mensaje Pie de Página 1</label>
                    <input v-model="form.ticket_footer" type="text" placeholder="Ej: ¡Gracias por su visita!" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Mensaje Pie de Página 2</label>
                    <input v-model="form.ticket_footer_2" type="text" placeholder="Ej: Propina no incluida" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
            </div>
        </section>
        
        <div class="flex justify-end space-x-4">
             <button @click="resetSettings" class="px-6 py-3 rounded font-bold text-gray-400 hover:text-white hover:bg-white/5 transition">
                Restablecer Fábrica
            </button>
            <button @click="saveSettings" :disabled="isSaving" class="bg-gold hover:bg-yellow-500 text-black px-8 py-3 rounded font-bold shadow-lg transition transform active:scale-95 disabled:opacity-50">
                {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
        </div>

    </div>

  </div>
</template>
