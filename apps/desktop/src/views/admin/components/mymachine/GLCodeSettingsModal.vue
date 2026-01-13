<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMyMachine, type GLCode } from '@/composables/useMyMachine';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(['update:open']);

const { glCodes, addGLCode, updateGLCode, deleteGLCode, loadData } = useMyMachine();

const isAdding = ref(false);
const editingId = ref<string | null>(null);

const form = ref<Omit<GLCode, 'id'>>({
  transactionId: '',
  description: '',
  code: '',
  purpose: '',
});

const editForm = ref<Omit<GLCode, 'id'>>({
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
    await addGLCode(form.value);
    form.value = { transactionId: '', description: '', code: '', purpose: '' };
    isAdding.value = false;
    toast.success('GL-Code added successfully');
  } catch (e) {
    toast.error('Failed to add GL-Code');
  }
};

const startEdit = (item: GLCode) => {
  editingId.value = item.id;
  editForm.value = {
    transactionId: item.transactionId,
    description: item.description,
    code: item.code,
    purpose: item.purpose || '',
  };
};

const handleUpdate = async () => {
  if (!editingId.value) return;
  try {
    await updateGLCode(editingId.value, editForm.value);
    editingId.value = null;
    toast.success('GL-Code updated successfully');
  } catch (e) {
    toast.error('Failed to update GL-Code');
  }
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
    <DialogContent class="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="text-xl font-bold flex items-center gap-2">
          Management GL-Codes
        </DialogTitle>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6">
        <!-- Add New Functionality -->
        <div
          v-if="isAdding"
          class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4"
        >
          <h3 class="font-bold text-sm text-slate-700">Add New GL-Code</h3>
          <div class="grid grid-cols-4 gap-3">
            <div class="space-y-1">
              <Label class="text-[10px] uppercase text-slate-500 font-bold">Transaction ID</Label>
              <Input
                v-model="form.transactionId"
                placeholder="e.g. A-ASST"
                class="bg-white h-9 text-xs"
              />
            </div>
            <div class="space-y-1">
              <Label class="text-[10px] uppercase text-slate-500 font-bold">Description</Label>
              <Input
                v-model="form.description"
                placeholder="e.g. Repair assets"
                class="bg-white h-9 text-xs"
              />
            </div>
            <div class="space-y-1">
              <Label class="text-[10px] uppercase text-slate-500 font-bold">GL-Code</Label>
              <Input v-model="form.code" placeholder="e.g. 6000-42" class="bg-white h-9 text-xs" />
            </div>
            <div class="space-y-1">
              <Label class="text-[10px] uppercase text-slate-500 font-bold">Purpose (TH)</Label>
              <Input
                v-model="form.purpose"
                placeholder="วัตถุประสงค์"
                class="bg-white h-9 text-xs"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="ghost" size="sm" @click="isAdding = false" class="text-xs h-8"
              >Cancel</Button
            >
            <Button
              size="sm"
              @click="handleAdd"
              class="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            >
              Save Entry
            </Button>
          </div>
        </div>

        <div v-else class="flex justify-between items-center mb-4">
          <p class="text-sm text-slate-500">
            Manage your general ledger codes for maintenance transactions.
          </p>
          <Button
            size="sm"
            @click="isAdding = true"
            class="bg-blue-600 hover:bg-blue-700 text-white gap-1 h-8 text-xs"
          >
            <Plus class="w-3 h-3" />
            Add New
          </Button>
        </div>

        <!-- Table Display -->
        <div class="border rounded-lg overflow-hidden border-slate-200">
          <Table>
            <TableHeader class="bg-slate-50">
              <TableRow>
                <TableHead class="text-[10px] font-black uppercase text-slate-600 w-[150px]"
                  >Transactionid</TableHead
                >
                <TableHead class="text-[10px] font-black uppercase text-slate-600"
                  >Description</TableHead
                >
                <TableHead class="text-[10px] font-black uppercase text-slate-600 w-[120px]"
                  >GL-Code</TableHead
                >
                <TableHead class="text-[10px] font-black uppercase text-slate-600"
                  >วัตถุประสงค์การซ่อมแซม</TableHead
                >
                <TableHead class="text-right w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in glCodes" :key="item.id" class="hover:bg-slate-50/50">
                <template v-if="editingId === item.id">
                  <TableCell class="p-2"
                    ><Input v-model="editForm.transactionId" class="h-8 text-xs"
                  /></TableCell>
                  <TableCell class="p-2"
                    ><Input v-model="editForm.description" class="h-8 text-xs"
                  /></TableCell>
                  <TableCell class="p-2"
                    ><Input v-model="editForm.code" class="h-8 text-xs"
                  /></TableCell>
                  <TableCell class="p-2"
                    ><Input v-model="editForm.purpose" class="h-8 text-xs"
                  /></TableCell>
                  <TableCell class="p-2 text-right">
                    <div class="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        @click="handleUpdate"
                        class="h-7 w-7 text-green-600"
                      >
                        <Check class="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        @click="editingId = null"
                        class="h-7 w-7 text-red-600"
                      >
                        <X class="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </template>
                <template v-else>
                  <TableCell class="font-bold text-xs text-slate-700">{{
                    item.transactionId
                  }}</TableCell>
                  <TableCell class="text-xs text-slate-600">{{ item.description }}</TableCell>
                  <TableCell
                    class="font-mono text-xs text-blue-600 font-bold bg-blue-50/50 rounded px-1"
                    >{{ item.code }}</TableCell
                  >
                  <TableCell class="text-xs text-slate-600">{{ item.purpose || '-' }}</TableCell>
                  <TableCell class="text-right">
                    <div class="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        @click="startEdit(item)"
                        class="h-7 w-7 text-slate-400 hover:text-blue-600"
                      >
                        <Edit2 class="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        @click="handleDelete(item.id)"
                        class="h-7 w-7 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 class="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </template>
              </TableRow>
              <TableRow v-if="glCodes.length === 0">
                <TableCell colspan="5" class="h-32 text-center text-slate-400 text-xs italic">
                  No GL-Codes found. Add one to get started.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
