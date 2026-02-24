<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type PopoverSource = "trigger" | "hover" | "focus" | "outside" | "keyboard";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    content?: string;
    label?: string;
    trigger?: "click" | "hover" | "focus";
    placement?: "top" | "bottom" | "left" | "right";
    width?: string;
    showArrow?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      source: PopoverSource;
      open: boolean;
      nextOpen: boolean;
    }>;
  }>(),
  {
    modelValue: false,
    title: "",
    content: "",
    label: "Details",
    trigger: "hover",
    placement: "top",
    width: "min(88vw, 16rem)",
    showArrow: true,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "open-change": [value: boolean];
  blocked: [payload: { source: PopoverSource }];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaPopover",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const open = ref(props.modelValue);

watch(
  () => props.modelValue,
  (next) => {
    open.value = next;
  }
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-popover m-popover--${props.placement} ${open.value ? "is-open" : "is-close"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const panelStyle = computed<Record<string, string>>(() => ({
  "--m-popover-width": props.width
}));

const setOpen = async (next: boolean, source: PopoverSource) => {
  if (props.disabled || next === open.value) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaPopover",
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

const onReferenceClick = () => {
  if (props.trigger !== "click") {
    return;
  }

  void setOpen(!open.value, "trigger");
};

const onMouseEnter = () => {
  if (props.trigger !== "hover") {
    return;
  }

  void setOpen(true, "hover");
};

const onMouseLeave = () => {
  if (props.trigger !== "hover") {
    return;
  }

  void setOpen(false, "hover");
};

const onFocusIn = () => {
  if (props.trigger !== "focus") {
    return;
  }

  void setOpen(true, "focus");
};

const onFocusOut = (event: FocusEvent) => {
  if (props.trigger !== "focus") {
    return;
  }

  const nextTarget = event.relatedTarget as Node | null;
  if (nextTarget && rootRef.value?.contains(nextTarget)) {
    return;
  }

  void setOpen(false, "focus");
};

const onReferenceKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    void setOpen(false, "keyboard");
    return;
  }

  if (
    props.trigger === "click" &&
    (event.key === "Enter" || event.key === " ")
  ) {
    event.preventDefault();
    void setOpen(!open.value, "keyboard");
  }
};

const onDocumentPointerDown = (event: PointerEvent) => {
  if (!open.value) {
    return;
  }

  const target = event.target as Node | null;
  if (!target || !rootRef.value?.contains(target)) {
    void setOpen(false, "outside");
  }
};

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<template>
  <div
    ref="rootRef"
    :class="rootClass"
    v-bind="partAttrs('root')"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <span
      :class="partClass('reference', 'm-popover__reference')"
      v-bind="partAttrs('reference')"
      tabindex="0"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
      @click="onReferenceClick"
      @keydown="onReferenceKeydown"
    >
      <slot name="reference">
        <button type="button" class="m-popover__reference-btn">{{ label }}</button>
      </slot>
    </span>

    <section
      v-if="open"
      role="dialog"
      :style="panelStyle"
      :class="partClass('panel', 'm-popover__panel')"
      v-bind="partAttrs('panel')"
    >
      <span
        v-if="showArrow"
        :class="partClass('arrow', 'm-popover__arrow')"
        v-bind="partAttrs('arrow')"
        aria-hidden="true"
      />

      <header
        v-if="title || $slots.title"
        :class="partClass('header', 'm-popover__header')"
        v-bind="partAttrs('header')"
      >
        <slot name="title">
          <h4 :class="partClass('title', 'm-popover__title')" v-bind="partAttrs('title')">
            {{ title }}
          </h4>
        </slot>
      </header>

      <div :class="partClass('body', 'm-popover__body')" v-bind="partAttrs('body')">
        <slot>
          <p
            v-if="content"
            :class="partClass('content', 'm-popover__content')"
            v-bind="partAttrs('content')"
          >
            {{ content }}
          </p>
        </slot>
      </div>
    </section>
  </div>
</template>

<style>
.m-popover {
  position: relative;
  display: inline-grid;
}

.m-popover.is-disabled {
  opacity: 0.58;
}

.m-popover__reference {
  display: inline-flex;
  align-items: center;
}

.m-popover__reference-btn {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #3f5670);
  border-radius: 9px;
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text);
  min-block-size: 1.9rem;
  padding: 0.34rem 0.58rem;
  cursor: pointer;
}

.m-popover__panel {
  --m-popover-width: min(88vw, 16rem);
  position: absolute;
  z-index: 42;
  inline-size: var(--m-popover-width);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 26%, #3e5670);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-bg-elevated) 84%, #0c1522);
  box-shadow: 0 14px 32px rgb(0 0 0 / 0.44);
}

.m-popover__arrow {
  position: absolute;
  inline-size: 0.52rem;
  block-size: 0.52rem;
  background: inherit;
  border-inline-start: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 26%, #3e5670);
  border-block-start: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 26%, #3e5670);
}

.m-popover--top .m-popover__panel {
  inset: auto auto calc(100% + 0.56rem) 50%;
  transform: translateX(-50%);
}

.m-popover--top .m-popover__arrow {
  inset: auto auto -0.31rem 50%;
  transform: translateX(-50%) rotate(225deg);
}

.m-popover--bottom .m-popover__panel {
  inset: calc(100% + 0.56rem) auto auto 50%;
  transform: translateX(-50%);
}

.m-popover--bottom .m-popover__arrow {
  inset: -0.31rem auto auto 50%;
  transform: translateX(-50%) rotate(45deg);
}

.m-popover--left .m-popover__panel {
  inset: 50% calc(100% + 0.56rem) auto auto;
  transform: translateY(-50%);
}

.m-popover--left .m-popover__arrow {
  inset: 50% -0.31rem auto auto;
  transform: translateY(-50%) rotate(135deg);
}

.m-popover--right .m-popover__panel {
  inset: 50% auto auto calc(100% + 0.56rem);
  transform: translateY(-50%);
}

.m-popover--right .m-popover__arrow {
  inset: 50% auto auto -0.31rem;
  transform: translateY(-50%) rotate(-45deg);
}

.m-popover__header {
  padding: 0.52rem 0.58rem 0.28rem;
}

.m-popover__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 80%, white);
}

.m-popover__body {
  padding: 0.42rem 0.58rem 0.56rem;
}

.m-popover__content {
  margin: 0;
  font-size: 0.74rem;
  color: var(--mecha-text-muted);
}

@media (max-width: 640px) {
  .m-popover--left .m-popover__panel,
  .m-popover--right .m-popover__panel {
    inset: calc(100% + 0.56rem) auto auto 50%;
    transform: translateX(-50%);
  }

  .m-popover--left .m-popover__arrow,
  .m-popover--right .m-popover__arrow {
    inset: -0.31rem auto auto 50%;
    transform: translateX(-50%) rotate(45deg);
  }
}
</style>
