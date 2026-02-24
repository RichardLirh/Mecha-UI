<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

export interface MechaDropdownItem {
  label: string;
  value: string | number;
  hint?: string;
  disabled?: boolean;
  danger?: boolean;
}

type DropdownSource = "trigger" | "hover" | "outside" | "select" | "keyboard";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    items?: MechaDropdownItem[];
    trigger?: "click" | "hover";
    placement?: "bottom-start" | "bottom-end";
    hideOnClick?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      source: DropdownSource;
      open: boolean;
      nextOpen: boolean;
      item?: MechaDropdownItem;
    }>;
  }>(),
  {
    modelValue: false,
    label: "Actions",
    items: () => [],
    trigger: "click",
    placement: "bottom-start",
    hideOnClick: true,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "open-change": [value: boolean];
  command: [item: MechaDropdownItem];
  blocked: [payload: { source: DropdownSource }];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaDropdown",
  undefined,
  props.ui
);

const rootRef = ref<HTMLElement | null>(null);
const open = ref(props.modelValue);

watch(
  () => props.modelValue,
  (next) => {
    open.value = next;
  }
);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-dropdown m-dropdown--${props.placement} ${
      open.value ? "is-open" : "is-closed"
    } ${props.disabled ? "is-disabled" : ""}`
  )
);

const setOpen = async (next: boolean, source: DropdownSource) => {
  if (props.disabled) {
    return;
  }

  if (next === open.value) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaDropdown",
      action: next ? "open" : "close",
      payload: {
        source,
        open: open.value,
        nextOpen: next
      }
    },
    async () => {
      open.value = next;
      emit("update:modelValue", next);
      emit("open-change", next);
    }
  );

  if (!success) {
    emit("blocked", { source });
  }
};

const onTriggerClick = () => {
  if (props.trigger !== "click") {
    return;
  }

  void setOpen(!open.value, "trigger");
};

const onMouseEnter = () => {
  if (props.trigger !== "hover") {
    return;
  }

  void setOpen(true, "hover");
};

const onMouseLeave = () => {
  if (props.trigger !== "hover") {
    return;
  }

  void setOpen(false, "hover");
};

const onSelect = async (item: MechaDropdownItem) => {
  if (props.disabled || item.disabled) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaDropdown",
      action: "select",
      payload: {
        source: "select",
        open: open.value,
        nextOpen: props.hideOnClick ? false : open.value,
        item
      }
    },
    async () => {
      emit("command", item);
      if (props.hideOnClick) {
        open.value = false;
        emit("update:modelValue", false);
        emit("open-change", false);
      }
    }
  );

  if (!success) {
    emit("blocked", { source: "select" });
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    void setOpen(false, "keyboard");
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    void setOpen(!open.value, "keyboard");
  }
};

const onDocumentPointerDown = (event: PointerEvent) => {
  if (!open.value) {
    return;
  }

  const target = event.target as Node | null;
  if (!target || !rootRef.value?.contains(target)) {
    void setOpen(false, "outside");
  }
};

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<template>
  <div
    ref="rootRef"
    :class="rootClass"
    v-bind="partAttrs('root')"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <button
      type="button"
      :disabled="disabled"
      :class="partClass('trigger', 'm-dropdown__trigger')"
      v-bind="partAttrs('trigger')"
      @click="onTriggerClick"
      @keydown="onKeydown"
    >
      <slot name="trigger">
        <span>{{ label }}</span>
      </slot>
      <span :class="partClass('arrow', 'm-dropdown__arrow')" v-bind="partAttrs('arrow')">
        v
      </span>
    </button>

    <div
      v-if="open"
      :class="partClass('panel', 'm-dropdown__panel')"
      v-bind="partAttrs('panel')"
    >
      <slot>
        <ul :class="partClass('list', 'm-dropdown__list')" v-bind="partAttrs('list')">
          <li
            v-for="(item, index) in items"
            :key="`${String(item.value)}:${index}`"
            :class="partClass('row', 'm-dropdown__row')"
            v-bind="partAttrs('row', { 'data-index': index })"
          >
            <button
              type="button"
              :disabled="item.disabled"
              :class="
                partClass(
                  'item',
                  `m-dropdown__item ${item.danger ? 'is-danger' : ''} ${
                    item.disabled ? 'is-disabled' : ''
                  }`
                )
              "
              v-bind="partAttrs('item', { 'data-value': String(item.value) })"
              @click="onSelect(item)"
            >
              <span
                :class="partClass('item-label', 'm-dropdown__item-label')"
                v-bind="partAttrs('item-label')"
              >
                {{ item.label }}
              </span>
              <span
                v-if="item.hint"
                :class="partClass('item-hint', 'm-dropdown__item-hint')"
                v-bind="partAttrs('item-hint')"
              >
                {{ item.hint }}
              </span>
            </button>
          </li>
        </ul>
      </slot>
    </div>
  </div>
</template>

<style>
.m-dropdown {
  position: relative;
  display: inline-grid;
}

.m-dropdown.is-disabled {
  opacity: 0.58;
}

.m-dropdown__trigger {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #3f5670);
  border-radius: 10px;
  background:
    linear-gradient(176deg, rgb(255 255 255 / 0.08), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 78%, #101a29);
  color: var(--mecha-text);
  min-block-size: 2rem;
  padding: 0.46rem 0.62rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.m-dropdown__arrow {
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  transition: transform var(--mecha-motion-fast) ease;
}

.m-dropdown.is-open .m-dropdown__arrow {
  transform: rotate(180deg);
}

.m-dropdown__panel {
  position: absolute;
  z-index: 40;
  margin-top: 0.34rem;
  min-inline-size: 11rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 24%, #364d62);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.08), transparent 38%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #0c1522);
  box-shadow: 0 14px 28px rgb(0 0 0 / 0.48);
  padding: 0.34rem;
}

.m-dropdown--bottom-start .m-dropdown__panel {
  inset: calc(100% + 0.08rem) auto auto 0;
}

.m-dropdown--bottom-end .m-dropdown__panel {
  inset: calc(100% + 0.08rem) 0 auto auto;
}

.m-dropdown__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.2rem;
}

.m-dropdown__item {
  inline-size: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.02);
  color: var(--mecha-text);
  text-align: left;
  padding: 0.42rem 0.5rem;
  display: grid;
  gap: 0.05rem;
  cursor: pointer;
}

.m-dropdown__item:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 34%, #49627b);
  background: rgb(255 255 255 / 0.06);
}

.m-dropdown__item.is-danger {
  color: color-mix(in srgb, #ff536f 82%, white);
}

.m-dropdown__item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.m-dropdown__item-label {
  font-size: 0.78rem;
}

.m-dropdown__item-hint {
  font-size: 0.66rem;
  color: var(--mecha-text-muted);
}
</style>
