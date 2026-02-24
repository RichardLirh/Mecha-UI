<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

export type MechaMenuKey = string | number;

export interface MechaMenuItem {
  key: MechaMenuKey;
  label: string;
  hint?: string;
  disabled?: boolean;
  children?: MechaMenuItem[];
}

const props = withDefaults(
  defineProps<{
    modelValue?: MechaMenuKey | null;
    items?: MechaMenuItem[];
    mode?: "vertical" | "horizontal";
    openedKeys?: MechaMenuKey[];
    defaultOpenedKeys?: MechaMenuKey[];
    accordion?: boolean;
    disabled?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      action: "select" | "toggle";
      key: MechaMenuKey;
      current: { selected: MechaMenuKey | null; opened: MechaMenuKey[] };
      next: { selected: MechaMenuKey | null; opened: MechaMenuKey[] };
    }>;
  }>(),
  {
    modelValue: null,
    items: () => [],
    mode: "vertical",
    openedKeys: () => [],
    defaultOpenedKeys: () => [],
    accordion: false,
    disabled: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: MechaMenuKey | null];
  change: [value: MechaMenuKey | null];
  "update:openedKeys": [value: MechaMenuKey[]];
  "open-change": [value: MechaMenuKey[]];
  blocked: [payload: { action: "select" | "toggle"; key: MechaMenuKey }];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaMenu", undefined, props.ui);

const keyToken = (key: MechaMenuKey) => `${typeof key}:${String(key)}`;

const dedupeKeys = (keys: MechaMenuKey[]) => {
  const seen = new Set<string>();
  const next: MechaMenuKey[] = [];

  for (const key of keys) {
    const token = keyToken(key);
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    next.push(key);
  }

  return next;
};

const localSelected = ref<MechaMenuKey | null>(props.modelValue ?? null);
const localOpened = ref<MechaMenuKey[]>(
  props.openedKeys.length ? [...props.openedKeys] : [...props.defaultOpenedKeys]
);

watch(
  () => props.modelValue,
  (next) => {
    localSelected.value = next ?? null;
  }
);

watch(
  () => props.openedKeys,
  (next) => {
    localOpened.value = dedupeKeys([...next]);
  },
  { deep: true }
);

const openedSet = computed(() => {
  const set = new Set<string>();
  for (const key of localOpened.value) {
    set.add(keyToken(key));
  }
  return set;
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-menu m-menu--${props.mode} ${props.disabled ? "is-disabled" : ""}`
  )
);

const isSelected = (item: MechaMenuItem) =>
  localSelected.value !== null &&
  keyToken(localSelected.value) === keyToken(item.key);

const isOpen = (item: MechaMenuItem) => openedSet.value.has(keyToken(item.key));

const updateOpened = (next: MechaMenuKey[]) => {
  const deduped = dedupeKeys(next);
  localOpened.value = deduped;
  emit("update:openedKeys", deduped);
  emit("open-change", deduped);
};

const toggleSubmenu = async (item: MechaMenuItem) => {
  if (props.disabled || item.disabled || !item.children?.length) {
    return;
  }

  const current = {
    selected: localSelected.value,
    opened: [...localOpened.value]
  };

  let nextOpened: MechaMenuKey[];
  if (isOpen(item)) {
    nextOpened = localOpened.value.filter(
      (key) => keyToken(key) !== keyToken(item.key)
    );
  } else if (props.accordion) {
    nextOpened = [item.key];
  } else {
    nextOpened = [...localOpened.value, item.key];
  }

  const next = {
    selected: localSelected.value,
    opened: dedupeKeys(nextOpened)
  };

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaMenu",
      action: "toggle",
      payload: {
        action: "toggle",
        key: item.key,
        current,
        next
      }
    },
    async () => {
      updateOpened(next.opened);
    }
  );

  if (!success) {
    emit("blocked", { action: "toggle", key: item.key });
  }
};

const selectItem = async (item: MechaMenuItem) => {
  if (props.disabled || item.disabled) {
    return;
  }

  const current = {
    selected: localSelected.value,
    opened: [...localOpened.value]
  };
  const next = {
    selected: item.key,
    opened: [...localOpened.value]
  };

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaMenu",
      action: "select",
      payload: {
        action: "select",
        key: item.key,
        current,
        next
      }
    },
    async () => {
      localSelected.value = item.key;
      emit("update:modelValue", item.key);
      emit("change", item.key);
    }
  );

  if (!success) {
    emit("blocked", { action: "select", key: item.key });
  }
};

const onRootItemClick = (item: MechaMenuItem) => {
  if (item.children?.length) {
    void toggleSubmenu(item);
    return;
  }

  void selectItem(item);
};

const onChildItemClick = (item: MechaMenuItem) => {
  void selectItem(item);
};
</script>

<template>
  <nav :class="rootClass" v-bind="partAttrs('root')">
    <ul :class="partClass('list', 'm-menu__list')" v-bind="partAttrs('list')">
      <li
        v-for="(item, index) in items"
        :key="String(item.key)"
        :class="
          partClass(
            'group',
            `m-menu__group ${isOpen(item) ? 'is-open' : ''} ${
              item.disabled ? 'is-disabled' : ''
            }`
          )
        "
        v-bind="partAttrs('group', { 'data-index': index })"
      >
        <button
          type="button"
          :disabled="disabled || item.disabled"
          :class="
            partClass(
              'item',
              `m-menu__item ${isSelected(item) ? 'is-active' : ''} ${
                item.children?.length ? 'has-children' : ''
              }`
            )
          "
          v-bind="partAttrs('item', { 'data-key': String(item.key) })"
          @click="onRootItemClick(item)"
        >
          <span :class="partClass('label', 'm-menu__label')" v-bind="partAttrs('label')">
            {{ item.label }}
          </span>
          <span
            v-if="item.hint"
            :class="partClass('hint', 'm-menu__hint')"
            v-bind="partAttrs('hint')"
          >
            {{ item.hint }}
          </span>
          <span
            v-if="item.children?.length"
            :class="
              partClass(
                'arrow',
                `m-menu__arrow ${isOpen(item) ? 'is-open' : ''}`
              )
            "
            v-bind="partAttrs('arrow')"
          >
            >
          </span>
        </button>

        <ul
          v-if="item.children?.length"
          v-show="isOpen(item)"
          :class="partClass('sub', 'm-menu__sub')"
          v-bind="partAttrs('sub')"
        >
          <li
            v-for="(child, childIndex) in item.children"
            :key="String(child.key)"
            :class="
              partClass(
                'sub-row',
                `m-menu__sub-row ${child.disabled ? 'is-disabled' : ''}`
              )
            "
            v-bind="partAttrs('sub-row', { 'data-index': childIndex })"
          >
            <button
              type="button"
              :disabled="disabled || child.disabled"
              :class="
                partClass(
                  'sub-item',
                  `m-menu__sub-item ${isSelected(child) ? 'is-active' : ''}`
                )
              "
              v-bind="partAttrs('sub-item', { 'data-key': String(child.key) })"
              @click="onChildItemClick(child)"
            >
              <span
                :class="partClass('sub-label', 'm-menu__sub-label')"
                v-bind="partAttrs('sub-label')"
              >
                {{ child.label }}
              </span>
              <span
                v-if="child.hint"
                :class="partClass('sub-hint', 'm-menu__sub-hint')"
                v-bind="partAttrs('sub-hint')"
              >
                {{ child.hint }}
              </span>
            </button>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style>
.m-menu {
  inline-size: min(100%, 20rem);
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 22%, #3f5670);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
  padding: 0.34rem;
}

.m-menu.is-disabled {
  opacity: 0.56;
}

.m-menu--horizontal {
  inline-size: 100%;
}

.m-menu--horizontal .m-menu__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
}

.m-menu__list,
.m-menu__sub {
  list-style: none;
  margin: 0;
  padding: 0;
}

.m-menu__group {
  display: grid;
  gap: 0.16rem;
}

.m-menu__item,
.m-menu__sub-item {
  inline-size: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.02);
  color: var(--mecha-text);
  padding: 0.4rem 0.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.34rem;
  text-align: left;
  cursor: pointer;
}

.m-menu__item:hover,
.m-menu__sub-item:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 34%, #4d6680);
  background: rgb(255 255 255 / 0.06);
}

.m-menu__item.is-active,
.m-menu__sub-item.is-active {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 68%, white);
  background:
    linear-gradient(140deg, rgb(32 214 255 / 0.2), transparent 72%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #111f30);
}

.m-menu__item:disabled,
.m-menu__sub-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.m-menu__label,
.m-menu__sub-label {
  font-size: 0.78rem;
}

.m-menu__hint,
.m-menu__sub-hint {
  font-size: 0.66rem;
  color: var(--mecha-text-muted);
}

.m-menu__arrow {
  color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  transition: transform var(--mecha-motion-fast) ease;
}

.m-menu__arrow.is-open {
  transform: rotate(90deg);
}

.m-menu__sub {
  margin-left: 0.46rem;
  border-left: 1px solid rgb(255 255 255 / 0.1);
  padding-left: 0.4rem;
  display: grid;
  gap: 0.12rem;
}
</style>
