# Mecha Design Research (2026-02-21)

The visual direction is not generic neon sci-fi.  
Target style: industrial cockpit HUD with hard edges, tactical density, and high-contrast state signaling.

## Visual References

1. ArtStation - Sci-Fi Cockpit UI (Henrik Haupt)  
   https://www.artstation.com/artwork/wJyx6
2. ArtStation - TITANFALL 2 Cockpit Concept (Anton Vill)  
   https://www.artstation.com/artwork/3o3xm
3. ArtStation - UI / UX HUD (Paul Chadeisson)  
   https://www.artstation.com/artwork/v2b1Da
4. Atomhawk portfolio  
   https://www.atomhawk.com/
5. Codrops interaction lab  
   https://tympanus.net/codrops/

## Technical and Accessibility References

1. Vue - Provide / Inject  
   https://vuejs.org/guide/components/provide-inject
2. Vue - Slots  
   https://vuejs.org/guide/components/slots.html
3. Vue - Fallthrough Attributes  
   https://vuejs.org/guide/components/attrs
4. Vite - Library Mode  
   https://vite.dev/guide/build#library-mode
5. Design Tokens Community Group format draft  
   https://www.designtokens.org/TR/drafts/format/
6. WAI-ARIA APG - Switch Pattern  
   https://www.w3.org/WAI/ARIA/apg/patterns/switch/
7. WCAG 2.2 quick reference  
   https://www.w3.org/WAI/WCAG22/quickref/

## Parity Target Source

Element Plus component catalog (for quantity and category mapping):
- https://element-plus.org/en-US/component/overview

Mapped in this repo:
- 76 component kinds across 7 categories (basic/config/form/data/navigation/feedback/other)

## Implemented Design Decisions

1. Typography  
   Display: `Oxanium`, body: `Chakra Petch`.
2. Color  
   Dual-axis palette (hot orange action + cool cyan systems) on deep steel backgrounds.
3. Motion  
   High-impact interactions on key controls (especially button) instead of noisy micro-animation everywhere.
4. Spatial language  
   Angled cuts, chrome borders, scanline overlays, and cockpit panel layering.
5. Extensibility  
   Every component keeps stable part hooks for non-invasive deep overrides.
