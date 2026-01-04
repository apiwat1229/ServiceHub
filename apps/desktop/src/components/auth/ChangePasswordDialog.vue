<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { AlertCircle, Check, Eye as EyeIcon, EyeOff as EyeOffIcon, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const props = defineProps<{
  open: boolean;
  tempToken: string;
  email: string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

const router = useRouter();
const authStore = useAuthStore();

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Password strength validation
const passwordStrength = computed(() => {
  const password = newPassword.value;
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'text-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'text-yellow-500' };
  return { score, label: 'Strong', color: 'text-green-500' };
});

const passwordRequirements = computed(() => [
  { met: newPassword.value.length >= 8, text: 'At least 8 characters' },
  { met: /[a-z]/.test(newPassword.value), text: 'Contains lowercase letter' },
  { met: /[A-Z]/.test(newPassword.value), text: 'Contains uppercase letter' },
  { met: /[0-9]/.test(newPassword.value), text: 'Contains number' },
  { met: /[^a-zA-Z0-9]/.test(newPassword.value), text: 'Contains special character' },
]);

const isValid = computed(() => {
  return (
    oldPassword.value &&
    newPassword.value &&
    confirmPassword.value &&
    newPassword.value === confirmPassword.value &&
    passwordStrength.value.score >= 3
  );
});

const handleSubmit = async () => {
  if (!isValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2530';

    await axios.post(
      `${API_URL}/api/auth/change-password`,
      {
        oldPassword: oldPassword.value,
        newPassword: newPassword.value,
      },
      {
        headers: {
          Authorization: `Bearer ${props.tempToken}`,
        },
      }
    );

    toast.success('Password changed successfully!');

    // Now login with new password
    await authStore.login({ email: props.email, password: newPassword.value }, false);

    emit('success');
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to change password';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  router.push('/login');
  emit('update:open', false);
};
</script>

<template>
  <Dialog :open="open" @update:open="() => {}">
    <DialogContent class="sm:max-w-md" :hide-close="true">
      <DialogHeader>
        <DialogTitle>Change Password Required</DialogTitle>
        <DialogDescription>
          You must change your password before continuing to use the system.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Hidden username field to help password managers -->
        <input type="text" :value="email" autocomplete="username" class="hidden" readonly />

        <Alert v-if="error" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div class="space-y-2">
          <Label for="old-password">Current Password</Label>
          <div class="relative">
            <Input
              id="old-password"
              :type="showOldPassword ? 'text' : 'password'"
              v-model="oldPassword"
              placeholder="Enter your current password"
              required
              class="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              @click="showOldPassword = !showOldPassword"
              tabindex="-1"
            >
              <EyeIcon v-if="!showOldPassword" class="h-4 w-4 text-muted-foreground" />
              <EyeOffIcon v-else class="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="new-password">New Password</Label>
          <div class="relative">
            <Input
              id="new-password"
              :type="showNewPassword ? 'text' : 'password'"
              v-model="newPassword"
              placeholder="Enter your new password"
              required
              class="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              @click="showNewPassword = !showNewPassword"
              tabindex="-1"
            >
              <EyeIcon v-if="!showNewPassword" class="h-4 w-4 text-muted-foreground" />
              <EyeOffIcon v-else class="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="newPassword" class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full transition-all"
                  :class="{
                    'bg-red-500': passwordStrength.score <= 2,
                    'bg-yellow-500': passwordStrength.score > 2 && passwordStrength.score <= 4,
                    'bg-green-500': passwordStrength.score > 4,
                  }"
                  :style="{ width: `${(passwordStrength.score / 6) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium" :class="passwordStrength.color">
                {{ passwordStrength.label }}
              </span>
            </div>

            <!-- Requirements Checklist -->
            <div class="space-y-1">
              <div
                v-for="req in passwordRequirements"
                :key="req.text"
                class="flex items-center gap-2 text-sm"
              >
                <Check v-if="req.met" class="h-4 w-4 text-green-500" />
                <X v-else class="h-4 w-4 text-gray-400" />
                <span :class="req.met ? 'text-green-600' : 'text-gray-500'">
                  {{ req.text }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="confirm-password">Confirm New Password</Label>
          <div class="relative">
            <Input
              id="confirm-password"
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="confirmPassword"
              placeholder="Confirm your new password"
              required
              class="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              @click="showConfirmPassword = !showConfirmPassword"
              tabindex="-1"
            >
              <EyeIcon v-if="!showConfirmPassword" class="h-4 w-4 text-muted-foreground" />
              <EyeOffIcon v-else class="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <p v-if="confirmPassword && newPassword !== confirmPassword" class="text-sm text-red-500">
            Passwords do not match
          </p>
        </div>

        <div class="flex gap-2">
          <Button type="button" variant="outline" class="w-full" @click="handleCancel">
            Logout
          </Button>
          <Button type="submit" class="w-full" :disabled="!isValid || loading">
            {{ loading ? 'Changing...' : 'Change Password' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
