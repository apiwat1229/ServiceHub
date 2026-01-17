<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { JobOrder } from '@/services/jobOrders';
import { useAuthStore } from '@/stores/auth';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import { CalendarIcon, Trash2 as LucideTrash2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  initialData?: Partial<JobOrder>;
}>();

const emit = defineEmits(['save', 'cancel', 'delete']);

const form = ref<JobOrder>({
  bookNo: props.initialData?.bookNo || '',
  no: props.initialData?.no || 0,
  jobOrderNo: props.initialData?.jobOrderNo || '',
  contractNo: props.initialData?.contractNo || '',
  grade: props.initialData?.grade || 'P0263',
  otherGrade: props.initialData?.otherGrade || '',
  quantityBale: props.initialData?.quantityBale || 35,
  palletType: props.initialData?.palletType || 'MB4',
  orderQuantity: props.initialData?.orderQuantity || 0,
  palletMarking: props.initialData?.palletMarking ?? true,
  note: props.initialData?.note || '',
  qaName: props.initialData?.qaName || '',
  qaDate: props.initialData?.qaDate || today(getLocalTimeZone()).toString(),
  logs: props.initialData?.logs || [],
});

const grades = ['P0263', 'P0251', 'H0276', 'P0241'];
const palletTypes = ['MB3', 'MB4', 'MB5', 'Blue Pallet', 'GPS', 'CIMC', 'Steel Pallet'];

const handleSave = () => {
  emit('save', form.value);
};

const handleDelete = () => {
  if (form.value.id) {
    emit('delete', form.value.id);
  } else {
    emit('cancel');
  }
};

const qaDateObject = ref<any>(
  new CalendarDate(
    new Date(form.value.qaDate).getFullYear(),
    new Date(form.value.qaDate).getMonth() + 1,
    new Date(form.value.qaDate).getDate()
  )
);

const authStore = useAuthStore();

onMounted(() => {
  if (!form.value.qaName && authStore.user) {
    form.value.qaName = authStore.user.displayName || authStore.user.username;
  }
});

const handleQaDateSelect = (date: any) => {
  if (date) {
    form.value.qaDate = date.toString();
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <Card class="border shadow-sm bg-white">
      <CardHeader class="pb-2 border-b bg-slate-50/50">
        <CardTitle class="text-xl font-black text-slate-800 flex items-center gap-2">
          <div class="w-1 h-6 bg-primary rounded-full"></div>
          {{
            props.initialData?.id
              ? t('qa.jobOrderForm.titleEdit')
              : t('qa.jobOrderForm.titleCreate')
          }}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-6 space-y-6">
        <!-- Row 1: Numbers & Basics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div class="space-y-1.5">
            <Label class="text-[10px] font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.jobOrderNo')
            }}</Label>
            <Input v-model="form.jobOrderNo" placeholder="E2601-23" class="font-black h-9" />
          </div>
          <div class="space-y-1.5">
            <Label class="text-[10px] font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.contractNo')
            }}</Label>
            <Input v-model="form.contractNo" placeholder="YS14360-4" class="font-black h-9" />
          </div>
        </div>

        <!-- Row 2: Pallet Type & Grade -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Pallet Type Selection -->
          <div class="space-y-3">
            <Label class="text-[10px] font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.palletType')
            }}</Label>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <div v-for="p in palletTypes" :key="p" class="flex items-center space-x-2">
                <Checkbox
                  :checked="form.palletType === p"
                  @update:checked="(checked) => checked && (form.palletType = p)"
                  :id="'pallet-' + p"
                />
                <Label :for="'pallet-' + p" class="text-xs font-medium cursor-pointer">{{
                  p
                }}</Label>
              </div>
            </div>
          </div>

          <!-- Grade Selection -->
          <div class="space-y-3">
            <Label class="text-[10px] font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.grade')
            }}</Label>
            <div class="flex flex-wrap gap-x-6 gap-y-2">
              <div v-for="g in grades" :key="g" class="flex items-center space-x-2">
                <Checkbox
                  :checked="form.grade === g"
                  @update:checked="(checked) => checked && (form.grade = g)"
                  :id="'grade-' + g"
                />
                <Label :for="'grade-' + g" class="text-xs font-medium cursor-pointer">{{
                  g
                }}</Label>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Quantity Options -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <!-- Qty/Pallet -->
          <div class="space-y-3">
            <Label class="text-xs font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.qtyPallet')
            }}</Label>
            <div class="flex gap-8">
              <div class="flex items-center space-x-2">
                <Checkbox
                  :checked="form.quantityBale === 35"
                  @update:checked="(checked) => checked && (form.quantityBale = 35)"
                  id="bale-35"
                />
                <Label for="bale-35" class="text-sm font-medium cursor-pointer"
                  >35 {{ t('qa.jobOrderForm.bale') }}</Label
                >
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox
                  :checked="form.quantityBale === 36"
                  @update:checked="(checked) => checked && (form.quantityBale = 36)"
                  id="bale-36"
                />
                <Label for="bale-36" class="text-sm font-medium cursor-pointer"
                  >36 {{ t('qa.jobOrderForm.bales') }}</Label
                >
              </div>
            </div>
          </div>

          <!-- Order Quantity -->
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.orderQty')
            }}</Label>
            <div class="flex items-center gap-2">
              <Input
                :model-value="form.orderQuantity.toString()"
                @update:model-value="form.orderQuantity = Number($event)"
                type="number"
                class="font-black h-9"
              />
              <span class="text-sm font-bold text-slate-400 w-16">{{
                t('qa.jobOrderForm.pallets')
              }}</span>
            </div>
          </div>
        </div>

        <!-- Row 4: Marking & Note -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div class="space-y-1.5">
            <Label class="text-[10px] font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.palletMarking')
            }}</Label>
            <div class="flex h-9 items-center gap-8">
              <div class="flex items-center space-x-2">
                <Checkbox
                  :checked="form.palletMarking === true"
                  @update:checked="
                    (checked) => {
                      if (checked) form.palletMarking = true;
                    }
                  "
                  id="marking-yes"
                />
                <Label
                  for="marking-yes"
                  class="text-xs font-bold cursor-pointer text-emerald-600"
                  >{{ t('qa.jobOrderForm.markingYes') }}</Label
                >
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox
                  :checked="form.palletMarking === false"
                  @update:checked="
                    (checked) => {
                      if (checked) form.palletMarking = false;
                    }
                  "
                  id="marking-no"
                />
                <Label for="marking-no" class="text-xs font-bold cursor-pointer text-rose-600">{{
                  t('qa.jobOrderForm.markingNo')
                }}</Label>
              </div>
            </div>
          </div>

          <!-- Note -->
          <div class="space-y-1.5">
            <Label class="text-[10px] font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.note')
            }}</Label>
            <Input v-model="form.note" class="bg-slate-50/50 h-9 font-medium" />
          </div>
        </div>

        <!-- Footer: QA & Verification -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.creator')
            }}</Label>
            <Input
              v-model="form.qaName"
              :placeholder="t('qa.jobOrderForm.placeholders.creator')"
              disabled
              class="bg-slate-50 cursor-not-allowed"
            />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">{{
              t('qa.jobOrderForm.verifyDate')
            }}</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="w-full justify-start text-left font-normal bg-white"
                >
                  <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
                  {{
                    form.qaDate
                      ? format(new Date(form.qaDate), 'dd-MMM-yyyy')
                      : t('qa.jobOrderForm.placeholders.selectDate')
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0">
                <Calendar v-model="qaDateObject" @update:model-value="handleQaDateSelect" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center w-full pt-8 border-t mt-4">
          <div class="flex items-center">
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button
                  variant="ghost"
                  class="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-6 font-bold flex items-center gap-2 h-10"
                >
                  <LucideTrash2 class="w-4 h-4" />
                  {{ t('common.delete') }}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ t('common.confirmDelete') }}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {{ t('common.deleteWarning') }}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                  <AlertDialogAction
                    @click="handleDelete"
                    class="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {{ t('common.confirm') }}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div class="flex items-center gap-3">
            <Button variant="ghost" @click="emit('cancel')" class="px-8 font-bold">
              {{ t('common.cancel') }}
            </Button>
            <Button
              @click="handleSave"
              class="px-12 font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {{ props.initialData?.id ? t('qa.jobOrderForm.update') : t('qa.jobOrderForm.save') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
