<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

interface MechaSelectOption {
  label: string;
  value: string | number;
  hint?: string;
  disabled?: boolean;
}

let selectInstanceSeed = 0;

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    options?: MechaSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: string | number | null;
      next: string | number | null;
    }>;
  }>(),
  {
    modelValue: null,
    options: () => [],
    placeholder: "Select",
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
  change: [value: string | number | null];
  blocked: [value: string | number | null];
  "open-change": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaSelect",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const activeIndex = ref(-1);
const instanceId = `m-select-${++selectInstanceSeed}`;
const listboxId = `${instanceId}-listbox`;
const optionId = (index: number) => `${instanceId}-option-${index}`;

const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue)
);
const selectedIndex = computed(() =>
  props.options.findIndex((option) => option.value === props.modelValue)
);

const hasValue = computed(() => selectedOption.value !== undefined);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-select ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const enabledIndices = computed(() =>
  props.options.flatMap((option, index) => (option.disabled ? [] : [index]))
);

const setActiveIndex = (index: number) => {
  if (index < 0 || index >= props.options.length) {
    activeIndex.value = -1;
    return;
  }

  if (props.options[index]?.disabled) {
    return;
  }

  activeIndex.value = index;
};

const syncActiveIndexFromValue = () => {
  if (
    selectedIndex.value >= 0 &&
    !props.options[selectedIndex.value]?.disabled
  ) {
    activeIndex.value = selectedIndex.value;
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
    syncActiveIndexFromValue();
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

const choose = async (option: MechaSelectOption) => {
  if (props.disabled || option.disabled) {
    return;
  }

  const next = option.value;
  if (props.modelValue === next) {
    setOpen(false);
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaSelect",
      action: "select",
      payload: { current: props.modelValue, next }
    },
    async () => {
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
    return;
  }

  setOpen(false);
};

const chooseByIndex = (index: number) => {
  const option = props.options[index];
  if (!option) {
    return;
  }
  void choose(option);
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
      chooseByIndex(activeIndex.value);
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

  if (event.key === "Home" && isOpen.value) {
    event.preventDefault();
    activeIndex.value = enabledIndices.value[0] ?? -1;
    return;
  }

  if (event.key === "End" && isOpen.value) {
    event.preventDefault();
    activeIndex.value =
      enabledIndices.value[enabledIndices.value.length - 1] ?? -1;
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
      :aria-activedescendant="
        isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined
      "
      :disabled="disabled"
      :class="partClass('trigger', 'm-select__trigger')"
      v-bind="partAttrs('trigger')"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span
        :class="
          partClass(
            'value',
            `m-select__value ${hasValue ? 'has-value' : 'is-placeholder'}`
          )
        "
        v-bind="partAttrs('value')"
      >
        {{ selectedOption?.label ?? placeholder }}
      </span>
      <span
        :class="partClass('arrow', 'm-select__arrow')"
        v-bind="partAttrs('arrow')"
        aria-hidden="true"
      >
        v
      </span>
    </button>

    <ul
      v-if="isOpen"
      :id="listboxId"
      role="listbox"
      :class="partClass('panel', 'm-select__panel')"
      v-bind="partAttrs('panel')"
    >
      <li
        v-for="(option, index) in options"
        :key="`${String(option.value)}:${index}`"
        class="m-select__item"
      >
        <button
          :id="optionId(index)"
          type="button"
          role="option"
          :aria-selected="modelValue === option.value"
          :disabled="option.disabled"
          :class="
            partClass(
              'option',
              `m-select__option ${modelValue === option.value ? 'is-selected' : ''} ${
                activeIndex === index ? 'is-active' : ''
              } ${option.disabled ? 'is-disabled' : ''}`
            )
          "
          v-bind="partAttrs('option', { 'data-option-value': String(option.value) })"
          @mouseenter="setActiveIndex(index)"
          @click="choose(option)"
        >
          <span
            :class="partClass('option-label', 'm-select__option-label')"
            v-bind="partAttrs('option-label')"
          >
            {{ option.label }}
          </span>
          <span
            v-if="option.hint"
            :class="partClass('option-hint', 'm-select__option-hint')"
            v-bind="partAttrs('option-hint')"
          >
            {{ option.hint }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style>
.m-select {
  position: relative;
  display: inline-grid;
  min-inline-size: 11.4rem;
}

.m-select.is-disabled {
  opacity: 0.56;
}

.m-select__trigger {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #3f5570);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(176deg, rgb(255 255 255 / 0.12), transparent 36%),
    color-mix(in srgb, var(--mecha-panel-soft) 80%, #101a29);
  clip-path: polygon(
    0 10px,
    10px 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
  min-block-size: 2.3rem;
  padding: 0.56rem 0.72rem 0.56rem 0.82rem;
  color: var(--mecha-text);
  font-family: var(--mecha-font-display);
  font-size: 0.76rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  overflow: clip;
  cursor: pointer;
  transition:
    transform var(--mecha-motion-fast) var(--mecha-ease-out),
    border-color var(--mecha-motion-base) var(--mecha-ease-out),
    box-shadow var(--mecha-motion-base) var(--mecha-ease-out);
}

.m-select__trigger::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    118deg,
    transparent 18%,
    rgb(255 255 255 / 0.24) 36%,
    transparent 50%
  );
  background-size: 210% 100%;
  opacity: 0.24;
  transform: translateX(-14%);
  transition:
    opacity var(--mecha-motion-base) var(--mecha-ease-out),
    transform var(--mecha-motion-base) var(--mecha-ease-out);
}

.m-select__trigger:disabled {
  cursor: not-allowed;
}

.m-select__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  outline-offset: 3px;
}

.m-select.is-open .m-select__trigger {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.1) inset,
    0 10px 24px rgb(2 8 18 / 0.4),
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 24%, transparent);
}

.m-select.is-open .m-select__trigger::before {
  opacity: 0.42;
  transform: translateX(12%);
}

.m-select__value.is-placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 92%, #a9bfd6);
}

.m-select__arrow {
  font-size: 0.7rem;
  line-height: 1;
  transition: transform var(--mecha-motion-base) ease;
  color: color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
}

.m-select.is-open .m-select__arrow {
  transform: rotate(180deg);
}

.m-select__panel {
  margin: 0;
  padding: 0.4rem;
  list-style: none;
  position: absolute;
  z-index: 30;
  inset: calc(100% + 0.4rem) 0 auto;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #33475c);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.1), transparent 38%),
    color-mix(in srgb, var(--mecha-bg-elevated) 84%, #0c1522);
  box-shadow:
    var(--mecha-shadow-float),
    0 0 0 1px rgb(255 255 255 / 0.05) inset;
  display: grid;
  gap: 0.3rem;
  max-block-size: 15rem;
  overflow: auto;
  animation: mecha-select-pop var(--mecha-motion-base) var(--mecha-ease-out) both;
}

.m-select__item {
  margin: 0;
}

.m-select__option {
  position: relative;
  inline-size: 100%;
  border: 1px solid color-mix(in srgb, var(--mecha-border) 42%, transparent);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.03);
  color: var(--mecha-text);
  text-align: left;
  display: grid;
  gap: 0.08rem;
  padding: 0.48rem 0.58rem;
  font-family: var(--mecha-font-body);
  line-height: 1.35;
  cursor: pointer;
  transition:
    border-color var(--mecha-motion-fast) ease,
    transform var(--mecha-motion-fast) ease,
    background var(--mecha-motion-fast) ease;
}

.m-select__option::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  inline-size: 2px;
  background: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  opacity: 0;
  transition: opacity var(--mecha-motion-fast) ease;
}

.m-select__option:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 42%, #486179);
  background: rgb(255 255 255 / 0.07);
  transform: translateX(1px);
}

.m-select__option.is-active {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 58%, #5f7a94);
  background: rgb(255 255 255 / 0.08);
}

.m-select__option.is-active::before {
  opacity: 0.72;
}

.m-select__option.is-selected {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
  background:
    linear-gradient(116deg, rgb(32 214 255 / 0.26), transparent 72%),
    rgb(255 255 255 / 0.08);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--mecha-accent-cool) 24%, transparent) inset;
}

.m-select__option.is-selected::before {
  opacity: 1;
}

.m-select__option.is-disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.m-select__option-label {
  font-size: 0.82rem;
}

.m-select__option-hint {
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 88%, #bdd1e5);
}

@keyframes mecha-select-pop {
  0% {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-select__trigger,
  .m-select__trigger::before,
  .m-select__option,
  .m-select__option::before,
  .m-select__panel {
    transition: none !important;
    animation: none !important;
  }
}
</style>
