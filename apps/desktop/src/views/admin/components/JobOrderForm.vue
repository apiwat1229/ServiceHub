<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { JobOrder } from '@/services/jobOrders';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  initialData?: Partial<JobOrder>;
}>();

const emit = defineEmits(['save', 'cancel']);

const form = ref<JobOrder>({
  bookNo: props.initialData?.bookNo || '',
  no: props.initialData?.no || 1,
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
  productionName: props.initialData?.productionName || '',
  productionDate: props.initialData?.productionDate || '',
  logs: props.initialData?.logs || [
    {
      date: today(getLocalTimeZone()).toString(),
      shift: '1st',
      lotStart: '',
      lotEnd: '',
      quantity: 0,
    },
  ],
});

const grades = ['P0263', 'P0251', 'H0276', 'Other'];
const palletTypes = ['MB3', 'MB4', 'MB5', 'Blue Pallet', 'GPS', 'CIMC', 'Steel Pallet'];

const addLog = () => {
  form.value.logs.push({
    date: today(getLocalTimeZone()).toString(),
    shift: '1st',
    lotStart: '',
    lotEnd: '',
    quantity: 0,
  });
};

const removeLog = (index: number) => {
  form.value.logs.splice(index, 1);
};

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
  <div class="space-y-6 max-w-5xl mx-auto p-4">
    <Card class="border-2 shadow-lg">
      <CardHeader class="border-b bg-muted/30">
        <div class="flex justify-between items-center">
          <div>
            <CardTitle class="text-2xl font-bold flex items-center gap-2">
              <span
                class="bg-primary text-primary-foreground w-8 h-8 rounded flex items-center justify-center text-sm"
                >JO</span
              >
              JOB ORDER (ใบสั่งงาน)
            </CardTitle>
          </div>
          <div class="flex gap-4">
            <div class="flex items-center gap-2">
              <Label class="whitespace-nowrap">เล่มที่ (Book):</Label>
              <Input v-model="form.bookNo" class="w-20 h-8" />
            </div>
            <div class="flex items-center gap-2">
              <Label class="whitespace-nowrap">เลขที่ (No):</Label>
              <Input v-model.number="form.no" type="number" class="w-20 h-8" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent class="pt-6 space-y-8">
        <!-- Section 1: General Info -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border shadow-sm"
        >
          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label>Job Order No. (เลขที่ใบสั่งงาน)</Label>
              <Input
                v-model="form.jobOrderNo"
                placeholder="E2601-23"
                class="bg-white border-primary/20 focus:border-primary"
              />
            </div>
            <div class="space-y-1.5">
              <Label>Contract No. (เลขที่สัญญา)</Label>
              <Input
                v-model="form.contractNo"
                placeholder="YS14300-4"
                class="bg-white border-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div class="space-y-4">
            <div class="space-y-2">
              <Label>Grade:</Label>
              <RadioGroup v-model="form.grade" class="flex flex-wrap gap-4">
                <div v-for="g in grades" :key="g" class="flex items-center space-x-2">
                  <RadioGroupItem :value="g" :id="'grade-' + g" />
                  <Label :for="'grade-' + g" class="font-normal">{{ g }}</Label>
                </div>
              </RadioGroup>
              <Input
                v-if="form.grade === 'Other'"
                v-model="form.otherGrade"
                placeholder="Specify grade..."
                class="mt-2 bg-white border-primary/20"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Pallet Specifications -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card class="bg-slate-50/50 border-dashed">
            <CardHeader class="py-3 px-4 bg-muted/50 rounded-t-lg border-b">
              <Label class="text-sm font-bold">Pallet Type (บรรจุภัณฑ์)</Label>
            </CardHeader>
            <CardContent class="p-4">
              <Select v-model="form.palletType">
                <SelectTrigger class="bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="p in palletTypes" :key="p" :value="p">
                    {{ p }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card class="bg-slate-50/50 border-dashed">
            <CardHeader class="py-3 px-4 bg-muted/50 rounded-t-lg border-b">
              <Label class="text-sm font-bold">Quantity / Pallet</Label>
            </CardHeader>
            <CardContent class="p-4 flex flex-col gap-4">
              <RadioGroup
                :model-value="form.quantityBale.toString()"
                @update:model-value="form.quantityBale = Number($event) as 35 | 36"
                class="flex gap-6"
              >
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="35" id="bale-35" />
                  <Label for="bale-35">35 bale</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="36" id="bale-36" />
                  <Label for="bale-36">36 bales</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card class="bg-slate-50/50 border-dashed">
            <CardHeader class="py-3 px-4 bg-muted/50 rounded-t-lg border-b">
              <Label class="text-sm font-bold">Order Quantity (จำนวน)</Label>
            </CardHeader>
            <CardContent class="p-4 flex items-center gap-3">
              <Input
                :model-value="form.orderQuantity.toString()"
                @update:model-value="form.orderQuantity = Number($event)"
                type="number"
                class="w-full bg-white"
              />
              <span class="text-sm font-medium text-muted-foreground">Pallets</span>
            </CardContent>
          </Card>
        </div>

        <div class="flex items-center gap-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div class="flex items-center space-x-2">
            <Checkbox id="marking" v-model:checked="form.palletMarking" />
            <Label for="marking" class="text-sm font-bold cursor-pointer"
              >Pallet Marking Attach (ติดป้าย pallet marking)</Label
            >
          </div>
          <div class="flex-1 flex gap-2 items-center">
            <Label class="whitespace-nowrap font-bold">Note:</Label>
            <Input v-model="form.note" class="bg-white border-primary/20" />
          </div>
        </div>

        <!-- Section 3: Production Logs Table -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-6 bg-primary rounded-full"></div>
              <h3 class="text-lg font-black uppercase tracking-widest text-foreground">
                For Production (สำหรับฝ่ายผลิต)
              </h3>
            </div>
            <Button
              @click="addLog"
              variant="outline"
              size="sm"
              class="gap-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
            >
              <Plus class="w-4 h-4" /> Add Row
            </Button>
          </div>

          <div class="border rounded-xl overflow-hidden shadow-sm bg-white">
            <Table>
              <TableHeader class="bg-muted/50">
                <TableRow>
                  <TableHead class="w-[180px]">Date</TableHead>
                  <TableHead class="w-[120px]">Shift</TableHead>
                  <TableHead>Lot # Pallet (Start - End)</TableHead>
                  <TableHead class="w-[120px]">Quantity</TableHead>
                  <TableHead class="w-[150px]">Sign</TableHead>
                  <TableHead class="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(log, index) in form.logs" :key="index">
                  <TableCell>
                    <Input
                      type="date"
                      v-model="log.date"
                      class="h-8 text-xs border-transparent focus:border-primary bg-transparent"
                    />
                  </TableCell>
                  <TableCell>
                    <Select v-model="log.shift">
                      <SelectTrigger class="h-8 text-xs bg-transparent border-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st">1st Shift</SelectItem>
                        <SelectItem value="2nd">2nd Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Input
                        v-model="log.lotStart"
                        placeholder="Start"
                        class="h-8 text-xs bg-transparent border-slate-200"
                      />
                      <span class="text-muted-foreground">—</span>
                      <Input
                        v-model="log.lotEnd"
                        placeholder="End"
                        class="h-8 text-xs bg-transparent border-slate-200"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      :model-value="log.quantity.toString()"
                      @update:model-value="log.quantity = Number($event)"
                      type="number"
                      class="h-8 text-xs bg-transparent border-slate-200"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      v-model="log.sign"
                      placeholder="Signature"
                      class="h-8 text-xs bg-transparent border-slate-200"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="removeLog(index)"
                      class="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <!-- Section 4: Approval & Footer -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
          <Card class="bg-slate-50 border shadow-sm">
            <CardHeader class="py-3 px-4 border-b bg-muted/30">
              <Label class="text-sm font-bold flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
                QA Verification (Quality Assurance)
              </Label>
            </CardHeader>
            <CardContent class="p-6 space-y-4">
              <div class="space-y-1.5">
                <Label>QA Name:</Label>
                <Input v-model="form.qaName" placeholder="Enter QA name" class="bg-white" />
              </div>
              <div class="space-y-1.5">
                <Label>Verification Date:</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="w-full justify-start text-left font-normal bg-white h-10"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{
                        form.qaDate ? format(new Date(form.qaDate), 'dd-MMM-yyyy') : 'Select date'
                      }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0">
                    <Calendar v-model="qaDateObject" @update:model-value="handleQaDateSelect" />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card class="bg-slate-50 border shadow-sm">
            <CardHeader class="py-3 px-4 border-b bg-muted/30">
              <Label class="text-sm font-bold flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Production Finalization (Dryer & Packing)
              </Label>
            </CardHeader>
            <CardContent class="p-6 space-y-4">
              <div class="flex items-center space-x-2 pb-2">
                <Checkbox id="closed" v-model:checked="form.isClosed" />
                <Label for="closed" class="font-black text-emerald-700"
                  >Closed job order (ปิดใบงานสั่งผลิต)</Label
                >
              </div>
              <div class="space-y-1.5">
                <Label>Sign Name:</Label>
                <Input
                  v-model="form.productionName"
                  :disabled="!form.isClosed"
                  placeholder="Production staff signature"
                  class="bg-white"
                />
              </div>
              <div class="space-y-1.5">
                <Label>Date:</Label>
                <Input
                  type="date"
                  v-model="form.productionDate"
                  :disabled="!form.isClosed"
                  class="bg-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-6 border-t font-black">
          <Button variant="outline" @click="emit('cancel')" class="px-8 shadow-sm">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="handleSave" class="px-10 bg-primary hover:bg-primary/90 shadow-md">
            {{ t('common.save') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
