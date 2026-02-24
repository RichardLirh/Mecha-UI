# Component API (Vue 3)

## Core Components

## `MechaButton`

Props:
- `label?: string`
- `type?: "button" | "submit" | "reset"` (default `"button"`)
- `variant?: "solid" | "ghost" | "danger"` (default `"solid"`)
- `size?: "sm" | "md" | "lg"` (default `"md"`)
- `loading?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<MouseEvent>`

Events:
- `click(event: MouseEvent)`
- `blocked(event: MouseEvent)`

Slots:
- `default`
- `leading`
- `trailing`

Parts:
- `root`, `frame`, `orbit`, `scan`, `shockwave`, `surface`, `leading`, `label`, `loader`, `trailing`, `corners`

## `MechaIcon`

Props:
- `name?: string`
- `size?: string | number`
- `strokeWidth?: number`
- `tone?: "default" | "cool" | "hot" | "success" | "danger" | "muted"`
- `spin?: boolean`
- `pulse?: boolean`
- `framed?: boolean`
- `filled?: boolean`
- `label?: string`
- `decorative?: boolean`
- `ui?: MechaComponentUi`

Slots:
- `default` (custom SVG path nodes)

Parts:
- `root`, `frame`, `glow`, `svg`, `path`

## `MechaLayout`

Props:
- `as?: "div" | "section" | "main" | "article" | "nav"`
- `direction?: "row" | "column"`
- `gap?: string`
- `align?: "start" | "center" | "end" | "stretch"`
- `justify?: "start" | "center" | "end" | "between" | "around" | "evenly"`
- `wrap?: boolean`
- `grid?: boolean`
- `columns?: number`
- `minColumnWidth?: string`
- `padded?: boolean`
- `surface?: boolean`
- `bordered?: boolean`
- `ui?: MechaComponentUi`

Slots:
- `default`, `header`, `footer`

Parts:
- `root`, `header`, `body`, `footer`

## `MechaLink`

Props:
- `href?: string`
- `label?: string`
- `target?: string`
- `rel?: string`
- `tone?: "default" | "cool" | "hot" | "danger" | "success" | "muted"`
- `underline?: "always" | "hover" | "none"`
- `external?: boolean`
- `disabled?: boolean`
- `block?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ href: string | undefined; target: string | undefined; external: boolean }>`

Events:
- `click(event: MouseEvent)`
- `blocked(event: MouseEvent)`

Slots:
- `default`, `leading`, `trailing`

Parts:
- `root`, `leading`, `text`, `trailing`, `external`

## `MechaAvatar`

Props:
- `src?: string`
- `alt?: string`
- `name?: string`
- `size?: number | string`
- `shape?: "circle" | "rounded" | "square"`
- `fit?: "cover" | "contain"`
- `status?: "none" | "online" | "busy" | "warning" | "offline"`
- `bordered?: boolean`
- `ui?: MechaComponentUi`

Events:
- `click(event: MouseEvent)`
- `load(event: Event)`
- `error(event: Event)`

Slots:
- `default` (fallback text/content)

Parts:
- `root`, `image`, `fallback`, `status`, `frame`

## `MechaBadge`

Props:
- `value?: string | number | null`
- `max?: number`
- `dot?: boolean`
- `hidden?: boolean`
- `showZero?: boolean`
- `type?: "primary" | "success" | "warning" | "danger" | "info"`
- `offset?: [number, number]`
- `ui?: MechaComponentUi`

Slots:
- `default` (target content to attach badge to)

Parts:
- `root`, `content`, `indicator`, `value`

## `MechaCalendar`

Props:
- `modelValue?: string | null`
- `title?: string`
- `disabled?: boolean`
- `firstDayOfWeek?: number`
- `shortcuts?: Array<{ label: string; value?: string; daysOffset?: number }>`
- `ui?: MechaComponentUi`
- `panelUi?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: string | null; next: string | null; source: string }>`

Events:
- `update:modelValue(value: string | null)`
- `change(value: string | null)`
- `blocked(value: string | null)`

Slots:
- `extra`

Parts:
- `root`, `header`, `heading`, `title`, `value`, `panel`

## `MechaCard`

Props:
- `title?: string`
- `subtitle?: string`
- `status?: "default" | "info" | "success" | "warning" | "danger"`
- `shadow?: "always" | "hover" | "never"`
- `padding?: string`
- `bordered?: boolean`
- `interactive?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ action: "click"; title: string; status: "default" | "info" | "success" | "warning" | "danger" }>`

Events:
- `click(event: MouseEvent)`
- `blocked(event: MouseEvent)`

Slots:
- `default`, `title`, `subtitle`, `actions`, `footer`

Parts:
- `root`, `header`, `heading`, `title`, `subtitle`, `actions`, `body`, `footer`

## `MechaCarousel`

Props:
- `modelValue?: number`
- `items?: Array<{ id?: string | number; title?: string; description?: string; image?: string; disabled?: boolean }>`
- `autoplay?: boolean`
- `interval?: number`
- `loop?: boolean`
- `pauseOnHover?: boolean`
- `showArrows?: boolean`
- `showDots?: boolean`
- `height?: string`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: number; next: number; source: "next" | "prev" | "dot" | "auto" | "keyboard" }>`

Events:
- `update:modelValue(value: number)`
- `change(value: number)`
- `blocked(value: number)`

Slots:
- `slide` (scoped: `{ item, index, active }`)

Parts:
- `root`, `viewport`, `track`, `slide`, `media`, `content`, `title`, `description`, `controls`, `prev`, `next`, `dots`, `dot`

## `MechaCollapse`

Props:
- `modelValue?: Array<string | number>`
- `items?: Array<{ name?: string | number; label: string; hint?: string; content?: string; disabled?: boolean }>`
- `accordion?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: Array<string | number>; next: Array<string | number>; item: { name: string | number; label: string } }>`

Events:
- `update:modelValue(value: Array<string | number>)`
- `change(value: Array<string | number>)`
- `blocked(value: Array<string | number>)`

Slots:
- `item` (scoped: `{ item, index, open }`)

Parts:
- `root`, `item`, `header`, `label`, `hint`, `arrow`, `content`

## `MechaDescriptions`

Props:
- `title?: string`
- `items?: Array<{ label: string; value?: string | number; span?: number }>`
- `columns?: number`
- `size?: "sm" | "md"`
- `bordered?: boolean`
- `ui?: MechaComponentUi`

Slots:
- `default`
- `title`
- `value` (scoped: `{ item, index }`)

Parts:
- `root`, `header`, `title`, `body`, `item`, `label`, `value`, `empty`

## `MechaEmpty`

Props:
- `title?: string`
- `description?: string`
- `size?: number | string`
- `compact?: boolean`
- `ui?: MechaComponentUi`

Slots:
- `default`
- `illustration`
- `title`
- `description`
- `actions`

Parts:
- `root`, `illustration`, `svg`, `title`, `description`, `actions`

## `MechaImage`

Props:
- `src?: string`
- `alt?: string`
- `width?: string`
- `height?: string`
- `fit?: "cover" | "contain" | "fill"`
- `radius?: string`
- `lazy?: boolean`
- `preview?: boolean`
- `fallbackText?: string`
- `ui?: MechaComponentUi`

Events:
- `load(event: Event)`
- `error(event: Event)`
- `click(event: MouseEvent)`
- `preview-change(value: boolean)`

Slots:
- `fallback`
- `caption`

Parts:
- `root`, `image`, `fallback`, `caption`, `preview`, `preview-image`, `preview-close`

## `MechaInfiniteScroll`

Props:
- `height?: string`
- `distance?: number`
- `delay?: number`
- `disabled?: boolean`
- `loading?: boolean`
- `finished?: boolean`
- `immediate?: boolean`
- `ui?: MechaComponentUi`

Events:
- `load()`
- `scroll(payload: { scrollTop: number; clientHeight: number; scrollHeight: number })`

Slots:
- `default`
- `loading`
- `finished`
- `placeholder`

Parts:
- `root`, `viewport`, `content`, `loading`, `finished`, `placeholder`

## `MechaPagination`

Props:
- `modelValue?: number`
- `total?: number`
- `pageSize?: number`
- `pagerCount?: number`
- `size?: "sm" | "md"`
- `disabled?: boolean`
- `hideOnSinglePage?: boolean`
- `showTotal?: boolean`
- `showJumper?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: number; next: number; pageCount: number; source: "prev" | "next" | "pager" | "first" | "last" | "jumper" }>`

Events:
- `update:modelValue(value: number)`
- `change(value: number)`
- `blocked(value: number)`

Slots:
- `total` (scoped: `{ total, pageSize, pageCount }`)

Parts:
- `root`, `prev`, `pagers`, `pager`, `ellipsis`, `next`, `total`, `jumper`, `jumper-label`, `jumper-field`, `jumper-go`

## `MechaResult`

Props:
- `title?: string`
- `subtitle?: string`
- `status?: "info" | "success" | "warning" | "error"`
- `bordered?: boolean`
- `compact?: boolean`
- `ui?: MechaComponentUi`

Slots:
- `default`
- `icon` (scoped: `{ status }`)
- `title`
- `subtitle`
- `extra`

Parts:
- `root`, `icon`, `icon-svg`, `body`, `title`, `subtitle`, `content`, `extra`

## `MechaSkeleton`

Props:
- `loading?: boolean`
- `rows?: number`
- `animated?: boolean`
- `title?: boolean`
- `avatar?: boolean`
- `round?: boolean`
- `ui?: MechaComponentUi`

Slots:
- `default` (rendered when `loading=false`)

Parts:
- `root`, `avatar`, `body`, `title`, `line`

## `MechaTable`

Props:
- `columns?: Array<{ key: string; label: string; width?: string; align?: "left" | "center" | "right"; sortable?: boolean }>`
- `rows?: Array<Record<string, unknown>>`
- `rowKey?: string`
- `size?: "sm" | "md"`
- `stripe?: boolean`
- `bordered?: boolean`
- `hoverable?: boolean`
- `disabled?: boolean`
- `emptyText?: string`
- `sortBy?: string | null`
- `sortOrder?: "asc" | "desc" | null`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ action: "sort" | "row-click"; currentSort; nextSort; column?; row?; rowIndex? }>`

Events:
- `update:sortBy(value: string | null)`
- `update:sortOrder(value: "asc" | "desc" | null)`
- `sort-change(payload: { sortBy: string | null; sortOrder: "asc" | "desc" | null; column? })`
- `row-click(payload: { row: Record<string, unknown>; index: number })`
- `blocked(payload: { action: "sort" | "row-click" })`

Slots:
- `empty`
- `header-{columnKey}` (scoped: `{ column }`)
- `cell-{columnKey}` (scoped: `{ row, column, value, index }`)

Parts:
- `root`, `viewport`, `table`, `head`, `head-row`, `head-cell`, `sort`, `body`, `row`, `cell`, `empty`

## `MechaTimeline`

Props:
- `items?: Array<{ key?: string | number; label: string; content?: string; time?: string; type?: "default" | "info" | "success" | "warning" | "danger" }>`
- `reverse?: boolean`
- `pending?: boolean | string`
- `ui?: MechaComponentUi`

Slots:
- `item` (scoped: `{ item, index }`)

Parts:
- `root`, `list`, `item`, `rail`, `dot`, `line`, `content`, `label`, `text`, `time`, `pending`, `pending-dot`, `pending-label`

## `MechaTree`

Props:
- `modelValue?: string | number | null`
- `data?: Array<{ key?: string | number; label: string; hint?: string; disabled?: boolean; children?: TreeNode[] }>`
- `expandedKeys?: Array<string | number>`
- `defaultExpandedKeys?: Array<string | number>`
- `indent?: number`
- `disabled?: boolean`
- `selectable?: boolean`
- `expandOnClickNode?: boolean`
- `accordion?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ action: "select" | "toggle"; node; current; next }>`

Events:
- `update:modelValue(value: string | number | null)`
- `change(value: string | number | null)`
- `update:expandedKeys(value: Array<string | number>)`
- `expand-change(value: Array<string | number>)`
- `node-click(node: TreeNode)`
- `blocked(payload: { action: "select" | "toggle"; selected: string | number | null; expanded: Array<string | number> })`

Slots:
- `empty`

Parts:
- `root`, `list`, `item`, `toggle`, `placeholder`, `label`, `text`, `hint`, `empty`

## `MechaTreeSelect`

Props:
- `modelValue?: string | number | null`
- `data?: TreeNode[]`
- `placeholder?: string`
- `disabled?: boolean`
- `clearable?: boolean`
- `filterable?: boolean`
- `expandedKeys?: Array<string | number>`
- `defaultExpandedKeys?: Array<string | number>`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: string | number | null; next: string | number | null; source: "select" | "clear" }>`

Events:
- `update:modelValue(value: string | number | null)`
- `change(value: string | number | null)`
- `blocked(value: string | number | null)`
- `open-change(value: boolean)`
- `update:expandedKeys(value: Array<string | number>)`

Parts:
- `root`, `trigger`, `value`, `actions`, `clear`, `arrow`, `panel`, `search`, `tree`, `empty`

## `MechaStatistic`

Props:
- `title?: string`
- `value?: number | string`
- `precision?: number`
- `groupSeparator?: string`
- `prefix?: string`
- `suffix?: string`
- `trend?: number | null`
- `status?: "default" | "info" | "success" | "warning" | "danger"`
- `loading?: boolean`
- `animated?: boolean`
- `duration?: number`
- `ui?: MechaComponentUi`

Slots:
- `title`
- `prefix`
- `suffix`

Parts:
- `root`, `header`, `title`, `body`, `prefix`, `value`, `suffix`, `skeleton`, `trend`

## `MechaSegmented`

Props:
- `modelValue?: string | number | boolean | null`
- `options?: Array<string | number | boolean | { label: string; value: string | number | boolean; hint?: string; disabled?: boolean }>`
- `size?: "sm" | "md" | "lg"`
- `block?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current; next; option; source: "select" | "keyboard" }>`

Events:
- `update:modelValue(value: string | number | boolean | null)`
- `change(value: string | number | boolean | null)`
- `blocked(value: string | number | boolean | null)`

Parts:
- `root`, `item`, `label`, `hint`

## `MechaAffix`

Props:
- `offsetTop?: number`
- `target?: string`
- `zIndex?: number`
- `disabled?: boolean`
- `ui?: MechaComponentUi`

Events:
- `change(value: boolean)`

Parts:
- `root`, `placeholder`, `content`

## `MechaBacktop`

Props:
- `visibilityHeight?: number`
- `target?: string`
- `right?: number | string`
- `bottom?: number | string`
- `duration?: number`
- `behavior?: "smooth" | "auto"`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ from: number; to: number; target: string }>`

Events:
- `click(event: MouseEvent)`
- `change(value: boolean)`
- `blocked(from: number)`

Parts:
- `root`, `icon`, `label`

## `MechaBreadcrumb`

Props:
- `items?: Array<{ label: string; to?: string; disabled?: boolean }>`
- `separator?: string`
- `maxItems?: number`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ index: number; item; current: string | null; next: string | null }>`

Events:
- `navigate(payload: { item; index: number })`
- `blocked(payload: { item; index: number })`

Slots:
- `item` (scoped: `{ item, index }`)

Parts:
- `root`, `list`, `node`, `item`, `separator`, `ellipsis`

## `MechaDropdown`

Props:
- `modelValue?: boolean`
- `label?: string`
- `items?: Array<{ label: string; value: string | number; hint?: string; disabled?: boolean; danger?: boolean }>`
- `trigger?: "click" | "hover"`
- `placement?: "bottom-start" | "bottom-end"`
- `hideOnClick?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ source: "trigger" | "hover" | "outside" | "select" | "keyboard"; open: boolean; nextOpen: boolean; item? }>`

Events:
- `update:modelValue(value: boolean)`
- `open-change(value: boolean)`
- `command(item)`
- `blocked(payload: { source })`

Slots:
- `trigger`
- `default`

Parts:
- `root`, `trigger`, `arrow`, `panel`, `list`, `row`, `item`, `item-label`, `item-hint`

## `MechaMenu`

Props:
- `modelValue?: string | number | null`
- `items?: Array<{ key: string | number; label: string; hint?: string; disabled?: boolean; children?: MenuItem[] }>`
- `mode?: "vertical" | "horizontal"`
- `openedKeys?: Array<string | number>`
- `defaultOpenedKeys?: Array<string | number>`
- `accordion?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ action: "select" | "toggle"; key: string | number; current; next }>`

Events:
- `update:modelValue(value: string | number | null)`
- `change(value: string | number | null)`
- `update:openedKeys(value: Array<string | number>)`
- `open-change(value: Array<string | number>)`
- `blocked(payload: { action: "select" | "toggle"; key: string | number })`

Parts:
- `root`, `list`, `group`, `item`, `label`, `hint`, `arrow`, `sub`, `sub-row`, `sub-item`, `sub-label`, `sub-hint`

## `MechaPageHeader`

Props:
- `title?: string`
- `subtitle?: string`
- `crumbs?: Array<{ label: string; to?: string; disabled?: boolean }>`
- `showBack?: boolean`
- `backText?: string`
- `compact?: boolean`
- `bordered?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ action: "back"; title: string }>`

Events:
- `back(event: MouseEvent)`
- `blocked(event: MouseEvent)`

Slots:
- `default`
- `breadcrumb`
- `back`
- `title`
- `subtitle`
- `extra`

Parts:
- `root`, `breadcrumb`, `crumb`, `separator`, `main`, `back`, `heading`, `title`, `subtitle`, `content`, `extra`

## `MechaSteps`

Props:
- `modelValue?: number`
- `items?: Array<{ title: string; description?: string; status?: "wait" | "process" | "finish" | "success" | "error"; disabled?: boolean }>`
- `direction?: "horizontal" | "vertical"`
- `alignCenter?: boolean`
- `simple?: boolean`
- `clickable?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: number; next: number; item: { title: string; description?: string; status?: "wait" | "process" | "finish" | "success" | "error"; disabled?: boolean }; source: "click" | "keyboard" }>`

Events:
- `update:modelValue(value: number)`
- `change(value: number)`
- `blocked(value: number)`

Parts:
- `root`, `list`, `item`, `head`, `icon`, `meta`, `title`, `description`, `line`

## `MechaTabs`

Props:
- `modelValue?: string | number | null`
- `items?: Array<{ label: string; value: string | number; content?: string; disabled?: boolean; closable?: boolean }>`
- `type?: "line" | "card"`
- `stretch?: boolean`
- `closable?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: string | number | null; next: string | number | null; source: "click" | "keyboard" | "remove"; item?: { label: string; value: string | number; content?: string; disabled?: boolean; closable?: boolean } }>`

Events:
- `update:modelValue(value: string | number | null)`
- `change(value: string | number | null)`
- `remove(value: string | number)`
- `blocked(value: string | number | null)`

Slots:
- `pane` (scoped: `{ item, value }`)

Parts:
- `root`, `nav`, `tab`, `label`, `close`, `body`, `panel`, `empty`

## `MechaAlert`

Props:
- `modelValue?: boolean`
- `title?: string`
- `description?: string`
- `type?: "info" | "success" | "warning" | "error"`
- `closable?: boolean`
- `showIcon?: boolean`
- `center?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean; source: "close" }>`

Events:
- `update:modelValue(value: boolean)`
- `close()`
- `blocked()`

Slots:
- `default`
- `icon`
- `title`

Parts:
- `root`, `icon`, `body`, `title`, `description`, `close`

## `MechaDialog`

Props:
- `modelValue?: boolean`
- `title?: string`
- `width?: string`
- `top?: string`
- `modal?: boolean`
- `closeOnClickModal?: boolean`
- `closeOnPressEscape?: boolean`
- `showClose?: boolean`
- `lockScroll?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean; source: "close" | "mask" | "esc" }>`

Events:
- `update:modelValue(value: boolean)`
- `open()`
- `close()`
- `blocked()`

Slots:
- `default`
- `title`
- `footer`

Parts:
- `root`, `mask`, `panel`, `header`, `title`, `close`, `body`, `footer`

## `MechaDrawer`

Props:
- `modelValue?: boolean`
- `title?: string`
- `size?: string`
- `direction?: "rtl" | "ltr" | "ttb" | "btt"`
- `modal?: boolean`
- `closeOnClickModal?: boolean`
- `closeOnPressEscape?: boolean`
- `showClose?: boolean`
- `lockScroll?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean; source: "close" | "mask" | "esc" }>`

Events:
- `update:modelValue(value: boolean)`
- `open()`
- `close()`
- `blocked()`

Slots:
- `default`
- `title`
- `footer`

Parts:
- `root`, `mask`, `panel`, `header`, `title`, `close`, `body`, `footer`

## `MechaLoading`

Props:
- `modelValue?: boolean`
- `text?: string`
- `spinner?: "ring" | "dots"`
- `fullscreen?: boolean`
- `lock?: boolean`
- `background?: string`
- `zIndex?: number`
- `ui?: MechaComponentUi`

Events:
- `update:modelValue(value: boolean)`

Slots:
- `default`

Parts:
- `root`, `content`, `overlay`, `spinner-wrap`, `ring`, `dots`, `text`

## `MechaMessage`

Props:
- `modelValue?: boolean`
- `message?: string`
- `type?: "info" | "success" | "warning" | "error"`
- `showIcon?: boolean`
- `closable?: boolean`
- `duration?: number`
- `offset?: number`
- `zIndex?: number`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean; source: "close" | "auto" }>`

Events:
- `update:modelValue(value: boolean)`
- `close()`
- `blocked()`

Slots:
- `default`
- `icon`

Parts:
- `root`, `panel`, `icon`, `content`, `text`, `close`

## `MechaMessageBox`

Props:
- `modelValue?: boolean`
- `title?: string`
- `message?: string`
- `type?: "info" | "success" | "warning" | "error"`
- `width?: string`
- `top?: string`
- `modal?: boolean`
- `closeOnClickModal?: boolean`
- `closeOnPressEscape?: boolean`
- `showClose?: boolean`
- `lockScroll?: boolean`
- `showCancelButton?: boolean`
- `showConfirmButton?: boolean`
- `cancelButtonText?: string`
- `confirmButtonText?: string`
- `confirmButtonType?: "primary" | "danger"`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean; source: "close" | "mask" | "esc" | "confirm" | "cancel" }>`

Events:
- `update:modelValue(value: boolean)`
- `open()`
- `close()`
- `confirm()`
- `cancel()`
- `blocked()`

Slots:
- `default`
- `icon`
- `title`
- `footer`

Parts:
- `root`, `mask`, `panel`, `header`, `icon`, `title`, `close`, `body`, `message`, `footer`, `cancel`, `confirm`

## `MechaNotification`

Props:
- `modelValue?: boolean`
- `title?: string`
- `message?: string`
- `type?: "info" | "success" | "warning" | "error"`
- `position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"`
- `duration?: number`
- `offset?: number`
- `closable?: boolean`
- `showIcon?: boolean`
- `zIndex?: number`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean; source: "close" | "auto" }>`

Events:
- `update:modelValue(value: boolean)`
- `open()`
- `close()`
- `blocked()`

Slots:
- `default`
- `icon`
- `title`

Parts:
- `root`, `panel`, `icon`, `body`, `title`, `message`, `close`

## `MechaPopconfirm`

Props:
- `modelValue?: boolean`
- `title?: string`
- `content?: string`
- `confirmText?: string`
- `cancelText?: string`
- `confirmType?: "primary" | "danger"`
- `trigger?: "click" | "hover"`
- `placement?: "top" | "bottom" | "left" | "right"`
- `hideAfterConfirm?: boolean`
- `hideAfterCancel?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ source: "trigger" | "hover" | "outside" | "confirm" | "cancel" | "keyboard"; open: boolean; nextOpen: boolean }>`

Events:
- `update:modelValue(value: boolean)`
- `open-change(value: boolean)`
- `confirm()`
- `cancel()`
- `blocked(payload: { source })`

Slots:
- `default`
- `reference`

Parts:
- `root`, `reference`, `panel`, `arrow`, `title`, `content`, `actions`, `cancel`, `confirm`

## `MechaPopover`

Props:
- `modelValue?: boolean`
- `title?: string`
- `content?: string`
- `label?: string`
- `trigger?: "click" | "hover" | "focus"`
- `placement?: "top" | "bottom" | "left" | "right"`
- `width?: string`
- `showArrow?: boolean`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ source: "trigger" | "hover" | "focus" | "outside" | "keyboard"; open: boolean; nextOpen: boolean }>`

Events:
- `update:modelValue(value: boolean)`
- `open-change(value: boolean)`
- `blocked(payload: { source })`

Slots:
- `default`
- `reference`
- `title`

Parts:
- `root`, `reference`, `panel`, `arrow`, `header`, `title`, `body`, `content`

## `MechaTooltip`

Props:
- `modelValue?: boolean`
- `content?: string`
- `trigger?: "hover" | "focus" | "click"`
- `placement?: "top" | "bottom" | "left" | "right"`
- `openDelay?: number`
- `hideDelay?: number`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ source: "trigger" | "hover" | "focus" | "outside" | "keyboard" | "delay"; open: boolean; nextOpen: boolean }>`

Events:
- `update:modelValue(value: boolean)`
- `open-change(value: boolean)`
- `blocked(payload: { source })`

Slots:
- `default`
- `content`

Parts:
- `root`, `reference`, `panel`, `arrow`, `text`

## `MechaPanel`

Props:
- `title: string`
- `subtitle?: string`
- `status?: "idle" | "active" | "warning" | "offline"`
- `collapsible?: boolean`
- `open?: boolean`
- `defaultOpen?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean }>`

Events:
- `update:open(value: boolean)`
- `toggle(value: boolean)`
- `blocked(value: boolean)`

Slots:
- `default`, `title`, `subtitle`, `footer`

## `MechaInput`

Props:
- `modelValue?: string`
- `label?: string`
- `hint?: string`
- `placeholder?: string`
- `state?: "default" | "success" | "warning" | "danger"`
- `ui?: MechaComponentUi`

Events:
- `update:modelValue(value: string)`
- `focus(event: FocusEvent)`
- `blur(event: FocusEvent)`

Slots:
- `label`, `prefix`, `suffix`, `hint`

## `MechaAutocomplete`

Props:
- `modelValue?: string`
- `options?: Array<string | { label: string; value?: string | number; hint?: string; disabled?: boolean }>`
- `placeholder?: string`
- `disabled?: boolean`
- `clearable?: boolean`
- `triggerOnFocus?: boolean`
- `maxSuggestions?: number`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: string; next: string; source: "input" | "select" | "clear" }>`

Events:
- `update:modelValue(value: string)`
- `change(value: string)`
- `select(option: { label: string; value: string | number; hint?: string; disabled?: boolean })`
- `search(value: string)`
- `blocked(value: string)`
- `open-change(value: boolean)`

Parts:
- `root`, `frame`, `field`, `actions`, `clear`, `toggle`, `panel`, `empty`, `option`, `option-label`, `option-hint`

## `MechaSwitch`

Props:
- `modelValue?: boolean`
- `label?: string`
- `disabled?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: boolean; next: boolean }>`

Events:
- `update:modelValue(value: boolean)`
- `change(value: boolean)`
- `blocked(value: boolean)`

Slots:
- `default`

## `MechaRate`

Props:
- `modelValue?: number`
- `max?: number`
- `allowHalf?: boolean`
- `clearable?: boolean`
- `showScore?: boolean`
- `size?: number | string`
- `label?: string`
- `disabled?: boolean`
- `readonly?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: number; next: number; source: "select" | "keyboard" | "clear" }>`

Events:
- `update:modelValue(value: number)`
- `change(value: number)`
- `hover(value: number)`
- `blocked(value: number)`

Parts:
- `root`, `item`, `glyph`, `icon-base`, `fill`, `icon-fill`, `score`

## `MechaTimePicker`

Props:
- `modelValue?: string | null`
- `placeholder?: string`
- `disabled?: boolean`
- `clearable?: boolean`
- `showSeconds?: boolean`
- `minuteStep?: number`
- `secondStep?: number`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: string | null; next: string | null; source: string }>`

Events:
- `update:modelValue(value: string | null)`
- `change(value: string | null)`
- `blocked(value: string | null)`
- `visible-change(value: boolean)`

Parts:
- `root`, `trigger`, `value`, `icon`, `clear`, `panel`, `field-hour`, `field-minute`, `field-second`, `select-hour`, `select-minute`, `select-second`, `now`, `done`

## `MechaTimeSelect`

Props:
- `modelValue?: string | null`
- `placeholder?: string`
- `disabled?: boolean`
- `clearable?: boolean`
- `start?: string`
- `end?: string`
- `step?: string`
- `minTime?: string | null`
- `maxTime?: string | null`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: string | null; next: string | null; source: string }>`

Events:
- `update:modelValue(value: string | null)`
- `change(value: string | null)`
- `blocked(value: string | null)`
- `open-change(value: boolean)`

Parts:
- `root`, `trigger`, `value`, `arrow`, `clear`, `panel`, `empty`, `option`

## `MechaTransfer`

Props:
- `modelValue?: Array<string | number>`
- `options?: Array<{ key: string | number; label: string; hint?: string; disabled?: boolean }>`
- `titles?: [string, string]`
- `disabled?: boolean`
- `filterable?: boolean`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: Array<string | number>; next: Array<string | number>; moved: Array<string | number>; direction: "to-right" | "to-left" }>`

Events:
- `update:modelValue(value: Array<string | number>)`
- `change(value: Array<string | number>)`
- `blocked(value: Array<string | number>)`

Parts:
- `root`, `panel-source`, `panel-target`, `header-source`, `header-target`, `search-source`, `search-target`, `list-source`, `list-target`, `option-source`, `option-target`, `actions`, `action-right`, `action-left`

## `MechaUpload`

Props:
- `modelValue?: Array<{ id: string; name: string; size: number; type: string; status?: "ready" | "uploaded" | "error" }>`
- `accept?: string`
- `multiple?: boolean`
- `disabled?: boolean`
- `limit?: number`
- `ui?: MechaComponentUi`
- `pipeline?: MechaInteractionPipeline<{ current: MechaUploadFile[]; next: MechaUploadFile[]; action: "add" | "remove" | "clear"; files?: MechaUploadFile[] }>`

Events:
- `update:modelValue(value: MechaUploadFile[])`
- `change(value: MechaUploadFile[])`
- `blocked(value: MechaUploadFile[])`
- `exceed(limit: number)`

Parts:
- `root`, `input`, `toolbar`, `trigger`, `clear`, `list`, `empty`, `item`, `meta`, `name`, `size`, `remove`

## Element Plus Parity Catalog

Source file:
- `src/lib/components/mecha-catalog.ts`

Current parity count:
- `73` component kinds

Category counts:
- `basic`: 7
- `config`: 1
- `form`: 23
- `data`: 21
- `navigation`: 9
- `feedback`: 10
- `other`: 2

Notes:
- `MechaButton`, `MechaAffix`, `MechaBacktop`, `MechaBreadcrumb`, `MechaDropdown`, `MechaIcon`, `MechaLayout`, `MechaLink`, `MechaMenu`, `MechaPageHeader`, `MechaSteps`, `MechaTabs`, `MechaAvatar`, `MechaBadge`, `MechaCalendar`, `MechaCard`, `MechaCarousel`, `MechaCollapse`, `MechaDescriptions`, `MechaEmpty`, `MechaImage`, `MechaInfiniteScroll`, `MechaPagination`, `MechaResult`, `MechaSkeleton`, `MechaTable`, `MechaTimeline`, `MechaTree`, `MechaTreeSelect`, `MechaStatistic`, `MechaSegmented`, `MechaAlert`, `MechaDialog`, `MechaDrawer`, `MechaLoading`, `MechaMessage`, `MechaMessageBox`, `MechaNotification`, `MechaPopconfirm`, `MechaPopover`, `MechaTooltip`, `MechaPanel`, `MechaInput`, `MechaAutocomplete`, `MechaSwitch`, `MechaRate`, `MechaTimePicker`, `MechaTimeSelect`, `MechaTransfer`, `MechaUpload` use handcrafted implementations.
- The remaining parity items are exported as styled shell components with:
  - stable part hooks (`data-mecha-part`)
  - `ui` override support
  - `action` emit for interaction integration
