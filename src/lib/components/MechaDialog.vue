<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type DialogSource = "close" | "mask" | "esc";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    width?: string;
    top?: string;
    modal?: boolean;
    closeOnClickModal?: boolean;
    closeOnPressEscape?: boolean;
    showClose?: boolean;
    lockScroll?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: boolean;
      next: boolean;
      source: DialogSource;
    }>;
  }>(),
  {
    modelValue: false,
    title: "",
    width: "min(90vw, 32rem)",
    top: "11vh",
    modal: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    lockScroll: true,
    disabled: false,
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

const { partClass, partAttrs } = useMechaComponent("MechaDialog", undefined, props.ui);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-dialog ${props.modelValue ? "is-open" : "is-close"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const panelStyle = computed<Record<string, string>>(() => ({
  "--m-dialog-width": props.width,
  "--m-dialog-top": props.top
}));

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

const requestClose = async (source: DialogSource) => {
  if (props.disabled || !props.modelValue) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaDialog",
      action: "close",
      payload: {
        current: props.modelValue,
        next: false,
        source
      }
    },
    async () => {
      emit("update:modelValue", false);
      emit("close");
    }
  );

  if (!success) {
    emit("blocked");
  }
};

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
    <div
      v-if="modelValue"
      :class="rootClass"
      v-bind="partAttrs('root')"
    >
      <div
        v-if="modal"
        :class="partClass('mask', 'm-dialog__mask')"
        v-bind="partAttrs('mask')"
        @click="onMaskClick"
      />

      <section
        role="dialog"
        aria-modal="true"
        :style="panelStyle"
        :class="partClass('panel', 'm-dialog__panel')"
        v-bind="partAttrs('panel')"
      >
        <header
          :class="partClass('header', 'm-dialog__header')"
          v-bind="partAttrs('header')"
        >
          <slot name="title">
            <h3
              :class="partClass('title', 'm-dialog__title')"
              v-bind="partAttrs('title')"
            >
              {{ title || "Dialog" }}
            </h3>
          </slot>

          <button
            v-if="showClose"
            type="button"
            :disabled="disabled"
            :class="partClass('close', 'm-dialog__close')"
            v-bind="partAttrs('close')"
            @click="requestClose('close')"
          >
            x
          </button>
        </header>

        <div
          :class="partClass('body', 'm-dialog__body')"
          v-bind="partAttrs('body')"
        >
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          :class="partClass('footer', 'm-dialog__footer')"
          v-bind="partAttrs('footer')"
        >
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style>
.m-dialog {
  position: fixed;
  inset: 0;
  z-index: 72;
  display: grid;
  align-content: start;
  justify-items: center;
  padding: 0.7rem;
}

.m-dialog__mask {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(820px 420px at 50% -24%, rgb(34 201 255 / 0.16), transparent 72%),
    rgb(3 8 14 / 0.68);
  backdrop-filter: blur(3px);
  animation: mecha-dialog-mask-in var(--mecha-motion-base) ease both;
}

.m-dialog__panel {
  --m-dialog-width: min(90vw, 32rem);
  --m-dialog-top: 11vh;
  position: relative;
  margin-top: var(--m-dialog-top);
  inline-size: var(--m-dialog-width);
  max-inline-size: calc(100vw - 1.2rem);
  max-block-size: calc(100vh - 2.2rem);
  overflow: auto;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, #44617c);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(164deg, rgb(255 255 255 / 0.1), transparent 36%),
    radial-gradient(
      220px 120px at 92% -12%,
      color-mix(in srgb, var(--mecha-accent-cool) 16%, transparent),
      transparent 76%
    ),
    color-mix(in srgb, var(--mecha-bg-elevated) 86%, #0d1827);
  box-shadow:
    0 26px 44px rgb(0 0 0 / 0.52),
    0 0 0 1px rgb(255 255 255 / 0.06) inset;
  backdrop-filter: blur(10px) saturate(130%);
  animation: mecha-dialog-panel-in var(--mecha-motion-base) var(--mecha-ease-out) both;
}

.m-dialog__header {
  position: relative;
  padding: 0.72rem 0.8rem 0.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.42rem;
  border-bottom: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, transparent);
}

.m-dialog__header::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  block-size: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--mecha-accent-cool) 44%, white),
    transparent
  );
  opacity: 0.6;
}

.m-dialog__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.74rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 82%, white);
  text-shadow: 0 0 12px color-mix(in srgb, var(--mecha-accent-cool) 26%, transparent);
}

.m-dialog__close {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, #49637d);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: var(--mecha-text);
  inline-size: 1.2rem;
  block-size: 1.2rem;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background var(--mecha-motion-fast) ease,
    border-color var(--mecha-motion-fast) ease,
    transform var(--mecha-motion-fast) ease;
}

.m-dialog__close:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.12);
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
  transform: rotate(90deg);
}

.m-dialog__close:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
  outline-offset: 2px;
}

.m-dialog__body {
  padding: 0.82rem 0.8rem;
  font-size: 0.82rem;
  line-height: 1.5;
  color: color-mix(in srgb, var(--mecha-text) 90%, #dbeeff);
}

.m-dialog__footer {
  border-top: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 18%, transparent);
  padding: 0.64rem 0.8rem 0.74rem;
  display: inline-flex;
  gap: 0.38rem;
  justify-content: flex-end;
  inline-size: 100%;
}

@keyframes mecha-dialog-mask-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes mecha-dialog-panel-in {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 640px) {
  .m-dialog__panel {
    --m-dialog-width: min(96vw, 32rem);
    --m-dialog-top: 6vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-dialog__mask,
  .m-dialog__panel,
  .m-dialog__close {
    animation: none !important;
    transition: none !important;
  }
}
</style>
