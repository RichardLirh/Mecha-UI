import { computed, inject } from "vue";
import { MechaConfigKey, defaultMechaConfig } from "../plugin";
import type { MechaComponentUi } from "../types";

type PartClassMap = Record<string, string | undefined>;
type PartAttrMap = Record<string, Record<string, unknown> | undefined>;

const mergeClasses = (
  base?: PartClassMap,
  middle?: PartClassMap,
  top?: PartClassMap
): PartClassMap => ({
  ...(base ?? {}),
  ...(middle ?? {}),
  ...(top ?? {})
});

const mergeAttrs = (
  base?: PartAttrMap,
  middle?: PartAttrMap,
  top?: PartAttrMap
): PartAttrMap => ({
  ...(base ?? {}),
  ...(middle ?? {}),
  ...(top ?? {})
});

export const useMechaComponent = (
  componentName: string,
  localUi?: MechaComponentUi,
  propUi?: MechaComponentUi
) => {
  const config = inject(MechaConfigKey, defaultMechaConfig);

  const globalUi = computed(() => config.components[componentName] ?? {});

  const classes = computed<PartClassMap>(() =>
    mergeClasses(
      globalUi.value.classes as PartClassMap | undefined,
      localUi?.classes as PartClassMap | undefined,
      propUi?.classes as PartClassMap | undefined
    )
  );

  const attrs = computed<PartAttrMap>(() =>
    mergeAttrs(
      globalUi.value.attrs as PartAttrMap | undefined,
      localUi?.attrs as PartAttrMap | undefined,
      propUi?.attrs as PartAttrMap | undefined
    )
  );

  const partClass = (part: string, baseClass = "", extraClass = "") =>
    [baseClass, classes.value[part] as string | undefined, extraClass]
      .filter(Boolean)
      .join(" ");

  const partAttrs = (
    part: string,
    baseAttrs: Record<string, unknown> = {}
  ): Record<string, unknown> => ({
    "data-mecha-part": part,
    ...(attrs.value[part] ?? {}),
    ...baseAttrs
  });

  return { config, partClass, partAttrs };
};
