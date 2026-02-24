<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type MessageBoxType = "info" | "success" | "warning" | "error";
type MessageBoxSource = "close" | "mask" | "esc" | "confirm" | "cancel";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    message?: string;
    type?: MessageBoxType;
    width?: string;
    top?: string;
    modal?: boolean;
    closeOnClickModal?: boolean;
    closeOnPressEscape?: boolean;
    showClose?: boolean;
    lockScroll?: boolean;
    showCancelButton?: boolean;
    showConfirmButton?: boolean;
    cancelButtonText?: string;
    confirmButtonText?: string;
    confirmButtonType?: "primary" | "danger";
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: boolean;
      next: boolean;
      source: MessageBoxSource;
    }>;
  }>(),
  {
    modelValue: false,
    title: "Confirm",
    message: "",
    type: "info",
    width: "min(92vw, 28rem)",
    top: "14vh",
    modal: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    lockScroll: true,
    showCancelButton: true,
    showConfirmButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Confirm",
    confirmButtonType: "primary",
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  open: [];
  close: [];
  confirm: [];
  cancel: [];
  blocked: [];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaMessageBox",
  undefined,
  props.ui
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-message-box ${props.modelValue ? "is-open" : "is-close"} m-message-box--${
      props.type
    } ${props.disabled ? "is-disabled" : ""}`
  )
);

const panelStyle = computed<Record<string, string>>(() => ({
  "--m-message-box-width": props.width,
  "--m-message-box-top": props.top
}));

const iconMap: Record<MessageBoxType, string> = {
  info: "i",
  success: "v",
  warning: "!",
  error: "x"
};

const releaseBody = () => {
  if (props.lockScroll) {
    document.body.style.removeProperty("overflow");
  }
};

const lockBody = () => {
  if (props.lockScroll) {
    document.body.style.overflow = "hidden";
  }
};

const closeAndEmit = (source: MessageBoxSource) => {
  if (source === "confirm") {
    emit("confirm");
  } else if (source === "cancel") {
    emit("cancel");
  }

  emit("update:modelValue", false);
  emit("close");
};

const requestClose = async (source: MessageBoxSource) => {
  if (props.disabled || !props.modelValue) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaMessageBox",
      action: source,
      payload: {
        current: props.modelValue,
        next: false,
        source
      }
    },
    async () => {
      closeAndEmit(source);
    }
  );

  if (!success) {
    emit("blocked");
  }
};

watch(
  () => props.modelValue,
  (next) => {
    if (next) {
      emit("open");
      nextTick(() => lockBody());
      return;
    }

    releaseBody();
  }
);

const onMaskClick = () => {
  if (!props.closeOnClickModal) {
    return;
  }
  void requestClose("mask");
};

const onKeydown = (event: KeyboardEvent) => {
  if (!props.modelValue || props.disabled || !props.closeOnPressEscape) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    void requestClose("esc");
  }
};

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  releaseBody();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" :class="rootClass" v-bind="partAttrs('root')">
      <div
        v-if="modal"
        :class="partClass('mask', 'm-message-box__mask')"
        v-bind="partAttrs('mask')"
        @click="onMaskClick"
      />

      <section
        role="alertdialog"
        aria-modal="true"
        :style="panelStyle"
        :class="partClass('panel', 'm-message-box__panel')"
        v-bind="partAttrs('panel')"
      >
        <header :class="partClass('header', 'm-message-box__header')" v-bind="partAttrs('header')">
          <span
            :class="partClass('icon', 'm-message-box__icon')"
            v-bind="partAttrs('icon')"
            aria-hidden="true"
          >
            <slot name="icon">{{ iconMap[type] }}</slot>
          </span>

          <h3 :class="partClass('title', 'm-message-box__title')" v-bind="partAttrs('title')">
            <slot name="title">{{ title }}</slot>
          </h3>

          <button
            v-if="showClose"
            type="button"
            :disabled="disabled"
            :class="partClass('close', 'm-message-box__close')"
            v-bind="partAttrs('close')"
            @click="requestClose('close')"
          >
            x
          </button>
        </header>

        <div :class="partClass('body', 'm-message-box__body')" v-bind="partAttrs('body')">
          <slot>
            <p :class="partClass('message', 'm-message-box__message')" v-bind="partAttrs('message')">
              {{ message }}
            </p>
          </slot>
        </div>

        <footer :class="partClass('footer', 'm-message-box__footer')" v-bind="partAttrs('footer')">
          <slot name="footer">
            <button
              v-if="showCancelButton"
              type="button"
              :disabled="disabled"
              :class="partClass('cancel', 'm-message-box__btn m-message-box__btn--cancel')"
              v-bind="partAttrs('cancel')"
              @click="requestClose('cancel')"
            >
              {{ cancelButtonText }}
            </button>
            <button
              v-if="showConfirmButton"
              type="button"
              :disabled="disabled"
              :class="
                partClass(
                  'confirm',
                  `m-message-box__btn m-message-box__btn--confirm m-message-box__btn--${confirmButtonType}`
                )
              "
              v-bind="partAttrs('confirm')"
              @click="requestClose('confirm')"
            >
              {{ confirmButtonText }}
            </button>
          </slot>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style>
.m-message-box {
  position: fixed;
  inset: 0;
  z-index: 73;
  display: grid;
  justify-items: center;
}

.m-message-box__mask {
  position: absolute;
  inset: 0;
  background: rgb(4 8 13 / 0.62);
  backdrop-filter: blur(2px);
}

.m-message-box__panel {
  --m-message-box-width: min(92vw, 28rem);
  --m-message-box-top: 14vh;
  --m-message-box-accent: color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
  position: relative;
  margin-top: var(--m-message-box-top);
  inline-size: var(--m-message-box-width);
  max-inline-size: calc(100vw - 1.2rem);
  border: 1px solid color-mix(in srgb, var(--m-message-box-accent) 32%, #44617c);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(166deg, rgb(255 255 255 / 0.08), transparent 38%),
    color-mix(in srgb, var(--mecha-bg-elevated) 84%, #0d1827);
  box-shadow: 0 18px 42px rgb(0 0 0 / 0.46);
}

.m-message-box--success .m-message-box__panel {
  --m-message-box-accent: color-mix(in srgb, #48eba7 82%, white);
}

.m-message-box--warning .m-message-box__panel {
  --m-message-box-accent: color-mix(in srgb, #ffb547 84%, white);
}

.m-message-box--error .m-message-box__panel {
  --m-message-box-accent: color-mix(in srgb, #ff536f 84%, white);
}

.m-message-box__header {
  padding: 0.7rem 0.76rem 0.56rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: center;
  border-bottom: 1px solid rgb(255 255 255 / 0.09);
}

.m-message-box__icon {
  inline-size: 1.18rem;
  block-size: 1.18rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--m-message-box-accent) 52%, #4d657f);
  color: var(--m-message-box-accent);
  display: grid;
  place-items: center;
  font-family: var(--mecha-font-display);
  font-size: 0.64rem;
}

.m-message-box__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.76rem;
  color: color-mix(in srgb, var(--m-message-box-accent) 80%, white);
}

.m-message-box__close {
  border: 1px solid color-mix(in srgb, var(--m-message-box-accent) 36%, #49637d);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: var(--m-message-box-accent);
  inline-size: 1.14rem;
  block-size: 1.14rem;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.m-message-box__body {
  padding: 0.76rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--mecha-text) 90%, #dbeeff);
}

.m-message-box__message {
  margin: 0;
}

.m-message-box__footer {
  border-top: 1px solid rgb(255 255 255 / 0.09);
  padding: 0.62rem 0.76rem 0.72rem;
  display: inline-flex;
  gap: 0.38rem;
  justify-content: flex-end;
  inline-size: 100%;
}

.m-message-box__btn {
  border-radius: 9px;
  min-block-size: 1.9rem;
  padding: 0.34rem 0.58rem;
  font-size: 0.74rem;
  cursor: pointer;
}

.m-message-box__btn--cancel {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 26%, #46607b);
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text);
}

.m-message-box__btn--confirm {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 36%, #49637d);
  background: color-mix(in srgb, var(--mecha-accent-cool) 20%, #16344d);
  color: color-mix(in srgb, var(--mecha-accent-cool) 82%, white);
}

.m-message-box__btn--danger {
  border-color: color-mix(in srgb, #ff536f 44%, #546d86);
  background: color-mix(in srgb, #ff536f 22%, #2a1820);
  color: color-mix(in srgb, #ff536f 80%, white);
}
</style>
