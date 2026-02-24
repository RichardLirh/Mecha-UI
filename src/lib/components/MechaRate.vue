<script setup lang="ts">
import { computed, ref } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type MechaRateSource = "select" | "keyboard" | "clear";

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    max?: number;
    allowHalf?: boolean;
    clearable?: boolean;
    showScore?: boolean;
    size?: number | string;
    label?: string;
    disabled?: boolean;
    readonly?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: number;
      next: number;
      source: MechaRateSource;
    }>;
  }>(),
  {
    modelValue: 0,
    max: 5,
    allowHalf: false,
    clearable: false,
    showScore: false,
    size: 24,
    label: "",
    disabled: false,
    readonly: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
  change: [value: number];
  hover: [value: number];
  blocked: [value: number];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaRate", undefined, props.ui);
const hoverValue = ref<number | null>(null);

const normalizedMax = computed(() => Math.max(1, Math.floor(props.max)));
const stepSize = computed(() => (props.allowHalf ? 0.5 : 1));
const interactive = computed(() => !props.disabled && !props.readonly);

const clamp = (value: number) =>
  Math.min(normalizedMax.value, Math.max(0, value));

const normalize = (value: number) => {
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(clamp(safe) / stepSize.value) * stepSize.value;
  return clamp(Number(rounded.toFixed(1)));
};

const currentValue = computed(() => normalize(props.modelValue));
const displayValue = computed(() =>
  hoverValue.value === null ? currentValue.value : hoverValue.value
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-rate ${interactive.value ? "is-interactive" : "is-static"} ${
      props.disabled ? "is-disabled" : ""
    } ${props.readonly ? "is-readonly" : ""}`
  )
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-rate-size":
    typeof props.size === "number" ? `${props.size}px` : String(props.size)
}));

const formatValue = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const scoreText = computed(
  () => `${formatValue(currentValue.value)} / ${normalizedMax.value}`
);

const resolvePointerValue = (event: MouseEvent, index: number) => {
  if (!props.allowHalf) {
    return index;
  }

  const target = event.currentTarget as HTMLElement | null;
  if (!target) {
    return index;
  }

  const rect = target.getBoundingClientRect();
  if (!rect.width) {
    return index;
  }

  const offset = event.clientX - rect.left;
  return offset <= rect.width / 2 ? index - 0.5 : index;
};

const fillPercent = (index: number) => {
  const delta = displayValue.value - (index - 1);
  if (delta <= 0) {
    return 0;
  }
  if (delta >= 1) {
    return 100;
  }
  return Math.round(delta * 100);
};

const commitValue = async (nextRaw: number, source: MechaRateSource) => {
  if (!interactive.value) {
    return;
  }

  const current = currentValue.value;
  let next = normalize(nextRaw);
  let actionSource = source;

  if (source === "select" && props.clearable && next === current) {
    next = 0;
    actionSource = "clear";
  }

  if (next === current) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaRate",
      action: actionSource,
      payload: { current, next, source: actionSource }
    },
    async () => {
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", current);
  }
};

const onItemMove = (event: MouseEvent, index: number) => {
  if (!interactive.value) {
    return;
  }

  const next = normalize(resolvePointerValue(event, index));
  if (hoverValue.value === next) {
    return;
  }

  hoverValue.value = next;
  emit("hover", next);
};

const onItemClick = (event: MouseEvent, index: number) => {
  if (!interactive.value) {
    return;
  }

  const next = normalize(resolvePointerValue(event, index));
  void commitValue(next, "select");
};

const resetHover = () => {
  if (hoverValue.value === null) {
    return;
  }

  hoverValue.value = null;
  emit("hover", currentValue.value);
};

const onKeydown = (event: KeyboardEvent) => {
  if (!interactive.value) {
    return;
  }

  if (
    event.key === "ArrowRight" ||
    event.key === "ArrowUp" ||
    event.key === "Right" ||
    event.key === "Up"
  ) {
    event.preventDefault();
    void commitValue(currentValue.value + stepSize.value, "keyboard");
    return;
  }

  if (
    event.key === "ArrowLeft" ||
    event.key === "ArrowDown" ||
    event.key === "Left" ||
    event.key === "Down"
  ) {
    event.preventDefault();
    void commitValue(currentValue.value - stepSize.value, "keyboard");
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    void commitValue(0, "keyboard");
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    void commitValue(normalizedMax.value, "keyboard");
    return;
  }

  if ((event.key === "Backspace" || event.key === "Delete") && props.clearable) {
    event.preventDefault();
    void commitValue(0, "clear");
  }
};
</script>

<template>
  <div
    role="slider"
    :aria-label="label || 'rate'"
    :aria-disabled="!interactive"
    aria-valuemin="0"
    :aria-valuemax="normalizedMax"
    :aria-valuenow="currentValue"
    :aria-valuetext="scoreText"
    :tabindex="interactive ? 0 : -1"
    :class="rootClass"
    :style="rootStyle"
    v-bind="partAttrs('root')"
    @keydown="onKeydown"
    @mouseleave="resetHover"
  >
    <button
      v-for="index in normalizedMax"
      :key="index"
      type="button"
      tabindex="-1"
      :disabled="disabled"
      :aria-label="`${index}`"
      :class="
        partClass(
          'item',
          `m-rate__item ${fillPercent(index) > 0 ? 'is-active' : 'is-idle'}`
        )
      "
      v-bind="partAttrs('item', { 'data-index': index })"
      @mousemove="onItemMove($event, index)"
      @focus="hoverValue = index"
      @blur="resetHover"
      @click="onItemClick($event, index)"
    >
      <span
        :class="partClass('glyph', 'm-rate__glyph')"
        v-bind="partAttrs('glyph')"
      >
        <svg
          viewBox="0 0 24 24"
          :class="partClass('icon-base', 'm-rate__icon m-rate__icon--base')"
          v-bind="partAttrs('icon-base')"
          aria-hidden="true"
        >
          <path
            d="M12 2.4l2.84 5.76 6.36.92-4.6 4.48 1.08 6.33L12 16.96 6.32 19.9l1.08-6.33-4.6-4.48 6.36-.92L12 2.4Z"
          />
        </svg>

        <span
          :class="partClass('fill', 'm-rate__fill')"
          v-bind="partAttrs('fill')"
          :style="{ width: `${fillPercent(index)}%` }"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            :class="partClass('icon-fill', 'm-rate__icon m-rate__icon--fill')"
            v-bind="partAttrs('icon-fill')"
          >
            <path
              d="M12 2.4l2.84 5.76 6.36.92-4.6 4.48 1.08 6.33L12 16.96 6.32 19.9l1.08-6.33-4.6-4.48 6.36-.92L12 2.4Z"
            />
          </svg>
        </span>
      </span>
    </button>

    <span
      v-if="showScore"
      :class="partClass('score', 'm-rate__score')"
      v-bind="partAttrs('score')"
    >
      {{ scoreText }}
    </span>
  </div>
</template>

<style>
.m-rate {
  --m-rate-size: 24px;
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  color: var(--mecha-text);
}

.m-rate.is-disabled {
  opacity: 0.55;
}

.m-rate:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 4px;
}

.m-rate__item {
  position: relative;
  inline-size: var(--m-rate-size);
  block-size: var(--m-rate-size);
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.m-rate.is-static .m-rate__item {
  cursor: default;
}

.m-rate__glyph {
  position: relative;
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

.m-rate__icon {
  inline-size: 100%;
  block-size: 100%;
}

.m-rate__icon path {
  vector-effect: non-scaling-stroke;
}

.m-rate__icon--base {
  color: color-mix(in srgb, var(--mecha-text-muted) 82%, #5a7089);
  filter: drop-shadow(0 0 4px rgb(0 0 0 / 0.45));
}

.m-rate__icon--base path {
  fill: rgb(255 255 255 / 0.08);
  stroke: currentColor;
  stroke-width: 1.35;
}

.m-rate__fill {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  transition: width var(--mecha-motion-base) ease;
}

.m-rate__icon--fill path {
  fill: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  stroke: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  stroke-width: 1.25;
}

.m-rate__item.is-active .m-rate__icon--fill {
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--mecha-accent-cool) 36%, transparent));
}

.m-rate__score {
  margin-inline-start: 0.4rem;
  font-family: var(--mecha-font-display);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}
</style>
