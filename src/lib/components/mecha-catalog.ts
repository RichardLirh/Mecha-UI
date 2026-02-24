import { defineComponent, h, type PropType } from "vue";
import { useMechaComponent } from "../composables/useMechaComponent";
import type { MechaComponentUi } from "../types";

export type MechaCatalogCategory = "basic" | "config" | "form" | "data" | "navigation" | "feedback" | "other";

export interface MechaCatalogItem {
  name: string;
  tag: string;
  category: MechaCatalogCategory;
  description: string;
  parity: "element-plus";
}

export const MECHA_ELEMENT_PLUS_PARITY: ReadonlyArray<MechaCatalogItem> = [
  { name: "MechaButton", tag: "Button", category: "basic", description: "Combat action trigger with high-energy feedback.", parity: "element-plus" },
  { name: "MechaLayout", tag: "Layout", category: "basic", description: "Hull layout scaffold for dashboard composition.", parity: "element-plus" },
  { name: "MechaIcon", tag: "Icon", category: "basic", description: "Icon docking surface for symbolic telemetry.", parity: "element-plus" },
  { name: "MechaLink", tag: "Link", category: "basic", description: "Tactical route link with focusable signal style.", parity: "element-plus" },
  { name: "MechaText", tag: "Text", category: "basic", description: "Readable text block tuned for dense data.", parity: "element-plus" },
  { name: "MechaScrollbar", tag: "Scrollbar", category: "basic", description: "Scroll rail shell with mecha chrome.", parity: "element-plus" },
  { name: "MechaSplitter", tag: "Splitter", category: "basic", description: "Panel splitter for multi-console workspaces.", parity: "element-plus" },
  { name: "MechaConfigProvider", tag: "ConfigProvider", category: "config", description: "Global mission config surface.", parity: "element-plus" },
  { name: "MechaAutocomplete", tag: "Autocomplete", category: "form", description: "Predictive input shell for rapid command entry.", parity: "element-plus" },
  { name: "MechaCascader", tag: "Cascader", category: "form", description: "Hierarchical selector for system command trees.", parity: "element-plus" },
  { name: "MechaCheckbox", tag: "Checkbox", category: "form", description: "Binary mission toggle with armored frame.", parity: "element-plus" },
  { name: "MechaColorPickerPanel", tag: "ColorPickerPanel", category: "form", description: "Panel-level chroma calibration module.", parity: "element-plus" },
  { name: "MechaColorPicker", tag: "ColorPicker", category: "form", description: "Signal accent picker for HUD tuning.", parity: "element-plus" },
  { name: "MechaDatePickerPanel", tag: "DatePickerPanel", category: "form", description: "Date matrix panel for timeline planning.", parity: "element-plus" },
  { name: "MechaDatePicker", tag: "DatePicker", category: "form", description: "Date selector shell for mission scheduling.", parity: "element-plus" },
  { name: "MechaDateTimePicker", tag: "DateTimePicker", category: "form", description: "Date-time selector for command logs.", parity: "element-plus" },
  { name: "MechaForm", tag: "Form", category: "form", description: "Form container for mission parameter groups.", parity: "element-plus" },
  { name: "MechaInput", tag: "Input", category: "form", description: "Command input field with diagnostics skin.", parity: "element-plus" },
  { name: "MechaInputNumber", tag: "InputNumber", category: "form", description: "Numeric value input for reactor parameters.", parity: "element-plus" },
  { name: "MechaInputTag", tag: "InputTag", category: "form", description: "Tagging field for tactical metadata.", parity: "element-plus" },
  { name: "MechaMention", tag: "Mention", category: "form", description: "Operator mention shell for team channels.", parity: "element-plus" },
  { name: "MechaRadio", tag: "Radio", category: "form", description: "Exclusive selector for mode switching.", parity: "element-plus" },
  { name: "MechaRate", tag: "Rate", category: "form", description: "Rating control for post-mission scoring.", parity: "element-plus" },
  { name: "MechaSelect", tag: "Select", category: "form", description: "Single-select shell with elevated chrome.", parity: "element-plus" },
  { name: "MechaSlider", tag: "Slider", category: "form", description: "Analog range rail for fine system tuning.", parity: "element-plus" },
  { name: "MechaSwitch", tag: "Switch", category: "form", description: "High-contrast binary switch for quick decisions.", parity: "element-plus" },
  { name: "MechaTimePicker", tag: "TimePicker", category: "form", description: "Time selector for operation windows.", parity: "element-plus" },
  { name: "MechaTimeSelect", tag: "TimeSelect", category: "form", description: "Preset time selector with command presets.", parity: "element-plus" },
  { name: "MechaTransfer", tag: "Transfer", category: "form", description: "Dual-list transfer surface for unit routing.", parity: "element-plus" },
  { name: "MechaTreeSelect", tag: "TreeSelect", category: "form", description: "Tree-based selector for command topology.", parity: "element-plus" },
  { name: "MechaUpload", tag: "Upload", category: "form", description: "Asset upload dock with queue telemetry.", parity: "element-plus" },
  { name: "MechaAvatar", tag: "Avatar", category: "data", description: "Pilot avatar display frame.", parity: "element-plus" },
  { name: "MechaBadge", tag: "Badge", category: "data", description: "Status badge emitter for dense overlays.", parity: "element-plus" },
  { name: "MechaCalendar", tag: "Calendar", category: "data", description: "Calendar shell for operation planning.", parity: "element-plus" },
  { name: "MechaCard", tag: "Card", category: "data", description: "Card vessel for modular tactical widgets.", parity: "element-plus" },
  { name: "MechaCarousel", tag: "Carousel", category: "data", description: "Sequential viewport for rotating mission cards.", parity: "element-plus" },
  { name: "MechaCollapse", tag: "Collapse", category: "data", description: "Accordion shell for compact information stacks.", parity: "element-plus" },
  { name: "MechaDescriptions", tag: "Descriptions", category: "data", description: "Structured key-value telemetry board.", parity: "element-plus" },
  { name: "MechaEmpty", tag: "Empty", category: "data", description: "Idle-state fallback with mission context.", parity: "element-plus" },
  { name: "MechaImage", tag: "Image", category: "data", description: "Image frame for reconnaissance assets.", parity: "element-plus" },
  { name: "MechaInfiniteScroll", tag: "InfiniteScroll", category: "data", description: "Long-stream loader shell for logs.", parity: "element-plus" },
  { name: "MechaPagination", tag: "Pagination", category: "data", description: "Page navigator for dataset windows.", parity: "element-plus" },
  { name: "MechaProgress", tag: "Progress", category: "data", description: "Progress meter for process completion.", parity: "element-plus" },
  { name: "MechaResult", tag: "Result", category: "data", description: "Outcome panel for command responses.", parity: "element-plus" },
  { name: "MechaSkeleton", tag: "Skeleton", category: "data", description: "Loading skeleton with scanline texture.", parity: "element-plus" },
  { name: "MechaTable", tag: "Table", category: "data", description: "Tabular data shell for tactical matrices.", parity: "element-plus" },
  { name: "MechaTag", tag: "Tag", category: "data", description: "Compact semantic tag with neon border.", parity: "element-plus" },
  { name: "MechaTimeline", tag: "Timeline", category: "data", description: "Chronological event rail for mission logs.", parity: "element-plus" },
  { name: "MechaTour", tag: "Tour", category: "data", description: "Guided system walkthrough shell.", parity: "element-plus" },
  { name: "MechaTree", tag: "Tree", category: "data", description: "Hierarchical tree shell for subsystem maps.", parity: "element-plus" },
  { name: "MechaStatistic", tag: "Statistic", category: "data", description: "Large numerical readout module.", parity: "element-plus" },
  { name: "MechaSegmented", tag: "Segmented", category: "data", description: "Segment selector for fast mode toggles.", parity: "element-plus" },
  { name: "MechaAffix", tag: "Affix", category: "navigation", description: "Anchored module shell for persistent controls.", parity: "element-plus" },
  { name: "MechaAnchor", tag: "Anchor", category: "navigation", description: "Section anchor rail for long operations pages.", parity: "element-plus" },
  { name: "MechaBacktop", tag: "Backtop", category: "navigation", description: "Return-to-top action beacon.", parity: "element-plus" },
  { name: "MechaBreadcrumb", tag: "Breadcrumb", category: "navigation", description: "Path tracer for nested command routes.", parity: "element-plus" },
  { name: "MechaDropdown", tag: "Dropdown", category: "navigation", description: "Dropdown panel shell for option sets.", parity: "element-plus" },
  { name: "MechaMenu", tag: "Menu", category: "navigation", description: "Mission menu rail for mode switching.", parity: "element-plus" },
  { name: "MechaPageHeader", tag: "PageHeader", category: "navigation", description: "Page header scaffold with mission metadata.", parity: "element-plus" },
  { name: "MechaSteps", tag: "Steps", category: "navigation", description: "Step tracker for operation pipelines.", parity: "element-plus" },
  { name: "MechaTabs", tag: "Tabs", category: "navigation", description: "Tab rack for multi-console surfaces.", parity: "element-plus" },
  { name: "MechaAlert", tag: "Alert", category: "feedback", description: "Alert block for warning and incident states.", parity: "element-plus" },
  { name: "MechaDialog", tag: "Dialog", category: "feedback", description: "Dialog shell for blocking decisions.", parity: "element-plus" },
  { name: "MechaDrawer", tag: "Drawer", category: "feedback", description: "Side drawer for contextual panels.", parity: "element-plus" },
  { name: "MechaLoading", tag: "Loading", category: "feedback", description: "Loading overlay shell for command lock states.", parity: "element-plus" },
  { name: "MechaMessage", tag: "Message", category: "feedback", description: "Transient message shell for event pings.", parity: "element-plus" },
  { name: "MechaMessageBox", tag: "MessageBox", category: "feedback", description: "Message box panel for important prompts.", parity: "element-plus" },
  { name: "MechaNotification", tag: "Notification", category: "feedback", description: "Notification panel for asynchronous updates.", parity: "element-plus" },
  { name: "MechaPopconfirm", tag: "Popconfirm", category: "feedback", description: "Confirmation pop surface for risky actions.", parity: "element-plus" },
  { name: "MechaPopover", tag: "Popover", category: "feedback", description: "Context popover shell for quick details.", parity: "element-plus" },
  { name: "MechaTooltip", tag: "Tooltip", category: "feedback", description: "Tooltip shell for short operator hints.", parity: "element-plus" },
  { name: "MechaDivider", tag: "Divider", category: "other", description: "Visual divider rail for panel separation.", parity: "element-plus" },
  { name: "MechaWatermark", tag: "Watermark", category: "other", description: "Watermark layer for brand and traceability.", parity: "element-plus" },
];

export const MECHA_ELEMENT_PLUS_PARITY_COUNT = MECHA_ELEMENT_PLUS_PARITY.length;

const categoryLabel: Record<MechaCatalogCategory, string> = {
  basic: "Basic",
  config: "Config",
  form: "Form",
  data: "Data",
  navigation: "Navigation",
  feedback: "Feedback",
  other: "Other"
};

const createCatalogComponent = (item: MechaCatalogItem) =>
  defineComponent({
    name: item.name,
    inheritAttrs: false,
    props: {
      title: { type: String, default: "" },
      subtitle: { type: String, default: "" },
      modelValue: { type: null as unknown as PropType<unknown>, default: undefined },
      ui: { type: Object as PropType<MechaComponentUi>, default: undefined }
    },
    emits: {
      action: (_payload: { component: string; category: string; value: unknown }) => true
    },
    setup(props, { slots, emit }) {
      const { partClass, partAttrs } = useMechaComponent(item.name, undefined, props.ui);
      const trigger = () => {
        emit("action", {
          component: item.name,
          category: item.category,
          value: props.modelValue
        });
      };

      return () =>
        h(
          "section",
          {
            class: partClass("root", `m-catalog m-catalog--${item.category}`),
            ...partAttrs("root", { "data-catalog": item.tag })
          },
          [
            h(
              "header",
              { class: partClass("header", "m-catalog__header"), ...partAttrs("header") },
              [
                h(
                  "span",
                  { class: partClass("chip", "m-catalog__chip"), ...partAttrs("chip") },
                  categoryLabel[item.category]
                ),
                h(
                  "h4",
                  { class: partClass("title", "m-catalog__title"), ...partAttrs("title") },
                  props.title || item.tag
                )
              ]
            ),
            h(
              "div",
              { class: partClass("body", "m-catalog__body"), ...partAttrs("body") },
              slots.default?.() ??
                h(
                  "p",
                  { class: partClass("description", "m-catalog__description"), ...partAttrs("description") },
                  props.subtitle || item.description
                )
            ),
            h(
              "footer",
              { class: partClass("footer", "m-catalog__footer"), ...partAttrs("footer") },
              [
                h(
                  "code",
                  { class: partClass("code", "m-catalog__code"), ...partAttrs("code") },
                  item.name
                ),
                h(
                  "button",
                  {
                    type: "button",
                    class: partClass("trigger", "m-catalog__trigger"),
                    ...partAttrs("trigger"),
                    onClick: trigger
                  },
                  "simulate"
                )
              ]
            )
          ]
        );
    }
  });

const catalogRegistry = {
  MechaText: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaText")!),
  MechaSplitter: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaSplitter")!),
  MechaConfigProvider: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaConfigProvider")!),
  MechaInputTag: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaInputTag")!),
  MechaMention: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaMention")!),
  MechaTour: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaTour")!),
  MechaAnchor: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaAnchor")!),
  MechaDivider: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaDivider")!),
  MechaWatermark: createCatalogComponent(MECHA_ELEMENT_PLUS_PARITY.find((item) => item.name === "MechaWatermark")!),
} as const;

export const MechaText = catalogRegistry.MechaText;
export const MechaSplitter = catalogRegistry.MechaSplitter;
export const MechaConfigProvider = catalogRegistry.MechaConfigProvider;
export const MechaInputTag = catalogRegistry.MechaInputTag;
export const MechaMention = catalogRegistry.MechaMention;
export const MechaTour = catalogRegistry.MechaTour;
export const MechaAnchor = catalogRegistry.MechaAnchor;
export const MechaDivider = catalogRegistry.MechaDivider;
export const MechaWatermark = catalogRegistry.MechaWatermark;

export const MechaCatalogRegistry = catalogRegistry;
