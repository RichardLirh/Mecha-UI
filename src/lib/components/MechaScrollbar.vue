<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

const props = withDefaults(
  defineProps<{
    height?: string;
    maxHeight?: string;
    always?: boolean;
    native?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    height: "14rem",
    maxHeight: "",
    always: false,
    native: false,
    ui: undefined
  }
);

const emit = defineEmits<{
  scroll: [payload: { scrollTop: number; scrollLeft: number; clientHeight: number; scrollHeight: number }];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaScrollbar", undefined, props.ui);

const rootRef = ref<HTMLElement | null>(null);
const viewportRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const hover = ref(false);
const dragging = ref(false);
const hasVerticalOverflow = ref(false);
const thumbSize = ref(24);
const thumbOffset = ref(0);

const dragStartY = ref(0);
const dragStartScrollTop = ref(0);

let resizeObserver: ResizeObserver | null = null;

const rootClass = computed(() =>
  partClass(
    "root",
    `m-scrollbar ${props.native ? "is-native" : "is-custom"} ${
      dragging.value ? "is-dragging" : ""
    }`
  )
);

const rootStyle = computed(() => ({
  "--m-scrollbar-height": props.height,
  "--m-scrollbar-max-height": props.maxHeight || "none"
}));

const thumbStyle = computed(() => ({
  height: `${thumbSize.value}px`,
  transform: `translateY(${thumbOffset.value}px)`
}));

const showBar = computed(
  () =>
    !props.native &&
    hasVerticalOverflow.value &&
    (props.always || hover.value || dragging.value)
);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const updateMetrics = () => {
  const viewport = viewportRef.value;
  if (!viewport) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight, scrollLeft } = viewport;
  hasVerticalOverflow.value = scrollHeight > clientHeight + 1;

  if (!hasVerticalOverflow.value) {
    thumbSize.value = 0;
    thumbOffset.value = 0;
  } else {
    const minThumb = 22;
    const size = clamp(
      (clientHeight / scrollHeight) * clientHeight,
      minThumb,
      clientHeight
    );
    const maxOffset = Math.max(0, clientHeight - size);
    const maxScrollTop = Math.max(1, scrollHeight - clientHeight);

    thumbSize.value = size;
    thumbOffset.value = (scrollTop / maxScrollTop) * maxOffset;
  }

  emit("scroll", {
    scrollTop,
    scrollLeft,
    clientHeight,
    scrollHeight
  });
};

const onScroll = () => {
  updateMetrics();
};

const onThumbPointerDown = (event: PointerEvent) => {
  if (!viewportRef.value || props.native || !hasVerticalOverflow.value) {
    return;
  }

  event.preventDefault();
  dragging.value = true;
  dragStartY.value = event.clientY;
  dragStartScrollTop.value = viewportRef.value.scrollTop;

  window.addEventListener("pointermove", onWindowPointerMove);
  window.addEventListener("pointerup", onWindowPointerUp);
};

const onWindowPointerMove = (event: PointerEvent) => {
  const viewport = viewportRef.value;
  if (!viewport || !dragging.value) {
    return;
  }

  const deltaY = event.clientY - dragStartY.value;
  const scrollRange = viewport.scrollHeight - viewport.clientHeight;
  const thumbRange = viewport.clientHeight - thumbSize.value;

  if (thumbRange <= 0) {
    return;
  }

  const scrollDelta = (deltaY / thumbRange) * scrollRange;
  viewport.scrollTop = clamp(
    dragStartScrollTop.value + scrollDelta,
    0,
    scrollRange
  );
  updateMetrics();
};

const onWindowPointerUp = () => {
  dragging.value = false;
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
};

const onTrackPointerDown = (event: PointerEvent) => {
  const viewport = viewportRef.value;
  if (!viewport || props.native) {
    return;
  }

  const track = event.currentTarget as HTMLElement | null;
  if (!track) {
    return;
  }

  const rect = track.getBoundingClientRect();
  const clickY = event.clientY - rect.top;
  const targetOffset = clickY - thumbSize.value / 2;
  const maxThumbOffset = viewport.clientHeight - thumbSize.value;
  const safeOffset = clamp(targetOffset, 0, maxThumbOffset);
  const ratio = maxThumbOffset <= 0 ? 0 : safeOffset / maxThumbOffset;

  viewport.scrollTop = ratio * (viewport.scrollHeight - viewport.clientHeight);
  updateMetrics();
};

watch(
  () => [props.height, props.maxHeight],
  () => {
    nextTick(() => updateMetrics());
  }
);

onMounted(() => {
  nextTick(() => updateMetrics());

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => updateMetrics());
    if (viewportRef.value) {
      resizeObserver.observe(viewportRef.value);
    }
    if (contentRef.value) {
      resizeObserver.observe(contentRef.value);
    }
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
});
</script>

<template>
  <div
    ref="rootRef"
    :class="rootClass"
    :style="rootStyle"
    v-bind="partAttrs('root')"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div
      ref="viewportRef"
      :class="partClass('viewport', 'm-scrollbar__viewport')"
      v-bind="partAttrs('viewport')"
      @scroll="onScroll"
    >
      <div
        ref="contentRef"
        :class="partClass('content', 'm-scrollbar__content')"
        v-bind="partAttrs('content')"
      >
        <slot />
      </div>
    </div>

    <div
      v-if="!native"
      :class="partClass('bar', `m-scrollbar__bar ${showBar ? 'is-visible' : ''}`)"
      v-bind="partAttrs('bar')"
      @pointerdown="onTrackPointerDown"
    >
      <span
        :class="partClass('thumb', 'm-scrollbar__thumb')"
        :style="thumbStyle"
        v-bind="partAttrs('thumb')"
        @pointerdown.stop="onThumbPointerDown"
      />
    </div>
  </div>
</template>

<style>
.m-scrollbar {
  position: relative;
  inline-size: 100%;
  block-size: var(--m-scrollbar-height);
  max-block-size: var(--m-scrollbar-max-height);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 22%, #32475c);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.06), transparent 32%),
    color-mix(in srgb, var(--mecha-bg-soft) 80%, #0b1521);
  overflow: hidden;
}

.m-scrollbar__viewport {
  block-size: 100%;
  overflow: auto;
  padding-right: 0.72rem;
  scrollbar-width: none;
}

.m-scrollbar__viewport::-webkit-scrollbar {
  display: none;
}

.m-scrollbar.is-native .m-scrollbar__viewport {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--mecha-accent-cool) 48%, #44617d)
    color-mix(in srgb, var(--mecha-bg-soft) 74%, #0d1927);
}

.m-scrollbar.is-native .m-scrollbar__viewport::-webkit-scrollbar {
  display: initial;
  width: 8px;
}

.m-scrollbar.is-native .m-scrollbar__viewport::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--mecha-accent-cool) 42%, #3e5a74);
  border-radius: 999px;
}

.m-scrollbar__content {
  min-block-size: 100%;
  padding: 0.72rem;
}

.m-scrollbar__bar {
  position: absolute;
  inset: 0.3rem 0.2rem 0.3rem auto;
  inline-size: 0.46rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  opacity: 0;
  transition: opacity var(--mecha-motion-base) ease;
}

.m-scrollbar__bar.is-visible {
  opacity: 1;
}

.m-scrollbar__thumb {
  position: absolute;
  inset: 0 auto auto 0;
  inline-size: 100%;
  min-block-size: 22px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 44%, #4a6481);
  background:
    linear-gradient(
      150deg,
      color-mix(in srgb, var(--mecha-accent-cool) 58%, white),
      color-mix(in srgb, var(--mecha-accent) 28%, #1e4056)
    );
  box-shadow: 0 0 12px color-mix(in srgb, var(--mecha-accent-cool) 24%, transparent);
  cursor: grab;
}

.m-scrollbar.is-dragging .m-scrollbar__thumb {
  cursor: grabbing;
}
</style>
