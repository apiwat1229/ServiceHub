<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { type Pool } from '@/services/pools';
import { Plus } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  pool: Pool;
}>();

const emit = defineEmits(['refresh', 'click']);

const getGradeColor = (grade: string | null) => {
  switch (grade?.toUpperCase()) {
    case 'AA':
      return 'bg-emerald-500 shadow-emerald-100';
    case 'A':
      return 'bg-sky-500 shadow-sky-100';
    case 'B':
      return 'bg-indigo-500 shadow-indigo-100';
    case 'C':
      return 'bg-orange-500 shadow-orange-100';
    default:
      return 'bg-slate-300';
  }
};

const getStatusTheme = computed(() => {
  if (props.pool.status === 'empty')
    return {
      border: 'border-slate-200 border-dashed',
      bg: 'bg-white',
      footer: 'text-slate-400',
      accent: 'slate',
    };

  if (props.pool.status === 'closed')
    return {
      border: 'border-red-200',
      bg: 'bg-red-50/10',
      footer: 'bg-red-500 text-white',
      accent: 'red',
    };

  // Filling state (open with items)
  const grade = props.pool.grade?.toUpperCase();
  if (grade === 'AA')
    return {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/10',
      footer: 'bg-emerald-600 text-white',
      accent: 'emerald',
    };
  if (grade === 'A')
    return {
      border: 'border-sky-200',
      bg: 'bg-sky-50/10',
      footer: 'bg-sky-600 text-white',
      accent: 'sky',
    };
  if (grade === 'B')
    return {
      border: 'border-indigo-200',
      bg: 'bg-indigo-50/10',
      footer: 'bg-indigo-600 text-white',
      accent: 'indigo',
    };
  if (grade === 'C')
    return {
      border: 'border-orange-200',
      bg: 'bg-orange-50/10',
      footer: 'bg-orange-600 text-white',
      accent: 'orange',
    };

  return {
    border: 'border-blue-200',
    bg: 'bg-blue-50/10',
    footer: 'bg-blue-600 text-white',
    accent: 'blue',
  };
});

const poolLevel = computed(() => {
  if (props.pool.status === 'empty') return 0;
  return Math.min(
    Math.round((props.pool.totalWeight / (props.pool.capacity || 260000)) * 100),
    100
  );
});

const handleClick = () => {
  emit('click', props.pool);
};
</script>

<template>
  <div
    @click="handleClick"
    :class="[
      'group relative flex flex-col bg-white border-2 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1',
      getStatusTheme.border,
      getStatusTheme.bg,
    ]"
  >
    <!-- Vertical Silo Gauge (Right Side) -->
    <div
      v-if="pool.status !== 'empty'"
      class="absolute right-3 top-10 bottom-10 w-2.5 bg-slate-100/50 rounded-full border border-slate-200/30 overflow-hidden flex flex-col-reverse shadow-inner"
    >
      <div
        class="w-full transition-all duration-1000 ease-out shadow-sm"
        :class="[pool.status === 'closed' ? 'bg-red-400' : getGradeColor(pool.grade).split(' ')[0]]"
        :style="{ height: `${poolLevel}%` }"
      >
        <div v-if="pool.status === 'filling'" class="w-full h-full bg-white/30 animate-pulse"></div>
      </div>
      <!-- Ruler markings -->
      <div
        class="absolute inset-0 flex flex-col justify-between py-1 opacity-20 pointer-events-none"
      >
        <div v-for="i in 4" :key="i" class="w-full h-px bg-slate-400"></div>
      </div>
    </div>

    <!-- Pool Name -->
    <div class="px-3 pt-3 flex items-center justify-between">
      <span
        class="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight"
      >
        {{ pool.name }}
      </span>
      <div
        v-if="pool.status !== 'empty'"
        :class="[
          'w-2 h-2 rounded-full animate-pulse shadow-sm',
          pool.status === 'closed' ? 'bg-red-500' : 'bg-emerald-500',
        ]"
      ></div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 p-3 flex flex-col items-center justify-center min-h-[100px]">
      <template v-if="pool.status === 'empty'">
        <div class="flex flex-col items-center gap-2">
          <Badge
            variant="outline"
            class="bg-slate-50 text-slate-400 border-slate-200 font-black text-[9px] px-2 py-0"
            >EMPTY</Badge
          >
          <div
            class="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus class="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter"
            >Click to Initialize</span
          >
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col items-center gap-1 w-full text-center">
          <Badge
            :class="[
              'text-white font-black text-xs px-2.5 py-0.5 shadow-md',
              getGradeColor(pool.grade),
            ]"
          >
            {{ pool.grade || '-' }}
          </Badge>
          <span
            class="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full px-1 mb-1"
          >
            {{ pool.rubberType }}
          </span>
          <div class="flex items-baseline gap-1">
            <span
              :class="[
                'text-2xl font-black tracking-tighter leading-none',
                pool.status === 'closed' ? 'text-red-500' : 'text-slate-900',
              ]"
            >
              {{ (pool.totalWeight / 1000).toFixed(1) }}
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- Footer Status -->
    <div
      :class="[
        'py-1.5 text-center text-[9px] font-black uppercase tracking-widest transition-colors border-t border-slate-50',
        getStatusTheme.footer,
      ]"
    >
      <span v-if="pool.status === 'empty'">-</span>
      <span v-else-if="pool.status === 'closed'">CLOSED</span>
      <span v-else>FILLING ({{ poolLevel }}%)</span>
    </div>
  </div>
</template>
