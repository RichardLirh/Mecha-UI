<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

type StatisticStatus = "default" | "info" | "success" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    title?: string;
    value?: number | string;
    precision?: number;
    groupSeparator?: string;
    prefix?: string;
    suffix?: string;
    trend?: number | null;
    status?: StatisticStatus;
    loading?: boolean;
    animated?: boolean;
    duration?: number;
    ui?: MechaComponentUi;
  }>(),
  {
    title: "",
    value: 0,
    precision: 0,
    groupSeparator: ",",
    prefix: "",
    suffix: "",
    trend: null,
    status: "default",
    loading: false,
    animated: true,
    duration: 420,
    ui: undefined
  }
);

const { partClass, partAttrs } = useMechaComponent(
  "MechaStatistic",
  undefined,
  props.ui
);

const numericValue = computed(() =>
  typeof props.value === "number" && Number.isFinite(props.value) ? props.value : null
);

const safePrecision = computed(() => {
  if (!Number.isFinite(props.precision)) {
    return 0;
  }
  return Math.max(0, Math.min(6, Math.floor(props.precision)));
});

const animatedNumber = ref(numericValue.value ?? 0);
let frameHandle: number | undefined;

const stopAnimation = () => {
  if (frameHandle !== undefined) {
    window.cancelAnimationFrame(frameHandle);
    frameHandle = undefined;
  }
};

const animateTo = (to: number) => {
  stopAnimation();

  if (!props.animated) {
    animatedNumber.value = to;
    return;
  }

  const from = animatedNumber.value;
  const duration = Math.max(120, props.duration);
  const start = performance.now();

  const run = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    animatedNumber.value = from + (to - from) * eased;

    if (progress < 1) {
      frameHandle = window.requestAnimationFrame(run);
      return;
    }

    frameHandle = undefined;
  };

  frameHandle = window.requestAnimationFrame(run);
};

watch(
  numericValue,
  (next) => {
    if (next === null) {
      stopAnimation();
      return;
    }

    animateTo(next);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  stopAnimation();
});

const formatNumber = (value: number) => {
  const fixed = value.toFixed(safePrecision.value);
  const [intPart, decPart] = fixed.split(".");
  const sign = intPart.startsWith("-") ? "-" : "";
  const pureInt = sign ? intPart.slice(1) : intPart;
  const grouped = pureInt.replace(/\B(?=(\d{3})+(?!\d))/g, props.groupSeparator);
  const withSign = `${sign}${grouped}`;

  if (!decPart) {
    return withSign;
  }

  return `${withSign}.${decPart}`;
};

const displayValue = computed(() => {
  if (numericValue.value === null) {
    return String(props.value ?? "--");
  }

  return formatNumber(animatedNumber.value);
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-statistic m-statistic--${props.status} ${
      props.loading ? "is-loading" : "is-ready"
    }`
  )
);

const trendState = computed(() => {
  if (props.trend === null || props.trend === undefined || !Number.isFinite(props.trend)) {
    return null;
  }

  if (props.trend > 0) {
    return {
      type: "up",
      symbol: "+",
      arrow: "▲"
    };
  }

  if (props.trend < 0) {
    return {
      type: "down",
      symbol: "",
      arrow: "▼"
    };
  }

  return {
    type: "flat",
    symbol: "",
    arrow: "•"
  };
});
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <header
      v-if="title || $slots.title"
      :class="partClass('header', 'm-statistic__header')"
      v-bind="partAttrs('header')"
    >
      <slot name="title">
        <h4 :class="partClass('title', 'm-statistic__title')" v-bind="partAttrs('title')">
          {{ title }}
        </h4>
      </slot>
    </header>

    <div
      :class="partClass('body', 'm-statistic__body')"
      v-bind="partAttrs('body')"
    >
      <template v-if="!loading">
        <span
          v-if="prefix || $slots.prefix"
          :class="partClass('prefix', 'm-statistic__prefix')"
          v-bind="partAttrs('prefix')"
        >
          <slot name="prefix">{{ prefix }}</slot>
        </span>

        <strong
          :class="partClass('value', 'm-statistic__value')"
          v-bind="partAttrs('value')"
        >
          {{ displayValue }}
        </strong>

        <span
          v-if="suffix || $slots.suffix"
          :class="partClass('suffix', 'm-statistic__suffix')"
          v-bind="partAttrs('suffix')"
        >
          <slot name="suffix">{{ suffix }}</slot>
        </span>
      </template>

      <span
        v-else
        :class="partClass('skeleton', 'm-statistic__skeleton')"
        v-bind="partAttrs('skeleton')"
      />
    </div>

    <p
      v-if="trendState"
      :class="
        partClass(
          'trend',
          `m-statistic__trend m-statistic__trend--${trendState.type}`
        )
      "
      v-bind="partAttrs('trend')"
    >
      <span>{{ trendState.arrow }}</span>
      <span>{{ trendState.symbol }}{{ trend?.toFixed(2) }}%</span>
    </p>
  </section>
</template>

<style>
.m-statistic {
  --m-statistic-accent: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  inline-size: min(100%, 20rem);
  border: 1px solid color-mix(in srgb, var(--m-statistic-accent) 28%, #3f5770);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(160deg, rgb(255 255 255 / 0.08), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
  padding: 0.76rem 0.8rem;
  display: grid;
  gap: 0.32rem;
}

.m-statistic--success {
  --m-statistic-accent: color-mix(in srgb, #48eba7 82%, white);
}

.m-statistic--warning {
  --m-statistic-accent: color-mix(in srgb, #ffb547 84%, white);
}

.m-statistic--danger {
  --m-statistic-accent: color-mix(in srgb, #ff536f 84%, white);
}

.m-statistic__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.68rem;
  color: color-mix(in srgb, var(--m-statistic-accent) 72%, white);
}

.m-statistic__body {
  display: inline-flex;
  align-items: baseline;
  gap: 0.28rem;
}

.m-statistic__prefix,
.m-statistic__suffix {
  font-size: 0.74rem;
  color: var(--mecha-text-muted);
}

.m-statistic__value {
  font-family: var(--mecha-font-display);
  font-size: clamp(1.2rem, 3.4vw, 1.85rem);
  line-height: 1;
  letter-spacing: 0.03em;
  color: color-mix(in srgb, var(--m-statistic-accent) 86%, white);
}

.m-statistic__skeleton {
  inline-size: min(10rem, 66%);
  block-size: 1.3rem;
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.2) 52%, rgb(255 255 255 / 0.06)),
    color-mix(in srgb, var(--mecha-bg-elevated) 76%, #0f1a2a);
  animation: m-statistic-pulse 1.25s ease-in-out infinite;
}

.m-statistic__trend {
  margin: 0.04rem 0 0;
  display: inline-flex;
  gap: 0.28rem;
  align-items: center;
  font-size: 0.72rem;
  color: var(--mecha-text-muted);
}

.m-statistic__trend--up {
  color: color-mix(in srgb, #48eba7 80%, white);
}

.m-statistic__trend--down {
  color: color-mix(in srgb, #ff536f 84%, white);
}

@keyframes m-statistic-pulse {
  0%,
  100% {
    opacity: 0.56;
  }
  50% {
    opacity: 0.96;
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-statistic__skeleton {
    animation: none;
  }
}
</style>
