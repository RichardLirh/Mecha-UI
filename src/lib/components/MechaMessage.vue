<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type MessageType = "info" | "success" | "warning" | "error";
type MessageSource = "close" | "auto";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    message?: string;
    type?: MessageType;
    showIcon?: boolean;
    closable?: boolean;
    duration?: number;
    offset?: number;
    zIndex?: number;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: boolean;
      next: boolean;
      source: MessageSource;
    }>;
  }>(),
  {
    modelValue: false,
    message: "",
    type: "info",
    showIcon: true,
    closable: false,
    duration: 2600,
    offset: 18,
    zIndex: 76,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
  blocked: [];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaMessage",
  undefined,
  props.ui
);

const visible = ref(props.modelValue);
const timer = ref<number | null>(null);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-message m-message--${props.type} ${visible.value ? "is-open" : "is-close"}`
  )
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-message-offset": `${props.offset}px`,
  "--m-message-z": String(props.zIndex)
}));

const iconMap: Record<MessageType, string> = {
  info: "i",
  success: "v",
  warning: "!",
  error: "x"
};

const clearTimer = () => {
  if (timer.value !== null) {
    window.clearTimeout(timer.value);
    timer.value = null;
  }
};

const requestClose = async (source: MessageSource) => {
  if (!visible.value) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaMessage",
      action: "close",
      payload: {
        current: visible.value,
        next: false,
        source
      }
    },
    async () => {
      clearTimer();
      visible.value = false;
      emit("update:modelValue", false);
      emit("close");
    }
  );

  if (!success) {
    emit("blocked");
  }
};

watch(
  () => props.modelValue,
  (next) => {
    visible.value = next;
  }
);

watch(
  visible,
  (next) => {
    clearTimer();
    if (next && props.duration > 0) {
      timer.value = window.setTimeout(() => {
        void requestClose("auto");
      }, props.duration);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      :class="rootClass"
      :style="rootStyle"
      v-bind="partAttrs('root')"
      role="status"
      aria-live="polite"
    >
      <section :class="partClass('panel', 'm-message__panel')" v-bind="partAttrs('panel')">
        <span
          v-if="showIcon"
          :class="partClass('icon', 'm-message__icon')"
          v-bind="partAttrs('icon')"
          aria-hidden="true"
        >
          <slot name="icon">{{ iconMap[type] }}</slot>
        </span>

        <div :class="partClass('content', 'm-message__content')" v-bind="partAttrs('content')">
          <slot>
            <p :class="partClass('text', 'm-message__text')" v-bind="partAttrs('text')">
              {{ message || "Message" }}
            </p>
          </slot>
        </div>

        <button
          v-if="closable"
          type="button"
          :class="partClass('close', 'm-message__close')"
          v-bind="partAttrs('close')"
          @click="requestClose('close')"
        >
          x
        </button>
      </section>
    </div>
  </Teleport>
</template>

<style>
.m-message {
  --m-message-offset: 18px;
  --m-message-z: 76;
  position: fixed;
  inset: var(--m-message-offset) 0 auto 0;
  z-index: var(--m-message-z);
  display: grid;
  justify-items: center;
  pointer-events: none;
}

.m-message__panel {
  --m-message-accent: color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
  pointer-events: auto;
  min-inline-size: min(90vw, 14rem);
  max-inline-size: min(90vw, 28rem);
  border: 1px solid color-mix(in srgb, var(--m-message-accent) 32%, #3e5670);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 40%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #0d1724);
  box-shadow: 0 14px 34px rgb(0 0 0 / 0.42);
  padding: 0.46rem 0.56rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.34rem;
}

.m-message--success .m-message__panel {
  --m-message-accent: color-mix(in srgb, #48eba7 82%, white);
}

.m-message--warning .m-message__panel {
  --m-message-accent: color-mix(in srgb, #ffb547 84%, white);
}

.m-message--error .m-message__panel {
  --m-message-accent: color-mix(in srgb, #ff536f 84%, white);
}

.m-message__icon {
  inline-size: 1.14rem;
  block-size: 1.14rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--m-message-accent) 50%, #4d657f);
  color: var(--m-message-accent);
  display: grid;
  place-items: center;
  font-family: var(--mecha-font-display);
  font-size: 0.64rem;
}

.m-message__content {
  min-inline-size: 0;
}

.m-message__text {
  margin: 0;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--mecha-text) 92%, #d9efff);
}

.m-message__close {
  border: 1px solid color-mix(in srgb, var(--m-message-accent) 36%, #4c647e);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: var(--m-message-accent);
  inline-size: 1.1rem;
  block-size: 1.1rem;
  display: grid;
  place-items: center;
  font-size: 0.62rem;
  cursor: pointer;
}
</style>
