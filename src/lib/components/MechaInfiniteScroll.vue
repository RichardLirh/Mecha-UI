<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

const props = withDefaults(
  defineProps<{
    height?: string;
    distance?: number;
    delay?: number;
    disabled?: boolean;
    loading?: boolean;
    finished?: boolean;
    immediate?: boolean;
    ui?: MechaComponentUi;
  }>(),
  {
    height: "14rem",
    distance: 80,
    delay: 120,
    disabled: false,
    loading: false,
    finished: false,
    immediate: true,
    ui: undefined
  }
);

const emit = defineEmits<{
  load: [];
  scroll: [payload: { scrollTop: number; clientHeight: number; scrollHeight: number }];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaInfiniteScroll",
  undefined,
  props.ui
);

const viewportRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let lastTriggeredAt = 0;

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-infinite-height": props.height
}));

const checkShouldLoad = () => {
  const viewport = viewportRef.value;
  if (!viewport || props.disabled || props.loading || props.finished) {
    return;
  }

  const { scrollTop, clientHeight, scrollHeight } = viewport;
  const remaining = scrollHeight - (scrollTop + clientHeight);
  const now = Date.now();

  if (remaining > props.distance || now - lastTriggeredAt < props.delay) {
    return;
  }

  lastTriggeredAt = now;
  emit("load");
};

const onScroll = () => {
  const viewport = viewportRef.value;
  if (!viewport) {
    return;
  }

  emit("scroll", {
    scrollTop: viewport.scrollTop,
    clientHeight: viewport.clientHeight,
    scrollHeight: viewport.scrollHeight
  });

  checkShouldLoad();
};

watch(
  () => [props.loading, props.finished, props.disabled],
  () => {
    nextTick(() => checkShouldLoad());
  }
);

onMounted(() => {
  if (props.immediate) {
    nextTick(() => checkShouldLoad());
  }

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => checkShouldLoad());
    if (viewportRef.value) {
      resizeObserver.observe(viewportRef.value);
    }
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <section
    :class="
      partClass(
        'root',
        `m-infinite ${disabled ? 'is-disabled' : ''} ${finished ? 'is-finished' : ''}`
      )
    "
    :style="rootStyle"
    v-bind="partAttrs('root')"
  >
    <div
      ref="viewportRef"
      :class="partClass('viewport', 'm-infinite__viewport')"
      v-bind="partAttrs('viewport')"
      @scroll="onScroll"
    >
      <div :class="partClass('content', 'm-infinite__content')" v-bind="partAttrs('content')">
        <slot />
      </div>

      <div
        v-if="loading"
        :class="partClass('loading', 'm-infinite__loading')"
        v-bind="partAttrs('loading')"
      >
        <slot name="loading">Loading more...</slot>
      </div>

      <div
        v-else-if="finished"
        :class="partClass('finished', 'm-infinite__finished')"
        v-bind="partAttrs('finished')"
      >
        <slot name="finished">No more data</slot>
      </div>

      <div
        v-else
        :class="partClass('placeholder', 'm-infinite__placeholder')"
        v-bind="partAttrs('placeholder')"
      >
        <slot name="placeholder">Scroll down to load more</slot>
      </div>
    </div>
  </section>
</template>

<style>
.m-infinite {
  --m-infinite-height: 14rem;
  inline-size: min(100%, 34rem);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 20%, #3a5068);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 34%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
  overflow: hidden;
}

.m-infinite.is-disabled {
  opacity: 0.62;
}

.m-infinite__viewport {
  block-size: var(--m-infinite-height);
  overflow: auto;
}

.m-infinite__content {
  min-block-size: 100%;
  padding: 0.6rem 0.72rem;
}

.m-infinite__loading,
.m-infinite__finished,
.m-infinite__placeholder {
  border-top: 1px solid rgb(255 255 255 / 0.09);
  padding: 0.44rem 0.72rem 0.5rem;
  font-size: 0.72rem;
  text-align: center;
}

.m-infinite__loading {
  color: color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
}

.m-infinite__finished {
  color: var(--mecha-text-muted);
}

.m-infinite__placeholder {
  color: color-mix(in srgb, var(--mecha-text-muted) 86%, white);
}
</style>
