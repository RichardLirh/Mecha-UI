import type { App, InjectionKey, Plugin } from "vue";
import { reactive } from "vue";
import { mergeDeep } from "./utils/merge";
import type { MechaLibraryConfig, MechaLibraryUserConfig } from "./types";

export const defaultMechaConfig: MechaLibraryConfig = {
  prefix: "m",
  tokens: {},
  components: {},
  motion: {
    durationFast: 120,
    durationBase: 260,
    durationSlow: 520
  }
};

export const MechaConfigKey: InjectionKey<MechaLibraryConfig> =
  Symbol("MechaConfig");

const cloneConfig = (config: MechaLibraryConfig): MechaLibraryConfig =>
  ({
    ...config,
    tokens: { ...config.tokens },
    components: { ...config.components },
    motion: { ...config.motion }
  }) as MechaLibraryConfig;

const applyTokens = (tokens: Record<string, string>) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  for (const [token, value] of Object.entries(tokens)) {
    root.style.setProperty(`--${token}`, value);
  }
};

export const createMechaUI = (
  userConfig: MechaLibraryUserConfig = {}
): Plugin => {
  const resolved = mergeDeep(cloneConfig(defaultMechaConfig), userConfig);

  return {
    install(app: App) {
      const state = reactive(resolved) as MechaLibraryConfig;
      app.provide(MechaConfigKey, state);
      applyTokens(state.tokens);
    }
  };
};
