<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type CarouselSource = "next" | "prev" | "dot" | "auto" | "keyboard";

export interface MechaCarouselItem {
  id?: string | number;
  title?: string;
  description?: string;
  image?: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    items?: MechaCarouselItem[];
    autoplay?: boolean;
    interval?: number;
    loop?: boolean;
    pauseOnHover?: boolean;
    showArrows?: boolean;
    showDots?: boolean;
    height?: string;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: number;
      next: number;
      source: CarouselSource;
    }>;
  }>(),
  {
    modelValue: 0,
    items: () => [],
    autoplay: false,
    interval: 3400,
    loop: true,
    pauseOnHover: true,
    showArrows: true,
    showDots: true,
    height: "13.5rem",
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
  change: [value: number];
  blocked: [value: number];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaCarousel",
  undefined,
  props.ui
);

const hover = ref(false);
const localIndex = ref(props.modelValue);
let timer: number | undefined;

const fallbackItems: MechaCarouselItem[] = [
  {
    id: "fallback",
    title: "No Slides",
    description: "Provide `items` to render carousel panels."
  }
];

const normalizedItems = computed<MechaCarouselItem[]>(() =>
  props.items.length ? props.items : fallbackItems
);

const count = computed(() => normalizedItems.value.length);

const normalizeIndex = (value: number) => {
  const safeCount = count.value;
  if (safeCount <= 0) {
    return 0;
  }

  if (!props.loop) {
    return Math.min(safeCount - 1, Math.max(0, value));
  }

  return ((value % safeCount) + safeCount) % safeCount;
};

const currentIndex = computed(() => normalizeIndex(localIndex.value));

const rootClass = computed(() =>
  partClass(
    "root",
    `m-carousel ${props.disabled ? "is-disabled" : ""} ${
      hover.value ? "is-hover" : ""
    }`
  )
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-carousel-height": props.height
}));

const trackStyle = computed(() => ({
  transform: `translateX(-${currentIndex.value * 100}%)`
}));

const shouldAutoplay = computed(
  () =>
    props.autoplay &&
    count.value > 1 &&
    !props.disabled &&
    (!props.pauseOnHover || !hover.value)
);

const isDotActive = (index: number) => currentIndex.value === index;

const isDisabledItem = (index: number) =>
  Boolean(normalizedItems.value[index]?.disabled);

const findByDirection = (step: 1 | -1) => {
  const safeCount = count.value;
  if (safeCount <= 1) {
    return currentIndex.value;
  }

  const current = currentIndex.value;

  for (let i = 1; i <= safeCount; i += 1) {
    const raw = current + step * i;
    let candidate = raw;

    if (props.loop) {
      candidate = normalizeIndex(raw);
    } else if (candidate < 0 || candidate >= safeCount) {
      break;
    }

    if (!isDisabledItem(candidate)) {
      return candidate;
    }
  }

  return current;
};

const commit = async (nextRaw: number, source: CarouselSource) => {
  if (props.disabled) {
    return;
  }

  const current = currentIndex.value;
  const next = normalizeIndex(nextRaw);

  if (next === current || isDisabledItem(next)) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaCarousel",
      action: source,
      payload: { current, next, source }
    },
    async () => {
      localIndex.value = next;
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", current);
  }
};

const goPrev = (source: CarouselSource) => {
  void commit(findByDirection(-1), source);
};

const goNext = (source: CarouselSource) => {
  void commit(findByDirection(1), source);
};

const selectDot = (index: number) => {
  void commit(index, "dot");
};

const stopTimer = () => {
  if (timer !== undefined) {
    window.clearInterval(timer);
    timer = undefined;
  }
};

const startTimer = () => {
  stopTimer();
  if (!shouldAutoplay.value) {
    return;
  }

  timer = window.setInterval(() => {
    goNext("auto");
  }, Math.max(600, props.interval));
};

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    goNext("keyboard");
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goPrev("keyboard");
  }
};

watch(
  () => props.modelValue,
  (next) => {
    localIndex.value = normalizeIndex(next);
  }
);

watch(count, () => {
  localIndex.value = normalizeIndex(localIndex.value);
});

watch(shouldAutoplay, () => {
  startTimer();
});

onMounted(() => {
  startTimer();
});

onBeforeUnmount(() => {
  stopTimer();
});
</script>

<template>
  <section
    :class="rootClass"
    :style="rootStyle"
    tabindex="0"
    v-bind="partAttrs('root')"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @keydown="onKeydown"
  >
    <div :class="partClass('viewport', 'm-carousel__viewport')" v-bind="partAttrs('viewport')">
      <div
        :class="partClass('track', 'm-carousel__track')"
        :style="trackStyle"
        v-bind="partAttrs('track')"
      >
        <article
          v-for="(item, index) in normalizedItems"
          :key="item.id ?? index"
          :class="
            partClass(
              'slide',
              `m-carousel__slide ${index === currentIndex ? 'is-active' : ''} ${
                item.disabled ? 'is-disabled' : ''
              }`
            )
          "
          :aria-hidden="index !== currentIndex"
          v-bind="partAttrs('slide', { 'data-index': index })"
        >
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.title || `slide-${index + 1}`"
            :class="partClass('media', 'm-carousel__media')"
            v-bind="partAttrs('media')"
          />

          <div
            :class="partClass('content', 'm-carousel__content')"
            v-bind="partAttrs('content')"
          >
            <slot name="slide" :item="item" :index="index" :active="index === currentIndex">
              <h4
                :class="partClass('title', 'm-carousel__title')"
                v-bind="partAttrs('title')"
              >
                {{ item.title || `Slide ${index + 1}` }}
              </h4>
              <p
                :class="partClass('description', 'm-carousel__description')"
                v-bind="partAttrs('description')"
              >
                {{ item.description || "No description" }}
              </p>
            </slot>
          </div>
        </article>
      </div>
    </div>

    <div
      v-if="showArrows && count > 1"
      :class="partClass('controls', 'm-carousel__controls')"
      v-bind="partAttrs('controls')"
    >
      <button
        type="button"
        :disabled="disabled"
        :class="partClass('prev', 'm-carousel__arrow m-carousel__arrow--prev')"
        v-bind="partAttrs('prev')"
        @click="goPrev('prev')"
      >
        &lt;
      </button>
      <button
        type="button"
        :disabled="disabled"
        :class="partClass('next', 'm-carousel__arrow m-carousel__arrow--next')"
        v-bind="partAttrs('next')"
        @click="goNext('next')"
      >
        &gt;
      </button>
    </div>

    <div
      v-if="showDots && count > 1"
      :class="partClass('dots', 'm-carousel__dots')"
      v-bind="partAttrs('dots')"
    >
      <button
        v-for="(_, index) in normalizedItems"
        :key="`dot-${index}`"
        type="button"
        :disabled="disabled || isDisabledItem(index)"
        :class="
          partClass(
            'dot',
            `m-carousel__dot ${isDotActive(index) ? 'is-active' : ''}`
          )
        "
        :aria-label="`slide ${index + 1}`"
        v-bind="partAttrs('dot', { 'data-index': index })"
        @click="selectDot(index)"
      />
    </div>
  </section>
</template>

<style>
.m-carousel {
  --m-carousel-height: 13.5rem;
  position: relative;
  inline-size: min(100%, 40rem);
  display: grid;
  gap: 0.55rem;
}

.m-carousel.is-disabled {
  opacity: 0.62;
}

.m-carousel:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  outline-offset: 4px;
  border-radius: 10px;
}

.m-carousel__viewport {
  overflow: hidden;
  block-size: var(--m-carousel-height);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3f556f);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 34%),
    color-mix(in srgb, var(--mecha-bg-soft) 86%, #08121d);
  box-shadow: 0 16px 28px rgb(0 0 0 / 0.34);
}

.m-carousel__track {
  display: flex;
  inline-size: 100%;
  block-size: 100%;
  transition: transform var(--mecha-motion-base) ease;
}

.m-carousel__slide {
  position: relative;
  inline-size: 100%;
  min-inline-size: 100%;
  block-size: 100%;
  display: grid;
  align-items: end;
  overflow: hidden;
}

.m-carousel__slide::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgb(0 0 0 / 0.66), transparent 58%),
    radial-gradient(500px 180px at 78% -20%, rgb(32 214 255 / 0.12), transparent 66%);
}

.m-carousel__media {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.m-carousel__content {
  position: relative;
  z-index: 1;
  padding: 0.82rem 0.9rem;
}

.m-carousel__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.82rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-carousel__description {
  margin: 0.36rem 0 0;
  font-size: 0.76rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 86%, white);
}

.m-carousel__controls {
  position: absolute;
  inset: auto 0.66rem 0.66rem auto;
  z-index: 2;
  display: inline-flex;
  gap: 0.28rem;
}

.m-carousel__arrow {
  inline-size: 1.42rem;
  block-size: 1.42rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, #4b617a);
  border-radius: 8px;
  background: rgb(0 0 0 / 0.46);
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  cursor: pointer;
}

.m-carousel__arrow:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.m-carousel__dots {
  display: inline-flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.34rem;
}

.m-carousel__dot {
  inline-size: 0.66rem;
  block-size: 0.66rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 26%, #4a617a);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.1);
  cursor: pointer;
  transition:
    transform var(--mecha-motion-fast) ease,
    background var(--mecha-motion-fast) ease;
}

.m-carousel__dot.is-active {
  transform: scale(1.15);
  background: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-carousel__dot:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
</style>
