<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";
import MechaDatePickerPanel from "./MechaDatePickerPanel.vue";

type DatePickerValue = string | null;

interface DatePanelShortcut {
  label: string;
  value?: string;
  daysOffset?: number;
}

const props = withDefaults(
  defineProps<{
    modelValue?: DatePickerValue;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    firstDayOfWeek?: number;
    shortcuts?: DatePanelShortcut[];
    ui?: MechaComponentUi;
    panelUi?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: DatePickerValue;
      next: DatePickerValue;
      source: string;
    }>;
  }>(),
  {
    modelValue: null,
    placeholder: "Pick a date",
    disabled: false,
    clearable: false,
    firstDayOfWeek: 1,
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
  "update:modelValue": [value: DatePickerValue];
  change: [value: DatePickerValue];
  blocked: [value: DatePickerValue];
  "visible-change": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaDatePicker",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);

const hasValue = computed(() => Boolean(props.modelValue));

const rootClass = computed(() =>
  partClass(
    "root",
    `m-date-picker ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

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

const onPanelUpdate = (value: DatePickerValue) => {
  emit("update:modelValue", value);
};

const onPanelChange = (value: DatePickerValue) => {
  emit("change", value);
  setOpen(false);
};

const clearValue = async () => {
  if (props.disabled || props.modelValue === null) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaDatePicker",
      action: "clear",
      payload: {
        current: props.modelValue,
        next: null,
        source: "clear"
      }
    },
    async () => {
      emit("update:modelValue", null);
      emit("change", null);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
    return;
  }

  setOpen(false);
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
      :class="partClass('trigger', 'm-date-picker__trigger')"
      v-bind="partAttrs('trigger')"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span
        :class="
          partClass(
            'value',
            `m-date-picker__value ${hasValue ? 'has-value' : 'is-placeholder'}`
          )
        "
        v-bind="partAttrs('value')"
      >
        {{ modelValue || placeholder }}
      </span>
      <span :class="partClass('icon', 'm-date-picker__icon')" v-bind="partAttrs('icon')">
        CAL
      </span>
    </button>

    <button
      v-if="clearable && hasValue"
      type="button"
      :disabled="disabled"
      aria-label="Clear date"
      :class="partClass('clear', 'm-date-picker__clear')"
      v-bind="partAttrs('clear')"
      @click.stop="clearValue"
    >
      x
    </button>

    <div
      v-if="isOpen"
      :class="partClass('panel-wrap', 'm-date-picker__panel-wrap')"
      v-bind="partAttrs('panel-wrap')"
    >
      <MechaDatePickerPanel
        :model-value="modelValue"
        :disabled="disabled"
        :first-day-of-week="firstDayOfWeek"
        :shortcuts="shortcuts"
        :ui="panelUi"
        :pipeline="pipeline"
        @update:modelValue="onPanelUpdate"
        @change="onPanelChange"
        @blocked="emit('blocked', $event)"
      />
    </div>
  </div>
</template>

<style>
.m-date-picker {
  position: relative;
  display: inline-grid;
  min-inline-size: 12.6rem;
}

.m-date-picker.is-disabled {
  opacity: 0.6;
}

.m-date-picker__trigger {
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

.m-date-picker__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-date-picker.is-open .m-date-picker__trigger {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 26%, transparent);
}

.m-date-picker__value {
  font-size: 0.84rem;
  font-family: "Iosevka Web", "Consolas", monospace;
}

.m-date-picker__value.is-placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, #9bb0c8);
}

.m-date-picker__icon {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-size: 0.62rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-date-picker__clear {
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

.m-date-picker__clear:hover {
  color: var(--mecha-text);
  background: rgb(255 255 255 / 0.18);
}

.m-date-picker__panel-wrap {
  position: absolute;
  z-index: 40;
  inset: calc(100% + 0.36rem) 0 auto;
}

.m-date-picker__panel-wrap .m-date-panel {
  inline-size: min(22rem, 90vw);
}
</style>
