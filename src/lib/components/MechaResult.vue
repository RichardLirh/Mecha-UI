<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

type MechaResultStatus = "info" | "success" | "warning" | "error";

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    status?: MechaResultStatus;
    bordered?: boolean;
    compact?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    title: "Operation Result",
    subtitle: "System returned status payload.",
    status: "info",
    bordered: true,
    compact: false,
    ui: undefined
  }
);

const { partClass, partAttrs } = useMechaComponent("MechaResult", undefined, props.ui);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-result m-result--${props.status} ${props.bordered ? "is-bordered" : ""} ${
      props.compact ? "is-compact" : ""
    }`
  )
);

const statusMeta = computed(() => {
  if (props.status === "success") {
    return {
      path: "M6 12.3l3.9 3.9L18.2 8",
      ring: "circle(50% at 50% 50%)"
    };
  }

  if (props.status === "warning") {
    return {
      path: "M12 7.4v5.2m0 3.5h.01M12 3.8l8.1 14.4H3.9L12 3.8Z",
      ring: "polygon(50% 7%, 91% 82%, 9% 82%)"
    };
  }

  if (props.status === "error") {
    return {
      path: "M8.2 8.2l7.6 7.6M15.8 8.2l-7.6 7.6",
      ring: "circle(50% at 50% 50%)"
    };
  }

  return {
    path: "M12 8.1h.01M12 10.4v5.5M3.9 12a8.1 8.1 0 1 0 16.2 0 8.1 8.1 0 1 0-16.2 0Z",
    ring: "circle(50% at 50% 50%)"
  };
});
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <div :class="partClass('icon', 'm-result__icon')" v-bind="partAttrs('icon')">
      <slot name="icon" :status="status">
        <svg
          viewBox="0 0 24 24"
          :class="partClass('icon-svg', 'm-result__icon-svg')"
          v-bind="partAttrs('icon-svg')"
          aria-hidden="true"
        >
          <path :d="statusMeta.path" />
        </svg>
      </slot>
    </div>

    <div :class="partClass('body', 'm-result__body')" v-bind="partAttrs('body')">
      <h3 :class="partClass('title', 'm-result__title')" v-bind="partAttrs('title')">
        <slot name="title">{{ title }}</slot>
      </h3>

      <p
        :class="partClass('subtitle', 'm-result__subtitle')"
        v-bind="partAttrs('subtitle')"
      >
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>

      <div
        v-if="$slots.default"
        :class="partClass('content', 'm-result__content')"
        v-bind="partAttrs('content')"
      >
        <slot />
      </div>
    </div>

    <div
      v-if="$slots.extra"
      :class="partClass('extra', 'm-result__extra')"
      v-bind="partAttrs('extra')"
    >
      <slot name="extra" />
    </div>
  </section>
</template>

<style>
.m-result {
  --m-result-accent: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  inline-size: min(100%, 34rem);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.72rem;
  align-items: start;
  border-radius: var(--mecha-radius-md);
  padding: 0.9rem 0.94rem;
  background:
    linear-gradient(160deg, rgb(255 255 255 / 0.08), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
}

.m-result.is-bordered {
  border: 1px solid color-mix(in srgb, var(--m-result-accent) 34%, #3e5570);
}

.m-result.is-compact {
  gap: 0.5rem;
  padding: 0.7rem 0.78rem;
}

.m-result--success {
  --m-result-accent: color-mix(in srgb, #48eba7 78%, white);
}

.m-result--warning {
  --m-result-accent: color-mix(in srgb, #ffb547 84%, white);
}

.m-result--error {
  --m-result-accent: color-mix(in srgb, #ff536f 84%, white);
}

.m-result__icon {
  inline-size: 2.44rem;
  block-size: 2.44rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.2), transparent 66%),
    color-mix(in srgb, var(--m-result-accent) 12%, #112334);
  border: 1px solid color-mix(in srgb, var(--m-result-accent) 48%, #4b637d);
}

.m-result__icon-svg {
  inline-size: 1.28rem;
  block-size: 1.28rem;
  color: var(--m-result-accent);
}

.m-result__icon-svg path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.m-result__body {
  min-inline-size: 0;
  display: grid;
  gap: 0.36rem;
}

.m-result__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--m-result-accent) 78%, white);
}

.m-result__subtitle {
  margin: 0;
  font-size: 0.76rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, white);
}

.m-result__content {
  margin-top: 0.2rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--mecha-text) 92%, #d9ebff);
}

.m-result__extra {
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.44rem;
}
</style>
