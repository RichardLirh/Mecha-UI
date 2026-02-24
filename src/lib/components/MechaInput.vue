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
}

.m-input__label {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--mecha-text) 70%, var(--mecha-accent-cool));
}

.m-input__frame {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: var(--mecha-radius-md);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #334b62);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.06), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 70%, #0f1824);
  padding: 0.55rem 0.75rem;
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.m-input:focus-within .m-input__frame {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 60%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.06) inset,
    0 0 18px color-mix(in srgb, var(--mecha-accent-cool) 30%, transparent);
}

.m-input__field {
  flex: 1;
  min-inline-size: 0;
  border: 0;
  background: transparent;
  color: var(--mecha-text);
  font-family: var(--mecha-font-body);
  font-size: 0.96rem;
  line-height: 1.2;
}

.m-input__field::placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 80%, #8399b3);
}

.m-input__field:focus {
  outline: none;
}

.m-input__hint {
  font-size: 0.75rem;
  color: var(--mecha-text-muted);
}

.m-input--success .m-input__frame {
  border-color: rgb(77 255 174 / 0.58);
}

.m-input--warning .m-input__frame {
  border-color: color-mix(in srgb, var(--mecha-accent) 68%, #ffe3bf);
}

.m-input--danger .m-input__frame {
  border-color: color-mix(in srgb, var(--mecha-danger) 70%, #ffb2bc);
}
</style>
