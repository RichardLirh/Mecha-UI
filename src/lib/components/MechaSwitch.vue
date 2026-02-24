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
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean }>;
  }>(),
  {
    modelValue: false,
    label: "",
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [value: boolean];
  blocked: [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaSwitch", undefined, props.ui);

const rootClass = computed(() =>
  partClass("root", `m-switch ${props.modelValue ? "is-on" : "is-off"}`)
);

const toggle = async () => {
  if (props.disabled) {
    return;
  }

  const next = !props.modelValue;
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaSwitch",
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
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label || 'switch'"
    :class="rootClass"
    :disabled="disabled"
    v-bind="partAttrs('root')"
    @click="toggle"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
  >
    <span :class="partClass('track', 'm-switch__track')" v-bind="partAttrs('track')">
      <span :class="partClass('thumb', 'm-switch__thumb')" v-bind="partAttrs('thumb')" />
    </span>
    <span
      v-if="label || $slots.default"
      :class="partClass('label', 'm-switch__label')"
      v-bind="partAttrs('label')"
    >
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style>
.m-switch {
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  color: var(--mecha-text);
}

.m-switch:disabled {
  opacity: 0.54;
  cursor: not-allowed;
}

.m-switch:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 2px;
}

.m-switch__track {
  position: relative;
  inline-size: 2.8rem;
  block-size: 1.45rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #374a60);
  background: linear-gradient(to right, #243242, #1a2534);
  transition: background var(--mecha-motion-base) ease;
}

.m-switch__thumb {
  position: absolute;
  inset: 0.14rem auto auto 0.14rem;
  inline-size: 1.08rem;
  block-size: 1.08rem;
  border-radius: 999px;
  background: #d8ebfd;
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.45),
    0 0 0 1px rgb(255 255 255 / 0.2) inset;
  transition:
    transform var(--mecha-motion-base) ease,
    background var(--mecha-motion-base) ease;
}

.m-switch.is-on .m-switch__track {
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--mecha-accent-cool) 58%, #0f2f3d),
    color-mix(in srgb, var(--mecha-accent) 42%, #37210f)
  );
}

.m-switch.is-on .m-switch__thumb {
  transform: translateX(1.36rem);
  background: #ffffff;
}

.m-switch__label {
  font-size: 0.84rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: var(--mecha-font-display);
}
</style>
