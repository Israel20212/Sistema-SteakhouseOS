<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const router = useRouter();

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
        const response = await fetch('http://localhost:3000/api/settings', {
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
        alert('Error de conexión.');
    } finally {
        isSaving.value = false;
    }
};

const logout = () => {
    authStore.logout();
    router.push('/');
};

const handleFactoryReset = async () => {
    const confirmation1 = window.confirm('⚠️ ¡ADVERTENCIA CRÍTICA! ⚠️\n\nEstás a punto de BORRAR TODOS LOS DATOS del sistema:\n- Menú Completo\n- Todas las Ventas y Órdenes\n- Configuración de Mesas\n- Marca y Colores Personalizados\n\n¿Estás 100% seguro de querer continuar?');
    
    if (!confirmation1) return;

    const confirmation2 = window.prompt('Para confirmar esta acción DESTRUCTIVA, escribe "BORRAR TODO" en el cuadro de abajo:');
    
    if (confirmation2 !== 'BORRAR TODO') {
        alert('Acción cancelada. El texto de confirmación no coincide.');
        return;
    }

    try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/settings/reset', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('♻️ Restauración completada con éxito.\nEl sistema ha vuelto a su estado original.');
            // Reload settings and form
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
        } else {
            alert('Error al restaurar el sistema.');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión.');
    }
};
</script>

<template>
    <div class="min-h-screen bg-gray-900 text-white p-8">
        <div class="max-w-4xl mx-auto">
            <div class="flex justify-between items-center mb-10">
                <h1 class="text-3xl font-bold text-gold"> <i class="fas fa-crown mr-2"></i> Panel Superusuario</h1>
                <button @click="logout" class="bg-red-600 px-4 py-2 rounded font-bold">Cerrar Sesión</button>
            </div>

            <div class="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
                <h2 class="text-xl font-bold mb-6">Identidad del Restaurante (White-Label)</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-gray-400 mb-2">Nombre del Restaurante</label>
                        <input v-model="form.restaurant_name" type="text" class="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none" placeholder="Ej. Tacos Don Juan">
                    </div>
                    
                    <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-gray-400 mb-2">Color Primario (Fondos)</label>
                            <div class="flex">
                                <input v-model="form.primary_color" type="color" class="h-12 w-12 rounded border-none bg-transparent mr-3 cursor-pointer">
                                <input v-model="form.primary_color" type="text" class="flex-1 bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-400 mb-2">Color Secundario (Textos)</label>
                            <div class="flex">
                                <input v-model="form.secondary_color" type="color" class="h-12 w-12 rounded border-none bg-transparent mr-3 cursor-pointer">
                                <input v-model="form.secondary_color" type="text" class="flex-1 bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-400 mb-2">Color de Acento (Botones)</label>
                            <div class="flex">
                                <input v-model="form.accent_color" type="color" class="h-12 w-12 rounded border-none bg-transparent mr-3 cursor-pointer">
                                <input v-model="form.accent_color" type="text" class="flex-1 bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none">
                            </div>
                        </div>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-gray-400 mb-2">Logo URL (Imagen)</label>
                        <input v-model="form.logo_url" type="text" class="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none" placeholder="https://example.com/logo.png">
                    </div>
                </div>

                <!-- Ticket Customization Section -->
                <div class="mt-8 pt-8 border-t border-gray-700">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-receipt"></i>
                        Personalización de Tickets
                    </h2>
                    <p class="text-sm text-gray-400 mb-6">Estos valores aparecerán en los tickets impresos</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-gray-400 mb-2">Eslogan / Subtítulo</label>
                            <input v-model="form.ticket_slogan" type="text" class="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none" placeholder="Ej. Prime Cuts & Drinks" maxlength="100">
                            <p class="text-xs text-gray-500 mt-1">Aparece debajo del nombre del restaurante</p>
                        </div>

                        <div>
                            <label class="block text-gray-400 mb-2">Dirección</label>
                            <input v-model="form.ticket_address" type="text" class="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none" placeholder="Ej. Calle Principal #123" maxlength="200">
                        </div>

                        <div>
                            <label class="block text-gray-400 mb-2">Teléfono (Opcional)</label>
                            <input v-model="form.ticket_phone" type="text" class="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none" placeholder="Ej. Tel: (123) 456-7890" maxlength="50">
                        </div>

                        <div>
                            <label class="block text-gray-400 mb-2">Mensaje de Despedida 1</label>
                            <input v-model="form.ticket_footer" type="text" class="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none" placeholder="Ej. ¡Gracias por su visita!" maxlength="100">
                        </div>

                        <div class="md:col-span-2">
                            <label class="block text-gray-400 mb-2">Mensaje de Despedida 2 (Opcional)</label>
                            <input v-model="form.ticket_footer_2" type="text" class="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-gold outline-none" placeholder="Ej. Propina no incluida" maxlength="100">
                        </div>
                    </div>
                </div>

                <div class="mt-8 flex justify-end">
                    <button @click="saveSettings" :disabled="isSaving" class="bg-gold text-black font-bold py-3 px-8 rounded hover:bg-yellow-500 disabled:opacity-50">
                        {{ isSaving ? 'Guardando...' : 'Aplicar Cambios' }}
                    </button>
                </div>
            </div>

            <!-- Danger Zone -->
            <div class="mt-8 border border-red-900/50 rounded-xl bg-red-950/10 p-8">
                <div class="flex items-start">
                    <div class="text-red-500 mr-4 mt-1">
                        <i class="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-serif font-bold text-red-500 mb-2">Zona de Peligro</h3>
                        <p class="text-gray-400 text-sm mb-6">
                            Estas acciones son destructivas y no se pueden deshacer. Tenga precaución.
                        </p>
                        
                        <div class="flex items-center justify-between bg-black/40 p-4 rounded-lg border border-red-900/30">
                            <div>
                                <h4 class="text-white font-bold">Restauración de Fábrica Inteligente</h4>
                                <p class="text-xs text-gray-400 mt-1">Borra Menú, Ventas y Mesas. Mantiene Usuarios.</p>
                            </div>
                            <button 
                                @click="handleFactoryReset"
                                class="py-2 px-4 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white font-bold text-xs uppercase rounded border border-red-800 transition-colors"
                            >
                                Restaurar Sistema
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-8 bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 opacity-50 relative pointer-events-none">
                <div class="absolute inset-0 flex items-center justify-center">
                    <span class="bg-black/50 px-4 py-2 rounded font-bold uppercase tracking-widest text-sm border border-white/20">Próximamente</span>
                </div>
                <h2 class="text-xl font-bold mb-4">Gestión de Suscripciones</h2>
                <p class="text-gray-400">Aquí podrás activar/desactivar el servicio para clientes morosos.</p>
            </div>
        </div>
    </div>
</template>
