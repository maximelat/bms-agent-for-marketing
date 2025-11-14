import { StructuredNeed } from "./structuredNeed";

export const mergeStructuredNeed = (
  current: StructuredNeed,
  update?: Partial<StructuredNeed>,
): StructuredNeed => {
  if (!update) {
    return current;
  }

  const cloned: StructuredNeed = JSON.parse(JSON.stringify(current));

  const assign = (
    destination: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> => {
    Object.entries(source).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (Array.isArray(value)) {
        destination[key] = value;
      } else if (typeof value === "object") {
        const nestedDestination =
          (destination[key] as Record<string, unknown>) ?? {};
        destination[key] = assign(
          { ...nestedDestination },
          value as Record<string, unknown>,
        );
      } else {
        destination[key] = value;
      }
    });
    return destination;
  };

  return assign(
    cloned as Record<string, unknown>,
    update as Record<string, unknown>,
  ) as StructuredNeed;
};

