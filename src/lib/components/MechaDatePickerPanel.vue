<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type DatePickerValue = string | null;

interface DatePanelShortcut {
  label: string;
  value?: string;
  daysOffset?: number;
}

interface CalendarCell {
  iso: string;
  day: number;
  inCurrentMonth: boolean;
  year: number;
  month: number;
}

const props = withDefaults(
  defineProps<{
    modelValue?: DatePickerValue;
    disabled?: boolean;
    firstDayOfWeek?: number;
    shortcuts?: DatePanelShortcut[];
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: DatePickerValue;
      next: DatePickerValue;
      source: string;
    }>;
  }>(),
  {
    modelValue: null,
    disabled: false,
    firstDayOfWeek: 1,
    shortcuts: () => [
      { label: "Today", daysOffset: 0 },
      { label: "Tomorrow", daysOffset: 1 },
      { label: "+7 Days", daysOffset: 7 }
    ],
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: DatePickerValue];
  change: [value: DatePickerValue];
  blocked: [value: DatePickerValue];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaDatePickerPanel",
  undefined,
  props.ui
);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pad = (value: number) => String(value).padStart(2, "0");

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseIsoDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const todayIso = toIsoDate(new Date());

const initialDate = parseIsoDate(props.modelValue) ?? new Date();
const viewYear = ref(initialDate.getFullYear());
const viewMonth = ref(initialDate.getMonth());

const rootClass = computed(() =>
  partClass("root", `m-date-panel ${props.disabled ? "is-disabled" : ""}`)
);

const monthLabel = computed(() =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(new Date(viewYear.value, viewMonth.value, 1))
);

const selectedIso = computed(() => props.modelValue ?? "");

const weekdays = computed(() => {
  const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const start = clamp(props.firstDayOfWeek, 0, 6);
  return base.slice(start).concat(base.slice(0, start));
});

const cells = computed<CalendarCell[]>(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1);
  const firstWeekday = firstOfMonth.getDay();
  const offset = (firstWeekday - clamp(props.firstDayOfWeek, 0, 6) + 7) % 7;
  const monthDays = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear.value, viewMonth.value, 0).getDate();

  const result: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const slot = index - offset + 1;
    let year = viewYear.value;
    let month = viewMonth.value;
    let day = slot;
    let inCurrentMonth = true;

    if (slot <= 0) {
      inCurrentMonth = false;
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
      day = prevMonthDays + slot;
    } else if (slot > monthDays) {
      inCurrentMonth = false;
      day = slot - monthDays;
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }

    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    result.push({ iso, day, inCurrentMonth, year, month });
  }

  return result;
});

const commitDate = async (next: DatePickerValue, source: string) => {
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaDatePickerPanel",
      action: source,
      payload: {
        current: props.modelValue,
        next,
        source
      }
    },
    async () => {
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
  }
};

const pickCell = (cell: CalendarCell) => {
  if (props.disabled) {
    return;
  }

  viewYear.value = cell.year;
  viewMonth.value = cell.month;
  void commitDate(cell.iso, "select");
};

const useShortcut = (shortcut: DatePanelShortcut) => {
  if (props.disabled) {
    return;
  }

  let nextDate: Date | null = null;

  if (shortcut.value) {
    nextDate = parseIsoDate(shortcut.value);
  } else if (typeof shortcut.daysOffset === "number") {
    nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + shortcut.daysOffset);
  }

  if (!nextDate) {
    return;
  }

  viewYear.value = nextDate.getFullYear();
  viewMonth.value = nextDate.getMonth();
  void commitDate(toIsoDate(nextDate), "shortcut");
};

const switchMonth = (delta: number) => {
  if (props.disabled) {
    return;
  }

  const next = new Date(viewYear.value, viewMonth.value + delta, 1);
  viewYear.value = next.getFullYear();
  viewMonth.value = next.getMonth();
};

watch(
  () => props.modelValue,
  (next) => {
    const parsed = parseIsoDate(next);
    if (!parsed) {
      return;
    }

    viewYear.value = parsed.getFullYear();
    viewMonth.value = parsed.getMonth();
  }
);
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <header :class="partClass('header', 'm-date-panel__header')" v-bind="partAttrs('header')">
      <button
        type="button"
        :disabled="disabled"
        aria-label="Previous month"
        :class="partClass('prev', 'm-date-panel__nav')"
        v-bind="partAttrs('prev')"
        @click="switchMonth(-1)"
      >
        &lt;
      </button>

      <strong :class="partClass('title', 'm-date-panel__title')" v-bind="partAttrs('title')">
        {{ monthLabel }}
      </strong>

      <button
        type="button"
        :disabled="disabled"
        aria-label="Next month"
        :class="partClass('next', 'm-date-panel__nav')"
        v-bind="partAttrs('next')"
        @click="switchMonth(1)"
      >
        &gt;
      </button>
    </header>

    <div :class="partClass('shortcuts', 'm-date-panel__shortcuts')" v-bind="partAttrs('shortcuts')">
      <button
        v-for="shortcut in shortcuts"
        :key="shortcut.label"
        type="button"
        :disabled="disabled"
        :class="partClass('shortcut', 'm-date-panel__shortcut')"
        v-bind="partAttrs('shortcut', { 'data-shortcut': shortcut.label })"
        @click="useShortcut(shortcut)"
      >
        {{ shortcut.label }}
      </button>
    </div>

    <div :class="partClass('weekdays', 'm-date-panel__weekdays')" v-bind="partAttrs('weekdays')">
      <span
        v-for="day in weekdays"
        :key="day"
        :class="partClass('weekday', 'm-date-panel__weekday')"
        v-bind="partAttrs('weekday', { 'data-day': day })"
      >
        {{ day }}
      </span>
    </div>

    <div :class="partClass('grid', 'm-date-panel__grid')" v-bind="partAttrs('grid')">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        :disabled="disabled"
        :class="
          partClass(
            'cell',
            `m-date-panel__cell ${
              cell.inCurrentMonth ? 'is-current' : 'is-outside'
            } ${cell.iso === selectedIso ? 'is-selected' : ''} ${
              cell.iso === todayIso ? 'is-today' : ''
            }`
          )
        "
        v-bind="partAttrs('cell', { 'data-date': cell.iso })"
        @click="pickCell(cell)"
      >
        {{ cell.day }}
      </button>
    </div>

    <footer :class="partClass('footer', 'm-date-panel__footer')" v-bind="partAttrs('footer')">
      <span :class="partClass('value', 'm-date-panel__value')" v-bind="partAttrs('value')">
        {{ modelValue || "No date selected" }}
      </span>
    </footer>
  </section>
</template>

<style>
.m-date-panel {
  inline-size: min(100%, 20.5rem);
  display: grid;
  gap: 0.58rem;
  padding: 0.72rem;
  border-radius: var(--mecha-radius-md);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 22%, #36495f);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 30%),
    color-mix(in srgb, var(--mecha-bg-soft) 80%, #0b1624);
  box-shadow: 0 12px 26px rgb(0 0 0 / 0.28);
}

.m-date-panel.is-disabled {
  opacity: 0.6;
}

.m-date-panel__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.4rem;
}

.m-date-panel__title {
  text-align: center;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.m-date-panel__nav {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #4a627a);
  border-radius: 8px;
  inline-size: 1.45rem;
  block-size: 1.45rem;
  background: rgb(255 255 255 / 0.05);
  color: var(--mecha-text);
  cursor: pointer;
}

.m-date-panel__shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.m-date-panel__shortcut {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #4a6178);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: var(--mecha-text-muted);
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.62rem;
  padding: 0.18rem 0.44rem;
  cursor: pointer;
}

.m-date-panel__shortcut:hover {
  color: var(--mecha-text);
}

.m-date-panel__weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.m-date-panel__weekday {
  text-align: center;
  font-family: var(--mecha-font-display);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mecha-text-muted);
  padding: 0.2rem 0;
}

.m-date-panel__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.24rem;
}

.m-date-panel__cell {
  border: 1px solid transparent;
  border-radius: 7px;
  block-size: 1.6rem;
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text);
  font-size: 0.74rem;
  cursor: pointer;
}

.m-date-panel__cell.is-outside {
  color: color-mix(in srgb, var(--mecha-text-muted) 74%, #8398af);
}

.m-date-panel__cell.is-today {
  border-color: color-mix(in srgb, var(--mecha-accent) 52%, #ffb67a);
}

.m-date-panel__cell.is-selected {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 68%, white);
  background:
    linear-gradient(125deg, rgb(32 214 255 / 0.22), transparent 74%),
    rgb(255 255 255 / 0.09);
  box-shadow: 0 0 12px color-mix(in srgb, var(--mecha-accent-cool) 22%, transparent);
}

.m-date-panel__footer {
  border-top: 1px solid rgb(255 255 255 / 0.08);
  padding-top: 0.46rem;
}

.m-date-panel__value {
  font-family: "Iosevka Web", "Consolas", monospace;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
}
</style>

