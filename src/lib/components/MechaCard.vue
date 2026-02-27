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
  isolation: isolate;
  display: grid;
  gap: 0;
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(168deg, rgb(255 255 255 / 0.12), transparent 35%),
    radial-gradient(
      170px 110px at 88% -24px,
      color-mix(in srgb, var(--m-card-accent) 28%, transparent),
      transparent 78%
    ),
    linear-gradient(
      to bottom,
      color-mix(in srgb, var(--mecha-panel-soft) 78%, #101a2a),
      color-mix(in srgb, var(--mecha-bg) 94%, #060b12)
    );
  color: var(--mecha-text);
  overflow: clip;
  transition:
    transform var(--mecha-motion-base) var(--mecha-ease-out),
    border-color var(--mecha-motion-base) var(--mecha-ease-out),
    box-shadow var(--mecha-motion-base) var(--mecha-ease-out);
}

.m-card::before,
.m-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.m-card::before {
  inset: 0;
  border-radius: inherit;
  border: 1px solid color-mix(in srgb, var(--m-card-accent) 22%, transparent);
  opacity: 0.45;
}

.m-card::after {
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(
      112deg,
      transparent 0 16%,
      rgb(255 255 255 / 0.14) 34%,
      transparent 52%
    );
  background-size: 240% 100%;
  opacity: 0.24;
  transform: translateX(-18%);
  transition:
    transform var(--mecha-motion-slow) var(--mecha-ease-out),
    opacity var(--mecha-motion-base) var(--mecha-ease-out);
}

.m-card.has-border {
  border: 1px solid color-mix(in srgb, var(--m-card-accent) 30%, var(--mecha-border));
}

.m-card.m-card--shadow-always {
  box-shadow:
    var(--mecha-shadow-float),
    0 0 0 1px rgb(255 255 255 / 0.04) inset;
}

.m-card.m-card--shadow-hover {
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.26);
}

.m-card.m-card--shadow-hover:hover {
  box-shadow:
    var(--mecha-shadow-float),
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
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--m-card-accent) 52%, #a5c7e8);
  box-shadow:
    0 22px 38px rgb(1 8 18 / 0.5),
    0 0 0 1px color-mix(in srgb, var(--m-card-accent) 34%, transparent) inset;
}

.m-card.is-interactive:hover:not(.is-disabled)::after {
  opacity: 0.5;
  transform: translateX(14%);
}

.m-card.is-interactive:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--m-card-accent) 72%, white);
  outline-offset: 3px;
}

.m-card.is-disabled {
  opacity: 0.56;
  cursor: not-allowed;
  filter: saturate(0.72);
}

.m-card__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.7rem;
  padding: var(--m-card-padding) var(--m-card-padding) 0.7rem;
  border-bottom: 1px solid color-mix(in srgb, var(--m-card-accent) 22%, transparent);
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--m-card-accent) 7%, transparent),
    transparent 72%
  );
}

.m-card__heading {
  min-inline-size: 0;
}

.m-card__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--m-card-accent) 76%, white);
  text-shadow: 0 0 12px color-mix(in srgb, var(--m-card-accent) 28%, transparent);
}

.m-card__subtitle {
  margin: 0.3rem 0 0;
  font-size: 0.74rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, #c6d8ed);
  line-height: 1.4;
}

.m-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
}

.m-card__body {
  padding: var(--m-card-padding);
  padding-top: 0.76rem;
  display: grid;
  gap: 0.62rem;
  font-size: 0.82rem;
  line-height: 1.5;
}

.m-card__footer {
  padding: 0.72rem var(--m-card-padding) var(--m-card-padding);
  border-top: 1px solid color-mix(in srgb, var(--m-card-accent) 20%, transparent);
  background: color-mix(in srgb, var(--m-card-accent) 5%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .m-card,
  .m-card::after {
    transition: none !important;
  }
}
</style>
