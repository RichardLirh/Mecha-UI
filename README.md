# Mecha UI (Vue 3)

Mecha-styled Vue 3 component library focused on two goals:
- high-impact futuristic visual language
- deep customization for both human developers and AI agents

## Quick Start

```bash
pnpm install
pnpm dev
```

Build demo and library:

```bash
pnpm build
```

## Component Scope

- Handcrafted core components:
  - `MechaButton` (advanced motion + interaction pipeline)
  - `MechaAffix`
  - `MechaBacktop`
  - `MechaBreadcrumb`
  - `MechaDropdown`
  - `MechaIcon`
  - `MechaLayout`
  - `MechaLink`
  - `MechaMenu`
  - `MechaPageHeader`
  - `MechaSteps`
  - `MechaTabs`
  - `MechaAlert`
  - `MechaDialog`
  - `MechaDrawer`
  - `MechaLoading`
  - `MechaMessage`
  - `MechaMessageBox`
  - `MechaNotification`
  - `MechaPopconfirm`
  - `MechaPopover`
  - `MechaTooltip`
  - `MechaAvatar`
  - `MechaBadge`
  - `MechaCalendar`
  - `MechaCard`
  - `MechaCarousel`
  - `MechaCollapse`
  - `MechaDescriptions`
  - `MechaEmpty`
  - `MechaImage`
  - `MechaInfiniteScroll`
  - `MechaPagination`
  - `MechaResult`
  - `MechaSkeleton`
  - `MechaTable`
  - `MechaTimeline`
  - `MechaTree`
  - `MechaTreeSelect`
  - `MechaStatistic`
  - `MechaSegmented`
  - `MechaPanel`
  - `MechaInput`
  - `MechaAutocomplete`
  - `MechaInputNumber`
  - `MechaSwitch`
  - `MechaCheckbox`
  - `MechaRadio`
  - `MechaRate`
  - `MechaSelect`
  - `MechaSlider`
  - `MechaTag`
  - `MechaProgress`
  - `MechaForm`
  - `MechaScrollbar`
  - `MechaCascader`
  - `MechaColorPickerPanel`
  - `MechaColorPicker`
  - `MechaDatePickerPanel`
  - `MechaDatePicker`
  - `MechaDateTimePicker`
  - `MechaTimePicker`
  - `MechaTimeSelect`
  - `MechaTransfer`
  - `MechaUpload`
- Element Plus parity catalog:
  - `73` component kinds mapped into Mecha UI naming and categories
  - exported via `src/lib/components/mecha-catalog.ts`
  - docs route fallback now supports browsing parity pages (for example: `Avatar`, `Badge`, `Calendar`, `Table`, `Tree`, `Dialog`, `Notification`, `Tooltip`, `Statistic`, `MessageBox`)

## Deep Customization Contract

1. `Design Tokens` (CSS variables)  
   Override via `createMechaUI({ tokens })` or runtime style injection.

2. `ui.classes`  
   Part-level class overrides for every component.

3. `ui.attrs`  
   Part-level attribute injection (`data-*`, testing hooks, AI metadata).

4. `data-mecha-part`  
   Stable part anchors for non-invasive style patching.

5. `v-model + emits + slots`  
   Behavior can be controlled externally by state machines and policy layers.

6. `pipeline` (`before` / `after` / `onError`)  
   Intercept and audit interactions without editing component internals.

## Vue Integration

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { createMechaUI } from "./src/lib";

createApp(App)
  .use(
    createMechaUI({
      tokens: {
        "mecha-accent": "#ff8a2a"
      },
      components: {
        MechaButton: {
          classes: { root: "runtime-button-override" }
        }
      }
    })
  )
  .mount("#app");
```

## Project Structure

```txt
src/
  lib/
    components/
    composables/
    styles/
    plugin.ts
    types.ts
  App.vue
docs/
  ARCHITECTURE.md
  COMPONENTS.md
  DESIGN-RESEARCH.md
```
