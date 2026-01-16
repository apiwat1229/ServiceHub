<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { JobOrder } from '@/services/jobOrders';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-vue-next';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  initialData?: Partial<JobOrder>;
}>();

const emit = defineEmits(['save', 'cancel']);

const form = ref<JobOrder>({
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
  isClosed: props.initialData?.isClosed || false,
  logs: [],
});

const grades = ['P0263', 'P0251', 'H0276', 'Other'];
const palletTypes = ['MB3', 'MB4', 'MB5', 'Blue Pallet', 'GPS', 'CIMC', 'Steel Pallet'];

const handleSave = () => {
  emit('save', form.value);
};

const qaDateObject = ref<any>(
  new CalendarDate(
    new Date(form.value.qaDate).getFullYear(),
    new Date(form.value.qaDate).getMonth() + 1,
    new Date(form.value.qaDate).getDate()
  )
);

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
          CREATING JOB ORDER (สร้างใบสั่งงาน)
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-6 space-y-6">
        <!-- Row 1: Numbers & Basics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">Job Order No.</Label>
            <Input v-model="form.jobOrderNo" placeholder="E2601-23" class="font-black" />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">Contract No.</Label>
            <Input v-model="form.contractNo" placeholder="YS14360-4" class="font-black" />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">Pallet Type</Label>
            <Select v-model="form.palletType">
              <SelectTrigger class="font-bold">
                <SelectValue placeholder="Select Pallet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in palletTypes" :key="p" :value="p">
                  {{ p }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Row 2: Options Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-slate-50 rounded-xl border">
          <!-- Grade -->
          <div class="space-y-3">
            <Label class="text-xs font-bold uppercase text-slate-500">Grade (เกรด)</Label>
            <RadioGroup v-model="form.grade" class="flex flex-wrap gap-x-6 gap-y-3">
              <div v-for="g in grades" :key="g" class="flex items-center space-x-2">
                <RadioGroupItem :value="g" :id="'grade-' + g" />
                <Label :for="'grade-' + g" class="text-sm font-medium cursor-pointer">{{
                  g
                }}</Label>
              </div>
            </RadioGroup>
            <Input
              v-if="form.grade === 'Other'"
              v-model="form.otherGrade"
              placeholder="Specify..."
              class="h-8 mt-2"
            />
          </div>

          <!-- Qty/Pallet -->
          <div class="space-y-3 border-l md:pl-8">
            <Label class="text-xs font-bold uppercase text-slate-500">Quantity / Pallet</Label>
            <RadioGroup
              :model-value="form.quantityBale.toString()"
              @update:model-value="form.quantityBale = Number($event) as 35 | 36"
              class="flex gap-8"
            >
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="35" id="bale-35" />
                <Label for="bale-35" class="text-sm font-medium cursor-pointer">35 bale</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="36" id="bale-36" />
                <Label for="bale-36" class="text-sm font-medium cursor-pointer">36 bales</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <!-- Row 3: Measurement & Marking -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-end gap-3">
            <div class="space-y-1.5 flex-1">
              <Label class="text-xs font-bold uppercase text-slate-500">Order Quantity</Label>
              <div class="flex items-center gap-2">
                <Input
                  :model-value="form.orderQuantity.toString()"
                  @update:model-value="form.orderQuantity = Number($event)"
                  type="number"
                  class="font-black"
                />
                <span class="text-sm font-bold text-slate-400 w-16">Pallets</span>
              </div>
            </div>
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">Pallet Marking Attach</Label>
            <RadioGroup
              :model-value="form.palletMarking ? 'yes' : 'no'"
              @update:model-value="form.palletMarking = $event === 'yes'"
              class="flex h-10 items-center gap-8"
            >
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="marking-yes" />
                <Label for="marking-yes" class="text-sm font-bold cursor-pointer text-emerald-600"
                  >Yes (ติด)</Label
                >
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="no" id="marking-no" />
                <Label for="marking-no" class="text-sm font-bold cursor-pointer text-rose-600"
                  >No (ไม่ติด)</Label
                >
              </div>
            </RadioGroup>
          </div>
        </div>

        <!-- Row 4: Note -->
        <div class="space-y-1.5">
          <Label class="text-xs font-bold uppercase text-slate-500">Note (หมายเหตุ)</Label>
          <Input v-model="form.note" class="bg-slate-50/50" />
        </div>

        <!-- Footer: QA & Verification -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">QA Name</Label>
            <Input v-model="form.qaName" placeholder="Name of checker" />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase text-slate-500">Verification Date</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="w-full justify-start text-left font-normal bg-white"
                >
                  <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
                  {{ form.qaDate ? format(new Date(form.qaDate), 'dd-MMM-yyyy') : 'Select date' }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0">
                <Calendar v-model="qaDateObject" @update:model-value="handleQaDateSelect" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-6">
          <Button variant="ghost" @click="emit('cancel')" class="px-8 font-bold"> Cancel </Button>
          <Button
            @click="handleSave"
            class="px-12 font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            Create Order
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
