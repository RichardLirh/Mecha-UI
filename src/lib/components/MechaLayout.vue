<script setup lang="ts">
import { computed, useAttrs } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

defineOptions({ inheritAttrs: false });

type LayoutAs = "div" | "section" | "main" | "article" | "nav";
type LayoutDirection = "row" | "column";
type LayoutAlign = "start" | "center" | "end" | "stretch";
type LayoutJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

const alignMap: Record<LayoutAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch"
};

const justifyMap: Record<LayoutJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly"
};

const props = withDefaults(
  defineProps<{
    as?: LayoutAs;
    direction?: LayoutDirection;
    gap?: string;
    align?: LayoutAlign;
    justify?: LayoutJustify;
    wrap?: boolean;
    grid?: boolean;
    columns?: number;
    minColumnWidth?: string;
    padded?: boolean;
    surface?: boolean;
    bordered?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    as: "section",
    direction: "row",
    gap: "0.72rem",
    align: "stretch",
    justify: "start",
    wrap: true,
    grid: false,
    columns: 2,
    minColumnWidth: "12rem",
    padded: true,
    surface: true,
    bordered: true,
    ui: undefined
  }
);

const attrs = useAttrs();
const { partClass, partAttrs } = useMechaComponent("MechaLayout", undefined, props.ui);

const safeColumns = computed(() => Math.max(1, Math.floor(props.columns)));

const rootClass = computed(() =>
  partClass(
    "root",
    `m-layout ${props.grid ? "is-grid" : "is-flex"} ${
      props.padded ? "is-padded" : ""
    } ${props.surface ? "has-surface" : ""} ${
      props.bordered ? "has-border" : ""
    }`
  )
);

const rootStyle = computed(() => ({
  "--m-layout-gap": props.gap,
  "--m-layout-direction": props.direction,
  "--m-layout-align": alignMap[props.align],
  "--m-layout-justify": justifyMap[props.justify],
  "--m-layout-wrap": props.wrap ? "wrap" : "nowrap",
  "--m-layout-columns": String(safeColumns.value),
  "--m-layout-col-min": props.minColumnWidth
}));

const nativeAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <component
    :is="as"
    :class="rootClass"
    :style="rootStyle"
    v-bind="partAttrs('root', nativeAttrs as Record<string, unknown>)"
  >
    <header
      v-if="$slots.header"
      :class="partClass('header', 'm-layout__header')"
      v-bind="partAttrs('header')"
    >
      <slot name="header" />
    </header>

    <div :class="partClass('body', 'm-layout__body')" v-bind="partAttrs('body')">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      :class="partClass('footer', 'm-layout__footer')"
      v-bind="partAttrs('footer')"
    >
      <slot name="footer" />
    </footer>
  </component>
</template>

<style>
.m-layout {
  --m-layout-gap: 0.72rem;
  --m-layout-direction: row;
  --m-layout-align: stretch;
  --m-layout-justify: flex-start;
  --m-layout-wrap: wrap;
  --m-layout-columns: 2;
  --m-layout-col-min: 12rem;
  display: grid;
  gap: var(--m-layout-gap);
}

.m-layout.is-padded {
  padding: 0.82rem;
}

.m-layout.has-border {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 20%, #34495f);
  border-radius: var(--mecha-radius-md);
}

.m-layout.has-surface {
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.07), transparent 34%),
    color-mix(in srgb, var(--mecha-bg-soft) 82%, #0d1623);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.05);
}

.m-layout__header {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 88%, white);
}

.m-layout__body {
  min-inline-size: 0;
}

.m-layout.is-flex .m-layout__body {
  display: flex;
  flex-direction: var(--m-layout-direction);
  align-items: var(--m-layout-align);
  justify-content: var(--m-layout-justify);
  flex-wrap: var(--m-layout-wrap);
  gap: var(--m-layout-gap);
}

.m-layout.is-grid .m-layout__body {
  display: grid;
  gap: var(--m-layout-gap);
  align-items: var(--m-layout-align);
  grid-template-columns: repeat(
    var(--m-layout-columns),
    minmax(min(100%, var(--m-layout-col-min)), 1fr)
  );
}

.m-layout__footer {
  padding-top: 0.36rem;
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

@media (max-width: 760px) {
  .m-layout.is-grid .m-layout__body {
    grid-template-columns: 1fr;
  }
}
</style>
