<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type PopconfirmSource =
  | "trigger"
  | "hover"
  | "outside"
  | "confirm"
  | "cancel"
  | "keyboard";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    content?: string;
    confirmText?: string;
    cancelText?: string;
    confirmType?: "primary" | "danger";
    trigger?: "click" | "hover";
    placement?: "top" | "bottom" | "left" | "right";
    hideAfterConfirm?: boolean;
    hideAfterCancel?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      source: PopconfirmSource;
      open: boolean;
      nextOpen: boolean;
    }>;
  }>(),
  {
    modelValue: false,
    title: "Are you sure?",
    content: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmType: "primary",
    trigger: "click",
    placement: "top",
    hideAfterConfirm: true,
    hideAfterCancel: true,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "open-change": [value: boolean];
  confirm: [];
  cancel: [];
  blocked: [payload: { source: PopconfirmSource }];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaPopconfirm",
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
    `m-popconfirm m-popconfirm--${props.placement} ${open.value ? "is-open" : "is-close"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const emitOpen = (next: boolean) => {
  open.value = next;
  emit("update:modelValue", next);
  emit("open-change", next);
};

const setOpen = async (next: boolean, source: PopconfirmSource) => {
  if (props.disabled || next === open.value) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaPopconfirm",
      action: next ? "open" : "close",
      payload: {
        source,
        open: open.value,
        nextOpen: next
      }
    },
    async () => {
      emitOpen(next);
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

const runAction = async (source: "confirm" | "cancel") => {
  if (props.disabled) {
    return;
  }

  const nextOpen =
    source === "confirm" ? !props.hideAfterConfirm : !props.hideAfterCancel;

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaPopconfirm",
      action: source,
      payload: {
        source,
        open: open.value,
        nextOpen
      }
    },
    async () => {
      if (source === "confirm") {
        emit("confirm");
      } else {
        emit("cancel");
      }

      if (nextOpen !== open.value) {
        emitOpen(nextOpen);
      }
    }
  );

  if (!success) {
    emit("blocked", { source });
  }
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
      :class="partClass('reference', 'm-popconfirm__reference')"
      v-bind="partAttrs('reference')"
      tabindex="0"
      @click="onReferenceClick"
      @keydown="onReferenceKeydown"
    >
      <slot name="reference">
        <button type="button" class="m-popconfirm__reference-btn">Action</button>
      </slot>
    </span>

    <section
      v-if="open"
      role="dialog"
      :class="partClass('panel', 'm-popconfirm__panel')"
      v-bind="partAttrs('panel')"
    >
      <span
        :class="partClass('arrow', 'm-popconfirm__arrow')"
        v-bind="partAttrs('arrow')"
        aria-hidden="true"
      />
      <h4 :class="partClass('title', 'm-popconfirm__title')" v-bind="partAttrs('title')">
        {{ title }}
      </h4>
      <p
        v-if="content"
        :class="partClass('content', 'm-popconfirm__content')"
        v-bind="partAttrs('content')"
      >
        {{ content }}
      </p>
      <slot />
      <div :class="partClass('actions', 'm-popconfirm__actions')" v-bind="partAttrs('actions')">
        <button
          type="button"
          :class="partClass('cancel', 'm-popconfirm__btn m-popconfirm__btn--cancel')"
          v-bind="partAttrs('cancel')"
          @click="runAction('cancel')"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          :class="
            partClass(
              'confirm',
              `m-popconfirm__btn m-popconfirm__btn--confirm m-popconfirm__btn--${confirmType}`
            )
          "
          v-bind="partAttrs('confirm')"
          @click="runAction('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </section>
  </div>
</template>

<style>
.m-popconfirm {
  position: relative;
  display: inline-grid;
}

.m-popconfirm.is-disabled {
  opacity: 0.58;
}

.m-popconfirm__reference {
  display: inline-flex;
  align-items: center;
}

.m-popconfirm__reference-btn {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #3f5670);
  border-radius: 9px;
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text);
  min-block-size: 1.9rem;
  padding: 0.34rem 0.58rem;
  cursor: pointer;
}

.m-popconfirm__panel {
  position: absolute;
  z-index: 42;
  inline-size: min(88vw, 15rem);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #3e5670);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-bg-elevated) 84%, #0c1522);
  box-shadow: 0 14px 32px rgb(0 0 0 / 0.44);
  padding: 0.56rem;
  display: grid;
  gap: 0.34rem;
}

.m-popconfirm__arrow {
  position: absolute;
  inline-size: 0.52rem;
  block-size: 0.52rem;
  background: inherit;
  border-inline-start: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #3e5670);
  border-block-start: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #3e5670);
}

.m-popconfirm--top .m-popconfirm__panel {
  inset: auto auto calc(100% + 0.56rem) 50%;
  transform: translateX(-50%);
}

.m-popconfirm--top .m-popconfirm__arrow {
  inset: auto auto -0.31rem 50%;
  transform: translateX(-50%) rotate(225deg);
}

.m-popconfirm--bottom .m-popconfirm__panel {
  inset: calc(100% + 0.56rem) auto auto 50%;
  transform: translateX(-50%);
}

.m-popconfirm--bottom .m-popconfirm__arrow {
  inset: -0.31rem auto auto 50%;
  transform: translateX(-50%) rotate(45deg);
}

.m-popconfirm--left .m-popconfirm__panel {
  inset: 50% calc(100% + 0.56rem) auto auto;
  transform: translateY(-50%);
}

.m-popconfirm--left .m-popconfirm__arrow {
  inset: 50% -0.31rem auto auto;
  transform: translateY(-50%) rotate(135deg);
}

.m-popconfirm--right .m-popconfirm__panel {
  inset: 50% auto auto calc(100% + 0.56rem);
  transform: translateY(-50%);
}

.m-popconfirm--right .m-popconfirm__arrow {
  inset: 50% auto auto -0.31rem;
  transform: translateY(-50%) rotate(-45deg);
}

.m-popconfirm__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 80%, white);
}

.m-popconfirm__content {
  margin: 0;
  font-size: 0.74rem;
  color: var(--mecha-text-muted);
}

.m-popconfirm__actions {
  display: inline-flex;
  justify-content: flex-end;
  gap: 0.28rem;
}

.m-popconfirm__btn {
  min-block-size: 1.7rem;
  padding: 0.24rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  cursor: pointer;
}

.m-popconfirm__btn--cancel {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #465f79);
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text);
}

.m-popconfirm__btn--confirm {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, #49637d);
  background: color-mix(in srgb, var(--mecha-accent-cool) 18%, #16344d);
  color: color-mix(in srgb, var(--mecha-accent-cool) 82%, white);
}

.m-popconfirm__btn--danger {
  border-color: color-mix(in srgb, #ff536f 44%, #546d86);
  background: color-mix(in srgb, #ff536f 22%, #2a1820);
  color: color-mix(in srgb, #ff536f 80%, white);
}

@media (max-width: 640px) {
  .m-popconfirm--left .m-popconfirm__panel,
  .m-popconfirm--right .m-popconfirm__panel {
    inset: calc(100% + 0.56rem) auto auto 50%;
    transform: translateX(-50%);
  }

  .m-popconfirm--left .m-popconfirm__arrow,
  .m-popconfirm--right .m-popconfirm__arrow {
    inset: -0.31rem auto auto 50%;
    transform: translateX(-50%) rotate(45deg);
  }
}
</style>
