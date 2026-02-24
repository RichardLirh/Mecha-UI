<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

interface ColorPayload {
  color: string;
  alpha: number;
}

interface HsvColor {
  h: number;
  s: number;
  v: number;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    alpha?: number;
    showAlpha?: boolean;
    presets?: string[];
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: ColorPayload;
      next: ColorPayload;
      source: string;
    }>;
  }>(),
  {
    modelValue: "#20d6ff",
    alpha: 1,
    showAlpha: true,
    presets: () => ["#20d6ff", "#ff7a18", "#48eba7", "#ff435a", "#8aa8ff", "#ffffff"],
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:alpha": [value: number];
  change: [value: ColorPayload];
  blocked: [value: ColorPayload];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaColorPickerPanel",
  undefined,
  props.ui
);

const panelRef = ref<HTMLElement | null>(null);
const dragging = ref(false);
const isFocused = ref(false);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");

const rgbToHex = (r: number, g: number, b: number) =>
  `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();

const hexToRgb = (hex: string) => {
  const sanitized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(sanitized)) {
    return null;
  }

  const full =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : sanitized;

  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHsv = (r: number, g: number, b: number): HsvColor => {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;

  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === nr) {
      h = ((ng - nb) / delta) % 6;
    } else if (max === ng) {
      h = (nb - nr) / delta + 2;
    } else {
      h = (nr - ng) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return { h, s, v };
};

const hsvToRgb = (h: number, s: number, v: number) => {
  const hs = clamp(h, 0, 360);
  const ss = clamp(s, 0, 100) / 100;
  const vv = clamp(v, 0, 100) / 100;

  const c = vv * ss;
  const x = c * (1 - Math.abs(((hs / 60) % 2) - 1));
  const m = vv - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hs < 60) {
    r = c;
    g = x;
  } else if (hs < 120) {
    r = x;
    g = c;
  } else if (hs < 180) {
    g = c;
    b = x;
  } else if (hs < 240) {
    g = x;
    b = c;
  } else if (hs < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255
  };
};

const parseModelColor = (value: string): HsvColor => {
  const rgb = hexToRgb(value) ?? hexToRgb("#20d6ff");
  if (!rgb) {
    return { h: 190, s: 87, v: 100 };
  }
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
};

const initial = parseModelColor(props.modelValue);

const hue = ref(initial.h);
const saturation = ref(initial.s);
const value = ref(initial.v);
const alphaRef = ref(clamp(props.alpha, 0, 1));
const hexInput = ref(props.modelValue.toUpperCase());

const currentHex = computed(() => {
  const rgb = hsvToRgb(hue.value, saturation.value, value.value);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
});

const currentPayload = computed<ColorPayload>(() => ({
  color: currentHex.value,
  alpha: alphaRef.value
}));

const panelStyle = computed(() => ({
  backgroundColor: `hsl(${hue.value} 100% 50%)`
}));

const cursorStyle = computed(() => ({
  left: `${saturation.value}%`,
  top: `${100 - value.value}%`
}));

const previewStyle = computed(() => ({
  "--m-color-preview-rgb": currentHex.value,
  backgroundColor: `rgb(from ${currentHex.value} r g b / ${alphaRef.value})`
}));

const rootClass = computed(() =>
  partClass(
    "root",
    `m-color-panel ${props.disabled ? "is-disabled" : ""} ${
      dragging.value ? "is-dragging" : ""
    } ${isFocused.value ? "is-focused" : ""}`
  )
);

const syncFromModel = () => {
  const parsed = parseModelColor(props.modelValue);
  hue.value = parsed.h;
  saturation.value = parsed.s;
  value.value = parsed.v;
  alphaRef.value = clamp(props.alpha, 0, 1);
  hexInput.value = props.modelValue.toUpperCase();
};

const commit = async (source: string) => {
  const next = currentPayload.value;
  const current = {
    color: props.modelValue.toUpperCase(),
    alpha: clamp(props.alpha, 0, 1)
  };

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaColorPickerPanel",
      action: source,
      payload: {
        current,
        next,
        source
      }
    },
    async () => {
      emit("update:modelValue", next.color);
      emit("update:alpha", next.alpha);
      emit("change", next);
    }
  );

  if (!success) {
    syncFromModel();
    emit("blocked", current);
    return;
  }

  hexInput.value = next.color;
};

const applyPanelPosition = (clientX: number, clientY: number) => {
  const panel = panelRef.value;
  if (!panel || props.disabled) {
    return;
  }

  const rect = panel.getBoundingClientRect();
  const px = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  const py = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);

  saturation.value = px;
  value.value = 100 - py;
  hexInput.value = currentHex.value;
};

const onPanelPointerDown = (event: PointerEvent) => {
  if (props.disabled) {
    return;
  }

  event.preventDefault();
  dragging.value = true;
  applyPanelPosition(event.clientX, event.clientY);

  window.addEventListener("pointermove", onWindowPointerMove);
  window.addEventListener("pointerup", onWindowPointerUp);
};

const onWindowPointerMove = (event: PointerEvent) => {
  if (!dragging.value) {
    return;
  }
  applyPanelPosition(event.clientX, event.clientY);
};

const onWindowPointerUp = () => {
  if (!dragging.value) {
    return;
  }
  dragging.value = false;
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
  void commit("panel");
};

const onHueInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  hue.value = clamp(Number(target.value), 0, 360);
  hexInput.value = currentHex.value;
  void commit("hue");
};

const onAlphaInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  alphaRef.value = clamp(Number(target.value), 0, 1);
  void commit("alpha");
};

const onPresetClick = (preset: string) => {
  if (props.disabled) {
    return;
  }

  const parsed = parseModelColor(preset);
  hue.value = parsed.h;
  saturation.value = parsed.s;
  value.value = parsed.v;
  hexInput.value = preset.toUpperCase();
  void commit("preset");
};

const onHexChange = () => {
  if (props.disabled) {
    return;
  }

  const rgb = hexToRgb(hexInput.value);
  if (!rgb) {
    hexInput.value = currentHex.value;
    return;
  }

  const parsed = rgbToHsv(rgb.r, rgb.g, rgb.b);
  hue.value = parsed.h;
  saturation.value = parsed.s;
  value.value = parsed.v;
  hexInput.value = rgbToHex(rgb.r, rgb.g, rgb.b);
  void commit("hex");
};

watch(
  () => props.modelValue,
  () => syncFromModel()
);

watch(
  () => props.alpha,
  (next) => {
    alphaRef.value = clamp(next, 0, 1);
  }
);

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
});
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <header :class="partClass('header', 'm-color-panel__header')" v-bind="partAttrs('header')">
      <span
        :class="partClass('preview', 'm-color-panel__preview')"
        :style="previewStyle"
        v-bind="partAttrs('preview')"
      />
      <div :class="partClass('meta', 'm-color-panel__meta')" v-bind="partAttrs('meta')">
        <strong :class="partClass('hex', 'm-color-panel__hex')" v-bind="partAttrs('hex')">
          {{ currentHex }}
        </strong>
        <small :class="partClass('alpha-text', 'm-color-panel__alpha-text')" v-bind="partAttrs('alpha-text')">
          Alpha {{ Math.round(alphaRef * 100) }}%
        </small>
      </div>
    </header>

    <div
      ref="panelRef"
      :class="partClass('canvas', 'm-color-panel__canvas')"
      :style="panelStyle"
      v-bind="partAttrs('canvas')"
      @pointerdown="onPanelPointerDown"
    >
      <span
        :class="partClass('cursor', 'm-color-panel__cursor')"
        :style="cursorStyle"
        v-bind="partAttrs('cursor')"
      />
    </div>

    <div :class="partClass('controls', 'm-color-panel__controls')" v-bind="partAttrs('controls')">
      <label :class="partClass('row', 'm-color-panel__row')" v-bind="partAttrs('hue-row')">
        <span :class="partClass('label', 'm-color-panel__label')" v-bind="partAttrs('hue-label')">
          Hue
        </span>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          :value="hue"
          :disabled="disabled"
          :class="partClass('hue', 'm-color-panel__hue')"
          v-bind="partAttrs('hue')"
          @input="onHueInput"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
      </label>

      <label
        v-if="showAlpha"
        :class="partClass('row', 'm-color-panel__row')"
        v-bind="partAttrs('alpha-row')"
      >
        <span :class="partClass('label', 'm-color-panel__label')" v-bind="partAttrs('alpha-label')">
          Alpha
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="alphaRef"
          :disabled="disabled"
          :class="partClass('alpha', 'm-color-panel__alpha')"
          v-bind="partAttrs('alpha')"
          @input="onAlphaInput"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
      </label>
    </div>

    <div :class="partClass('presets', 'm-color-panel__presets')" v-bind="partAttrs('presets')">
      <button
        v-for="preset in presets"
        :key="preset"
        type="button"
        :disabled="disabled"
        :class="
          partClass(
            'preset',
            `m-color-panel__preset ${
              currentHex.toUpperCase() === preset.toUpperCase() ? 'is-active' : ''
            }`
          )
        "
        :style="{ '--m-color-preset': preset }"
        v-bind="partAttrs('preset', { 'data-color': preset })"
        @click="onPresetClick(preset)"
      />
    </div>

    <label :class="partClass('hex-input-row', 'm-color-panel__hex-row')" v-bind="partAttrs('hex-input-row')">
      <span :class="partClass('label', 'm-color-panel__label')" v-bind="partAttrs('hex-input-label')">
        Hex
      </span>
      <input
        v-model="hexInput"
        :disabled="disabled"
        maxlength="7"
        :class="partClass('hex-input', 'm-color-panel__hex-input')"
        v-bind="partAttrs('hex-input')"
        @change="onHexChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </label>
  </section>
</template>

<style>
.m-color-panel {
  display: grid;
  gap: 0.72rem;
  inline-size: min(100%, 18.8rem);
  padding: 0.74rem;
  border-radius: var(--mecha-radius-md);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 22%, #34485e);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 32%),
    color-mix(in srgb, var(--mecha-bg-soft) 82%, #0b1623);
  box-shadow: 0 12px 24px rgb(0 0 0 / 0.3);
}

.m-color-panel.is-disabled {
  opacity: 0.6;
}

.m-color-panel__header {
  display: flex;
  align-items: center;
  gap: 0.62rem;
}

.m-color-panel__preview {
  inline-size: 2rem;
  block-size: 2rem;
  border-radius: 9px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 36%, #4a627d);
  background-image:
    linear-gradient(45deg, rgb(255 255 255 / 0.14) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(255 255 255 / 0.14) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgb(255 255 255 / 0.14) 75%),
    linear-gradient(-45deg, transparent 75%, rgb(255 255 255 / 0.14) 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}

.m-color-panel__meta {
  min-inline-size: 0;
}

.m-color-panel__hex {
  display: block;
  font-family: "Iosevka Web", "Consolas", monospace;
  font-size: 0.84rem;
  letter-spacing: 0.02em;
}

.m-color-panel__alpha-text {
  color: var(--mecha-text-muted);
  font-size: 0.67rem;
}

.m-color-panel__canvas {
  position: relative;
  border-radius: 10px;
  block-size: 11rem;
  cursor: crosshair;
  overflow: hidden;
}

.m-color-panel__canvas::before,
.m-color-panel__canvas::after {
  content: "";
  position: absolute;
  inset: 0;
}

.m-color-panel__canvas::before {
  background: linear-gradient(to right, #fff, transparent);
}

.m-color-panel__canvas::after {
  background: linear-gradient(to top, #000, transparent);
}

.m-color-panel__cursor {
  position: absolute;
  inline-size: 0.85rem;
  block-size: 0.85rem;
  border-radius: 999px;
  border: 2px solid #fff;
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.54),
    0 0 0 8px rgb(255 255 255 / 0.08);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.m-color-panel__controls {
  display: grid;
  gap: 0.48rem;
}

.m-color-panel__row {
  display: grid;
  gap: 0.25rem;
}

.m-color-panel__label {
  font-family: var(--mecha-font-display);
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--mecha-text-muted) 90%, white);
}

.m-color-panel__hue,
.m-color-panel__alpha {
  inline-size: 100%;
}

.m-color-panel__hue {
  accent-color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
}

.m-color-panel__alpha {
  accent-color: color-mix(in srgb, var(--mecha-accent) 72%, white);
}

.m-color-panel__presets {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.3rem;
}

.m-color-panel__preset {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #50657c);
  border-radius: 7px;
  block-size: 1.2rem;
  background: var(--m-color-preset);
  cursor: pointer;
}

.m-color-panel__preset.is-active {
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.5) inset,
    0 0 10px color-mix(in srgb, var(--mecha-accent-cool) 34%, transparent);
}

.m-color-panel__hex-row {
  display: grid;
  gap: 0.24rem;
}

.m-color-panel__hex-input {
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 28%, #40556f);
  background: color-mix(in srgb, var(--mecha-bg-elevated) 80%, #0a1624);
  color: var(--mecha-text);
  padding: 0.34rem 0.45rem;
  font-family: "Iosevka Web", "Consolas", monospace;
  text-transform: uppercase;
}

.m-color-panel__hex-input:focus {
  outline: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 56%, white);
}
</style>
