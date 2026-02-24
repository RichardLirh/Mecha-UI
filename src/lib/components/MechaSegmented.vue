<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type SegmentValue = string | number | boolean;
type SegmentSource = "select" | "keyboard";

export interface MechaSegmentedOption {
  label: string;
  value: SegmentValue;
  hint?: string;
  disabled?: boolean;
}

type MechaSegmentedOptionInput = MechaSegmentedOption | SegmentValue;

const props = withDefaults(
  defineProps<{
    modelValue?: SegmentValue | null;
    options?: MechaSegmentedOptionInput[];
    size?: "sm" | "md" | "lg";
    block?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: SegmentValue | null;
      next: SegmentValue | null;
      option: MechaSegmentedOption;
      source: SegmentSource;
    }>;
  }>(),
  {
    modelValue: null,
    options: () => [],
    size: "md",
    block: false,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: SegmentValue | null];
  change: [value: SegmentValue | null];
  blocked: [value: SegmentValue | null];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaSegmented",
  undefined,
  props.ui
);

const normalizeOption = (
  input: MechaSegmentedOptionInput
): MechaSegmentedOption => {
  if (
    typeof input === "object" &&
    input !== null &&
    "label" in input &&
    "value" in input
  ) {
    return {
      label: String(input.label),
      value: input.value as SegmentValue,
      hint: input.hint,
      disabled: Boolean(input.disabled)
    };
  }

  return {
    label: String(input),
    value: input as SegmentValue,
    hint: undefined,
    disabled: false
  };
};

const normalizedOptions = computed<MechaSegmentedOption[]>(() =>
  props.options.map((option) => normalizeOption(option))
);

const selectedIndex = computed(() =>
  normalizedOptions.value.findIndex((option) => option.value === props.modelValue)
);

const enabledIndices = computed(() =>
  normalizedOptions.value.flatMap((option, index) =>
    option.disabled ? [] : [index]
  )
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-segmented m-segmented--${props.size} ${props.block ? "is-block" : ""} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const commit = async (option: MechaSegmentedOption, source: SegmentSource) => {
  if (props.disabled || option.disabled) {
    return;
  }

  const current = props.modelValue ?? null;
  const next = option.value;
  if (current === next) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaSegmented",
      action: source,
      payload: { current, next, option, source }
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

const onSelect = (option: MechaSegmentedOption) => {
  void commit(option, "select");
};

const selectByIndex = (index: number, source: SegmentSource) => {
  const option = normalizedOptions.value[index];
  if (!option || option.disabled) {
    return;
  }

  void commit(option, source);
};

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled || !enabledIndices.value.length) {
    return;
  }

  const findCurrentPosition = () => {
    const current = selectedIndex.value;
    const position = enabledIndices.value.indexOf(current);
    return position >= 0 ? position : 0;
  };

  if (event.key === "ArrowRight") {
    event.preventDefault();
    const position = findCurrentPosition();
    const next = enabledIndices.value[(position + 1) % enabledIndices.value.length];
    selectByIndex(next, "keyboard");
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const position = findCurrentPosition();
    const prev =
      enabledIndices.value[
        (position - 1 + enabledIndices.value.length) % enabledIndices.value.length
      ];
    selectByIndex(prev, "keyboard");
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    selectByIndex(enabledIndices.value[0], "keyboard");
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    selectByIndex(
      enabledIndices.value[enabledIndices.value.length - 1],
      "keyboard"
    );
  }
};
</script>

<template>
  <div
    role="radiogroup"
    :tabindex="disabled ? -1 : 0"
    :class="rootClass"
    v-bind="partAttrs('root')"
    @keydown="onKeydown"
  >
    <button
      v-for="(option, index) in normalizedOptions"
      :key="`${String(option.value)}:${index}`"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      :disabled="disabled || option.disabled"
      :class="
        partClass(
          'item',
          `m-segmented__item ${modelValue === option.value ? 'is-active' : ''} ${
            option.disabled ? 'is-disabled' : ''
          }`
        )
      "
      v-bind="partAttrs('item', { 'data-index': index, 'data-value': String(option.value) })"
      @click="onSelect(option)"
    >
      <span
        :class="partClass('label', 'm-segmented__label')"
        v-bind="partAttrs('label')"
      >
        {{ option.label }}
      </span>
      <span
        v-if="option.hint"
        :class="partClass('hint', 'm-segmented__hint')"
        v-bind="partAttrs('hint')"
      >
        {{ option.hint }}
      </span>
    </button>
  </div>
</template>

<style>
.m-segmented {
  inline-size: fit-content;
  max-inline-size: 100%;
  display: inline-flex;
  align-items: stretch;
  gap: 0.34rem;
  padding: 0.34rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3f5770);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(178deg, rgb(255 255 255 / 0.07), transparent 44%),
    color-mix(in srgb, var(--mecha-bg-soft) 78%, #0d1725);
}

.m-segmented.is-block {
  inline-size: 100%;
}

.m-segmented.is-disabled {
  opacity: 0.58;
}

.m-segmented:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  outline-offset: 3px;
}

.m-segmented__item {
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.02);
  color: var(--mecha-text);
  min-inline-size: 4rem;
  padding: 0.42rem 0.56rem;
  display: grid;
  justify-items: center;
  gap: 0.08rem;
  cursor: pointer;
  transition:
    border-color var(--mecha-motion-fast) ease,
    background var(--mecha-motion-fast) ease,
    transform var(--mecha-motion-fast) ease;
}

.m-segmented--sm .m-segmented__item {
  min-inline-size: 3.3rem;
  padding: 0.3rem 0.46rem;
}

.m-segmented--lg .m-segmented__item {
  min-inline-size: 4.9rem;
  padding: 0.52rem 0.7rem;
}

.m-segmented.is-block .m-segmented__item {
  flex: 1;
}

.m-segmented__item:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 38%, #4f6881);
  background: rgb(255 255 255 / 0.06);
}

.m-segmented__item.is-active {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 68%, white);
  background:
    linear-gradient(140deg, rgb(32 214 255 / 0.22), transparent 70%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #122030);
  transform: translateY(-1px);
}

.m-segmented__item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.m-segmented__label {
  font-family: var(--mecha-font-display);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.m-segmented__hint {
  font-size: 0.64rem;
  color: var(--mecha-text-muted);
}
</style>
