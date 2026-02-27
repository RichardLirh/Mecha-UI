<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";
import MechaTree from "./MechaTree.vue";
import type { MechaTreeKey, MechaTreeNode } from "./MechaTree.vue";

type TreeSelectSource = "select" | "clear";

const props = withDefaults(
  defineProps<{
    modelValue?: MechaTreeKey | null;
    data?: MechaTreeNode[];
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    filterable?: boolean;
    expandedKeys?: MechaTreeKey[];
    defaultExpandedKeys?: MechaTreeKey[];
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: MechaTreeKey | null;
      next: MechaTreeKey | null;
      source: TreeSelectSource;
    }>;
  }>(),
  {
    modelValue: null,
    data: () => [],
    placeholder: "Select node",
    disabled: false,
    clearable: false,
    filterable: false,
    expandedKeys: () => [],
    defaultExpandedKeys: () => [],
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: MechaTreeKey | null];
  change: [value: MechaTreeKey | null];
  blocked: [value: MechaTreeKey | null];
  "open-change": [value: boolean];
  "update:expandedKeys": [value: MechaTreeKey[]];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaTreeSelect",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const query = ref("");
const localExpanded = ref<MechaTreeKey[]>(
  props.expandedKeys.length ? [...props.expandedKeys] : [...props.defaultExpandedKeys]
);

watch(
  () => props.expandedKeys,
  (next) => {
    localExpanded.value = [...next];
  },
  { deep: true }
);

const setOpen = (next: boolean) => {
  if (isOpen.value === next) {
    return;
  }

  isOpen.value = next;
  emit("open-change", next);
};

const keyToken = (key: MechaTreeKey) => `${typeof key}:${String(key)}`;

const findNodeLabel = (
  nodes: MechaTreeNode[],
  key: MechaTreeKey | null | undefined
): string => {
  if (key === null || key === undefined) {
    return "";
  }

  const target = keyToken(key);
  const stack = [...nodes];

  while (stack.length) {
    const node = stack.shift()!;
    const nodeKey = node.key;
    if (nodeKey !== undefined && keyToken(nodeKey) === target) {
      return node.label;
    }

    if (node.children?.length) {
      stack.unshift(...node.children);
    }
  }

  return "";
};

const selectedLabel = computed(() =>
  findNodeLabel(props.data, props.modelValue ?? null)
);

const normalizeText = (value: string) => value.trim().toLowerCase();

const filterNodes = (nodes: MechaTreeNode[], term: string): MechaTreeNode[] => {
  const next: MechaTreeNode[] = [];
  const normalizedTerm = normalizeText(term);

  for (const node of nodes) {
    const children = filterNodes(node.children ?? [], normalizedTerm);
    const labelHit = normalizeText(node.label).includes(normalizedTerm);
    const hintHit = normalizeText(node.hint ?? "").includes(normalizedTerm);

    if (labelHit || hintHit || children.length) {
      next.push({
        ...node,
        children
      });
    }
  }

  return next;
};

const displayData = computed(() => {
  if (!props.filterable || !query.value.trim()) {
    return props.data;
  }

  return filterNodes(props.data, query.value);
});

const hasValue = computed(() => props.modelValue !== null && props.modelValue !== undefined);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-tree-select ${isOpen.value ? "is-open" : "is-closed"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const commit = async (next: MechaTreeKey | null, source: TreeSelectSource) => {
  if (props.disabled) {
    return;
  }

  const current = props.modelValue ?? null;
  if (current === next) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTreeSelect",
      action: source,
      payload: { current, next, source }
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

const onSelect = (value: MechaTreeKey | null) => {
  void commit(value, "select");
  setOpen(false);
};

const clearValue = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  void commit(null, "clear");
};

const onExpandChange = (keys: MechaTreeKey[]) => {
  localExpanded.value = [...keys];
  emit("update:expandedKeys", [...keys]);
};

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    setOpen(!isOpen.value);
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    setOpen(true);
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
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
      aria-haspopup="tree"
      :disabled="disabled"
      :class="partClass('trigger', 'm-tree-select__trigger')"
      v-bind="partAttrs('trigger')"
      @click="setOpen(!isOpen)"
      @keydown="onTriggerKeydown"
    >
      <span
        :class="
          partClass(
            'value',
            `m-tree-select__value ${hasValue ? 'has-value' : 'is-placeholder'}`
          )
        "
        v-bind="partAttrs('value')"
      >
        {{ selectedLabel || placeholder }}
      </span>

      <span
        :class="partClass('actions', 'm-tree-select__actions')"
        v-bind="partAttrs('actions')"
      >
        <span
          v-if="clearable && hasValue && !disabled"
          :class="partClass('clear', 'm-tree-select__clear')"
          v-bind="partAttrs('clear')"
          role="button"
          tabindex="0"
          @click="clearValue"
          @keydown.enter.prevent="clearValue"
        >
          x
        </span>
        <span
          :class="partClass('arrow', 'm-tree-select__arrow')"
          v-bind="partAttrs('arrow')"
          aria-hidden="true"
        >
          v
        </span>
      </span>
    </button>

    <div
      v-if="isOpen"
      :class="partClass('panel', 'm-tree-select__panel')"
      v-bind="partAttrs('panel')"
    >
      <input
        v-if="filterable"
        v-model="query"
        type="text"
        :class="partClass('search', 'm-tree-select__search')"
        v-bind="partAttrs('search')"
        placeholder="Filter nodes"
      />

      <MechaTree
        :model-value="modelValue"
        :data="displayData"
        :expanded-keys="localExpanded"
        :selectable="true"
        :expand-on-click-node="true"
        :class="partClass('tree', 'm-tree-select__tree')"
        @change="onSelect"
        @update:expandedKeys="onExpandChange"
      />

      <div
        v-if="filterable && query.trim() && !displayData.length"
        :class="partClass('empty', 'm-tree-select__empty')"
        v-bind="partAttrs('empty')"
      >
        No matching nodes
      </div>
    </div>
  </div>
</template>

<style>
.m-tree-select {
  position: relative;
  display: inline-grid;
  min-inline-size: 13rem;
}

.m-tree-select.is-disabled {
  opacity: 0.58;
}

.m-tree-select__trigger {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #3f5670);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(178deg, rgb(255 255 255 / 0.08), transparent 40%),
    color-mix(in srgb, var(--mecha-bg-soft) 78%, #101a29);
  min-block-size: 2.3rem;
  padding: 0.52rem 0.66rem 0.52rem 0.8rem;
  color: var(--mecha-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  cursor: pointer;
}

.m-tree-select__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  outline-offset: 3px;
}

.m-tree-select.is-open .m-tree-select__trigger {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08) inset,
    0 0 16px color-mix(in srgb, var(--mecha-accent-cool) 24%, transparent);
}

.m-tree-select__value.is-placeholder {
  color: var(--mecha-text-muted);
}

.m-tree-select__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
}

.m-tree-select__clear {
  inline-size: 1rem;
  block-size: 1rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #4b637d);
  display: grid;
  place-items: center;
  font-size: 0.62rem;
}

.m-tree-select__arrow {
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  transition: transform var(--mecha-motion-fast) ease;
}

.m-tree-select.is-open .m-tree-select__arrow {
  transform: rotate(180deg);
}

.m-tree-select__panel {
  position: absolute;
  z-index: 34;
  inset: calc(100% + 0.36rem) 0 auto;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #364d62);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 38%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #0c1522);
  box-shadow: 0 14px 28px rgb(0 0 0 / 0.48);
  padding: 0.4rem;
  display: grid;
  gap: 0.36rem;
}

.m-tree-select__search {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #3e5770);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.03);
  color: var(--mecha-text);
  padding: 0.4rem 0.52rem;
  font-size: 0.76rem;
}

.m-tree-select__search:focus {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 62%, white);
}

.m-tree-select__tree {
  inline-size: 100%;
  max-block-size: 15rem;
  overflow: auto;
}

.m-tree-select__empty {
  border: 1px dashed color-mix(in srgb, var(--mecha-accent-cool) 30%, #45607b);
  border-radius: 8px;
  padding: 0.5rem 0.56rem;
  text-align: center;
  color: var(--mecha-text-muted);
  font-size: 0.72rem;
}
</style>
