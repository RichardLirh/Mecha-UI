<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type TransferKey = string | number;
type TransferDirection = "to-right" | "to-left";

export interface MechaTransferOption {
  key: TransferKey;
  label: string;
  hint?: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: TransferKey[];
    options?: MechaTransferOption[];
    titles?: [string, string];
    disabled?: boolean;
    filterable?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: TransferKey[];
      next: TransferKey[];
      moved: TransferKey[];
      direction: TransferDirection;
    }>;
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    titles: () => ["Available", "Selected"],
    disabled: false,
    filterable: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: TransferKey[]];
  change: [value: TransferKey[]];
  blocked: [value: TransferKey[]];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaTransfer",
  undefined,
  props.ui
);

const leftQuery = ref("");
const rightQuery = ref("");
const checkedLeft = ref<Set<string>>(new Set());
const checkedRight = ref<Set<string>>(new Set());

const tokenOf = (key: TransferKey) => String(key);
const normalizeQuery = (value: string) => value.trim().toLowerCase();

const optionByToken = computed(() => {
  const map = new Map<string, MechaTransferOption>();
  for (const option of props.options) {
    map.set(tokenOf(option.key), option);
  }
  return map;
});

const modelTokenSet = computed(() => new Set(props.modelValue.map(tokenOf)));

const sourceOptions = computed(() =>
  props.options.filter((option) => !modelTokenSet.value.has(tokenOf(option.key)))
);

const targetOptions = computed(() =>
  props.modelValue.map((key) => {
    const option = optionByToken.value.get(tokenOf(key));
    if (option) {
      return option;
    }
    return {
      key,
      label: String(key),
      disabled: false
    } satisfies MechaTransferOption;
  })
);

const filterOptions = (items: MechaTransferOption[], query: string) => {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return items;
  }
  return items.filter((option) =>
    `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(normalized)
  );
};

const visibleSource = computed(() =>
  filterOptions(sourceOptions.value, leftQuery.value)
);

const visibleTarget = computed(() =>
  filterOptions(targetOptions.value, rightQuery.value)
);

const rootClass = computed(() =>
  partClass("root", `m-transfer ${props.disabled ? "is-disabled" : ""}`)
);

const isLeftChecked = (key: TransferKey) =>
  checkedLeft.value.has(tokenOf(key));

const isRightChecked = (key: TransferKey) =>
  checkedRight.value.has(tokenOf(key));

const toggleLeft = (option: MechaTransferOption) => {
  if (props.disabled || option.disabled) {
    return;
  }

  const token = tokenOf(option.key);
  const next = new Set(checkedLeft.value);
  if (next.has(token)) {
    next.delete(token);
  } else {
    next.add(token);
  }
  checkedLeft.value = next;
};

const toggleRight = (option: MechaTransferOption) => {
  if (props.disabled || option.disabled) {
    return;
  }

  const token = tokenOf(option.key);
  const next = new Set(checkedRight.value);
  if (next.has(token)) {
    next.delete(token);
  } else {
    next.add(token);
  }
  checkedRight.value = next;
};

const canMoveRight = computed(() =>
  sourceOptions.value.some(
    (option) => isLeftChecked(option.key) && !option.disabled
  )
);

const canMoveLeft = computed(() =>
  targetOptions.value.some(
    (option) => isRightChecked(option.key) && !option.disabled
  )
);

const commitTransfer = async (
  next: TransferKey[],
  moved: TransferKey[],
  direction: TransferDirection
) => {
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTransfer",
      action: direction,
      payload: {
        current: props.modelValue,
        next,
        moved,
        direction
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

  return true;
};

const moveToTarget = () => {
  if (props.disabled) {
    return;
  }

  const selected = sourceOptions.value
    .filter((option) => isLeftChecked(option.key) && !option.disabled)
    .map((option) => option.key);

  if (!selected.length) {
    return;
  }

  const existingTokens = new Set(props.modelValue.map(tokenOf));
  const moved = selected.filter((key) => !existingTokens.has(tokenOf(key)));
  if (!moved.length) {
    return;
  }

  const next = [...props.modelValue, ...moved];
  void commitTransfer(next, moved, "to-right").then((success) => {
    if (!success) {
      return;
    }
    const movedTokens = new Set(moved.map(tokenOf));
    checkedLeft.value = new Set(
      [...checkedLeft.value].filter((token) => !movedTokens.has(token))
    );
  });
};

const moveToSource = () => {
  if (props.disabled) {
    return;
  }

  const selected = targetOptions.value
    .filter((option) => isRightChecked(option.key) && !option.disabled)
    .map((option) => option.key);

  if (!selected.length) {
    return;
  }

  const selectedTokens = new Set(selected.map(tokenOf));
  const next = props.modelValue.filter((key) => !selectedTokens.has(tokenOf(key)));
  void commitTransfer(next, selected, "to-left").then((success) => {
    if (!success) {
      return;
    }
    checkedRight.value = new Set(
      [...checkedRight.value].filter((token) => !selectedTokens.has(token))
    );
  });
};

watch(
  () => props.options,
  () => {
    const sourceTokens = new Set(sourceOptions.value.map((option) => tokenOf(option.key)));
    const targetTokens = new Set(targetOptions.value.map((option) => tokenOf(option.key)));
    checkedLeft.value = new Set(
      [...checkedLeft.value].filter((token) => sourceTokens.has(token))
    );
    checkedRight.value = new Set(
      [...checkedRight.value].filter((token) => targetTokens.has(token))
    );
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  () => {
    const sourceTokens = new Set(sourceOptions.value.map((option) => tokenOf(option.key)));
    const targetTokens = new Set(targetOptions.value.map((option) => tokenOf(option.key)));
    checkedLeft.value = new Set(
      [...checkedLeft.value].filter((token) => sourceTokens.has(token))
    );
    checkedRight.value = new Set(
      [...checkedRight.value].filter((token) => targetTokens.has(token))
    );
  },
  { deep: true }
);
</script>

<template>
  <div :class="rootClass" v-bind="partAttrs('root')">
    <section
      :class="partClass('panel', 'm-transfer__panel m-transfer__panel--source')"
      v-bind="partAttrs('panel-source')"
    >
      <header
        :class="partClass('header', 'm-transfer__header')"
        v-bind="partAttrs('header-source')"
      >
        <strong>{{ titles[0] }}</strong>
        <span>{{ sourceOptions.length }}</span>
      </header>

      <input
        v-if="filterable"
        v-model="leftQuery"
        type="search"
        placeholder="Filter"
        :disabled="disabled"
        :class="partClass('search', 'm-transfer__search')"
        v-bind="partAttrs('search-source')"
      />

      <ul
        :class="partClass('list', 'm-transfer__list')"
        v-bind="partAttrs('list-source')"
      >
        <li v-if="visibleSource.length === 0" class="m-transfer__empty-row">
          <span
            :class="partClass('empty', 'm-transfer__empty')"
            v-bind="partAttrs('empty-source')"
          >
            No data
          </span>
        </li>

        <li
          v-for="option in visibleSource"
          :key="`left:${String(option.key)}`"
          class="m-transfer__row"
        >
          <button
            type="button"
            :disabled="disabled || option.disabled"
            :class="
              partClass(
                'option',
                `m-transfer__option ${isLeftChecked(option.key) ? 'is-checked' : ''} ${
                  option.disabled ? 'is-disabled' : ''
                }`
              )
            "
            v-bind="partAttrs('option-source', { 'data-key': String(option.key) })"
            @click="toggleLeft(option)"
          >
            <span class="m-transfer__check">{{ isLeftChecked(option.key) ? "x" : "" }}</span>
            <span class="m-transfer__label">{{ option.label }}</span>
            <span v-if="option.hint" class="m-transfer__hint">{{ option.hint }}</span>
          </button>
        </li>
      </ul>
    </section>

    <div
      :class="partClass('actions', 'm-transfer__actions')"
      v-bind="partAttrs('actions')"
    >
      <button
        type="button"
        :disabled="disabled || !canMoveRight"
        :class="partClass('action', 'm-transfer__action')"
        v-bind="partAttrs('action-right')"
        @click="moveToTarget"
      >
        &gt;
      </button>
      <button
        type="button"
        :disabled="disabled || !canMoveLeft"
        :class="partClass('action', 'm-transfer__action')"
        v-bind="partAttrs('action-left')"
        @click="moveToSource"
      >
        &lt;
      </button>
    </div>

    <section
      :class="partClass('panel', 'm-transfer__panel m-transfer__panel--target')"
      v-bind="partAttrs('panel-target')"
    >
      <header
        :class="partClass('header', 'm-transfer__header')"
        v-bind="partAttrs('header-target')"
      >
        <strong>{{ titles[1] }}</strong>
        <span>{{ targetOptions.length }}</span>
      </header>

      <input
        v-if="filterable"
        v-model="rightQuery"
        type="search"
        placeholder="Filter"
        :disabled="disabled"
        :class="partClass('search', 'm-transfer__search')"
        v-bind="partAttrs('search-target')"
      />

      <ul
        :class="partClass('list', 'm-transfer__list')"
        v-bind="partAttrs('list-target')"
      >
        <li v-if="visibleTarget.length === 0" class="m-transfer__empty-row">
          <span
            :class="partClass('empty', 'm-transfer__empty')"
            v-bind="partAttrs('empty-target')"
          >
            No data
          </span>
        </li>

        <li
          v-for="option in visibleTarget"
          :key="`right:${String(option.key)}`"
          class="m-transfer__row"
        >
          <button
            type="button"
            :disabled="disabled || option.disabled"
            :class="
              partClass(
                'option',
                `m-transfer__option ${isRightChecked(option.key) ? 'is-checked' : ''} ${
                  option.disabled ? 'is-disabled' : ''
                }`
              )
            "
            v-bind="partAttrs('option-target', { 'data-key': String(option.key) })"
            @click="toggleRight(option)"
          >
            <span class="m-transfer__check">{{ isRightChecked(option.key) ? "x" : "" }}</span>
            <span class="m-transfer__label">{{ option.label }}</span>
            <span v-if="option.hint" class="m-transfer__hint">{{ option.hint }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style>
.m-transfer {
  display: grid;
  grid-template-columns: minmax(11rem, 1fr) auto minmax(11rem, 1fr);
  gap: 0.62rem;
  inline-size: min(44rem, 100%);
}

.m-transfer.is-disabled {
  opacity: 0.62;
}

.m-transfer__panel {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3c526a);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.06), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 78%, #101925);
  padding: 0.46rem;
  display: grid;
  gap: 0.42rem;
}

.m-transfer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.65rem;
}

.m-transfer__search {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #445d77);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.06);
  color: var(--mecha-text);
  font-family: var(--mecha-font-body);
  font-size: 0.78rem;
  padding: 0.36rem 0.44rem;
}

.m-transfer__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.24rem;
  max-block-size: 13.6rem;
  overflow: auto;
}

.m-transfer__empty-row {
  margin: 0;
}

.m-transfer__empty {
  display: block;
  border-radius: 8px;
  padding: 0.44rem 0.5rem;
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text-muted);
  font-size: 0.74rem;
}

.m-transfer__row {
  margin: 0;
}

.m-transfer__option {
  inline-size: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.03);
  color: var(--mecha-text);
  text-align: left;
  padding: 0.42rem 0.46rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "check label"
    "check hint";
  align-items: center;
  column-gap: 0.4rem;
  row-gap: 0.06rem;
  cursor: pointer;
}

.m-transfer__option:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 36%, #4b657f);
  background: rgb(255 255 255 / 0.08);
}

.m-transfer__option.is-checked {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  background:
    linear-gradient(120deg, rgb(32 214 255 / 0.22), transparent 76%),
    rgb(255 255 255 / 0.08);
}

.m-transfer__option.is-disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.m-transfer__check {
  grid-area: check;
  inline-size: 0.9rem;
  block-size: 0.9rem;
  border-radius: 3px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, #465f77);
  display: grid;
  place-items: center;
  font-size: 0.66rem;
  font-family: "Iosevka Web", "Consolas", monospace;
}

.m-transfer__label {
  grid-area: label;
  font-size: 0.8rem;
}

.m-transfer__hint {
  grid-area: hint;
  font-size: 0.67rem;
  color: var(--mecha-text-muted);
}

.m-transfer__actions {
  display: grid;
  align-content: center;
  gap: 0.38rem;
}

.m-transfer__action {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #49637a);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.08);
  color: var(--mecha-text);
  inline-size: 2rem;
  block-size: 1.8rem;
  cursor: pointer;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
}

.m-transfer__action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
