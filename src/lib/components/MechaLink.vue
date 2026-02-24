<script setup lang="ts">
import { computed, useAttrs } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

defineOptions({ inheritAttrs: false });

type LinkTone = "default" | "cool" | "hot" | "danger" | "success" | "muted";
type LinkUnderline = "always" | "hover" | "none";

const props = withDefaults(
  defineProps<{
    href?: string;
    label?: string;
    target?: string;
    rel?: string;
    tone?: LinkTone;
    underline?: LinkUnderline;
    external?: boolean;
    disabled?: boolean;
    block?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      href: string | undefined;
      target: string | undefined;
      external: boolean;
    }>;
  }>(),
  {
    href: "#",
    label: "",
    target: "",
    rel: "",
    tone: "default",
    underline: "hover",
    external: false,
    disabled: false,
    block: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  click: [event: MouseEvent];
  blocked: [event: MouseEvent];
}>();

const attrs = useAttrs();
const { partClass, partAttrs } = useMechaComponent("MechaLink", undefined, props.ui);

const resolvedTarget = computed(() => {
  if (props.target) {
    return props.target;
  }
  return props.external ? "_blank" : "";
});

const resolvedRel = computed(() => {
  if (props.rel) {
    return props.rel;
  }
  return resolvedTarget.value === "_blank" ? "noopener noreferrer" : "";
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-link m-link--${props.tone} m-link--u-${props.underline} ${
      props.block ? "is-block" : ""
    } ${props.disabled ? "is-disabled" : ""}`
  )
);

const displayText = computed(() => props.label || props.href || "");

const nativeAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const onClick = async (event: MouseEvent) => {
  if (props.disabled || !props.href) {
    event.preventDefault();
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaLink",
      action: "click",
      payload: {
        href: props.href,
        target: resolvedTarget.value || undefined,
        external: props.external
      }
    },
    async () => emit("click", event)
  );

  if (!success) {
    event.preventDefault();
    emit("blocked", event);
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (!props.disabled) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
  }
};
</script>

<template>
  <a
    :href="disabled ? undefined : href || undefined"
    :target="resolvedTarget || undefined"
    :rel="resolvedRel || undefined"
    :tabindex="disabled ? -1 : undefined"
    :aria-disabled="disabled || undefined"
    :class="rootClass"
    v-bind="partAttrs('root', nativeAttrs as Record<string, unknown>)"
    @click="onClick"
    @keydown="onKeydown"
  >
    <span
      v-if="$slots.leading"
      :class="partClass('leading', 'm-link__leading')"
      v-bind="partAttrs('leading')"
      aria-hidden="true"
    >
      <slot name="leading" />
    </span>

    <span :class="partClass('text', 'm-link__text')" v-bind="partAttrs('text')">
      <slot>{{ displayText }}</slot>
    </span>

    <span
      v-if="$slots.trailing"
      :class="partClass('trailing', 'm-link__trailing')"
      v-bind="partAttrs('trailing')"
      aria-hidden="true"
    >
      <slot name="trailing" />
    </span>
    <span
      v-else-if="external"
      :class="partClass('external', 'm-link__external')"
      v-bind="partAttrs('external')"
      aria-hidden="true"
    >
      ^
    </span>
  </a>
</template>

<style>
.m-link {
  --m-link-accent: var(--mecha-accent-cool);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  color: var(--m-link-accent);
  text-decoration: none;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.74rem;
  line-height: 1.2;
  transition:
    color var(--mecha-motion-fast) ease,
    filter var(--mecha-motion-fast) ease;
}

.m-link.is-block {
  display: flex;
  inline-size: 100%;
}

.m-link--default {
  --m-link-accent: var(--mecha-accent-cool);
}

.m-link--cool {
  --m-link-accent: #7dd9ff;
}

.m-link--hot {
  --m-link-accent: var(--mecha-accent);
}

.m-link--danger {
  --m-link-accent: var(--mecha-danger);
}

.m-link--success {
  --m-link-accent: #48eba7;
}

.m-link--muted {
  --m-link-accent: color-mix(in srgb, var(--mecha-text-muted) 92%, #9fb4cb);
}

.m-link::after {
  content: "";
  position: absolute;
  inset: auto 0 -2px;
  block-size: 1px;
  background: currentColor;
  transform-origin: left;
  transform: scaleX(0);
  transition: transform var(--mecha-motion-fast) ease;
}

.m-link.m-link--u-always::after {
  transform: scaleX(1);
}

.m-link.m-link--u-hover:hover::after,
.m-link.m-link--u-hover:focus-visible::after {
  transform: scaleX(1);
}

.m-link.m-link--u-none::after {
  display: none;
}

.m-link:hover:not(.is-disabled),
.m-link:focus-visible:not(.is-disabled) {
  color: color-mix(in srgb, var(--m-link-accent) 82%, white);
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--m-link-accent) 26%, transparent));
}

.m-link:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--m-link-accent) 76%, white);
  outline-offset: 3px;
  border-radius: 4px;
}

.m-link.is-disabled {
  opacity: 0.46;
  cursor: not-allowed;
  filter: saturate(0.7);
}

.m-link__text {
  min-inline-size: 0;
}

.m-link__external {
  font-size: 0.66rem;
  line-height: 1;
}
</style>
