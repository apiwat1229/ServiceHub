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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { usePermissions } from '@/composables/usePermissions';
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date';
import { CalendarIcon, Check, Plus, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import Time24hPicker from './Time24hPicker.vue';

const props = defineProps<{
  initialData?: ProductionReport;
}>();

const emit = defineEmits(['saved', 'cancel']);
const { t } = useI18n();
const { hasPermission, isAdmin } = usePermissions();

const canUpdate = computed(() => isAdmin.value || hasPermission('production:update'));
const canDelete = computed(() => isAdmin.value || hasPermission('production:delete'));
const canApprove = computed(() => isAdmin.value || hasPermission('production:approve'));
const canCreate = computed(() => isAdmin.value || hasPermission('production:create'));

const isReadOnly = computed(() => {
  return props.initialData?.status === 'SUBMITTED';
});

const canRevert = computed(() => isReadOnly.value && canApprove.value);

const form = reactive<ProductionReport>({
  dryerName: 'Dryer C',
  bookNo: '',
  pageNo: '',
  productionDate: new Date().toISOString().split('T')[0],
  shift: '1st',
  grade: '',
  ratioCL: 0,
  ratioUSS: 0,
  ratioCutting: 0,
  weightPalletRemained: 0,
  sampleAccum1: 4,
  sampleAccum2: 7,
  sampleAccum3: 11,
  sampleAccum4: 14,
  sampleAccum5: 18,
  rows: [],
  baleBagLotNo: '',
  status: 'DRAFT',
});

// Date Picker State
const productionDateObject = ref<CalendarDate | undefined>(undefined);

const df = new DateFormatter('en-GB', {
  dateStyle: 'medium',
});

// Initialize date object from form data
watch(
  () => form.productionDate,
  (newDate) => {
    if (newDate) {
      try {
        const dateStr =
          typeof newDate === 'string'
            ? newDate
            : newDate instanceof Date
              ? newDate.toISOString()
              : String(newDate);
        const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        productionDateObject.value = parseDate(d);
      } catch (e) {
        console.error('Invalid date format', e);
      }
    }
  },
  { immediate: true }
);

// Update form data when date object changes
watch(productionDateObject, (newVal) => {
  if (newVal) {
    form.productionDate = newVal.toString();
  }
});

const addRow = () => {
  form.rows.push({
    startTime: '',
    palletType: 'Blue',
    lotNo: '',
    weight1: 35,
    weight2: 35,
    weight3: 35,
    weight4: 35,
    weight5: 35,
    sampleCount: 18,
  });
};

const removeRow = (index: number) => {
  form.rows.splice(index, 1);
};

const totalSample = computed(() => {
  return form.rows.reduce((sum, row) => sum + (Number(row.sampleCount) || 0), 0);
});

const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
  try {
    form.status = status;
    if (props.initialData?.id) {
      await productionReportsApi.update(props.initialData.id, form);
      toast.success(t('common.updateSuccess'));
    } else {
      await productionReportsApi.create(form);
      toast.success(t('common.saveSuccess'));
    }
    emit('saved');
  } catch (error: any) {
    console.error('Failed to save report:', error);
    toast.error(error.response?.data?.message || t('common.errorSave'));
  }
};

const handleDelete = async () => {
  if (!props.initialData?.id) return;
  try {
    await productionReportsApi.delete(props.initialData.id);
    toast.success(t('common.deleteSuccess'));
    emit('saved'); // Refresh list
  } catch (error) {
    console.error('Failed to delete report', error);
    toast.error(t('common.error'));
  }
};

const handleRevertToDraft = async () => {
  if (!props.initialData?.id) return;
  try {
    await productionReportsApi.update(props.initialData.id, {
      ...form,
      status: 'DRAFT',
    });
    toast.success(t('common.updateSuccess'));
    emit('saved');
  } catch (error: any) {
    console.error('Failed to revert report:', error);
    toast.error(error.response?.data?.message || t('common.errorSave'));
  }
};

onMounted(() => {
  if (props.initialData) {
    Object.assign(form, props.initialData);
    if (typeof form.productionDate === 'string') {
      form.productionDate = form.productionDate.split('T')[0];
    }
  } else {
    // Add 1 empty row by default
    for (let i = 0; i < 1; i++) addRow();
  }
});
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <Card class="flex-1 flex flex-col overflow-hidden border-none shadow-none bg-transparent">
      <CardContent class="flex-1 overflow-y-auto p-1 space-y-6 pr-2">
        <fieldset :disabled="isReadOnly" class="space-y-6 block disabled:opacity-100">
          <!-- Header Info -->
          <div
            class="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border shadow-sm"
          >
            <div class="space-y-2">
              <Label>{{ t('production.productionDate') }}</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="w-full justify-center text-center font-normal bg-white h-10 border-input"
                    :class="!productionDateObject && 'text-muted-foreground'"
                    :disabled="isReadOnly"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
                    {{
                      productionDateObject
                        ? df.format(productionDateObject.toDate(getLocalTimeZone()))
                        : 'Pick a date'
                    }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="productionDateObject as any" initial-focus />
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.shift') }}</Label>
              <Select v-model="form.shift" :disabled="isReadOnly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">First Shift (กะที่ 1)</SelectItem>
                  <SelectItem value="2nd">Second Shift (กะที่ 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.grade') }}</Label>
              <Input v-model="form.grade" placeholder="e.g. H0276" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.weightPalletRemained') }}</Label>
              <Input type="number" v-model.number="form.weightPalletRemained" />
            </div>
          </div>

          <!-- Ratios and Samples -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
              <h3 class="font-medium flex items-center gap-2 text-primary">
                <div class="w-1 h-5 bg-primary rounded-full" />
                Ratio (อัตราส่วน)
              </h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{ t('production.ratioCL') }}</Label>
                  <Input type="number" v-model.number="form.ratioCL" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{
                    t('production.ratioUSS')
                  }}</Label>
                  <Input type="number" v-model.number="form.ratioUSS" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{
                    t('production.ratioCutting')
                  }}</Label>
                  <Input type="number" v-model.number="form.ratioCutting" />
                </div>
              </div>
            </div>

            <div class="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
              <h3 class="font-medium flex items-center gap-2 text-primary">
                <div class="w-1 h-5 bg-primary rounded-full" />
                Accumulated Samples (จำนวนตัวอย่างสะสม)
              </h3>
              <div class="grid grid-cols-5 gap-2">
                <div class="space-y-1">
                  <Label class="text-[10px] text-muted-foreground uppercase">Pallet 1</Label>
                  <Input type="number" v-model.number="form.sampleAccum1" class="text-center" />
                </div>
                <div class="space-y-1">
                  <Label class="text-[10px] text-muted-foreground uppercase">Pallet 2</Label>
                  <Input type="number" v-model.number="form.sampleAccum2" class="text-center" />
                </div>
                <div class="space-y-1">
                  <Label class="text-[10px] text-muted-foreground uppercase">Pallet 3</Label>
                  <Input type="number" v-model.number="form.sampleAccum3" class="text-center" />
                </div>
                <div class="space-y-1">
                  <Label class="text-[10px] text-muted-foreground uppercase">Pallet 4</Label>
                  <Input type="number" v-model.number="form.sampleAccum4" class="text-center" />
                </div>
                <div class="space-y-1">
                  <Label class="text-[10px] text-muted-foreground uppercase">Pallet 5</Label>
                  <Input type="number" v-model.number="form.sampleAccum5" class="text-center" />
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="rounded-xl border shadow-sm bg-white overflow-hidden">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead class="w-24 whitespace-nowrap">{{
                    t('production.table.startTime')
                  }}</TableHead>
                  <TableHead class="w-32 whitespace-nowrap">{{
                    t('production.table.palletType')
                  }}</TableHead>
                  <TableHead class="w-40 whitespace-nowrap">{{
                    t('production.table.lotNo')
                  }}</TableHead>
                  <TableHead v-for="i in 5" :key="i" class="text-center w-24 whitespace-nowrap"
                    >Pallet {{ i }}</TableHead
                  >
                  <TableHead class="w-24 text-center whitespace-nowrap">{{
                    t('production.table.sampleCount')
                  }}</TableHead>
                  <TableHead class="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(row, index) in form.rows" :key="index">
                  <TableCell>
                    <Time24hPicker v-model="row.startTime" class="w-24" :disabled="isReadOnly" />
                  </TableCell>
                  <TableCell>
                    <Select v-model="row.palletType" :disabled="isReadOnly">
                      <SelectTrigger class="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB5">MB5</SelectItem>
                        <SelectItem value="MB4">MB4</SelectItem>
                        <SelectItem value="GPS">GPS</SelectItem>
                        <SelectItem value="Blue">Blue</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input v-model="row.lotNo" class="h-8 w-full" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" v-model.number="row.weight1" class="h-8 text-center" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" v-model.number="row.weight2" class="h-8 text-center" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" v-model.number="row.weight3" class="h-8 text-center" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" v-model.number="row.weight4" class="h-8 text-center" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" v-model.number="row.weight5" class="h-8 text-center" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" v-model.number="row.sampleCount" class="h-8 text-center" />
                  </TableCell>
                  <TableCell>
                    <AlertDialog v-if="!isReadOnly">
                      <AlertDialogTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 class="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{{ t('common.deleteConfirm') }}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {{ t('common.deleteConfirmMessage') }}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                          <AlertDialogAction
                            @click="removeRow(index)"
                            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {{ t('common.delete') }}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div class="p-2 border-t bg-muted/10" v-if="!isReadOnly">
              <Button
                variant="ghost"
                size="sm"
                @click="addRow"
                class="gap-2 text-muted-foreground hover:text-primary"
              >
                <Plus class="h-4 w-4" />
                Add Row
              </Button>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label>{{ t('production.footer.baleBagLotNo') }}</Label>
                  <Input v-model="form.baleBagLotNo" placeholder="PE 9.12.67, 25.1.68..." />
                </div>
                <div
                  class="flex items-center gap-4 p-4 border rounded-xl bg-blue-50/50 border-blue-100"
                >
                  <div
                    class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl"
                  >
                    {{ totalSample }}
                  </div>
                  <div>
                    <div class="text-sm font-bold text-foreground">TOTAL SAMPLES</div>
                    <div class="text-xs text-muted-foreground">รวมจำนวนตัวอย่าง</div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <Label>{{ t('production.footer.issuedBy') }}</Label>
                  <Input v-model="form.issuedBy" />
                </div>
                <div class="space-y-2">
                  <Label>{{ t('production.footer.checkedBy') }}</Label>
                  <Input v-model="form.checkedBy" />
                </div>
                <div class="space-y-2 col-span-2">
                  <Label>{{ t('production.footer.judgedBy') }}</Label>
                  <Input v-model="form.judgedBy" />
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4 border-t">
          <!-- Left: Delete & Revert -->
          <div class="flex items-center gap-3">
            <AlertDialog v-if="props.initialData?.id && !isReadOnly && canDelete">
              <AlertDialogTrigger as-child>
                <Button variant="ghost" class="text-destructive hover:bg-destructive/10 gap-2">
                  <Trash2 class="h-4 w-4" />
                  {{ t('common.delete') }}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ t('common.deleteConfirm') }}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {{ t('common.deleteWarning') }}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                  <AlertDialogAction
                    @click="handleDelete"
                    class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {{ t('common.delete') }}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <!-- Revert to Draft (only for Submitted + authorized) -->
            <AlertDialog v-if="canRevert">
              <AlertDialogTrigger as-child>
                <Button
                  variant="outline"
                  class="text-orange-600 border-orange-200 hover:bg-orange-50 gap-2"
                >
                  <Plus class="h-4 w-4 rotate-45" />
                  Revert to Draft
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revert to Draft?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will unlock the report for editing. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                  <AlertDialogAction
                    @click="handleRevertToDraft"
                    class="bg-orange-600 hover:bg-orange-700"
                  >
                    Confirm Revert
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-3">
            <Button variant="ghost" @click="emit('cancel')">
              {{ isReadOnly ? t('common.close') : t('common.cancel') }}
            </Button>

            <template v-if="(!isReadOnly && canUpdate) || (!props.initialData?.id && canCreate)">
              <Button
                variant="outline"
                @click="handleSave('DRAFT')"
                class="bg-white border-slate-200 shadow-sm"
              >
                {{ t('production.saveDraft') }}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button class="gap-2 shadow-sm shadow-primary/20">
                    <Check class="h-4 w-4" />
                    {{ t('production.submitReport') }}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{{ t('common.confirm') }}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {{ t('common.areYouSure') }}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                    <AlertDialogAction @click="handleSave('SUBMITTED')">
                      {{ t('common.confirm') }}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </template>
          </div>
        </div>

        <!-- Bottom Spacer -->
        <div class="h-20"></div>
      </CardContent>
    </Card>
  </div>
</template>
