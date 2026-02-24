<script setup lang="ts">
import { computed, ref, useAttrs, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

defineOptions({ inheritAttrs: false });

type NumberValue = number | null;

const props = withDefaults(
  defineProps<{
    modelValue?: NumberValue;
    min?: number;
    max?: number;
    step?: number;
    precision?: number | null;
    label?: string;
    hint?: string;
    placeholder?: string;
    disabled?: boolean;
    controls?: boolean;
    controlsPosition?: "right" | "both";
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: NumberValue;
      next: NumberValue;
      source: string;
    }>;
  }>(),
  {
    modelValue: null,
    min: Number.NEGATIVE_INFINITY,
    max: Number.POSITIVE_INFINITY,
    step: 1,
    precision: null,
    label: "",
    hint: "",
    placeholder: "",
    disabled: false,
    controls: true,
    controlsPosition: "right",
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: NumberValue];
  change: [value: NumberValue];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  blocked: [value: NumberValue];
}>();

const attrs = useAttrs();
const { partClass, partAttrs } = useMechaComponent(
  "MechaInputNumber",
  undefined,
  props.ui
);

const safeStep = computed(() => (props.step > 0 ? props.step : 1));
const precisionDigits = computed(() => {
  if (props.precision === null || props.precision === undefined) {
    return null;
  }
  return Math.max(0, Math.min(10, Math.floor(props.precision)));
});

const clampValue = (value: number) =>
  Math.min(props.max, Math.max(props.min, value));

const normalizeValue = (value: number) => {
  let next = clampValue(value);
  if (precisionDigits.value !== null) {
    next = Number(next.toFixed(precisionDigits.value));
  }
  return next;
};

const formatValue = (value: NumberValue) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (precisionDigits.value !== null) {
    return value.toFixed(precisionDigits.value);
  }
  return String(value);
};

const parseValue = (raw: string): NumberValue => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return normalizeValue(parsed);
};

const draft = ref(formatValue(props.modelValue));

watch(
  () => props.modelValue,
  (next) => {
    draft.value = formatValue(next);
  }
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-input-number ${
      props.controlsPosition === "both"
        ? "is-controls-both"
        : "is-controls-right"
    } ${props.disabled ? "is-disabled" : ""}`
  )
);

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const commitValue = async (next: NumberValue, source: string) => {
  const resolved =
    next === null || next === undefined ? null : normalizeValue(next);

  if (resolved === props.modelValue) {
    draft.value = formatValue(resolved);
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaInputNumber",
      action: source,
      payload: {
        current: props.modelValue,
        next: resolved,
        source
      }
    },
    async () => {
      emit("update:modelValue", resolved);
      emit("change", resolved);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
    draft.value = formatValue(props.modelValue);
    return;
  }

  draft.value = formatValue(resolved);
};

const stepBy = (direction: 1 | -1, source: string) => {
  if (props.disabled) {
    return;
  }

  const fallbackBase = Number.isFinite(props.min) ? props.min : 0;
  const base = parseValue(draft.value) ?? props.modelValue ?? fallbackBase;
  const next = normalizeValue(base + safeStep.value * direction);
  void commitValue(next, source);
};

const onInput = (event: Event) => {
  draft.value = (event.target as HTMLInputElement).value;
};

const onBlur = (event: FocusEvent) => {
  emit("blur", event);
  void commitValue(parseValue(draft.value), "blur");
};

const onEnter = () => {
  if (props.disabled) {
    return;
  }
  void commitValue(parseValue(draft.value), "enter");
};
</script>

<template>
  <label :class="rootClass" v-bind="partAttrs('root')">
    <span
      v-if="label || $slots.label"
      :class="partClass('label', 'm-input-number__label')"
      v-bind="partAttrs('label')"
    >
      <slot name="label">{{ label }}</slot>
    </span>

    <span :class="partClass('frame', 'm-input-number__frame')" v-bind="partAttrs('frame')">
      <button
        v-if="controls && controlsPosition === 'both'"
        type="button"
        :disabled="disabled"
        :class="partClass('control-dec', 'm-input-number__control m-input-number__control--dec')"
        v-bind="partAttrs('control-dec')"
        @click="stepBy(-1, 'decrement')"
      >
        -
      </button>

      <input
        :value="draft"
        type="text"
        inputmode="decimal"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="partClass('field', 'm-input-number__field')"
        v-bind="partAttrs('field', inputAttrs as Record<string, unknown>)"
        @input="onInput"
        @focus="emit('focus', $event)"
        @blur="onBlur"
        @keydown.enter.prevent="onEnter"
        @keydown.up.prevent="stepBy(1, 'arrow-up')"
        @keydown.down.prevent="stepBy(-1, 'arrow-down')"
      />

      <span
        v-if="controls && controlsPosition === 'right'"
        :class="partClass('controls', 'm-input-number__controls')"
        v-bind="partAttrs('controls')"
      >
        <button
          type="button"
          :disabled="disabled"
          :class="partClass('control-inc', 'm-input-number__control m-input-number__control--inc')"
          v-bind="partAttrs('control-inc')"
          @click="stepBy(1, 'increment')"
        >
          +
        </button>
        <button
          type="button"
          :disabled="disabled"
          :class="partClass('control-dec', 'm-input-number__control m-input-number__control--dec')"
          v-bind="partAttrs('control-dec')"
          @click="stepBy(-1, 'decrement')"
        >
          -
        </button>
      </span>

      <button
        v-if="controls && controlsPosition === 'both'"
        type="button"
        :disabled="disabled"
        :class="partClass('control-inc', 'm-input-number__control m-input-number__control--inc')"
        v-bind="partAttrs('control-inc')"
        @click="stepBy(1, 'increment')"
      >
        +
      </button>
    </span>

    <span
      v-if="hint || $slots.hint"
      :class="partClass('hint', 'm-input-number__hint')"
      v-bind="partAttrs('hint')"
    >
      <slot name="hint">{{ hint }}</slot>
    </span>
  </label>
</template>

<style>
.m-input-number {
  display: grid;
  gap: 0.5rem;
}

.m-input-number.is-disabled {
  opacity: 0.62;
}

.m-input-number__label {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.74rem;
  color: color-mix(in srgb, var(--mecha-text) 72%, var(--mecha-accent-cool));
}

.m-input-number__frame {
  position: relative;
  display: flex;
  align-items: stretch;
  border-radius: var(--mecha-radius-md);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 32%, #3a5068);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.07), transparent 44%),
    color-mix(in srgb, var(--mecha-bg-soft) 74%, #0d1725);
  overflow: hidden;
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.m-input-number:focus-within .m-input-number__frame {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 64%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.07) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 28%, transparent);
}

.m-input-number__field {
  min-inline-size: 0;
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--mecha-text);
  font-family: "Iosevka Web", "Consolas", monospace;
  font-size: 0.92rem;
  padding: 0.55rem 0.72rem;
}

.m-input-number__field:focus {
  outline: none;
}

.m-input-number__field::placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 86%, #8ba0b8);
}

.m-input-number__controls {
  display: grid;
  grid-template-rows: 1fr 1fr;
  border-left: 1px solid rgb(255 255 255 / 0.08);
}

.m-input-number__control {
  border: 0;
  border-left: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text);
  inline-size: 1.8rem;
  font-family: var(--mecha-font-display);
  cursor: pointer;
  transition:
    background var(--mecha-motion-fast) ease,
    color var(--mecha-motion-fast) ease;
}

.m-input-number__control--inc {
  border-bottom: 1px solid rgb(255 255 255 / 0.09);
}

.m-input-number__control:hover {
  background: rgb(255 255 255 / 0.12);
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
}

.m-input-number__control:disabled {
  cursor: not-allowed;
}

.m-input-number.is-controls-both .m-input-number__control {
  border-left: 0;
  border-right: 1px solid rgb(255 255 255 / 0.08);
  inline-size: 2rem;
}

.m-input-number.is-controls-both .m-input-number__control--inc {
  border-right: 0;
  border-left: 1px solid rgb(255 255 255 / 0.08);
  border-bottom: 0;
}

.m-input-number__hint {
  font-size: 0.74rem;
  color: var(--mecha-text-muted);
}
</style>
