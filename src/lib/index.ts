import "./styles/tokens.css";
import "./styles/core.css";
import "./styles/catalog.css";

export { createMechaUI, defaultMechaConfig } from "./plugin";
export { defineMechaPreset } from "./types";

export type {
  MechaComponentConfig,
  MechaComponentUi,
  MechaInteractionContext,
  MechaInteractionPipeline,
  MechaLibraryConfig,
  MechaLibraryUserConfig,
  MechaMotionConfig,
  MechaPartAttrs,
  MechaPartClasses
} from "./types";

export * from "./components";
