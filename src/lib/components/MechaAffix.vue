<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

const props = withDefaults(
  defineProps<{
    offsetTop?: number;
    target?: string;
    zIndex?: number;
    disabled?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    offsetTop: 0,
    target: "",
    zIndex: 48,
    disabled: false,
    ui: undefined
  }
);

const emit = defineEmits<{
  change: [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaAffix", undefined, props.ui);

const placeholderRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const affixed = ref(false);
const metrics = ref({
  width: 0,
  left: 0,
  height: 0
});

let scrollTarget: Window | HTMLElement = window;
let rafHandle: number | undefined;
let resizeObserver: ResizeObserver | null = null;

const rootClass = computed(() =>
  partClass(
    "root",
    `m-affix ${affixed.value ? "is-affixed" : "is-normal"} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const placeholderStyle = computed<Record<string, string>>(() => {
  if (!affixed.value) {
    return {} as Record<string, string>;
  }

  return {
    height: `${metrics.value.height}px`
  };
});

const contentStyle = computed<Record<string, string>>(() => {
  if (!affixed.value) {
    return {} as Record<string, string>;
  }

  return {
    position: "fixed",
    top: `${props.offsetTop}px`,
    left: `${metrics.value.left}px`,
    width: `${metrics.value.width}px`,
    zIndex: `${props.zIndex}`
  };
});

const resolveTarget = (): Window | HTMLElement => {
  if (!props.target) {
    return window;
  }

  const element = document.querySelector<HTMLElement>(props.target);
  return element ?? window;
};

const updateState = () => {
  if (!placeholderRef.value || !contentRef.value) {
    return;
  }

  const rect = placeholderRef.value.getBoundingClientRect();
  const nextAffixed = !props.disabled && rect.top <= props.offsetTop;

  metrics.value = {
    width: rect.width,
    left: rect.left,
    height: contentRef.value.offsetHeight
  };

  if (nextAffixed !== affixed.value) {
    affixed.value = nextAffixed;
    emit("change", nextAffixed);
    return;
  }

  affixed.value = nextAffixed;
};

const scheduleUpdate = () => {
  if (rafHandle !== undefined) {
    return;
  }

  rafHandle = window.requestAnimationFrame(() => {
    rafHandle = undefined;
    updateState();
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

onMounted(() => {
  setupListeners();
  nextTick(() => scheduleUpdate());

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => scheduleUpdate());
    if (placeholderRef.value) {
      resizeObserver.observe(placeholderRef.value);
    }
    if (contentRef.value) {
      resizeObserver.observe(contentRef.value);
    }
  }
});

onBeforeUnmount(() => {
  removeListeners();
  resizeObserver?.disconnect();
  if (rafHandle !== undefined) {
    window.cancelAnimationFrame(rafHandle);
    rafHandle = undefined;
  }
});

watch(
  () => [props.target, props.offsetTop, props.disabled],
  () => {
    setupListeners();
    nextTick(() => scheduleUpdate());
  }
);
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <div
      ref="placeholderRef"
      :class="partClass('placeholder', 'm-affix__placeholder')"
      :style="placeholderStyle"
      v-bind="partAttrs('placeholder')"
    >
      <div
        ref="contentRef"
        :class="partClass('content', 'm-affix__content')"
        :style="contentStyle"
        v-bind="partAttrs('content')"
      >
        <slot />
      </div>
    </div>
  </section>
</template>

<style>
.m-affix {
  inline-size: 100%;
}

.m-affix.is-disabled {
  opacity: 0.6;
}

.m-affix__placeholder {
  inline-size: 100%;
}

.m-affix__content {
  inline-size: 100%;
}
</style>
