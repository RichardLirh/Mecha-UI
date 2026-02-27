<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { MechaInteractionPipeline } from "./lib";
import {
  MECHA_ELEMENT_PLUS_PARITY,
  MechaAffix,
  MechaAlert,
  MechaAutocomplete,
  MechaAvatar,
  MechaBacktop,
  MechaBadge,
  MechaBreadcrumb,
  MechaButton,
  MechaCalendar,
  MechaCarousel,
  MechaCascader,
  MechaCard,
  MechaCollapse,
  MechaCatalogRegistry,
  MechaColorPicker,
  MechaColorPickerPanel,
  MechaDatePicker,
  MechaDatePickerPanel,
  MechaDateTimePicker,
  MechaDescriptions,
  MechaDialog,
  MechaDrawer,
  MechaDropdown,
  MechaEmpty,
  MechaImage,
  MechaInfiniteScroll,
  MechaMenu,
  MechaLoading,
  MechaMessage,
  MechaMessageBox,
  MechaPagination,
  MechaPageHeader,
  MechaNotification,
  MechaPopconfirm,
  MechaPopover,
  MechaResult,
  MechaSegmented,
  MechaSkeleton,
  MechaStatistic,
  MechaSteps,
  MechaTable,
  MechaTabs,
  MechaTimePicker,
  MechaTimeSelect,
  MechaTimeline,
  MechaTransfer,
  MechaTree,
  MechaTreeSelect,
  MechaTooltip,
  MechaUpload,
  MechaCheckbox,
  MechaForm,
  MechaIcon,
  MechaInput,
  MechaInputNumber,
  MechaLayout,
  MechaLink,
  MechaProgress,
  MechaRadio,
  MechaRate,
  MechaScrollbar,
  MechaSelect,
  MechaSlider,
  MechaSwitch,
  MechaTag
} from "./lib";

type PageSlug = string;

interface ApiRow {
  name: string;
  description: string;
  type: string;
  defaultValue: string;
}

interface PageMeta {
  title: string;
  summary: string;
  code: string;
  api: ApiRow[];
}

interface NavLink {
  label: string;
  slug?: PageSlug;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  links: NavLink[];
}

const pageMeta: Record<string, PageMeta> = {
  button: {
    title: "Button",
    summary:
      "Used to trigger primary actions. Supports variant, loading, and interaction pipeline hooks.",
    code: `<MechaButton :pipeline="launchPipeline" @click="triggerLaunch">
  Launch Drone
</MechaButton>`,
    api: [
      {
        name: "variant",
        description: "Visual style variant.",
        type: `"solid" | "ghost" | "danger"`,
        defaultValue: `"solid"`
      },
      {
        name: "size",
        description: "Button size.",
        type: `"sm" | "md" | "lg"`,
        defaultValue: `"md"`
      },
      {
        name: "loading",
        description: "Shows spinner and blocks click.",
        type: "boolean",
        defaultValue: "false"
      },
      {
        name: "pipeline",
        description: "before/after/onError interaction hooks.",
        type: "MechaInteractionPipeline<MouseEvent>",
        defaultValue: "undefined"
      }
    ]
  },
  icon: {
    title: "Icon",
    summary:
      "Symbol component with built-in glyphs, tone presets, and optional frame/motion effects.",
    code: `<MechaIcon name="radar" label="Radar signal" />
<MechaIcon name="sync" tone="cool" spin />
<MechaIcon name="bolt" tone="hot" framed />`,
    api: [
      {
        name: "name",
        description: "Built-in glyph key such as radar/bolt/target/sync/check/close.",
        type: "string",
        defaultValue: `"radar"`
      },
      {
        name: "size / strokeWidth",
        description: "Icon geometry size and line weight.",
        type: "string | number / number",
        defaultValue: "20 / 1.8"
      },
      {
        name: "tone",
        description: "Semantic color variant.",
        type: `"default" | "cool" | "hot" | "success" | "danger" | "muted"`,
        defaultValue: `"default"`
      },
      {
        name: "framed / spin / pulse",
        description: "Visual wrapper and motion behaviors.",
        type: "boolean",
        defaultValue: "false"
      },
      {
        name: "label / decorative",
        description: "Accessibility control for assistive technologies.",
        type: "string / boolean",
        defaultValue: `"" / false`
      }
    ]
  },
  layout: {
    title: "Layout",
    summary:
      "Flexible layout wrapper that supports flex/grid modes, spacing, alignment, and optional surface framing.",
    code: `<MechaLayout gap="0.8rem" padded surface bordered>
  <MechaTag type="info">Dock A1</MechaTag>
  <MechaTag type="warning">Dock B3</MechaTag>
</MechaLayout>`,
    api: [
      {
        name: "grid / columns / minColumnWidth",
        description: "Switch between flex and grid distribution strategies.",
        type: "boolean / number / string",
        defaultValue: "false / 2 / \"12rem\""
      },
      {
        name: "direction / align / justify / wrap",
        description: "Flex-axis alignment controls.",
        type: "\"row\" | \"column\" / align / justify / boolean",
        defaultValue: "\"row\" / \"stretch\" / \"start\" / true"
      },
      {
        name: "gap / padded / surface / bordered",
        description: "Spacing and chrome switches.",
        type: "string / boolean",
        defaultValue: "\"0.72rem\" / true / true / true"
      }
    ]
  },
  link: {
    title: "Link",
    summary:
      "Actionable link component with tone presets, underline modes, external marker, and interaction pipeline support.",
    code: `<MechaLink href="#/component/button">Open Button Docs</MechaLink>
<MechaLink href="https://element-plus.org" external tone="cool">
  Element Plus
</MechaLink>`,
    api: [
      {
        name: "href / target / rel / external",
        description: "Destination and external navigation semantics.",
        type: "string / string / string / boolean",
        defaultValue: "\"#\" / \"\" / \"\" / false"
      },
      {
        name: "tone / underline",
        description: "Visual tone and underline behavior.",
        type: "tone / \"always\" | \"hover\" | \"none\"",
        defaultValue: "\"default\" / \"hover\""
      },
      {
        name: "disabled / block",
        description: "Interaction lock and block display mode.",
        type: "boolean",
        defaultValue: "false"
      },
      {
        name: "pipeline",
        description: "before/after/onError link interaction hooks.",
        type: "MechaInteractionPipeline<{ href; target; external }>",
        defaultValue: "undefined"
      }
    ]
  },
  affix: {
    title: "Affix",
    summary:
      "Pins content to a fixed viewport offset while scrolling and preserves layout with placeholder spacing.",
    code: `<MechaAffix :offset-top="12" @change="addLog(\`AFFIX: \${$event}\`)">
  <MechaTag type="info">Pinned Filter</MechaTag>
</MechaAffix>`,
    api: [
      {
        name: "offsetTop / target",
        description: "Sticky threshold in pixels and optional scroll container selector.",
        type: "number / string",
        defaultValue: "0 / \"\""
      },
      {
        name: "zIndex / disabled",
        description: "Fixed layer stacking order and affix switch.",
        type: "number / boolean",
        defaultValue: "48 / false"
      }
    ]
  },
  backtop: {
    title: "Backtop",
    summary:
      "Shows a floating back-to-top action after scrolling past a threshold and scrolls target container to top.",
    code: `<MechaBacktop
  target="#backtop-demo-scroll"
  :visibility-height="120"
  :right="1.2"
  :bottom="1.2"
/>`,
    api: [
      {
        name: "visibilityHeight / target",
        description: "Display threshold and optional scroll container selector.",
        type: "number / string",
        defaultValue: "200 / \"\""
      },
      {
        name: "right / bottom",
        description: "Floating button inset positions.",
        type: "number | string",
        defaultValue: "1.1 / 1.1"
      },
      {
        name: "behavior / duration / pipeline",
        description: "Scroll motion mode, animation duration, and action interception hooks.",
        type: "\"smooth\" | \"auto\" / number / MechaInteractionPipeline<{ from; to; target }>",
        defaultValue: "\"smooth\" / 360 / undefined"
      }
    ]
  },
  breadcrumb: {
    title: "Breadcrumb",
    summary:
      "Hierarchical path trail with optional collapse, custom separators, and navigation intent events.",
    code: `<MechaBreadcrumb
  :items="breadcrumbItems"
  separator=">"
  @navigate="addLog(\`BREADCRUMB: \${$event.item.label}\`)"
/>`,
    api: [
      {
        name: "items / separator",
        description: "Path node list and visual separator token.",
        type: "MechaBreadcrumbItem[] / string",
        defaultValue: "[] / \"/\""
      },
      {
        name: "maxItems / disabled",
        description: "Collapse threshold and component lock state.",
        type: "number / boolean",
        defaultValue: "0 / false"
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for item navigate interactions.",
        type: "MechaInteractionPipeline<{ index; item; current; next }>",
        defaultValue: "undefined"
      }
    ]
  },
  dropdown: {
    title: "Dropdown",
    summary:
      "Trigger-driven popup menu with click/hover modes, selectable commands, and placement controls.",
    code: `<MechaDropdown
  label="Operations"
  :items="dropdownItems"
  @command="addLog(\`DROPDOWN: \${$event.value}\`)"
/>`,
    api: [
      {
        name: "label / items",
        description: "Trigger text and dropdown command source list.",
        type: "string / MechaDropdownItem[]",
        defaultValue: "\"Actions\" / []"
      },
      {
        name: "trigger / placement / hideOnClick",
        description: "Open mode, popup alignment, and auto-close switch.",
        type: "\"click\" | \"hover\" / \"bottom-start\" | \"bottom-end\" / boolean",
        defaultValue: "\"click\" / \"bottom-start\" / true"
      },
      {
        name: "modelValue / pipeline",
        description: "Controlled open state and action interception hooks.",
        type: "boolean / MechaInteractionPipeline<{ source; open; nextOpen; item? }>",
        defaultValue: "false / undefined"
      }
    ]
  },
  menu: {
    title: "Menu",
    summary:
      "Navigation menu supporting nested items, active state control, and collapsible submenu groups.",
    code: `<MechaMenu
  v-model="menuActiveValue"
  :items="menuItems"
  :opened-keys="menuOpened"
  @update:openedKeys="menuOpened = $event"
/>`,
    api: [
      {
        name: "modelValue / items",
        description: "Active menu key and menu tree structure.",
        type: "MechaMenuKey | null / MechaMenuItem[]",
        defaultValue: "null / []"
      },
      {
        name: "openedKeys / defaultOpenedKeys / accordion",
        description: "Controlled/initial expanded groups and single-open mode.",
        type: "MechaMenuKey[] / MechaMenuKey[] / boolean",
        defaultValue: "[] / [] / false"
      },
      {
        name: "mode / disabled / pipeline",
        description: "Layout mode, lock state, and select/toggle interception hooks.",
        type: "\"vertical\" | \"horizontal\" / boolean / MechaInteractionPipeline<{ action; key; current; next }>",
        defaultValue: "\"vertical\" / false / undefined"
      }
    ]
  },
  "page-header": {
    title: "Page Header",
    summary:
      "Top-level page heading block with optional breadcrumb trail, back action, and right-side action slots.",
    code: `<MechaPageHeader
  title="Mission Control"
  subtitle="Realtime wing operations dashboard."
  :crumbs="breadcrumbItems"
  show-back
  @back="addLog('PAGE HEADER: back')"
/>`,
    api: [
      {
        name: "title / subtitle / crumbs",
        description: "Header texts and breadcrumb node list.",
        type: "string / string / MechaPageHeaderCrumb[]",
        defaultValue: "\"\" / \"\" / []"
      },
      {
        name: "showBack / backText / compact",
        description: "Back action visibility, label text, and spacing density.",
        type: "boolean / string / boolean",
        defaultValue: "false / \"Back\" / false"
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for back action interception.",
        type: "MechaInteractionPipeline<{ action: \"back\"; title: string }>",
        defaultValue: "undefined"
      }
    ]
  },
  steps: {
    title: "Steps",
    summary:
      "Process tracker with current step state, optional click navigation, and horizontal/vertical layouts.",
    code: `<MechaSteps
  v-model="stepActive"
  :items="stepItems"
  clickable
/>`,
    api: [
      {
        name: "modelValue / items",
        description: "Current step index and step metadata list.",
        type: "number / MechaStepItem[]",
        defaultValue: "0 / []"
      },
      {
        name: "direction / alignCenter / simple",
        description: "Orientation, center alignment, and compact meta rendering.",
        type: "\"horizontal\" | \"vertical\" / boolean / boolean",
        defaultValue: "\"horizontal\" / false / false"
      },
      {
        name: "clickable / pipeline",
        description: "Enable step switching and interaction interception hooks.",
        type: "boolean / MechaInteractionPipeline<{ current; next; item; source }>",
        defaultValue: "false / undefined"
      }
    ]
  },
  tabs: {
    title: "Tabs",
    summary:
      "Tab navigation surface with active state control, closable tabs, and custom panel slot rendering.",
    code: `<MechaTabs
  v-model="tabActive"
  :items="tabItems"
  type="line"
/>`,
    api: [
      {
        name: "modelValue / items",
        description: "Active tab value and tab item source list.",
        type: "string | number | null / MechaTabItem[]",
        defaultValue: "null / []"
      },
      {
        name: "type / stretch / closable",
        description: "Visual style, equal-width mode, and close control switch.",
        type: "\"line\" | \"card\" / boolean / boolean",
        defaultValue: "\"line\" / false / false"
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for select/remove actions.",
        type: "MechaInteractionPipeline<{ current; next; source; item? }>",
        defaultValue: "undefined"
      }
    ]
  },
  alert: {
    title: "Alert",
    summary:
      "Feedback message block with semantic variants, close action, and optional icon/title/description composition.",
    code: `<MechaAlert
  v-model="alertVisible"
  type="warning"
  title="Signal Drift"
  description="Telemetry relay latency exceeded threshold."
  closable
/>`,
    api: [
      {
        name: "modelValue / type",
        description: "Visible state and semantic status style.",
        type: "boolean / \"info\" | \"success\" | \"warning\" | \"error\"",
        defaultValue: "true / \"info\""
      },
      {
        name: "title / description / closable",
        description: "Main message content and close control toggle.",
        type: "string / string / boolean",
        defaultValue: "\"\" / \"\" / false"
      },
      {
        name: "showIcon / center / pipeline",
        description: "Icon visibility, centered layout, and close-action hooks.",
        type: "boolean / boolean / MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "true / false / undefined"
      }
    ]
  },
  dialog: {
    title: "Dialog",
    summary:
      "Modal dialog overlay with keyboard/mask close controls, scroll locking, and footer action slots.",
    code: `<MechaDialog v-model="dialogVisible" title="Confirm Launch">
  <p>Proceed with wing deployment?</p>
</MechaDialog>`,
    api: [
      {
        name: "modelValue / title / width / top",
        description: "Dialog visibility and panel geometry options.",
        type: "boolean / string / string / string",
        defaultValue: "false / \"\" / \"min(90vw, 32rem)\" / \"11vh\""
      },
      {
        name: "modal / closeOnClickModal / closeOnPressEscape",
        description: "Mask behavior and keyboard close controls.",
        type: "boolean / boolean / boolean",
        defaultValue: "true / true / true"
      },
      {
        name: "showClose / lockScroll / pipeline",
        description: "Close button toggle, body lock, and close-interception hooks.",
        type: "boolean / boolean / MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "true / true / undefined"
      }
    ]
  },
  drawer: {
    title: "Drawer",
    summary:
      "Sliding side/top/bottom panel with modal mask and dismiss controls for contextual detail workflows.",
    code: `<MechaDrawer v-model="drawerVisible" title="Mission Detail" direction="rtl" />`,
    api: [
      {
        name: "modelValue / title / size / direction",
        description: "Drawer visibility, heading, panel size, and slide direction.",
        type: "boolean / string / string / \"rtl\" | \"ltr\" | \"ttb\" | \"btt\"",
        defaultValue: "false / \"\" / \"min(86vw, 22rem)\" / \"rtl\""
      },
      {
        name: "modal / closeOnClickModal / closeOnPressEscape",
        description: "Mask and dismiss interaction controls.",
        type: "boolean / boolean / boolean",
        defaultValue: "true / true / true"
      },
      {
        name: "showClose / lockScroll / pipeline",
        description: "Header close button, body lock, and close-interception hooks.",
        type: "boolean / boolean / MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "true / true / undefined"
      }
    ]
  },
  loading: {
    title: "Loading",
    summary:
      "Loading mask wrapper that can work inline or fullscreen with ring/dots spinner and optional click-to-close.",
    code: `<MechaLoading v-model="loadingVisible" text="Syncing..." spinner="ring">
  <MechaCard title="Payload">...</MechaCard>
</MechaLoading>`,
    api: [
      {
        name: "modelValue / text / spinner",
        description: "Loading state, helper text, and spinner style.",
        type: "boolean / string / \"ring\" | \"dots\"",
        defaultValue: "false / \"Loading...\" / \"ring\""
      },
      {
        name: "fullscreen / lock / background",
        description: "Overlay mode, click-close lock, and mask color.",
        type: "boolean / boolean / string",
        defaultValue: "false / true / \"rgb(6 10 16 / 0.56)\""
      },
      {
        name: "zIndex",
        description: "Overlay stacking order.",
        type: "number",
        defaultValue: "74"
      }
    ]
  },
  message: {
    title: "Message",
    summary:
      "Global top message toast with auto-close timer, semantic status styling, and optional close control.",
    code: `<MechaMessage
  v-model="messageVisible"
  type="success"
  message="Telemetry uplink restored."
  closable
/>`,
    api: [
      {
        name: "modelValue / type",
        description: "Visible state and semantic style variant.",
        type: "boolean / \"info\" | \"success\" | \"warning\" | \"error\"",
        defaultValue: "false / \"info\""
      },
      {
        name: "message / duration / offset",
        description: "Message text, auto-hide delay, and top offset spacing.",
        type: "string / number / number",
        defaultValue: "\"\" / 2600 / 18"
      },
      {
        name: "closable / showIcon / pipeline",
        description: "Manual close button, icon visibility, and close interception hooks.",
        type: "boolean / boolean / MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "false / true / undefined"
      }
    ]
  },
  "message-box": {
    title: "MessageBox",
    summary:
      "Decision dialog with confirm/cancel actions, modal dismiss controls, and keyboard escape handling.",
    code: `<MechaMessageBox
  v-model="messageBoxVisible"
  title="Abort Mission?"
  message="All queued drones will return to base."
/>`,
    api: [
      {
        name: "modelValue / title / message / type",
        description: "Visibility, heading, body text, and semantic accent.",
        type: "boolean / string / string / \"info\" | \"success\" | \"warning\" | \"error\"",
        defaultValue: "false / \"Confirm\" / \"\" / \"info\""
      },
      {
        name: "showCancelButton / showConfirmButton / confirmButtonType",
        description: "Footer action button visibility and confirm emphasis style.",
        type: "boolean / boolean / \"primary\" | \"danger\"",
        defaultValue: "true / true / \"primary\""
      },
      {
        name: "modal / closeOnClickModal / closeOnPressEscape / pipeline",
        description: "Mask behavior, keyboard close rule, and action interception hooks.",
        type: "boolean / boolean / boolean / MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "true / true / true / undefined"
      }
    ]
  },
  notification: {
    title: "Notification",
    summary:
      "Corner notification card with title/body composition, auto-dismiss timing, and position placement options.",
    code: `<MechaNotification
  v-model="notificationVisible"
  title="Patch Complete"
  message="Wing uplink channel synchronized."
  type="success"
/>`,
    api: [
      {
        name: "modelValue / title / message / type",
        description: "Visibility, heading text, body text, and semantic accent style.",
        type: "boolean / string / string / \"info\" | \"success\" | \"warning\" | \"error\"",
        defaultValue: "false / \"Notification\" / \"\" / \"info\""
      },
      {
        name: "position / duration / offset",
        description: "Screen anchor position, auto-hide delay, and edge spacing.",
        type: "\"top-right\" | \"top-left\" | \"bottom-right\" | \"bottom-left\" / number / number",
        defaultValue: "\"top-right\" / 3600 / 20"
      },
      {
        name: "closable / showIcon / pipeline",
        description: "Manual close button, icon visibility, and close interception hooks.",
        type: "boolean / boolean / MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "true / true / undefined"
      }
    ]
  },
  popconfirm: {
    title: "Popconfirm",
    summary:
      "Inline confirmation bubble attached to a trigger with confirm/cancel actions and flexible placement.",
    code: `<MechaPopconfirm
  title="Delete this route?"
  content="This action cannot be undone."
  @confirm="confirmDelete"
/>`,
    api: [
      {
        name: "modelValue / title / content",
        description: "Controlled open state and confirmation copy content.",
        type: "boolean / string / string",
        defaultValue: "false / \"Are you sure?\" / \"\""
      },
      {
        name: "trigger / placement",
        description: "Open behavior and bubble anchor direction.",
        type: "\"click\" | \"hover\" / \"top\" | \"bottom\" | \"left\" | \"right\"",
        defaultValue: "\"click\" / \"top\""
      },
      {
        name: "confirmType / hideAfterConfirm / hideAfterCancel / pipeline",
        description: "Confirm button style, auto-hide rules, and action interception hooks.",
        type: "\"primary\" | \"danger\" / boolean / boolean / MechaInteractionPipeline<{ source; open; nextOpen }>",
        defaultValue: "\"primary\" / true / true / undefined"
      }
    ]
  },
  popover: {
    title: "Popover",
    summary:
      "Context bubble card with custom title/body slots and click/hover/focus trigger strategies.",
    code: `<MechaPopover
  title="Thermal Notes"
  content="Core temperature remains stable."
  trigger="click"
/>`,
    api: [
      {
        name: "modelValue / title / content",
        description: "Open state and built-in heading/body text.",
        type: "boolean / string / string",
        defaultValue: "false / \"\" / \"\""
      },
      {
        name: "trigger / placement / width",
        description: "Open behavior, anchor direction, and panel width.",
        type: "\"click\" | \"hover\" | \"focus\" / \"top\" | \"bottom\" | \"left\" | \"right\" / string",
        defaultValue: "\"hover\" / \"top\" / \"min(88vw, 16rem)\""
      },
      {
        name: "showArrow / pipeline",
        description: "Arrow indicator toggle and open/close interception hooks.",
        type: "boolean / MechaInteractionPipeline<{ source; open; nextOpen }>",
        defaultValue: "true / undefined"
      }
    ]
  },
  tooltip: {
    title: "Tooltip",
    summary:
      "Compact text hint bubble with delayed show/hide timing and hover/focus/click trigger support.",
    code: `<MechaTooltip content="Re-sync tactical cache">
  <MechaButton size="sm" variant="ghost">Hover Me</MechaButton>
</MechaTooltip>`,
    api: [
      {
        name: "modelValue / content",
        description: "Controlled visibility and text content.",
        type: "boolean / string",
        defaultValue: "false / \"\""
      },
      {
        name: "trigger / placement / openDelay / hideDelay",
        description: "Activation mode, anchor direction, and delay timings.",
        type: "\"hover\" | \"focus\" | \"click\" / \"top\" | \"bottom\" | \"left\" | \"right\" / number / number",
        defaultValue: "\"hover\" / \"top\" / 80 / 80"
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for tooltip open/close transitions.",
        type: "MechaInteractionPipeline<{ source; open; nextOpen }>",
        defaultValue: "undefined"
      }
    ]
  },
  avatar: {
    title: "Avatar",
    summary:
      "Identity avatar with image/fallback rendering, shape presets, status dot indicators, and size control.",
    code: `<MechaAvatar name="Atlas Seven" status="online" />
<MechaAvatar :src="avatarPortrait" shape="rounded" status="busy" />
<MechaAvatar name="Nova-09" shape="square" status="warning" />`,
    api: [
      {
        name: "src / alt / name",
        description: "Image source, accessible alt text, and fallback initials source.",
        type: "string",
        defaultValue: `""`
      },
      {
        name: "size / shape / fit",
        description: "Avatar size, geometry shape, and image object-fit strategy.",
        type: "number | string / \"circle\" | \"rounded\" | \"square\" / \"cover\" | \"contain\"",
        defaultValue: "42 / \"circle\" / \"cover\""
      },
      {
        name: "status / bordered",
        description: "Presence indicator state and frame border switch.",
        type: "\"none\" | \"online\" | \"busy\" | \"warning\" | \"offline\" / boolean",
        defaultValue: "\"none\" / true"
      }
    ]
  },
  badge: {
    title: "Badge",
    summary:
      "Overlay badge indicator for counts or dots with max cap, type variants, and optional standalone mode.",
    code: `<MechaBadge :value="messageCount">
  <MechaButton size="sm">Alerts</MechaButton>
</MechaBadge>
<MechaBadge dot type="danger">
  <MechaTag type="warning">Telemetry</MechaTag>
</MechaBadge>`,
    api: [
      {
        name: "value / max / showZero",
        description: "Count display value, overflow cap, and zero-value display control.",
        type: "string | number | null / number / boolean",
        defaultValue: "null / 99 / false"
      },
      {
        name: "dot / hidden / type",
        description: "Dot mode, forced hide flag, and semantic color style.",
        type: "boolean / boolean / \"primary\" | \"success\" | \"warning\" | \"danger\" | \"info\"",
        defaultValue: "false / false / \"primary\""
      },
      {
        name: "offset",
        description: "Pixel offset for badge indicator position [x, y].",
        type: "[number, number]",
        defaultValue: "[0, 0]"
      }
    ]
  },
  calendar: {
    title: "Calendar",
    summary:
      "Date selection calendar wrapper with current selection header and reusable date panel internals.",
    code: `<MechaCalendar
  v-model="calendarDate"
  :shortcuts="dateShortcuts"
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected date in YYYY-MM-DD format.",
        type: "string | null",
        defaultValue: "null"
      },
      {
        name: "title / firstDayOfWeek",
        description: "Header title text and week start index.",
        type: "string / number",
        defaultValue: "\"Calendar\" / 1"
      },
      {
        name: "shortcuts / panelUi / pipeline",
        description: "Panel shortcuts, panel part overrides, and interaction hooks.",
        type: "DatePanelShortcut[] / MechaComponentUi / MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "[Today, Tomorrow, +7 Days] / undefined / undefined"
      }
    ]
  },
  card: {
    title: "Card",
    summary:
      "Content card container with status accents, header actions, optional footer, and interactive click mode.",
    code: `<MechaCard title="Recon Briefing" subtitle="Wing RAVEN-12" status="info">
  <template #actions><MechaBadge :value="2" type="danger" /></template>
  <p>Route synced. Launch window armed.</p>
</MechaCard>`,
    api: [
      {
        name: "title / subtitle / status",
        description: "Card heading text and semantic accent type.",
        type: "string / string / \"default\" | \"info\" | \"success\" | \"warning\" | \"danger\"",
        defaultValue: `"" / "" / "default"`
      },
      {
        name: "shadow / bordered / padding",
        description: "Shadow behavior, border visibility, and body spacing control.",
        type: "\"always\" | \"hover\" | \"never\" / boolean / string",
        defaultValue: "\"always\" / true / \"0.9rem\""
      },
      {
        name: "interactive / pipeline",
        description: "Enable click/keyboard interaction and interception hooks.",
        type: "boolean / MechaInteractionPipeline<{ action; title; status }>",
        defaultValue: "false / undefined"
      }
    ]
  },
  carousel: {
    title: "Carousel",
    summary:
      "Slide rotator with arrow/dot navigation, optional autoplay, keyboard support, and pipeline-aware state changes.",
    code: `<MechaCarousel
  v-model="carouselIndex"
  :items="carouselItems"
  autoplay
  :interval="3200"
/>`,
    api: [
      {
        name: "modelValue / items",
        description: "Current slide index and carousel item source data.",
        type: "number / MechaCarouselItem[]",
        defaultValue: "0 / []"
      },
      {
        name: "autoplay / interval / loop",
        description: "Auto-switch timing and edge wrapping behavior.",
        type: "boolean / number / boolean",
        defaultValue: "false / 3400 / true"
      },
      {
        name: "showArrows / showDots / height",
        description: "Navigation controls visibility and viewport height.",
        type: "boolean / boolean / string",
        defaultValue: "true / true / \"13.5rem\""
      }
    ]
  },
  collapse: {
    title: "Collapse",
    summary:
      "Accordion-style disclosure list for dense content sections with optional single-open mode.",
    code: `<MechaCollapse
  v-model="collapseActive"
  :items="collapseItems"
  accordion
/>`,
    api: [
      {
        name: "modelValue / items",
        description: "Opened panel names and collapse item content list.",
        type: "Array<string | number> / MechaCollapseItem[]",
        defaultValue: "[] / []"
      },
      {
        name: "accordion / disabled",
        description: "Single-open mode and interaction lock state.",
        type: "boolean / boolean",
        defaultValue: "false / false"
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for open/close transitions.",
        type: "MechaInteractionPipeline<{ current; next; item }>",
        defaultValue: "undefined"
      }
    ]
  },
  descriptions: {
    title: "Descriptions",
    summary:
      "Key-value information board with responsive grid columns and optional span control.",
    code: `<MechaDescriptions
  title="Mission Snapshot"
  :items="descriptionItems"
  :columns="3"
/>`,
    api: [
      {
        name: "items / columns",
        description: "Description rows and grid column count.",
        type: "MechaDescriptionItem[] / number",
        defaultValue: "[] / 3"
      },
      {
        name: "title / size / bordered",
        description: "Header text, density mode, and frame switch.",
        type: "string / \"sm\" | \"md\" / boolean",
        defaultValue: "\"\" / \"md\" / true"
      }
    ]
  },
  empty: {
    title: "Empty",
    summary:
      "Empty-state placeholder block with optional custom illustration and action slot.",
    code: `<MechaEmpty
  title="No Active Recon Drones"
  description="Deploy a drone to begin telemetry stream."
>
  <MechaButton size="sm">Deploy</MechaButton>
</MechaEmpty>`,
    api: [
      {
        name: "title / description",
        description: "Primary and secondary empty-state texts.",
        type: "string / string",
        defaultValue: "\"No Data\" / \"No records are currently available.\""
      },
      {
        name: "size / compact",
        description: "Illustration size and compact spacing mode.",
        type: "number | string / boolean",
        defaultValue: "70 / false"
      }
    ]
  },
  image: {
    title: "Image",
    summary:
      "Image frame with fallback rendering, lazy loading, and optional fullscreen preview overlay.",
    code: `<MechaImage
  :src="reconImage"
  alt="Recon feed"
  preview
  width="min(100%, 24rem)"
/>`,
    api: [
      {
        name: "src / alt / fit",
        description: "Source URL, accessible alt text, and object-fit mode.",
        type: "string / string / \"cover\" | \"contain\" | \"fill\"",
        defaultValue: "\"\" / \"\" / \"cover\""
      },
      {
        name: "width / height / radius",
        description: "Frame geometry sizing and corner radius.",
        type: "string / string / string",
        defaultValue: "\"min(100%, 24rem)\" / \"14rem\" / \"12px\""
      },
      {
        name: "preview / fallbackText",
        description: "Fullscreen preview toggle and fallback label.",
        type: "boolean / string",
        defaultValue: "false / \"Image unavailable\""
      }
    ]
  },
  "infinite-scroll": {
    title: "Infinite Scroll",
    summary:
      "Scrollable container that emits load events near bottom with loading and finished states.",
    code: `<MechaInfiniteScroll
  :loading="infiniteLoading"
  :finished="infiniteFinished"
  @load="loadMoreInfinite"
>
  <!-- content -->
</MechaInfiniteScroll>`,
    api: [
      {
        name: "height / distance / delay",
        description: "Viewport height and load trigger threshold/throttle values.",
        type: "string / number / number",
        defaultValue: "\"14rem\" / 80 / 120"
      },
      {
        name: "loading / finished / disabled",
        description: "Current loading lifecycle state and interaction lock.",
        type: "boolean / boolean / boolean",
        defaultValue: "false / false / false"
      },
      {
        name: "immediate",
        description: "Check load condition on mount when true.",
        type: "boolean",
        defaultValue: "true"
      }
    ]
  },
  pagination: {
    title: "Pagination",
    summary:
      "Page navigator with prev/next controls, condensed pager ranges, optional total display, and quick jump input.",
    code: `<MechaPagination
  v-model="paginationPage"
  :total="146"
  :page-size="10"
  :pager-count="9"
  show-total
  show-jumper
/>`,
    api: [
      {
        name: "modelValue / total / pageSize",
        description: "Current page index, dataset size, and records per page.",
        type: "number / number / number",
        defaultValue: "1 / 0 / 10"
      },
      {
        name: "pagerCount / hideOnSinglePage / disabled",
        description: "Visible pager density and interaction visibility/lock controls.",
        type: "number / boolean / boolean",
        defaultValue: "7 / false / false"
      },
      {
        name: "showTotal / showJumper / pipeline",
        description: "Summary and quick-jump features plus interaction interception hooks.",
        type: "boolean / boolean / MechaInteractionPipeline<{ current; next; pageCount; source }>",
        defaultValue: "false / false / undefined"
      }
    ]
  },
  input: {
    title: "Input",
    summary:
      "Text input control for form data entry with label, hint, and state variants.",
    code: `<MechaInput v-model="pilotId" label="Pilot ID" hint="Identity channel" />`,
    api: [
      {
        name: "modelValue",
        description: "Bound field value.",
        type: "string",
        defaultValue: `""`
      },
      {
        name: "label",
        description: "Visible field label.",
        type: "string",
        defaultValue: `""`
      },
      {
        name: "state",
        description: "Input status color state.",
        type: `"default" | "success" | "warning" | "danger"`,
        defaultValue: `"default"`
      }
    ]
  },
  switch: {
    title: "Switch",
    summary:
      "Binary toggle control used for feature flags and mission state switching.",
    code: `<MechaSwitch v-model="reactorLinked" label="Reactor Link" />`,
    api: [
      {
        name: "modelValue",
        description: "Bound on/off state.",
        type: "boolean",
        defaultValue: "false"
      },
      {
        name: "label",
        description: "Label text shown next to switch.",
        type: "string",
        defaultValue: `""`
      },
      {
        name: "disabled",
        description: "Disable interaction.",
        type: "boolean",
        defaultValue: "false"
      }
    ]
  },
  checkbox: {
    title: "Checkbox",
    summary:
      "Multi-select style boolean control with optional indeterminate state.",
    code: `<MechaCheckbox v-model="missionAck" label="Mission Acknowledge" />`,
    api: [
      {
        name: "modelValue",
        description: "Checked state.",
        type: "boolean",
        defaultValue: "false"
      },
      {
        name: "indeterminate",
        description: "Mixed state display.",
        type: "boolean",
        defaultValue: "false"
      },
      {
        name: "pipeline",
        description: "Interaction guard hooks.",
        type: "MechaInteractionPipeline<{ current; next }>",
        defaultValue: "undefined"
      }
    ]
  },
  radio: {
    title: "Radio",
    summary:
      "Single-choice selection control, usually used as grouped options.",
    code: `<MechaRadio v-model="fireMode" value="single" name="fire-mode" label="Single" />`,
    api: [
      {
        name: "modelValue",
        description: "Current group value.",
        type: "string | number | boolean | null",
        defaultValue: "null"
      },
      {
        name: "value",
        description: "Current radio option value.",
        type: "string | number | boolean",
        defaultValue: "undefined"
      },
      {
        name: "name",
        description: "Native radio group name.",
        type: "string",
        defaultValue: `""`
      }
    ]
  },
  rate: {
    title: "Rate",
    summary:
      "Rating selector with star fill states, optional half steps, keyboard support, and interaction pipeline hooks.",
    code: `<MechaRate
  v-model="missionRating"
  allow-half
  clearable
  show-score
/>`,
    api: [
      {
        name: "modelValue",
        description: "Current rating value.",
        type: "number",
        defaultValue: "0"
      },
      {
        name: "max / allowHalf / clearable",
        description: "Maximum icons, half-step behavior, and click-to-clear behavior.",
        type: "number / boolean / boolean",
        defaultValue: "5 / false / false"
      },
      {
        name: "showScore / size / disabled / readonly",
        description: "Score text display and interaction controls.",
        type: "boolean / number | string / boolean / boolean",
        defaultValue: "false / 24 / false / false"
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for select/keyboard/clear actions.",
        type: "MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "undefined"
      }
    ]
  },
  "input-number": {
    title: "InputNumber",
    summary:
      "Numeric input with increment/decrement controls, keyboard arrows, precision control, and pipeline hooks.",
    code: `<MechaInputNumber
  v-model="missionBudget"
  :min="0"
  :max="500"
  :step="10"
  :precision="0"
/>`,
    api: [
      {
        name: "modelValue",
        description: "Bound numeric value.",
        type: "number | null",
        defaultValue: "null"
      },
      {
        name: "min / max / step",
        description: "Value range and stepping size.",
        type: "number",
        defaultValue: "-Infinity / Infinity / 1"
      },
      {
        name: "precision",
        description: "Decimal precision applied on commit.",
        type: "number | null",
        defaultValue: "null"
      },
      {
        name: "controlsPosition",
        description: "Position of +/- controls.",
        type: `"right" | "both"`,
        defaultValue: `"right"`
      }
    ]
  },
  autocomplete: {
    title: "Autocomplete",
    summary:
      "Predictive input with local suggestion filtering, keyboard navigation, and clear support.",
    code: `<MechaAutocomplete
  v-model="commandQuery"
  :options="commandOptions"
  placeholder="Type mission command"
  clearable
/>`,
    api: [
      {
        name: "modelValue",
        description: "Current text value in the input field.",
        type: "string",
        defaultValue: `""`
      },
      {
        name: "options",
        description: "Suggestion sources as strings or rich option objects.",
        type: "Array<string | { label; value?; hint?; disabled? }>",
        defaultValue: "[]"
      },
      {
        name: "clearable / triggerOnFocus / maxSuggestions",
        description: "Clear action visibility, focus trigger, and result limit.",
        type: "boolean / boolean / number",
        defaultValue: "false / true / 8"
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for input/select/clear actions.",
        type: "MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "undefined"
      }
    ]
  },
  select: {
    title: "Select",
    summary:
      "Dropdown selector with disabled options, option hints, and keyboard support.",
    code: `<MechaSelect
  v-model="targetSector"
  :options="sectorOptions"
  placeholder="Target Sector"
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected value.",
        type: "string | number | null",
        defaultValue: "null"
      },
      {
        name: "options",
        description: "Option list with label/value/hint/disabled.",
        type: "Array<{ label; value; hint?; disabled? }>",
        defaultValue: "[]"
      },
      {
        name: "placeholder",
        description: "Text shown when no value selected.",
        type: "string",
        defaultValue: `"Select"`
      }
    ]
  },
  cascader: {
    title: "Cascader",
    summary:
      "Hierarchical selector with multilevel panels, breadcrumb-like display, and optional clear action.",
    code: `<MechaCascader
  v-model="missionRoute"
  :options="routeOptions"
  placeholder="Select Route"
  clearable
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected route path.",
        type: "Array<string | number>",
        defaultValue: "[]"
      },
      {
        name: "options",
        description: "Nested cascader options.",
        type: "MechaCascaderOption[]",
        defaultValue: "[]"
      },
      {
        name: "checkStrictly",
        description: "Allow selecting non-leaf node directly.",
        type: "boolean",
        defaultValue: "false"
      }
    ]
  },
  "color-picker-panel": {
    title: "ColorPickerPanel",
    summary:
      "Color selection panel with canvas picking, hue/alpha sliders, presets, and hex input.",
    code: `<MechaColorPickerPanel
  v-model="panelColor"
  v-model:alpha="panelAlpha"
  :presets="panelPresets"
  showAlpha
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected hex color value.",
        type: "string",
        defaultValue: `"#20D6FF"`
      },
      {
        name: "alpha",
        description: "Alpha channel value.",
        type: "number (0-1)",
        defaultValue: "1"
      },
      {
        name: "presets",
        description: "Preset color list.",
        type: "string[]",
        defaultValue: `["#20d6ff", "#ff7a18", ...]`
      }
    ]
  },
  "color-picker": {
    title: "Color Picker",
    summary:
      "Color selection control with picker panel, alpha channel, and preset swatches.",
    code: `<MechaColorPicker
  v-model="panelColor"
  v-model:alpha="panelAlpha"
  :presets="panelPresets"
  clearable
  show-alpha
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected hex color value. Empty string means no selection.",
        type: "string",
        defaultValue: `"#20D6FF"`
      },
      {
        name: "alpha",
        description: "Alpha channel value.",
        type: "number (0-1)",
        defaultValue: "1"
      },
      {
        name: "presets",
        description: "Preset color list.",
        type: "string[]",
        defaultValue: `["#20d6ff", "#ff7a18", ...]`
      },
      {
        name: "clearable",
        description: "Show clear button to reset to empty color.",
        type: "boolean",
        defaultValue: "false"
      }
    ]
  },
  "date-picker-panel": {
    title: "DatePickerPanel",
    summary:
      "Calendar panel for day-level picking with month navigation and quick shortcuts.",
    code: `<MechaDatePickerPanel
  v-model="panelDate"
  :shortcuts="dateShortcuts"
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected date in YYYY-MM-DD format.",
        type: "string | null",
        defaultValue: "null"
      },
      {
        name: "shortcuts",
        description: "Quick date selection options.",
        type: "Array<{ label; value?; daysOffset? }>",
        defaultValue: "[Today, Tomorrow, +7 Days]"
      },
      {
        name: "firstDayOfWeek",
        description: "Week start day index.",
        type: "number (0-6)",
        defaultValue: "1"
      }
    ]
  },
  "date-picker": {
    title: "DatePicker",
    summary:
      "Input-triggered date selector with popup calendar panel, clear action, and quick shortcuts.",
    code: `<MechaDatePicker
  v-model="selectedDate"
  :shortcuts="dateShortcuts"
  clearable
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected date in YYYY-MM-DD format.",
        type: "string | null",
        defaultValue: "null"
      },
      {
        name: "clearable",
        description: "Show clear control when value exists.",
        type: "boolean",
        defaultValue: "false"
      },
      {
        name: "shortcuts / firstDayOfWeek",
        description: "Calendar quick actions and week start day.",
        type: "DatePanelShortcut[] / number",
        defaultValue: "[Today, Tomorrow, +7 Days] / 1"
      }
    ]
  },
  "date-time-picker": {
    title: "DateTimePicker",
    summary:
      "Date and time selector that combines calendar panel with time segment controls.",
    code: `<MechaDateTimePicker
  v-model="selectedDateTime"
  :shortcuts="dateShortcuts"
  :minute-step="5"
  clearable
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected datetime in YYYY-MM-DD HH:mm:ss format.",
        type: "string | null",
        defaultValue: "null"
      },
      {
        name: "minuteStep",
        description: "Step size for minute/second options.",
        type: "number",
        defaultValue: "5"
      },
      {
        name: "showSeconds",
        description: "Whether second field is displayed.",
        type: "boolean",
        defaultValue: "true"
      }
    ]
  },
  "time-picker": {
    title: "TimePicker",
    summary:
      "Popup time selector with hour/minute/second controls, keyboard trigger behavior, and clear action.",
    code: `<MechaTimePicker
  v-model="selectedTime"
  :minute-step="5"
  :second-step="10"
  clearable
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected time in HH:mm or HH:mm:ss format.",
        type: "string | null",
        defaultValue: "null"
      },
      {
        name: "showSeconds / minuteStep / secondStep",
        description: "Second field visibility and minute/second stepping options.",
        type: "boolean / number / number",
        defaultValue: "true / 5 / 5"
      },
      {
        name: "clearable / disabled",
        description: "Clear control and interaction lock flags.",
        type: "boolean",
        defaultValue: "false"
      }
    ]
  },
  "time-select": {
    title: "TimeSelect",
    summary:
      "Preset time dropdown generated from start/end/step range with optional min/max constraints.",
    code: `<MechaTimeSelect
  v-model="selectedPresetTime"
  start="08:00"
  end="18:00"
  step="00:30"
  clearable
/>`,
    api: [
      {
        name: "modelValue",
        description: "Selected time option in HH:mm format.",
        type: "string | null",
        defaultValue: "null"
      },
      {
        name: "start / end / step",
        description: "Preset generation range and step interval.",
        type: "string / string / string",
        defaultValue: `"08:00" / "18:00" / "00:30"`
      },
      {
        name: "minTime / maxTime",
        description: "Optional selectable lower and upper limits.",
        type: "string | null",
        defaultValue: "null"
      }
    ]
  },
  transfer: {
    title: "Transfer",
    summary:
      "Dual-panel transfer list with filtering, multi-select movement, and pipeline-aware state updates.",
    code: `<MechaTransfer
  v-model="transferSelection"
  :options="transferOptions"
  filterable
/>`,
    api: [
      {
        name: "modelValue",
        description: "Keys currently placed in target panel.",
        type: "Array<string | number>",
        defaultValue: "[]"
      },
      {
        name: "options",
        description: "Source option data with key/label/hint/disabled.",
        type: "MechaTransferOption[]",
        defaultValue: "[]"
      },
      {
        name: "titles / filterable / disabled",
        description: "Panel labels and interaction options.",
        type: "[string, string] / boolean / boolean",
        defaultValue: `["Available", "Selected"] / false / false`
      }
    ]
  },
  upload: {
    title: "Upload",
    summary:
      "File selection surface with click/drop intake, list management, and removable queue entries.",
    code: `<MechaUpload
  v-model="uploadQueue"
  multiple
  :limit="4"
  accept=".pdf,.png,.jpg"
/>`,
    api: [
      {
        name: "modelValue",
        description: "Current upload queue objects.",
        type: "MechaUploadFile[]",
        defaultValue: "[]"
      },
      {
        name: "accept / multiple / limit",
        description: "Native file constraints for selected items.",
        type: "string / boolean / number",
        defaultValue: `"" / true / 0`
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for add/remove/clear actions.",
        type: "MechaInteractionPipeline<{ current; next; action; files? }>",
        defaultValue: "undefined"
      }
    ]
  },
  form: {
    title: "Form",
    summary:
      "Form container with labeled layout helpers, submit/reset lifecycle, and action pipeline guards.",
    code: `<MechaForm :model="formModel" :pipeline="formPipeline" @submit="submitMissionForm">
  <!-- m-form-item structure -->
</MechaForm>`,
    api: [
      {
        name: "model",
        description: "Model snapshot payload passed to submit/reset pipeline.",
        type: "Record<string, unknown> | undefined",
        defaultValue: "undefined"
      },
      {
        name: "labelWidth",
        description: "Default width for .m-form-item labels.",
        type: "string",
        defaultValue: `"6.5rem"`
      },
      {
        name: "inline / labelPosition",
        description: "Layout mode for form items.",
        type: "boolean / \"left\" | \"top\"",
        defaultValue: "false / \"left\""
      }
    ]
  },
  choice: {
    title: "Checkbox + Radio",
    summary:
      "Checkbox for binary acknowledgement and radio for single-choice group selection.",
    code: `<MechaCheckbox v-model="missionAck" label="Mission Acknowledge" />
<MechaRadio v-model="fireMode" value="single" label="Single" />`,
    api: [
      {
        name: "modelValue",
        description: "Bound boolean or selected value.",
        type: "boolean | string | number | null",
        defaultValue: "false / null"
      },
      {
        name: "pipeline",
        description: "Optional interaction guard pipeline.",
        type: "MechaInteractionPipeline<{ current; next }>",
        defaultValue: "undefined"
      }
    ]
  },
  slider: {
    title: "Slider",
    summary:
      "Range input with pointer + keyboard interactions, step snapping, and progress pairing.",
    code: `<MechaSlider v-model="turretPower" :min="0" :max="120" :step="2" />
<MechaProgress :percentage="progressValue" />`,
    api: [
      {
        name: "modelValue",
        description: "Current numeric value.",
        type: "number",
        defaultValue: "0"
      },
      {
        name: "min / max / step",
        description: "Range and stepping rules.",
        type: "number",
        defaultValue: "0 / 100 / 1"
      },
      {
        name: "showValue",
        description: "Display value text in slider header.",
        type: "boolean",
        defaultValue: "true"
      }
    ]
  },
  scrollbar: {
    title: "Scrollbar",
    summary:
      "Container with custom mecha scrollbar track, draggable thumb, and scroll event hooks.",
    code: `<MechaScrollbar height="14rem">
  <ul class="epx-scroll-list">
    <li v-for="line in scrollLines" :key="line">{{ line }}</li>
  </ul>
</MechaScrollbar>`,
    api: [
      {
        name: "height / maxHeight",
        description: "Viewport sizing for scroll container.",
        type: "string",
        defaultValue: `"14rem" / ""`
      },
      {
        name: "always",
        description: "Always show scrollbar track/thumb.",
        type: "boolean",
        defaultValue: "false"
      },
      {
        name: "native",
        description: "Use native browser scrollbar instead of custom rail.",
        type: "boolean",
        defaultValue: "false"
      }
    ]
  },
  tag: {
    title: "Tag",
    summary:
      "Semantic labels for status and metadata. Supports type style and closable behavior.",
    code: `<MechaTag closable type="info" @close="removeTag(tag)">
  Escort
</MechaTag>`,
    api: [
      {
        name: "type",
        description: "Semantic appearance.",
        type: `"default" | "success" | "warning" | "danger" | "info"`,
        defaultValue: `"default"`
      },
      {
        name: "closable",
        description: "Whether close button is shown.",
        type: "boolean",
        defaultValue: "false"
      }
    ]
  },
  progress: {
    title: "Progress",
    summary:
      "Visual indicator for task status with optional stripe animation and status color.",
    code: `<MechaProgress :percentage="68" status="warning" />
<MechaProgress :percentage="100" status="success" />`,
    api: [
      {
        name: "percentage",
        description: "Progress value between 0 and 100.",
        type: "number",
        defaultValue: "0"
      },
      {
        name: "status",
        description: "Status style color.",
        type: `"default" | "success" | "warning" | "danger"`,
        defaultValue: `"default"`
      },
      {
        name: "striped / animated",
        description: "Stripe and motion flags.",
        type: "boolean",
        defaultValue: "true / true"
      }
    ]
  },
  result: {
    title: "Result",
    summary:
      "Outcome panel for success/warning/error/info states with icon, description, and action extension slots.",
    code: `<MechaResult status="success" title="Mission Synced" subtitle="All relays are stable.">
  <template #extra>
    <MechaButton size="sm">Inspect</MechaButton>
  </template>
</MechaResult>`,
    api: [
      {
        name: "status",
        description: "Semantic outcome style variant.",
        type: `"info" | "success" | "warning" | "error"`,
        defaultValue: `"info"`
      },
      {
        name: "title / subtitle",
        description: "Primary and secondary result copy text.",
        type: "string / string",
        defaultValue: `"Operation Result" / "System returned status payload."`
      },
      {
        name: "bordered / compact",
        description: "Card frame and spacing density controls.",
        type: "boolean / boolean",
        defaultValue: "true / false"
      }
    ]
  },
  skeleton: {
    title: "Skeleton",
    summary:
      "Loading placeholder with configurable title/rows/avatar and a slot fallback once content is ready.",
    code: `<MechaSkeleton :loading="skeletonLoading" :rows="4" avatar>
  <MechaCard title="Ready Content">...</MechaCard>
</MechaSkeleton>`,
    api: [
      {
        name: "loading / rows / animated",
        description: "Enable skeleton state, line count, and shimmer motion.",
        type: "boolean / number / boolean",
        defaultValue: "true / 3 / true"
      },
      {
        name: "title / avatar / round",
        description: "Placeholder block shape toggles.",
        type: "boolean / boolean / boolean",
        defaultValue: "true / false / false"
      }
    ]
  },
  table: {
    title: "Table",
    summary:
      "Data table with optional sortable columns, striped rows, scoped slots, and row-click/sort events.",
    code: `<MechaTable
  :columns="tableColumns"
  :rows="tableRows"
  v-model:sort-by="tableSortBy"
  v-model:sort-order="tableSortOrder"
/>`,
    api: [
      {
        name: "columns / rows",
        description: "Column schema and row source data.",
        type: "MechaTableColumn[] / Record<string, unknown>[]",
        defaultValue: "[] / []"
      },
      {
        name: "sortBy / sortOrder",
        description: "Controlled sort state for sortable columns.",
        type: "string | null / \"asc\" | \"desc\" | null",
        defaultValue: "null / null"
      },
      {
        name: "rowKey / stripe / bordered / hoverable",
        description: "Row identity and display style switches.",
        type: "string / boolean / boolean / boolean",
        defaultValue: "\"id\" / true / true / true"
      }
    ]
  },
  timeline: {
    title: "Timeline",
    summary:
      "Chronological rail for operation events with semantic node types and optional pending tail item.",
    code: `<MechaTimeline :items="timelineItems" pending="Awaiting uplink..." />`,
    api: [
      {
        name: "items / reverse",
        description: "Timeline entry data and reverse render mode.",
        type: "MechaTimelineItem[] / boolean",
        defaultValue: "[] / false"
      },
      {
        name: "pending",
        description: "Show trailing pending node text when truthy.",
        type: "boolean | string",
        defaultValue: "false"
      }
    ]
  },
  tree: {
    title: "Tree",
    summary:
      "Hierarchical node viewer with expand/collapse, selection, optional accordion behavior, and interaction hooks.",
    code: `<MechaTree
  v-model="treeSelected"
  :data="treeNodes"
  :expanded-keys="treeExpanded"
  @update:expandedKeys="treeExpanded = $event"
/>`,
    api: [
      {
        name: "modelValue / data",
        description: "Current selected node key and tree node structure.",
        type: "MechaTreeKey | null / MechaTreeNode[]",
        defaultValue: "null / []"
      },
      {
        name: "expandedKeys / defaultExpandedKeys",
        description: "Controlled/initial expanded node key collection.",
        type: "MechaTreeKey[] / MechaTreeKey[]",
        defaultValue: "[] / []"
      },
      {
        name: "selectable / expandOnClickNode / accordion",
        description: "Selection and expansion behavior switches.",
        type: "boolean / boolean / boolean",
        defaultValue: "true / false / false"
      }
    ]
  },
  "tree-select": {
    title: "Tree Select",
    summary:
      "Dropdown selector based on tree nodes with optional filtering, clear action, and expanded state sync.",
    code: `<MechaTreeSelect
  v-model="treeSelectValue"
  :data="treeNodes"
  filterable
  clearable
/>`,
    api: [
      {
        name: "modelValue / data / placeholder",
        description: "Selected node key, source tree, and trigger placeholder text.",
        type: "MechaTreeKey | null / MechaTreeNode[] / string",
        defaultValue: "null / [] / \"Select node\""
      },
      {
        name: "clearable / filterable / disabled",
        description: "Clear icon, search filter, and disabled state toggles.",
        type: "boolean / boolean / boolean",
        defaultValue: "false / false / false"
      },
      {
        name: "expandedKeys / defaultExpandedKeys / pipeline",
        description: "Expanded state control and select/clear interaction hooks.",
        type: "MechaTreeKey[] / MechaTreeKey[] / MechaInteractionPipeline<{ current; next; source }>",
        defaultValue: "[] / [] / undefined"
      }
    ]
  },
  statistic: {
    title: "Statistic",
    summary:
      "Numeric metric display with optional count-up animation, trend indicator, and unit prefix/suffix slots.",
    code: `<MechaStatistic
  title="Output"
  :value="statThroughput"
  suffix="kW"
  :trend="2.64"
/>`,
    api: [
      {
        name: "title / value / precision",
        description: "Label text, value payload, and decimal precision.",
        type: "string / number | string / number",
        defaultValue: "\"\" / 0 / 0"
      },
      {
        name: "prefix / suffix / groupSeparator",
        description: "Formatted value adornments and thousand separator.",
        type: "string / string / string",
        defaultValue: "\"\" / \"\" / \",\""
      },
      {
        name: "trend / status / loading / animated",
        description: "Trend percentage and visual/animation state switches.",
        type: "number | null / status / boolean / boolean",
        defaultValue: "null / \"default\" / false / true"
      }
    ]
  },
  segmented: {
    title: "Segmented",
    summary:
      "Compact mutually-exclusive segment selector with keyboard navigation and interaction pipeline support.",
    code: `<MechaSegmented v-model="segmentedMode" :options="segmentedOptions" />`,
    api: [
      {
        name: "modelValue / options",
        description: "Current selected segment and option list.",
        type: "string | number | boolean | null / Array<MechaSegmentedOption | primitive>",
        defaultValue: "null / []"
      },
      {
        name: "size / block / disabled",
        description: "Dimension scale, full-width mode, and disabled lock.",
        type: "\"sm\" | \"md\" | \"lg\" / boolean / boolean",
        defaultValue: "\"md\" / false / false"
      },
      {
        name: "pipeline",
        description: "before/after/onError hooks for selection transitions.",
        type: "MechaInteractionPipeline<{ current; next; option; source }>",
        defaultValue: "undefined"
      }
    ]
  }
};

const toSlug = (tag: string) =>
  tag.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const prettifyTag = (tag: string) =>
  tag.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

const parityBySlug = MECHA_ELEMENT_PLUS_PARITY.reduce<
  Record<string, (typeof MECHA_ELEMENT_PLUS_PARITY)[number]>
>((acc, item) => {
  acc[toSlug(item.tag)] = item;
  return acc;
}, {});

const createCatalogFallbackMeta = (slug: string): PageMeta => {
  const parity = parityBySlug[slug];
  if (!parity) {
    return pageMeta.button;
  }

  return {
    title: prettifyTag(parity.tag),
    summary: parity.description,
    code: `<${parity.name} title="${parity.tag}" subtitle="${parity.description}" />`,
    api: [
      {
        name: "title / subtitle",
        description: "Catalog shell heading and supporting text.",
        type: "string",
        defaultValue: `""`
      },
      {
        name: "modelValue",
        description: "Value payload echoed by simulate action.",
        type: "unknown",
        defaultValue: "undefined"
      },
      {
        name: "ui",
        description: "Part-level class and attribute overrides.",
        type: "MechaComponentUi",
        defaultValue: "undefined"
      }
    ]
  };
};

const hasKnownPage = (slug: string) =>
  slug in pageMeta || slug in parityBySlug;

const currentCatalogComponent = computed(() => {
  const parity = parityBySlug[currentSlug.value];
  if (!parity) {
    return null;
  }

  const name = parity.name as keyof typeof MechaCatalogRegistry;
  return (MechaCatalogRegistry as Record<string, unknown>)[name] ?? null;
});

const navGroups: NavGroup[] = [
  {
    title: "Basic",
    links: [
      { label: "Button", slug: "button" },
      { label: "Icon", slug: "icon" },
      { label: "Layout", slug: "layout" },
      { label: "Link", slug: "link" },
      { label: "Scrollbar", slug: "scrollbar" }
    ]
  },
  {
    title: "Form",
    links: [
      { label: "Autocomplete", slug: "autocomplete" },
      { label: "Cascader", slug: "cascader" },
      { label: "Checkbox", slug: "checkbox" },
      { label: "Color Picker", slug: "color-picker" },
      { label: "Date Picker", slug: "date-picker" },
      { label: "DateTimePicker", slug: "date-time-picker" },
      { label: "Form", slug: "form" },
      { label: "Input", slug: "input" },
      { label: "Input Number", slug: "input-number" },
      { label: "Radio", slug: "radio" },
      { label: "Rate", slug: "rate" },
      { label: "Select", slug: "select" },
      { label: "Slider", slug: "slider" },
      { label: "Switch", slug: "switch" },
      { label: "Time Picker", slug: "time-picker" },
      { label: "Time Select", slug: "time-select" },
      { label: "Transfer", slug: "transfer" },
      { label: "Upload", slug: "upload" }
    ]
  },
  {
    title: "Data",
    links: [
      { label: "Avatar", slug: "avatar" },
      { label: "Badge", slug: "badge" },
      { label: "Calendar", slug: "calendar" },
      { label: "Card", slug: "card" },
      { label: "Carousel", slug: "carousel" },
      { label: "Collapse", slug: "collapse" },
      { label: "Descriptions", slug: "descriptions" },
      { label: "Empty", slug: "empty" },
      { label: "Image", slug: "image" },
      { label: "Infinite Scroll", slug: "infinite-scroll" },
      { label: "Pagination", slug: "pagination" },
      { label: "Progress", slug: "progress" },
      { label: "Result", slug: "result" },
      { label: "Skeleton", slug: "skeleton" },
      { label: "Table", slug: "table" },
      { label: "Tag", slug: "tag" },
      { label: "Timeline", slug: "timeline" },
      { label: "Tree", slug: "tree" },
      { label: "Tree Select", slug: "tree-select" },
      { label: "Statistic", slug: "statistic" },
      { label: "Segmented", slug: "segmented" }
    ]
  },
  {
    title: "Navigation & Feedback",
    links: [
      { label: "Affix", slug: "affix" },
      { label: "Backtop", slug: "backtop" },
      { label: "Breadcrumb", slug: "breadcrumb" },
      { label: "Dropdown", slug: "dropdown" },
      { label: "Menu", slug: "menu" },
      { label: "Page Header", slug: "page-header" },
      { label: "Steps", slug: "steps" },
      { label: "Tabs", slug: "tabs" },
      { label: "Alert", slug: "alert" },
      { label: "Dialog", slug: "dialog" },
      { label: "Drawer", slug: "drawer" },
      { label: "Loading", slug: "loading" },
      { label: "Message", slug: "message" },
      { label: "MessageBox", slug: "message-box" },
      { label: "Notification", slug: "notification" },
      { label: "Popconfirm", slug: "popconfirm" },
      { label: "Popover", slug: "popover" },
      { label: "Tooltip", slug: "tooltip" }
    ]
  }
];

const tocLinks = [
  { id: "basic-usage", label: "Basic Usage" },
  { id: "source", label: "Source" },
  { id: "api", label: "API" },
  { id: "ecosystem", label: "Ecosystem" }
];

const menuQuery = ref("");
const activeAnchor = ref("basic-usage");

const parseHash = (hash: string): PageSlug => {
  const match = hash.match(/^#\/component\/([a-z0-9-]+)/);
  if (!match) {
    return "button";
  }

  const slug = match[1];
  return hasKnownPage(slug) ? slug : "button";
};

const currentSlug = ref<PageSlug>(parseHash(window.location.hash));

const filteredNav = computed(() => {
  const query = menuQuery.value.trim().toLowerCase();
  if (!query) {
    return navGroups;
  }

  return navGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) =>
        link.label.toLowerCase().includes(query)
      )
    }))
    .filter((group) => group.links.length > 0);
});

const currentPage = computed(
  () => pageMeta[currentSlug.value] ?? createCatalogFallbackMeta(currentSlug.value)
);

const setPage = (slug: PageSlug) => {
  activeAnchor.value = "basic-usage";
  window.location.hash = `#/component/${slug}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const jumpTo = (id: string) => {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  activeAnchor.value = id;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
};

const onHashChange = () => {
  currentSlug.value = parseHash(window.location.hash);
  activeAnchor.value = "basic-usage";
};

onMounted(() => {
  if (!window.location.hash) {
    window.location.hash = "#/component/button";
  } else {
    currentSlug.value = parseHash(window.location.hash);
  }

  window.addEventListener("hashchange", onHashChange);
});

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", onHashChange);
});

const pilotId = ref("ATLAS-07");
const missionChannel = ref("RAVEN");
const reactorLinked = ref(true);
const safetyLock = ref(true);
const missionAck = ref(false);
const fireMode = ref<"single" | "burst" | "salvo">("single");
const missionRating = ref(3.5);
const commandQuery = ref("launch drone");
const messageCount = ref(7);
const cardAlertCount = ref(2);
const calendarDate = ref<string | null>("2026-02-26");
const carouselIndex = ref(0);
const collapseActive = ref<(string | number)[]>(["mission"]);
const paginationPage = ref(3);
const resultState = ref<"info" | "success" | "warning" | "error">("success");
const skeletonLoading = ref(true);
const tableSortBy = ref<string | null>("priority");
const tableSortOrder = ref<"asc" | "desc" | null>("desc");
const treeSelected = ref<string | number | null>("fleet-alpha-recon");
const treeExpanded = ref<(string | number)[]>(["fleet-alpha", "fleet-alpha-recon"]);
const treeSelectValue = ref<string | number | null>("fleet-alpha-recon");
const statThroughput = ref(12480);
const segmentedMode = ref<string | number | boolean | null>("auto");
const stepActive = ref(1);
const tabActive = ref<string | number | null>("overview");
const alertVisible = ref(true);
const dialogVisible = ref(false);
const drawerVisible = ref(false);
const loadingVisible = ref(false);
const messageVisible = ref(false);
const messageBoxVisible = ref(false);
const notificationVisible = ref(false);
const popconfirmVisible = ref(false);
const popoverVisible = ref(false);
const tooltipVisible = ref(false);
const menuActiveValue = ref<string | number | null>("ops-overview");
const menuOpened = ref<(string | number)[]>(["ops"]);
const dropdownCommand = ref<string | number | null>(null);
const selectedTime = ref<string | null>("09:35:20");
const selectedPresetTime = ref<string | null>("10:30");
const transferSelection = ref<(string | number)[]>(["pilot-2", "pilot-4"]);
const targetSector = ref<string | number | null>("sector-7");
const missionRoute = ref<(string | number)[]>(["north", "north-2", "north-2-b"]);
const panelColor = ref("#20D6FF");
const panelAlpha = ref(0.82);
const panelDate = ref("2026-02-21");
const selectedDate = ref<string | null>("2026-02-24");
const selectedDateTime = ref<string | null>("2026-02-24 18:30:00");
const turretPower = ref(52);
const missionBudget = ref<number | null>(240);
const reserveFuel = ref<number | null>(780);
const formPilot = ref("ATLAS-07");
const formSector = ref<string | number | null>("sector-7");
const formWindow = ref<string | null>("2026-02-24 09:40:00");
const formPriority = ref<number | null>(2);
const launchLoading = ref(false);
const tags = ref(["Escort", "Stealth", "No-Civilians"]);
const avatarPortrait = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#20D6FF"/><stop offset="100%" stop-color="#16344D"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><circle cx="60" cy="44" r="22" fill="#E7F9FF"/><rect x="30" y="74" width="60" height="28" rx="14" fill="#D4F0FF"/></svg>`
)}`;
const reconImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#07111D"/><stop offset="100%" stop-color="#16344D"/></linearGradient></defs><rect width="800" height="450" fill="url(#bg)"/><path d="M0 360 L170 250 L330 310 L520 200 L690 260 L800 220 L800 450 L0 450 Z" fill="#0E2234"/><path d="M0 390 L150 290 L300 350 L470 240 L650 305 L800 265 L800 450 L0 450 Z" fill="#1C3A55"/><circle cx="645" cy="84" r="42" fill="#20D6FF" fill-opacity="0.23"/><circle cx="645" cy="84" r="16" fill="#20D6FF" fill-opacity="0.58"/><path d="M90 86h190M90 112h150M90 138h220" stroke="#8EE7FF" stroke-width="6" stroke-linecap="round" opacity="0.45"/></svg>`
)}`;
const carouselItems = [
  {
    id: "slide-1",
    title: "Recon Sweep",
    description: "Northern ridge scanned, zero hostile signatures.",
    image: reconImage
  },
  {
    id: "slide-2",
    title: "Hangar Feed",
    description: "Repair bay online, drone queue at 42 percent.",
    image: avatarPortrait
  },
  {
    id: "slide-3",
    title: "Log Relay",
    description: "Telemetry uplink synced across support fleet."
  }
];
const collapseItems = [
  {
    name: "mission",
    label: "Mission Brief",
    hint: "Core",
    content: "Route locked. Escort squad assigned to corridor B."
  },
  {
    name: "payload",
    label: "Payload Rules",
    hint: "Ops",
    content: "Max load 3.2t. Hazard package requires dual authorization."
  },
  {
    name: "fallback",
    label: "Fallback Plan",
    hint: "Backup",
    content: "If shield integrity drops below 35%, reroute to dock C3."
  }
];
const descriptionItems = [
  { label: "Pilot", value: "ATLAS-07" },
  { label: "Sector", value: "Sector-7" },
  { label: "Window", value: "2026-02-24 09:40:00", span: 2 },
  { label: "Priority", value: "P2" },
  { label: "Fuel Reserve", value: "780 L" }
];
const tableColumns = [
  { key: "unit", label: "Unit", sortable: true },
  { key: "priority", label: "Priority", align: "right" as const, sortable: true },
  { key: "status", label: "Status" },
  { key: "window", label: "Window", sortable: true }
];
const tableRows = [
  { id: "row-1", unit: "RAVEN-12", priority: 3, status: "Ready", window: "09:40" },
  { id: "row-2", unit: "ATLAS-07", priority: 5, status: "Holding", window: "10:05" },
  { id: "row-3", unit: "NOVA-09", priority: 2, status: "Ready", window: "09:10" },
  { id: "row-4", unit: "ORBIT-04", priority: 1, status: "Maintenance", window: "11:20" }
];
const timelineItems = [
  {
    key: "tl-1",
    label: "Launch Window Armed",
    content: "Strike wing aligned to corridor B.",
    time: "09:32",
    type: "success" as const
  },
  {
    key: "tl-2",
    label: "Telemetry Spike",
    content: "Short burst detected in northern relay.",
    time: "09:41",
    type: "warning" as const
  },
  {
    key: "tl-3",
    label: "Support Link Stable",
    content: "Backup uplink switched to west repeater.",
    time: "09:48",
    type: "info" as const
  }
];
const treeNodes = [
  {
    key: "fleet-alpha",
    label: "Fleet Alpha",
    hint: "Primary",
    children: [
      {
        key: "fleet-alpha-recon",
        label: "Recon Wing",
        hint: "4 units",
        children: [
          { key: "atlas-07", label: "ATLAS-07" },
          { key: "nova-09", label: "NOVA-09" }
        ]
      },
      {
        key: "fleet-alpha-strike",
        label: "Strike Wing",
        hint: "2 units",
        children: [{ key: "raven-12", label: "RAVEN-12" }]
      }
    ]
  },
  {
    key: "fleet-beta",
    label: "Fleet Beta",
    hint: "Reserve",
    children: [
      { key: "orbit-04", label: "ORBIT-04" },
      { key: "ember-15", label: "EMBER-15", disabled: true }
    ]
  }
];
const segmentedOptions = [
  { label: "Auto", value: "auto", hint: "AI" },
  { label: "Manual", value: "manual", hint: "Pilot" },
  { label: "Safe", value: "safe", hint: "Limit" }
];
const stepItems = [
  {
    title: "Prepare",
    description: "Checklist verified."
  },
  {
    title: "Deploy",
    description: "Wing in launch queue."
  },
  {
    title: "Engage",
    description: "Target lock and escort active."
  },
  {
    title: "Complete",
    description: "Mission report generated."
  }
];
const tabItems = [
  {
    label: "Overview",
    value: "overview",
    content: "Fleet overview and mission stats."
  },
  {
    label: "Telemetry",
    value: "telemetry",
    content: "Live sensor relay stream."
  },
  {
    label: "History",
    value: "history",
    content: "Past operations and archived logs."
  }
];
const breadcrumbItems = [
  { label: "Command", to: "#/component/button" },
  { label: "Navigation", to: "#/component/menu" },
  { label: "Menu", to: "#/component/menu" }
];
const dropdownItems = [
  { label: "Deploy", value: "deploy", hint: "Launch squad" },
  { label: "Sync", value: "sync", hint: "Refresh channels" },
  { label: "Archive", value: "archive", hint: "Store snapshot" },
  { label: "Abort", value: "abort", hint: "Emergency", danger: true }
];
const menuItems = [
  { key: "ops-overview", label: "Overview", hint: "Live board" },
  {
    key: "ops",
    label: "Operations",
    children: [
      { key: "ops-recon", label: "Recon" },
      { key: "ops-escort", label: "Escort" },
      { key: "ops-defense", label: "Defense" }
    ]
  },
  {
    key: "logs",
    label: "Logs",
    children: [
      { key: "logs-live", label: "Live Feed" },
      { key: "logs-history", label: "History" }
    ]
  }
];
const affixDemoLines = Array.from(
  { length: 18 },
  (_, index) => `Affix demo line ${String(index + 1).padStart(2, "0")} :: telemetry record`
);
const backtopDemoLines = Array.from(
  { length: 36 },
  (_, index) => `Backtop demo line ${String(index + 1).padStart(2, "0")} :: scroll marker`
);
const infiniteLines = ref(
  Array.from(
    { length: 16 },
    (_, index) => `Mission log ${String(index + 1).padStart(2, "0")} :: relay stable`
  )
);
const infiniteLoading = ref(false);
const infiniteFinished = ref(false);
type DemoUploadFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  status?: "ready" | "uploaded" | "error";
};
const uploadQueue = ref<DemoUploadFile[]>([
  {
    id: "upl-1",
    name: "briefing.pdf",
    size: 186240,
    type: "application/pdf",
    status: "ready"
  }
]);
const scrollLines = ref(
  Array.from({ length: 22 }, (_, index) => `Telemetry line ${String(index + 1).padStart(2, "0")} :: signal stable`)
);
const eventLog = ref<string[]>([
  "SYSTEM: Documentation page loaded.",
  "UI: Component examples initialized."
]);

const commandOptions = [
  { label: "launch drone", hint: "Dispatch scout wing" },
  { label: "lock target", hint: "Acquire hostile signature" },
  { label: "sync telemetry", hint: "Refresh sensor bus" },
  { label: "activate shield", hint: "Raise defense matrix" },
  { label: "reroute support", hint: "Switch fleet channel" },
  { label: "abort mission", hint: "Emergency fallback", disabled: true }
];

const transferOptions = [
  { key: "pilot-1", label: "ATLAS-07", hint: "Recon Wing" },
  { key: "pilot-2", label: "RAVEN-12", hint: "Strike Wing" },
  { key: "pilot-3", label: "ORBIT-04", hint: "Supply Wing" },
  { key: "pilot-4", label: "NOVA-09", hint: "Support Wing" },
  { key: "pilot-5", label: "EMBER-15", hint: "Unavailable", disabled: true }
];

const sectorOptions = [
  { label: "Sector 3", value: "sector-3", hint: "Eastern ridge" },
  { label: "Sector 7", value: "sector-7", hint: "Primary corridor" },
  { label: "Sector 12", value: "sector-12", hint: "Carrier deck" },
  { label: "Sector 19", value: "sector-19", hint: "Offline", disabled: true }
];

const routeOptions = [
  {
    label: "North Fleet",
    value: "north",
    children: [
      {
        label: "Wing 2",
        value: "north-2",
        children: [
          { label: "Node B", value: "north-2-b", hint: "Recon route" },
          { label: "Node C", value: "north-2-c", hint: "Strike route" }
        ]
      },
      {
        label: "Wing 5",
        value: "north-5",
        children: [
          { label: "Node A", value: "north-5-a", hint: "Escort route" },
          { label: "Node D", value: "north-5-d", hint: "Defense route" }
        ]
      }
    ]
  },
  {
    label: "South Fleet",
    value: "south",
    children: [
      {
        label: "Wing 3",
        value: "south-3",
        children: [
          { label: "Node E", value: "south-3-e", hint: "Support route" },
          { label: "Node F", value: "south-3-f", hint: "Supply route", disabled: true }
        ]
      }
    ]
  }
];

const panelPresets = [
  "#20D6FF",
  "#FF7A18",
  "#48EBA7",
  "#FF435A",
  "#8AA8FF",
  "#FFFFFF"
];

const dateShortcuts = [
  { label: "Today", daysOffset: 0 },
  { label: "Tomorrow", daysOffset: 1 },
  { label: "Mission Day", value: "2026-03-03" }
];

const formModel = computed(() => ({
  pilot: formPilot.value,
  sector: formSector.value,
  launchWindow: formWindow.value,
  priority: formPriority.value,
  reserveFuel: reserveFuel.value
}));

const addLog = (entry: string) => {
  const timestamp = new Date().toLocaleTimeString("en-GB", { hour12: false });
  eventLog.value.unshift(`${timestamp} ${entry}`);
  eventLog.value = eventLog.value.slice(0, 8);
};

const launchPipeline: MechaInteractionPipeline<MouseEvent> = {
  before: () => {
    if (safetyLock.value) {
      addLog("PIPELINE: launch blocked by safety lock.");
      return false;
    }

    if (!reactorLinked.value) {
      addLog("PIPELINE: reactor link is offline.");
      return false;
    }

    return true;
  },
  after: () => {
    addLog("PIPELINE: launch action approved.");
  },
  onError: (_ctx, error) => {
    addLog(`PIPELINE ERROR: ${error instanceof Error ? error.message : "unknown"}`);
  }
};

const formPipeline: MechaInteractionPipeline<{
  action: "submit" | "reset";
  model: Record<string, unknown> | undefined;
}> = {
  before: (context) => {
    if (context.action !== "submit") {
      return true;
    }

    const pilot = String(context.payload?.model?.pilot ?? "").trim();
    const launchWindow = String(context.payload?.model?.launchWindow ?? "").trim();

    if (!pilot) {
      addLog("FORM PIPELINE: pilot id is required.");
      return false;
    }

    if (!launchWindow) {
      addLog("FORM PIPELINE: launch window is required.");
      return false;
    }

    return true;
  },
  after: (context) => {
    addLog(`FORM PIPELINE: ${context.action} approved.`);
  }
};

const triggerLaunch = async () => {
  launchLoading.value = true;
  addLog("ACTION: launch request sent.");
  await new Promise((resolve) => window.setTimeout(resolve, 620));
  launchLoading.value = false;
  addLog("ACTION: launch completed.");
};

const removeTag = (tag: string) => {
  tags.value = tags.value.filter((item) => item !== tag);
  addLog(`TAG: removed ${tag}.`);
};

const submitMissionForm = () => {
  addLog(
    `FORM SUBMIT: ${formPilot.value || "UNKNOWN"} -> ${
      formSector.value ?? "none"
    } @ ${formWindow.value ?? "none"}`
  );
};

const resetMissionForm = () => {
  formPilot.value = "";
  formSector.value = null;
  formWindow.value = null;
  formPriority.value = 1;
  reserveFuel.value = 500;
  addLog("FORM RESET: mission form cleared.");
};

const appendScrollLine = () => {
  const nextIndex = scrollLines.value.length + 1;
  scrollLines.value.push(
    `Telemetry line ${String(nextIndex).padStart(2, "0")} :: drift=${(
      Math.random() * 0.9
    ).toFixed(3)}`
  );
  addLog("SCROLLBAR: appended telemetry line.");
};

const loadMoreInfinite = async () => {
  if (infiniteLoading.value || infiniteFinished.value) {
    return;
  }

  infiniteLoading.value = true;
  addLog("INFINITE: loading more logs.");

  await new Promise((resolve) => window.setTimeout(resolve, 420));

  const start = infiniteLines.value.length;
  const batch = 8;

  for (let i = 0; i < batch; i += 1) {
    const index = start + i + 1;
    infiniteLines.value.push(
      `Mission log ${String(index).padStart(2, "0")} :: drift=${(
        Math.random() * 0.9
      ).toFixed(3)}`
    );
  }

  if (infiniteLines.value.length >= 56) {
    infiniteFinished.value = true;
    addLog("INFINITE: stream finished.");
  } else {
    addLog(`INFINITE: loaded ${infiniteLines.value.length} lines.`);
  }

  infiniteLoading.value = false;
};

const increasePower = () => {
  turretPower.value = Math.min(120, turretPower.value + 8);
  addLog(`SLIDER: turret power ${turretPower.value}.`);
};

const decreasePower = () => {
  turretPower.value = Math.max(0, turretPower.value - 8);
  addLog(`SLIDER: turret power ${turretPower.value}.`);
};

const progressValue = computed(() =>
  Math.round((Math.min(120, Math.max(0, turretPower.value)) / 120) * 100)
);

const progressStatus = computed(() => {
  if (progressValue.value >= 85) {
    return "success";
  }

  if (progressValue.value >= 55) {
    return "warning";
  }

  return "default";
});

const categoryCounts = computed(() =>
  MECHA_ELEMENT_PLUS_PARITY.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {})
);
</script>

<template>
  <div class="mecha-root mecha-grid epx-shell">
    <header class="epx-topbar">
      <div class="epx-brand">
        <span class="epx-logo">M</span>
        <div>
          <strong>Mecha UI</strong>
          <span>Vue 3 Component Docs</span>
        </div>
      </div>
      <nav class="epx-topnav">
        <a href="#/component/button">Component</a>
        <a href="#/component/input">Guide</a>
        <a href="#ecosystem">Resources</a>
      </nav>
      <div class="epx-meta">
        <span>v0.1.0</span>
        <a href="https://element-plus.org/" target="_blank" rel="noopener noreferrer">
          Element Plus
        </a>
      </div>
    </header>

    <div class="epx-layout">
      <aside class="epx-sidebar">
        <label class="epx-search-label" for="epx-search">Search component</label>
        <input
          id="epx-search"
          v-model="menuQuery"
          type="search"
          class="epx-search"
          placeholder="button / upload / table / tooltip"
        />

        <div class="epx-nav">
          <section v-for="group in filteredNav" :key="group.title" class="epx-nav-group">
            <h2>{{ group.title }}</h2>
            <button
              v-for="link in group.links"
              :key="link.label"
              type="button"
              class="epx-nav-link"
              :class="{
                'is-active': link.slug === currentSlug,
                'is-disabled': link.disabled
              }"
              :disabled="link.disabled || !link.slug"
              @click="link.slug && setPage(link.slug)"
            >
              {{ link.label }}
            </button>
          </section>
        </div>
      </aside>

      <main class="epx-main">
        <div class="epx-breadcrumb">
          <span>Component</span>
          <span>/</span>
          <strong>{{ currentPage.title }}</strong>
        </div>

        <h1 class="epx-title">{{ currentPage.title }}</h1>
        <p class="epx-summary">{{ currentPage.summary }}</p>

        <section id="basic-usage" class="epx-block">
          <header class="epx-block-head">
            <h3>Basic Usage</h3>
          </header>
          <div class="epx-demo">
            <template v-if="currentSlug === 'button'">
              <MechaButton :pipeline="launchPipeline" :loading="launchLoading" @click="triggerLaunch">
                Launch Drone
              </MechaButton>
              <MechaButton variant="ghost" @click="addLog('BUTTON: ghost action')">
                Sync Feed
              </MechaButton>
              <MechaButton variant="danger" size="sm" @click="safetyLock = !safetyLock">
                {{ safetyLock ? "Disable Safety" : "Enable Safety" }}
              </MechaButton>
            </template>

            <template v-else-if="currentSlug === 'icon'">
              <div class="epx-row">
                <MechaIcon name="radar" label="Radar" />
                <MechaIcon name="command" label="Command module" framed />
                <MechaIcon name="target" label="Target lock" tone="hot" />
                <MechaIcon name="shield" label="Shield online" tone="success" />
                <MechaIcon name="sync" label="Sync cycle" tone="cool" spin />
              </div>
              <div class="epx-row">
                <MechaIcon name="bolt" label="Power surge" tone="hot" pulse />
                <MechaIcon name="check" label="Confirmed" tone="success" />
                <MechaIcon name="close" label="Abort" tone="danger" />
                <MechaIcon tone="muted" decorative>
                  <path
                    d="M4 5h16M4 12h16M4 19h16"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="1.8"
                  />
                </MechaIcon>
              </div>
            </template>

            <template v-else-if="currentSlug === 'layout'">
              <MechaLayout gap="0.72rem" padded surface bordered>
                <template #header>Dock Distribution</template>
                <MechaTag type="info">Dock A1</MechaTag>
                <MechaTag type="warning">Dock B3</MechaTag>
                <MechaTag type="success">Dock C2</MechaTag>
                <MechaTag type="danger">Dock D4</MechaTag>
              </MechaLayout>

              <MechaLayout
                grid
                :columns="3"
                min-column-width="9rem"
                gap="0.6rem"
                padded
                surface
                bordered
              >
                <template #header>Grid Cells</template>
                <div class="epx-layout-cell">Cell-01</div>
                <div class="epx-layout-cell">Cell-02</div>
                <div class="epx-layout-cell">Cell-03</div>
                <div class="epx-layout-cell">Cell-04</div>
                <div class="epx-layout-cell">Cell-05</div>
                <div class="epx-layout-cell">Cell-06</div>
              </MechaLayout>
            </template>

            <template v-else-if="currentSlug === 'link'">
              <MechaLayout direction="column" gap="0.56rem" padded surface bordered>
                <MechaLink
                  href="#/component/button"
                  @click="addLog('LINK: navigate to button docs')"
                >
                  Open Button Docs
                </MechaLink>
                <MechaLink
                  href="#/component/date-time-picker"
                  tone="hot"
                  underline="always"
                  @click="addLog('LINK: open datetime picker docs')"
                >
                  Open DateTimePicker
                </MechaLink>
                <MechaLink
                  href="https://element-plus.org/"
                  external
                  tone="cool"
                  @click="addLog('LINK: open external element-plus site')"
                >
                  Element Plus Site
                </MechaLink>
                <MechaLink disabled tone="muted">Locked Route</MechaLink>
              </MechaLayout>
            </template>

            <template v-else-if="currentSlug === 'avatar'">
              <div class="epx-row">
                <MechaAvatar
                  name="Atlas Seven"
                  status="online"
                  @click="addLog('AVATAR: selected Atlas Seven')"
                />
                <MechaAvatar
                  :src="avatarPortrait"
                  name="Raven Unit"
                  shape="rounded"
                  status="busy"
                />
                <MechaAvatar name="Nova-09" shape="square" status="warning">
                  N9
                </MechaAvatar>
                <MechaAvatar name="Offline Pilot" :size="52" status="offline" />
              </div>
            </template>

            <template v-else-if="currentSlug === 'badge'">
              <div class="epx-row">
                <MechaBadge :value="messageCount">
                  <MechaButton
                    size="sm"
                    variant="ghost"
                    @click="
                      messageCount += 1;
                      addLog(`BADGE: alerts ${messageCount}`)
                    "
                  >
                    Alerts +1
                  </MechaButton>
                </MechaBadge>

                <MechaBadge dot type="danger">
                  <MechaTag type="warning">Telemetry</MechaTag>
                </MechaBadge>

                <MechaBadge :value="132" :max="99" type="warning" />
                <MechaBadge :value="0" show-zero type="info" />
              </div>
            </template>

            <template v-else-if="currentSlug === 'calendar'">
              <MechaCalendar
                v-model="calendarDate"
                :shortcuts="dateShortcuts"
                @change="addLog(`CALENDAR: ${calendarDate || 'none'}`)"
              />
              <MechaTag type="info">
                {{ calendarDate || "No Date" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'card'">
              <MechaCard title="Recon Briefing" subtitle="Wing RAVEN-12" status="info">
                <template #actions>
                  <MechaBadge :value="cardAlertCount" type="danger" />
                </template>

                <p>
                  Route synced. Launch window set to {{ formWindow || "none" }}.
                </p>

                <template #footer>
                  <div class="epx-row">
                    <MechaButton size="sm" @click="addLog('CARD: launch sequence armed')">
                      Arm
                    </MechaButton>
                    <MechaButton
                      size="sm"
                      variant="ghost"
                      @click="addLog('CARD: briefing archived')"
                    >
                      Archive
                    </MechaButton>
                  </div>
                </template>
              </MechaCard>

              <MechaCard
                title="Interactive Snapshot"
                subtitle="Click to inspect"
                status="success"
                shadow="hover"
                interactive
                @click="addLog('CARD: interactive card click')"
              >
                <p>Hull integrity 97%, drone uplink stable, no anomalies.</p>
              </MechaCard>
            </template>

            <template v-else-if="currentSlug === 'carousel'">
              <MechaCarousel
                v-model="carouselIndex"
                :items="carouselItems"
                autoplay
                :interval="3200"
                @change="addLog(`CAROUSEL: slide ${carouselIndex + 1}`)"
              />
              <MechaTag type="info">
                {{ `slide=${carouselIndex + 1}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'collapse'">
              <MechaCollapse
                v-model="collapseActive"
                :items="collapseItems"
                accordion
                @change="
                  addLog(
                    `COLLAPSE: ${collapseActive.length ? collapseActive.join(' / ') : 'none'}`
                  )
                "
              />
              <MechaTag type="info">
                {{ collapseActive.length ? collapseActive.join(" / ") : "No Panel" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'descriptions'">
              <MechaDescriptions
                title="Mission Snapshot"
                :items="descriptionItems"
                :columns="3"
              />
              <MechaDescriptions
                size="sm"
                :columns="2"
                :items="[
                  { label: 'Shield', value: '87%' },
                  { label: 'Hull', value: '93%' },
                  { label: 'Signal', value: 'Stable', span: 2 }
                ]"
              />
            </template>

            <template v-else-if="currentSlug === 'empty'">
              <MechaEmpty
                title="No Active Recon Drones"
                description="Deploy a drone to begin telemetry stream."
              >
                <template #actions>
                  <MechaButton
                    size="sm"
                    @click="addLog('EMPTY: deploy request sent')"
                  >
                    Deploy
                  </MechaButton>
                  <MechaButton
                    size="sm"
                    variant="ghost"
                    @click="addLog('EMPTY: schedule check requested')"
                  >
                    Check Queue
                  </MechaButton>
                </template>
              </MechaEmpty>
            </template>

            <template v-else-if="currentSlug === 'image'">
              <MechaImage
                :src="reconImage"
                alt="Recon feed"
                preview
                width="min(100%, 24rem)"
                @click="addLog('IMAGE: preview opened')"
              >
                <template #caption>
                  Recon feed: north valley perimeter.
                </template>
              </MechaImage>
              <MechaImage
                src=""
                fallback-text="Signal lost"
                width="min(100%, 24rem)"
                height="8rem"
              />
            </template>

            <template v-else-if="currentSlug === 'infinite-scroll'">
              <MechaInfiniteScroll
                :loading="infiniteLoading"
                :finished="infiniteFinished"
                @load="loadMoreInfinite"
              >
                <ul class="epx-scroll-list">
                  <li v-for="line in infiniteLines" :key="line">{{ line }}</li>
                </ul>
              </MechaInfiniteScroll>
              <div class="epx-row">
                <MechaButton
                  size="sm"
                  variant="ghost"
                  :disabled="infiniteLoading || infiniteFinished"
                  @click="loadMoreInfinite"
                >
                  Manual Load
                </MechaButton>
                <MechaTag type="info">
                  {{ `lines=${infiniteLines.length}` }}
                </MechaTag>
              </div>
            </template>

            <template v-else-if="currentSlug === 'pagination'">
              <MechaPagination
                v-model="paginationPage"
                :total="146"
                :page-size="10"
                :pager-count="9"
                show-total
                show-jumper
                @change="addLog(`PAGINATION: page ${paginationPage}`)"
              />
              <MechaTag type="info">
                {{ `page=${paginationPage} / ${Math.ceil(146 / 10)}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'result'">
              <MechaResult
                :status="resultState"
                title="Mission Sync Complete"
                subtitle="All telemetry channels report stable uplink."
              >
                <template #extra>
                  <MechaButton size="sm" @click="addLog('RESULT: inspect payload')">
                    Inspect
                  </MechaButton>
                  <MechaButton
                    size="sm"
                    variant="ghost"
                    @click="addLog('RESULT: archive report')"
                  >
                    Archive
                  </MechaButton>
                </template>
              </MechaResult>
              <MechaSegmented
                v-model="resultState"
                :options="[
                  { label: 'Info', value: 'info' },
                  { label: 'Success', value: 'success' },
                  { label: 'Warning', value: 'warning' },
                  { label: 'Error', value: 'error' }
                ]"
                size="sm"
                @change="addLog(`RESULT: status ${resultState}`)"
              />
            </template>

            <template v-else-if="currentSlug === 'skeleton'">
              <MechaSkeleton :loading="skeletonLoading" :rows="4" avatar>
                <MechaCard title="Ready Content" subtitle="Loaded from cache" status="success">
                  <p>Telemetry snapshot was resolved and rendered.</p>
                </MechaCard>
              </MechaSkeleton>
              <MechaButton
                size="sm"
                variant="ghost"
                @click="
                  skeletonLoading = !skeletonLoading;
                  addLog(`SKELETON: ${skeletonLoading ? 'loading' : 'ready'}`)
                "
              >
                Toggle Loading
              </MechaButton>
            </template>

            <template v-else-if="currentSlug === 'table'">
              <MechaTable
                :columns="tableColumns"
                :rows="tableRows"
                v-model:sort-by="tableSortBy"
                v-model:sort-order="tableSortOrder"
                @sort-change="
                  addLog(
                    `TABLE: sort ${tableSortBy ?? 'none'} ${
                      tableSortOrder ?? 'none'
                    }`
                  )
                "
                @row-click="addLog(`TABLE: row ${$event.row.unit}`)"
              >
                <template #cell-status="{ value }">
                  <MechaTag :type="value === 'Ready' ? 'success' : value === 'Holding' ? 'warning' : 'danger'">
                    {{ value }}
                  </MechaTag>
                </template>
              </MechaTable>
            </template>

            <template v-else-if="currentSlug === 'timeline'">
              <MechaTimeline :items="timelineItems" pending="Awaiting uplink..." />
            </template>

            <template v-else-if="currentSlug === 'tree'">
              <MechaTree
                v-model="treeSelected"
                :data="treeNodes"
                :expanded-keys="treeExpanded"
                :expand-on-click-node="true"
                @update:expandedKeys="treeExpanded = $event"
                @change="addLog(`TREE: selected ${treeSelected}`)"
              />
              <MechaTag type="info">
                {{ `selected=${treeSelected ?? 'none'} expanded=${treeExpanded.length}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'tree-select'">
              <MechaTreeSelect
                v-model="treeSelectValue"
                :data="treeNodes"
                :expanded-keys="treeExpanded"
                clearable
                filterable
                @update:expandedKeys="treeExpanded = $event"
                @change="addLog(`TREE SELECT: ${treeSelectValue ?? 'none'}`)"
              />
              <MechaTag type="info">
                {{ `value=${treeSelectValue ?? 'none'}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'statistic'">
              <div class="epx-row">
                <MechaStatistic
                  title="Output"
                  :value="statThroughput"
                  suffix="kW"
                  :trend="2.64"
                  status="success"
                />
                <MechaStatistic
                  title="Risk Score"
                  :value="34.27"
                  :precision="2"
                  :trend="-1.84"
                  status="warning"
                />
              </div>
              <MechaButton
                size="sm"
                variant="ghost"
                @click="
                  statThroughput = Math.round(10600 + Math.random() * 5600);
                  addLog(`STATISTIC: output ${statThroughput}kW`)
                "
              >
                Refresh Metric
              </MechaButton>
            </template>

            <template v-else-if="currentSlug === 'segmented'">
              <MechaSegmented
                v-model="segmentedMode"
                :options="segmentedOptions"
                @change="addLog(`SEGMENTED: mode ${segmentedMode}`)"
              />
              <MechaTag type="info">
                {{ `mode=${segmentedMode}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'affix'">
              <div
                id="affix-demo-scroll"
                style="
                  max-height: 13rem;
                  overflow: auto;
                  border: 1px solid rgb(255 255 255 / 0.12);
                  border-radius: 12px;
                  padding: 0.6rem;
                  display: grid;
                  gap: 0.42rem;
                "
              >
                <MechaAffix
                  target="#affix-demo-scroll"
                  :offset-top="8"
                  @change="addLog(`AFFIX: ${$event ? 'pinned' : 'released'}`)"
                >
                  <MechaTag type="info">Pinned Filter</MechaTag>
                </MechaAffix>
                <p v-for="line in affixDemoLines" :key="line">{{ line }}</p>
              </div>
            </template>

            <template v-else-if="currentSlug === 'backtop'">
              <div
                id="backtop-demo-scroll"
                style="
                  max-height: 13rem;
                  overflow: auto;
                  border: 1px solid rgb(255 255 255 / 0.12);
                  border-radius: 12px;
                  padding: 0.6rem;
                  display: grid;
                  gap: 0.34rem;
                "
              >
                <p v-for="line in backtopDemoLines" :key="line">{{ line }}</p>
              </div>
              <MechaBacktop
                target="#backtop-demo-scroll"
                :visibility-height="120"
                :right="1.2"
                :bottom="1.2"
                @click="addLog('BACKTOP: scroll to top')"
              />
            </template>

            <template v-else-if="currentSlug === 'breadcrumb'">
              <MechaBreadcrumb
                :items="breadcrumbItems"
                separator=">"
                @navigate="addLog(`BREADCRUMB: ${$event.item.label}`)"
              />
            </template>

            <template v-else-if="currentSlug === 'dropdown'">
              <MechaDropdown
                label="Operations"
                :items="dropdownItems"
                @command="
                  dropdownCommand = $event.value;
                  addLog(`DROPDOWN: ${$event.value}`)
                "
              />
              <MechaTag type="info">
                {{ `command=${dropdownCommand ?? 'none'}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'menu'">
              <MechaMenu
                v-model="menuActiveValue"
                :items="menuItems"
                :opened-keys="menuOpened"
                @update:openedKeys="menuOpened = $event"
                @change="addLog(`MENU: active ${menuActiveValue}`)"
              />
              <MechaTag type="info">
                {{ `active=${menuActiveValue ?? 'none'} opened=${menuOpened.length}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'page-header'">
              <MechaPageHeader
                title="Mission Control"
                subtitle="Realtime wing operations dashboard."
                :crumbs="breadcrumbItems"
                show-back
                @back="addLog('PAGE HEADER: back action')"
              >
                <template #extra>
                  <MechaButton size="sm">Sync</MechaButton>
                  <MechaButton size="sm" variant="ghost">Export</MechaButton>
                </template>
              </MechaPageHeader>
            </template>

            <template v-else-if="currentSlug === 'steps'">
              <MechaSteps
                v-model="stepActive"
                :items="stepItems"
                clickable
                @change="addLog(`STEPS: current ${stepActive + 1}`)"
              />
              <MechaTag type="info">
                {{ `step=${stepActive + 1}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'tabs'">
              <MechaTabs
                v-model="tabActive"
                :items="tabItems"
                type="line"
                @change="addLog(`TABS: active ${tabActive}`)"
              />
              <MechaTag type="info">
                {{ `tab=${tabActive ?? "none"}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'alert'">
              <MechaAlert
                v-model="alertVisible"
                type="warning"
                title="Signal Drift"
                description="Telemetry relay latency exceeded threshold."
                closable
                @close="addLog('ALERT: closed')"
              />
              <MechaButton
                size="sm"
                variant="ghost"
                @click="
                  alertVisible = true;
                  addLog('ALERT: reopened')
                "
              >
                Reopen Alert
              </MechaButton>
            </template>

            <template v-else-if="currentSlug === 'dialog'">
              <MechaButton
                size="sm"
                @click="
                  dialogVisible = true;
                  addLog('DIALOG: opened')
                "
              >
                Open Dialog
              </MechaButton>

              <MechaDialog
                v-model="dialogVisible"
                title="Confirm Launch"
                @close="addLog('DIALOG: closed')"
              >
                <p>Proceed with wing deployment to corridor B?</p>
                <template #footer>
                  <MechaButton
                    size="sm"
                    variant="ghost"
                    @click="dialogVisible = false"
                  >
                    Cancel
                  </MechaButton>
                  <MechaButton
                    size="sm"
                    @click="
                      dialogVisible = false;
                      addLog('DIALOG: launch confirmed')
                    "
                  >
                    Confirm
                  </MechaButton>
                </template>
              </MechaDialog>
            </template>

            <template v-else-if="currentSlug === 'drawer'">
              <MechaButton
                size="sm"
                @click="
                  drawerVisible = true;
                  addLog('DRAWER: opened')
                "
              >
                Open Drawer
              </MechaButton>

              <MechaDrawer
                v-model="drawerVisible"
                title="Mission Detail"
                direction="rtl"
                @close="addLog('DRAWER: closed')"
              >
                <p>Wing status:</p>
                <ul class="epx-scroll-list">
                  <li>RAVEN-12 :: ready</li>
                  <li>ATLAS-07 :: hold</li>
                  <li>NOVA-09 :: support</li>
                </ul>
                <template #footer>
                  <MechaButton
                    size="sm"
                    variant="ghost"
                    @click="drawerVisible = false"
                  >
                    Close
                  </MechaButton>
                </template>
              </MechaDrawer>
            </template>

            <template v-else-if="currentSlug === 'loading'">
              <MechaLoading
                v-model="loadingVisible"
                text="Syncing telemetry..."
                spinner="ring"
              >
                <MechaCard title="Payload" subtitle="Wing RAVEN-12" status="info">
                  <p>Data package transfer and checksum validation.</p>
                </MechaCard>
              </MechaLoading>

              <MechaButton
                size="sm"
                variant="ghost"
                @click="
                  loadingVisible = !loadingVisible;
                  addLog(`LOADING: ${loadingVisible ? 'active' : 'idle'}`)
                "
              >
                Toggle Loading
              </MechaButton>
            </template>

            <template v-else-if="currentSlug === 'message'">
              <MechaButton
                size="sm"
                @click="
                  messageVisible = true;
                  addLog('MESSAGE: shown')
                "
              >
                Show Message
              </MechaButton>

              <MechaMessage
                v-model="messageVisible"
                type="success"
                message="Telemetry uplink restored."
                closable
                :duration="2400"
                @close="addLog('MESSAGE: closed')"
              />
            </template>

            <template v-else-if="currentSlug === 'message-box'">
              <MechaButton
                size="sm"
                @click="
                  messageBoxVisible = true;
                  addLog('MESSAGE BOX: opened')
                "
              >
                Open MessageBox
              </MechaButton>

              <MechaMessageBox
                v-model="messageBoxVisible"
                title="Abort Mission?"
                message="All queued drones will return to base."
                type="warning"
                confirm-button-type="danger"
                @confirm="addLog('MESSAGE BOX: confirm')"
                @cancel="addLog('MESSAGE BOX: cancel')"
                @close="addLog('MESSAGE BOX: closed')"
              />
            </template>

            <template v-else-if="currentSlug === 'notification'">
              <MechaButton
                size="sm"
                @click="
                  notificationVisible = true;
                  addLog('NOTIFICATION: shown')
                "
              >
                Show Notification
              </MechaButton>

              <MechaNotification
                v-model="notificationVisible"
                title="Patch Complete"
                message="Wing uplink channel synchronized."
                type="success"
                position="top-right"
                @close="addLog('NOTIFICATION: closed')"
              />
            </template>

            <template v-else-if="currentSlug === 'popconfirm'">
              <MechaPopconfirm
                v-model="popconfirmVisible"
                title="Delete this route?"
                content="This action cannot be undone."
                confirm-type="danger"
                @confirm="addLog('POPCONFIRM: confirmed')"
                @cancel="addLog('POPCONFIRM: canceled')"
                @open-change="addLog(`POPCONFIRM: ${$event ? 'open' : 'close'}`)"
              >
                <template #reference>
                  <MechaButton size="sm" variant="danger">Delete Route</MechaButton>
                </template>
              </MechaPopconfirm>
              <MechaTag type="info">
                {{ `open=${popconfirmVisible}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'popover'">
              <MechaPopover
                v-model="popoverVisible"
                title="Thermal Notes"
                content="Core temperature stable at 54%. Drift under 1.2%."
                trigger="click"
                placement="bottom"
                @open-change="addLog(`POPOVER: ${$event ? 'open' : 'close'}`)"
              >
                <template #reference>
                  <MechaButton size="sm" variant="ghost">Inspect Node</MechaButton>
                </template>
              </MechaPopover>
              <MechaTag type="info">
                {{ `open=${popoverVisible}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'tooltip'">
              <div class="epx-row">
                <MechaTooltip
                  v-model="tooltipVisible"
                  content="Re-sync tactical cache"
                  trigger="click"
                  placement="right"
                  @open-change="addLog(`TOOLTIP: click ${$event ? 'open' : 'close'}`)"
                >
                  <MechaButton size="sm" variant="ghost">Click Tooltip</MechaButton>
                </MechaTooltip>

                <MechaTooltip content="Live hover hint" placement="top">
                  <MechaTag type="warning">Hover Hint</MechaTag>
                </MechaTooltip>
              </div>
              <MechaTag type="info">
                {{ `open=${tooltipVisible}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'input'">
              <div class="epx-grid-two">
                <MechaInput v-model="pilotId" label="Pilot ID" hint="Identity channel" />
                <MechaInput v-model="missionChannel" label="Mission Channel" hint="Ops bus" />
              </div>
            </template>

            <template v-else-if="currentSlug === 'switch'">
              <div class="epx-row">
                <MechaSwitch
                  v-model="reactorLinked"
                  label="Reactor Link"
                  @change="addLog(`SWITCH: reactor ${reactorLinked ? 'on' : 'off'}`)"
                />
                <MechaSwitch
                  v-model="safetyLock"
                  label="Safety Lock"
                  @change="addLog(`SWITCH: safety ${safetyLock ? 'on' : 'off'}`)"
                />
              </div>
            </template>

            <template v-else-if="currentSlug === 'input-number'">
              <div class="epx-grid-two">
                <MechaInputNumber
                  v-model="missionBudget"
                  label="Mission Budget"
                  hint="Credits x1000"
                  :min="0"
                  :max="500"
                  :step="10"
                  :precision="0"
                  @change="addLog(`INPUT NUMBER: budget ${missionBudget ?? 'none'}`)"
                />
                <MechaInputNumber
                  v-model="reserveFuel"
                  label="Reserve Fuel"
                  hint="Liters"
                  :min="0"
                  :max="1200"
                  :step="20"
                  controls-position="both"
                  @change="addLog(`INPUT NUMBER: reserve fuel ${reserveFuel ?? 'none'}`)"
                />
              </div>
              <MechaTag type="info">
                {{ `budget=${missionBudget ?? "none"} fuel=${reserveFuel ?? "none"}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'autocomplete'">
              <MechaAutocomplete
                v-model="commandQuery"
                :options="commandOptions"
                placeholder="Type mission command"
                clearable
                @select="addLog(`AUTOCOMPLETE: selected ${$event.label}`)"
              />
              <MechaTag type="info">
                {{ commandQuery || "No Command" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'select'">
              <MechaSelect
                v-model="targetSector"
                :options="sectorOptions"
                placeholder="Target Sector"
                @change="addLog(`SELECT: switched to ${targetSector}`)"
              />
            </template>

            <template v-else-if="currentSlug === 'cascader'">
              <MechaCascader
                v-model="missionRoute"
                :options="routeOptions"
                placeholder="Select Route"
                clearable
                @change="addLog(`CASCADER: route ${missionRoute.join(' / ') || 'none'}`)"
              />
              <MechaTag type="info">
                {{ missionRoute.length ? missionRoute.join(" / ") : "No Route" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'color-picker-panel'">
              <MechaColorPickerPanel
                v-model="panelColor"
                v-model:alpha="panelAlpha"
                :presets="panelPresets"
                show-alpha
                @change="addLog(`COLOR: ${panelColor} / alpha ${Math.round(panelAlpha * 100)}%`)"
              />
              <MechaTag type="info">
                {{ panelColor }} / {{ Math.round(panelAlpha * 100) }}%
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'color-picker'">
              <MechaColorPicker
                v-model="panelColor"
                v-model:alpha="panelAlpha"
                :presets="panelPresets"
                clearable
                show-alpha
                @change="addLog(`COLOR PICKER: ${panelColor} / ${Math.round(panelAlpha * 100)}%`)"
              />
              <MechaTag type="info">
                {{ panelColor || "none" }} / {{ Math.round(panelAlpha * 100) }}%
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'date-picker-panel'">
              <MechaDatePickerPanel
                v-model="panelDate"
                :shortcuts="dateShortcuts"
                @change="addLog(`DATE: ${panelDate || 'none'}`)"
              />
              <MechaTag type="info">
                {{ panelDate || "No Date" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'date-picker'">
              <MechaDatePicker
                v-model="selectedDate"
                :shortcuts="dateShortcuts"
                clearable
                @change="addLog(`DATE PICKER: ${selectedDate || 'none'}`)"
              />
              <MechaTag type="info">
                {{ selectedDate || "No Date" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'date-time-picker'">
              <MechaDateTimePicker
                v-model="selectedDateTime"
                :shortcuts="dateShortcuts"
                :minute-step="5"
                clearable
                @change="addLog(`DATETIME PICKER: ${selectedDateTime || 'none'}`)"
              />
              <MechaTag type="info">
                {{ selectedDateTime || "No DateTime" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'time-picker'">
              <MechaTimePicker
                v-model="selectedTime"
                :minute-step="5"
                :second-step="10"
                clearable
                @change="addLog(`TIME PICKER: ${selectedTime || 'none'}`)"
              />
              <MechaTag type="info">
                {{ selectedTime || "No Time" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'time-select'">
              <MechaTimeSelect
                v-model="selectedPresetTime"
                start="08:00"
                end="18:00"
                step="00:30"
                min-time="09:00"
                max-time="17:30"
                clearable
                @change="addLog(`TIME SELECT: ${selectedPresetTime || 'none'}`)"
              />
              <MechaTag type="info">
                {{ selectedPresetTime || "No Slot" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'form'">
              <MechaForm
                :model="formModel"
                :pipeline="formPipeline"
                label-width="7.2rem"
                @submit="submitMissionForm"
                @reset="resetMissionForm"
              >
                <div class="m-form-item">
                  <label class="m-form-item__label">Pilot</label>
                  <div class="m-form-item__control">
                    <MechaInput v-model="formPilot" placeholder="Pilot ID" />
                  </div>
                </div>

                <div class="m-form-item">
                  <label class="m-form-item__label">Sector</label>
                  <div class="m-form-item__control">
                    <MechaSelect
                      v-model="formSector"
                      :options="sectorOptions"
                      placeholder="Target Sector"
                    />
                  </div>
                </div>

                <div class="m-form-item">
                  <label class="m-form-item__label">Launch Window</label>
                  <div class="m-form-item__control">
                    <MechaDateTimePicker v-model="formWindow" :minute-step="5" clearable />
                  </div>
                </div>

                <div class="m-form-item">
                  <label class="m-form-item__label">Priority</label>
                  <div class="m-form-item__control">
                    <MechaInputNumber
                      v-model="formPriority"
                      :min="1"
                      :max="5"
                      :step="1"
                      :precision="0"
                    />
                  </div>
                </div>

                <template #actions>
                  <MechaButton type="submit" size="sm">Submit</MechaButton>
                  <MechaButton type="reset" size="sm" variant="ghost">Reset</MechaButton>
                </template>
              </MechaForm>
            </template>

            <template v-else-if="currentSlug === 'transfer'">
              <MechaTransfer
                v-model="transferSelection"
                :options="transferOptions"
                filterable
                @change="
                  addLog(
                    `TRANSFER: ${transferSelection.length ? transferSelection.join(', ') : 'none'}`
                  )
                "
              />
              <MechaTag type="info">
                {{ transferSelection.length ? transferSelection.join(" / ") : "No Assignment" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'upload'">
              <MechaUpload
                v-model="uploadQueue"
                multiple
                :limit="4"
                accept=".pdf,.png,.jpg"
                @change="addLog(`UPLOAD: queue size ${uploadQueue.length}`)"
                @exceed="addLog(`UPLOAD: exceed limit ${$event}`)"
              />
              <MechaTag type="info">
                {{ `files=${uploadQueue.length}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'checkbox'">
              <MechaCheckbox
                v-model="missionAck"
                label="Mission Acknowledge"
                @change="addLog(`CHECKBOX: mission ack ${missionAck ? 'on' : 'off'}`)"
              />
              <MechaTag type="info">
                {{ missionAck ? "Acknowledged" : "Not Acknowledged" }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'radio'">
              <div class="epx-row">
                <MechaRadio
                  v-model="fireMode"
                  value="single"
                  name="fire-mode"
                  label="Single"
                  @change="addLog(`RADIO: mode ${fireMode}`)"
                />
                <MechaRadio
                  v-model="fireMode"
                  value="burst"
                  name="fire-mode"
                  label="Burst"
                  @change="addLog(`RADIO: mode ${fireMode}`)"
                />
                <MechaRadio
                  v-model="fireMode"
                  value="salvo"
                  name="fire-mode"
                  label="Salvo"
                  @change="addLog(`RADIO: mode ${fireMode}`)"
                />
              </div>
              <MechaTag type="info">
                {{ `mode=${fireMode}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'rate'">
              <MechaRate
                v-model="missionRating"
                allow-half
                clearable
                show-score
                @change="addLog(`RATE: score ${missionRating}`)"
              />
              <MechaRate :model-value="2" :max="5" disabled />
              <MechaTag type="info">
                {{ `rating=${missionRating}` }}
              </MechaTag>
            </template>

            <template v-else-if="currentSlug === 'choice'">
              <MechaCheckbox
                v-model="missionAck"
                label="Mission Acknowledge"
                @change="addLog(`CHECKBOX: mission ack ${missionAck ? 'on' : 'off'}`)"
              />
              <div class="epx-row">
                <MechaRadio
                  v-model="fireMode"
                  value="single"
                  name="fire-mode"
                  label="Single"
                  @change="addLog(`RADIO: mode ${fireMode}`)"
                />
                <MechaRadio
                  v-model="fireMode"
                  value="burst"
                  name="fire-mode"
                  label="Burst"
                  @change="addLog(`RADIO: mode ${fireMode}`)"
                />
                <MechaRadio
                  v-model="fireMode"
                  value="salvo"
                  name="fire-mode"
                  label="Salvo"
                  @change="addLog(`RADIO: mode ${fireMode}`)"
                />
              </div>
            </template>

            <template v-else-if="currentSlug === 'slider'">
              <MechaSlider
                v-model="turretPower"
                label="Turret Power"
                :min="0"
                :max="120"
                :step="2"
                @change="addLog(`SLIDER: power ${turretPower}`)"
              />
              <MechaProgress :percentage="progressValue" :status="progressStatus" />
              <div class="epx-row">
                <MechaButton size="sm" variant="ghost" @click="decreasePower">Decrease</MechaButton>
                <MechaButton size="sm" @click="increasePower">Increase</MechaButton>
              </div>
            </template>

            <template v-else-if="currentSlug === 'scrollbar'">
              <MechaScrollbar
                height="14rem"
                style="inline-size: min(34rem, 100%)"
                @scroll="addLog(`SCROLLBAR: top ${Math.round($event.scrollTop)}`)"
              >
                <ul class="epx-scroll-list">
                  <li v-for="line in scrollLines" :key="line">{{ line }}</li>
                </ul>
              </MechaScrollbar>
              <MechaButton size="sm" variant="ghost" @click="appendScrollLine">
                Add Line
              </MechaButton>
            </template>

            <template v-else-if="currentSlug === 'tag'">
              <MechaTag
                v-for="tag in tags"
                :key="tag"
                type="info"
                closable
                @close="removeTag(tag)"
              >
                {{ tag }}
              </MechaTag>
              <MechaTag v-if="tags.length === 0" type="warning">No Active Tags</MechaTag>
            </template>

            <template v-else-if="currentCatalogComponent">
              <component
                :is="currentCatalogComponent"
                :title="currentPage.title"
                :subtitle="currentPage.summary"
                @action="addLog(`CATALOG: ${currentPage.title} simulate action`)"
              />
            </template>

            <template v-else>
              <MechaProgress :percentage="22" />
              <MechaProgress :percentage="67" status="warning" />
              <MechaProgress :percentage="100" status="success" />
            </template>
          </div>
        </section>

        <section id="source" class="epx-block">
          <header class="epx-block-head">
            <h3>Source</h3>
          </header>
          <pre class="epx-code"><code>{{ currentPage.code }}</code></pre>
        </section>

        <section id="api" class="epx-block">
          <header class="epx-block-head">
            <h3>API</h3>
          </header>
          <table class="epx-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Description</th>
                <th>Type</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in currentPage.api" :key="row.name">
                <td><code>{{ row.name }}</code></td>
                <td>{{ row.description }}</td>
                <td><code>{{ row.type }}</code></td>
                <td><code>{{ row.defaultValue }}</code></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="ecosystem" class="epx-block">
          <header class="epx-block-head">
            <h3>Ecosystem</h3>
          </header>
          <div class="epx-stats">
            <article v-for="(count, key) in categoryCounts" :key="key" class="epx-stat-card">
              <span>{{ key }}</span>
              <strong>{{ count }}</strong>
            </article>
          </div>
          <ol class="epx-log">
            <li v-for="line in eventLog" :key="line">{{ line }}</li>
          </ol>
        </section>
      </main>

      <aside class="epx-toc">
        <h4>On this page</h4>
        <button
          v-for="item in tocLinks"
          :key="item.id"
          type="button"
          class="epx-toc-link"
          :class="{ 'is-active': activeAnchor === item.id }"
          @click="jumpTo(item.id)"
        >
          {{ item.label }}
        </button>
      </aside>
    </div>
  </div>
</template>
