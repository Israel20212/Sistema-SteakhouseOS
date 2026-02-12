<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
    id: number;
    username: string;
    role: string;
}

const users = ref<User[]>([]);
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const form = ref({
    username: '',
    password: '',
    role: 'waiter'
});

onMounted(() => {
    fetchUsers();
});

const fetchUsers = async () => {
    try {
        const response = await fetch(`${API_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${authStore.token}` }
        });
        if (response.ok) users.value = await response.json();
    } catch (error) {
        console.error(error);
    }
};

const openModal = (user?: User) => {
    if (user) {
        isEditing.value = true;
        editingId.value = user.id;
        form.value = { 
            username: user.username, 
            password: '', // Password empty on edit
            role: user.role 
        };
    } else {
        isEditing.value = false;
        editingId.value = null; // Reset editingId logic
        form.value = { username: '', password: '', role: 'waiter' };
    }
    showModal.value = true;
};

const saveUser = async () => {
    if (!form.value.username || (!isEditing.value && !form.value.password)) {
        alert('Por favor completa los campos requeridos');
        return;
    }

    try {
        const url = isEditing.value 
            ? `${API_URL}/api/users/${editingId.value}`
            : `${API_URL}/api/users`;
        
        const method = isEditing.value ? 'PUT' : 'POST';

        const body: any = { username: form.value.username, role: form.value.role };
        if (form.value.password) body.password = form.value.password; // Only send pass if changed/new

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.token}`
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            showModal.value = false;
            fetchUsers();
        } else {
            const data = await response.json();
            alert(data.message || 'Error al guardar');
        }
    } catch (error) {
        console.log(error);
        alert('Error de conexión');
    }
};

const deleteUser = async (id: number) => {
    if(!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
        const response = await fetch(`${API_URL}/api/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authStore.token}` }
        });
        if (response.ok) fetchUsers();
    } catch (error) {
        console.error(error);
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
            <h1 class="text-xl text-gold font-bold font-serif">Gestión de Personal</h1>
            <p class="text-xs text-gray-500">Administra accesos y roles</p>
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

    <div class="p-6 max-w-5xl mx-auto">
        
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-bold">Listado de Usuarios</h2>
            <button @click="openModal()" class="bg-gold hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold text-sm transition shadow-lg">
                <i class="fas fa-user-plus mr-1"></i> Nuevo Usuario
            </button>
        </div>

        <div class="bg-primary-panel border border-white/10 rounded-xl overflow-hidden shadow-lg">
            <table class="w-full text-left">
                <thead class="bg-white/5 text-gray-400 text-xs uppercase border-b border-white/10">
                    <tr>
                        <th class="p-4">ID</th>
                        <th class="p-4">Usuario</th>
                        <th class="p-4">Rol</th>
                        <th class="p-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-for="user in users" :key="user.id" class="hover:bg-white/5 transition">
                        <td class="p-4 text-gray-400">#{{ user.id }}</td>
                        <td class="p-4 font-bold">{{ user.username }}</td>
                        <td class="p-4">
                            <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
                                :class="{
                                    'bg-purple-500/20 text-purple-400': user.role === 'admin',
                                    'bg-blue-500/20 text-blue-400': user.role === 'waiter',
                                    'bg-green-500/20 text-green-400': user.role === 'cashier',
                                    'bg-red-500/20 text-red-400': user.role === 'kitchen'
                                }"
                            >
                                {{ user.role }}
                            </span>
                        </td>
                        <td class="p-4 text-right space-x-2">
                             <button v-if="user.role !== 'superuser'" @click="openModal(user)" class="text-blue-400 hover:text-white p-2" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                             <button v-if="user.role !== 'superuser'" @click="deleteUser(user.id)" class="text-red-400 hover:text-white p-2" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                            <span v-else class="text-gray-600 text-xs uppercase font-bold italic pr-2">
                                <i class="fas fa-lock mr-1"></i> Protegido
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="users.length === 0" class="p-8 text-center text-gray-500">
                No hay usuarios registrados.
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-primary-panel border border-white/20 rounded-xl w-full max-w-md shadow-2xl p-6">
            <h2 class="text-xl font-bold text-gold mb-4">{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Nombre de Usuario</label>
                    <input v-model="form.username" type="text" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
                <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Contraseña {{ isEditing ? '(Dejar vacía para no cambiar)' : '' }}</label>
                    <input v-model="form.password" type="password" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold" />
                </div>
                 <div>
                    <label class="block text-xs uppercase text-gray-500 mb-1">Rol</label>
                    <select v-model="form.role" class="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-gold">
                        <option value="waiter">Mesero (Waiter)</option>
                        <option value="cashier">Cajero (Cashier)</option>
                        <option value="kitchen">Cocina (Kitchen)</option>
                        <option value="admin">Administrador (Admin)</option>
                    </select>
                </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
                <button @click="showModal = false" class="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button @click="saveUser" class="bg-gold hover:bg-yellow-500 text-black px-6 py-2 rounded font-bold shadow-lg">Guardar</button>
            </div>
        </div>
    </div>

  </div>
</template>
