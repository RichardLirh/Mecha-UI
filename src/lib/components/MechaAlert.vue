<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type AlertType = "info" | "success" | "warning" | "error";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    description?: string;
    type?: AlertType;
    closable?: boolean;
    showIcon?: boolean;
    center?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: boolean;
      next: boolean;
      source: "close";
    }>;
  }>(),
  {
    modelValue: true,
    title: "",
    description: "",
    type: "info",
    closable: false,
    showIcon: true,
    center: false,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
  blocked: [];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaAlert", undefined, props.ui);

const visible = ref(props.modelValue);

watch(
  () => props.modelValue,
  (next) => {
    visible.value = next;
  }
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-alert m-alert--${props.type} ${props.center ? "is-center" : ""} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const iconMap: Record<AlertType, string> = {
  info: "i",
  success: "v",
  warning: "!",
  error: "x"
};

const onClose = async () => {
  if (props.disabled) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaAlert",
      action: "close",
      payload: {
        current: visible.value,
        next: false,
        source: "close"
      }
    },
    async () => {
      visible.value = false;
      emit("update:modelValue", false);
      emit("close");
    }
  );

  if (!success) {
    emit("blocked");
  }
};
</script>

<template>
  <section
    v-if="visible"
    :class="rootClass"
    v-bind="partAttrs('root')"
    role="alert"
  >
    <span
      v-if="showIcon"
      :class="partClass('icon', 'm-alert__icon')"
      v-bind="partAttrs('icon')"
      aria-hidden="true"
    >
      <slot name="icon">{{ iconMap[type] }}</slot>
    </span>

    <div :class="partClass('body', 'm-alert__body')" v-bind="partAttrs('body')">
      <slot name="title">
        <h4
          v-if="title || $slots.title"
          :class="partClass('title', 'm-alert__title')"
          v-bind="partAttrs('title')"
        >
          {{ title }}
        </h4>
      </slot>

      <slot>
        <p
          v-if="description || $slots.default"
          :class="partClass('description', 'm-alert__description')"
          v-bind="partAttrs('description')"
        >
          {{ description }}
        </p>
      </slot>
    </div>

    <button
      v-if="closable"
      type="button"
      :disabled="disabled"
      :class="partClass('close', 'm-alert__close')"
      v-bind="partAttrs('close')"
      @click="onClose"
    >
      x
    </button>
  </section>
</template>

<style>
.m-alert {
  --m-alert-accent: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  inline-size: min(100%, 40rem);
  border: 1px solid color-mix(in srgb, var(--m-alert-accent) 30%, #3f5770);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(168deg, rgb(255 255 255 / 0.08), transparent 40%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
  padding: 0.58rem 0.66rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.42rem;
}

.m-alert.is-center {
  text-align: center;
}

.m-alert.is-disabled {
  opacity: 0.58;
}

.m-alert--success {
  --m-alert-accent: color-mix(in srgb, #48eba7 82%, white);
}

.m-alert--warning {
  --m-alert-accent: color-mix(in srgb, #ffb547 84%, white);
}

.m-alert--error {
  --m-alert-accent: color-mix(in srgb, #ff536f 84%, white);
}

.m-alert__icon {
  inline-size: 1.16rem;
  block-size: 1.16rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--m-alert-accent) 50%, #4d657f);
  color: var(--m-alert-accent);
  display: grid;
  place-items: center;
  font-size: 0.66rem;
  font-family: var(--mecha-font-display);
}

.m-alert__body {
  min-inline-size: 0;
  display: grid;
  gap: 0.14rem;
}

.m-alert__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--m-alert-accent) 80%, white);
}

.m-alert__description {
  margin: 0;
  font-size: 0.76rem;
  color: color-mix(in srgb, var(--mecha-text) 90%, #dbeeff);
}

.m-alert__close {
  border: 1px solid color-mix(in srgb, var(--m-alert-accent) 34%, #4e6780);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: var(--m-alert-accent);
  inline-size: 1.14rem;
  block-size: 1.14rem;
  display: grid;
  place-items: center;
  font-size: 0.62rem;
  cursor: pointer;
}
</style>
