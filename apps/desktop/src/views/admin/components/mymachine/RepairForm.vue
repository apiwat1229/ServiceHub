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
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Package,
  Plus,
  Trash2,
} from 'lucide-vue-next';
import { ref } from 'vue';

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
}>(
  props.initialData
    ? { ...props.initialData, date: new Date(props.initialData.date) }
    : {
        machineId: '',
        date: new Date(),
        issue: '',
        technician: '',
        parts: [],
      }
);

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

const handleSubmit = () => {
  if (!form.value.machineId) return;
  const selectedMachine = machines.value.find((m) => m.id === form.value.machineId);

  const payload = {
    ...form.value,
    date: format(form.value.date, 'yyyy-MM-dd'),
    machineName: selectedMachine ? selectedMachine.name : 'Unknown',
    totalCost: calculateTotal(form.value.parts),
  };
  emit('save', payload);
};
</script>

<template>
  <div class="space-y-6 py-4">
    <!-- Main Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="flex flex-col gap-2">
        <Label class="text-slate-700 font-semibold"
          >Machine <span class="text-red-500">*</span></Label
        >
        <Popover v-model:open="openMachineCombo">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              role="combobox"
              :aria-expanded="openMachineCombo"
              class="justify-between bg-white border-slate-200"
            >
              {{
                form.machineId
                  ? machines.find((m) => m.id === form.machineId)?.name
                  : 'Select target machine...'
              }}
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search machine..." />
              <CommandEmpty>No machine found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  <CommandItem
                    v-for="machine in machines"
                    :key="machine.id"
                    :value="machine.name"
                    @select="
                      () => {
                        form.machineId = machine.id;
                        openMachineCombo = false;
                      }
                    "
                  >
                    <Check
                      :class="
                        cn(
                          'mr-2 h-4 w-4 text-blue-600',
                          form.machineId === machine.id ? 'opacity-100' : 'opacity-0'
                        )
                      "
                    />
                    {{ machine.name }}
                    <span class="ml-2 text-xs text-muted-foreground">({{ machine.model }})</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div class="flex flex-col gap-2">
        <Label class="text-slate-700 font-semibold">Responsible Technician</Label>
        <Input
          v-model="form.technician"
          placeholder="Technician Name"
          class="bg-white border-slate-200"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="flex flex-col gap-2">
        <Label class="text-slate-700 font-semibold">Maintenance Date</Label>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="justify-start text-left font-normal bg-white border-slate-200"
              :class="!form.date && 'text-muted-foreground'"
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              {{ form.date ? format(form.date, 'PPP') : 'Pick a date' }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0 border-none shadow-xl">
            <Calendar v-model="form.date as any" mode="single" initial-focus />
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <Label class="text-slate-700 font-semibold">Issue Description & Remarks</Label>
      <Textarea
        v-model="form.issue"
        placeholder="Describe the findings and actions taken..."
        class="bg-white border-slate-200 min-h-[80px]"
      />
    </div>

    <!-- Parts Section -->
    <div class="space-y-4 border rounded-xl p-6 bg-slate-50/50 border-slate-200">
      <div class="flex items-center gap-2 mb-2">
        <div class="p-1.5 bg-blue-50 text-blue-500 rounded-md">
          <Package :size="18" />
        </div>
        <h3 class="font-bold text-slate-900">Spare Parts Utilization</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div class="md:col-span-4 flex flex-col gap-2">
          <Label class="text-xs font-semibold text-slate-500">Search Stock</Label>
          <Popover v-model:open="openStockCombo">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="openStockCombo"
                class="justify-between w-full bg-white border-slate-200 h-9"
              >
                <span class="truncate">{{
                  partInput.isStock ? partInput.name : 'Select from inventory...'
                }}</span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[300px] p-0 shadow-xl">
              <Command>
                <CommandInput placeholder="Search parts..." />
                <CommandEmpty>No parts found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      v-for="stock in stocks"
                      :key="stock.id"
                      :value="stock.name"
                      @select="handleStockSelect(stock.id)"
                    >
                      <Check
                        :class="
                          cn(
                            'mr-2 h-4 w-4 text-blue-600',
                            partInput.name === stock.name ? 'opacity-100' : 'opacity-0'
                          )
                        "
                      />
                      {{ stock.name }}
                      <span class="ml-auto text-xs text-muted-foreground"
                        >Available: {{ stock.qty }}</span
                      >
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div class="md:col-span-4 flex flex-col gap-2">
          <Label class="text-xs font-semibold text-slate-500">Part Name (Manual)</Label>
          <Input
            v-model="partInput.name"
            placeholder="Enter name"
            class="bg-white border-slate-200 h-9"
          />
        </div>

        <div class="md:col-span-1 flex flex-col gap-2">
          <Label class="text-xs font-semibold text-slate-500">Quantity</Label>
          <Input
            type="number"
            min="1"
            v-model="partInput.qty"
            class="bg-white border-slate-200 h-9"
          />
        </div>

        <div class="md:col-span-2 flex flex-col gap-2">
          <Label class="text-xs font-semibold text-slate-500">Price (EA)</Label>
          <Input
            type="number"
            min="0"
            v-model="partInput.price"
            class="bg-white border-slate-200 h-9"
          />
        </div>

        <div class="md:col-span-1">
          <Button
            @click="addPartToForm"
            size="icon"
            variant="secondary"
            class="w-full h-9 bg-slate-200 hover:bg-slate-300"
          >
            <Plus :size="16" />
          </Button>
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
              <TableHead class="font-bold text-slate-700">Part Description</TableHead>
              <TableHead class="text-center font-bold text-slate-700">Qty</TableHead>
              <TableHead class="text-right font-bold text-slate-700">Unit Price</TableHead>
              <TableHead class="text-right font-bold text-slate-700">Total</TableHead>
              <TableHead class="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="p in form.parts" :key="p.id">
              <TableCell class="font-medium">{{ p.name }}</TableCell>
              <TableCell class="text-center">{{ p.qty }}</TableCell>
              <TableCell class="text-right">฿{{ p.price.toLocaleString() }}</TableCell>
              <TableCell class="text-right font-bold text-slate-700"
                >฿{{ (p.qty * p.price).toLocaleString() }}</TableCell
              >
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  @click="removePart(p.id)"
                >
                  <Trash2 :size="14" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow class="bg-slate-50/30">
              <TableCell
                colspan="3"
                class="text-right font-bold text-slate-600 uppercase text-xs tracking-wider"
                >Estimated Total Cost</TableCell
              >
              <TableCell class="text-right font-black text-blue-600 text-lg"
                >฿{{ calculateTotal(form.parts).toLocaleString() }}</TableCell
              >
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>

  <div class="flex justify-end gap-3 pt-6 border-t mt-4">
    <Button variant="outline" @click="emit('cancel')" class="border-slate-200">Cancel</Button>
    <Button @click="handleSubmit" class="bg-blue-600 hover:bg-blue-700 shadow-md"
      >Submit Maintenance Log</Button
    >
  </div>
</template>
