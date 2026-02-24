<script setup lang="ts">
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import MechaDatePickerPanel from "./MechaDatePickerPanel.vue";

type CalendarValue = string | null;

interface CalendarShortcut {
  label: string;
  value?: string;
  daysOffset?: number;
}

const props = withDefaults(
  defineProps<{
    modelValue?: CalendarValue;
    title?: string;
    disabled?: boolean;
    firstDayOfWeek?: number;
    shortcuts?: CalendarShortcut[];
    ui?: MechaComponentUi;
    panelUi?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: CalendarValue;
      next: CalendarValue;
      source: string;
    }>;
  }>(),
  {
    modelValue: null,
    title: "Calendar",
    disabled: false,
    firstDayOfWeek: 1,
    shortcuts: () => [
      { label: "Today", daysOffset: 0 },
      { label: "Tomorrow", daysOffset: 1 },
      { label: "+7 Days", daysOffset: 7 }
    ],
    ui: undefined,
    panelUi: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: CalendarValue];
  change: [value: CalendarValue];
  blocked: [value: CalendarValue];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaCalendar",
  undefined,
  props.ui
);

const onPanelUpdate = (value: CalendarValue) => {
  emit("update:modelValue", value);
};

const onPanelChange = (value: CalendarValue) => {
  emit("change", value);
};
</script>

<template>
  <section :class="partClass('root', 'm-calendar')" v-bind="partAttrs('root')">
    <header
      :class="partClass('header', 'm-calendar__header')"
      v-bind="partAttrs('header')"
    >
      <div
        :class="partClass('heading', 'm-calendar__heading')"
        v-bind="partAttrs('heading')"
      >
        <h3 :class="partClass('title', 'm-calendar__title')" v-bind="partAttrs('title')">
          {{ title }}
        </h3>
        <p :class="partClass('value', 'm-calendar__value')" v-bind="partAttrs('value')">
          {{ modelValue || "No date selected" }}
        </p>
      </div>

      <slot name="extra" />
    </header>

    <div :class="partClass('panel', 'm-calendar__panel')" v-bind="partAttrs('panel')">
      <MechaDatePickerPanel
        :model-value="modelValue"
        :disabled="disabled"
        :first-day-of-week="firstDayOfWeek"
        :shortcuts="shortcuts"
        :ui="panelUi"
        :pipeline="pipeline"
        @update:modelValue="onPanelUpdate"
        @change="onPanelChange"
        @blocked="emit('blocked', $event)"
      />
    </div>
  </section>
</template>

<style>
.m-calendar {
  inline-size: min(100%, 24.5rem);
  display: grid;
  gap: 0.68rem;
}

.m-calendar__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 0.72rem;
}

.m-calendar__heading {
  min-inline-size: 0;
}

.m-calendar__title {
  margin: 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.82rem;
}

.m-calendar__value {
  margin: 0.32rem 0 0;
  font-family: "Iosevka Web", "Consolas", monospace;
  font-size: 0.73rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
}

.m-calendar .m-date-panel {
  inline-size: min(100%, 24.5rem);
}

.m-calendar__panel {
  min-inline-size: 0;
}
</style>
