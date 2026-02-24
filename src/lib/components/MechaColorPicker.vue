<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";
import MechaColorPickerPanel from "./MechaColorPickerPanel.vue";

interface ColorPayload {
  color: string;
  alpha: number;
}

let colorPickerInstanceSeed = 0;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    alpha?: number;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    showAlpha?: boolean;
    presets?: string[];
    ui?: MechaComponentUi;
    panelUi?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: ColorPayload;
      next: ColorPayload;
      source: string;
    }>;
  }>(),
  {
    modelValue: "#20D6FF",
    alpha: 1,
    placeholder: "Pick color",
    clearable: false,
    disabled: false,
    showAlpha: true,
    presets: () => ["#20d6ff", "#ff7a18", "#48eba7", "#ff435a", "#8aa8ff", "#ffffff"],
    ui: undefined,
    panelUi: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:alpha": [value: number];
  change: [value: ColorPayload];
  blocked: [value: ColorPayload];
  "visible-change": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaColorPicker",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const instanceId = `m-color-picker-${++colorPickerInstanceSeed}`;
const panelId = `${instanceId}-panel`;

const clampAlpha = (value: number) => Math.min(1, Math.max(0, value));

const normalizedColor = computed(() => props.modelValue.trim().toUpperCase());
const normalizedAlpha = computed(() => clampAlpha(props.alpha));
const hasValue = computed(() => Boolean(normalizedColor.value));
const panelColor = computed(() => normalizedColor.value || "#20D6FF");

const rootClass = computed(() =>
  partClass(
    "root",
    `m-color-picker ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    } ${hasValue.value ? "has-value" : "is-empty"}`
  )
);

const previewStyle = computed(() => ({
  backgroundColor: hasValue.value
    ? `rgb(from ${normalizedColor.value} r g b / ${normalizedAlpha.value})`
    : "transparent"
}));

const displayValue = computed(() =>
  hasValue.value ? normalizedColor.value : props.placeholder
);

const currentPayload = computed<ColorPayload>(() => ({
  color: normalizedColor.value,
  alpha: normalizedAlpha.value
}));

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

const commitFromRoot = async (next: ColorPayload, source: string) => {
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaColorPicker",
      action: source,
      payload: {
        current: currentPayload.value,
        next,
        source
      }
    },
    async () => {
      emit("update:modelValue", next.color);
      emit("update:alpha", next.alpha);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", currentPayload.value);
  }

  return success;
};

const clearValue = () => {
  if (props.disabled || !hasValue.value) {
    return;
  }
  void commitFromRoot(
    {
      color: "",
      alpha: normalizedAlpha.value
    },
    "clear"
  ).then((success) => {
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
    return;
  }

  if (event.key === "Tab") {
    setOpen(false);
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
      :aria-controls="panelId"
      :disabled="disabled"
      :class="partClass('trigger', 'm-color-picker__trigger')"
      v-bind="partAttrs('trigger')"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span
        :class="partClass('swatch', 'm-color-picker__swatch')"
        :style="previewStyle"
        v-bind="partAttrs('swatch')"
        aria-hidden="true"
      />

      <span
        :class="
          partClass(
            'value',
            `m-color-picker__value ${hasValue ? 'has-value' : 'is-placeholder'}`
          )
        "
        v-bind="partAttrs('value')"
      >
        {{ displayValue }}
      </span>

      <span
        v-if="showAlpha"
        :class="partClass('alpha', 'm-color-picker__alpha')"
        v-bind="partAttrs('alpha')"
      >
        {{ Math.round(normalizedAlpha * 100) }}%
      </span>

      <span
        :class="partClass('icon', 'm-color-picker__icon')"
        v-bind="partAttrs('icon')"
        aria-hidden="true"
      >
        CLR
      </span>
    </button>

    <button
      v-if="clearable && hasValue"
      type="button"
      :disabled="disabled"
      aria-label="Clear color"
      :class="partClass('clear', 'm-color-picker__clear')"
      v-bind="partAttrs('clear')"
      @click.stop="clearValue"
    >
      x
    </button>

    <div
      v-if="isOpen"
      :id="panelId"
      :class="partClass('panel-wrap', 'm-color-picker__panel-wrap')"
      v-bind="partAttrs('panel-wrap')"
    >
      <MechaColorPickerPanel
        :model-value="panelColor"
        :alpha="normalizedAlpha"
        :show-alpha="showAlpha"
        :presets="presets"
        :disabled="disabled"
        :ui="panelUi"
        :pipeline="pipeline"
        @update:modelValue="emit('update:modelValue', $event)"
        @update:alpha="emit('update:alpha', $event)"
        @change="emit('change', $event)"
        @blocked="emit('blocked', $event)"
      />
    </div>
  </div>
</template>

<style>
.m-color-picker {
  position: relative;
  display: inline-grid;
  min-inline-size: 13.2rem;
}

.m-color-picker.is-disabled {
  opacity: 0.62;
}

.m-color-picker__trigger {
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
  gap: 0.6rem;
  padding: 0.52rem 0.72rem;
  cursor: pointer;
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.m-color-picker__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-color-picker.is-open .m-color-picker__trigger {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 26%, transparent);
}

.m-color-picker__swatch {
  inline-size: 1.16rem;
  block-size: 1.16rem;
  border-radius: 5px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 40%, #4a627a);
  background-image:
    linear-gradient(45deg, rgb(255 255 255 / 0.14) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(255 255 255 / 0.14) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgb(255 255 255 / 0.14) 75%),
    linear-gradient(-45deg, transparent 75%, rgb(255 255 255 / 0.14) 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}

.m-color-picker__value {
  flex: 1;
  min-inline-size: 0;
  text-align: left;
  font-size: 0.8rem;
  font-family: "Iosevka Web", "Consolas", monospace;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-color-picker__value.is-placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, #9bb0c8);
}

.m-color-picker__alpha {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.62rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-color-picker__icon {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-size: 0.58rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-color-picker__clear {
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

.m-color-picker__clear:hover {
  color: var(--mecha-text);
  background: rgb(255 255 255 / 0.18);
}

.m-color-picker__panel-wrap {
  position: absolute;
  z-index: 40;
  inset: calc(100% + 0.36rem) 0 auto;
}

.m-color-picker__panel-wrap .m-color-panel {
  inline-size: min(19rem, 90vw);
}
</style>
