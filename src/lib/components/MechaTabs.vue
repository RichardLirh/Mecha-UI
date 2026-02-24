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
  inline-size: min(100%, 42rem);
  display: grid;
  gap: 0.46rem;
}

.m-tabs.is-disabled {
  opacity: 0.58;
}

.m-tabs__nav {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.26rem;
}

.m-tabs.is-stretch .m-tabs__nav {
  display: flex;
}

.m-tabs__tab {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #3e5670);
  border-radius: 9px 9px 0 0;
  background:
    linear-gradient(176deg, rgb(255 255 255 / 0.07), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 80%, #0f1b2a);
  color: var(--mecha-text-muted);
  padding: 0.4rem 0.58rem;
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  cursor: pointer;
}

.m-tabs.is-stretch .m-tabs__tab {
  flex: 1;
  justify-content: center;
}

.m-tabs--card .m-tabs__tab {
  border-radius: 9px;
}

.m-tabs__tab.is-active {
  color: color-mix(in srgb, var(--mecha-accent-cool) 82%, white);
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 66%, white);
  background:
    linear-gradient(140deg, rgb(32 214 255 / 0.2), transparent 72%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #112031);
}

.m-tabs__tab:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.m-tabs__label {
  font-size: 0.76rem;
}

.m-tabs__close {
  inline-size: 1rem;
  block-size: 1rem;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.14);
  font-size: 0.62rem;
  display: grid;
  place-items: center;
}

.m-tabs__body {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 22%, #3d5570);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 36%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
  padding: 0.66rem 0.74rem;
}

.m-tabs__panel {
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--mecha-text) 90%, #dbeeff);
}

.m-tabs__empty {
  font-size: 0.74rem;
  color: var(--mecha-text-muted);
}
</style>
