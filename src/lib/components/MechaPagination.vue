<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type PaginationSource =
  | "prev"
  | "next"
  | "pager"
  | "first"
  | "last"
  | "jumper";
type PagerToken = number | "ellipsis-left" | "ellipsis-right";

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    total?: number;
    pageSize?: number;
    pagerCount?: number;
    size?: "sm" | "md";
    disabled?: boolean;
    hideOnSinglePage?: boolean;
    showTotal?: boolean;
    showJumper?: boolean;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: number;
      next: number;
      pageCount: number;
      source: PaginationSource;
    }>;
  }>(),
  {
    modelValue: 1,
    total: 0,
    pageSize: 10,
    pagerCount: 7,
    size: "md",
    disabled: false,
    hideOnSinglePage: false,
    showTotal: false,
    showJumper: false,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
  change: [value: number];
  blocked: [value: number];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaPagination",
  undefined,
  props.ui
);

const safeTotal = computed(() => {
  const parsed = Number(props.total);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.floor(parsed));
});

const safePageSize = computed(() => {
  const parsed = Number(props.pageSize);
  if (!Number.isFinite(parsed)) {
    return 10;
  }
  return Math.max(1, Math.floor(parsed));
});
const pageCount = computed(() =>
  Math.max(1, Math.ceil(safeTotal.value / safePageSize.value))
);

const clampPage = (value: number) => {
  const parsed = Number.isFinite(value) ? Math.floor(value) : 1;
  return Math.min(pageCount.value, Math.max(1, parsed));
};

const currentPage = computed(() => clampPage(props.modelValue));

const normalizedPagerCount = computed(() => {
  const parsed = Number(props.pagerCount);
  const raw = Number.isFinite(parsed) ? Math.floor(parsed) : 7;
  const normalized = Math.max(5, raw);
  const safe = normalized > 21 ? 21 : normalized;
  const oddSafe = safe % 2 === 0 ? safe - 1 : safe;
  const fallback = Math.max(5, oddSafe);
  return fallback;
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-pagination m-pagination--${props.size} ${props.disabled ? "is-disabled" : ""}`
  )
);

const shouldRender = computed(
  () => !(props.hideOnSinglePage && pageCount.value <= 1)
);
const canPrev = computed(() => currentPage.value > 1);
const canNext = computed(() => currentPage.value < pageCount.value);

const range = (start: number, end: number) => {
  const result: number[] = [];
  for (let value = start; value <= end; value += 1) {
    result.push(value);
  }
  return result;
};

const pagerItems = computed<PagerToken[]>(() => {
  const totalPages = pageCount.value;
  const currentPageValue = currentPage.value;

  if (totalPages <= normalizedPagerCount.value) {
    return range(1, totalPages);
  }

  const siblingCount = Math.max(
    1,
    Math.floor((normalizedPagerCount.value - 5) / 2)
  );
  const totalNumbers = siblingCount * 2 + 3;
  const leftSibling = Math.max(currentPageValue - siblingCount, 2);
  const rightSibling = Math.min(currentPageValue + siblingCount, totalPages - 1);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    const leftItemCount = totalNumbers;
    return [...range(1, leftItemCount), "ellipsis-right", totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = totalNumbers;
    const start = Math.max(1, totalPages - rightItemCount + 1);
    return [1, "ellipsis-left", ...range(start, totalPages)];
  }

  return [
    1,
    "ellipsis-left",
    ...range(leftSibling, rightSibling),
    "ellipsis-right",
    totalPages
  ];
});

const jumperDraft = ref(String(currentPage.value));

watch(currentPage, (next) => {
  jumperDraft.value = String(next);
});

const commit = async (nextRaw: number, source: PaginationSource) => {
  if (props.disabled) {
    return;
  }

  const currentValue = currentPage.value;
  const next = clampPage(nextRaw);
  if (next === currentValue) {
    return;
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaPagination",
      action: source,
      payload: {
        current: currentValue,
        next,
        pageCount: pageCount.value,
        source
      }
    },
    async () => {
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", currentValue);
  }
};

const onPagerClick = (token: PagerToken) => {
  if (typeof token === "number") {
    void commit(token, "pager");
    return;
  }

  const jump = Math.max(2, normalizedPagerCount.value - 2);
  if (token === "ellipsis-left") {
    void commit(currentPage.value - jump, "pager");
    return;
  }

  void commit(currentPage.value + jump, "pager");
};

const onRootKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable)
  ) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    void commit(currentPage.value - 1, "prev");
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    void commit(currentPage.value + 1, "next");
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    void commit(1, "first");
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    void commit(pageCount.value, "last");
  }
};

const onJumperInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  jumperDraft.value = value.replace(/[^\d]/g, "");
};

const onJumperCommit = () => {
  if (!jumperDraft.value.trim()) {
    jumperDraft.value = String(currentPage.value);
    return;
  }

  const parsed = Number.parseInt(jumperDraft.value, 10);
  if (!Number.isFinite(parsed)) {
    jumperDraft.value = String(currentPage.value);
    return;
  }

  void commit(parsed, "jumper");
};
</script>

<template>
  <nav
    v-if="shouldRender"
    role="navigation"
    aria-label="pagination"
    :tabindex="disabled ? -1 : 0"
    :class="rootClass"
    v-bind="partAttrs('root')"
    @keydown="onRootKeydown"
  >
    <button
      type="button"
      :disabled="disabled || !canPrev"
      :class="partClass('prev', 'm-pagination__control m-pagination__control--prev')"
      v-bind="partAttrs('prev')"
      @click="commit(currentPage - 1, 'prev')"
    >
      <span aria-hidden="true">&lt;</span>
      <span class="m-pagination__text">Prev</span>
    </button>

    <div
      :class="partClass('pagers', 'm-pagination__pagers')"
      v-bind="partAttrs('pagers')"
    >
      <button
        v-for="token in pagerItems"
        :key="typeof token === 'number' ? `page-${token}` : token"
        type="button"
        :aria-current="typeof token === 'number' && token === currentPage ? 'page' : undefined"
        :class="
          partClass(
            typeof token === 'number' ? 'pager' : 'ellipsis',
            `m-pagination__pager ${
              typeof token === 'number' && token === currentPage ? 'is-active' : ''
            } ${typeof token !== 'number' ? 'is-ellipsis' : ''}`
          )
        "
        v-bind="
          partAttrs(typeof token === 'number' ? 'pager' : 'ellipsis', {
            'data-page': typeof token === 'number' ? token : undefined
          })
        "
        @click="onPagerClick(token)"
      >
        {{
          token === "ellipsis-left" || token === "ellipsis-right" ? "..." : token
        }}
      </button>
    </div>

    <button
      type="button"
      :disabled="disabled || !canNext"
      :class="partClass('next', 'm-pagination__control m-pagination__control--next')"
      v-bind="partAttrs('next')"
      @click="commit(currentPage + 1, 'next')"
    >
      <span class="m-pagination__text">Next</span>
      <span aria-hidden="true">&gt;</span>
    </button>

    <span
      v-if="showTotal"
      :class="partClass('total', 'm-pagination__total')"
      v-bind="partAttrs('total')"
    >
      <slot
        name="total"
        :total="safeTotal"
        :page-size="safePageSize"
        :page-count="pageCount"
      >
        Total {{ safeTotal }}
      </slot>
    </span>

    <label
      v-if="showJumper"
      :class="partClass('jumper', 'm-pagination__jumper')"
      v-bind="partAttrs('jumper')"
    >
      <span
        :class="partClass('jumper-label', 'm-pagination__jumper-label')"
        v-bind="partAttrs('jumper-label')"
      >
        Go
      </span>
      <input
        :value="jumperDraft"
        type="text"
        inputmode="numeric"
        :disabled="disabled"
        :class="partClass('jumper-field', 'm-pagination__jumper-field')"
        v-bind="partAttrs('jumper-field')"
        @input="onJumperInput"
        @keydown.enter.prevent="onJumperCommit"
      />
      <button
        type="button"
        :disabled="disabled"
        :class="partClass('jumper-go', 'm-pagination__jumper-go')"
        v-bind="partAttrs('jumper-go')"
        @click="onJumperCommit"
      >
        Go
      </button>
    </label>
  </nav>
</template>

<style>
.m-pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.46rem;
  color: var(--mecha-text);
}

.m-pagination.is-disabled {
  opacity: 0.58;
}

.m-pagination:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 4px;
  border-radius: 10px;
}

.m-pagination__control,
.m-pagination__pager,
.m-pagination__jumper-go {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 26%, #41576f);
  border-radius: 9px;
  background:
    linear-gradient(178deg, rgb(255 255 255 / 0.08), transparent 44%),
    color-mix(in srgb, var(--mecha-bg-soft) 76%, #0b1623);
  color: var(--mecha-text);
  cursor: pointer;
  transition:
    border-color var(--mecha-motion-fast) ease,
    background var(--mecha-motion-fast) ease,
    color var(--mecha-motion-fast) ease,
    transform var(--mecha-motion-fast) ease;
}

.m-pagination__control:hover,
.m-pagination__pager:hover,
.m-pagination__jumper-go:hover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 60%, #6b89a3);
  background:
    linear-gradient(156deg, rgb(32 214 255 / 0.2), transparent 74%),
    color-mix(in srgb, var(--mecha-bg-elevated) 80%, #112131);
}

.m-pagination__control:disabled,
.m-pagination__pager:disabled,
.m-pagination__jumper-go:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}

.m-pagination__control {
  min-inline-size: 2.7rem;
  block-size: 2rem;
  padding: 0 0.58rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.22rem;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-size: 0.68rem;
}

.m-pagination--sm .m-pagination__control {
  min-inline-size: 2.3rem;
  block-size: 1.72rem;
  font-size: 0.62rem;
}

.m-pagination__pagers {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
}

.m-pagination__pager {
  min-inline-size: 1.9rem;
  block-size: 2rem;
  padding: 0 0.45rem;
  font-family: var(--mecha-font-display);
  font-size: 0.74rem;
  letter-spacing: 0.06em;
}

.m-pagination--sm .m-pagination__pager {
  min-inline-size: 1.65rem;
  block-size: 1.72rem;
  font-size: 0.66rem;
}

.m-pagination__pager.is-active {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  color: color-mix(in srgb, var(--mecha-accent-cool) 78%, white);
  background:
    linear-gradient(156deg, rgb(32 214 255 / 0.28), transparent 68%),
    color-mix(in srgb, var(--mecha-bg-elevated) 82%, #132437);
  transform: translateY(-1px);
}

.m-pagination__pager.is-ellipsis {
  font-size: 0.68rem;
}

.m-pagination__total {
  margin-inline-start: 0.12rem;
  font-size: 0.74rem;
  color: var(--mecha-text-muted);
}

.m-pagination__jumper {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-inline-start: 0.12rem;
}

.m-pagination__jumper-label {
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.62rem;
  color: var(--mecha-text-muted);
}

.m-pagination__jumper-field {
  inline-size: 2.9rem;
  block-size: 1.92rem;
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 26%, #41576f);
  border-radius: 8px;
  background:
    linear-gradient(178deg, rgb(255 255 255 / 0.07), transparent 42%),
    color-mix(in srgb, var(--mecha-bg-soft) 74%, #0d1725);
  color: var(--mecha-text);
  text-align: center;
  font-family: "Iosevka Web", "Consolas", monospace;
  font-size: 0.78rem;
  padding: 0 0.32rem;
}

.m-pagination__jumper-field:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mecha-accent-cool) 70%, white);
  outline-offset: 1px;
}

.m-pagination__jumper-go {
  block-size: 1.92rem;
  min-inline-size: 2rem;
  padding: 0 0.52rem;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-size: 0.62rem;
}

@media (max-width: 760px) {
  .m-pagination {
    gap: 0.36rem;
  }

  .m-pagination__text {
    display: none;
  }
}
</style>
