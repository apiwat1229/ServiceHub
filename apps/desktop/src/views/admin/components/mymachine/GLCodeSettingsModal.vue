<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyMachine, type GLCode } from '@/composables/useMyMachine';
import { Plus } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import GLCodeDataTable from './GLCodeDataTable.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(['update:open']);

const { t } = useI18n();
const { glCodes, addGLCode, updateGLCode, deleteGLCode, loadData } = useMyMachine();

const isAdding = ref(false);
const editingId = ref<string | null>(null);

const form = ref<Omit<GLCode, 'id'>>({
  transactionId: '',
  description: '',
  code: '',
  purpose: '',
});

onMounted(async () => {
  // Ensure data is loaded
  await loadData();
});

const handleAdd = async () => {
  try {
    if (!form.value.transactionId || !form.value.code) {
      toast.error('Please fill required fields (Transaction ID and GL-Code)');
      return;
    }
    if (editingId.value) {
      await updateGLCode(editingId.value, form.value);
      editingId.value = null;
      toast.success('GL-Code updated successfully');
    } else {
      await addGLCode(form.value);
      toast.success('GL-Code added successfully');
    }
    form.value = { transactionId: '', description: '', code: '', purpose: '' };
    isAdding.value = false;
  } catch (e) {
    toast.error('Failed to save GL-Code');
  }
};

const startEdit = (item: GLCode) => {
  isAdding.value = true;
  editingId.value = item.id;
  form.value = {
    transactionId: item.transactionId,
    description: item.description,
    code: item.code,
    purpose: item.purpose || '',
  };
};

const cancelAdd = () => {
  isAdding.value = false;
  editingId.value = null;
  form.value = { transactionId: '', description: '', code: '', purpose: '' };
};

const handleDelete = async (id: string) => {
  try {
    await deleteGLCode(id);
    toast.success('GL-Code deleted successfully');
  } catch (e) {
    toast.error('Failed to delete GL-Code');
  }
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
      <DialogHeader
        class="px-6 pr-12 pt-6 pb-2 flex flex-row items-center justify-between space-y-0"
      >
        <div>
          <DialogTitle class="text-xl font-bold flex items-center gap-2">
            {{ t('services.myMachine.glCodes.title') }}
          </DialogTitle>
          <p class="text-sm text-slate-500 mt-1">
            {{ t('services.myMachine.glCodes.subtitle') }}
          </p>
        </div>
        <Button
          v-if="!isAdding"
          size="sm"
          @click="isAdding = true"
          class="bg-blue-600 hover:bg-blue-700 text-white gap-1 h-8 text-xs shrink-0"
        >
          <Plus class="w-3 h-3" />
          {{ t('services.myMachine.glCodes.add') }}
        </Button>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6 pt-2">
        <!-- Add New Functionality -->
        <div
          v-if="isAdding"
          class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4"
        >
          <h3 class="font-bold text-sm text-slate-700">
            {{
              editingId ? t('services.myMachine.glCodes.edit') : t('services.myMachine.glCodes.add')
            }}
          </h3>
          <div class="grid grid-cols-12 gap-3">
            <div class="space-y-1 col-span-2">
              <Label class="text-[10px] uppercase text-slate-500 font-bold">{{
                t('services.myMachine.glCodes.transactionId')
              }}</Label>
              <Input
                v-model="form.transactionId"
                placeholder="e.g. A-ASST"
                class="bg-white h-9 text-xs"
              />
            </div>
            <div class="space-y-1 col-span-4">
              <Label class="text-[10px] uppercase text-slate-500 font-bold">{{
                t('services.myMachine.glCodes.description')
              }}</Label>
              <Input
                v-model="form.description"
                placeholder="e.g. Repair assets"
                class="bg-white h-9 text-xs"
              />
            </div>
            <div class="space-y-1 col-span-2">
              <Label class="text-[10px] uppercase text-slate-500 font-bold">{{
                t('services.myMachine.glCodes.code')
              }}</Label>
              <Input v-model="form.code" placeholder="6000-42" class="bg-white h-9 text-xs" />
            </div>
            <div class="space-y-1 col-span-4">
              <Label class="text-[10px] uppercase text-slate-500 font-bold">{{
                t('services.myMachine.glCodes.purpose')
              }}</Label>
              <Input
                v-model="form.purpose"
                placeholder="วัตถุประสงค์"
                class="bg-white h-9 text-xs"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="ghost" size="sm" @click="cancelAdd" class="text-xs h-8">{{
              t('services.myMachine.glCodes.cancel')
            }}</Button>
            <Button
              size="sm"
              @click="handleAdd"
              class="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            >
              {{
                editingId
                  ? t('services.myMachine.glCodes.update')
                  : t('services.myMachine.glCodes.save')
              }}
            </Button>
          </div>
        </div>

        <div v-if="!isAdding" class="mb-1"></div>

        <!-- DataTable Integration -->
        <GLCodeDataTable :data="glCodes" @edit="startEdit" @delete="handleDelete" />
      </div>
    </DialogContent>
  </Dialog>
</template>
