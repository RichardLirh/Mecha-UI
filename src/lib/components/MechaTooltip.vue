<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type TooltipSource =
  | "trigger"
  | "hover"
  | "focus"
  | "outside"
  | "keyboard"
  | "delay";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    content?: string;
    trigger?: "hover" | "focus" | "click";
    placement?: "top" | "bottom" | "left" | "right";
    openDelay?: number;
    hideDelay?: number;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      source: TooltipSource;
      open: boolean;
      nextOpen: boolean;
    }>;
  }>(),
  {
    modelValue: false,
    content: "",
    trigger: "hover",
    placement: "top",
    openDelay: 80,
    hideDelay: 80,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "open-change": [value: boolean];
  blocked: [payload: { source: TooltipSource }];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaTooltip",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const open = ref(props.modelValue);
const openTimer = ref<number | null>(null);
const closeTimer = ref<number | null>(null);

watch(
  () => props.modelValue,
  (next) => {
    open.value = next;
  }
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-tooltip m-tooltip--${props.placement} ${open.value ? "is-open" : "is-close"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const clearTimers = () => {
  if (openTimer.value !== null) {
    window.clearTimeout(openTimer.value);
    openTimer.value = null;
  }
  if (closeTimer.value !== null) {
    window.clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }
};

const setOpen = async (next: boolean, source: TooltipSource) => {
  if (props.disabled || next === open.value) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTooltip",
      action: next ? "open" : "close",
      payload: {
        source,
        open: open.value,
        nextOpen: next
      }
    },
    async () => {
      open.value = next;
      emit("update:modelValue", next);
      emit("open-change", next);
    }
  );

  if (!success) {
    emit("blocked", { source });
  }
};

const queueOpen = (source: TooltipSource) => {
  if (props.disabled) {
    return;
  }

  if (closeTimer.value !== null) {
    window.clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }

  if (props.openDelay <= 0) {
    void setOpen(true, source);
    return;
  }

  if (openTimer.value !== null) {
    window.clearTimeout(openTimer.value);
  }

  openTimer.value = window.setTimeout(() => {
    openTimer.value = null;
    void setOpen(true, "delay");
  }, props.openDelay);
};

const queueClose = (source: TooltipSource) => {
  if (props.disabled) {
    return;
  }

  if (openTimer.value !== null) {
    window.clearTimeout(openTimer.value);
    openTimer.value = null;
  }

  if (props.hideDelay <= 0) {
    void setOpen(false, source);
    return;
  }

  if (closeTimer.value !== null) {
    window.clearTimeout(closeTimer.value);
  }

  closeTimer.value = window.setTimeout(() => {
    closeTimer.value = null;
    void setOpen(false, "delay");
  }, props.hideDelay);
};

const onMouseEnter = () => {
  if (props.trigger !== "hover") {
    return;
  }

  queueOpen("hover");
};

const onMouseLeave = () => {
  if (props.trigger !== "hover") {
    return;
  }

  queueClose("hover");
};

const onFocusIn = () => {
  if (props.trigger !== "focus") {
    return;
  }

  queueOpen("focus");
};

const onFocusOut = (event: FocusEvent) => {
  if (props.trigger !== "focus") {
    return;
  }

  const nextTarget = event.relatedTarget as Node | null;
  if (nextTarget && rootRef.value?.contains(nextTarget)) {
    return;
  }

  queueClose("focus");
};

const onReferenceClick = () => {
  if (props.trigger !== "click") {
    return;
  }

  clearTimers();
  void setOpen(!open.value, "trigger");
};

const onReferenceKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    clearTimers();
    void setOpen(false, "keyboard");
    return;
  }

  if (
    props.trigger === "click" &&
    (event.key === "Enter" || event.key === " ")
  ) {
    event.preventDefault();
    clearTimers();
    void setOpen(!open.value, "keyboard");
  }
};

const onDocumentPointerDown = (event: PointerEvent) => {
  if (!open.value || props.trigger !== "click") {
    return;
  }

  const target = event.target as Node | null;
  if (!target || !rootRef.value?.contains(target)) {
    clearTimers();
    void setOpen(false, "outside");
  }
};

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
  clearTimers();
});
</script>

<template>
  <span
    ref="rootRef"
    :class="rootClass"
    v-bind="partAttrs('root')"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <span
      :class="partClass('reference', 'm-tooltip__reference')"
      v-bind="partAttrs('reference')"
      tabindex="0"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
      @click="onReferenceClick"
      @keydown="onReferenceKeydown"
    >
      <slot>
        <span class="m-tooltip__fallback">i</span>
      </slot>
    </span>

    <span
      v-if="open"
      role="tooltip"
      :class="partClass('panel', 'm-tooltip__panel')"
      v-bind="partAttrs('panel')"
    >
      <span
        :class="partClass('arrow', 'm-tooltip__arrow')"
        v-bind="partAttrs('arrow')"
        aria-hidden="true"
      />
      <span :class="partClass('text', 'm-tooltip__text')" v-bind="partAttrs('text')">
        <slot name="content">{{ content }}</slot>
      </span>
    </span>
  </span>
</template>

<style>
.m-tooltip {
  position: relative;
  display: inline-flex;
}

.m-tooltip.is-disabled {
  opacity: 0.58;
}

.m-tooltip__reference {
  display: inline-flex;
  align-items: center;
}

.m-tooltip__fallback {
  inline-size: 1.04rem;
  block-size: 1.04rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 36%, #4d657f);
  color: color-mix(in srgb, var(--mecha-accent-cool) 80%, white);
  display: grid;
  place-items: center;
  font-size: 0.6rem;
}

.m-tooltip__panel {
  position: absolute;
  z-index: 43;
  inline-size: max-content;
  max-inline-size: min(80vw, 16rem);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3e5670);
  border-radius: 8px;
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-bg-elevated) 90%, #0a1019);
  color: color-mix(in srgb, var(--mecha-text) 94%, white);
  padding: 0.34rem 0.46rem;
  font-size: 0.68rem;
  line-height: 1.35;
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.4);
}

.m-tooltip__arrow {
  position: absolute;
  inline-size: 0.46rem;
  block-size: 0.46rem;
  background: inherit;
  border-inline-start: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3e5670);
  border-block-start: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3e5670);
}

.m-tooltip--top .m-tooltip__panel {
  inset: auto auto calc(100% + 0.42rem) 50%;
  transform: translateX(-50%);
}

.m-tooltip--top .m-tooltip__arrow {
  inset: auto auto -0.28rem 50%;
  transform: translateX(-50%) rotate(225deg);
}

.m-tooltip--bottom .m-tooltip__panel {
  inset: calc(100% + 0.42rem) auto auto 50%;
  transform: translateX(-50%);
}

.m-tooltip--bottom .m-tooltip__arrow {
  inset: -0.28rem auto auto 50%;
  transform: translateX(-50%) rotate(45deg);
}

.m-tooltip--left .m-tooltip__panel {
  inset: 50% calc(100% + 0.42rem) auto auto;
  transform: translateY(-50%);
}

.m-tooltip--left .m-tooltip__arrow {
  inset: 50% -0.28rem auto auto;
  transform: translateY(-50%) rotate(135deg);
}

.m-tooltip--right .m-tooltip__panel {
  inset: 50% auto auto calc(100% + 0.42rem);
  transform: translateY(-50%);
}

.m-tooltip--right .m-tooltip__arrow {
  inset: 50% auto auto -0.28rem;
  transform: translateY(-50%) rotate(-45deg);
}

@media (max-width: 640px) {
  .m-tooltip--left .m-tooltip__panel,
  .m-tooltip--right .m-tooltip__panel {
    inset: calc(100% + 0.42rem) auto auto 50%;
    transform: translateX(-50%);
  }

  .m-tooltip--left .m-tooltip__arrow,
  .m-tooltip--right .m-tooltip__arrow {
    inset: -0.28rem auto auto 50%;
    transform: translateX(-50%) rotate(45deg);
  }
}
</style>
