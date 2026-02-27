<script setup lang="ts">
import { computed, useAttrs } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

defineOptions({ inheritAttrs: false });

type InputState = "default" | "success" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    hint?: string;
    placeholder?: string;
    state?: InputState;
    ui?: MechaComponentUi;
  }>(),
  {
    modelValue: "",
    label: "",
    hint: "",
    placeholder: "",
    state: "default",
    ui: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const attrs = useAttrs();
const { partClass, partAttrs } = useMechaComponent("MechaInput", undefined, props.ui);

const rootClass = computed(() => partClass("root", `m-input m-input--${props.state}`));

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <label :class="rootClass" v-bind="partAttrs('root', { 'data-state': state })">
    <span
      v-if="label || $slots.label"
      :class="partClass('label', 'm-input__label')"
      v-bind="partAttrs('label')"
    >
      <slot name="label">{{ label }}</slot>
    </span>

    <span :class="partClass('frame', 'm-input__frame')" v-bind="partAttrs('frame')">
      <span
        v-if="$slots.prefix"
        :class="partClass('prefix', 'm-input__prefix')"
        v-bind="partAttrs('prefix')"
      >
        <slot name="prefix" />
      </span>

      <input
        :value="modelValue"
        :placeholder="placeholder"
        :class="partClass('field', 'm-input__field')"
        v-bind="partAttrs('field', inputAttrs as Record<string, unknown>)"
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />

      <span
        v-if="$slots.suffix"
        :class="partClass('suffix', 'm-input__suffix')"
        v-bind="partAttrs('suffix')"
      >
        <slot name="suffix" />
      </span>
    </span>

    <span
      v-if="hint || $slots.hint"
      :class="partClass('hint', 'm-input__hint')"
      v-bind="partAttrs('hint')"
    >
      <slot name="hint">{{ hint }}</slot>
    </span>
  </label>
</template>

<style>
.m-input {
  display: grid;
  gap: 0.5rem;
  position: relative;
}

.m-input__label {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--mecha-text) 68%, var(--mecha-accent-cool));
}

.m-input__frame {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: var(--mecha-radius-md);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, var(--mecha-border));
  background:
    linear-gradient(172deg, rgb(255 255 255 / 0.12), transparent 36%),
    color-mix(in srgb, var(--mecha-panel-soft) 82%, #0e1824);
  clip-path: polygon(
    0 10px,
    10px 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
  padding: 0.12rem 0.16rem 0.12rem 0.2rem;
  overflow: clip;
  transition:
    transform var(--mecha-motion-fast) var(--mecha-ease-out),
    border-color var(--mecha-motion-base) var(--mecha-ease-out),
    box-shadow var(--mecha-motion-base) var(--mecha-ease-out);
}

.m-input__frame::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(
      110deg,
      transparent 16%,
      rgb(255 255 255 / 0.22) 34%,
      transparent 48%
    ),
    repeating-linear-gradient(
      -24deg,
      transparent 0 16px,
      color-mix(in srgb, var(--mecha-accent-cool) 12%, transparent) 16px 17px,
      transparent 17px 34px
    );
  background-size: 220% 100%, 100% 100%;
  opacity: 0.36;
  transform: translateX(-8%);
  transition:
    opacity var(--mecha-motion-base) var(--mecha-ease-out),
    transform var(--mecha-motion-base) var(--mecha-ease-out);
}

.m-input:focus-within .m-input__frame {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 60%, white);
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.12) inset,
    0 12px 26px rgb(2 8 18 / 0.42),
    0 0 20px color-mix(in srgb, var(--mecha-accent-cool) 30%, transparent);
}

.m-input:focus-within .m-input__frame::before {
  opacity: 0.52;
  transform: translateX(4%);
}

.m-input__prefix,
.m-input__suffix {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  color: color-mix(in srgb, var(--mecha-accent-cool) 76%, #e9f9ff);
}

.m-input__field {
  position: relative;
  z-index: 1;
  flex: 1;
  min-inline-size: 0;
  min-block-size: 2.24rem;
  padding: 0 0.44rem;
  border: 0;
  background: transparent;
  color: var(--mecha-text);
  font-family: var(--mecha-font-body);
  font-size: 0.9rem;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.m-input__field::placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 80%, #8399b3);
  transition:
    color var(--mecha-motion-fast) ease,
    transform var(--mecha-motion-fast) ease;
}

.m-input__field:focus {
  outline: none;
}

.m-input__field:disabled {
  cursor: not-allowed;
  color: color-mix(in srgb, var(--mecha-text-muted) 82%, #d5e3f4);
}

.m-input:focus-within .m-input__field::placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 66%, #b4c6d9);
  transform: translateX(2px);
}

.m-input__hint {
  font-size: 0.73rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 88%, #c0d3e8);
  line-height: 1.4;
}

.m-input--success .m-input__frame {
  border-color: color-mix(in srgb, var(--mecha-accent-tactical) 70%, #d8ffe9);
  box-shadow: 0 0 18px color-mix(in srgb, var(--mecha-accent-tactical) 18%, transparent);
}

.m-input--success .m-input__hint {
  color: color-mix(in srgb, var(--mecha-accent-tactical) 70%, #d8ffe9);
}

.m-input--warning .m-input__frame {
  border-color: color-mix(in srgb, var(--mecha-accent) 68%, #ffe3bf);
  box-shadow: 0 0 18px color-mix(in srgb, var(--mecha-accent) 16%, transparent);
}

.m-input--warning .m-input__hint {
  color: color-mix(in srgb, var(--mecha-accent) 74%, #ffe3bf);
}

.m-input--danger .m-input__frame {
  border-color: color-mix(in srgb, var(--mecha-danger) 70%, #ffb2bc);
  box-shadow: 0 0 18px color-mix(in srgb, var(--mecha-danger) 18%, transparent);
}

.m-input--danger .m-input__hint {
  color: color-mix(in srgb, var(--mecha-danger) 74%, #ffd1d8);
}

@media (prefers-reduced-motion: reduce) {
  .m-input__frame,
  .m-input__frame::before,
  .m-input__field::placeholder {
    transition: none !important;
  }
}
</style>
