<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    text?: string;
    spinner?: "ring" | "dots";
    fullscreen?: boolean;
    lock?: boolean;
    background?: string;
    zIndex?: number;
    ui?: MechaComponentUi;
  }>(),
  {
    modelValue: false,
    text: "Loading...",
    spinner: "ring",
    fullscreen: false,
    lock: true,
    background: "rgb(6 10 16 / 0.56)",
    zIndex: 74,
    ui: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaLoading", undefined, props.ui);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-loading ${props.fullscreen ? "is-fullscreen" : "is-inline"} ${
      props.modelValue ? "is-active" : "is-idle"
    }`
  )
);

const overlayStyle = computed<Record<string, string>>(() => ({
  "--m-loading-bg": props.background,
  "--m-loading-z": String(props.zIndex)
}));

const onMaskClick = () => {
  if (!props.lock) {
    emit("update:modelValue", false);
  }
};
</script>

<template>
  <div :class="rootClass" v-bind="partAttrs('root')">
    <div :class="partClass('content', 'm-loading__content')" v-bind="partAttrs('content')">
      <slot />
    </div>

    <div
      v-if="modelValue"
      :style="overlayStyle"
      :class="partClass('overlay', 'm-loading__overlay')"
      v-bind="partAttrs('overlay')"
      @click="onMaskClick"
    >
      <div
        :class="partClass('spinner-wrap', 'm-loading__spinner-wrap')"
        v-bind="partAttrs('spinner-wrap')"
      >
        <span
          v-if="spinner === 'ring'"
          :class="partClass('ring', 'm-loading__ring')"
          v-bind="partAttrs('ring')"
        />

        <span
          v-else
          :class="partClass('dots', 'm-loading__dots')"
          v-bind="partAttrs('dots')"
        >
          <i />
          <i />
          <i />
        </span>

        <p :class="partClass('text', 'm-loading__text')" v-bind="partAttrs('text')">
          {{ text }}
        </p>
      </div>
    </div>
  </div>
</template>

<style>
.m-loading {
  position: relative;
  inline-size: 100%;
}

.m-loading.is-fullscreen .m-loading__overlay {
  position: fixed;
  inset: 0;
}

.m-loading.is-inline .m-loading__overlay {
  position: absolute;
  inset: 0;
}

.m-loading__overlay {
  --m-loading-bg: rgb(6 10 16 / 0.56);
  --m-loading-z: 74;
  z-index: var(--m-loading-z);
  background: var(--m-loading-bg);
  display: grid;
  place-items: center;
}

.m-loading__spinner-wrap {
  display: grid;
  justify-items: center;
  gap: 0.34rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 82%, white);
}

.m-loading__ring {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  border-radius: 999px;
  border: 2px solid rgb(255 255 255 / 0.18);
  border-top-color: currentColor;
  animation: m-loading-rotate 0.88s linear infinite;
}

.m-loading__dots {
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
}

.m-loading__dots i {
  inline-size: 0.36rem;
  block-size: 0.36rem;
  border-radius: 999px;
  background: currentColor;
  animation: m-loading-dot 0.9s ease-in-out infinite;
}

.m-loading__dots i:nth-child(2) {
  animation-delay: 0.12s;
}

.m-loading__dots i:nth-child(3) {
  animation-delay: 0.24s;
}

.m-loading__text {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.68rem;
}

@keyframes m-loading-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes m-loading-dot {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.44;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-loading__ring,
  .m-loading__dots i {
    animation: none;
  }
}
</style>
