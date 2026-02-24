<script setup lang="ts">
import { computed, ref } from "vue";
import type { MechaComponentUi, MechaInteractionPipeline } from "../types";
import { useMechaComponent } from "../composables/useMechaComponent";
import { runInteraction } from "../utils/interaction";

export interface MechaUploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status?: "ready" | "uploaded" | "error";
}

let uploadSeed = 0;

const props = withDefaults(
  defineProps<{
    modelValue?: MechaUploadFile[];
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    limit?: number;
    ui?: MechaComponentUi;
    pipeline?: MechaInteractionPipeline<{
      current: MechaUploadFile[];
      next: MechaUploadFile[];
      action: "add" | "remove" | "clear";
      files?: MechaUploadFile[];
    }>;
  }>(),
  {
    modelValue: () => [],
    accept: "",
    multiple: true,
    disabled: false,
    limit: 0,
    ui: undefined,
    pipeline: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: MechaUploadFile[]];
  change: [value: MechaUploadFile[]];
  blocked: [value: MechaUploadFile[]];
  exceed: [limit: number];
}>();

const { partClass, partAttrs } = useMechaComponent(
  "MechaUpload",
  undefined,
  props.ui
);

const inputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

const rootClass = computed(() =>
  partClass(
    "root",
    `m-upload ${props.disabled ? "is-disabled" : ""} ${
      isDragOver.value ? "is-dragover" : ""
    }`
  )
);

const hasFiles = computed(() => props.modelValue.length > 0);

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const createUploadFile = (file: File): MechaUploadFile => ({
  id: `${Date.now()}-${++uploadSeed}`,
  name: file.name,
  size: file.size,
  type: file.type,
  status: "ready"
});

const commitFiles = async (
  next: MechaUploadFile[],
  action: "add" | "remove" | "clear",
  files?: MechaUploadFile[]
) => {
  const success = await runInteraction(
    props.pipeline,
    {
      component: "MechaUpload",
      action,
      payload: {
        current: props.modelValue,
        next,
        action,
        files
      }
    },
    async () => {
      emit("update:modelValue", next);
      emit("change", next);
    }
  );

  if (!success) {
    emit("blocked", props.modelValue);
    return false;
  }

  return true;
};

const pickFiles = () => {
  if (props.disabled) {
    return;
  }
  inputRef.value?.click();
};

const resolveNextFiles = (incoming: MechaUploadFile[]) => {
  if (!props.multiple) {
    return incoming.length ? [incoming[0]] : [];
  }
  return [...props.modelValue, ...incoming];
};

const applyFiles = (fileList: FileList | null) => {
  if (!fileList || props.disabled) {
    return;
  }

  let incoming = Array.from(fileList).map(createUploadFile);
  if (!incoming.length) {
    return;
  }

  const currentLength = props.multiple ? props.modelValue.length : 0;
  if (props.limit > 0) {
    const remaining = Math.max(0, props.limit - currentLength);
    if (remaining <= 0) {
      emit("exceed", props.limit);
      return;
    }
    if (incoming.length > remaining) {
      incoming = incoming.slice(0, remaining);
      emit("exceed", props.limit);
    }
  }

  const next = resolveNextFiles(incoming);
  void commitFiles(next, "add", incoming);
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  applyFiles(target.files);
  target.value = "";
};

const removeFile = (id: string) => {
  if (props.disabled) {
    return;
  }

  const removed = props.modelValue.find((file) => file.id === id);
  if (!removed) {
    return;
  }

  const next = props.modelValue.filter((file) => file.id !== id);
  void commitFiles(next, "remove", [removed]);
};

const clearFiles = () => {
  if (props.disabled || !props.modelValue.length) {
    return;
  }
  void commitFiles([], "clear", props.modelValue);
};

const onDragOver = (event: DragEvent) => {
  if (props.disabled) {
    return;
  }
  event.preventDefault();
  isDragOver.value = true;
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = (event: DragEvent) => {
  if (props.disabled) {
    return;
  }
  event.preventDefault();
  isDragOver.value = false;
  applyFiles(event.dataTransfer?.files ?? null);
};
</script>

<template>
  <div
    :class="rootClass"
    v-bind="partAttrs('root')"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input
      ref="inputRef"
      type="file"
      :accept="accept || undefined"
      :multiple="multiple"
      :disabled="disabled"
      :class="partClass('input', 'm-upload__input')"
      v-bind="partAttrs('input')"
      @change="onFileChange"
    />

    <div :class="partClass('toolbar', 'm-upload__toolbar')" v-bind="partAttrs('toolbar')">
      <button
        type="button"
        :disabled="disabled"
        :class="partClass('trigger', 'm-upload__trigger')"
        v-bind="partAttrs('trigger')"
        @click="pickFiles"
      >
        {{ multiple ? "Select Files" : "Select File" }}
      </button>

      <button
        v-if="hasFiles"
        type="button"
        :disabled="disabled"
        :class="partClass('clear', 'm-upload__clear')"
        v-bind="partAttrs('clear')"
        @click="clearFiles"
      >
        Clear
      </button>
    </div>

    <ul :class="partClass('list', 'm-upload__list')" v-bind="partAttrs('list')">
      <li v-if="!hasFiles" class="m-upload__empty-row">
        <span :class="partClass('empty', 'm-upload__empty')" v-bind="partAttrs('empty')">
          Drop files here or click select.
        </span>
      </li>

      <li
        v-for="file in modelValue"
        :key="file.id"
        :class="partClass('item', 'm-upload__item')"
        v-bind="partAttrs('item', { 'data-file-id': file.id })"
      >
        <div :class="partClass('meta', 'm-upload__meta')" v-bind="partAttrs('meta')">
          <strong :class="partClass('name', 'm-upload__name')" v-bind="partAttrs('name')">
            {{ file.name }}
          </strong>
          <span :class="partClass('size', 'm-upload__size')" v-bind="partAttrs('size')">
            {{ formatFileSize(file.size) }}
          </span>
        </div>

        <button
          type="button"
          :disabled="disabled"
          :class="partClass('remove', 'm-upload__remove')"
          v-bind="partAttrs('remove')"
          @click="removeFile(file.id)"
        >
          Remove
        </button>
      </li>
    </ul>
  </div>
</template>

<style>
.m-upload {
  border: 1px dashed color-mix(in srgb, var(--mecha-accent-cool) 36%, #47627c);
  border-radius: var(--mecha-radius-md);
  background:
    linear-gradient(170deg, rgb(255 255 255 / 0.05), transparent 48%),
    color-mix(in srgb, var(--mecha-bg-soft) 76%, #101925);
  padding: 0.56rem;
  display: grid;
  gap: 0.45rem;
  inline-size: min(28rem, 100%);
}

.m-upload.is-dragover {
  border-color: color-mix(in srgb, var(--mecha-accent-cool) 72%, white);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08) inset;
}

.m-upload.is-disabled {
  opacity: 0.6;
}

.m-upload__input {
  display: none;
}

.m-upload__toolbar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.m-upload__trigger,
.m-upload__clear,
.m-upload__remove {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 30%, #47627d);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.07);
  color: var(--mecha-text);
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.62rem;
  padding: 0.32rem 0.54rem;
  cursor: pointer;
}

.m-upload__trigger:disabled,
.m-upload__clear:disabled,
.m-upload__remove:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.m-upload__clear {
  margin-left: auto;
}

.m-upload__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.26rem;
}

.m-upload__empty-row {
  margin: 0;
}

.m-upload__empty {
  display: block;
  border-radius: 8px;
  padding: 0.44rem 0.5rem;
  background: rgb(255 255 255 / 0.04);
  color: var(--mecha-text-muted);
  font-size: 0.74rem;
}

.m-upload__item {
  border: 1px solid color-mix(in srgb, var(--mecha-accent-cool) 20%, #445d75);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.04);
  padding: 0.4rem 0.44rem;
  display: flex;
  align-items: center;
  gap: 0.44rem;
}

.m-upload__meta {
  min-inline-size: 0;
  display: grid;
}

.m-upload__name {
  font-size: 0.78rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-upload__size {
  font-size: 0.67rem;
  color: var(--mecha-text-muted);
}

.m-upload__remove {
  margin-left: auto;
}
</style>
