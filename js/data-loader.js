const cache = new Map();
const controllers = new Map();

export async function loadJSON(path, { refresh = false } = {}) {
  if (!refresh && cache.has(path)) return cache.get(path);
  controllers.get(path)?.abort();
  const controller = new AbortController();
  controllers.set(path, controller);
  const response = await fetch(path, { signal: controller.signal, cache: "no-cache" });
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
  const data = await response.json();
  cache.set(path, data);
  controllers.delete(path);
  return data;
}

export function clearDataCache() { cache.clear(); }