<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useMyMachine, type RepairPart } from '@/composables/useMyMachine';
import { cn } from '@/lib/utils';
import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Package,
  Plus,
  Trash2,
  X,
} from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

const props = defineProps<{
  initialData?: any;
}>();

const emit = defineEmits(['save', 'cancel']);

const { machines, stocks } = useMyMachine();

const form = ref<{
  machineId: string;
  date: Date;
  issue: string;
  technician: string;
  parts: RepairPart[];
  images: string[];
  status: string;
}>(
  props.initialData
    ? {
        ...JSON.parse(JSON.stringify(props.initialData)),
        date: new Date(props.initialData.date),
        images: props.initialData.images || [],
        status: props.initialData.status || 'OPEN',
      }
    : {
        machineId: '',
        date: new Date(),
        issue: '',
        technician: '',
        parts: [],
        images: [],
        status: 'OPEN',
      }
);

const repairDateValue = computed({
  get: () => {
    if (!form.value.date) return undefined;
    const d = new Date(form.value.date);
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  },
  set: (val: DateValue | undefined) => {
    if (val) {
      form.value.date = val.toDate(getLocalTimeZone());
    }
  },
});

const partInput = ref<{
  name: string;
  qty: number;
  price: number;
  isStock: boolean;
}>({
  name: '',
  qty: 1,
  price: 0,
  isStock: false,
});

// Combobox States
const openMachineCombo = ref(false);
const openStockCombo = ref(false);

const handleStockSelect = (stockId: string) => {
  if (stockId) {
    const stockItem = stocks.value.find((s) => s.id === stockId);
    if (stockItem) {
      partInput.value.name = stockItem.name;
      partInput.value.price = stockItem.price;
      partInput.value.isStock = true;
    }
  }
  openStockCombo.value = false;
};

const addPartToForm = () => {
  if (!partInput.value.name) return;
  form.value.parts.push({
    ...partInput.value,
    id: Date.now(),
  });
  partInput.value = { name: '', qty: 1, price: 0, isStock: false };
};

const removePart = (id: number) => {
  form.value.parts = form.value.parts.filter((p) => p.id !== id);
};

const calculateTotal = (parts: RepairPart[]) => {
  return parts.reduce((acc, p) => acc + p.qty * p.price, 0);
};

// Image Handling
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;

  Array.from(target.files).forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (Max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        form.value.images.push(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  });

  // Reset input
  target.value = '';
};

const removeImage = (index: number) => {
  form.value.images.splice(index, 1);
};

const handleSubmit = () => {
  if (!form.value.machineId) return;
  const selectedMachine = machines.value.find((m) => m.id === form.value.machineId);

  const payload = {
    ...form.value,
    date: form.value.date.toISOString(),
    machineName: selectedMachine ? selectedMachine.name : 'Unknown',
    totalCost: calculateTotal(form.value.parts),
  };
  emit('save', payload);
};
</script>

<template>
  <div class="space-y-6 py-4">
    <!-- Main Info -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label class="text-slate-700 font-semibold">{{
          t('services.myMachine.forms.repair.machine')
        }}</Label>
        <Popover v-model:open="openMachineCombo">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              role="combobox"
              :aria-expanded="openMachineCombo"
              class="w-full justify-between bg-white border-slate-200"
            >
              {{
                form.machineId
                  ? machines.find((m) => m.id === form.machineId)?.name
                  : t('services.myMachine.forms.repair.selectMachine')
              }}
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[300px] p-0">
            <Command>
              <CommandInput :placeholder="t('services.myMachine.forms.repair.searchMachine')" />
              <CommandList>
                <CommandEmpty>{{
                  t('services.myMachine.forms.repair.noMachineFound')
                }}</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    v-for="m in machines"
                    :key="m.id"
                    :value="m.name"
                    @select="
                      () => {
                        form.machineId = m.id;
                        openMachineCombo = false;
                      }
                    "
                  >
                    <Check
                      :class="
                        cn('mr-2 h-4 w-4', form.machineId === m.id ? 'opacity-100' : 'opacity-0')
                      "
                    />
                    {{ m.name }}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div class="flex gap-4">
        <div class="flex-1 space-y-2 text-slate-700">
          <Label class="font-semibold">{{ t('services.myMachine.forms.repair.date') }}</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="
                  cn(
                    'w-full justify-start text-left font-normal bg-white border-slate-200',
                    !form.date && 'text-muted-foreground'
                  )
                "
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ form.date ? format(form.date, 'dd/MM/yyyy') : 'Pick a date' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="repairDateValue" mode="single" initial-focus />
            </PopoverContent>
          </Popover>
        </div>
        <div class="w-1/3 space-y-2 text-slate-700">
          <Label class="font-semibold">Status</Label>
          <Select v-model="form.status">
            <SelectTrigger class="bg-white border-slate-200">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="WAITING_PARTS">Waiting Parts</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label class="text-slate-700 font-semibold">{{
          t('services.myMachine.forms.repair.technician')
        }}</Label>
        <Input
          v-model="form.technician"
          :placeholder="t('services.myMachine.forms.repair.techPlaceholder')"
          class="bg-white border-slate-200"
        />
      </div>
      <div class="space-y-2">
        <Label class="text-slate-700 font-semibold"
          >{{ t('services.myMachine.forms.repair.attachment') }}
          <span class="text-xs font-normal text-slate-500"
            >({{ t('services.myMachine.forms.repair.attachmentNote') }})</span
          ></Label
        >
        <div class="flex flex-col gap-3">
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            multiple
            accept="image/*"
            @change="handleFileChange"
          />
          <div class="flex items-center gap-2">
            <Button
              @click="triggerFileInput"
              variant="outline"
              type="button"
              class="flex-1 bg-white border-slate-200 gap-2 h-9 text-xs"
            >
              <Plus class="w-3.5 h-3.5" />
              {{ t('services.myMachine.forms.repair.takePhoto') }}
            </Button>
            <Button
              @click="triggerFileInput"
              variant="outline"
              type="button"
              class="flex-1 bg-white border-slate-200 gap-2 h-9 text-xs"
            >
              <Plus class="w-3.5 h-3.5" />
              {{ t('services.myMachine.forms.repair.attachFile') }}
            </Button>
          </div>

          <!-- Image Preview Grid -->
          <div v-if="form.images.length > 0" class="grid grid-cols-4 gap-2">
            <div
              v-for="(img, idx) in form.images"
              :key="idx"
              class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
            >
              <img :src="img" class="w-full h-full object-cover" />
              <button
                @click="removeImage(idx)"
                type="button"
                class="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <Label class="text-slate-700 font-semibold">{{
        t('services.myMachine.forms.repair.issue')
      }}</Label>
      <Textarea
        v-model="form.issue"
        :placeholder="t('services.myMachine.forms.repair.issuePlaceholder')"
        class="min-h-[80px] bg-white border-slate-200 resize-none"
      />
    </div>

    <!-- Parts Section -->
    <div class="space-y-4 border rounded-xl p-6 bg-slate-50/50 border-slate-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Package class="w-4 h-4" />
          </div>
          <h3 class="font-bold text-slate-900 uppercase text-xs tracking-wider">
            {{ t('services.myMachine.forms.repair.partsResources') }}
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          class="h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
          @click="addPartToForm"
        >
          <Plus class="w-3.5 h-3.5 mr-1" />
          {{ t('services.myMachine.forms.repair.addPart') }}
        </Button>
      </div>

      <div class="grid grid-cols-12 gap-3 items-end">
        <div class="col-span-12 md:col-span-5 space-y-1.5">
          <Label class="text-[10px] uppercase font-bold text-slate-400">{{
            t('services.myMachine.forms.repair.itemName')
          }}</Label>
          <Popover v-model:open="openStockCombo">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="openStockCombo"
                class="w-full justify-between bg-white border-slate-200 h-9"
              >
                {{ partInput.name || t('services.myMachine.forms.repair.selectStock') }}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[300px] p-0">
              <Command>
                <CommandInput :placeholder="t('services.myMachine.forms.repair.searchStock')" />
                <CommandList>
                  <CommandEmpty>{{
                    t('services.myMachine.forms.repair.noStockFound')
                  }}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      v-for="stock in stocks"
                      :key="stock.id"
                      :value="stock.name"
                      @select="() => handleStockSelect(stock.id)"
                    >
                      <Check
                        :class="
                          cn(
                            'mr-2 h-4 w-4',
                            partInput.name === stock.name ? 'opacity-100' : 'opacity-0'
                          )
                        "
                      />
                      <div class="flex flex-col">
                        <span>{{ stock.name }}</span>
                        <span class="text-[10px] text-muted-foreground"
                          >{{ stock.qty }} {{ stock.unit || t('services.myMachine.units') }}
                          {{ t('services.myMachine.forms.repair.remaining') }}</span
                        >
                      </div>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div class="col-span-4 md:col-span-2 space-y-1.5">
          <Label class="text-[10px] uppercase font-bold text-slate-400">{{
            t('services.myMachine.forms.repair.qty')
          }}</Label>
          <Input v-model="partInput.qty" type="number" class="bg-white border-slate-200 h-9" />
        </div>
        <div class="col-span-8 md:col-span-5 space-y-1.5">
          <Label class="text-[10px] uppercase font-bold text-slate-400">{{
            t('services.myMachine.forms.repair.unitPrice')
          }}</Label>
          <div class="flex gap-2">
            <Input v-model="partInput.price" type="number" class="bg-white border-slate-200 h-9" />
          </div>
        </div>
      </div>

      <!-- Parts Table (Form) -->
      <div
        v-if="form.parts.length > 0"
        class="border rounded-lg bg-white shadow-sm overflow-hidden border-slate-200"
      >
        <Table>
          <TableHeader class="bg-slate-50/50">
            <TableRow>
              <TableHead class="text-[10px] font-black uppercase text-slate-500">{{
                t('services.myMachine.forms.repair.resource')
              }}</TableHead>
              <TableHead class="text-[10px] font-black uppercase text-slate-500 text-center">{{
                t('services.myMachine.forms.repair.qty')
              }}</TableHead>
              <TableHead class="text-[10px] font-black uppercase text-slate-500 text-right">{{
                t('services.myMachine.forms.repair.cost')
              }}</TableHead>
              <TableHead class="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="p in form.parts" :key="p.id">
              <TableCell class="font-medium">{{ p.name }}</TableCell>
              <TableCell class="text-center">{{ p.qty }}</TableCell>
              <TableCell class="text-right">{{
                (p.qty * p.price).toLocaleString('th-TH')
              }}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 text-red-400 hover:text-red-600"
                  @click="removePart(p.id)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div class="p-3 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
          <TableCell class="text-[10px] font-black uppercase text-slate-400">{{
            t('services.myMachine.forms.repair.estimatedTotal')
          }}</TableCell>
          <TableCell class="text-right font-black text-blue-600 text-lg">{{
            calculateTotal(form.parts).toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}</TableCell>
        </div>
      </div>
    </div>
  </div>

  <div class="flex justify-end gap-3 pt-4 border-t mt-4">
    <Button variant="outline" @click="emit('cancel')" class="border-slate-200">{{
      t('services.myMachine.forms.common.cancel')
    }}</Button>
    <Button
      @click="handleSubmit"
      class="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 h-9 px-6 rounded-lg font-bold"
    >
      {{ t('services.myMachine.forms.repair.submit') }}
    </Button>
  </div>
</template>
