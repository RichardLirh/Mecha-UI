<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    label?: string;
    showValue?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{ current: number; next: number }>;
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    label: "",
    showValue: true,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
  change: [value: number];
  blocked: [value: number];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaSlider", undefined, props.ui);

const trackRef = ref<HTMLElement | null>(null);
const dragging = ref(false);

const clamp = (value: number) => Math.min(props.max, Math.max(props.min, value));

const normalize = (value: number) => {
  const span = props.max - props.min || 1;
  return ((clamp(value) - props.min) / span) * 100;
};

const steppedValue = (value: number) => {
  const step = props.step <= 0 ? 1 : props.step;
  const snapped = Math.round((value - props.min) / step) * step + props.min;
  return clamp(Number(snapped.toFixed(6)));
};

const percent = computed(() => normalize(props.modelValue));

const rootClass = computed(() =>
  partClass(
    "root",
    `m-slider ${dragging.value ? "is-dragging" : ""} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const setFromClientX = async (clientX: number, commit = false) => {
  if (!trackRef.value || props.disabled) {
    return;
  }

  const rect = trackRef.value.getBoundingClientRect();
  if (!rect.width) {
    return;
  }

  const raw = props.min + ((clientX - rect.left) / rect.width) * (props.max - props.min);
  const next = steppedValue(raw);

  if (next === props.modelValue) {
    return;
  }

  if (!commit) {
    emit("update:modelValue", next);
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaSlider",
      action: "change",
      payload: { current: props.modelValue, next }
    },
    async () => {
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
  }
};

const onTrackPointerDown = async (event: PointerEvent) => {
  if (props.disabled) {
    return;
  }

  dragging.value = true;
  await setFromClientX(event.clientX);
  window.addEventListener("pointermove", onWindowPointerMove);
  window.addEventListener("pointerup", onWindowPointerUp);
};

const onWindowPointerMove = (event: PointerEvent) => {
  void setFromClientX(event.clientX);
};

const onWindowPointerUp = (event: PointerEvent) => {
  dragging.value = false;
  void setFromClientX(event.clientX, true);
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
};

const onKeyAdjust = (direction: "up" | "down") => {
  if (props.disabled) {
    return;
  }

  const delta = direction === "up" ? props.step : -props.step;
  const next = steppedValue(props.modelValue + delta);
  if (next === props.modelValue) {
    return;
  }

  void runInteraction(
    props.pipeline,
    {
      component: "MechaSlider",
      action: "change",
      payload: { current: props.modelValue, next }
    },
    async () => {
      emit("update:modelValue", next);
      emit("change", next);
    }
  ).then((success) => {
    if (!success) {
      emit("blocked", props.modelValue);
    }
  });
};

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
});
</script>

<template>
  <div :class="rootClass" v-bind="partAttrs('root')">
    <div
      v-if="label || showValue"
      :class="partClass('header', 'm-slider__header')"
      v-bind="partAttrs('header')"
    >
      <span
        v-if="label || $slots.label"
        :class="partClass('label', 'm-slider__label')"
        v-bind="partAttrs('label')"
      >
        <slot name="label">{{ label }}</slot>
      </span>
      <span
        v-if="showValue"
        :class="partClass('value', 'm-slider__value')"
        v-bind="partAttrs('value')"
      >
        {{ modelValue }}
      </span>
    </div>

    <div
      ref="trackRef"
      role="slider"
      tabindex="0"
      :aria-disabled="disabled"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue"
      :class="partClass('track', 'm-slider__track')"
      v-bind="partAttrs('track')"
      @pointerdown="onTrackPointerDown"
      @keydown.left.prevent="onKeyAdjust('down')"
      @keydown.down.prevent="onKeyAdjust('down')"
      @keydown.right.prevent="onKeyAdjust('up')"
      @keydown.up.prevent="onKeyAdjust('up')"
    >
      <span
        :class="partClass('fill', 'm-slider__fill')"
        v-bind="partAttrs('fill')"
        :style="{ width: `${percent}%` }"
      />
      <span
        :class="partClass('thumb', 'm-slider__thumb')"
        v-bind="partAttrs('thumb')"
        :style="{ left: `${percent}%` }"
      />
    </div>
  </div>
</template>

<style>
.m-slider {
  display: grid;
  gap: 0.5rem;
  min-inline-size: 12rem;
}

.m-slider.is-disabled {
  opacity: 0.56;
}

.m-slider__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.m-slider__label,
.m-slider__value {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
}

.m-slider__value {
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
}

.m-slider__track {
  position: relative;
  block-size: 0.6rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #3e5870);
  background: color-mix(in srgb, var(--mecha-bg-soft) 76%, #0e1725);
  cursor: pointer;
}

.m-slider__track:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-slider__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--mecha-accent-cool) 72%, white),
    color-mix(in srgb, var(--mecha-accent) 46%, #2a3d51)
  );
}

.m-slider__thumb {
  position: absolute;
  inset: 50% auto auto;
  transform: translate(-50%, -50%);
  inline-size: 1rem;
  block-size: 1rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
  background:
    radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.7), transparent 40%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--mecha-accent-cool) 76%, white),
      color-mix(in srgb, var(--mecha-accent) 50%, #173549)
    );
  box-shadow:
    0 0 0 2px rgb(8 14 22 / 0.85),
    0 0 12px color-mix(in srgb, var(--mecha-accent-cool) 28%, transparent);
}
</style>
