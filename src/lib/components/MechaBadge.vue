<script setup lang="ts">
import { computed, useAttrs, useSlots } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

defineOptions({ inheritAttrs: false });

type BadgeType = "primary" | "success" | "warning" | "danger" | "info";

const props = withDefaults(
  defineProps<{
    value?: string | number | null;
    max?: number;
    dot?: boolean;
    hidden?: boolean;
    showZero?: boolean;
    type?: BadgeType;
    offset?: [number, number];
    ui?: MechaComponentUi;
  }>(),
  {
    value: null,
    max: 99,
    dot: false,
    hidden: false,
    showZero: false,
    type: "primary",
    offset: () => [0, 0] as [number, number],
    ui: undefined
  }
);

const attrs = useAttrs();
const slots = useSlots();
const { partClass, partAttrs } = useMechaComponent(
  "MechaBadge",
  undefined,
  props.ui
);

const hasContent = computed(() => Boolean(slots.default));

const normalizedNumeric = computed<number | null>(() => {
  if (typeof props.value === "number" && Number.isFinite(props.value)) {
    return props.value;
  }

  if (typeof props.value === "string" && props.value.trim().length) {
    const parsed = Number(props.value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
});

const isHidden = computed(() => {
  if (props.hidden) {
    return true;
  }

  if (props.dot) {
    return false;
  }

  if (props.value === null || props.value === undefined || props.value === "") {
    return true;
  }

  if (!props.showZero && normalizedNumeric.value === 0) {
    return true;
  }

  return false;
});

const displayValue = computed(() => {
  if (props.dot) {
    return "";
  }

  if (normalizedNumeric.value !== null) {
    const safeValue = Math.max(0, Math.trunc(normalizedNumeric.value));
    if (props.max > 0 && safeValue > props.max) {
      return `${props.max}+`;
    }
    return String(safeValue);
  }

  return String(props.value ?? "");
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-badge ${hasContent.value ? "has-content" : "is-standalone"}`
  )
);

const indicatorClass = computed(() =>
  partClass(
    "indicator",
    `m-badge__indicator m-badge__indicator--${props.type} ${
      props.dot ? "is-dot" : "is-count"
    }`
  )
);

const indicatorStyle = computed<Record<string, string>>(() => ({
  "--m-badge-offset-x": `${props.offset[0]}px`,
  "--m-badge-offset-y": `${props.offset[1]}px`
}));

const nativeAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <span
    :class="rootClass"
    v-bind="partAttrs('root', nativeAttrs as Record<string, unknown>)"
  >
    <span
      v-if="hasContent"
      :class="partClass('content', 'm-badge__content')"
      v-bind="partAttrs('content')"
    >
      <slot />
    </span>

    <sup
      v-if="!isHidden"
      :class="indicatorClass"
      :style="indicatorStyle"
      v-bind="partAttrs('indicator', { 'data-type': type })"
    >
      <span
        v-if="!dot"
        :class="partClass('value', 'm-badge__value')"
        v-bind="partAttrs('value')"
      >
        {{ displayValue }}
      </span>
    </sup>
  </span>
</template>

<style>
.m-badge {
  --m-badge-offset-x: 0px;
  --m-badge-offset-y: 0px;
  position: relative;
  display: inline-grid;
  align-items: start;
  justify-items: start;
}

.m-badge__content {
  display: inline-flex;
  min-inline-size: 0;
}

.m-badge__indicator {
  --m-badge-accent: var(--mecha-accent-cool);
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(
    calc(50% + var(--m-badge-offset-x)),
    calc(-50% + var(--m-badge-offset-y))
  );
  margin: 0;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--m-badge-accent) 36%, #415873);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.16), transparent 38%),
    color-mix(in srgb, var(--m-badge-accent) 72%, #1c2e44);
  color: color-mix(in srgb, var(--m-badge-accent) 18%, #08121d);
  box-shadow:
    0 0 14px color-mix(in srgb, var(--m-badge-accent) 24%, transparent),
    0 1px 0 rgb(255 255 255 / 0.14) inset;
  pointer-events: none;
}

.m-badge__indicator.is-count {
  min-inline-size: 1.2rem;
  block-size: 1.2rem;
  padding: 0 0.34rem;
  display: inline-grid;
  place-items: center;
}

.m-badge__indicator.is-dot {
  inline-size: 0.68rem;
  block-size: 0.68rem;
}

.m-badge__indicator--primary {
  --m-badge-accent: var(--mecha-accent-cool);
}

.m-badge__indicator--success {
  --m-badge-accent: #4ce8aa;
}

.m-badge__indicator--warning {
  --m-badge-accent: var(--mecha-accent);
}

.m-badge__indicator--danger {
  --m-badge-accent: var(--mecha-danger);
}

.m-badge__indicator--info {
  --m-badge-accent: #7cb9ff;
}

.m-badge__value {
  font-family: var(--mecha-font-display);
  font-size: 0.62rem;
  line-height: 1;
  letter-spacing: 0.06em;
}

.m-badge.is-standalone .m-badge__indicator {
  position: relative;
  transform: translate(var(--m-badge-offset-x), var(--m-badge-offset-y));
}
</style>
