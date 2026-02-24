<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type NotificationType = "info" | "success" | "warning" | "error";
type NotificationPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";
type NotificationSource = "close" | "auto";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    message?: string;
    type?: NotificationType;
    position?: NotificationPosition;
    duration?: number;
    offset?: number;
    closable?: boolean;
    showIcon?: boolean;
    zIndex?: number;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: boolean;
      next: boolean;
      source: NotificationSource;
    }>;
  }>(),
  {
    modelValue: false,
    title: "Notification",
    message: "",
    type: "info",
    position: "top-right",
    duration: 3600,
    offset: 20,
    closable: true,
    showIcon: true,
    zIndex: 75,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  open: [];
  close: [];
  blocked: [];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaNotification",
  undefined,
  props.ui
);

const visible = ref(props.modelValue);
const timer = ref<number | null>(null);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-notification m-notification--${props.position} m-notification--${props.type} ${
      visible.value ? "is-open" : "is-close"
    }`
  )
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-notification-offset": `${props.offset}px`,
  "--m-notification-z": String(props.zIndex)
}));

const iconMap: Record<NotificationType, string> = {
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

const requestClose = async (source: NotificationSource) => {
  if (!visible.value) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaNotification",
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
    if (next) {
      emit("open");
      if (props.duration > 0) {
        timer.value = window.setTimeout(() => {
          void requestClose("auto");
        }, props.duration);
      }
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
      <section :class="partClass('panel', 'm-notification__panel')" v-bind="partAttrs('panel')">
        <span
          v-if="showIcon"
          :class="partClass('icon', 'm-notification__icon')"
          v-bind="partAttrs('icon')"
          aria-hidden="true"
        >
          <slot name="icon">{{ iconMap[type] }}</slot>
        </span>

        <div :class="partClass('body', 'm-notification__body')" v-bind="partAttrs('body')">
          <slot name="title">
            <h4 :class="partClass('title', 'm-notification__title')" v-bind="partAttrs('title')">
              {{ title }}
            </h4>
          </slot>
          <slot>
            <p
              :class="partClass('message', 'm-notification__message')"
              v-bind="partAttrs('message')"
            >
              {{ message }}
            </p>
          </slot>
        </div>

        <button
          v-if="closable"
          type="button"
          :class="partClass('close', 'm-notification__close')"
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
.m-notification {
  --m-notification-offset: 20px;
  --m-notification-z: 75;
  position: fixed;
  z-index: var(--m-notification-z);
  inline-size: min(92vw, 19rem);
}

.m-notification--top-right {
  inset: var(--m-notification-offset) var(--m-notification-offset) auto auto;
}

.m-notification--top-left {
  inset: var(--m-notification-offset) auto auto var(--m-notification-offset);
}

.m-notification--bottom-right {
  inset: auto var(--m-notification-offset) var(--m-notification-offset) auto;
}

.m-notification--bottom-left {
  inset: auto auto var(--m-notification-offset) var(--m-notification-offset);
}

.m-notification__panel {
  --m-notification-accent: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  border: 1px solid color-mix(in srgb, var(--m-notification-accent) 30%, #3e5670);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(168deg, rgb(255 255 255 / 0.08), transparent 40%),
    color-mix(in srgb, var(--mecha-bg-elevated) 84%, #0c1522);
  box-shadow: 0 16px 34px rgb(0 0 0 / 0.44);
  padding: 0.58rem 0.62rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: start;
}

.m-notification--success .m-notification__panel {
  --m-notification-accent: color-mix(in srgb, #48eba7 82%, white);
}

.m-notification--warning .m-notification__panel {
  --m-notification-accent: color-mix(in srgb, #ffb547 84%, white);
}

.m-notification--error .m-notification__panel {
  --m-notification-accent: color-mix(in srgb, #ff536f 84%, white);
}

.m-notification__icon {
  inline-size: 1.16rem;
  block-size: 1.16rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--m-notification-accent) 50%, #4d657f);
  color: var(--m-notification-accent);
  display: grid;
  place-items: center;
  font-family: var(--mecha-font-display);
  font-size: 0.66rem;
}

.m-notification__body {
  min-inline-size: 0;
  display: grid;
  gap: 0.14rem;
}

.m-notification__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--m-notification-accent) 80%, white);
}

.m-notification__message {
  margin: 0;
  font-size: 0.76rem;
  color: color-mix(in srgb, var(--mecha-text) 90%, #dbeeff);
}

.m-notification__close {
  border: 1px solid color-mix(in srgb, var(--m-notification-accent) 34%, #4e6780);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: var(--m-notification-accent);
  inline-size: 1.14rem;
  block-size: 1.14rem;
  display: grid;
  place-items: center;
  font-size: 0.62rem;
  cursor: pointer;
}
</style>
