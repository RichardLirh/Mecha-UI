<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

type TableAlign = "left" | "center" | "right";
type TableSortOrder = "asc" | "desc";

export interface MechaTableColumn {
  key: string;
  label: string;
  width?: string;
  align?: TableAlign;
  sortable?: boolean;
}

type TableRow = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    columns?: MechaTableColumn[];
    rows?: TableRow[];
    rowKey?: string;
    size?: "sm" | "md";
    stripe?: boolean;
    bordered?: boolean;
    hoverable?: boolean;
    disabled?: boolean;
    emptyText?: string;
    sortBy?: string | null;
    sortOrder?: TableSortOrder | null;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      action: "sort" | "row-click";
      currentSort: { by: string | null; order: TableSortOrder | null };
      nextSort: { by: string | null; order: TableSortOrder | null };
      column?: MechaTableColumn;
      row?: TableRow;
      rowIndex?: number;
    }>;
  }>(),
  {
    columns: () => [],
    rows: () => [],
    rowKey: "id",
    size: "md",
    stripe: true,
    bordered: true,
    hoverable: true,
    disabled: false,
    emptyText: "No data",
    sortBy: null,
    sortOrder: null,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:sortBy": [value: string | null];
  "update:sortOrder": [value: TableSortOrder | null];
  "sort-change": [
    payload: {
      sortBy: string | null;
      sortOrder: TableSortOrder | null;
      column?: MechaTableColumn;
    }
  ];
  "row-click": [payload: { row: TableRow; index: number }];
  blocked: [payload: { action: "sort" | "row-click" }];
}>();

const { partClass, partAttrs } = useMechaComponent("MechaTable", undefined, props.ui);

const localSortBy = ref<string | null>(props.sortBy);
const localSortOrder = ref<TableSortOrder | null>(props.sortOrder);

watch(
  () => props.sortBy,
  (next) => {
    localSortBy.value = next;
  }
);

watch(
  () => props.sortOrder,
  (next) => {
    localSortOrder.value = next;
  }
);

const resolvedColumns = computed<MechaTableColumn[]>(() => {
  if (props.columns.length) {
    return props.columns;
  }

  const firstRow = props.rows[0];
  if (!firstRow) {
    return [];
  }

  return Object.keys(firstRow).map((key) => ({
    key,
    label: key
      .replace(/_/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/^./, (char) => char.toUpperCase()),
    sortable: false
  }));
});

const rootClass = computed(() =>
  partClass(
    "root",
    `m-table m-table--${props.size} ${props.stripe ? "is-stripe" : ""} ${
      props.bordered ? "is-bordered" : ""
    } ${props.hoverable ? "is-hoverable" : ""} ${
      props.disabled ? "is-disabled" : ""
    }`
  )
);

const compareValues = (left: unknown, right: unknown) => {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return -1;
  }

  if (right === null || right === undefined) {
    return 1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, {
    sensitivity: "base",
    numeric: true
  });
};

const sortedRows = computed(() => {
  const sortBy = localSortBy.value;
  const sortOrder = localSortOrder.value;

  if (!sortBy || !sortOrder) {
    return props.rows;
  }

  const rows = [...props.rows];
  rows.sort((a, b) => {
    const compared = compareValues(a[sortBy], b[sortBy]);
    return sortOrder === "asc" ? compared : -compared;
  });
  return rows;
});

const getSortState = (column: MechaTableColumn) => {
  if (localSortBy.value !== column.key || !localSortOrder.value) {
    return "none";
  }
  return localSortOrder.value;
};

const isSortable = (column: MechaTableColumn) => Boolean(column.sortable);

const formatCell = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
};

const toggleSort = async (column: MechaTableColumn) => {
  if (props.disabled || !isSortable(column)) {
    return;
  }

  const current = { by: localSortBy.value, order: localSortOrder.value };
  let next: { by: string | null; order: TableSortOrder | null };

  if (localSortBy.value !== column.key) {
    next = { by: column.key, order: "asc" };
  } else if (localSortOrder.value === "asc") {
    next = { by: column.key, order: "desc" };
  } else if (localSortOrder.value === "desc") {
    next = { by: null, order: null };
  } else {
    next = { by: column.key, order: "asc" };
  }

  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTable",
      action: "sort",
      payload: {
        action: "sort",
        currentSort: current,
        nextSort: next,
        column
      }
    },
    async () => {
      localSortBy.value = next.by;
      localSortOrder.value = next.order;
      emit("update:sortBy", next.by);
      emit("update:sortOrder", next.order);
      emit("sort-change", {
        sortBy: next.by,
        sortOrder: next.order,
        column
      });
    }
  );

  if (!success) {
    emit("blocked", { action: "sort" });
  }
};

const onRowClick = async (row: TableRow, index: number) => {
  if (props.disabled) {
    return;
  }

  const current = { by: localSortBy.value, order: localSortOrder.value };
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaTable",
      action: "row-click",
      payload: {
        action: "row-click",
        currentSort: current,
        nextSort: current,
        row,
        rowIndex: index
      }
    },
    async () => {
      emit("row-click", { row, index });
    }
  );

  if (!success) {
    emit("blocked", { action: "row-click" });
  }
};
</script>

<template>
  <section :class="rootClass" v-bind="partAttrs('root')">
    <div :class="partClass('viewport', 'm-table__viewport')" v-bind="partAttrs('viewport')">
      <table :class="partClass('table', 'm-table__table')" v-bind="partAttrs('table')">
        <thead :class="partClass('head', 'm-table__head')" v-bind="partAttrs('head')">
          <tr :class="partClass('head-row', 'm-table__head-row')" v-bind="partAttrs('head-row')">
            <th
              v-for="column in resolvedColumns"
              :key="column.key"
              :style="{ width: column.width }"
              :class="
                partClass(
                  'head-cell',
                  `m-table__head-cell m-table__align-${column.align ?? 'left'}`
                )
              "
              v-bind="partAttrs('head-cell', { 'data-column': column.key })"
              scope="col"
            >
              <button
                v-if="isSortable(column)"
                type="button"
                :class="
                  partClass(
                    'sort',
                    `m-table__sort m-table__sort--${getSortState(column)}`
                  )
                "
                v-bind="partAttrs('sort')"
                @click="toggleSort(column)"
              >
                <slot :name="`header-${column.key}`" :column="column">
                  {{ column.label }}
                </slot>
                <span class="m-table__sort-icon" aria-hidden="true">
                  <span>^</span>
                  <span>v</span>
                </span>
              </button>

              <template v-else>
                <slot :name="`header-${column.key}`" :column="column">
                  {{ column.label }}
                </slot>
              </template>
            </th>
          </tr>
        </thead>

        <tbody :class="partClass('body', 'm-table__body')" v-bind="partAttrs('body')">
          <tr
            v-for="(row, rowIndex) in sortedRows"
            :key="String(row[rowKey] ?? rowIndex)"
            :class="partClass('row', 'm-table__row')"
            v-bind="partAttrs('row', { 'data-row-index': rowIndex })"
            @click="onRowClick(row, rowIndex)"
          >
            <td
              v-for="column in resolvedColumns"
              :key="`${String(row[rowKey] ?? rowIndex)}:${column.key}`"
              :class="
                partClass(
                  'cell',
                  `m-table__cell m-table__align-${column.align ?? 'left'}`
                )
              "
              v-bind="partAttrs('cell', { 'data-column': column.key })"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :column="column"
                :value="row[column.key]"
                :index="rowIndex"
              >
                {{ formatCell(row[column.key]) }}
              </slot>
            </td>
          </tr>

          <tr v-if="!sortedRows.length">
            <td
              :colspan="Math.max(1, resolvedColumns.length)"
              :class="partClass('empty', 'm-table__empty')"
              v-bind="partAttrs('empty')"
            >
              <slot name="empty">{{ emptyText }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style>
.m-table {
  inline-size: min(100%, 46rem);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(168deg, rgb(255 255 255 / 0.07), transparent 46%),
    color-mix(in srgb, var(--mecha-bg-soft) 84%, #09131f);
}

.m-table.is-bordered {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 22%, #3f5670);
}

.m-table.is-disabled {
  opacity: 0.56;
}

.m-table__viewport {
  overflow: auto;
  max-inline-size: 100%;
}

.m-table__table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.m-table__head-cell,
.m-table__cell {
  padding: 0.52rem 0.64rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
}

.m-table__head-cell {
  font-family: var(--mecha-font-display);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-size: 0.66rem;
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
  background: rgb(255 255 255 / 0.03);
}

.m-table__sort {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  font: inherit;
  inline-size: 100%;
  text-align: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.38rem;
  cursor: pointer;
}

.m-table__sort-icon {
  font-size: 0.55rem;
  opacity: 0.64;
  display: grid;
  line-height: 0.78;
}

.m-table__sort--asc .m-table__sort-icon,
.m-table__sort--desc .m-table__sort-icon {
  opacity: 1;
  color: color-mix(in srgb, var(--mecha-accent-cool) 74%, white);
}

.m-table__row {
  transition: background var(--mecha-motion-fast) ease;
}

.m-table.is-hoverable .m-table__row:hover {
  background: rgb(255 255 255 / 0.05);
}

.m-table.is-stripe .m-table__row:nth-child(even) {
  background: rgb(255 255 255 / 0.025);
}

.m-table__cell {
  color: color-mix(in srgb, var(--mecha-text) 92%, #daeaff);
}

.m-table__align-center {
  text-align: center;
}

.m-table__align-right {
  text-align: right;
}

.m-table__empty {
  text-align: center;
  color: var(--mecha-text-muted);
  padding: 0.88rem 0.72rem;
}

.m-table--sm .m-table__head-cell,
.m-table--sm .m-table__cell {
  padding: 0.42rem 0.52rem;
}
</style>
