export type MechaPartClasses = Record<string, string | undefined>;
export type MechaPartAttrs = Record<
  string,
  Record<string, string | number | boolean | undefined> | undefined
>;

export interface MechaComponentUi {
  classes?: MechaPartClasses;
  attrs?: MechaPartAttrs;
}

export interface MechaComponentConfig extends MechaComponentUi {
  defaultProps?: Record<string, unknown>;
}

export interface MechaMotionConfig {
  durationFast: number;
  durationBase: number;
  durationSlow: number;
}

export interface MechaInteractionContext<TPayload = unknown> {
  component: string;
  action: string;
  payload?: TPayload;
}

export interface MechaInteractionPipeline<TPayload = unknown> {
  before?: (
    context: MechaInteractionContext<TPayload>
  ) => boolean | Promise<boolean>;
  after?: (
    context: MechaInteractionContext<TPayload>
  ) => void | Promise<void>;
  onError?: (
    context: MechaInteractionContext<TPayload>,
    error: unknown
  ) => void;
}

export interface MechaLibraryConfig {
  prefix: string;
  tokens: Record<string, string>;
  components: Record<string, MechaComponentConfig>;
  motion: MechaMotionConfig;
}

export type MechaLibraryUserConfig = Partial<{
  [K in keyof MechaLibraryConfig]: MechaLibraryConfig[K] extends Record<string, unknown>
    ? Partial<MechaLibraryConfig[K]>
    : MechaLibraryConfig[K];
}>;

export const defineMechaPreset = <T extends MechaLibraryUserConfig>(preset: T) =>
  preset;
