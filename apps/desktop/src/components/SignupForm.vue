<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Eye as EyeIcon, EyeOff as EyeOffIcon, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const emit = defineEmits<{
  submit: [
    { email: string; username: string; password: string; firstName: string; lastName: string },
  ];
}>();

const email = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const firstName = ref('');
const lastName = ref('');
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Password strength validation (matching ChangePasswordDialog.vue)
const passwordStrength = computed(() => {
  const pwd = password.value;
  if (!pwd) return { score: 0, label: '', color: '' };

  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'text-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'text-yellow-500' };
  return { score, label: 'Strong', color: 'text-green-500' };
});

const passwordRequirements = computed(() => [
  { met: password.value.length >= 8, text: 'At least 8 characters' },
  { met: /[a-z]/.test(password.value), text: 'Contains lowercase letter' },
  { met: /[A-Z]/.test(password.value), text: 'Contains uppercase letter' },
  { met: /[0-9]/.test(password.value), text: 'Contains number' },
  { met: /[^a-zA-Z0-9]/.test(password.value), text: 'Contains special character' },
]);

const isValid = computed(() => {
  return (
    email.value &&
    username.value &&
    firstName.value &&
    lastName.value &&
    password.value &&
    confirmPassword.value &&
    password.value === confirmPassword.value &&
    passwordStrength.value.score >= 3
  );
});

const handleSubmit = () => {
  if (!isValid.value) return;

  emit('submit', {
    email: email.value,
    username: username.value,
    password: password.value,
    firstName: firstName.value,
    lastName: lastName.value,
  });
};

defineExpose({
  setLoading: (value: boolean) => {
    loading.value = value;
  },
});
</script>

<template>
  <Card class="mx-auto max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl">Create an account</CardTitle>
      <CardDescription> Enter your information below to create your account </CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="handleSubmit" class="grid gap-4">
        <div class="grid gap-2">
          <Label for="firstName">First Name</Label>
          <Input id="firstName" v-model="firstName" placeholder="John" required />
        </div>

        <div class="grid gap-2">
          <Label for="lastName">Last Name</Label>
          <Input id="lastName" v-model="lastName" placeholder="Doe" required />
        </div>

        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <Input id="username" v-model="username" placeholder="johndoe" required />
        </div>

        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="email" type="email" placeholder="user@example.com" required />
          <p class="text-xs text-muted-foreground">
            We'll use this to contact you. We will not share your email with anyone else.
          </p>
        </div>

        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <div class="relative">
            <Input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <EyeIcon v-if="!showPassword" class="h-4 w-4 text-muted-foreground" />
              <EyeOffIcon v-else class="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="password" class="space-y-2">
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

        <div class="grid gap-2">
          <Label for="confirmPassword">Confirm Password</Label>
          <div class="relative">
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
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
          <p
            v-if="confirmPassword && password !== confirmPassword"
            class="text-xs text-destructive"
          >
            Passwords do not match
          </p>
          <p v-else class="text-xs text-muted-foreground">Please confirm your password</p>
        </div>

        <Button type="submit" class="w-full" :disabled="!isValid || loading">
          <span v-if="loading">Creating account...</span>
          <span v-else>Create Account</span>
        </Button>
      </form>

      <div class="mt-4 text-center text-sm">
        Already have an account?
        <router-link to="/login" class="underline"> Sign in </router-link>
      </div>
    </CardContent>
  </Card>
</template>
