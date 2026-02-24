# Architecture (Vue 3)

## Goals

- Distinctive mecha visual identity
- Stable deep customization contract
- Human and AI friendly behavior override model
- Vue 3 first, library-mode distribution

## Layered Design

## 1) Token Layer

- Entry: `createMechaUI({ tokens })`
- Storage: CSS variables (`--mecha-*`)
- Scope: color, shadow, motion duration, radius, grid styling
- Runtime-safe for automatic AI patching

## 2) Contract Layer

- `ui.classes`: part-level class override
- `ui.attrs`: part-level attribute injection
- `data-mecha-part`: stable selector anchors
- merge order:
  - component default
  - plugin global config
  - component instance `ui`

## 3) Behavior Layer

- controlled/uncontrolled patterns (`v-model`, optional external state)
- explicit emits (`click`, `toggle`, `change`, `update:*`, `blocked`)
- slot extension points
- interaction pipeline:
  - `before` (allow / block)
  - `after` (audit)
  - `onError` (fail-safe hook)

## 4) Platform Layer

- Vue Provide/Inject plugin config
- composable contract access (`useMechaComponent`)
- Vite library mode output (`es` + `umd` + css)

## Element Plus Parity Strategy

- taxonomy aligned to Element Plus categories and counts
- 73 component kinds represented in `mecha-catalog.ts`
- handcrafted components:
- `MechaButton`, `MechaAffix`, `MechaBacktop`, `MechaBreadcrumb`, `MechaDropdown`, `MechaIcon`, `MechaLayout`, `MechaLink`, `MechaMenu`, `MechaPageHeader`, `MechaSteps`, `MechaTabs`, `MechaAvatar`, `MechaBadge`, `MechaCalendar`, `MechaCard`, `MechaCarousel`, `MechaCollapse`, `MechaDescriptions`, `MechaEmpty`, `MechaImage`, `MechaInfiniteScroll`, `MechaPagination`, `MechaResult`, `MechaSkeleton`, `MechaTable`, `MechaTimeline`, `MechaTree`, `MechaTreeSelect`, `MechaStatistic`, `MechaSegmented`, `MechaAlert`, `MechaDialog`, `MechaDrawer`, `MechaLoading`, `MechaMessage`, `MechaMessageBox`, `MechaNotification`, `MechaPopconfirm`, `MechaPopover`, `MechaTooltip`, `MechaInput`, `MechaAutocomplete`, `MechaSwitch`, `MechaRate`, `MechaTimePicker`, `MechaTimeSelect`, `MechaTransfer`, `MechaUpload`, `MechaPanel`
- parity catalog components:
  - consistent shell implementation
  - same deep override contract
  - event bridge (`action`) for orchestration

## Compatibility Guidance

- preserve existing `data-mecha-part` values (treat as versioned API)
- append parts instead of renaming/removing when evolving components
- keep motion guarded by `prefers-reduced-motion`
- keep semantic attributes (`role`, `aria-*`) for interactive controls
