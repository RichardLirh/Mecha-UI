<script setup lang="ts">
import { computed, useAttrs } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

defineOptions({ inheritAttrs: false });

interface FormModel {
  [key: string]: unknown;
}

const props = withDefaults(
  defineProps<{
    model?: FormModel;
    inline?: boolean;
    labelPosition?: "left" | "top";
    labelWidth?: string;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      action: "submit" | "reset";
      model: FormModel | undefined;
    }>;
  }>(),
  {
    model: undefined,
    inline: false,
    labelPosition: "left",
    labelWidth: "6.5rem",
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  submit: [event: SubmitEvent];
  reset: [event: Event];
  blocked: [action: "submit" | "reset"];
}>();

const attrs = useAttrs();
const { partClass, partAttrs } = useMechaComponent("MechaForm", undefined, props.ui);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-form ${props.inline ? "is-inline" : "is-block"} ${
      props.labelPosition === "top" ? "is-label-top" : "is-label-left"
    } ${props.disabled ? "is-disabled" : ""}`
  )
);

const rootStyle = computed(() => ({
  "--m-form-label-width": props.labelWidth
}));

const nativeAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const runAction = async (
  action: "submit" | "reset",
  event: SubmitEvent | Event
) => {
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaForm",
      action,
      payload: {
        action,
        model: props.model
      }
    },
    async () => {
      if (action === "submit") {
        emit("submit", event as SubmitEvent);
      } else {
        emit("reset", event);
      }
    }
  );

  if (!success) {
    emit("blocked", action);
  }
};

const onSubmit = (event: SubmitEvent) => {
  event.preventDefault();
  if (props.disabled) {
    return;
  }
  void runAction("submit", event);
};

const onReset = (event: Event) => {
  event.preventDefault();
  if (props.disabled) {
    return;
  }
  void runAction("reset", event);
};
</script>

<template>
  <form
    :class="rootClass"
    :style="rootStyle"
    v-bind="partAttrs('root', nativeAttrs as Record<string, unknown>)"
    @submit="onSubmit"
    @reset="onReset"
  >
    <div :class="partClass('body', 'm-form__body')" v-bind="partAttrs('body')">
      <slot />
    </div>
    <footer
      v-if="$slots.actions"
      :class="partClass('actions', 'm-form__actions')"
      v-bind="partAttrs('actions')"
    >
      <slot name="actions" />
    </footer>
  </form>
</template>

<style>
.m-form {
  inline-size: min(100%, 42rem);
  display: grid;
  gap: 0.7rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 20%, #34485f);
  border-radius: var(--mecha-radius-lg);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 34%),
    color-mix(in srgb, var(--mecha-bg-soft) 82%, #0c1624);
  padding: 0.88rem;
}

.m-form.is-disabled {
  opacity: 0.62;
}

.m-form__body {
  display: grid;
  gap: 0.66rem;
}

.m-form.is-inline .m-form__body {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.66rem;
}

.m-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.56rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgb(255 255 255 / 0.09);
}

.m-form :where(.m-form-item) {
  display: grid;
  grid-template-columns: minmax(0, var(--m-form-label-width, 6.5rem)) minmax(0, 1fr);
  gap: 0.54rem;
  align-items: center;
}

.m-form.is-label-top :where(.m-form-item) {
  grid-template-columns: 1fr;
  gap: 0.3rem;
}

.m-form.is-inline :where(.m-form-item) {
  inline-size: min(100%, 17rem);
}

.m-form :where(.m-form-item__label) {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.68rem;
  color: color-mix(in srgb, var(--mecha-text-muted) 86%, white);
}

.m-form :where(.m-form-item__control) {
  min-inline-size: 0;
}

.m-form :where(.m-form-item__hint) {
  margin-top: 0.26rem;
  font-size: 0.72rem;
  color: var(--mecha-text-muted);
}

@media (max-width: 760px) {
  .m-form :where(.m-form-item) {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }
}
</style>
