<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

export interface MechaPageHeaderCrumb {
  label: string;
  to?: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    crumbs?: MechaPageHeaderCrumb[];
    showBack?: boolean;
    backText?: string;
    compact?: boolean;
    bordered?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      action: "back";
      title: string;
    }>;
  }>(),
  {
    title: "",
    subtitle: "",
    crumbs: () => [],
    showBack: false,
    backText: "Back",
    compact: false,
    bordered: true,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  back: [event: MouseEvent];
  blocked: [event: MouseEvent];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaPageHeader",
  undefined,
  props.ui
);

const hasMeta = computed(
  () =>
    Boolean(
      props.title || props.subtitle || props.crumbs.length || props.showBack
    )
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-page-header ${props.compact ? "is-compact" : ""} ${
      props.bordered ? "is-bordered" : ""
    } ${props.disabled ? "is-disabled" : ""}`
  )
);

const onBack = async (event: MouseEvent) => {
  if (props.disabled) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaPageHeader",
      action: "back",
      payload: {
        action: "back",
        title: props.title || "page-header"
      }
    },
    async () => emit("back", event)
  );

  if (!success) {
    emit("blocked", event);
  }
};
</script>

<template>
  <header :class="rootClass" v-bind="partAttrs('root')">
    <nav
      v-if="crumbs.length || $slots.breadcrumb"
      aria-label="breadcrumb"
      :class="partClass('breadcrumb', 'm-page-header__breadcrumb')"
      v-bind="partAttrs('breadcrumb')"
    >
      <slot name="breadcrumb">
        <ol class="m-page-header__crumb-list">
          <li
            v-for="(crumb, index) in crumbs"
            :key="`${crumb.label}:${index}`"
            class="m-page-header__crumb-node"
          >
            <span
              :class="partClass('crumb', 'm-page-header__crumb')"
              v-bind="partAttrs('crumb', { 'data-index': index })"
            >
              {{ crumb.label }}
            </span>
            <span
              v-if="index < crumbs.length - 1"
              :class="partClass('separator', 'm-page-header__separator')"
              v-bind="partAttrs('separator')"
              aria-hidden="true"
            >
              /
            </span>
          </li>
        </ol>
      </slot>
    </nav>

    <div
      v-if="hasMeta || $slots.default || $slots.extra"
      :class="partClass('main', 'm-page-header__main')"
      v-bind="partAttrs('main')"
    >
      <button
        v-if="showBack || $slots.back"
        type="button"
        :disabled="disabled"
        :class="partClass('back', 'm-page-header__back')"
        v-bind="partAttrs('back')"
        @click="onBack"
      >
        <slot name="back">
          <span aria-hidden="true">&lt;</span>
          <span>{{ backText }}</span>
        </slot>
      </button>

      <div
        :class="partClass('heading', 'm-page-header__heading')"
        v-bind="partAttrs('heading')"
      >
        <slot name="title">
          <h2
            v-if="title || $slots.title"
            :class="partClass('title', 'm-page-header__title')"
            v-bind="partAttrs('title')"
          >
            {{ title }}
          </h2>
        </slot>

        <slot name="subtitle">
          <p
            v-if="subtitle || $slots.subtitle"
            :class="partClass('subtitle', 'm-page-header__subtitle')"
            v-bind="partAttrs('subtitle')"
          >
            {{ subtitle }}
          </p>
        </slot>

        <div
          v-if="$slots.default"
          :class="partClass('content', 'm-page-header__content')"
          v-bind="partAttrs('content')"
        >
          <slot />
        </div>
      </div>

      <div
        v-if="$slots.extra"
        :class="partClass('extra', 'm-page-header__extra')"
        v-bind="partAttrs('extra')"
      >
        <slot name="extra" />
      </div>
    </div>
  </header>
</template>

<style>
.m-page-header {
  display: grid;
  gap: 0.48rem;
  inline-size: min(100%, 42rem);
  padding: 0.82rem 0.92rem;
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
}

.m-page-header.is-bordered {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3d5570);
}

.m-page-header.is-compact {
  gap: 0.34rem;
  padding: 0.64rem 0.72rem;
}

.m-page-header.is-disabled {
  opacity: 0.58;
}

.m-page-header__breadcrumb {
  display: inline-flex;
}

.m-page-header__crumb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.2rem;
}

.m-page-header__crumb-node {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.m-page-header__crumb {
  font-size: 0.7rem;
  color: var(--mecha-text-muted);
}

.m-page-header__separator {
  font-size: 0.66rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 82%, white);
}

.m-page-header__main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.62rem;
}

.m-page-header__back {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #48607b);
  border-radius: 9px;
  background: rgb(255 255 255 / 0.03);
  color: var(--mecha-text);
  font-size: 0.74rem;
  min-block-size: 1.9rem;
  padding: 0.34rem 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
  cursor: pointer;
}

.m-page-header__back:disabled {
  cursor: not-allowed;
}

.m-page-header__heading {
  min-inline-size: 0;
  display: grid;
  gap: 0.3rem;
}

.m-page-header__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.84rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
}

.m-page-header__subtitle {
  margin: 0;
  font-size: 0.76rem;
  color: var(--mecha-text-muted);
}

.m-page-header__content {
  margin-top: 0.08rem;
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--mecha-text) 90%, #dbeeff);
}

.m-page-header__extra {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.34rem;
}

@media (max-width: 760px) {
  .m-page-header__main {
    grid-template-columns: 1fr;
  }

  .m-page-header__extra {
    justify-content: flex-start;
  }
}
</style>
