<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type TimeSelectValue = string | null;

interface TimeSelectOption {
  label: string;
  minutes: number;
  disabled: boolean;
}

let timeSelectInstanceSeed = 0;

const props = withDefaults(
  defineProps<{
    modelValue?: TimeSelectValue;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    start?: string;
    end?: string;
    step?: string;
    minTime?: string | null;
    maxTime?: string | null;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: TimeSelectValue;
      next: TimeSelectValue;
      source: string;
    }>;
  }>(),
  {
    modelValue: null,
    placeholder: "Select time",
    disabled: false,
    clearable: false,
    start: "08:00",
    end: "18:00",
    step: "00:30",
    minTime: null,
    maxTime: null,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: TimeSelectValue];
  change: [value: TimeSelectValue];
  blocked: [value: TimeSelectValue];
  "open-change": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaTimeSelect",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const activeIndex = ref(-1);
const instanceId = `m-time-select-${++timeSelectInstanceSeed}`;
const listboxId = `${instanceId}-listbox`;
const optionId = (index: number) => `${instanceId}-option-${index}`;

const parseClockMinutes = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
};

const parseStepMinutes = (value: string) => {
  const parsed = parseClockMinutes(value);
  if (parsed !== null && parsed > 0) {
    return parsed;
  }
  return 30;
};

const formatMinutes = (minutes: number) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const options = computed<TimeSelectOption[]>(() => {
  const start = parseClockMinutes(props.start);
  const end = parseClockMinutes(props.end);
  if (start === null || end === null || start > end) {
    return [];
  }

  const min = parseClockMinutes(props.minTime);
  const max = parseClockMinutes(props.maxTime);
  const step = Math.max(1, parseStepMinutes(props.step));

  const items: TimeSelectOption[] = [];
  for (let current = start; current <= end; current += step) {
    const disabledByMin = min !== null && current < min;
    const disabledByMax = max !== null && current > max;
    items.push({
      label: formatMinutes(current),
      minutes: current,
      disabled: disabledByMin || disabledByMax
    });
  }

  return items;
});

const enabledIndices = computed(() =>
  options.value.flatMap((option, index) => (option.disabled ? [] : [index]))
);

const selectedOption = computed(() =>
  options.value.find((option) => option.label === props.modelValue)
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-time-select ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const hasValue = computed(() => selectedOption.value !== undefined);

const activeDescendantId = computed(() =>
  isOpen.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined
);

const syncActiveIndex = () => {
  const selectedIndex = options.value.findIndex(
    (option) => option.label === props.modelValue && !option.disabled
  );
  if (selectedIndex >= 0) {
    activeIndex.value = selectedIndex;
    return;
  }
  activeIndex.value = enabledIndices.value[0] ?? -1;
};

const moveActive = (direction: 1 | -1) => {
  if (!enabledIndices.value.length) {
    activeIndex.value = -1;
    return;
  }

  const currentPosition = enabledIndices.value.indexOf(activeIndex.value);
  if (currentPosition < 0) {
    activeIndex.value =
      direction === 1
        ? enabledIndices.value[0]
        : enabledIndices.value[enabledIndices.value.length - 1];
    return;
  }

  const nextPosition =
    (currentPosition + direction + enabledIndices.value.length) %
    enabledIndices.value.length;
  activeIndex.value = enabledIndices.value[nextPosition];
};

const setOpen = (next: boolean) => {
  if (isOpen.value === next) {
    return;
  }

  isOpen.value = next;
  if (next) {
    syncActiveIndex();
  } else {
    activeIndex.value = -1;
  }

  emit("open-change", next);
};

const toggleOpen = () => {
  if (props.disabled) {
    return;
  }
  setOpen(!isOpen.value);
};

const commitValue = async (next: TimeSelectValue, source: string) => {
  if (next === props.modelValue) {
    setOpen(false);
    return true;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTimeSelect",
      action: source,
      payload: {
        current: props.modelValue,
        next,
        source
      }
    },
    async () => {
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
    return false;
  }

  setOpen(false);
  return true;
};

const choose = (index: number) => {
  const option = options.value[index];
  if (!option || option.disabled || props.disabled) {
    return;
  }
  void commitValue(option.label, "select");
};

const clearValue = () => {
  if (!props.clearable || props.disabled || props.modelValue === null) {
    return;
  }
  void commitValue(null, "clear");
};

const setActiveIndex = (index: number) => {
  if (index < 0 || index >= options.value.length) {
    activeIndex.value = -1;
    return;
  }
  if (options.value[index]?.disabled) {
    return;
  }
  activeIndex.value = index;
};

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (event.key === "Escape") {
    setOpen(false);
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!isOpen.value) {
      setOpen(true);
      return;
    }
    if (activeIndex.value >= 0) {
      choose(activeIndex.value);
      return;
    }
    toggleOpen();
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!isOpen.value) {
      setOpen(true);
      return;
    }
    moveActive(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!isOpen.value) {
      setOpen(true);
      return;
    }
    moveActive(-1);
    return;
  }

  if (event.key === "Tab") {
    setOpen(false);
  }
};

const onDocumentPointerDown = (event: PointerEvent) => {
  if (!isOpen.value) {
    return;
  }

  const target = event.target as Node | null;
  if (!target || !rootRef.value?.contains(target)) {
    setOpen(false);
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
  <div ref="rootRef" :class="rootClass" v-bind="partAttrs('root')">
    <button
      type="button"
      role="combobox"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-activedescendant="activeDescendantId"
      :disabled="disabled"
      :class="partClass('trigger', 'm-time-select__trigger')"
      v-bind="partAttrs('trigger')"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span
        :class="
          partClass(
            'value',
            `m-time-select__value ${hasValue ? 'has-value' : 'is-placeholder'}`
          )
        "
        v-bind="partAttrs('value')"
      >
        {{ selectedOption?.label ?? placeholder }}
      </span>
      <span
        :class="partClass('arrow', 'm-time-select__arrow')"
        v-bind="partAttrs('arrow')"
      >
        v
      </span>
    </button>

    <button
      v-if="clearable && hasValue && !disabled"
      type="button"
      :class="partClass('clear', 'm-time-select__clear')"
      v-bind="partAttrs('clear')"
      aria-label="clear selection"
      @click.stop="clearValue"
    >
      x
    </button>

    <ul
      v-if="isOpen"
      :id="listboxId"
      role="listbox"
      :class="partClass('panel', 'm-time-select__panel')"
      v-bind="partAttrs('panel')"
    >
      <li v-if="options.length === 0" class="m-time-select__item">
        <span
          :class="partClass('empty', 'm-time-select__empty')"
          v-bind="partAttrs('empty')"
        >
          Invalid time range
        </span>
      </li>

      <li
        v-for="(option, index) in options"
        :key="option.minutes"
        class="m-time-select__item"
      >
        <button
          :id="optionId(index)"
          type="button"
          role="option"
          :aria-selected="modelValue === option.label"
          :disabled="option.disabled"
          :class="
            partClass(
              'option',
              `m-time-select__option ${modelValue === option.label ? 'is-selected' : ''} ${
                activeIndex === index ? 'is-active' : ''
              } ${option.disabled ? 'is-disabled' : ''}`
            )
          "
          v-bind="partAttrs('option', { 'data-option-value': option.label })"
          @mouseenter="setActiveIndex(index)"
          @click="choose(index)"
        >
          {{ option.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style>
.m-time-select {
  position: relative;
  display: inline-grid;
  min-inline-size: 11rem;
}

.m-time-select.is-disabled {
  opacity: 0.6;
}

.m-time-select__trigger {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #3f5570);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(178deg, rgb(255 255 255 / 0.08), transparent 40%),
    color-mix(in srgb, var(--mecha-bg-soft) 78%, #101a29);
  min-block-size: 2.3rem;
  padding: 0.56rem 0.72rem 0.56rem 0.82rem;
  color: var(--mecha-text);
  font-family: var(--mecha-font-display);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  cursor: pointer;
}

.m-time-select__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-time-select.is-open .m-time-select__trigger {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 24%, transparent);
}

.m-time-select__value.is-placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 92%, #a7bbd2);
}

.m-time-select__arrow {
  transition: transform var(--mecha-motion-base) ease;
  color: color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
}

.m-time-select.is-open .m-time-select__arrow {
  transform: rotate(180deg);
}

.m-time-select__clear {
  position: absolute;
  top: 50%;
  right: 1.9rem;
  transform: translateY(-50%);
  border: 0;
  border-radius: 999px;
  inline-size: 1.05rem;
  block-size: 1.05rem;
  background: rgb(255 255 255 / 0.14);
  color: var(--mecha-text);
  cursor: pointer;
  font-size: 0.67rem;
}

.m-time-select__panel {
  margin: 0;
  padding: 0.36rem;
  list-style: none;
  position: absolute;
  z-index: 30;
  inset: calc(100% + 0.36rem) 0 auto;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #33475c);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 38%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #0c1522);
  box-shadow: 0 14px 28px rgb(0 0 0 / 0.48);
  display: grid;
  gap: 0.28rem;
  max-block-size: 15rem;
  overflow: auto;
}

.m-time-select__item {
  margin: 0;
}

.m-time-select__empty {
  display: block;
  border-radius: 8px;
  padding: 0.44rem 0.52rem;
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text-muted);
  font-size: 0.73rem;
}

.m-time-select__option {
  inline-size: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.02);
  color: var(--mecha-text);
  text-align: left;
  padding: 0.44rem 0.52rem;
  font-family: "Iosevka Web", "Consolas", monospace;
  cursor: pointer;
}

.m-time-select__option:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 36%, #486179);
  background: rgb(255 255 255 / 0.06);
}

.m-time-select__option.is-active {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 58%, #5f7a94);
  background: rgb(255 255 255 / 0.08);
}

.m-time-select__option.is-selected {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
  background:
    linear-gradient(120deg, rgb(32 214 255 / 0.24), transparent 72%),
    rgb(255 255 255 / 0.06);
}

.m-time-select__option.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
