<script setup lang="ts">
import { computed, useAttrs, useSlots } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

defineOptions({ inheritAttrs: false });

type CardStatus = "default" | "info" | "success" | "warning" | "danger";
type CardShadow = "always" | "hover" | "never";

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    status?: CardStatus;
    shadow?: CardShadow;
    padding?: string;
    bordered?: boolean;
    interactive?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      action: "click";
      title: string;
      status: CardStatus;
    }>;
  }>(),
  {
    title: "",
    subtitle: "",
    status: "default",
    shadow: "always",
    padding: "0.9rem",
    bordered: true,
    interactive: false,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  click: [event: MouseEvent];
  blocked: [event: MouseEvent];
}>();

const attrs = useAttrs();
const slots = useSlots();
const { partClass, partAttrs } = useMechaComponent("MechaCard", undefined, props.ui);

const hasHeader = computed(
  () =>
    Boolean(
      props.title || props.subtitle || slots.title || slots.subtitle || slots.actions
    )
);

const hasFooter = computed(() => Boolean(slots.footer));

const rootClass = computed(() =>
  partClass(
    "root",
    `m-card m-card--${props.status} m-card--shadow-${props.shadow} ${
      props.bordered ? "has-border" : ""
    } ${props.interactive ? "is-interactive" : ""} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-card-padding": props.padding
}));

const nativeAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

const onClick = async (event: MouseEvent) => {
  if (!props.interactive || props.disabled) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaCard",
      action: "click",
      payload: {
        action: "click",
        title: props.title || "card",
        status: props.status
      }
    },
    async () => emit("click", event)
  );

  if (!success) {
    emit("blocked", event);
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (!props.interactive || props.disabled) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    (event.currentTarget as HTMLElement | null)?.click();
  }
};
</script>

<template>
  <article
    :class="rootClass"
    :style="rootStyle"
    :role="interactive ? 'button' : undefined"
    :tabindex="interactive && !disabled ? 0 : undefined"
    :aria-disabled="(interactive && disabled) || undefined"
    v-bind="partAttrs('root', nativeAttrs as Record<string, unknown>)"
    @click="onClick"
    @keydown="onKeydown"
  >
    <header
      v-if="hasHeader"
      :class="partClass('header', 'm-card__header')"
      v-bind="partAttrs('header')"
    >
      <div :class="partClass('heading', 'm-card__heading')" v-bind="partAttrs('heading')">
        <slot name="title">
          <h3
            v-if="title || $slots.title"
            :class="partClass('title', 'm-card__title')"
            v-bind="partAttrs('title')"
          >
            {{ title }}
          </h3>
        </slot>
        <slot name="subtitle">
          <p
            v-if="subtitle || $slots.subtitle"
            :class="partClass('subtitle', 'm-card__subtitle')"
            v-bind="partAttrs('subtitle')"
          >
            {{ subtitle }}
          </p>
        </slot>
      </div>

      <div
        v-if="$slots.actions"
        :class="partClass('actions', 'm-card__actions')"
        v-bind="partAttrs('actions')"
      >
        <slot name="actions" />
      </div>
    </header>

    <section :class="partClass('body', 'm-card__body')" v-bind="partAttrs('body')">
      <slot />
    </section>

    <footer
      v-if="hasFooter"
      :class="partClass('footer', 'm-card__footer')"
      v-bind="partAttrs('footer')"
    >
      <slot name="footer" />
    </footer>
  </article>
</template>

<style>
.m-card {
  --m-card-padding: 0.9rem;
  --m-card-accent: var(--mecha-accent-cool);
  position: relative;
  display: grid;
  gap: 0;
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.09), transparent 34%),
    linear-gradient(
      to bottom,
      color-mix(in srgb, var(--mecha-bg-soft) 78%, #0d1725),
      color-mix(in srgb, var(--mecha-bg) 92%, #060a11)
    );
  color: var(--mecha-text);
  transition:
    transform var(--mecha-motion-base) ease,
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.m-card.has-border {
  border: 1px solid color-mix(in srgb, var(--m-card-accent) 26%, #374d64);
}

.m-card.m-card--shadow-always {
  box-shadow:
    0 18px 34px rgb(0 0 0 / 0.34),
    0 0 0 1px rgb(255 255 255 / 0.04) inset;
}

.m-card.m-card--shadow-hover {
  box-shadow: 0 8px 18px rgb(0 0 0 / 0.22);
}

.m-card.m-card--shadow-hover:hover {
  box-shadow:
    0 18px 34px rgb(0 0 0 / 0.34),
    0 0 0 1px rgb(255 255 255 / 0.04) inset;
}

.m-card.m-card--shadow-never {
  box-shadow: none;
}

.m-card--default {
  --m-card-accent: var(--mecha-accent-cool);
}

.m-card--info {
  --m-card-accent: #7cb9ff;
}

.m-card--success {
  --m-card-accent: #4ce8aa;
}

.m-card--warning {
  --m-card-accent: var(--mecha-accent);
}

.m-card--danger {
  --m-card-accent: var(--mecha-danger);
}

.m-card.is-interactive {
  cursor: pointer;
}

.m-card.is-interactive:hover:not(.is-disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--m-card-accent) 44%, #4b637b);
}

.m-card.is-interactive:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--m-card-accent) 68%, white);
  outline-offset: 3px;
}

.m-card.is-disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.m-card__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.7rem;
  padding: var(--m-card-padding) var(--m-card-padding) 0.66rem;
}

.m-card__heading {
  min-inline-size: 0;
}

.m-card__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.82rem;
  color: color-mix(in srgb, var(--m-card-accent) 72%, white);
}

.m-card__subtitle {
  margin: 0.28rem 0 0;
  font-size: 0.75rem;
  color: var(--mecha-text-muted);
}

.m-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
}

.m-card__body {
  padding: var(--m-card-padding);
  padding-top: 0.72rem;
  display: grid;
  gap: 0.6rem;
}

.m-card__footer {
  padding: 0.72rem var(--m-card-padding) var(--m-card-padding);
  border-top: 1px solid rgb(255 255 255 / 0.08);
}
</style>
