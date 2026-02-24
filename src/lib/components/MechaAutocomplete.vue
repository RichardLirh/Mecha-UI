<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch
} from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

defineOptions({ inheritAttrs: false });

export interface MechaAutocompleteOption {
  label: string;
  value?: string | number;
  hint?: string;
  disabled?: boolean;
}

type MechaAutocompleteOptionLike = string | MechaAutocompleteOption;
type MechaAutocompleteSource = "input" | "select" | "clear";

interface NormalizedAutocompleteOption {
  label: string;
  value: string | number;
  hint?: string;
  disabled?: boolean;
}

let autocompleteInstanceSeed = 0;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    options?: MechaAutocompleteOptionLike[];
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    triggerOnFocus?: boolean;
    maxSuggestions?: number;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: string;
      next: string;
      source: MechaAutocompleteSource;
    }>;
  }>(),
  {
    modelValue: "",
    options: () => [],
    placeholder: "Search command",
    disabled: false,
    clearable: false,
    triggerOnFocus: true,
    maxSuggestions: 8,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
  select: [option: NormalizedAutocompleteOption];
  search: [value: string];
  blocked: [value: string];
  "open-change": [value: boolean];
}>();

const attrs = useAttrs();
const { partClass, partAttrs } = useMechaComponent(
  "MechaAutocomplete",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const fieldRef = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);
const activeIndex = ref(-1);
const draftValue = ref(props.modelValue);

const instanceId = `m-autocomplete-${++autocompleteInstanceSeed}`;
const listboxId = `${instanceId}-listbox`;
const optionId = (index: number) => `${instanceId}-option-${index}`;

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const normalizedOptions = computed<NormalizedAutocompleteOption[]>(() =>
  props.options.map((option) => {
    if (typeof option === "string") {
      return {
        label: option,
        value: option
      };
    }

    return {
      label: option.label,
      value: option.value ?? option.label,
      hint: option.hint,
      disabled: option.disabled
    };
  })
);

const normalizedQuery = computed(() => draftValue.value.trim().toLowerCase());

const filteredOptions = computed(() => {
  const query = normalizedQuery.value;

  const matches = normalizedOptions.value.filter((option) => {
    if (!query) {
      return true;
    }

    const haystack = `${option.label} ${String(option.value)} ${option.hint ?? ""}`
      .trim()
      .toLowerCase();
    return haystack.includes(query);
  });

  if (props.maxSuggestions <= 0) {
    return [];
  }

  return matches.slice(0, props.maxSuggestions);
});

const enabledIndices = computed(() =>
  filteredOptions.value.flatMap((option, index) =>
    option.disabled ? [] : [index]
  )
);

const activeDescendantId = computed(() =>
  isOpen.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined
);

const showClear = computed(
  () => props.clearable && !props.disabled && draftValue.value.length > 0
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-autocomplete ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const setActiveIndex = (index: number) => {
  if (index < 0 || index >= filteredOptions.value.length) {
    activeIndex.value = -1;
    return;
  }

  if (filteredOptions.value[index]?.disabled) {
    return;
  }

  activeIndex.value = index;
};

const syncActiveIndex = () => {
  if (!filteredOptions.value.length) {
    activeIndex.value = -1;
    return;
  }

  const exactMatchIndex = filteredOptions.value.findIndex((option) => {
    if (option.disabled) {
      return false;
    }

    const query = normalizedQuery.value;
    return (
      option.label.toLowerCase() === query ||
      String(option.value).toLowerCase() === query
    );
  });

  if (exactMatchIndex >= 0) {
    activeIndex.value = exactMatchIndex;
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
  const resolved = props.disabled ? false : next;
  if (isOpen.value === resolved) {
    return;
  }

  isOpen.value = resolved;

  if (resolved) {
    syncActiveIndex();
  } else {
    activeIndex.value = -1;
  }

  emit("open-change", resolved);
};

const focusField = () => {
  if (props.disabled) {
    return;
  }

  fieldRef.value?.focus();
};

const toggleOpen = () => {
  if (props.disabled) {
    return;
  }

  const next = !isOpen.value;
  setOpen(next);

  if (next) {
    fieldRef.value?.focus();
  }
};

const commitValue = async (
  next: string,
  source: MechaAutocompleteSource,
  current: string,
  option?: NormalizedAutocompleteOption
) => {
  if (current === next) {
    draftValue.value = next;
    if (source === "select" && option) {
      emit("select", option);
    }
    return true;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaAutocomplete",
      action: source,
      payload: {
        current,
        next,
        source
      }
    },
    async () => {
      draftValue.value = next;
      emit("update:modelValue", next);
      emit("change", next);
      if (source === "select" && option) {
        emit("select", option);
      }
    }
  );

  if (!success) {
    draftValue.value = current;
    emit("blocked", current);
    return false;
  }

  return true;
};

const choose = async (option: NormalizedAutocompleteOption) => {
  if (props.disabled || option.disabled) {
    return;
  }

  const current = draftValue.value;
  const next = String(option.value);
  const success = await commitValue(next, "select", current, option);
  emit("search", success ? next : current);

  if (!success) {
    return;
  }

  setOpen(false);
};

const chooseByIndex = (index: number) => {
  const option = filteredOptions.value[index];
  if (!option) {
    return;
  }

  void choose(option);
};

const clearValue = async () => {
  if (!showClear.value) {
    return;
  }

  const current = draftValue.value;
  const success = await commitValue("", "clear", current);
  emit("search", success ? "" : current);

  if (!success) {
    return;
  }

  setOpen(false);
  fieldRef.value?.focus();
};

const onFieldFocus = () => {
  if (props.disabled) {
    return;
  }

  emit("search", draftValue.value);
  if (props.triggerOnFocus || draftValue.value.length > 0) {
    setOpen(true);
  }
};

const onFieldInput = async (event: Event) => {
  if (props.disabled) {
    return;
  }

  const target = event.target as HTMLInputElement;
  const current = draftValue.value;
  const next = target.value;

  draftValue.value = next;
  const success = await commitValue(next, "input", current);
  emit("search", success ? next : current);

  if (!success) {
    target.value = draftValue.value;
    return;
  }

  if (next.length > 0 || props.triggerOnFocus) {
    setOpen(true);
    return;
  }

  setOpen(false);
};

const onFieldKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (event.key === "Escape") {
    setOpen(false);
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

  if (event.key === "Enter" && isOpen.value) {
    if (activeIndex.value < 0) {
      return;
    }

    event.preventDefault();
    chooseByIndex(activeIndex.value);
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

const isOptionSelected = (option: NormalizedAutocompleteOption) =>
  draftValue.value === String(option.value);

watch(
  () => props.modelValue,
  (next) => {
    draftValue.value = next;
    if (isOpen.value) {
      syncActiveIndex();
    }
  }
);

watch(filteredOptions, () => {
  if (!isOpen.value) {
    return;
  }

  if (!filteredOptions.value.length) {
    activeIndex.value = -1;
    return;
  }

  if (
    activeIndex.value < 0 ||
    activeIndex.value >= filteredOptions.value.length ||
    filteredOptions.value[activeIndex.value]?.disabled
  ) {
    syncActiveIndex();
  }
});

watch(
  () => props.disabled,
  (next) => {
    if (next) {
      setOpen(false);
    }
  }
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
    <div
      :class="partClass('frame', 'm-autocomplete__frame')"
      v-bind="partAttrs('frame')"
      @click="focusField"
    >
      <input
        ref="fieldRef"
        :value="draftValue"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendantId"
        :disabled="disabled"
        :placeholder="placeholder"
        :class="partClass('field', 'm-autocomplete__field')"
        v-bind="partAttrs('field', inputAttrs as Record<string, unknown>)"
        @focus="onFieldFocus"
        @input="onFieldInput"
        @keydown="onFieldKeydown"
      />

      <span
        :class="partClass('actions', 'm-autocomplete__actions')"
        v-bind="partAttrs('actions')"
      >
        <button
          v-if="showClear"
          type="button"
          :class="partClass('clear', 'm-autocomplete__clear')"
          v-bind="partAttrs('clear')"
          aria-label="clear input"
          @click.stop="clearValue"
        >
          x
        </button>

        <button
          type="button"
          :disabled="disabled"
          :class="partClass('toggle', 'm-autocomplete__toggle')"
          v-bind="partAttrs('toggle')"
          aria-label="toggle suggestions"
          @click.stop="toggleOpen"
        >
          v
        </button>
      </span>
    </div>

    <ul
      v-if="isOpen"
      :id="listboxId"
      role="listbox"
      :class="partClass('panel', 'm-autocomplete__panel')"
      v-bind="partAttrs('panel')"
    >
      <li v-if="filteredOptions.length === 0" class="m-autocomplete__empty-item">
        <span
          :class="partClass('empty', 'm-autocomplete__empty')"
          v-bind="partAttrs('empty')"
        >
          No matches
        </span>
      </li>

      <li
        v-for="(option, index) in filteredOptions"
        :key="`${String(option.value)}:${index}`"
        class="m-autocomplete__item"
      >
        <button
          :id="optionId(index)"
          type="button"
          role="option"
          :aria-selected="activeIndex === index"
          :disabled="option.disabled"
          :class="
            partClass(
              'option',
              `m-autocomplete__option ${activeIndex === index ? 'is-active' : ''} ${
                isOptionSelected(option) ? 'is-selected' : ''
              } ${option.disabled ? 'is-disabled' : ''}`
            )
          "
          v-bind="partAttrs('option', { 'data-option-value': String(option.value) })"
          @mouseenter="setActiveIndex(index)"
          @mousedown.prevent
          @click="choose(option)"
        >
          <span
            :class="partClass('option-label', 'm-autocomplete__option-label')"
            v-bind="partAttrs('option-label')"
          >
            {{ option.label }}
          </span>
          <span
            v-if="option.hint"
            :class="partClass('option-hint', 'm-autocomplete__option-hint')"
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
.m-autocomplete {
  position: relative;
  display: inline-grid;
  min-inline-size: 15rem;
}

.m-autocomplete.is-disabled {
  opacity: 0.6;
}

.m-autocomplete__frame {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #334b62);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.06), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 72%, #0f1824);
  padding: 0.4rem 0.5rem 0.4rem 0.68rem;
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.m-autocomplete__frame:focus-within {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.06) inset,
    0 0 18px color-mix(in srgb, var(--mecha-accent-cool) 30%, transparent);
}

.m-autocomplete__field {
  flex: 1;
  min-inline-size: 0;
  border: 0;
  background: transparent;
  color: var(--mecha-text);
  font-family: var(--mecha-font-body);
  font-size: 0.92rem;
  line-height: 1.25;
}

.m-autocomplete__field::placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 84%, #7f96b1);
}

.m-autocomplete__field:focus {
  outline: none;
}

.m-autocomplete__field:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 68%, white);
  outline-offset: 2px;
}

.m-autocomplete__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
}

.m-autocomplete__clear,
.m-autocomplete__toggle {
  inline-size: 1.1rem;
  block-size: 1.1rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  background: rgb(255 255 255 / 0.08);
  font-size: 0.66rem;
  transition: background var(--mecha-motion-base) ease;
}

.m-autocomplete__clear:hover,
.m-autocomplete__toggle:hover {
  background: rgb(255 255 255 / 0.16);
}

.m-autocomplete__toggle:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.m-autocomplete__panel {
  margin: 0;
  padding: 0.34rem;
  list-style: none;
  position: absolute;
  z-index: 32;
  inset: calc(100% + 0.34rem) 0 auto;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #34495f);
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

.m-autocomplete__empty-item {
  margin: 0;
}

.m-autocomplete__empty {
  display: block;
  padding: 0.46rem 0.52rem;
  border-radius: 8px;
  font-size: 0.75rem;
  color: var(--mecha-text-muted);
  background: rgb(255 255 255 / 0.04);
}

.m-autocomplete__item {
  margin: 0;
}

.m-autocomplete__option {
  inline-size: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.02);
  color: var(--mecha-text);
  text-align: left;
  display: grid;
  gap: 0.08rem;
  padding: 0.44rem 0.52rem;
  font-family: var(--mecha-font-body);
  cursor: pointer;
}

.m-autocomplete__option:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 36%, #486179);
  background: rgb(255 255 255 / 0.06);
}

.m-autocomplete__option.is-active {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 56%, #5f7a94);
  background: rgb(255 255 255 / 0.08);
}

.m-autocomplete__option.is-selected {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
  background:
    linear-gradient(120deg, rgb(32 214 255 / 0.2), transparent 74%),
    rgb(255 255 255 / 0.07);
}

.m-autocomplete__option.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.m-autocomplete__option-label {
  font-size: 0.81rem;
}

.m-autocomplete__option-hint {
  font-size: 0.67rem;
  color: var(--mecha-text-muted);
}
</style>
