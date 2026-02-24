<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

export interface MechaBreadcrumbItem {
  label: string;
  to?: string;
  disabled?: boolean;
}

type BreadcrumbToken =
  | { type: "item"; item: MechaBreadcrumbItem; index: number }
  | { type: "ellipsis" };

const props = withDefaults(
  defineProps<{
    items?: MechaBreadcrumbItem[];
    separator?: string;
    maxItems?: number;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      index: number;
      item: MechaBreadcrumbItem;
      current: string | null;
      next: string | null;
    }>;
  }>(),
  {
    items: () => [],
    separator: "/",
    maxItems: 0,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  navigate: [payload: { item: MechaBreadcrumbItem; index: number }];
  blocked: [payload: { item: MechaBreadcrumbItem; index: number }];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaBreadcrumb",
  undefined,
  props.ui
);

const normalizedItems = computed(() =>
  props.items.map((item) => ({
    ...item,
    label: String(item.label)
  }))
);

const tokens = computed<BreadcrumbToken[]>(() => {
  const items = normalizedItems.value;
  const max = props.maxItems > 0 ? Math.max(2, Math.floor(props.maxItems)) : 0;

  if (!max || items.length <= max) {
    return items.map((item, index) => ({ type: "item", item, index }));
  }

  const tailCount = max - 1;
  const tailStart = Math.max(1, items.length - tailCount);
  const head = { type: "item", item: items[0], index: 0 } as BreadcrumbToken;
  const tail = items
    .slice(tailStart)
    .map((item, offset) => ({
      type: "item",
      item,
      index: tailStart + offset
    } as BreadcrumbToken));

  return [head, { type: "ellipsis" }, ...tail];
});

const isLastByTokenIndex = (tokenIndex: number) =>
  tokenIndex === tokens.value.length - 1;

const onItemClick = async (
  item: MechaBreadcrumbItem,
  index: number,
  tokenIndex: number
) => {
  const last = isLastByTokenIndex(tokenIndex);
  if (props.disabled || item.disabled || last || !item.to) {
    return;
  }

  const current = normalizedItems.value[index - 1]?.to ?? null;
  const next = item.to ?? null;

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaBreadcrumb",
      action: "navigate",
      payload: { index, item, current, next }
    },
    async () => {
      emit("navigate", { item, index });
    }
  );

  if (!success) {
    emit("blocked", { item, index });
  }
};
</script>

<template>
  <nav
    aria-label="breadcrumb"
    :class="
      partClass(
        'root',
        `m-breadcrumb ${props.disabled ? 'is-disabled' : ''}`
      )
    "
    v-bind="partAttrs('root')"
  >
    <ol :class="partClass('list', 'm-breadcrumb__list')" v-bind="partAttrs('list')">
      <li
        v-for="(token, tokenIndex) in tokens"
        :key="
          token.type === 'item'
            ? `${token.item.label}:${token.index}`
            : `ellipsis-${tokenIndex}`
        "
        :class="partClass('node', 'm-breadcrumb__node')"
        v-bind="partAttrs('node', { 'data-index': tokenIndex })"
      >
        <template v-if="token.type === 'ellipsis'">
          <span
            :class="partClass('ellipsis', 'm-breadcrumb__ellipsis')"
            v-bind="partAttrs('ellipsis')"
          >
            ...
          </span>
        </template>

        <template v-else>
          <button
            type="button"
            :disabled="
              disabled ||
              token.item.disabled ||
              isLastByTokenIndex(tokenIndex) ||
              !token.item.to
            "
            :class="
              partClass(
                'item',
                `m-breadcrumb__item ${
                  isLastByTokenIndex(tokenIndex) ? 'is-current' : ''
                }`
              )
            "
            v-bind="partAttrs('item')"
            @click="onItemClick(token.item, token.index, tokenIndex)"
          >
            <slot name="item" :item="token.item" :index="token.index">
              {{ token.item.label }}
            </slot>
          </button>
        </template>

        <span
          v-if="tokenIndex < tokens.length - 1"
          :class="partClass('separator', 'm-breadcrumb__separator')"
          v-bind="partAttrs('separator')"
          aria-hidden="true"
        >
          {{ separator }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style>
.m-breadcrumb {
  inline-size: 100%;
}

.m-breadcrumb.is-disabled {
  opacity: 0.58;
}

.m-breadcrumb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.24rem;
}

.m-breadcrumb__node {
  display: inline-flex;
  align-items: center;
  gap: 0.24rem;
}

.m-breadcrumb__item {
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--mecha-text-muted) 92%, white);
  font-size: 0.76rem;
  cursor: pointer;
  padding: 0.08rem 0.1rem;
}

.m-breadcrumb__item:hover:not(:disabled) {
  color: color-mix(in srgb, var(--mecha-accent-cool) 78%, white);
}

.m-breadcrumb__item.is-current {
  color: color-mix(in srgb, var(--mecha-accent-cool) 84%, white);
  font-family: var(--mecha-font-display);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.m-breadcrumb__item:disabled {
  cursor: default;
}

.m-breadcrumb__separator,
.m-breadcrumb__ellipsis {
  color: color-mix(in srgb, var(--mecha-text-muted) 80%, #90a6be);
  font-size: 0.72rem;
}
</style>
