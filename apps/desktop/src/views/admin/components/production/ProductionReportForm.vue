<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import { Check, ChevronLeft, Plus, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const props = defineProps<{
  initialData?: ProductionReport;
}>();

const emit = defineEmits(['saved', 'cancel']);
const { t } = useI18n();

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
  sampleAccum1: 0,
  sampleAccum2: 0,
  sampleAccum3: 0,
  sampleAccum4: 0,
  sampleAccum5: 0,
  rows: [],
  baleBagLotNo: '',
  status: 'DRAFT',
});

const addRow = () => {
  form.rows.push({
    startTime: '',
    palletType: 'Blue',
    lotNo: '',
    weight1: 0,
    weight2: 0,
    weight3: 0,
    weight4: 0,
    weight5: 0,
    sampleCount: 0,
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

onMounted(() => {
  if (props.initialData) {
    Object.assign(form, props.initialData);
    if (typeof form.productionDate === 'string') {
      form.productionDate = form.productionDate.split('T')[0];
    }
  } else {
    // Add 5 empty rows by default
    for (let i = 0; i < 5; i++) addRow();
  }
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="emit('cancel')">
        <ChevronLeft class="h-5 w-5" />
      </Button>
      <h2 class="text-xl font-semibold">
        {{ initialData ? t('common.edit') : t('production.createReport') }}
      </h2>
    </div>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <CardTitle class="text-2xl font-bold text-primary">{{ form.dryerName }}</CardTitle>
            <CardDescription>Production & Quality Daily Report</CardDescription>
          </div>
          <div class="flex gap-4">
            <div class="space-y-1">
              <Label>{{ t('production.bookNo') }}</Label>
              <Input v-model="form.bookNo" class="w-24" />
            </div>
            <div class="space-y-1">
              <Label>{{ t('production.pageNo') }}</Label>
              <Input v-model="form.pageNo" class="w-24" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Header Info -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="space-y-2">
            <Label>{{ t('production.productionDate') }}</Label>
            <Input type="date" v-model="form.productionDate as string" />
          </div>
          <div class="space-y-2">
            <Label>{{ t('production.shift') }}</Label>
            <Select v-model="form.shift">
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6">
          <div class="space-y-4">
            <h3 class="font-medium flex items-center gap-2">
              <div class="w-1 h-4 bg-primary rounded-full" />
              Ratio (อัตราส่วน)
            </h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="space-y-1">
                <Label>{{ t('production.ratioCL') }}</Label>
                <Input type="number" v-model.number="form.ratioCL" />
              </div>
              <div class="space-y-1">
                <Label>{{ t('production.ratioUSS') }}</Label>
                <Input type="number" v-model.number="form.ratioUSS" />
              </div>
              <div class="space-y-1">
                <Label>{{ t('production.ratioCutting') }}</Label>
                <Input type="number" v-model.number="form.ratioCutting" />
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium flex items-center gap-2">
              <div class="w-1 h-4 bg-primary rounded-full" />
              Accumulated Samples (จำนวนตัวอย่างสะสม 1 lot no.)
            </h3>
            <div class="grid grid-cols-5 gap-2">
              <div class="space-y-1">
                <Label class="text-[10px] text-muted-foreground uppercase">Pallet 1</Label>
                <Input type="number" v-model.number="form.sampleAccum1" />
              </div>
              <div class="space-y-1">
                <Label class="text-[10px] text-muted-foreground uppercase">Pallet 2</Label>
                <Input type="number" v-model.number="form.sampleAccum2" />
              </div>
              <div class="space-y-1">
                <Label class="text-[10px] text-muted-foreground uppercase">Pallet 3</Label>
                <Input type="number" v-model.number="form.sampleAccum3" />
              </div>
              <div class="space-y-1">
                <Label class="text-[10px] text-muted-foreground uppercase">Pallet 4</Label>
                <Input type="number" v-model.number="form.sampleAccum4" />
              </div>
              <div class="space-y-1">
                <Label class="text-[10px] text-muted-foreground uppercase">Pallet 5</Label>
                <Input type="number" v-model.number="form.sampleAccum5" />
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader class="bg-muted/50">
              <TableRow>
                <TableHead class="w-24">{{ t('production.table.startTime') }}</TableHead>
                <TableHead class="w-32">{{ t('production.table.palletType') }}</TableHead>
                <TableHead class="w-40">{{ t('production.table.lotNo') }}</TableHead>
                <TableHead v-for="i in 5" :key="i" class="text-center">P{{ i }}</TableHead>
                <TableHead class="w-24 text-center">{{
                  t('production.table.sampleCount')
                }}</TableHead>
                <TableHead class="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(row, index) in form.rows" :key="index">
                <TableCell>
                  <Input v-model="row.startTime" placeholder="00:00" class="h-8" />
                </TableCell>
                <TableCell>
                  <Select v-model="row.palletType">
                    <SelectTrigger class="h-8">
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
                  <Input v-model="row.lotNo" class="h-8" />
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
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="removeRow(index)"
                    class="h-8 w-8 text-destructive"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div class="p-2 border-t bg-muted/20">
            <Button variant="ghost" size="sm" @click="addRow" class="gap-2">
              <Plus class="h-4 w-4" />
              Add Row
            </Button>
          </div>
        </div>

        <!-- Footer -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div class="space-y-4">
            <div class="space-y-2">
              <Label>{{ t('production.footer.baleBagLotNo') }}</Label>
              <Input v-model="form.baleBagLotNo" placeholder="PE 9.12.67, 25.1.68..." />
            </div>
            <div class="flex items-center gap-4 p-4 border rounded-lg bg-primary/5">
              <div class="text-2xl font-bold text-primary">{{ totalSample }}</div>
              <div class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Samples<br />รวมจำนวนตัวอย่าง
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>{{ t('production.footer.issuedBy') }}</Label>
              <Input v-model="form.issuedBy" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.footer.checkedBy') }}</Label>
              <Input v-model="form.checkedBy" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('production.footer.judgedBy') }}</Label>
              <Input v-model="form.judgedBy" />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" @click="handleSave('DRAFT')">
            {{ t('common.save') }}
          </Button>
          <Button @click="handleSave('SUBMITTED')" class="gap-2">
            <Check class="h-4 w-4" />
            {{ t('common.confirm') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
