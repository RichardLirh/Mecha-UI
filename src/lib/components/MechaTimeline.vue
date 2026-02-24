<script setup lang="ts">
import { computed } from "vue";
import type { MechaComponentUi } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";

type TimelineType = "default" | "info" | "success" | "warning" | "danger";

export interface MechaTimelineItem {
  key?: string | number;
  label: string;
  content?: string;
  time?: string;
  type?: TimelineType;
}

const props = withDefaults(
  defineProps<{
    items?: MechaTimelineItem[];
    reverse?: boolean;
    pending?: boolean | string;
    ui?: MechaComponentUi;
  }>(),
  {
    items: () => [],
    reverse: false,
    pending: false,
    ui: undefined
  }
);

const { partClass, partAttrs } = useMechaComponent(
  "MechaTimeline",
  undefined,
  props.ui
);

const fallbackItems: MechaTimelineItem[] = [
  {
    label: "No Timeline Data",
    content: "Provide `items` to render chronological records.",
    type: "info"
  }
];

const normalizedItems = computed<MechaTimelineItem[]>(() =>
  props.items.length ? props.items : fallbackItems
);

const orderedItems = computed(() =>
  props.reverse ? [...normalizedItems.value].reverse() : normalizedItems.value
);

const pendingLabel = computed(() => {
  if (typeof props.pending === "string") {
    return props.pending;
  }

  return props.pending ? "Pending..." : "";
});

const resolveType = (item: MechaTimelineItem) => item.type ?? "default";
</script>

<template>
  <section
    :class="
      partClass(
        'root',
        `m-timeline ${props.reverse ? 'is-reverse' : ''} ${
          pendingLabel ? 'has-pending' : ''
        }`
      )
    "
    v-bind="partAttrs('root')"
  >
    <ol :class="partClass('list', 'm-timeline__list')" v-bind="partAttrs('list')">
      <li
        v-for="(item, index) in orderedItems"
        :key="item.key ?? `${item.label}:${index}`"
        :class="
          partClass(
            'item',
            `m-timeline__item m-timeline__item--${resolveType(item)}`
          )
        "
        v-bind="partAttrs('item', { 'data-index': index })"
      >
        <span
          :class="partClass('rail', 'm-timeline__rail')"
          v-bind="partAttrs('rail')"
          aria-hidden="true"
        >
          <span
            :class="partClass('dot', 'm-timeline__dot')"
            v-bind="partAttrs('dot')"
          />
          <span
            v-if="index < orderedItems.length - 1 || pendingLabel"
            :class="partClass('line', 'm-timeline__line')"
            v-bind="partAttrs('line')"
          />
        </span>

        <div
          :class="partClass('content', 'm-timeline__content')"
          v-bind="partAttrs('content')"
        >
          <slot name="item" :item="item" :index="index">
            <h4 :class="partClass('label', 'm-timeline__label')" v-bind="partAttrs('label')">
              {{ item.label }}
            </h4>
            <p
              v-if="item.content"
              :class="partClass('text', 'm-timeline__text')"
              v-bind="partAttrs('text')"
            >
              {{ item.content }}
            </p>
            <time
              v-if="item.time"
              :class="partClass('time', 'm-timeline__time')"
              v-bind="partAttrs('time')"
            >
              {{ item.time }}
            </time>
          </slot>
        </div>
      </li>

      <li
        v-if="pendingLabel"
        :class="partClass('pending', 'm-timeline__pending')"
        v-bind="partAttrs('pending')"
      >
        <span
          :class="partClass('pending-dot', 'm-timeline__dot m-timeline__dot--pending')"
          v-bind="partAttrs('pending-dot')"
        />
        <span
          :class="partClass('pending-label', 'm-timeline__pending-label')"
          v-bind="partAttrs('pending-label')"
        >
          {{ pendingLabel }}
        </span>
      </li>
    </ol>
  </section>
</template>

<style>
.m-timeline {
  inline-size: min(100%, 36rem);
}

.m-timeline__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0;
}

.m-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 1.2rem minmax(0, 1fr);
  gap: 0.6rem;
}

.m-timeline__rail {
  position: relative;
  inline-size: 1.2rem;
  min-block-size: 2.6rem;
}

.m-timeline__dot {
  position: absolute;
  inset: 0.22rem auto auto 0.22rem;
  inline-size: 0.68rem;
  block-size: 0.68rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 44%, #56708b);
  background:
    radial-gradient(circle at 50% 50%, rgb(32 214 255 / 0.36), transparent 70%),
    color-mix(in srgb, var(--mecha-bg-elevated) 80%, #101b2a);
}

.m-timeline__line {
  position: absolute;
  inset: 1.08rem auto 0.1rem 0.54rem;
  inline-size: 1px;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--mecha-accent-cool) 36%, #4a627b),
    rgb(255 255 255 / 0.08)
  );
}

.m-timeline__content {
  min-block-size: 2.6rem;
  padding: 0.14rem 0 0.68rem;
}

.m-timeline__label {
  margin: 0;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.74rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
}

.m-timeline__text {
  margin: 0.24rem 0 0;
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--mecha-text) 90%, #d8ebff);
  line-height: 1.5;
}

.m-timeline__time {
  display: inline-block;
  margin-top: 0.26rem;
  font-family: "Iosevka Web", "Consolas", monospace;
  font-size: 0.68rem;
  color: var(--mecha-text-muted);
}

.m-timeline__item--success .m-timeline__dot {
  border-color: color-mix(in srgb, #48eba7 74%, white);
  background:
    radial-gradient(circle at 50% 50%, rgb(72 235 167 / 0.4), transparent 70%),
    color-mix(in srgb, var(--mecha-bg-elevated) 80%, #0f1f2a);
}

.m-timeline__item--warning .m-timeline__dot {
  border-color: color-mix(in srgb, #ffb547 82%, white);
  background:
    radial-gradient(circle at 50% 50%, rgb(255 181 71 / 0.4), transparent 70%),
    color-mix(in srgb, var(--mecha-bg-elevated) 80%, #241a0f);
}

.m-timeline__item--danger .m-timeline__dot {
  border-color: color-mix(in srgb, #ff536f 84%, white);
  background:
    radial-gradient(circle at 50% 50%, rgb(255 83 111 / 0.4), transparent 70%),
    color-mix(in srgb, var(--mecha-bg-elevated) 80%, #260f18);
}

.m-timeline__pending {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.12rem;
  padding-left: 0.22rem;
}

.m-timeline__dot--pending {
  position: static;
  inline-size: 0.56rem;
  block-size: 0.56rem;
  border-style: dashed;
}

.m-timeline__pending-label {
  font-size: 0.72rem;
  color: var(--mecha-text-muted);
}
</style>
