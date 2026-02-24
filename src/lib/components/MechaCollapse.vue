<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type CollapseName = string | number;

export interface MechaCollapseItem {
  name?: CollapseName;
  label: string;
  hint?: string;
  content?: string;
  disabled?: boolean;
}

interface ResolvedCollapseItem extends MechaCollapseItem {
  name: CollapseName;
}

const props = withDefaults(
  defineProps<{
    modelValue?: CollapseName[];
    items?: MechaCollapseItem[];
    accordion?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: CollapseName[];
      next: CollapseName[];
      item: ResolvedCollapseItem;
    }>;
  }>(),
  {
    modelValue: () => [],
    items: () => [],
    accordion: false,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: CollapseName[]];
  change: [value: CollapseName[]];
  blocked: [value: CollapseName[]];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaCollapse",
  undefined,
  props.ui
);

const localActive = ref<CollapseName[]>([...props.modelValue]);

const resolvedItems = computed<ResolvedCollapseItem[]>(() =>
  props.items.map((item, index) => ({
    ...item,
    name: item.name ?? index
  }))
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-collapse ${props.disabled ? "is-disabled" : ""} ${
      props.accordion ? "is-accordion" : ""
    }`
  )
);

const isOpen = (name: CollapseName) => localActive.value.includes(name);

const toggle = async (item: ResolvedCollapseItem) => {
  if (props.disabled || item.disabled) {
    return;
  }

  const current = [...localActive.value];
  const opened = current.includes(item.name);
  let next: CollapseName[];

  if (opened) {
    next = current.filter((name) => name !== item.name);
  } else if (props.accordion) {
    next = [item.name];
  } else {
    next = [...current, item.name];
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaCollapse",
      action: opened ? "close" : "open",
      payload: { current, next, item }
    },
    async () => {
      localActive.value = next;
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", current);
  }
};

watch(
  () => props.modelValue,
  (next) => {
    localActive.value = [...next];
  },
  { deep: true }
);
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <article
      v-for="(item, index) in resolvedItems"
      :key="item.name"
      :class="
        partClass(
          'item',
          `m-collapse__item ${isOpen(item.name) ? 'is-open' : ''} ${
            item.disabled ? 'is-disabled' : ''
          }`
        )
      "
      v-bind="partAttrs('item', { 'data-name': String(item.name), 'data-index': index })"
    >
      <button
        type="button"
        :disabled="disabled || item.disabled"
        :class="partClass('header', 'm-collapse__header')"
        v-bind="partAttrs('header')"
        @click="toggle(item)"
      >
        <span :class="partClass('label', 'm-collapse__label')" v-bind="partAttrs('label')">
          {{ item.label }}
        </span>
        <span
          v-if="item.hint"
          :class="partClass('hint', 'm-collapse__hint')"
          v-bind="partAttrs('hint')"
        >
          {{ item.hint }}
        </span>
        <span :class="partClass('arrow', 'm-collapse__arrow')" v-bind="partAttrs('arrow')">
          v
        </span>
      </button>

      <transition name="m-collapse-fold">
        <div
          v-show="isOpen(item.name)"
          :class="partClass('content', 'm-collapse__content')"
          v-bind="partAttrs('content')"
        >
          <slot name="item" :item="item" :index="index" :open="isOpen(item.name)">
            {{ item.content || "No content" }}
          </slot>
        </div>
      </transition>
    </article>
  </section>
</template>

<style>
.m-collapse {
  inline-size: min(100%, 40rem);
  display: grid;
  gap: 0.42rem;
}

.m-collapse.is-disabled {
  opacity: 0.62;
}

.m-collapse__item {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 20%, #3a5068);
  border-radius: 10px;
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 34%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
  overflow: clip;
}

.m-collapse__item.is-disabled {
  opacity: 0.56;
}

.m-collapse__header {
  inline-size: 100%;
  border: 0;
  background: transparent;
  color: var(--mecha-text);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.62rem 0.72rem;
  cursor: pointer;
  text-align: left;
}

.m-collapse__header:disabled {
  cursor: not-allowed;
}

.m-collapse__label {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.76rem;
}

.m-collapse__hint {
  font-size: 0.68rem;
  color: var(--mecha-text-muted);
}

.m-collapse__arrow {
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  transition: transform var(--mecha-motion-base) ease;
}

.m-collapse__item.is-open .m-collapse__arrow {
  transform: rotate(180deg);
}

.m-collapse__content {
  border-top: 1px solid rgb(255 255 255 / 0.09);
  padding: 0.72rem 0.78rem 0.8rem;
  color: color-mix(in srgb, var(--mecha-text) 90%, #d9ebff);
  font-size: 0.8rem;
  line-height: 1.5;
}

.m-collapse-fold-enter-active,
.m-collapse-fold-leave-active {
  transition: all var(--mecha-motion-base) ease;
  transform-origin: top;
}

.m-collapse-fold-enter-from,
.m-collapse-fold-leave-to {
  opacity: 0;
  transform: scaleY(0.92);
}
</style>
