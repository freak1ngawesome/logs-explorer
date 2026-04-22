export interface SplitAttributes {
  resource: [string, string][];
  scope: [string, string][];
  log: [string, string][];
}

export function splitAttributes(attributes: Record<string, string>): SplitAttributes {
  const resource: [string, string][] = [];
  const scope: [string, string][] = [];
  const log: [string, string][] = [];

  for (const [key, value] of Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b))) {
    if (key.startsWith("resource.")) resource.push([key.slice("resource.".length), value]);
    else if (key.startsWith("scope.")) scope.push([key.slice("scope.".length), value]);
    else log.push([key, value]);
  }

  return { resource, scope, log };
}
