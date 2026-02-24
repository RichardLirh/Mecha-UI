<script setup lang="ts">
import { computed, ref } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type ButtonVariant = "solid" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    label?: string;
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<MouseEvent>;
  }>(),
  {
    label: "",
    type: "button",
    variant: "solid",
    size: "md",
    loading: false,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  click: [event: MouseEvent];
  blocked: [event: MouseEvent];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaButton",
  undefined,
  props.ui
);

const pointer = ref({ x: 50, y: 50 });
const tilt = ref({ x: 0, y: 0 });
const isPressed = ref(false);
const pulseTick = ref(0);

const isDisabled = computed(() => props.disabled || props.loading);
const rootClass = computed(() =>
  partClass(
    "root",
    `m-button m-button--${props.variant} m-button--${props.size} ${
      isPressed.value ? "is-pressed" : ""
    }`
  )
);

const rootStyle = computed(() => ({
  "--m-btn-x": `${pointer.value.x}%`,
  "--m-btn-y": `${pointer.value.y}%`,
  "--m-btn-tilt-x": `${tilt.value.x}deg`,
  "--m-btn-tilt-y": `${tilt.value.y}deg`
}));

const onPointerMove = (event: PointerEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) {
    return;
  }

  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }

  pointer.value = {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
  };

  const nx = (event.clientX - rect.left) / rect.width;
  const ny = (event.clientY - rect.top) / rect.height;

  tilt.value = {
    x: (0.5 - ny) * 8,
    y: (nx - 0.5) * 10
  };
};

const resetPointer = () => {
  pointer.value = { x: 50, y: 50 };
  tilt.value = { x: 0, y: 0 };
  isPressed.value = false;
};

const onPointerDown = (event: PointerEvent) => {
  if (isDisabled.value) {
    return;
  }

  isPressed.value = true;
  pulseTick.value += 1;
  onPointerMove(event);
};

const onPointerUp = () => {
  isPressed.value = false;
};

const onClick = async (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault();
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaButton",
      action: "click",
      payload: event
    },
    async () => emit("click", event)
  );

  if (!success) {
    emit("blocked", event);
  }
};
</script>

<template>
  <button
    :class="rootClass"
    :style="rootStyle"
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    v-bind="partAttrs('root', { 'data-variant': variant })"
    @click="onClick"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="resetPointer"
    @pointerleave="resetPointer"
    @pointermove="onPointerMove"
  >
    <span :class="partClass('frame', 'm-button__frame')" v-bind="partAttrs('frame')" />
    <span :class="partClass('orbit', 'm-button__orbit')" v-bind="partAttrs('orbit')" />
    <span :class="partClass('scan', 'm-button__scan')" v-bind="partAttrs('scan')" />
    <span
      :key="pulseTick"
      :class="partClass('shockwave', 'm-button__shockwave')"
      v-bind="partAttrs('shockwave')"
    />

    <span :class="partClass('surface', 'm-button__surface')" v-bind="partAttrs('surface')">
      <span
        v-if="$slots.leading"
        :class="partClass('leading', 'm-button__leading')"
        v-bind="partAttrs('leading')"
      >
        <slot name="leading" />
      </span>

      <span :class="partClass('label', 'm-button__label')" v-bind="partAttrs('label')">
        <slot>{{ label }}</slot>
      </span>

      <span
        v-if="loading"
        :class="partClass('loader', 'm-button__loader')"
        v-bind="partAttrs('loader')"
      />

      <span
        v-else-if="$slots.trailing"
        :class="partClass('trailing', 'm-button__trailing')"
        v-bind="partAttrs('trailing')"
      >
        <slot name="trailing" />
      </span>
    </span>

    <span :class="partClass('corners', 'm-button__corners')" v-bind="partAttrs('corners')" />
  </button>
</template>

<style>
.m-button {
  --m-btn-x: 50%;
  --m-btn-y: 50%;
  --m-btn-tilt-x: 0deg;
  --m-btn-tilt-y: 0deg;
  --m-btn-corner-round: 11px;
  --m-btn-hot: var(--mecha-accent);
  --m-btn-cold: var(--mecha-accent-cool);
  position: relative;
  isolation: isolate;
  display: inline-grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--mecha-text);
  padding: 0;
  cursor: pointer;
  transform-style: preserve-3d;
  transform: perspective(980px) rotateX(var(--m-btn-tilt-x)) rotateY(var(--m-btn-tilt-y));
  filter: drop-shadow(0 6px 14px rgb(0 0 0 / 0.38));
  transition:
    transform 180ms cubic-bezier(0.2, 0.76, 0.22, 1),
    filter var(--mecha-motion-base) ease;
}

.m-button::before,
.m-button::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.m-button::before {
  z-index: 0;
  inset: -10% -8%;
  background:
    radial-gradient(
      220px 110px at 50% 54%,
      color-mix(in srgb, var(--m-btn-cold) 20%, white) 0%,
      color-mix(in srgb, var(--m-btn-hot) 16%, transparent) 38%,
      transparent 76%
    );
  filter: blur(7px);
  opacity: 0.18;
  transform: scale(0.94);
  transition:
    opacity var(--mecha-motion-base) ease,
    transform var(--mecha-motion-base) ease;
}

.m-button::after {
  z-index: 0;
  inset: -26% -16%;
  background: radial-gradient(
    180px circle at var(--m-btn-x) var(--m-btn-y),
    rgb(255 255 255 / 0.14),
    transparent 72%
  );
  opacity: 0.2;
  transition: opacity var(--mecha-motion-base) ease;
}

.m-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 76%, white);
  outline-offset: 3px;
}

.m-button:disabled {
  cursor: not-allowed;
  opacity: 0.54;
  filter: saturate(0.64);
}

.m-button:not(:disabled):hover {
  transform:
    perspective(980px)
    translateY(-2px)
    scale(1.018)
    rotateX(var(--m-btn-tilt-x))
    rotateY(var(--m-btn-tilt-y));
  filter:
    drop-shadow(0 12px 22px rgb(0 0 0 / 0.52))
    drop-shadow(0 0 10px color-mix(in srgb, var(--m-btn-cold) 16%, transparent));
}

.m-button:not(:disabled):hover::before {
  opacity: 0.32;
  transform: scale(1);
}

.m-button:not(:disabled):hover::after {
  opacity: 0.32;
}

.m-button.is-pressed:not(:disabled) {
  transform:
    perspective(980px)
    translateY(1px)
    scale(0.986)
    rotateX(var(--m-btn-tilt-x))
    rotateY(var(--m-btn-tilt-y));
  filter:
    drop-shadow(0 6px 12px rgb(0 0 0 / 0.56))
    drop-shadow(0 0 8px color-mix(in srgb, var(--m-btn-hot) 14%, transparent));
}

.m-button.is-pressed:not(:disabled)::before {
  opacity: 0.24;
  transform: scale(0.94);
}

.m-button__frame,
.m-button__orbit,
.m-button__scan,
.m-button__shockwave,
.m-button__corners {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 0 var(--m-btn-corner-round) 0 var(--m-btn-corner-round);
  z-index: 1;
}

.m-button__frame {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, transparent);
  background: linear-gradient(
    to bottom,
    rgb(255 255 255 / 0.06),
    transparent 34%,
    rgb(0 0 0 / 0.22)
  );
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.07),
    0 0 0 1px rgb(9 15 24 / 0.95),
    0 6px 12px rgb(0 0 0 / 0.22);
}

.m-button__frame::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.m-button__frame::before {
  inset: 2px;
  border: 1px solid color-mix(in srgb, var(--m-btn-cold) 24%, transparent);
  opacity: 0.4;
}

.m-button__orbit {
  display: none;
}

.m-button__scan {
  z-index: 2;
  overflow: hidden;
  opacity: 0.58;
}

.m-button__scan::before,
.m-button__scan::after {
  content: "";
  position: absolute;
}

.m-button__scan::before {
  inset: -24% 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 39%,
    color-mix(in srgb, var(--m-btn-cold) 30%, white) 48%,
    color-mix(in srgb, var(--m-btn-hot) 14%, transparent) 54%,
    transparent 66%,
    transparent 100%
  );
  transform: translateY(-92%);
  animation: mecha-scan 2.8s cubic-bezier(0.24, 0.65, 0.29, 1) infinite;
}

.m-button__scan::after {
  inset: 0;
  background:
    repeating-linear-gradient(
      118deg,
      transparent 0 14px,
      color-mix(in srgb, var(--m-btn-cold) 18%, transparent) 14px 15px,
      transparent 15px 24px
    ),
    linear-gradient(
      108deg,
      transparent 0%,
      color-mix(in srgb, var(--m-btn-hot) 28%, transparent) 49%,
      transparent 100%
    );
  background-size: 180% 100%, 100% 100%;
  opacity: 0.24;
  animation: mecha-diagonal 4.4s linear infinite;
}

.m-button__shockwave {
  z-index: 4;
  opacity: 0;
  animation: mecha-shock 620ms cubic-bezier(0.1, 0.82, 0.21, 1) both;
}

.m-button__shockwave::before,
.m-button__shockwave::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.m-button__shockwave::before {
  inset: -5%;
  border-radius: inherit;
  background: radial-gradient(
    220px circle at var(--m-btn-x) var(--m-btn-y),
    rgb(255 255 255 / 0.58),
    color-mix(in srgb, var(--m-btn-cold) 48%, white) 16%,
    color-mix(in srgb, var(--m-btn-hot) 36%, transparent) 31%,
    transparent 58%
  );
  mix-blend-mode: screen;
}

.m-button__shockwave::after {
  inset: -12%;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg at var(--m-btn-x) var(--m-btn-y),
    transparent 0%,
    color-mix(in srgb, var(--m-btn-cold) 72%, white) 18%,
    transparent 36%,
    transparent 56%,
    color-mix(in srgb, var(--m-btn-hot) 66%, white) 71%,
    transparent 88%,
    transparent 100%
  );
  -webkit-mask: radial-gradient(
    circle at var(--m-btn-x) var(--m-btn-y),
    transparent 0 32%,
    #000 38%,
    transparent 54%
  );
  mask: radial-gradient(
    circle at var(--m-btn-x) var(--m-btn-y),
    transparent 0 32%,
    #000 38%,
    transparent 54%
  );
  animation: mecha-shock-ring 620ms cubic-bezier(0.1, 0.82, 0.21, 1) both;
}

.m-button__surface {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 8rem;
  margin: 2px;
  border-radius: 0 calc(var(--m-btn-corner-round) - 2px) 0 calc(var(--m-btn-corner-round) - 2px);
  border: 1px solid rgb(255 255 255 / 0.13);
  clip-path: none;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transform: translateZ(0);
  transition:
    transform var(--mecha-motion-fast) ease,
    filter var(--mecha-motion-fast) ease,
    box-shadow var(--mecha-motion-base) ease;
  overflow: hidden;
}

.m-button:not(:disabled):hover .m-button__surface {
  transform: translateZ(10px);
}

.m-button.is-pressed:not(:disabled) .m-button__surface {
  transform: translateZ(2px) scale(0.992);
  filter: saturate(1.15);
}

.m-button__surface::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      170px circle at var(--m-btn-x) var(--m-btn-y),
      rgb(255 255 255 / 0.62),
      transparent 62%
    ),
    linear-gradient(
      116deg,
      transparent 15%,
      rgb(255 255 255 / 0.32) 34%,
      transparent 48%
    );
  mix-blend-mode: screen;
  opacity: 0.34;
  transform: translateX(-2%);
  transition:
    opacity var(--mecha-motion-base) ease,
    transform var(--mecha-motion-fast) ease,
    filter var(--mecha-motion-base) ease;
}

.m-button:hover .m-button__surface::before {
  opacity: 0.52;
  transform: translateX(1%);
}

.m-button.is-pressed .m-button__surface::before {
  transform: scale(1.08);
  filter: brightness(1.08);
}

.m-button__surface::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      to bottom,
      rgb(255 255 255 / 0.08) 0 1px,
      transparent 1px 3px
    ),
    linear-gradient(
      106deg,
      transparent 8%,
      color-mix(in srgb, var(--m-btn-cold) 42%, transparent) 33%,
      transparent 48%,
      transparent 56%,
      color-mix(in srgb, var(--m-btn-hot) 36%, transparent) 70%,
      transparent 82%
    ),
    linear-gradient(
      to bottom,
      rgb(255 255 255 / 0.1),
      transparent 30%,
      rgb(0 0 0 / 0.38)
    );
  background-size: 100% 100%, 220% 100%, 100% 100%;
  opacity: 0.34;
  animation: mecha-energy-flow 2.6s linear infinite;
}

.m-button__label,
.m-button__leading,
.m-button__trailing,
.m-button__loader {
  position: relative;
  z-index: 2;
  transform: translateZ(12px);
}

.m-button__label {
  font-weight: 700;
  font-size: 0.83rem;
  color: color-mix(in srgb, var(--mecha-text) 94%, white);
  text-shadow:
    0 1px 0 rgb(0 0 0 / 0.45),
    0 0 10px rgb(0 0 0 / 0.44);
  transition:
    transform var(--mecha-motion-fast) ease,
    text-shadow var(--mecha-motion-base) ease;
}

.m-button:not(:disabled):hover .m-button__label {
  transform: translateY(-0.5px) translateZ(13px);
  text-shadow:
    0 1px 0 rgb(0 0 0 / 0.5),
    0 0 9px color-mix(in srgb, var(--m-btn-cold) 26%, transparent);
}

.m-button.is-pressed:not(:disabled) .m-button__label {
  transform: translateY(1px) translateZ(8px);
}

.m-button__loader {
  inline-size: 0.96rem;
  block-size: 0.96rem;
  border-radius: 999px;
  background:
    conic-gradient(
      from 0deg,
      transparent 0 12%,
      rgb(255 255 255 / 0.94) 21%,
      color-mix(in srgb, var(--m-btn-cold) 56%, white) 64%,
      transparent 94%
    );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px));
  animation: mecha-spin 0.68s linear infinite;
}

.m-button__corners {
  border-radius: 0;
  z-index: 4;
  mix-blend-mode: screen;
}

.m-button__corners::before,
.m-button__corners::after {
  content: "";
  position: absolute;
  inline-size: 0.78rem;
  block-size: 0.78rem;
  border-color: color-mix(in srgb, var(--m-btn-cold) 78%, white);
  border-style: solid;
  opacity: 0.6;
  box-shadow: 0 0 8px color-mix(in srgb, var(--m-btn-cold) 28%, transparent);
}

.m-button__corners::before {
  inset: 1px auto auto 1px;
  border-width: 1px 0 0 1px;
}

.m-button__corners::after {
  inset: auto 1px 1px auto;
  border-width: 0 1px 1px 0;
}

.m-button--sm .m-button__surface {
  min-width: 6.7rem;
  padding: 0.5rem 0.82rem;
}

.m-button--md .m-button__surface {
  min-width: 8.1rem;
  padding: 0.7rem 1.08rem;
}

.m-button--lg .m-button__surface {
  min-width: 10.2rem;
  padding: 0.88rem 1.42rem;
}

.m-button--solid {
  --m-btn-hot: var(--mecha-accent);
  --m-btn-cold: var(--mecha-accent-cool);
}

.m-button--ghost {
  --m-btn-hot: #8cc6ff;
  --m-btn-cold: #50ebff;
}

.m-button--danger {
  --m-btn-hot: var(--mecha-danger);
  --m-btn-cold: #ff9444;
}

.m-button--solid .m-button__surface {
  background:
    linear-gradient(
      136deg,
      color-mix(in srgb, var(--mecha-accent) 88%, #ffecc8) 0%,
      color-mix(in srgb, var(--mecha-accent-cool) 54%, #0b2638) 46%,
      #050b14 100%
    );
  box-shadow:
    0 12px 28px rgb(0 0 0 / 0.52),
    0 0 26px color-mix(in srgb, var(--mecha-accent-cool) 34%, transparent),
    inset 0 0 18px rgb(255 255 255 / 0.12);
}

.m-button--ghost .m-button__surface {
  background:
    linear-gradient(
      136deg,
      color-mix(in srgb, var(--mecha-bg-elevated) 88%, #16263a) 0%,
      color-mix(in srgb, var(--mecha-bg-soft) 75%, #0a1320) 100%
    );
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--m-btn-cold) 44%, transparent),
    inset 0 10px 20px rgb(255 255 255 / 0.05),
    0 10px 24px rgb(0 0 0 / 0.42);
}

.m-button--danger .m-button__surface {
  background:
    linear-gradient(
      136deg,
      color-mix(in srgb, var(--mecha-danger) 88%, #ffdfe3) 0%,
      color-mix(in srgb, #ff8726 50%, #341018) 58%,
      #17070b 100%
    );
  box-shadow:
    0 14px 30px rgb(26 0 4 / 0.56),
    0 0 22px rgb(255 67 90 / 0.45),
    inset 0 0 18px rgb(255 255 255 / 0.08);
}

@keyframes mecha-spin {
  to {
    transform: rotate(1turn);
  }
}

@keyframes mecha-scan {
  0% {
    transform: translateY(-92%);
    opacity: 0;
  }
  18% {
    opacity: 0.82;
  }
  58% {
    opacity: 0.58;
  }
  100% {
    transform: translateY(92%);
    opacity: 0;
  }
}

@keyframes mecha-diagonal {
  0% {
    background-position: -130% 0, 0 0;
  }
  100% {
    background-position: 160% 0, 0 0;
  }
}

@keyframes mecha-shock {
  0% {
    opacity: 0.96;
    transform: scale(0.62);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

@keyframes mecha-shock-ring {
  0% {
    opacity: 0.9;
    transform: scale(0.45) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(1.24) rotate(36deg);
  }
}

@keyframes mecha-energy-flow {
  0% {
    background-position: 0 0, -120% 0, 0 0;
  }
  100% {
    background-position: 0 0, 150% 0, 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-button,
  .m-button * {
    transition: none !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
