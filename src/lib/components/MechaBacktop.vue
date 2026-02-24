<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

const props = withDefaults(
  defineProps<{
    visibilityHeight?: number;
    target?: string;
    right?: number | string;
    bottom?: number | string;
    duration?: number;
    behavior?: "smooth" | "auto";
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      from: number;
      to: number;
      target: string;
    }>;
  }>(),
  {
    visibilityHeight: 200,
    target: "",
    right: 1.1,
    bottom: 1.1,
    duration: 360,
    behavior: "smooth",
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  click: [event: MouseEvent];
  change: [visible: boolean];
  blocked: [from: number];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaBacktop", undefined, props.ui);

const visible = ref(false);
let scrollTarget: Window | HTMLElement = window;
let rafHandle: number | undefined;
let animHandle: number | undefined;

const normalizeInset = (value: number | string) =>
  typeof value === "number" ? `${value}rem` : value;

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-backtop-right": normalizeInset(props.right),
  "--m-backtop-bottom": normalizeInset(props.bottom)
}));

const rootClass = computed(() =>
  partClass(
    "root",
    `m-backtop ${visible.value ? "is-visible" : "is-hidden"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const resolveTarget = (): Window | HTMLElement => {
  if (!props.target) {
    return window;
  }

  const element = document.querySelector<HTMLElement>(props.target);
  return element ?? window;
};

const getScrollTop = () => {
  if (scrollTarget === window) {
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  }

  return (scrollTarget as HTMLElement).scrollTop;
};

const setScrollTop = (value: number) => {
  if (scrollTarget === window) {
    window.scrollTo(0, value);
    return;
  }

  (scrollTarget as HTMLElement).scrollTop = value;
};

const updateVisible = () => {
  const next = !props.disabled && getScrollTop() >= props.visibilityHeight;
  if (next !== visible.value) {
    visible.value = next;
    emit("change", next);
    return;
  }

  visible.value = next;
};

const scheduleUpdate = () => {
  if (rafHandle !== undefined) {
    return;
  }

  rafHandle = window.requestAnimationFrame(() => {
    rafHandle = undefined;
    updateVisible();
  });
};

const removeListeners = () => {
  scrollTarget.removeEventListener("scroll", scheduleUpdate);
  if (scrollTarget !== window) {
    window.removeEventListener("scroll", scheduleUpdate);
  }
  window.removeEventListener("resize", scheduleUpdate);
};

const setupListeners = () => {
  removeListeners();
  scrollTarget = resolveTarget();
  scrollTarget.addEventListener("scroll", scheduleUpdate, { passive: true });
  if (scrollTarget !== window) {
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
  }
  window.addEventListener("resize", scheduleUpdate, { passive: true });
};

const stopAnimation = () => {
  if (animHandle !== undefined) {
    window.cancelAnimationFrame(animHandle);
    animHandle = undefined;
  }
};

const animateToTop = (from: number) => {
  stopAnimation();

  if (props.behavior === "smooth" && scrollTarget === window) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (props.behavior === "smooth" && scrollTarget !== window) {
    (scrollTarget as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const duration = Math.max(100, props.duration);
  const start = performance.now();

  const run = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const next = Math.round(from * (1 - eased));
    setScrollTop(next);

    if (progress < 1) {
      animHandle = window.requestAnimationFrame(run);
      return;
    }

    animHandle = undefined;
  };

  animHandle = window.requestAnimationFrame(run);
};

const onClick = async (event: MouseEvent) => {
  if (props.disabled) {
    return;
  }

  emit("click", event);
  const from = getScrollTop();

  if (from <= 0) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaBacktop",
      action: "scroll-top",
      payload: {
        from,
        to: 0,
        target: props.target || "window"
      }
    },
    async () => {
      animateToTop(from);
    }
  );

  if (!success) {
    emit("blocked", from);
  }
};

onMounted(() => {
  setupListeners();
  nextTick(() => scheduleUpdate());
});

onBeforeUnmount(() => {
  removeListeners();
  stopAnimation();
  if (rafHandle !== undefined) {
    window.cancelAnimationFrame(rafHandle);
    rafHandle = undefined;
  }
});

watch(
  () => [props.target, props.visibilityHeight, props.disabled],
  () => {
    setupListeners();
    nextTick(() => scheduleUpdate());
  }
);
</script>

<template>
  <button
    v-show="visible && !disabled"
    type="button"
    :class="rootClass"
    :style="rootStyle"
    v-bind="partAttrs('root')"
    @click="onClick"
  >
    <slot>
      <span :class="partClass('icon', 'm-backtop__icon')" v-bind="partAttrs('icon')">
        ^
      </span>
      <span :class="partClass('label', 'm-backtop__label')" v-bind="partAttrs('label')">
        Top
      </span>
    </slot>
  </button>
</template>

<style>
.m-backtop {
  --m-backtop-right: 1.1rem;
  --m-backtop-bottom: 1.1rem;
  position: fixed;
  right: var(--m-backtop-right);
  bottom: var(--m-backtop-bottom);
  z-index: 56;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 38%, #4a6179);
  border-radius: 10px;
  background:
    linear-gradient(166deg, rgb(255 255 255 / 0.08), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #111f30);
  color: color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
  inline-size: 2.2rem;
  block-size: 2.2rem;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.4);
  transition:
    opacity var(--mecha-motion-fast) ease,
    transform var(--mecha-motion-fast) ease;
}

.m-backtop.is-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
}

.m-backtop.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.m-backtop__icon {
  line-height: 1;
  font-size: 0.9rem;
  font-family: var(--mecha-font-display);
}

.m-backtop__label {
  display: none;
}
</style>
