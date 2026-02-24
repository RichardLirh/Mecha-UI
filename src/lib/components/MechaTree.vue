<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

export type MechaTreeKey = string | number;

export interface MechaTreeNode {
  key?: MechaTreeKey;
  label: string;
  hint?: string;
  disabled?: boolean;
  children?: MechaTreeNode[];
}

interface ResolvedTreeNode {
  key: MechaTreeKey;
  label: string;
  hint?: string;
  disabled?: boolean;
  children: ResolvedTreeNode[];
  depth: number;
  parentKey: MechaTreeKey | null;
  raw: MechaTreeNode;
}

const props = withDefaults(
  defineProps<{
    modelValue?: MechaTreeKey | null;
    data?: MechaTreeNode[];
    expandedKeys?: MechaTreeKey[];
    defaultExpandedKeys?: MechaTreeKey[];
    indent?: number;
    disabled?: boolean;
    selectable?: boolean;
    expandOnClickNode?: boolean;
    accordion?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      action: "select" | "toggle";
      node: { key: MechaTreeKey; label: string };
      current: { selected: MechaTreeKey | null; expanded: MechaTreeKey[] };
      next: { selected: MechaTreeKey | null; expanded: MechaTreeKey[] };
    }>;
  }>(),
  {
    modelValue: null,
    data: () => [],
    expandedKeys: () => [],
    defaultExpandedKeys: () => [],
    indent: 16,
    disabled: false,
    selectable: true,
    expandOnClickNode: false,
    accordion: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: MechaTreeKey | null];
  change: [value: MechaTreeKey | null];
  "update:expandedKeys": [value: MechaTreeKey[]];
  "expand-change": [value: MechaTreeKey[]];
  "node-click": [node: MechaTreeNode];
  blocked: [
    payload: {
      action: "select" | "toggle";
      selected: MechaTreeKey | null;
      expanded: MechaTreeKey[];
    }
  ];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaTree", undefined, props.ui);

const keyToken = (key: MechaTreeKey) => `${typeof key}:${String(key)}`;

const resolveNodes = (
  nodes: MechaTreeNode[],
  depth: number,
  parentKey: MechaTreeKey | null,
  path: string
): ResolvedTreeNode[] =>
  nodes.map((node, index) => {
    const pathKey = path ? `${path}.${index}` : `${index}`;
    const key = node.key ?? pathKey;
    const children = resolveNodes(node.children ?? [], depth + 1, key, pathKey);

    return {
      key,
      label: node.label,
      hint: node.hint,
      disabled: Boolean(node.disabled),
      children,
      depth,
      parentKey,
      raw: node
    };
  });

const normalizedTree = computed<ResolvedTreeNode[]>(() =>
  resolveNodes(props.data, 0, null, "")
);

const nodeMap = computed(() => {
  const map = new Map<string, ResolvedTreeNode>();

  const walk = (nodes: ResolvedTreeNode[]) => {
    for (const node of nodes) {
      map.set(keyToken(node.key), node);
      if (node.children.length) {
        walk(node.children);
      }
    }
  };

  walk(normalizedTree.value);
  return map;
});

const dedupeKeys = (keys: MechaTreeKey[]) => {
  const seen = new Set<string>();
  const next: MechaTreeKey[] = [];

  for (const key of keys) {
    const token = keyToken(key);
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    next.push(key);
  }

  return next;
};

const localExpanded = ref<MechaTreeKey[]>(
  props.expandedKeys.length ? [...props.expandedKeys] : [...props.defaultExpandedKeys]
);
const localSelected = ref<MechaTreeKey | null>(props.modelValue ?? null);

watch(
  () => props.expandedKeys,
  (next) => {
    localExpanded.value = dedupeKeys([...next]);
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (next) => {
    localSelected.value = next ?? null;
  }
);

const expandedSet = computed(() => {
  const set = new Set<string>();
  for (const key of localExpanded.value) {
    set.add(keyToken(key));
  }
  return set;
});

const visibleNodes = computed(() => {
  const rows: ResolvedTreeNode[] = [];

  const walk = (nodes: ResolvedTreeNode[]) => {
    for (const node of nodes) {
      rows.push(node);
      if (node.children.length && expandedSet.value.has(keyToken(node.key))) {
        walk(node.children);
      }
    }
  };

  walk(normalizedTree.value);
  return rows;
});

const rootClass = computed(() =>
  partClass("root", `m-tree ${props.disabled ? "is-disabled" : ""}`)
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-tree-indent": `${Math.max(10, props.indent)}px`
}));

const isExpanded = (node: ResolvedTreeNode) =>
  expandedSet.value.has(keyToken(node.key));

const isSelected = (node: ResolvedTreeNode) =>
  localSelected.value !== null &&
  keyToken(localSelected.value) === keyToken(node.key);

const hasChildren = (node: ResolvedTreeNode) => node.children.length > 0;

const updateExpanded = (next: MechaTreeKey[]) => {
  const deduped = dedupeKeys(next);
  localExpanded.value = deduped;
  emit("update:expandedKeys", deduped);
  emit("expand-change", deduped);
};

const getSiblings = (node: ResolvedTreeNode) => {
  if (node.parentKey === null) {
    return normalizedTree.value;
  }

  const parent = nodeMap.value.get(keyToken(node.parentKey));
  return parent?.children ?? [];
};

const toggleNode = async (node: ResolvedTreeNode) => {
  if (props.disabled || node.disabled || !hasChildren(node)) {
    return;
  }

  const current = {
    selected: localSelected.value,
    expanded: [...localExpanded.value]
  };

  let nextExpanded: MechaTreeKey[];
  if (isExpanded(node)) {
    nextExpanded = localExpanded.value.filter(
      (key) => keyToken(key) !== keyToken(node.key)
    );
  } else if (props.accordion) {
    const siblingTokens = new Set(
      getSiblings(node).map((sibling) => keyToken(sibling.key))
    );
    nextExpanded = localExpanded.value.filter(
      (key) => !siblingTokens.has(keyToken(key))
    );
    nextExpanded.push(node.key);
  } else {
    nextExpanded = [...localExpanded.value, node.key];
  }

  const next = {
    selected: localSelected.value,
    expanded: dedupeKeys(nextExpanded)
  };

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTree",
      action: "toggle",
      payload: {
        action: "toggle",
        node: { key: node.key, label: node.label },
        current,
        next
      }
    },
    async () => {
      updateExpanded(next.expanded);
    }
  );

  if (!success) {
    emit("blocked", {
      action: "toggle",
      selected: current.selected,
      expanded: current.expanded
    });
  }
};

const selectNode = async (node: ResolvedTreeNode) => {
  if (props.disabled || node.disabled || !props.selectable) {
    return;
  }

  const current = {
    selected: localSelected.value,
    expanded: [...localExpanded.value]
  };

  if (
    current.selected !== null &&
    keyToken(current.selected) === keyToken(node.key)
  ) {
    return;
  }

  const next = {
    selected: node.key,
    expanded: [...localExpanded.value]
  };

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTree",
      action: "select",
      payload: {
        action: "select",
        node: { key: node.key, label: node.label },
        current,
        next
      }
    },
    async () => {
      localSelected.value = node.key;
      emit("update:modelValue", node.key);
      emit("change", node.key);
    }
  );

  if (!success) {
    emit("blocked", {
      action: "select",
      selected: current.selected,
      expanded: current.expanded
    });
  }
};

const onNodeClick = (node: ResolvedTreeNode) => {
  emit("node-click", node.raw);

  if (props.expandOnClickNode && hasChildren(node)) {
    void toggleNode(node);
  }

  if (props.selectable) {
    void selectNode(node);
  }
};
</script>

<template>
  <section
    role="tree"
    :class="rootClass"
    :style="rootStyle"
    v-bind="partAttrs('root')"
  >
    <div v-if="visibleNodes.length" :class="partClass('list', 'm-tree__list')" v-bind="partAttrs('list')">
      <div
        v-for="(node, index) in visibleNodes"
        :key="keyToken(node.key)"
        role="treeitem"
        :aria-expanded="hasChildren(node) ? isExpanded(node) : undefined"
        :class="
          partClass(
            'item',
            `m-tree__item ${isSelected(node) ? 'is-selected' : ''} ${
              node.disabled ? 'is-disabled' : ''
            }`
          )
        "
        :style="{ '--m-tree-depth': String(node.depth) }"
        v-bind="
          partAttrs('item', {
            'data-index': index,
            'data-key': String(node.key),
            'data-depth': node.depth
          })
        "
      >
        <button
          v-if="hasChildren(node)"
          type="button"
          :disabled="disabled || node.disabled"
          :class="
            partClass(
              'toggle',
              `m-tree__toggle ${isExpanded(node) ? 'is-open' : ''}`
            )
          "
          v-bind="partAttrs('toggle')"
          @click.stop="toggleNode(node)"
        >
          >
        </button>
        <span
          v-else
          :class="partClass('placeholder', 'm-tree__placeholder')"
          v-bind="partAttrs('placeholder')"
          aria-hidden="true"
        />

        <button
          type="button"
          :disabled="disabled || node.disabled"
          :class="partClass('label', 'm-tree__label')"
          v-bind="partAttrs('label')"
          @click="onNodeClick(node)"
        >
          <span :class="partClass('text', 'm-tree__text')" v-bind="partAttrs('text')">
            {{ node.label }}
          </span>
          <span
            v-if="node.hint"
            :class="partClass('hint', 'm-tree__hint')"
            v-bind="partAttrs('hint')"
          >
            {{ node.hint }}
          </span>
        </button>
      </div>
    </div>

    <div
      v-else
      :class="partClass('empty', 'm-tree__empty')"
      v-bind="partAttrs('empty')"
    >
      <slot name="empty">No tree nodes</slot>
    </div>
  </section>
</template>

<style>
.m-tree {
  --m-tree-indent: 16px;
  inline-size: min(100%, 34rem);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 22%, #3f5770);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.07), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
  padding: 0.44rem;
}

.m-tree.is-disabled {
  opacity: 0.58;
}

.m-tree__list {
  display: grid;
  gap: 0.1rem;
}

.m-tree__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.28rem;
  min-block-size: 1.9rem;
  padding-inline-start: calc(var(--m-tree-depth) * var(--m-tree-indent));
  border-radius: 8px;
  transition: background var(--mecha-motion-fast) ease;
}

.m-tree__item:hover {
  background: rgb(255 255 255 / 0.05);
}

.m-tree__item.is-selected {
  background:
    linear-gradient(138deg, rgb(32 214 255 / 0.2), transparent 72%),
    rgb(255 255 255 / 0.06);
}

.m-tree__item.is-disabled {
  opacity: 0.5;
}

.m-tree__toggle,
.m-tree__placeholder {
  inline-size: 1.06rem;
  block-size: 1.06rem;
}

.m-tree__toggle {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, #496179);
  border-radius: 6px;
  background: rgb(255 255 255 / 0.03);
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  font-size: 0.62rem;
  display: grid;
  place-items: center;
  cursor: pointer;
  transform: rotate(0deg);
  transition:
    transform var(--mecha-motion-fast) ease,
    background var(--mecha-motion-fast) ease;
}

.m-tree__toggle.is-open {
  transform: rotate(90deg);
}

.m-tree__toggle:disabled {
  cursor: not-allowed;
}

.m-tree__label {
  border: 0;
  background: transparent;
  text-align: left;
  min-inline-size: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.1rem 0;
  color: var(--mecha-text);
  cursor: pointer;
}

.m-tree__label:disabled {
  cursor: not-allowed;
}

.m-tree__text {
  min-inline-size: 0;
  font-size: 0.8rem;
}

.m-tree__hint {
  font-size: 0.68rem;
  color: var(--mecha-text-muted);
}

.m-tree__empty {
  padding: 0.58rem 0.62rem;
  border: 1px dashed color-mix(in srgb, var(--mecha-accent-cool) 30%, #45607b);
  border-radius: 8px;
  color: var(--mecha-text-muted);
  font-size: 0.74rem;
}
</style>
