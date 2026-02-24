<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type CascaderValue = string | number;

export interface MechaCascaderOption {
  label: string;
  value: CascaderValue;
  hint?: string;
  disabled?: boolean;
  children?: MechaCascaderOption[];
}

let cascaderInstanceSeed = 0;

const props = withDefaults(
  defineProps<{
    modelValue?: CascaderValue[];
    options?: MechaCascaderOption[];
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    checkStrictly?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: CascaderValue[];
      next: CascaderValue[];
      option: MechaCascaderOption;
    }>;
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    placeholder: "Select",
    disabled: false,
    clearable: false,
    checkStrictly: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: CascaderValue[]];
  change: [value: CascaderValue[]];
  blocked: [value: CascaderValue[]];
  "open-change": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaCascader",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const activePath = ref<CascaderValue[]>([]);
const instanceId = `m-cascader-${++cascaderInstanceSeed}`;
const panelId = `${instanceId}-panel`;
const optionId = (level: number, index: number) =>
  `${instanceId}-option-${level}-${index}`;

const rootClass = computed(() =>
  partClass(
    "root",
    `m-cascader ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const hasValue = computed(() => props.modelValue.length > 0);

const findByPath = (
  options: MechaCascaderOption[],
  path: CascaderValue[]
): MechaCascaderOption[] => {
  const chain: MechaCascaderOption[] = [];
  let current = options;

  for (const value of path) {
    const found = current.find((option) => option.value === value);
    if (!found) {
      break;
    }
    chain.push(found);
    current = found.children ?? [];
  }

  return chain;
};

const selectedChain = computed(() => findByPath(props.options, props.modelValue));

const displayText = computed(() => {
  if (!selectedChain.value.length) {
    return props.placeholder;
  }

  return selectedChain.value.map((option) => option.label).join(" / ");
});

const columns = computed(() => {
  const result: MechaCascaderOption[][] = [];
  let levelOptions = props.options;
  let level = 0;

  while (levelOptions.length) {
    result.push(levelOptions);
    const activeValue = activePath.value[level];
    const activeOption = levelOptions.find(
      (option) => option.value === activeValue
    );

    if (!activeOption?.children?.length) {
      break;
    }

    levelOptions = activeOption.children;
    level += 1;
  }

  return result;
});

const activeDescendantId = computed(() => {
  const level = columns.value.length - 1;
  if (level < 0) {
    return undefined;
  }

  const levelOptions = columns.value[level] ?? [];
  const index = levelOptions.findIndex(
    (option) => option.value === activePath.value[level]
  );

  if (index < 0) {
    return undefined;
  }

  return optionId(level, index);
});

const getCurrentLevel = () => Math.max(0, columns.value.length - 1);

const findActiveOption = (level: number) => {
  const levelOptions = columns.value[level] ?? [];
  const value = activePath.value[level];
  return levelOptions.find((option) => option.value === value) ?? null;
};

const ensureOpenPath = () => {
  if (props.modelValue.length) {
    activePath.value = [...props.modelValue];
    return;
  }

  const firstRoot = props.options.find((option) => !option.disabled);
  activePath.value = firstRoot ? [firstRoot.value] : [];
};

const setOpen = (next: boolean) => {
  if (isOpen.value === next) {
    return;
  }

  isOpen.value = next;
  emit("open-change", next);

  if (next) {
    ensureOpenPath();
  }
};

const toggleOpen = () => {
  if (props.disabled) {
    return;
  }
  setOpen(!isOpen.value);
};

const commitSelection = async (
  nextPath: CascaderValue[],
  option: MechaCascaderOption
) => {
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaCascader",
      action: "select",
      payload: {
        current: props.modelValue,
        next: nextPath,
        option
      }
    },
    async () => {
      emit("update:modelValue", nextPath);
      emit("change", nextPath);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
  }
};

const onOptionHover = (level: number, option: MechaCascaderOption) => {
  if (props.disabled || option.disabled) {
    return;
  }

  activePath.value = [...activePath.value.slice(0, level), option.value];
};

const onOptionClick = async (level: number, option: MechaCascaderOption) => {
  if (props.disabled || option.disabled) {
    return;
  }

  const nextPath = [...activePath.value.slice(0, level), option.value];
  activePath.value = nextPath;

  const hasChildren = Boolean(option.children?.length);
  const canCommit = props.checkStrictly || !hasChildren;

  if (!canCommit) {
    const firstEnabledChild = option.children?.find((child) => !child.disabled);
    if (firstEnabledChild) {
      activePath.value = [...nextPath, firstEnabledChild.value];
    }
    return;
  }

  await commitSelection(nextPath, option);
  setOpen(false);
};

const clearSelection = async () => {
  if (props.disabled || !props.modelValue.length) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaCascader",
      action: "clear",
      payload: {
        current: props.modelValue,
        next: [],
        option: {
          label: "clear",
          value: "__clear__"
        }
      }
    },
    async () => {
      emit("update:modelValue", []);
      emit("change", []);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
    return;
  }

  activePath.value = [];
};

const moveActiveOption = (direction: 1 | -1) => {
  const level = getCurrentLevel();
  const levelOptions = columns.value[level] ?? [];
  const enabledIndices = levelOptions.flatMap((option, index) =>
    option.disabled ? [] : [index]
  );

  if (!enabledIndices.length) {
    return;
  }

  const currentIndex = levelOptions.findIndex(
    (option) => option.value === activePath.value[level]
  );
  const currentEnabledIndex = enabledIndices.indexOf(currentIndex);

  let nextEnabledPosition = currentEnabledIndex;
  if (nextEnabledPosition < 0) {
    nextEnabledPosition = direction === 1 ? -1 : 0;
  }

  nextEnabledPosition =
    (nextEnabledPosition + direction + enabledIndices.length) %
    enabledIndices.length;

  const nextIndex = enabledIndices[nextEnabledPosition];
  const nextOption = levelOptions[nextIndex];
  if (!nextOption) {
    return;
  }

  activePath.value = [...activePath.value.slice(0, level), nextOption.value];
};

const moveToChildLevel = () => {
  const level = getCurrentLevel();
  const option = findActiveOption(level);
  if (!option || option.disabled || !option.children?.length) {
    return;
  }

  const firstEnabledChild = option.children.find((child) => !child.disabled);
  if (!firstEnabledChild) {
    return;
  }

  activePath.value = [...activePath.value.slice(0, level + 1), firstEnabledChild.value];
};

const moveToParentLevel = () => {
  if (activePath.value.length <= 1) {
    return;
  }
  activePath.value = activePath.value.slice(0, -1);
};

const commitFromKeyboard = () => {
  const level = getCurrentLevel();
  const option = findActiveOption(level);
  if (!option || option.disabled) {
    return;
  }
  void onOptionClick(level, option);
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

    commitFromKeyboard();
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!isOpen.value) {
      setOpen(true);
      return;
    }
    moveActiveOption(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!isOpen.value) {
      setOpen(true);
      return;
    }
    moveActiveOption(-1);
    return;
  }

  if (event.key === "ArrowRight" && isOpen.value) {
    event.preventDefault();
    moveToChildLevel();
    return;
  }

  if (event.key === "ArrowLeft" && isOpen.value) {
    event.preventDefault();
    moveToParentLevel();
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

watch(
  () => props.modelValue,
  (next) => {
    if (!isOpen.value) {
      activePath.value = [...next];
    }
  },
  { deep: true, immediate: true }
);

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
      :aria-controls="panelId"
      :aria-activedescendant="isOpen ? activeDescendantId : undefined"
      :disabled="disabled"
      :class="partClass('trigger', 'm-cascader__trigger')"
      v-bind="partAttrs('trigger')"
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span
        :class="
          partClass(
            'value',
            `m-cascader__value ${hasValue ? 'has-value' : 'is-placeholder'}`
          )
        "
        v-bind="partAttrs('value')"
      >
        {{ displayText }}
      </span>

      <span class="m-cascader__actions">
        <span
          :class="partClass('arrow', 'm-cascader__arrow')"
          v-bind="partAttrs('arrow')"
          aria-hidden="true"
        >
          v
        </span>
      </span>
    </button>

    <button
      v-if="clearable && hasValue && !disabled"
      type="button"
      :class="partClass('clear', 'm-cascader__clear')"
      v-bind="partAttrs('clear')"
      aria-label="clear selection"
      @click.stop="clearSelection"
    >
      x
    </button>

    <div
      v-if="isOpen"
      :id="panelId"
      role="listbox"
      :class="partClass('panel', 'm-cascader__panel')"
      v-bind="partAttrs('panel')"
    >
      <ul
        v-for="(column, level) in columns"
        :key="level"
        :class="partClass('column', 'm-cascader__column')"
        v-bind="partAttrs('column', { 'data-level': level })"
      >
        <li
          v-for="(option, index) in column"
          :key="`${level}:${String(option.value)}:${index}`"
        >
          <button
            :id="optionId(level, index)"
            type="button"
            role="option"
            :aria-selected="activePath[level] === option.value"
            :disabled="option.disabled"
            :class="
              partClass(
                'option',
                `m-cascader__option ${
                  activePath[level] === option.value ? 'is-active' : ''
                } ${option.disabled ? 'is-disabled' : ''}`
              )
            "
            v-bind="
              partAttrs('option', {
                'data-level': level,
                'data-value': String(option.value)
              })
            "
            @mouseenter="onOptionHover(level, option)"
            @click="onOptionClick(level, option)"
          >
            <span
              :class="partClass('option-label', 'm-cascader__option-label')"
              v-bind="partAttrs('option-label')"
            >
              {{ option.label }}
            </span>
            <span
              v-if="option.hint"
              :class="partClass('option-hint', 'm-cascader__option-hint')"
              v-bind="partAttrs('option-hint')"
            >
              {{ option.hint }}
            </span>
            <span
              v-if="option.children?.length"
              :class="partClass('option-arrow', 'm-cascader__option-arrow')"
              v-bind="partAttrs('option-arrow')"
              aria-hidden="true"
            >
              >
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
.m-cascader {
  position: relative;
  display: inline-grid;
  min-inline-size: 16.5rem;
}

.m-cascader.is-disabled {
  opacity: 0.6;
}

.m-cascader__trigger {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #405871);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(178deg, rgb(255 255 255 / 0.08), transparent 40%),
    color-mix(in srgb, var(--mecha-bg-soft) 78%, #101b2a);
  min-block-size: 2.35rem;
  padding: 0.56rem 0.72rem 0.56rem 0.82rem;
  color: var(--mecha-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.76rem;
  cursor: pointer;
}

.m-cascader__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 3px;
}

.m-cascader.is-open .m-cascader__trigger {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 22%, transparent);
}

.m-cascader__value {
  min-inline-size: 0;
  text-align: left;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-cascader__value.is-placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, #9db4cc);
}

.m-cascader__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.m-cascader__clear {
  position: absolute;
  top: 50%;
  right: 1.8rem;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  border: 0;
  inline-size: 1.05rem;
  block-size: 1.05rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.14);
  color: var(--mecha-text);
  cursor: pointer;
  font-size: 0.67rem;
}

.m-cascader__clear:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  outline-offset: 2px;
}

.m-cascader__arrow {
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  transition: transform var(--mecha-motion-base) ease;
}

.m-cascader.is-open .m-cascader__arrow {
  transform: rotate(180deg);
}

.m-cascader__panel {
  position: absolute;
  z-index: 35;
  inset: calc(100% + 0.36rem) 0 auto;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(11.8rem, auto);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #364b62);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-bg-elevated) 84%, #0b1522);
  box-shadow: 0 16px 32px rgb(0 0 0 / 0.5);
  overflow: hidden;
}

.m-cascader__column {
  list-style: none;
  margin: 0;
  padding: 0.32rem;
  min-block-size: 12.5rem;
  border-right: 1px solid rgb(255 255 255 / 0.08);
}

.m-cascader__column:last-child {
  border-right: 0;
}

.m-cascader__option {
  inline-size: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.02);
  color: var(--mecha-text);
  padding: 0.42rem 0.5rem;
  margin-bottom: 0.26rem;
  text-align: left;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "label arrow"
    "hint arrow";
  row-gap: 0.1rem;
  column-gap: 0.45rem;
  cursor: pointer;
}

.m-cascader__option:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 34%, #516a82);
  background: rgb(255 255 255 / 0.07);
}

.m-cascader__option.is-active {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  background:
    linear-gradient(120deg, rgb(32 214 255 / 0.22), transparent 75%),
    rgb(255 255 255 / 0.08);
}

.m-cascader__option.is-disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.m-cascader__option-label {
  grid-area: label;
  font-size: 0.8rem;
}

.m-cascader__option-hint {
  grid-area: hint;
  color: var(--mecha-text-muted);
  font-size: 0.67rem;
}

.m-cascader__option-arrow {
  grid-area: arrow;
  align-self: center;
  color: color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
}
</style>
