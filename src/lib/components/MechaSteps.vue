<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type StepStatus = "wait" | "process" | "finish" | "success" | "error";
type StepDirection = "horizontal" | "vertical";

export interface MechaStepItem {
  title: string;
  description?: string;
  status?: StepStatus;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    items?: MechaStepItem[];
    direction?: StepDirection;
    alignCenter?: boolean;
    simple?: boolean;
    clickable?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: number;
      next: number;
      item: MechaStepItem;
      source: "click" | "keyboard";
    }>;
  }>(),
  {
    modelValue: 0,
    items: () => [],
    direction: "horizontal",
    alignCenter: false,
    simple: false,
    clickable: false,
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

const { partClass, partAttrs } = useMechaComponent("MechaSteps", undefined, props.ui);

const safeCurrent = computed(() => {
  const raw = Number.isFinite(props.modelValue) ? Math.floor(props.modelValue) : 0;
  const max = Math.max(0, props.items.length - 1);
  return Math.min(max, Math.max(0, raw));
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-steps m-steps--${props.direction} ${props.alignCenter ? "is-center" : ""} ${
      props.simple ? "is-simple" : ""
    } ${props.disabled ? "is-disabled" : ""}`
  )
);

const resolveStatus = (item: MechaStepItem, index: number): StepStatus => {
  if (item.status) {
    return item.status;
  }

  if (index < safeCurrent.value) {
    return "finish";
  }

  if (index === safeCurrent.value) {
    return "process";
  }

  return "wait";
};

const canActivate = (item: MechaStepItem) =>
  !props.disabled && props.clickable && !item.disabled;

const commitStep = async (index: number, source: "click" | "keyboard") => {
  const item = props.items[index];
  if (!item || !canActivate(item) || index === safeCurrent.value) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaSteps",
      action: "change",
      payload: {
        current: safeCurrent.value,
        next: index,
        item,
        source
      }
    },
    async () => {
      emit("update:modelValue", index);
      emit("change", index);
    }
  );

  if (!success) {
    emit("blocked", safeCurrent.value);
  }
};

const onStepClick = (index: number) => {
  void commitStep(index, "click");
};

const onRootKeydown = (event: KeyboardEvent) => {
  if (props.disabled || !props.items.length) {
    return;
  }

  const delta =
    props.direction === "vertical"
      ? event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowUp"
          ? -1
          : 0
      : event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : 0;

  if (!delta) {
    return;
  }

  event.preventDefault();
  const next = Math.min(
    Math.max(safeCurrent.value + delta, 0),
    Math.max(0, props.items.length - 1)
  );
  void commitStep(next, "keyboard");
};
</script>

<template>
  <section
    :class="rootClass"
    tabindex="0"
    v-bind="partAttrs('root')"
    @keydown="onRootKeydown"
  >
    <ol :class="partClass('list', 'm-steps__list')" v-bind="partAttrs('list')">
      <li
        v-for="(item, index) in items"
        :key="`${item.title}:${index}`"
        :class="
          partClass(
            'item',
            `m-steps__item m-steps__item--${resolveStatus(item, index)} ${
              item.disabled ? 'is-disabled' : ''
            }`
          )
        "
        v-bind="partAttrs('item', { 'data-index': index })"
      >
        <button
          type="button"
          :disabled="!canActivate(item)"
          :class="partClass('head', 'm-steps__head')"
          v-bind="partAttrs('head')"
          @click="onStepClick(index)"
        >
          <span
            :class="partClass('icon', 'm-steps__icon')"
            v-bind="partAttrs('icon')"
            aria-hidden="true"
          >
            <span
              v-if="resolveStatus(item, index) === 'finish' || resolveStatus(item, index) === 'success'"
            >
              v
            </span>
            <span
              v-else-if="resolveStatus(item, index) === 'error'"
            >
              !
            </span>
            <span v-else>{{ index + 1 }}</span>
          </span>

          <span
            :class="partClass('meta', 'm-steps__meta')"
            v-bind="partAttrs('meta')"
          >
            <span
              :class="partClass('title', 'm-steps__title')"
              v-bind="partAttrs('title')"
            >
              {{ item.title }}
            </span>
            <span
              v-if="item.description && !simple"
              :class="partClass('description', 'm-steps__description')"
              v-bind="partAttrs('description')"
            >
              {{ item.description }}
            </span>
          </span>
        </button>

        <span
          v-if="index < items.length - 1"
          :class="partClass('line', 'm-steps__line')"
          v-bind="partAttrs('line')"
          aria-hidden="true"
        />
      </li>
    </ol>
  </section>
</template>

<style>
.m-steps {
  inline-size: min(100%, 44rem);
}

.m-steps.is-disabled {
  opacity: 0.58;
}

.m-steps__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0;
}

.m-steps--vertical .m-steps__list {
  flex-direction: column;
}

.m-steps__item {
  position: relative;
  flex: 1;
  min-inline-size: 0;
}

.m-steps--vertical .m-steps__item {
  flex: none;
}

.m-steps__head {
  inline-size: 100%;
  border: 0;
  background: transparent;
  color: var(--mecha-text);
  display: flex;
  align-items: flex-start;
  gap: 0.44rem;
  text-align: left;
  padding: 0.24rem 0.14rem 0.52rem;
  cursor: default;
}

.m-steps.is-center .m-steps__head {
  justify-content: center;
  text-align: center;
}

.m-steps__head:disabled {
  cursor: not-allowed;
}

.m-steps__icon {
  inline-size: 1.24rem;
  block-size: 1.24rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 34%, #48607b);
  background: rgb(255 255 255 / 0.03);
  display: grid;
  place-items: center;
  font-family: var(--mecha-font-display);
  font-size: 0.68rem;
}

.m-steps__meta {
  min-inline-size: 0;
  display: grid;
  gap: 0.14rem;
}

.m-steps__title {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.68rem;
}

.m-steps__description {
  font-size: 0.7rem;
  color: var(--mecha-text-muted);
}

.m-steps__line {
  position: absolute;
  inset: 0.62rem 0.1rem auto calc(1.24rem + 0.42rem);
  block-size: 1px;
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--mecha-accent-cool) 32%, #4a627b),
    rgb(255 255 255 / 0.1)
  );
}

.m-steps--vertical .m-steps__line {
  inset: calc(1.24rem + 0.42rem) auto 0.06rem 0.62rem;
  inline-size: 1px;
  block-size: auto;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--mecha-accent-cool) 32%, #4a627b),
    rgb(255 255 255 / 0.1)
  );
}

.m-steps__item--process .m-steps__icon {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  color: color-mix(in srgb, var(--mecha-accent-cool) 82%, white);
}

.m-steps__item--finish .m-steps__icon,
.m-steps__item--success .m-steps__icon {
  border-color: color-mix(in srgb, #48eba7 72%, white);
  color: color-mix(in srgb, #48eba7 82%, white);
}

.m-steps__item--error .m-steps__icon {
  border-color: color-mix(in srgb, #ff536f 84%, white);
  color: color-mix(in srgb, #ff536f 84%, white);
}
</style>
