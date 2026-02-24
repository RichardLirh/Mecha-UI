<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type RadioValue = string | number | boolean | null;

const props = withDefaults(
  defineProps<{
    modelValue?: RadioValue;
    value?: RadioValue;
    name?: string;
    label?: string;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{ current: RadioValue; next: RadioValue }>;
  }>(),
  {
    modelValue: null,
    value: null,
    name: "",
    label: "",
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: RadioValue];
  change: [value: RadioValue];
  blocked: [value: RadioValue];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaRadio", undefined, props.ui);

const isChecked = computed(() => props.modelValue === props.value);

const rootClass = computed(() =>
  partClass("root", `m-radio ${isChecked.value ? "is-checked" : "is-unchecked"}`)
);

const select = async () => {
  if (props.disabled || isChecked.value) {
    return;
  }

  const next = props.value;
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaRadio",
      action: "select",
      payload: { current: props.modelValue, next }
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
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="isChecked"
    :aria-label="label || String(value ?? 'radio')"
    :disabled="disabled"
    :class="rootClass"
    v-bind="partAttrs('root', { 'data-name': name || undefined })"
    @click="select"
    @keydown.space.prevent="select"
    @keydown.enter.prevent="select"
  >
    <span :class="partClass('ring', 'm-radio__ring')" v-bind="partAttrs('ring')">
      <span :class="partClass('dot', 'm-radio__dot')" v-bind="partAttrs('dot')" />
    </span>
    <span
      v-if="label || $slots.default"
      :class="partClass('label', 'm-radio__label')"
      v-bind="partAttrs('label')"
    >
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style>
.m-radio {
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--mecha-text);
  cursor: pointer;
}

.m-radio:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.m-radio:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-radio__ring {
  position: relative;
  inline-size: 1.02rem;
  block-size: 1.02rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 36%, #425a74);
  background:
    linear-gradient(168deg, rgb(255 255 255 / 0.12), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 78%, #101827);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.34) inset,
    0 4px 9px rgb(0 0 0 / 0.22);
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.m-radio__dot {
  position: absolute;
  inset: 0.2rem;
  border-radius: 999px;
  transform: scale(0.24);
  opacity: 0;
  background:
    radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.72), transparent 46%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--mecha-accent-cool) 82%, white),
      color-mix(in srgb, var(--mecha-accent) 44%, #1f4053)
    );
  box-shadow: 0 0 12px color-mix(in srgb, var(--mecha-accent-cool) 34%, transparent);
  transition:
    opacity var(--mecha-motion-base) ease,
    transform var(--mecha-motion-base) ease;
}

.m-radio.is-checked .m-radio__ring {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.38) inset,
    0 0 14px color-mix(in srgb, var(--mecha-accent-cool) 26%, transparent);
}

.m-radio.is-checked .m-radio__dot {
  transform: scale(1);
  opacity: 1;
}

.m-radio__label {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}
</style>
