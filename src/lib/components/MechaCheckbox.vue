<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    disabled?: boolean;
    indeterminate?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean }>;
  }>(),
  {
    modelValue: false,
    label: "",
    disabled: false,
    indeterminate: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [value: boolean];
  blocked: [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaCheckbox", undefined, props.ui);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-checkbox ${props.modelValue ? "is-checked" : "is-unchecked"} ${
      props.indeterminate ? "is-indeterminate" : ""
    }`
  )
);

const toggle = async () => {
  if (props.disabled) {
    return;
  }

  const next = !props.modelValue;
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaCheckbox",
      action: "toggle",
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
    role="checkbox"
    :aria-checked="indeterminate ? 'mixed' : modelValue"
    :aria-label="label || 'checkbox'"
    :disabled="disabled"
    :class="rootClass"
    v-bind="partAttrs('root')"
    @click="toggle"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
  >
    <span :class="partClass('box', 'm-checkbox__box')" v-bind="partAttrs('box')">
      <span :class="partClass('mark', 'm-checkbox__mark')" v-bind="partAttrs('mark')" />
    </span>
    <span
      v-if="label || $slots.default"
      :class="partClass('label', 'm-checkbox__label')"
      v-bind="partAttrs('label')"
    >
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style>
.m-checkbox {
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.56rem;
  color: var(--mecha-text);
  cursor: pointer;
  transition: filter var(--mecha-motion-base) ease;
}

.m-checkbox:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.m-checkbox:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-checkbox__box {
  position: relative;
  inline-size: 1.06rem;
  block-size: 1.06rem;
  border-radius: 3px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 38%, #40566f);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.1), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 78%, #0f1724);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.36) inset,
    0 4px 9px rgb(0 0 0 / 0.26);
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease,
    background var(--mecha-motion-base) ease;
}

.m-checkbox__mark {
  position: absolute;
  inset: 0;
}

.m-checkbox__mark::before,
.m-checkbox__mark::after {
  content: "";
  position: absolute;
  opacity: 0;
  transition:
    opacity var(--mecha-motion-base) ease,
    transform var(--mecha-motion-base) ease;
}

.m-checkbox__mark::before {
  inset: 0.24rem 0.16rem auto 0.16rem;
  block-size: 2px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
  transform: scaleX(0.2);
}

.m-checkbox__mark::after {
  inset: 0.16rem auto auto 0.24rem;
  inline-size: 0.2rem;
  block-size: 0.44rem;
  border-right: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  border-bottom: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  transform: rotate(45deg) scale(0.4);
  transform-origin: center;
}

.m-checkbox.is-checked .m-checkbox__box {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  background:
    linear-gradient(
      144deg,
      color-mix(in srgb, var(--mecha-accent-cool) 52%, #17364a),
      color-mix(in srgb, var(--mecha-accent) 28%, #19252f)
    );
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.4) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 24%, transparent);
}

.m-checkbox.is-checked .m-checkbox__mark::after {
  opacity: 1;
  transform: rotate(45deg) scale(1);
}

.m-checkbox.is-indeterminate .m-checkbox__mark::before {
  opacity: 1;
  transform: scaleX(1);
}

.m-checkbox__label {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}
</style>
