<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

type TagType = "default" | "success" | "warning" | "danger" | "info";
type TagSize = "sm" | "md";

const props = withDefaults(
  defineProps<{
    label?: string;
    type?: TagType;
    size?: TagSize;
    closable?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    label: "",
    type: "default",
    size: "md",
    closable: false,
    ui: undefined
  }
);

const emit = defineEmits<{
  close: [event: MouseEvent];
  click: [event: MouseEvent];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaTag", undefined, props.ui);

const rootClass = computed(() =>
  partClass("root", `m-tag m-tag--${props.type} m-tag--${props.size}`)
);
</script>

<template>
  <span
    :class="rootClass"
    v-bind="partAttrs('root', { 'data-type': type })"
    @click="emit('click', $event)"
  >
    <span :class="partClass('label', 'm-tag__label')" v-bind="partAttrs('label')">
      <slot>{{ label }}</slot>
    </span>

    <button
      v-if="closable"
      type="button"
      :class="partClass('close', 'm-tag__close')"
      v-bind="partAttrs('close')"
      aria-label="remove tag"
      @click.stop="emit('close', $event)"
    >
      x
    </button>
  </span>
</template>

<style>
.m-tag {
  --m-tag-accent: var(--mecha-accent-cool);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid color-mix(in srgb, var(--m-tag-accent) 46%, #4a6077);
  border-radius: 999px;
  background:
    linear-gradient(164deg, rgb(255 255 255 / 0.14), transparent 38%),
    color-mix(in srgb, var(--mecha-panel-soft) 84%, #101a29);
  color: var(--mecha-text);
  overflow: clip;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.06),
    0 4px 12px rgb(3 10 20 / 0.28);
}

.m-tag::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    112deg,
    transparent 20%,
    rgb(255 255 255 / 0.24) 38%,
    transparent 54%
  );
  opacity: 0.28;
  transform: translateX(-16%);
  transition:
    opacity var(--mecha-motion-fast) ease,
    transform var(--mecha-motion-base) ease;
}

.m-tag:hover::before {
  opacity: 0.44;
  transform: translateX(10%);
}

.m-tag--sm {
  padding: 0.14rem 0.45rem;
  font-size: 0.66rem;
}

.m-tag--md {
  padding: 0.22rem 0.56rem;
  font-size: 0.72rem;
}

.m-tag--default {
  --m-tag-accent: var(--mecha-accent-cool);
}

.m-tag--success {
  --m-tag-accent: #48eba7;
}

.m-tag--warning {
  --m-tag-accent: var(--mecha-accent);
}

.m-tag--danger {
  --m-tag-accent: var(--mecha-danger);
}

.m-tag--info {
  --m-tag-accent: #7ec3ff;
}

.m-tag__label {
  position: relative;
  z-index: 1;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.m-tag__close {
  position: relative;
  z-index: 1;
  border: 0;
  inline-size: 1rem;
  block-size: 1rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.14);
  color: inherit;
  cursor: pointer;
  font-size: 0.68rem;
  line-height: 1;
  display: inline-grid;
  place-items: center;
  transition:
    background var(--mecha-motion-fast) ease,
    transform var(--mecha-motion-fast) ease;
}

.m-tag__close:hover {
  background: rgb(255 255 255 / 0.24);
  transform: rotate(90deg);
}

.m-tag__close:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--m-tag-accent) 72%, white);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .m-tag::before,
  .m-tag__close {
    transition: none !important;
  }
}
</style>
