<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    rows?: number;
    animated?: boolean;
    title?: boolean;
    avatar?: boolean;
    round?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    loading: true,
    rows: 3,
    animated: true,
    title: true,
    avatar: false,
    round: false,
    ui: undefined
  }
);

const { partClass, partAttrs } = useMechaComponent(
  "MechaSkeleton",
  undefined,
  props.ui
);

const lineRows = computed(() => {
  const count = Number.isFinite(props.rows) ? Math.floor(props.rows) : 3;
  const safeCount = Math.max(1, count);
  return Array.from({ length: safeCount }, (_, index) => index);
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-skeleton ${props.animated ? "is-animated" : ""} ${
      props.round ? "is-round" : ""
    }`
  )
);
</script>

<template>
  <template v-if="loading">
    <section :class="rootClass" v-bind="partAttrs('root')">
      <div
        v-if="avatar"
        :class="partClass('avatar', 'm-skeleton__avatar')"
        v-bind="partAttrs('avatar')"
      />

      <div :class="partClass('body', 'm-skeleton__body')" v-bind="partAttrs('body')">
        <span
          v-if="title"
          :class="partClass('title', 'm-skeleton__title')"
          v-bind="partAttrs('title')"
        />

        <span
          v-for="line in lineRows"
          :key="line"
          :class="
            partClass(
              'line',
              `m-skeleton__line ${line === lineRows.length - 1 ? 'is-last' : ''}`
            )
          "
          v-bind="partAttrs('line', { 'data-line': line })"
        />
      </div>
    </section>
  </template>

  <template v-else>
    <slot />
  </template>
</template>

<style>
.m-skeleton {
  --m-skeleton-radius: 8px;
  inline-size: min(100%, 34rem);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.66rem;
  padding: 0.76rem 0.82rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 18%, #3d556e);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(160deg, rgb(255 255 255 / 0.06), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
}

.m-skeleton.is-round {
  --m-skeleton-radius: 999px;
}

.m-skeleton__avatar,
.m-skeleton__title,
.m-skeleton__line {
  position: relative;
  overflow: hidden;
  border-radius: var(--m-skeleton-radius);
  background:
    linear-gradient(90deg, rgb(255 255 255 / 0.04), rgb(255 255 255 / 0.12) 45%, rgb(255 255 255 / 0.04)),
    color-mix(in srgb, var(--mecha-bg-elevated) 74%, #101a29);
}

.m-skeleton__avatar {
  inline-size: 2.3rem;
  block-size: 2.3rem;
}

.m-skeleton__body {
  min-inline-size: 0;
  display: grid;
  gap: 0.4rem;
}

.m-skeleton__title {
  inline-size: 46%;
  block-size: 0.78rem;
}

.m-skeleton__line {
  inline-size: 100%;
  block-size: 0.62rem;
}

.m-skeleton__line.is-last {
  inline-size: 68%;
}

.m-skeleton.is-animated .m-skeleton__avatar::after,
.m-skeleton.is-animated .m-skeleton__title::after,
.m-skeleton.is-animated .m-skeleton__line::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 10%,
    rgb(255 255 255 / 0.22) 50%,
    transparent 90%
  );
  transform: translateX(-100%);
  animation: m-skeleton-shimmer 1.35s ease-in-out infinite;
}

@keyframes m-skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-skeleton.is-animated .m-skeleton__avatar::after,
  .m-skeleton.is-animated .m-skeleton__title::after,
  .m-skeleton.is-animated .m-skeleton__line::after {
    animation: none;
  }
}
</style>
