<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from "vue";
import { ref } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    width?: string;
    height?: string;
    fit?: "cover" | "contain" | "fill";
    radius?: string;
    lazy?: boolean;
    preview?: boolean;
    fallbackText?: string;
    ui?: MechaComponentUi;
  }>(),
  {
    src: "",
    alt: "",
    width: "min(100%, 24rem)",
    height: "14rem",
    fit: "cover",
    radius: "12px",
    lazy: true,
    preview: false,
    fallbackText: "Image unavailable",
    ui: undefined
  }
);

const emit = defineEmits<{
  load: [event: Event];
  error: [event: Event];
  click: [event: MouseEvent];
  "preview-change": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaImage",
  undefined,
  props.ui
);

const failed = ref(false);
const previewOpen = ref(false);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-image ${failed.value ? "is-failed" : "is-ready"} ${
      props.preview ? "is-previewable" : ""
    }`
  )
);

const rootStyle = computed<Record<string, string>>(() => ({
  "--m-image-width": props.width,
  "--m-image-height": props.height,
  "--m-image-radius": props.radius
}));

const hasImage = computed(() => Boolean(props.src) && !failed.value);

const onLoad = (event: Event) => {
  failed.value = false;
  emit("load", event);
};

const onError = (event: Event) => {
  failed.value = true;
  emit("error", event);
};

const openPreview = (event: MouseEvent) => {
  emit("click", event);
  if (!props.preview || !hasImage.value) {
    return;
  }

  previewOpen.value = true;
  emit("preview-change", true);
};

const closePreview = () => {
  if (!previewOpen.value) {
    return;
  }

  previewOpen.value = false;
  emit("preview-change", false);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closePreview();
  }
};

watch(
  () => props.src,
  () => {
    failed.value = false;
    closePreview();
  }
);

watch(previewOpen, (next) => {
  if (next) {
    window.addEventListener("keydown", onKeydown);
  } else {
    window.removeEventListener("keydown", onKeydown);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <figure :class="rootClass" :style="rootStyle" v-bind="partAttrs('root')">
    <img
      v-if="hasImage"
      :src="src"
      :alt="alt || 'image'"
      :loading="lazy ? 'lazy' : 'eager'"
      :style="{ objectFit: fit }"
      :class="partClass('image', 'm-image__image')"
      v-bind="partAttrs('image')"
      @load="onLoad"
      @error="onError"
      @click="openPreview"
    />

    <div
      v-else
      :class="partClass('fallback', 'm-image__fallback')"
      v-bind="partAttrs('fallback')"
    >
      <slot name="fallback">{{ fallbackText }}</slot>
    </div>

    <figcaption
      v-if="$slots.caption"
      :class="partClass('caption', 'm-image__caption')"
      v-bind="partAttrs('caption')"
    >
      <slot name="caption" />
    </figcaption>
  </figure>

  <div
    v-if="previewOpen"
    :class="partClass('preview', 'm-image__preview')"
    v-bind="partAttrs('preview')"
    @click.self="closePreview"
  >
    <img
      :src="src"
      :alt="alt || 'preview image'"
      :class="partClass('preview-image', 'm-image__preview-image')"
      v-bind="partAttrs('preview-image')"
    />
    <button
      type="button"
      :class="partClass('preview-close', 'm-image__preview-close')"
      v-bind="partAttrs('preview-close')"
      @click="closePreview"
    >
      x
    </button>
  </div>
</template>

<style>
.m-image {
  --m-image-width: min(100%, 24rem);
  --m-image-height: 14rem;
  --m-image-radius: 12px;
  inline-size: var(--m-image-width);
  margin: 0;
  display: grid;
  gap: 0.42rem;
}

.m-image__image,
.m-image__fallback {
  inline-size: 100%;
  block-size: var(--m-image-height);
  border-radius: var(--m-image-radius);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #40566f);
}

.m-image__image {
  cursor: default;
  background: color-mix(in srgb, var(--mecha-bg-soft) 80%, #091420);
}

.m-image.is-previewable .m-image__image {
  cursor: zoom-in;
}

.m-image__fallback {
  display: grid;
  place-items: center;
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #081220);
  color: var(--mecha-text-muted);
  font-size: 0.76rem;
}

.m-image__caption {
  margin: 0;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, white);
}

.m-image__preview {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgb(4 8 13 / 0.82);
  display: grid;
  place-items: center;
  padding: 1.2rem;
}

.m-image__preview-image {
  max-inline-size: min(92vw, 72rem);
  max-block-size: 84vh;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #4f6680);
  box-shadow: 0 20px 42px rgb(0 0 0 / 0.54);
}

.m-image__preview-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #4f6680);
  border-radius: 999px;
  background: rgb(0 0 0 / 0.55);
  color: var(--mecha-text);
  cursor: pointer;
}
</style>
