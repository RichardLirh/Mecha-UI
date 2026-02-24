<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

type AvatarShape = "circle" | "rounded" | "square";
type AvatarStatus = "none" | "online" | "busy" | "warning" | "offline";

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    name?: string;
    size?: number | string;
    shape?: AvatarShape;
    fit?: "cover" | "contain";
    status?: AvatarStatus;
    bordered?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    src: "",
    alt: "",
    name: "",
    size: 42,
    shape: "circle",
    fit: "cover",
    status: "none",
    bordered: true,
    ui: undefined
  }
);

const emit = defineEmits<{
  click: [event: MouseEvent];
  load: [event: Event];
  error: [event: Event];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaAvatar",
  undefined,
  props.ui
);

const imageFailed = ref(false);

const normalizeSize = (value: string | number) =>
  typeof value === "number" ? `${value}px` : value;

const hasImage = computed(() => Boolean(props.src) && !imageFailed.value);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-avatar m-avatar--${props.shape} ${props.bordered ? "has-border" : ""} ${
      props.status !== "none" ? "has-status" : ""
    }`
  )
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-avatar-size": normalizeSize(props.size)
}));

const fallbackText = computed(() => {
  const source = (props.name || props.alt).trim();
  if (!source) {
    return "?";
  }

  const tokens = source.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
});

const onLoad = (event: Event) => {
  imageFailed.value = false;
  emit("load", event);
};

const onError = (event: Event) => {
  imageFailed.value = true;
  emit("error", event);
};

watch(
  () => props.src,
  () => {
    imageFailed.value = false;
  }
);
</script>

<template>
  <span
    :class="rootClass"
    :style="rootStyle"
    v-bind="partAttrs('root', { 'data-status': status })"
    @click="emit('click', $event)"
  >
    <img
      v-if="hasImage"
      :src="src"
      :alt="alt || name || 'avatar'"
      :style="{ objectFit: fit }"
      :class="partClass('image', 'm-avatar__image')"
      v-bind="partAttrs('image')"
      @load="onLoad"
      @error="onError"
    />

    <span
      v-else
      :class="partClass('fallback', 'm-avatar__fallback')"
      v-bind="partAttrs('fallback')"
      aria-hidden="true"
    >
      <slot>{{ fallbackText }}</slot>
    </span>

    <span
      v-if="status !== 'none'"
      :class="partClass('status', 'm-avatar__status')"
      v-bind="partAttrs('status')"
      aria-hidden="true"
    />

    <span
      :class="partClass('frame', 'm-avatar__frame')"
      v-bind="partAttrs('frame')"
      aria-hidden="true"
    />
  </span>
</template>

<style>
.m-avatar {
  --m-avatar-size: 42px;
  position: relative;
  display: inline-grid;
  place-items: center;
  inline-size: var(--m-avatar-size);
  block-size: var(--m-avatar-size);
  background:
    radial-gradient(circle at 26% 22%, rgb(255 255 255 / 0.22), transparent 42%),
    linear-gradient(
      155deg,
      color-mix(in srgb, var(--mecha-accent-cool) 24%, #45607a),
      color-mix(in srgb, var(--mecha-bg-soft) 86%, #0d1726)
    );
  color: color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
  overflow: hidden;
  isolation: isolate;
}

.m-avatar--circle {
  border-radius: 999px;
}

.m-avatar--rounded {
  border-radius: 11px;
}

.m-avatar--square {
  border-radius: 5px;
}

.m-avatar.has-border {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 32%, #40566e);
}

.m-avatar__image,
.m-avatar__fallback,
.m-avatar__frame {
  position: absolute;
  inset: 0;
}

.m-avatar__image {
  inline-size: 100%;
  block-size: 100%;
}

.m-avatar__fallback {
  display: grid;
  place-items: center;
  font-family: var(--mecha-font-display);
  font-size: clamp(0.68rem, calc(var(--m-avatar-size) / 2.5), 1rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--mecha-accent-cool) 80%, white);
  text-shadow: 0 0 14px color-mix(in srgb, var(--mecha-accent-cool) 26%, transparent);
}

.m-avatar__status {
  position: absolute;
  right: 2px;
  bottom: 2px;
  inline-size: max(9px, calc(var(--m-avatar-size) / 5.2));
  block-size: max(9px, calc(var(--m-avatar-size) / 5.2));
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--mecha-bg-soft) 90%, #09101a);
  box-shadow: 0 0 10px color-mix(in srgb, currentColor 36%, transparent);
}

.m-avatar[data-status="online"] .m-avatar__status {
  color: #4de5a6;
  background: #4de5a6;
}

.m-avatar[data-status="busy"] .m-avatar__status {
  color: var(--mecha-danger);
  background: var(--mecha-danger);
}

.m-avatar[data-status="warning"] .m-avatar__status {
  color: var(--mecha-accent);
  background: var(--mecha-accent);
}

.m-avatar[data-status="offline"] .m-avatar__status {
  color: #7d8ea3;
  background: #7d8ea3;
  box-shadow: none;
}

.m-avatar__frame {
  pointer-events: none;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.08),
    inset 0 -10px 20px rgb(0 0 0 / 0.22);
}
</style>
