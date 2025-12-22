<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import * as z from 'zod';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const errorMsg = ref('');

const formSchema = toTypedSchema(
  z
    .object({
      oldPassword: z.string().min(1, 'Old password is required'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string().min(1, 'Confirm password is required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    })
);

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: formSchema,
});

const [oldPassword, oldPasswordProps] = defineField('oldPassword');
const [newPassword, newPasswordProps] = defineField('newPassword');
const [confirmPassword, confirmPasswordProps] = defineField('confirmPassword');

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  errorMsg.value = '';
  try {
    // Assuming backend endpoint /auth/change-password exists
    // We might need to pass the tempToken from authStore if it was saved there?
    // Or if the user is 403, maybe we need to carry that state.
    // The plan said response body has { tempToken: "..." }.
    // I need to make sure authStore saved this tempToken or we pass it here.
    // For now, let's assume standard change-password flow with current token/session if possible?
    // User is NOT logged in fully (403). So we probably need to use the tempToken in Authorization header.

    // Check if authStore has tempToken
    const token = authStore.tempToken;

    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    await api.post(
      '/auth/change-password',
      {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Success
    alert('Password changed successfully. Please login with your new password.');
    authStore.clearTempToken();
    router.push('/login');
  } catch (err: any) {
    console.error('Change Password Error:', err);
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to change password';
    if (err.message.includes('Session expired')) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl font-bold">Change Password</CardTitle>
        <CardDescription>You are required to change your password to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" class="space-y-4">
          <div v-if="errorMsg" class="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
            {{ errorMsg }}
          </div>

          <div class="space-y-2">
            <Label for="oldPassword">Old Password</Label>
            <Input
              id="oldPassword"
              type="password"
              v-bind="oldPasswordProps"
              v-model="oldPassword"
            />
            <span class="text-xs text-red-500">{{ errors.oldPassword }}</span>
          </div>

          <div class="space-y-2">
            <Label for="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              v-bind="newPasswordProps"
              v-model="newPassword"
            />
            <span class="text-xs text-red-500">{{ errors.newPassword }}</span>
          </div>

          <div class="space-y-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              v-bind="confirmPasswordProps"
              v-model="confirmPassword"
            />
            <span class="text-xs text-red-500">{{ errors.confirmPassword }}</span>
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Changing...' : 'Change Password' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
