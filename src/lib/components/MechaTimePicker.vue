<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type TimePickerValue = string | null;

const props = withDefaults(
  defineProps<{
    modelValue?: TimePickerValue;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    showSeconds?: boolean;
    minuteStep?: number;
    secondStep?: number;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: TimePickerValue;
      next: TimePickerValue;
      source: string;
    }>;
  }>(),
  {
    modelValue: null,
    placeholder: "Pick time",
    disabled: false,
    clearable: false,
    showSeconds: true,
    minuteStep: 5,
    secondStep: 5,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: TimePickerValue];
  change: [value: TimePickerValue];
  blocked: [value: TimePickerValue];
  "visible-change": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaTimePicker",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const hour = ref("00");
const minute = ref("00");
const second = ref("00");

const pad = (value: number) => String(value).padStart(2, "0");

const parseTime = (value: string | null | undefined) => {
  if (!value) {
    return {
      hour: "00",
      minute: "00",
      second: "00"
    };
  }

  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) {
    return {
      hour: "00",
      minute: "00",
      second: "00"
    };
  }

  return {
    hour: match[1],
    minute: match[2],
    second: match[3] ?? "00"
  };
};

const minuteStepValue = computed(() => {
  const raw = Math.floor(props.minuteStep);
  return Math.min(30, Math.max(1, raw || 1));
});

const secondStepValue = computed(() => {
  const raw = Math.floor(props.secondStep);
  return Math.min(30, Math.max(1, raw || 1));
});

const buildStepOptions = (step: number) => {
  const values: string[] = [];
  for (let value = 0; value < 60; value += step) {
    values.push(pad(value));
  }
  if (!values.includes("59") && step !== 1) {
    values.push("59");
  }
  return values;
};

const hourOptions = Array.from({ length: 24 }, (_, index) => pad(index));
const minuteOptions = computed(() => buildStepOptions(minuteStepValue.value));
const secondOptions = computed(() => buildStepOptions(secondStepValue.value));

const hasValue = computed(() => Boolean(props.modelValue));
const displayValue = computed(() => props.modelValue || props.placeholder);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-time-picker ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const composeValue = () =>
  props.showSeconds
    ? `${hour.value}:${minute.value}:${second.value}`
    : `${hour.value}:${minute.value}`;

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

const commitValue = async (next: TimePickerValue, source: string) => {
  if (next === props.modelValue) {
    return true;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTimePicker",
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

const onTimeChange = () => {
  if (props.disabled) {
    return;
  }
  void commitValue(composeValue(), "change");
};

const setNow = () => {
  if (props.disabled) {
    return;
  }
  const now = new Date();
  hour.value = pad(now.getHours());
  minute.value = pad(now.getMinutes());
  second.value = pad(now.getSeconds());
  void commitValue(composeValue(), "now").then((success) => {
    if (success) {
      setOpen(false);
    }
  });
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
    const parsed = parseTime(next);
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
      :class="partClass('trigger', 'm-time-picker__trigger')"
      v-bind="partAttrs('trigger')"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span
        :class="
          partClass(
            'value',
            `m-time-picker__value ${hasValue ? 'has-value' : 'is-placeholder'}`
          )
        "
        v-bind="partAttrs('value')"
      >
        {{ displayValue }}
      </span>
      <span
        :class="partClass('icon', 'm-time-picker__icon')"
        v-bind="partAttrs('icon')"
      >
        T
      </span>
    </button>

    <button
      v-if="clearable && hasValue"
      type="button"
      :disabled="disabled"
      aria-label="Clear time"
      :class="partClass('clear', 'm-time-picker__clear')"
      v-bind="partAttrs('clear')"
      @click.stop="clearValue"
    >
      x
    </button>

    <div
      v-if="isOpen"
      :class="partClass('panel', 'm-time-picker__panel')"
      v-bind="partAttrs('panel')"
    >
      <label
        :class="partClass('field', 'm-time-picker__field')"
        v-bind="partAttrs('field-hour')"
      >
        <span>Hour</span>
        <select
          v-model="hour"
          :disabled="disabled"
          :class="partClass('select', 'm-time-picker__select')"
          v-bind="partAttrs('select-hour')"
          @change="onTimeChange"
        >
          <option v-for="value in hourOptions" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </label>

      <label
        :class="partClass('field', 'm-time-picker__field')"
        v-bind="partAttrs('field-minute')"
      >
        <span>Min</span>
        <select
          v-model="minute"
          :disabled="disabled"
          :class="partClass('select', 'm-time-picker__select')"
          v-bind="partAttrs('select-minute')"
          @change="onTimeChange"
        >
          <option v-for="value in minuteOptions" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </label>

      <label
        v-if="showSeconds"
        :class="partClass('field', 'm-time-picker__field')"
        v-bind="partAttrs('field-second')"
      >
        <span>Sec</span>
        <select
          v-model="second"
          :disabled="disabled"
          :class="partClass('select', 'm-time-picker__select')"
          v-bind="partAttrs('select-second')"
          @change="onTimeChange"
        >
          <option v-for="value in secondOptions" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </label>

      <button
        type="button"
        :disabled="disabled"
        :class="partClass('now', 'm-time-picker__now')"
        v-bind="partAttrs('now')"
        @click="setNow"
      >
        Now
      </button>

      <button
        type="button"
        :class="partClass('done', 'm-time-picker__done')"
        v-bind="partAttrs('done')"
        @click="setOpen(false)"
      >
        Done
      </button>
    </div>
  </div>
</template>

<style>
.m-time-picker {
  position: relative;
  display: inline-grid;
  min-inline-size: 12.5rem;
}

.m-time-picker.is-disabled {
  opacity: 0.6;
}

.m-time-picker__trigger {
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

.m-time-picker__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-time-picker.is-open .m-time-picker__trigger {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 26%, transparent);
}

.m-time-picker__value {
  font-size: 0.83rem;
  font-family: "Iosevka Web", "Consolas", monospace;
}

.m-time-picker__value.is-placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, #9bb0c8);
}

.m-time-picker__icon {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-size: 0.62rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-time-picker__clear {
  position: absolute;
  top: 50%;
  right: 2.1rem;
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

.m-time-picker__panel {
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
  inline-size: min(19rem, 90vw);
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 0.36rem;
}

.m-time-picker__field {
  display: grid;
  gap: 0.2rem;
}

.m-time-picker__field span {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.59rem;
  color: var(--mecha-text-muted);
}

.m-time-picker__select {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #425a73);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.06);
  color: var(--mecha-text);
  font-family: "Iosevka Web", "Consolas", monospace;
  font-size: 0.74rem;
  padding: 0.3rem 0.4rem;
}

.m-time-picker__now,
.m-time-picker__done {
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

.m-time-picker__done {
  margin-left: auto;
}
</style>
