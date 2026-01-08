<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import Spinner from '@/components/ui/spinner/Spinner.vue';
import { cn } from '@/lib/utils';
import { contractsService, type Contract } from '@/services/contracts';
import { parseDate, type DateValue } from '@internationalized/date';
import { format } from 'date-fns';
import {
  Bell,
  Calendar as CalendarIcon,
  Check,
  CreditCard,
  FileText,
  ShieldCheck,
  UploadCloud,
  Users,
  X,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const isEditMode = ref(false);
const loading = ref(false);
const saving = ref(false);

const formData = ref<Partial<Contract>>({
  title: '',
  contractType: 'Service',
  cost: 0,
  period: '1 Year',
  startDate: '',
  endDate: '',
  responsiblePerson: '',
  department: '',
  status: 'Active',
  notificationEmails: [],
});

const notificationEmailInput = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const filePreview = ref<string | null>(null);
const fileType = ref<string | null>(null);

onMounted(async () => {
  const id = route.params.id as string;
  if (id) {
    isEditMode.value = true;
    loading.value = true;
    try {
      const contract = await contractsService.getContract(id);
      if (contract) {
        formData.value = { ...contract };
        // Set preview if file exists
        if (contract.fileUrl) {
          filePreview.value = contract.fileUrl;
          // Detect file type from URL
          if (contract.fileUrl.toLowerCase().endsWith('.pdf')) {
            fileType.value = 'pdf';
          } else if (contract.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
            fileType.value = 'image';
          }
        }
      } else {
        toast.error(t('services.contracts.contractNotFound'));
        router.push('/admin/contracts');
      }
    } catch (err) {
      toast.error(t('services.contracts.errorLoading'));
    } finally {
      loading.value = false;
    }
  }
});

const handleSave = async () => {
  if (!formData.value.title || !formData.value.startDate) {
    toast.error(t('services.contracts.fillRequired'));
    return;
  }

  saving.value = true;
  try {
    if (isEditMode.value && route.params.id) {
      await contractsService.updateContract(route.params.id as string, formData.value);
      toast.success(t('services.contracts.contractUpdated'));
    } else {
      await contractsService.createContract(formData.value as Omit<Contract, 'id' | 'status'>);
      toast.success(t('services.contracts.contractCreated'));
    }
    router.push('/admin/contracts');
  } catch (err) {
    console.error(err);
    toast.error(t('services.contracts.errorSaving'));
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  router.back();
};

const addEmail = () => {
  if (
    notificationEmailInput.value &&
    !formData.value.notificationEmails?.includes(notificationEmailInput.value)
  ) {
    formData.value.notificationEmails = [
      ...(formData.value.notificationEmails || []),
      notificationEmailInput.value,
    ];
    notificationEmailInput.value = '';
  }
};

const removeEmail = (email: string) => {
  formData.value.notificationEmails = formData.value.notificationEmails?.filter((e) => e !== email);
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    // Create mock URL for preview
    formData.value.fileUrl = URL.createObjectURL(file);

    // Detect file type
    if (file.type === 'application/pdf') {
      fileType.value = 'pdf';
      filePreview.value = formData.value.fileUrl;
    } else if (file.type.startsWith('image/')) {
      fileType.value = 'image';
      filePreview.value = formData.value.fileUrl;
    } else {
      fileType.value = null;
      filePreview.value = null;
    }
  }
};

const removeFile = () => {
  formData.value.fileUrl = undefined;
  filePreview.value = null;
  fileType.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const openFile = () => {
  if (formData.value.fileUrl) {
    window.open(formData.value.fileUrl, '_blank');
  }
};

// Helper to handle DateValue <-> ISO String conversion
const startDateObj = computed({
  get: () => {
    if (!formData.value.startDate) return undefined;
    try {
      return parseDate(formData.value.startDate.split('T')[0]);
    } catch {
      return undefined;
    }
  },
  set: (val: DateValue | undefined) => {
    formData.value.startDate = val ? val.toString() : '';
  },
});

const endDateObj = computed({
  get: () => {
    if (!formData.value.endDate) return undefined;
    try {
      return parseDate(formData.value.endDate.split('T')[0]);
    } catch {
      return undefined;
    }
  },
  set: (val: DateValue | undefined) => {
    formData.value.endDate = val ? val.toString() : '';
  },
});
</script>

<template>
  <div class="min-h-screen flex flex-col max-w-[1600px] mx-auto p-6 space-y-6 pb-32">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-4">
        <Spinner class="h-12 w-12 text-primary animate-spin" />
        <p class="text-muted-foreground font-medium">
          {{ t('services.contracts.loadingContract') }}
        </p>
      </div>
    </div>

    <form v-else @submit.prevent="handleSave" class="h-full flex flex-col space-y-6">
      <!-- Header Card -->
      <Card class="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent
          class="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <!-- Title Section -->
          <div class="flex items-center gap-4 min-w-fit">
            <div class="p-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <FileText class="h-8 w-8" />
            </div>
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-foreground">
                {{
                  isEditMode
                    ? t('services.contracts.editContract')
                    : t('services.contracts.newContract')
                }}
              </h1>
              <p class="text-sm text-muted-foreground">
                {{
                  isEditMode
                    ? t('services.contracts.updateContractInfo')
                    : t('services.contracts.createNewContract')
                }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 self-end lg:self-center">
            <div class="flex items-center gap-2">
              <Label class="text-xs text-muted-foreground">{{
                t('services.contracts.status.label')
              }}</Label>
              <Select v-model="formData.status">
                <SelectTrigger class="h-9 w-[130px] bg-background border-input/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{{
                    t('services.contracts.status.active')
                  }}</SelectItem>
                  <SelectItem value="Expiring">{{
                    t('services.contracts.status.expiring')
                  }}</SelectItem>
                  <SelectItem value="Expired">{{
                    t('services.contracts.status.expired')
                  }}</SelectItem>
                  <SelectItem value="Draft">{{ t('services.contracts.status.draft') }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="h-6 w-px bg-border hidden sm:block"></div>

            <Button type="button" variant="ghost" @click="handleCancel" class="h-9 px-4">
              {{ t('services.contracts.actions.cancel') }}
            </Button>
            <Button
              type="submit"
              :disabled="saving"
              class="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Spinner v-if="saving" class="mr-2 h-4 w-4" />
              <Check v-else class="mr-2 w-4 h-4" />
              {{
                isEditMode
                  ? t('services.contracts.actions.save')
                  : t('services.contracts.actions.create')
              }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <!-- Left Column - Form Fields (2/3) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Information -->
          <Card class="border-border/50 shadow-sm">
            <CardHeader class="pb-4">
              <CardTitle class="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck class="w-5 h-5 text-blue-600" />
                {{ t('services.contracts.form.contractInfo') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-6">
              <!-- Title -->
              <div class="space-y-2">
                <Label for="title" class="text-sm font-medium">
                  {{ t('services.contracts.form.contractTitle') }}
                  <span class="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  v-model="formData.title"
                  :placeholder="t('services.contracts.form.contractTitlePlaceholder')"
                  class="h-10"
                  required
                />
              </div>

              <!-- Type & Cost -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <Label for="type" class="text-sm font-medium">
                    {{ t('services.contracts.form.contractType') }}
                  </Label>
                  <Select v-model="formData.contractType">
                    <SelectTrigger class="h-10">
                      <SelectValue :placeholder="t('services.contracts.form.selectType')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service">
                        {{ t('services.contracts.types.service') }}
                      </SelectItem>
                      <SelectItem value="Lease">
                        {{ t('services.contracts.types.lease') }}
                      </SelectItem>
                      <SelectItem value="Software">
                        {{ t('services.contracts.types.software') }}
                      </SelectItem>
                      <SelectItem value="Maintenance">
                        {{ t('services.contracts.types.maintenance') }}
                      </SelectItem>
                      <SelectItem value="Other">
                        {{ t('services.contracts.types.other') }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-2">
                  <Label for="cost" class="text-sm font-medium">
                    {{ t('services.contracts.form.totalCost') }}
                  </Label>
                  <div class="relative">
                    <CreditCard
                      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                    />
                    <Input
                      id="cost"
                      type="number"
                      v-model="formData.cost"
                      :placeholder="t('services.contracts.form.costPlaceholder')"
                      class="h-10 pl-10"
                    />
                  </div>
                </div>
              </div>

              <!-- Dates -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-2">
                  <Label class="text-sm font-medium">
                    {{ t('services.contracts.form.startDate') }}
                  </Label>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button
                        variant="outline"
                        :class="
                          cn(
                            'h-10 w-full justify-start text-left font-normal',
                            !formData.startDate && 'text-muted-foreground'
                          )
                        "
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{
                          formData.startDate
                            ? format(new Date(formData.startDate), 'dd-MMM-yyyy')
                            : t('services.contracts.form.pickDate')
                        }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <Calendar v-model="startDateObj" mode="single" initial-focus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div class="space-y-2">
                  <Label class="text-sm font-medium">
                    {{ t('services.contracts.form.endDate') }}
                  </Label>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button
                        variant="outline"
                        :class="
                          cn(
                            'h-10 w-full justify-start text-left font-normal',
                            !formData.endDate && 'text-muted-foreground'
                          )
                        "
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{
                          formData.endDate
                            ? format(new Date(formData.endDate), 'dd-MMM-yyyy')
                            : t('services.contracts.form.pickDate')
                        }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <Calendar v-model="endDateObj" mode="single" initial-focus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div class="space-y-2">
                  <Label for="period" class="text-sm font-medium">
                    {{ t('services.contracts.form.period') }}
                  </Label>
                  <Select v-model="formData.period">
                    <SelectTrigger class="h-10">
                      <SelectValue :placeholder="t('services.contracts.form.selectPeriod')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Month">
                        {{ t('services.contracts.dashboard.periods.1month') }}
                      </SelectItem>
                      <SelectItem value="3 Months">
                        {{ t('services.contracts.dashboard.periods.3months') }}
                      </SelectItem>
                      <SelectItem value="6 Months">
                        {{ t('services.contracts.dashboard.periods.6months') }}
                      </SelectItem>
                      <SelectItem value="1 Year">1 Year</SelectItem>
                      <SelectItem value="2 Years">2 Years</SelectItem>
                      <SelectItem value="3 Years">3 Years</SelectItem>
                      <SelectItem value="5 Years">5 Years</SelectItem>
                      <SelectItem value="10 Years">10 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Governance -->
          <Card class="border-border/50 shadow-sm">
            <CardHeader class="pb-4">
              <CardTitle class="text-lg font-semibold flex items-center gap-2">
                <Users class="w-5 h-5 text-blue-600" />
                {{ t('services.contracts.form.governance') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-6">
              <!-- Responsible Person & Department -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <Label for="responsible" class="text-sm font-medium">
                    {{ t('services.contracts.form.responsiblePerson') }}
                  </Label>
                  <Input
                    id="responsible"
                    v-model="formData.responsiblePerson"
                    :placeholder="t('services.contracts.form.enterName')"
                    class="h-10"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="department" class="text-sm font-medium">
                    {{ t('services.contracts.form.department') }}
                  </Label>
                  <Select v-model="formData.department">
                    <SelectTrigger class="h-10">
                      <SelectValue :placeholder="t('services.contracts.form.selectDepartment')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">Information Technology</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Admin">Administration</SelectItem>
                      <SelectItem value="Logistics">Logistics & Supply</SelectItem>
                      <SelectItem value="Safety">Safety & Compliance</SelectItem>
                      <SelectItem value="Facility">Facility Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="h-px bg-border" />

              <!-- Notification Emails -->
              <div class="space-y-4">
                <div class="flex items-center gap-2">
                  <Bell class="w-4 h-4 text-muted-foreground" />
                  <Label class="text-sm font-medium">
                    {{ t('services.contracts.form.notificationRecipients') }}
                  </Label>
                </div>

                <div class="flex gap-2">
                  <Input
                    v-model="notificationEmailInput"
                    :placeholder="t('services.contracts.form.emailPlaceholder')"
                    class="h-10"
                    @keydown.enter.prevent="addEmail"
                  />
                  <Button
                    type="button"
                    @click="addEmail"
                    class="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {{ t('services.contracts.form.addEmail') }}
                  </Button>
                </div>

                <div
                  class="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg bg-muted/30 border border-dashed border-border"
                >
                  <div
                    v-for="email in formData.notificationEmails"
                    :key="email"
                    class="bg-background border border-border pl-3 pr-2 py-1.5 rounded-md text-sm flex items-center gap-2"
                  >
                    <span>{{ email }}</span>
                    <button
                      type="button"
                      @click="removeEmail(email)"
                      class="text-muted-foreground hover:text-destructive p-0.5 rounded hover:bg-destructive/10 transition-colors"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </div>
                  <div
                    v-if="!formData.notificationEmails?.length"
                    class="flex items-center gap-2 w-full justify-center py-4 text-muted-foreground text-sm"
                  >
                    <Bell class="w-4 h-4" />
                    <span>{{ t('services.contracts.form.noRecipientsAdded') }}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column - Document Upload (1/3) -->
        <div class="lg:col-span-1">
          <Card class="border-border/50 shadow-sm sticky top-6">
            <CardHeader class="pb-4">
              <CardTitle
                class="text-sm font-semibold flex items-center gap-2 text-muted-foreground"
              >
                <FileText class="w-4 h-4" />
                {{ t('services.contracts.form.documentAttachment') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Preview Area -->
              <div
                class="relative w-full max-w-[280px] mx-auto rounded-lg overflow-hidden border-2 border-border bg-muted/30 group/preview"
                style="height: 400px"
              >
                <div v-if="formData.fileUrl" class="w-full h-full relative overflow-auto">
                  <!-- Image Preview -->
                  <img
                    v-if="fileType === 'image'"
                    :src="filePreview ?? undefined"
                    class="w-full h-full object-contain"
                    alt="Contract document preview"
                  />

                  <!-- PDF Preview -->
                  <iframe
                    v-else-if="fileType === 'pdf'"
                    :src="filePreview ?? undefined"
                    class="w-full h-full border-0"
                    title="PDF Preview"
                  />

                  <!-- Generic File Preview -->
                  <div
                    v-else
                    class="w-full h-full flex flex-col items-center justify-center bg-background p-6 text-center"
                  >
                    <div
                      class="w-20 h-20 bg-blue-50 rounded-lg flex items-center justify-center mb-4"
                    >
                      <FileText class="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 class="text-sm font-semibold text-foreground mb-2">
                      {{ t('services.contracts.form.documentAttached') }}
                    </h3>
                    <p class="text-xs text-muted-foreground">
                      {{ t('services.contracts.form.fileReady') }}
                    </p>
                  </div>

                  <!-- Hover Overlay -->
                  <div
                    class="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3"
                  >
                    <Button
                      type="button"
                      size="sm"
                      @click="openFile"
                      class="bg-white text-foreground hover:bg-white/90"
                    >
                      {{ t('services.contracts.form.viewFile') }}
                    </Button>
                    <Button type="button" size="sm" variant="destructive" @click="removeFile">
                      {{ t('services.contracts.form.remove') }}
                    </Button>
                  </div>
                </div>

                <!-- Empty State -->
                <div
                  v-else
                  class="w-full h-full flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  @click="triggerFileInput"
                >
                  <div class="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <UploadCloud class="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 class="text-sm font-semibold text-foreground mb-1">
                    {{ t('services.contracts.form.uploadDocument') }}
                  </h3>
                  <p class="text-xs text-muted-foreground mb-4">
                    {{ t('services.contracts.form.fileSupport') }}
                  </p>
                  <div class="px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-medium">
                    {{ t('services.contracts.form.selectFile') }}
                  </div>
                </div>
              </div>

              <!-- Info -->
              <div class="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p class="text-xs text-muted-foreground leading-relaxed">
                  {{ t('services.contracts.form.uploadHelp') }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Hidden File Input -->
      <input
        type="file"
        ref="fileInput"
        class="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        @change="handleFileSelect"
      />
    </form>
  </div>
</template>

<style scoped>
/* Smooth transitions for interactive elements */
input,
select,
button {
  @apply transition-colors duration-200;
}
</style>
