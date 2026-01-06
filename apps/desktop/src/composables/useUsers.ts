import type { User } from '@/services/users';
import { usersApi } from '@/services/users';
import { onMounted, ref } from 'vue';

export function useUsers(immediate = true) {
    const users = ref<User[]>([]);
    const loading = ref(false);

    const fetchUsers = async () => {
        loading.value = true;
        try {
            users.value = await usersApi.getAll();
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            loading.value = false;
        }
    };

    if (immediate) {
        onMounted(() => {
            fetchUsers();
        });
    }

    return {
        users,
        loading,
        fetchUsers
    };
}
