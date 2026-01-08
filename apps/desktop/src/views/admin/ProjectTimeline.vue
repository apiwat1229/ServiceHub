<script setup lang="ts">
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usersApi, type User } from '@/services/users';
import { parseDate, type DateValue } from '@internationalized/date';
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isBefore,
  isSameDay,
  isWeekend,
  max,
  min,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';
import { enGB, th } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  FolderPlus,
  LayoutGrid,
  Plus,
  Save,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// --- Types ---
interface Project {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  color: string;
}

interface Task {
  id: number;
  projectId: number;
  title: string;
  assignee: string;
  start: string; // YYYY-MM-DD
  end: string;
  color: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Review';
  progress: number;
}

interface TaskFormData extends Omit<Task, 'id'> {
  id?: number;
}

// --- Constants ---
const COL_WIDTH = 60;
const STORAGE_KEY = 'project_timeline_data_v2';

const COLORS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Teal', value: 'bg-teal-500' },
];

const STATUS_OPTIONS = ['Planning', 'In Progress', 'Completed', 'Review'];

const PROJECT_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
];

// --- State ---
const { locale } = useI18n();
const viewMode = ref<'list' | 'detail'>('list');

const allTasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);
const selectedProject = ref<Project | null>(null);

// Modal States
const isTaskModalOpen = ref(false);
const isProjectModalOpen = ref(false);

const editingTask = ref<Task | null>(null);

// --- Modal Upgrades State ---
const users = ref<User[]>([]);
const openAssignee = ref(false);
const openStartDate = ref(false);
const openEndDate = ref(false);

const taskFormData = ref<TaskFormData>({
  projectId: 0,
  title: '',
  assignee: '', // Stored as "User A, User B"
  start: '',
  end: '',
  color: 'bg-blue-500',
  status: 'Planning',
  progress: 0,
});

// Fetch users
onMounted(async () => {
  try {
    const res = await usersApi.getAll();
    users.value = res;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
});

// Helper for multi-select assignee
const selectedAssignees = computed({
  get: () => {
    if (!taskFormData.value.assignee) return [];
    return taskFormData.value.assignee
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  },
  set: (val: string[]) => {
    taskFormData.value.assignee = val.join(', ');
  },
});

const toggleAssignee = (username: string) => {
  const current = new Set(selectedAssignees.value);
  if (current.has(username)) {
    current.delete(username);
  } else {
    current.add(username);
  }
  selectedAssignees.value = Array.from(current);
};

// Date Formatters
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return 'Pick a date';
  try {
    return format(parseISO(dateStr), 'dd-MMM-yyyy');
  } catch (e) {
    return dateStr;
  }
};

const handleDateSelect = (date: DateValue | undefined, field: 'start' | 'end') => {
  if (!date) return;
  taskFormData.value[field] = date.toString();
  if (field === 'start') openStartDate.value = false;
  if (field === 'end') openEndDate.value = false;
};

const projectFormData = ref({
  title: '',
  description: '',
});

// --- Computed ---
const dateLocale = computed(() => (locale.value === 'th' ? th : enGB));

const currentProjectTasks = computed(() => {
  if (!selectedProject.value) return [];
  return allTasks.value.filter((t) => t.projectId === selectedProject.value?.id);
});

const timelineData = computed(() => {
  const tasks = currentProjectTasks.value;
  if (tasks.length === 0) {
    const today = startOfDay(new Date());
    return {
      timelineDays: eachDayOfInterval({ start: subDays(today, 2), end: addDays(today, 5) }),
      startDate: subDays(today, 2),
      totalDays: 8,
    };
  }

  const startDates = tasks.map((t) => parseISO(t.start));
  const endDates = tasks.map((t) => parseISO(t.end));

  const minDate = subDays(min(startDates), 2);
  const maxDate = addDays(max(endDates), 5);

  const days = eachDayOfInterval({ start: minDate, end: maxDate });

  return {
    timelineDays: days,
    startDate: minDate,
    totalDays: days.length,
  };
});

// --- Methods: Persistence ---
const loadData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      projects.value = data.projects || [];
      allTasks.value = data.tasks || [];
    } catch (e) {
      console.error('Failed to parse data', e);
    }
  } else {
    // Check for legacy v1 data
    const legacyTasks = localStorage.getItem('project_timeline_tasks');
    if (legacyTasks) {
      try {
        const parsedLegacy = JSON.parse(legacyTasks);
        // Create a default project
        const defaultProject: Project = {
          id: Date.now(),
          title: 'Migrated Project',
          description: 'Project migrated from previous version',
          createdAt: new Date().toISOString(),
          color: PROJECT_COLORS[0],
        };
        projects.value = [defaultProject];
        allTasks.value = parsedLegacy.map((t: any) => ({
          ...t,
          projectId: defaultProject.id,
          status: t.status || 'Planning',
          progress: t.progress || 0,
        }));
        saveData(); // Save new format
        localStorage.removeItem('project_timeline_tasks'); // Cleanup legacy
      } catch (e) {
        console.error('Migration failed', e);
      }
    } else {
      // Initial Seed
      projects.value = [];
      allTasks.value = [];
    }
  }
};

const saveData = () => {
  const data = {
    projects: projects.value,
    tasks: allTasks.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Methods: Project ---
const handleCreateProject = () => {
  if (!projectFormData.value.title) return;

  const newProject: Project = {
    id: Date.now(),
    title: projectFormData.value.title,
    description: projectFormData.value.description,
    createdAt: new Date().toISOString(),
    color: PROJECT_COLORS[projects.value.length % PROJECT_COLORS.length],
  };

  projects.value.push(newProject);
  saveData();

  // Reset and Close
  projectFormData.value = { title: '', description: '' };
  isProjectModalOpen.value = false;

  // Auto-open
  handleSelectProject(newProject);
};

const handleSelectProject = (project: Project) => {
  selectedProject.value = project;
  viewMode.value = 'detail';
};

const handleBackToProjects = () => {
  selectedProject.value = null;
  viewMode.value = 'list';
};

const handleDeleteProject = (id: number) => {
  if (
    confirm('Are you sure you want to delete this project? All tasks within it will be deleted.')
  ) {
    projects.value = projects.value.filter((p) => p.id !== id);
    allTasks.value = allTasks.value.filter((t) => t.projectId !== id);
    saveData();
  }
};

// --- Methods: Tasks ---
const getTaskStyle = (task: Task) => {
  const taskStart = parseISO(task.start);
  const taskEnd = parseISO(task.end);
  const timelineStart = timelineData.value.startDate;

  const startOffsetDays = differenceInCalendarDays(taskStart, timelineStart);
  // +1 to include end day
  const durationDays = differenceInCalendarDays(taskEnd, taskStart) + 1;

  return {
    left: `${startOffsetDays * COL_WIDTH}px`,
    width: `${durationDays * COL_WIDTH}px`,
  };
};

const handleOpenTaskModal = (task: Task | null = null) => {
  if (task) {
    editingTask.value = task;
    const { id, ...rest } = task; // Keep projectId in rest
    taskFormData.value = { ...rest };
  } else {
    editingTask.value = null;
    const today = format(new Date(), 'yyyy-MM-dd');
    taskFormData.value = {
      projectId: selectedProject.value?.id || 0,
      title: '',
      assignee: '',
      start: today,
      end: today,
      color: 'bg-blue-500',
      status: 'Planning',
      progress: 0,
    };
  }
  isTaskModalOpen.value = true;
};

const handleCloseTaskModal = () => {
  isTaskModalOpen.value = false;
  editingTask.value = null;
};

const handleSaveTask = () => {
  if (!selectedProject.value) return;

  if (isBefore(parseISO(taskFormData.value.end), parseISO(taskFormData.value.start))) {
    alert('End date must not be before start date');
    return;
  }

  let p = Math.min(100, Math.max(0, taskFormData.value.progress));

  if (editingTask.value) {
    // Edit
    const index = allTasks.value.findIndex((t) => t.id === editingTask.value!.id);
    if (index !== -1) {
      allTasks.value[index] = {
        ...taskFormData.value,
        id: editingTask.value!.id,
        projectId: selectedProject.value.id,
        progress: p,
      } as Task;
    }
  } else {
    // Add
    const newTask: Task = {
      ...taskFormData.value,
      id: Date.now(),
      projectId: selectedProject.value.id,
      progress: p,
    } as Task;
    allTasks.value.push(newTask);
  }

  saveData();
  handleCloseTaskModal();
};

const handleDeleteTask = (id: number) => {
  if (confirm('Are you sure you want to delete this task?')) {
    allTasks.value = allTasks.value.filter((t) => t.id !== id);
    saveData();
  }
};

const formatDateDay = (date: Date) => {
  return format(date, 'd MMM', { locale: dateLocale.value });
};

const formatDateWeek = (date: Date) => {
  return format(date, 'EEE', { locale: dateLocale.value });
};

const isWeekendDay = (date: Date) => {
  return isWeekend(date);
};

const formatDateFull = (dateStr: string) => {
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: dateLocale.value });
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="flex flex-col h-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
    <!-- Header -->
    <header
      class="bg-white border-b border-border px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0"
    >
      <div class="flex items-center gap-4">
        <button
          v-if="viewMode === 'detail'"
          @click="handleBackToProjects"
          class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <CalendarIcon class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-foreground">
            <span v-if="viewMode === 'list'">Project Management</span>
            <span v-else>{{ selectedProject?.title }}</span>
          </h1>
          <p class="text-sm text-muted-foreground">
            <span v-if="viewMode === 'list'">Select a project to view timeline</span>
            <span v-else>{{ selectedProject?.description || 'Timeline View' }}</span>
          </p>
        </div>
      </div>

      <div v-if="viewMode === 'list'">
        <button
          @click="isProjectModalOpen = true"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors shadow-md font-medium"
        >
          <FolderPlus class="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>
      <div v-else>
        <button
          @click="handleOpenTaskModal()"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors shadow-md font-medium"
        >
          <Plus class="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>
    </header>

    <!-- CONTENT: PROJECT LIST -->
    <main v-if="viewMode === 'list'" class="flex-1 overflow-auto p-8 relative">
      <div
        v-if="projects.length === 0"
        class="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60"
      >
        <LayoutGrid class="w-20 h-20 text-slate-300" />
        <h3 class="text-xl font-medium text-slate-600">No Projects Found</h3>
        <p class="text-slate-500 max-w-sm">
          Create your first project to start managing tasks and timelines.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="project in projects"
          :key="project.id"
          class="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col h-48 relative overflow-hidden"
          @click="handleSelectProject(project)"
        >
          <div class="h-2 w-full" :class="project.color.split(' ')[0].replace('bg-', 'bg-')"></div>
          <!-- Strip text class -->
          <div class="p-6 flex-1 flex flex-col">
            <div class="flex justify-between items-start mb-2">
              <h3
                class="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors"
              >
                {{ project.title }}
              </h3>
            </div>

            <p class="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{{ project.description }}</p>

            <div
              class="flex items-center justify-between text-xs text-slate-400 mt-auto pt-4 border-t border-slate-100"
            >
              <span>Created: {{ formatDateFull(project.createdAt) }}</span>
              <button
                @click.stop="handleDeleteProject(project.id)"
                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Project"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- CONTENT: TIMELINE VIEW (EXISTING) -->
    <main
      v-else
      class="flex flex-1 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Left Sidebar (Task List) -->
      <div
        class="w-72 bg-white border-r border-border flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0"
      >
        <div class="h-14 border-b border-border flex items-center px-4 bg-slate-50/50">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >TaskList</span
          >
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="task in currentProjectTasks"
            :key="task.id"
            class="h-16 border-b border-border flex items-center px-4 hover:bg-slate-50 group justify-between transition-colors cursor-pointer"
            @click="handleOpenTaskModal(task)"
          >
            <!-- Task Item Content (Same as before) -->
            <div class="truncate pr-2 w-full">
              <div class="flex items-center justify-between mb-1">
                <div class="font-medium text-sm text-foreground truncate" :title="task.title">
                  {{ task.title }}
                </div>
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded-full font-medium border"
                  :class="{
                    'bg-slate-100 text-slate-600 border-slate-200': task.status === 'Planning',
                    'bg-blue-50 text-blue-600 border-blue-100': task.status === 'In Progress',
                    'bg-orange-50 text-orange-600 border-orange-100': task.status === 'Review',
                    'bg-green-50 text-green-600 border-green-100': task.status === 'Completed',
                  }"
                >
                  {{ task.status }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xs text-muted-foreground flex items-center gap-1">
                  <UserIcon class="w-3 h-3" /> {{ task.assignee }}
                </div>
                <div class="text-[10px] font-mono text-muted-foreground/70">
                  {{ task.progress }}%
                </div>
              </div>
            </div>

            <div
              class="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity absolute right-2 bg-gradient-to-l from-white via-white to-transparent pl-4"
            >
              <button
                @click.stop="handleDeleteTask(task.id)"
                class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            v-if="currentProjectTasks.length === 0"
            class="p-8 text-center text-muted-foreground text-sm"
          >
            No tasks yet. Click "Add Task" to start.
          </div>
        </div>
      </div>

      <!-- Right Area (Timeline Chart) -->
      <div class="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
        <div :style="`width: ${timelineData.totalDays * COL_WIDTH}px`" class="min-w-full h-full">
          <!-- Timeline Header (Dates) -->
          <div
            class="h-14 bg-white border-b border-border flex sticky top-0 z-30 shadow-sm relative"
          >
            <div
              v-for="(day, i) in timelineData.timelineDays"
              :key="i"
              :style="`width: ${COL_WIDTH}px; min-width: ${COL_WIDTH}px`"
              class="flex flex-col items-center justify-center border-r border-border/60 text-xs transition-colors"
              :class="{
                'bg-emerald-50 text-emerald-700 font-bold': isSameDay(day, new Date()),
                'bg-red-50 text-red-600 font-medium':
                  !isSameDay(day, new Date()) && day.getDay() === 0,
                'bg-slate-50/80 text-muted-foreground':
                  !isSameDay(day, new Date()) && isWeekendDay(day) && day.getDay() !== 0,
                'bg-white text-slate-600': !isSameDay(day, new Date()) && !isWeekendDay(day),
              }"
            >
              <template v-if="isSameDay(day, new Date())">
                <span class="text-sm tracking-tight">{{ formatDateDay(day) }}</span>
                <span
                  class="text-[9px] uppercase font-bold bg-emerald-100/50 px-1.5 rounded-sm mt-0.5 text-emerald-600"
                  >Today</span
                >
              </template>
              <template v-else>
                <span class="font-bold text-sm">{{ formatDateDay(day) }}</span>
                <span class="text-[10px] uppercase opacity-70">{{ formatDateWeek(day) }}</span>
              </template>
            </div>
          </div>

          <!-- Timeline Grid & Bars -->
          <div class="relative h-[calc(100%-3.5rem)]">
            <!-- Background Grid -->
            <div class="absolute inset-0 flex pointer-events-none h-full">
              <div
                v-for="(day, i) in timelineData.timelineDays"
                :key="i"
                :style="`width: ${COL_WIDTH}px; min-width: ${COL_WIDTH}px`"
                class="border-r border-border/40 h-full relative"
                :class="{ 'bg-slate-100/40': isWeekendDay(day) }"
              >
                <div
                  v-if="isSameDay(day, new Date())"
                  class="absolute inset-y-0 right-1/2 w-0 border-r border-emerald-500 border-dashed h-full opacity-40"
                  style="border-right-width: 2px"
                ></div>
              </div>
            </div>

            <!-- Task Rows -->
            <div class="relative py-0">
              <div
                v-for="task in currentProjectTasks"
                :key="task.id"
                class="h-16 relative flex items-center w-full hover:bg-white/40 transition-colors border-b border-transparent hover:border-border/30"
              >
                <!-- The Task Bar -->
                <div
                  class="absolute h-10 rounded-lg shadow-sm border border-white/20 text-white text-xs flex flex-col justify-center px-3 cursor-pointer hover:brightness-110 hover:-translate-y-0.5 transition-all group overflow-hidden"
                  :class="task.color"
                  :style="getTaskStyle(task)"
                  @click="handleOpenTaskModal(task)"
                >
                  <div class="font-medium drop-shadow-md truncate w-full flex items-center gap-1">
                    <span v-if="task.status === 'Completed'" class="shrink-0">✓</span>
                    {{ task.title }}
                  </div>
                  <div class="w-full h-1 bg-black/20 rounded-full mt-1 overflow-hidden">
                    <div class="h-full bg-white/80" :style="`width: ${task.progress}%`"></div>
                  </div>

                  <!-- Tooltip -->
                  <div
                    class="absolute left-full ml-4 top-0 bg-slate-800 text-white text-xs p-3 rounded-lg hidden group-hover:block z-20 w-56 shadow-xl z-50 pointer-events-none"
                  >
                    <div class="font-bold mb-1 text-sm">{{ task.title }}</div>
                    <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-slate-300">
                      <span>Assignee:</span> <span class="text-white">{{ task.assignee }}</span>
                      <span>Date:</span> <span>{{ task.start }} → {{ task.end }}</span>
                      <span>Status:</span> <span class="text-white">{{ task.status }}</span>
                      <span>Progress:</span> <span class="text-white">{{ task.progress }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal: CREATE PROJECT -->
    <div
      v-if="isProjectModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all"
      @click.self="isProjectModalOpen = false"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        <div
          class="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0"
        >
          <h2 class="text-lg font-bold text-gray-800">New Project</h2>
          <button
            @click="isProjectModalOpen = false"
            class="text-gray-400 hover:text-gray-600 p-1 hover:bg-slate-200 rounded-full"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6">
          <form @submit.prevent="handleCreateProject" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                required
                v-model="projectFormData.title"
                class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g. Website Redesign"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="projectFormData.description"
                class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-24 resize-none"
                placeholder="Briefly describe the project goals..."
              ></textarea>
            </div>
            <div class="pt-2 flex gap-3">
              <button
                type="button"
                @click="isProjectModalOpen = false"
                class="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md font-medium"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal: TASK FORM (Using existing variable isTaskModalOpen) -->
    <div
      v-if="isTaskModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      @click.self="handleCloseTaskModal"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        <div
          class="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0"
        >
          <h2 class="text-lg font-bold text-gray-800">
            {{ editingTask ? 'Edit Task' : 'Add New Task' }}
          </h2>
          <button
            @click="handleCloseTaskModal"
            class="text-gray-400 hover:text-gray-600 p-1 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto">
          <form @submit.prevent="handleSaveTask" class="space-y-5">
            <!-- Advanced Form Fields -->
            <div class="space-y-4">
              <!-- Task Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                <input
                  type="text"
                  required
                  v-model="taskFormData.title"
                  class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Design Homepage"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Assignee (Multi-Select) -->
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-700">Assignee</label>
                  <Popover v-model:open="openAssignee">
                    <PopoverTrigger as-child>
                      <button
                        type="button"
                        role="combobox"
                        :aria-expanded="openAssignee"
                        class="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <div class="flex flex-wrap gap-1 items-center overflow-hidden">
                          <UserIcon class="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <template v-if="selectedAssignees.length > 0">
                            <span class="truncate">
                              {{ selectedAssignees.join(', ') }}
                            </span>
                          </template>
                          <span v-else class="text-gray-400">Select assignees...</span>
                        </div>
                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent class="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search user..." />
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            <CommandItem
                              v-for="user in users"
                              :key="user.id"
                              :value="user.displayName || user.username || ''"
                              @select="toggleAssignee(user.displayName || user.username || '')"
                            >
                              <Check
                                :class="
                                  cn(
                                    'mr-2 h-4 w-4',
                                    selectedAssignees.includes(
                                      user.displayName || user.username || ''
                                    )
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )
                                "
                              />
                              {{ user.displayName || user.username }}
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    v-model="taskFormData.status"
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Date Pickers (Shadcn Style) -->
              <div class="grid grid-cols-2 gap-4">
                <!-- Start Date -->
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-700">Start Date</label>
                  <Popover v-model:open="openStartDate">
                    <PopoverTrigger as-child>
                      <button
                        type="button"
                        :class="
                          cn(
                            'flex w-full items-center justify-start rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-left font-normal hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                            !taskFormData.start && 'text-muted-foreground'
                          )
                        "
                      >
                        <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
                        {{ formatDateDisplay(taskFormData.start) }}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <Calendar
                        initial-focus
                        mode="single"
                        :model-value="
                          taskFormData.start ? parseDate(taskFormData.start) : undefined
                        "
                        @update:model-value="(date) => handleDateSelect(date, 'start')"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <!-- End Date -->
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-700">End Date</label>
                  <Popover v-model:open="openEndDate">
                    <PopoverTrigger as-child>
                      <button
                        type="button"
                        :class="
                          cn(
                            'flex w-full items-center justify-start rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-left font-normal hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                            !taskFormData.end && 'text-muted-foreground'
                          )
                        "
                      >
                        <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
                        {{ formatDateDisplay(taskFormData.end) }}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <Calendar
                        initial-focus
                        mode="single"
                        :model-value="taskFormData.end ? parseDate(taskFormData.end) : undefined"
                        @update:model-value="(date) => handleDateSelect(date, 'end')"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Progress: {{ taskFormData.progress }}%</label
              >
              <input
                type="range"
                v-model.number="taskFormData.progress"
                min="0"
                max="100"
                step="5"
                class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div class="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Label Color</label>
              <div class="flex gap-3 flex-wrap">
                <button
                  v-for="c in COLORS"
                  :key="c.value"
                  type="button"
                  @click="taskFormData.color = c.value"
                  class="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ring-offset-2"
                  :class="[
                    c.value,
                    taskFormData.color === c.value ? 'ring-2 ring-slate-400 scale-110' : '',
                  ]"
                  :title="c.name"
                >
                  <span v-if="taskFormData.color === c.value" class="text-white drop-shadow-md"
                    >✓</span
                  >
                </button>
              </div>
            </div>

            <div class="pt-4 flex gap-3">
              <button
                type="button"
                @click="handleCloseTaskModal"
                class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-colors flex justify-center items-center gap-2 font-medium"
              >
                <Save class="w-4 h-4" />
                Save Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 12px;
  width: 12px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
  border: 3px solid #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
