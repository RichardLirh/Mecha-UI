<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

export interface MechaDescriptionItem {
  label: string;
  value?: string | number;
  span?: number;
}

const props = withDefaults(
  defineProps<{
    title?: string;
    items?: MechaDescriptionItem[];
    columns?: number;
    size?: "sm" | "md";
    bordered?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    title: "",
    items: () => [],
    columns: 3,
    size: "md",
    bordered: true,
    ui: undefined
  }
);

const { partClass, partAttrs } = useMechaComponent(
  "MechaDescriptions",
  undefined,
  props.ui
);

const safeColumns = computed(() => Math.max(1, Math.floor(props.columns)));

const resolvedItems = computed(() =>
  props.items.map((item) => ({
    ...item,
    span: Math.max(1, Math.min(safeColumns.value, Math.floor(item.span ?? 1)))
  }))
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-descriptions m-descriptions--${props.size} ${
      props.bordered ? "has-border" : ""
    }`
  )
);

const bodyStyle = computed(() => ({
  gridTemplateColumns: `repeat(${safeColumns.value}, minmax(0, 1fr))`
}));
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <header
      v-if="title || $slots.title"
      :class="partClass('header', 'm-descriptions__header')"
      v-bind="partAttrs('header')"
    >
      <slot name="title">
        <h3 :class="partClass('title', 'm-descriptions__title')" v-bind="partAttrs('title')">
          {{ title }}
        </h3>
      </slot>
    </header>

    <div
      v-if="resolvedItems.length"
      :class="partClass('body', 'm-descriptions__body')"
      :style="bodyStyle"
      v-bind="partAttrs('body')"
    >
      <article
        v-for="(item, index) in resolvedItems"
        :key="`${item.label}:${index}`"
        :class="partClass('item', 'm-descriptions__item')"
        :style="{ gridColumn: `span ${item.span}` }"
        v-bind="partAttrs('item', { 'data-index': index })"
      >
        <dt
          :class="partClass('label', 'm-descriptions__label')"
          v-bind="partAttrs('label')"
        >
          {{ item.label }}
        </dt>

        <dd
          :class="partClass('value', 'm-descriptions__value')"
          v-bind="partAttrs('value')"
        >
          <slot name="value" :item="item" :index="index">
            {{ item.value ?? "--" }}
          </slot>
        </dd>
      </article>
    </div>

    <div
      v-else
      :class="partClass('empty', 'm-descriptions__empty')"
      v-bind="partAttrs('empty')"
    >
      <slot>No description entries</slot>
    </div>
  </section>
</template>

<style>
.m-descriptions {
  inline-size: min(100%, 40rem);
  display: grid;
  gap: 0.56rem;
}

.m-descriptions.has-border {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 20%, #3a5068);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 34%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
  padding: 0.78rem;
}

.m-descriptions__header {
  border-bottom: 1px solid rgb(255 255 255 / 0.09);
  padding-bottom: 0.46rem;
}

.m-descriptions__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-size: 0.76rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-descriptions__body {
  display: grid;
  gap: 0.44rem;
}

.m-descriptions__item {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 18%, #425871);
  border-radius: 9px;
  padding: 0.5rem 0.58rem;
  background: rgb(255 255 255 / 0.04);
  display: grid;
  gap: 0.2rem;
}

.m-descriptions--sm .m-descriptions__item {
  padding: 0.4rem 0.5rem;
}

.m-descriptions__label {
  margin: 0;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.62rem;
  color: var(--mecha-text-muted);
}

.m-descriptions__value {
  margin: 0;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--mecha-text) 90%, #d9ebff);
}

.m-descriptions__empty {
  padding: 0.54rem 0.64rem;
  border-radius: 8px;
  border: 1px dashed color-mix(in srgb, var(--mecha-accent-cool) 28%, #4a627a);
  color: var(--mecha-text-muted);
  font-size: 0.76rem;
}

@media (max-width: 760px) {
  .m-descriptions__body {
    grid-template-columns: 1fr !important;
  }
}
</style>
