<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const authStore = useAuthStore();
import { useSettingsStore } from '../stores/settings';
const settingsStore = useSettingsStore();

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;
  
  if (!username.value || !password.value) {
    error.value = 'Por favor ingrese usuario y contraseña';
    isLoading.value = false;
    return;
  }

  const success = await authStore.login(username.value, password.value);
  
  if (!success) {
    error.value = 'Credenciales inválidas';
  }
  isLoading.value = false;
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-primary text-gold font-serif bg-cover bg-center bg-no-repeat relative overflow-hidden" :style="{ backgroundImage: 'url(https://placehold.co/1920x1080/050505/1a1a1a?text=Background)' }">
    <!-- Dynamic overlay using primary color -->
    <div class="absolute inset-0 bg-primary/90 backdrop-blur-sm"></div>
    
    <div class="relative z-10 p-10 border border-white/5 rounded-2xl bg-primary-panel/60 shadow-2xl backdrop-blur-md w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2 tracking-wide text-gold uppercase drop-shadow-lg">{{ settingsStore.restaurantName }}</h1>
        <p class="font-sans text-gray-400 text-sm tracking-widest uppercase">Sistema Operativo</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6 font-sans">
        <div>
          <label class="block text-xs font-bold text-gold uppercase tracking-wider mb-2">Usuario</label>
          <input 
            v-model="username" 
            type="text" 
            class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-200 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all placeholder-gray-600"
            placeholder="Ingrese su usuario..."
          >
        </div>
        
        <div>
          <label class="block text-xs font-bold text-gold uppercase tracking-wider mb-2">Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-200 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all placeholder-gray-600"
            placeholder="••••••••"
          >
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full py-4 bg-gold hover:bg-gold-hover text-white font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-gold/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading">Ingresando...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>
      
      <div class="mt-8 pt-6 border-t border-white/10 text-center">
            <router-link 
                to="/menu" 
                class="inline-flex items-center space-x-2 text-white/50 hover:text-gold transition-colors text-sm font-sans uppercase tracking-wider group"
            >
                <i class="fas fa-qrcode text-lg group-hover:scale-110 transition-transform"></i>
                <span>Ver Menú Digital</span>
            </router-link>
            <p class="mt-4 text-[10px] text-gray-600">Acceso restringido a personal autorizado</p>
      </div>
    </div>
  </div>
</template>
