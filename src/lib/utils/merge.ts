const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const mergeDeep = <T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T => {
  const output: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    if (overrideValue === undefined) {
      continue;
    }

    const baseValue = output[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      output[key] = mergeDeep(baseValue, overrideValue);
      continue;
    }

    output[key] = overrideValue;
  }

  return output as T;
};
