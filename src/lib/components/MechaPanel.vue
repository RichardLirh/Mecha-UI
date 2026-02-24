<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type PanelStatus = "idle" | "active" | "warning" | "offline";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    status?: PanelStatus;
    collapsible?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean }>;
  }>(),
  {
    subtitle: "",
    status: "idle",
    collapsible: false,
    open: undefined,
    defaultOpen: true,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  toggle: [value: boolean];
  blocked: [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaPanel",
  undefined,
  props.ui
);
const isControlled = computed(() => props.open !== undefined);
const localOpen = ref(props.defaultOpen);

watch(
  () => props.open,
  (value) => {
    if (value !== undefined) {
      localOpen.value = value;
    }
  }
);

const isOpen = computed<boolean>(() =>
  isControlled.value ? Boolean(props.open) : localOpen.value
);

const toggle = async () => {
  if (!props.collapsible) {
    return;
  }

  const next = !isOpen.value;
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaPanel",
      action: "toggle",
      payload: { current: Boolean(isOpen.value), next }
    },
    async () => {
      if (!isControlled.value) {
        localOpen.value = next;
      }
      emit("update:open", next);
      emit("toggle", next);
    }
  );

  if (!success) {
    emit("blocked", Boolean(isOpen.value));
  }
};
</script>

<template>
  <section
    :class="partClass('root', `m-panel m-panel--${status}`)"
    v-bind="partAttrs('root', { 'data-status': status })"
  >
    <header
      :class="
        partClass(
          'header',
          `m-panel__header ${collapsible ? 'is-collapsible' : ''}`
        )
      "
      v-bind="partAttrs('header')"
      @click="collapsible && toggle()"
    >
      <div :class="partClass('heading', 'm-panel__heading')" v-bind="partAttrs('heading')">
        <slot name="title">
          <h3 :class="partClass('title', 'm-panel__title')" v-bind="partAttrs('title')">
            {{ title }}
          </h3>
        </slot>
        <p
          v-if="subtitle || $slots.subtitle"
          :class="partClass('subtitle', 'm-panel__subtitle')"
          v-bind="partAttrs('subtitle')"
        >
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>

      <div :class="partClass('controls', 'm-panel__controls')" v-bind="partAttrs('controls')">
        <span
          :class="partClass('status', 'm-panel__status-indicator')"
          v-bind="partAttrs('status')"
        />
        <button
          v-if="collapsible"
          type="button"
          :class="partClass('toggle', 'm-panel__toggle')"
          v-bind="partAttrs('toggle')"
          :aria-expanded="isOpen"
          :aria-label="isOpen ? 'Collapse panel' : 'Expand panel'"
          @click.stop="toggle"
        >
          {{ isOpen ? "Collapse" : "Expand" }}
        </button>
      </div>
    </header>

    <transition name="m-panel-fold">
      <div
        v-show="isOpen"
        :class="partClass('body', 'm-panel__body')"
        v-bind="partAttrs('body')"
      >
        <slot />
      </div>
    </transition>

    <footer
      v-if="$slots.footer"
      :class="partClass('footer', 'm-panel__footer')"
      v-bind="partAttrs('footer')"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>

<style>
.m-panel {
  position: relative;
  border-radius: var(--mecha-radius-lg);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 22%, #253748);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.07), transparent 26%),
    linear-gradient(
      to bottom,
      color-mix(in srgb, var(--mecha-bg-soft) 78%, #12161e),
      color-mix(in srgb, var(--mecha-bg) 92%, black)
    );
  box-shadow:
    0 34px 78px rgb(0 0 0 / 0.44),
    0 0 0 1px rgb(255 255 255 / 0.04) inset;
  overflow: clip;
}

.m-panel::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  block-size: 1px;
  background: linear-gradient(90deg, transparent, var(--mecha-accent-cool), transparent);
  opacity: 0.46;
}

.m-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem 0.9rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.06);
}

.m-panel__header.is-collapsible {
  cursor: pointer;
}

.m-panel__heading {
  min-inline-size: 0;
}

.m-panel__title {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-family: var(--mecha-font-display);
  font-weight: 600;
}

.m-panel__subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--mecha-text-muted);
}

.m-panel__controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.m-panel__status-indicator {
  inline-size: 0.62rem;
  block-size: 0.62rem;
  border-radius: 999px;
  box-shadow: 0 0 18px currentColor;
}

.m-panel--idle .m-panel__status-indicator {
  color: var(--mecha-accent-cool);
  background: var(--mecha-accent-cool);
}

.m-panel--active .m-panel__status-indicator {
  color: #4dffae;
  background: #4dffae;
}

.m-panel--warning .m-panel__status-indicator {
  color: var(--mecha-accent);
  background: var(--mecha-accent);
}

.m-panel--offline .m-panel__status-indicator {
  color: #7f8ba0;
  background: #7f8ba0;
  box-shadow: none;
}

.m-panel__toggle {
  border: 0;
  background: transparent;
  color: var(--mecha-text-muted);
  font-family: var(--mecha-font-body);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  font-size: 0.76rem;
}

.m-panel__toggle:hover {
  color: var(--mecha-text);
}

.m-panel__body {
  padding: 1rem 1.1rem 1.2rem;
}

.m-panel__footer {
  padding: 0.8rem 1.1rem 1rem;
  border-top: 1px solid rgb(255 255 255 / 0.06);
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--mecha-accent-cool) 10%, transparent),
    transparent
  );
}

.m-panel-fold-enter-active,
.m-panel-fold-leave-active {
  transition: all var(--mecha-motion-base) ease;
  transform-origin: top;
}

.m-panel-fold-enter-from,
.m-panel-fold-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
}
</style>
