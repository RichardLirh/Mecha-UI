<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    size?: number | string;
    compact?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    title: "No Data",
    description: "No records are currently available.",
    size: 70,
    compact: false,
    ui: undefined
  }
);

const { partClass, partAttrs } = useMechaComponent(
  "MechaEmpty",
  undefined,
  props.ui
);

const normalizeSize = (value: string | number) =>
  typeof value === "number" ? `${value}px` : value;

const rootClass = computed(() =>
  partClass("root", `m-empty ${props.compact ? "is-compact" : ""}`)
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-empty-size": normalizeSize(props.size)
}));
</script>

<template>
  <section :class="rootClass" :style="rootStyle" v-bind="partAttrs('root')">
    <div
      :class="partClass('illustration', 'm-empty__illustration')"
      v-bind="partAttrs('illustration')"
      aria-hidden="true"
    >
      <slot name="illustration">
        <svg
          viewBox="0 0 120 120"
          :class="partClass('svg', 'm-empty__svg')"
          v-bind="partAttrs('svg')"
        >
          <rect x="20" y="26" width="80" height="56" rx="10" />
          <path d="M30 95h60M40 82l8 13m32-13-8 13M35 52h50M35 62h34" />
          <circle cx="84" cy="62" r="6" />
        </svg>
      </slot>
    </div>

    <h4 :class="partClass('title', 'm-empty__title')" v-bind="partAttrs('title')">
      <slot name="title">{{ title }}</slot>
    </h4>

    <p
      :class="partClass('description', 'm-empty__description')"
      v-bind="partAttrs('description')"
    >
      <slot name="description">{{ description }}</slot>
    </p>

    <div
      v-if="$slots.default || $slots.actions"
      :class="partClass('actions', 'm-empty__actions')"
      v-bind="partAttrs('actions')"
    >
      <slot name="actions">
        <slot />
      </slot>
    </div>
  </section>
</template>

<style>
.m-empty {
  --m-empty-size: 70px;
  inline-size: min(100%, 24rem);
  border: 1px dashed color-mix(in srgb, var(--mecha-accent-cool) 34%, #40566f);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #081220);
  padding: 0.92rem 0.9rem;
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 0.48rem;
}

.m-empty.is-compact {
  padding: 0.68rem 0.74rem;
  gap: 0.34rem;
}

.m-empty__illustration {
  inline-size: var(--m-empty-size);
  block-size: var(--m-empty-size);
  border-radius: 999px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 50%, rgb(32 214 255 / 0.2), transparent 65%),
    rgb(255 255 255 / 0.04);
}

.m-empty__svg {
  inline-size: 78%;
  block-size: 78%;
}

.m-empty__svg rect,
.m-empty__svg path,
.m-empty__svg circle {
  fill: none;
  stroke: color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.m-empty__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-empty__description {
  margin: 0;
  font-size: 0.76rem;
  color: var(--mecha-text-muted);
  max-inline-size: 24ch;
}

.m-empty__actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.46rem;
}
</style>
