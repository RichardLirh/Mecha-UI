<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

type ProgressStatus = "default" | "success" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    percentage?: number;
    status?: ProgressStatus;
    showText?: boolean;
    striped?: boolean;
    animated?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    percentage: 0,
    status: "default",
    showText: true,
    striped: true,
    animated: true,
    ui: undefined
  }
);

const { partClass, partAttrs } = useMechaComponent("MechaProgress", undefined, props.ui);

const normalized = computed(() => Math.min(100, Math.max(0, props.percentage)));

const rootClass = computed(() =>
  partClass("root", `m-progress m-progress--${props.status}`)
);

const fillClass = computed(() =>
  partClass(
    "fill",
    `m-progress__fill ${props.striped ? "is-striped" : ""} ${
      props.animated ? "is-animated" : ""
    }`
  )
);
</script>

<template>
  <div :class="rootClass" v-bind="partAttrs('root')">
    <div :class="partClass('track', 'm-progress__track')" v-bind="partAttrs('track')">
      <span
        :class="fillClass"
        :style="{ width: `${normalized}%` }"
        v-bind="partAttrs('fill')"
      />
    </div>
    <span
      v-if="showText"
      :class="partClass('text', 'm-progress__text')"
      v-bind="partAttrs('text')"
    >
      {{ normalized }}%
    </span>
  </div>
</template>

<style>
.m-progress {
  --m-progress-accent: var(--mecha-accent-cool);
  display: grid;
  gap: 0.44rem;
}

.m-progress--default {
  --m-progress-accent: var(--mecha-accent-cool);
}

.m-progress--success {
  --m-progress-accent: #51efb1;
}

.m-progress--warning {
  --m-progress-accent: var(--mecha-accent);
}

.m-progress--danger {
  --m-progress-accent: var(--mecha-danger);
}

.m-progress__track {
  position: relative;
  block-size: 0.62rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--m-progress-accent) 28%, #3d5268);
  background: color-mix(in srgb, var(--mecha-bg-soft) 80%, #101a2a);
  overflow: hidden;
}

.m-progress__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background:
    linear-gradient(
      to right,
      color-mix(in srgb, var(--m-progress-accent) 92%, white),
      color-mix(in srgb, var(--m-progress-accent) 48%, #16202f)
    );
  box-shadow: 0 0 14px color-mix(in srgb, var(--m-progress-accent) 34%, transparent);
}

.m-progress__fill.is-striped {
  background-image:
    repeating-linear-gradient(
      120deg,
      rgb(255 255 255 / 0.24) 0 7px,
      transparent 7px 14px
    ),
    linear-gradient(
      to right,
      color-mix(in srgb, var(--m-progress-accent) 92%, white),
      color-mix(in srgb, var(--m-progress-accent) 48%, #16202f)
    );
  background-size: 18px 100%, 100% 100%;
}

.m-progress__fill.is-striped.is-animated {
  animation: m-progress-stripe 1.2s linear infinite;
}

.m-progress__text {
  justify-self: end;
  font-family: var(--mecha-font-display);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--m-progress-accent) 72%, white);
}

@keyframes m-progress-stripe {
  from {
    background-position: 0 0, 0 0;
  }
  to {
    background-position: 18px 0, 0 0;
  }
}
</style>
