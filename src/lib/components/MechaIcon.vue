<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

type IconTone = "default" | "cool" | "hot" | "success" | "danger" | "muted";

interface IconGlyph {
  paths: string[];
  filled?: boolean;
}

const glyphMap: Record<string, IconGlyph> = {
  radar: {
    paths: [
      "M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0",
      "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",
      "M12 12L20 7"
    ]
  },
  bolt: {
    filled: true,
    paths: ["M13 2 4.2 13.2h5.3L8.8 22 19.8 10.3h-5.4L13 2Z"]
  },
  shield: {
    paths: ["M12 2 4.5 5.2V11c0 5.2 3.4 8.4 7.5 11 4.1-2.6 7.5-5.8 7.5-11V5.2L12 2Z"]
  },
  target: {
    paths: [
      "M12 3v3m0 12v3m9-9h-3M6 12H3m2.3-6.7 2.1 2.1m9.2 9.2 2.1 2.1m0-13.4-2.1 2.1m-9.2 9.2-2.1 2.1",
      "M12 12m-4.2 0a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0",
      "M12 12m-1.1 0a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0"
    ]
  },
  command: {
    paths: [
      "M12 2 3 7l9 5 9-5-9-5Z",
      "m3 10-3 1.7L3 10m18 0-3 1.7M12 12v10"
    ]
  },
  sync: {
    paths: [
      "M20 7v5h-5",
      "M4 17v-5h5",
      "M6.3 8.3a7 7 0 0 1 11.1-1.4L20 9",
      "M17.7 15.7a7 7 0 0 1-11.1 1.4L4 15"
    ]
  },
  check: {
    paths: ["M20 6 9 17 4 12"]
  },
  close: {
    paths: ["M18 6 6 18M6 6l12 12"]
  }
};

const fallbackGlyph: IconGlyph = {
  paths: [
    "M6 6h12v12H6z",
    "M8.5 8.5l7 7m0-7-7 7"
  ]
};

const props = withDefaults(
  defineProps<{
    name?: string;
    size?: string | number;
    strokeWidth?: number;
    tone?: IconTone;
    spin?: boolean;
    pulse?: boolean;
    framed?: boolean;
    filled?: boolean;
    label?: string;
    decorative?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    name: "radar",
    size: 20,
    strokeWidth: 1.8,
    tone: "default",
    spin: false,
    pulse: false,
    framed: false,
    filled: undefined,
    label: "",
    decorative: false,
    ui: undefined
  }
);

const { partClass, partAttrs } = useMechaComponent("MechaIcon", undefined, props.ui);

const normalizeSize = (value: string | number) =>
  typeof value === "number" ? `${value}px` : value;

const resolvedGlyph = computed(() => glyphMap[props.name] ?? fallbackGlyph);
const useFill = computed(() => props.filled ?? resolvedGlyph.value.filled ?? false);
const isDecorative = computed(() => props.decorative || !props.label);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-icon m-icon--${props.tone} ${props.framed ? "is-framed" : ""} ${
      props.spin ? "is-spin" : ""
    } ${props.pulse ? "is-pulse" : ""}`
  )
);

const rootStyle = computed(() => ({
  "--m-icon-size": normalizeSize(props.size)
}));

const pathAttrs = computed(() => ({
  fill: useFill.value ? "currentColor" : "none",
  stroke: useFill.value ? "none" : "currentColor",
  "stroke-width": useFill.value ? undefined : props.strokeWidth,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));
</script>

<template>
  <span
    :class="rootClass"
    :style="rootStyle"
    :role="isDecorative ? undefined : 'img'"
    :aria-hidden="isDecorative || undefined"
    :aria-label="isDecorative ? undefined : label"
    v-bind="partAttrs('root', { 'data-icon': name, 'data-tone': tone })"
  >
    <span
      v-if="framed"
      :class="partClass('frame', 'm-icon__frame')"
      v-bind="partAttrs('frame')"
      aria-hidden="true"
    />
    <span
      :class="partClass('glow', 'm-icon__glow')"
      v-bind="partAttrs('glow')"
      aria-hidden="true"
    />
    <svg
      viewBox="0 0 24 24"
      :class="partClass('svg', 'm-icon__svg')"
      v-bind="partAttrs('svg')"
      aria-hidden="true"
    >
      <slot>
        <path
          v-for="(path, index) in resolvedGlyph.paths"
          :key="`${name}:${index}`"
          :d="path"
          :class="partClass('path', 'm-icon__path')"
          v-bind="partAttrs('path', pathAttrs)"
        />
      </slot>
    </svg>
  </span>
</template>

<style>
.m-icon {
  --m-icon-size: 20px;
  --m-icon-tone: var(--mecha-accent-cool);
  position: relative;
  display: inline-grid;
  place-items: center;
  inline-size: var(--m-icon-size);
  block-size: var(--m-icon-size);
  color: var(--m-icon-tone);
  isolation: isolate;
}

.m-icon--default {
  --m-icon-tone: var(--mecha-accent-cool);
}

.m-icon--cool {
  --m-icon-tone: #7bdcff;
}

.m-icon--hot {
  --m-icon-tone: var(--mecha-accent);
}

.m-icon--success {
  --m-icon-tone: #48eba7;
}

.m-icon--danger {
  --m-icon-tone: var(--mecha-danger);
}

.m-icon--muted {
  --m-icon-tone: color-mix(in srgb, var(--mecha-text-muted) 90%, #a8bdd4);
}

.m-icon__frame,
.m-icon__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.m-icon__frame {
  border: 1px solid color-mix(in srgb, var(--m-icon-tone) 40%, #4a6076);
  border-radius: 6px;
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.1), transparent 45%),
    color-mix(in srgb, var(--mecha-bg-soft) 80%, #101b2a);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.06);
}

.m-icon__glow {
  inset: 14%;
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in srgb, var(--m-icon-tone) 26%, transparent),
    transparent 72%
  );
  filter: blur(4px);
  opacity: 0.9;
}

.m-icon__svg {
  inline-size: 76%;
  block-size: 76%;
  filter:
    drop-shadow(0 0 7px color-mix(in srgb, var(--m-icon-tone) 26%, transparent))
    drop-shadow(0 2px 3px rgb(0 0 0 / 0.35));
}

.m-icon.is-framed .m-icon__svg {
  inline-size: 62%;
  block-size: 62%;
}

.m-icon.is-spin .m-icon__svg {
  animation: m-icon-spin 1400ms linear infinite;
}

.m-icon.is-pulse .m-icon__glow {
  animation: m-icon-pulse 1700ms ease-in-out infinite;
}

@keyframes m-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes m-icon-pulse {
  0%,
  100% {
    opacity: 0.42;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-icon.is-spin .m-icon__svg,
  .m-icon.is-pulse .m-icon__glow {
    animation: none;
  }
}
</style>
