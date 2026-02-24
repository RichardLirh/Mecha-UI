<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";
import MechaDatePickerPanel from "./MechaDatePickerPanel.vue";

type DateTimeValue = string | null;

interface DatePanelShortcut {
  label: string;
  value?: string;
  daysOffset?: number;
}

const props = withDefaults(
  defineProps<{
    modelValue?: DateTimeValue;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    firstDayOfWeek?: number;
    minuteStep?: number;
    showSeconds?: boolean;
    shortcuts?: DatePanelShortcut[];
    ui?: MechaComponentUi;
    panelUi?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: DateTimeValue;
      next: DateTimeValue;
      source: string;
    }>;
  }>(),
  {
    modelValue: null,
    placeholder: "Pick date and time",
    disabled: false,
    clearable: false,
    firstDayOfWeek: 1,
    minuteStep: 5,
    showSeconds: true,
    shortcuts: () => [
      { label: "Today", daysOffset: 0 },
      { label: "Tomorrow", daysOffset: 1 },
      { label: "+7 Days", daysOffset: 7 }
    ],
    ui: undefined,
    panelUi: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: DateTimeValue];
  change: [value: DateTimeValue];
  blocked: [value: DateTimeValue];
  "visible-change": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaDateTimePicker",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const hour = ref("00");
const minute = ref("00");
const second = ref("00");

const pad = (value: number) => String(value).padStart(2, "0");

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseIsoDate = (value: string | null | undefined): string | null => {
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

  return `${year}-${pad(month + 1)}-${pad(day)}`;
};

const parseDateTime = (value: DateTimeValue) => {
  if (!value) {
    return {
      date: null as string | null,
      hour: "00",
      minute: "00",
      second: "00"
    };
  }

  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})(?:[ T]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?)?$/
  );

  if (!match) {
    return {
      date: null as string | null,
      hour: "00",
      minute: "00",
      second: "00"
    };
  }

  return {
    date: parseIsoDate(match[1]),
    hour: match[2] ?? "00",
    minute: match[3] ?? "00",
    second: match[4] ?? "00"
  };
};

const stepValue = computed(() => {
  const raw = Math.floor(props.minuteStep);
  return Math.min(30, Math.max(1, raw || 1));
});

const panelDateValue = computed(() => parseDateTime(props.modelValue).date);
const hasValue = computed(() => Boolean(props.modelValue));
const displayValue = computed(() => props.modelValue || props.placeholder);

const hourOptions = Array.from({ length: 24 }, (_, idx) => pad(idx));
const minuteOptions = computed(() => {
  const values: string[] = [];
  for (let value = 0; value < 60; value += stepValue.value) {
    values.push(pad(value));
  }
  if (!values.includes("59") && stepValue.value !== 1) {
    values.push("59");
  }
  return values;
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-datetime-picker ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const composeValue = (date: string) => {
  const time = props.showSeconds
    ? `${hour.value}:${minute.value}:${second.value}`
    : `${hour.value}:${minute.value}`;
  return `${date} ${time}`;
};

const setOpen = (next: boolean) => {
  if (isOpen.value === next) {
    return;
  }
  isOpen.value = next;
  emit("visible-change", next);
};

const toggleOpen = () => {
  if (props.disabled) {
    return;
  }
  setOpen(!isOpen.value);
};

const commitValue = async (next: DateTimeValue, source: string) => {
  if (next === props.modelValue) {
    return true;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaDateTimePicker",
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

  return success;
};

const onPanelSelect = (date: string | null) => {
  if (!date || props.disabled) {
    return;
  }
  void commitValue(composeValue(date), "select-date");
};

const onTimeChange = () => {
  if (props.disabled) {
    return;
  }
  const date = panelDateValue.value ?? toIsoDate(new Date());
  void commitValue(composeValue(date), "change-time");
};

const clearValue = () => {
  if (props.disabled || props.modelValue === null) {
    return;
  }
  void commitValue(null, "clear").then((success) => {
    if (success) {
      setOpen(false);
    }
  });
};

const setNow = () => {
  if (props.disabled) {
    return;
  }
  const now = new Date();
  hour.value = pad(now.getHours());
  minute.value = pad(now.getMinutes());
  second.value = pad(now.getSeconds());
  void commitValue(composeValue(toIsoDate(now)), "now").then((success) => {
    if (success) {
      setOpen(false);
    }
  });
};

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (event.key === "Escape") {
    setOpen(false);
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleOpen();
    return;
  }

  if (event.key === "ArrowDown" && !isOpen.value) {
    event.preventDefault();
    setOpen(true);
  }
};

const onDocumentPointerDown = (event: PointerEvent) => {
  if (!isOpen.value) {
    return;
  }

  const target = event.target as Node | null;
  if (!target || !rootRef.value?.contains(target)) {
    setOpen(false);
  }
};

watch(
  () => props.modelValue,
  (next) => {
    const parsed = parseDateTime(next);
    hour.value = parsed.hour;
    minute.value = parsed.minute;
    second.value = parsed.second;
  },
  { immediate: true }
);

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<template>
  <div ref="rootRef" :class="rootClass" v-bind="partAttrs('root')">
    <button
      type="button"
      role="combobox"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      :disabled="disabled"
      :class="partClass('trigger', 'm-datetime-picker__trigger')"
      v-bind="partAttrs('trigger')"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span
        :class="
          partClass(
            'value',
            `m-datetime-picker__value ${
              hasValue ? 'has-value' : 'is-placeholder'
            }`
          )
        "
        v-bind="partAttrs('value')"
      >
        {{ displayValue }}
      </span>
      <span
        :class="partClass('icon', 'm-datetime-picker__icon')"
        v-bind="partAttrs('icon')"
      >
        DT
      </span>
    </button>

    <button
      v-if="clearable && hasValue"
      type="button"
      :disabled="disabled"
      aria-label="Clear date time"
      :class="partClass('clear', 'm-datetime-picker__clear')"
      v-bind="partAttrs('clear')"
      @click.stop="clearValue"
    >
      x
    </button>

    <div
      v-if="isOpen"
      :class="partClass('panel-wrap', 'm-datetime-picker__panel-wrap')"
      v-bind="partAttrs('panel-wrap')"
    >
      <MechaDatePickerPanel
        :model-value="panelDateValue"
        :disabled="disabled"
        :first-day-of-week="firstDayOfWeek"
        :shortcuts="shortcuts"
        :ui="panelUi"
        @change="onPanelSelect"
      />

      <div
        :class="partClass('time', 'm-datetime-picker__time')"
        v-bind="partAttrs('time')"
      >
        <label
          :class="partClass('time-field', 'm-datetime-picker__time-field')"
          v-bind="partAttrs('time-field-hour')"
        >
          <span>Hour</span>
          <select
            v-model="hour"
            :disabled="disabled"
            :class="partClass('time-select', 'm-datetime-picker__time-select')"
            v-bind="partAttrs('time-select-hour')"
            @change="onTimeChange"
          >
            <option v-for="value in hourOptions" :key="value" :value="value">
              {{ value }}
            </option>
          </select>
        </label>

        <label
          :class="partClass('time-field', 'm-datetime-picker__time-field')"
          v-bind="partAttrs('time-field-minute')"
        >
          <span>Min</span>
          <select
            v-model="minute"
            :disabled="disabled"
            :class="partClass('time-select', 'm-datetime-picker__time-select')"
            v-bind="partAttrs('time-select-minute')"
            @change="onTimeChange"
          >
            <option v-for="value in minuteOptions" :key="value" :value="value">
              {{ value }}
            </option>
          </select>
        </label>

        <label
          v-if="showSeconds"
          :class="partClass('time-field', 'm-datetime-picker__time-field')"
          v-bind="partAttrs('time-field-second')"
        >
          <span>Sec</span>
          <select
            v-model="second"
            :disabled="disabled"
            :class="partClass('time-select', 'm-datetime-picker__time-select')"
            v-bind="partAttrs('time-select-second')"
            @change="onTimeChange"
          >
            <option v-for="value in minuteOptions" :key="value" :value="value">
              {{ value }}
            </option>
          </select>
        </label>

        <button
          type="button"
          :disabled="disabled"
          :class="partClass('now', 'm-datetime-picker__now')"
          v-bind="partAttrs('now')"
          @click="setNow"
        >
          Now
        </button>
        <button
          type="button"
          :class="partClass('done', 'm-datetime-picker__done')"
          v-bind="partAttrs('done')"
          @click="setOpen(false)"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.m-datetime-picker {
  position: relative;
  display: inline-grid;
  min-inline-size: 14.8rem;
}

.m-datetime-picker.is-disabled {
  opacity: 0.62;
}

.m-datetime-picker__trigger {
  inline-size: 100%;
  min-block-size: 2.34rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #405973);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 76%, #0d1625);
  color: var(--mecha-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
  padding: 0.56rem 0.75rem;
  cursor: pointer;
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.m-datetime-picker__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-datetime-picker.is-open .m-datetime-picker__trigger {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 26%, transparent);
}

.m-datetime-picker__value {
  font-size: 0.83rem;
  font-family: "Iosevka Web", "Consolas", monospace;
}

.m-datetime-picker__value.is-placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, #9bb0c8);
}

.m-datetime-picker__icon {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-size: 0.62rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-datetime-picker__clear {
  position: absolute;
  top: 50%;
  right: 2.2rem;
  transform: translateY(-50%);
  border: 0;
  border-radius: 999px;
  inline-size: 1.1rem;
  block-size: 1.1rem;
  background: rgb(255 255 255 / 0.09);
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, white);
  font-size: 0.72rem;
  cursor: pointer;
}

.m-datetime-picker__clear:hover {
  color: var(--mecha-text);
  background: rgb(255 255 255 / 0.18);
}

.m-datetime-picker__panel-wrap {
  position: absolute;
  z-index: 40;
  inset: calc(100% + 0.36rem) 0 auto;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3b4f66);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.07), transparent 35%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #0a1320);
  box-shadow: 0 14px 28px rgb(0 0 0 / 0.5);
  padding: 0.44rem;
  inline-size: min(23rem, 92vw);
  display: grid;
  gap: 0.45rem;
}

.m-datetime-picker__panel-wrap .m-date-panel {
  inline-size: 100%;
  box-shadow: none;
}

.m-datetime-picker__time {
  border-top: 1px solid rgb(255 255 255 / 0.09);
  padding-top: 0.52rem;
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 0.36rem;
}

.m-datetime-picker__time-field {
  display: grid;
  gap: 0.2rem;
}

.m-datetime-picker__time-field span {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.59rem;
  color: var(--mecha-text-muted);
}

.m-datetime-picker__time-select {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #425a73);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.06);
  color: var(--mecha-text);
  font-family: "Iosevka Web", "Consolas", monospace;
  font-size: 0.74rem;
  padding: 0.3rem 0.4rem;
}

.m-datetime-picker__now,
.m-datetime-picker__done {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #4a627a);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.06);
  color: var(--mecha-text);
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.62rem;
  padding: 0.32rem 0.56rem;
  cursor: pointer;
}

.m-datetime-picker__done {
  margin-left: auto;
}
</style>
