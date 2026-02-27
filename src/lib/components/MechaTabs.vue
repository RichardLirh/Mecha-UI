<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

export type MechaTabValue = string | number;

export interface MechaTabItem {
  label: string;
  value: MechaTabValue;
  content?: string;
  disabled?: boolean;
  closable?: boolean;
}

type TabSource = "click" | "keyboard" | "remove";

const props = withDefaults(
  defineProps<{
    modelValue?: MechaTabValue | null;
    items?: MechaTabItem[];
    type?: "line" | "card";
    stretch?: boolean;
    closable?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: MechaTabValue | null;
      next: MechaTabValue | null;
      source: TabSource;
      item?: MechaTabItem;
    }>;
  }>(),
  {
    modelValue: null,
    items: () => [],
    type: "line",
    stretch: false,
    closable: false,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: MechaTabValue | null];
  change: [value: MechaTabValue | null];
  remove: [value: MechaTabValue];
  blocked: [value: MechaTabValue | null];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaTabs", undefined, props.ui);

const tabs = ref<MechaTabItem[]>([...props.items]);

watch(
  () => props.items,
  (next) => {
    tabs.value = [...next];
  },
  { deep: true }
);

const activeValue = computed<MechaTabValue | null>(() => {
  const incoming = props.modelValue;
  if (
    incoming !== null &&
    incoming !== undefined &&
    tabs.value.some((tab) => tab.value === incoming)
  ) {
    return incoming;
  }

  return tabs.value[0]?.value ?? null;
});

const activeItem = computed(() =>
  tabs.value.find((tab) => tab.value === activeValue.value) ?? null
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-tabs m-tabs--${props.type} ${props.stretch ? "is-stretch" : ""} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const canSelect = (item: MechaTabItem) => !props.disabled && !item.disabled;

const commit = async (
  next: MechaTabValue | null,
  source: TabSource,
  item?: MechaTabItem
) => {
  if (source !== "remove" && next === activeValue.value) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTabs",
      action: source,
      payload: {
        current: activeValue.value,
        next,
        source,
        item
      }
    },
    async () => {
      if (source === "remove" && item) {
        tabs.value = tabs.value.filter((tab) => tab.value !== item.value);
        emit("remove", item.value);
        if (activeValue.value === item.value) {
          const fallback = tabs.value[0]?.value ?? null;
          emit("update:modelValue", fallback);
          emit("change", fallback);
        }
        return;
      }

      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", activeValue.value);
  }
};

const onSelect = (item: MechaTabItem) => {
  if (!canSelect(item)) {
    return;
  }
  void commit(item.value, "click", item);
};

const onRemove = (event: MouseEvent, item: MechaTabItem) => {
  event.preventDefault();
  event.stopPropagation();
  if (props.disabled || item.disabled) {
    return;
  }
  void commit(activeValue.value, "remove", item);
};

const enabledIndices = computed(() =>
  tabs.value.flatMap((tab, index) => (canSelect(tab) ? [index] : []))
);

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled || !enabledIndices.value.length) {
    return;
  }

  const currentIndex = tabs.value.findIndex((tab) => tab.value === activeValue.value);
  const position = enabledIndices.value.indexOf(currentIndex);
  const resolvedPosition = position >= 0 ? position : 0;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    const nextIndex =
      enabledIndices.value[(resolvedPosition + 1) % enabledIndices.value.length];
    const nextItem = tabs.value[nextIndex];
    if (nextItem) {
      void commit(nextItem.value, "keyboard", nextItem);
    }
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const prevIndex =
      enabledIndices.value[
        (resolvedPosition - 1 + enabledIndices.value.length) %
          enabledIndices.value.length
      ];
    const prevItem = tabs.value[prevIndex];
    if (prevItem) {
      void commit(prevItem.value, "keyboard", prevItem);
    }
  }
};
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <div
      role="tablist"
      :class="partClass('nav', 'm-tabs__nav')"
      v-bind="partAttrs('nav')"
      tabindex="0"
      @keydown="onKeydown"
    >
      <button
        v-for="(item, index) in tabs"
        :key="`${String(item.value)}:${index}`"
        type="button"
        role="tab"
        :aria-selected="activeValue === item.value"
        :disabled="!canSelect(item)"
        :class="
          partClass(
            'tab',
            `m-tabs__tab ${activeValue === item.value ? 'is-active' : ''} ${
              item.disabled ? 'is-disabled' : ''
            }`
          )
        "
        v-bind="partAttrs('tab', { 'data-index': index, 'data-value': String(item.value) })"
        @click="onSelect(item)"
      >
        <span :class="partClass('label', 'm-tabs__label')" v-bind="partAttrs('label')">
          {{ item.label }}
        </span>
        <span
          v-if="(closable || item.closable) && !item.disabled"
          :class="partClass('close', 'm-tabs__close')"
          v-bind="partAttrs('close')"
          role="button"
          tabindex="0"
          @click="onRemove($event, item)"
        >
          x
        </span>
      </button>
    </div>

    <div
      :class="partClass('body', 'm-tabs__body')"
      v-bind="partAttrs('body')"
    >
      <slot name="pane" :item="activeItem" :value="activeValue">
        <div
          v-if="activeItem"
          :class="partClass('panel', 'm-tabs__panel')"
          v-bind="partAttrs('panel')"
        >
          {{ activeItem.content || "No content" }}
        </div>
        <div
          v-else
          :class="partClass('empty', 'm-tabs__empty')"
          v-bind="partAttrs('empty')"
        >
          No tab items
        </div>
      </slot>
    </div>
  </section>
</template>

<style>
.m-tabs {
  inline-size: min(100%, 44rem);
  display: grid;
  gap: 0.52rem;
}

.m-tabs.is-disabled {
  opacity: 0.58;
}

.m-tabs__nav {
  position: relative;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.28rem;
  border: 1px solid color-mix(in srgb, var(--mecha-border) 78%, var(--mecha-accent-cool) 24%);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(166deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-panel-soft) 86%, #101a29);
  padding: 0.28rem;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.04);
}

.m-tabs.is-stretch .m-tabs__nav {
  display: flex;
}

.m-tabs__tab {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 26%, #3e5670);
  border-radius: 9px;
  background:
    linear-gradient(176deg, rgb(255 255 255 / 0.1), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #0f1b2a);
  color: var(--mecha-text-muted);
  padding: 0.42rem 0.6rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  overflow: clip;
  cursor: pointer;
  transition:
    transform var(--mecha-motion-fast) var(--mecha-ease-out),
    border-color var(--mecha-motion-fast) ease,
    background var(--mecha-motion-fast) ease,
    color var(--mecha-motion-fast) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.m-tabs__tab::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    112deg,
    transparent 18%,
    rgb(255 255 255 / 0.2) 36%,
    transparent 52%
  );
  opacity: 0;
  transform: translateX(-14%);
  transition:
    opacity var(--mecha-motion-base) ease,
    transform var(--mecha-motion-base) ease;
}

.m-tabs.is-stretch .m-tabs__tab {
  flex: 1;
  justify-content: center;
}

.m-tabs--card .m-tabs__tab {
  border-radius: 9px;
}

.m-tabs__tab.is-active {
  color: color-mix(in srgb, var(--mecha-accent-cool) 84%, white);
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
  background:
    linear-gradient(138deg, rgb(32 214 255 / 0.24), transparent 74%),
    color-mix(in srgb, var(--mecha-bg-elevated) 84%, #112031);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--mecha-accent-cool) 24%, transparent) inset,
    0 0 18px color-mix(in srgb, var(--mecha-accent-cool) 22%, transparent);
}

.m-tabs__tab.is-active::before {
  opacity: 0.46;
  transform: translateX(8%);
}

.m-tabs__tab:not(:disabled):hover {
  color: color-mix(in srgb, var(--mecha-text) 90%, white);
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 50%, #89b8dd);
  transform: translateY(-1px);
}

.m-tabs__tab:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  outline-offset: 2px;
}

.m-tabs__tab:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.m-tabs__label {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: var(--mecha-font-display);
}

.m-tabs__close {
  inline-size: 1.02rem;
  block-size: 1.02rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 32%, transparent);
  background: rgb(255 255 255 / 0.06);
  font-size: 0.6rem;
  display: grid;
  place-items: center;
  transition:
    background var(--mecha-motion-fast) ease,
    border-color var(--mecha-motion-fast) ease;
}

.m-tabs__close:hover {
  background: rgb(255 255 255 / 0.12);
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 64%, white);
}

.m-tabs__body {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3d5570);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.1), transparent 36%),
    color-mix(in srgb, var(--mecha-panel) 86%, #09131f);
  padding: 0.72rem 0.8rem;
  box-shadow:
    var(--mecha-shadow-float),
    0 0 0 1px rgb(255 255 255 / 0.04) inset;
}

.m-tabs__panel {
  font-size: 0.8rem;
  line-height: 1.5;
  color: color-mix(in srgb, var(--mecha-text) 90%, #dbeeff);
  animation: mecha-tab-panel-in var(--mecha-motion-base) var(--mecha-ease-out) both;
}

.m-tabs__empty {
  font-size: 0.74rem;
  color: var(--mecha-text-muted);
}

@keyframes mecha-tab-panel-in {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-tabs__tab,
  .m-tabs__tab::before,
  .m-tabs__close,
  .m-tabs__panel {
    transition: none !important;
    animation: none !important;
  }
}
</style>
