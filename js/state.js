const STORAGE_KEY = "te-dashboard-state-v1";
const defaults = { unit: "crores", theme: "light", expandedSections: ["executive"], filters: {} };

function restore() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return { ...defaults }; }
}

export const state = restore();
export function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
export function setExpanded(id, expanded) {
  const values = new Set(state.expandedSections);
  expanded ? values.add(id) : values.delete(id);
  state.expandedSections = [...values];
  saveState();
}
export function resetFilters() { state.filters = {}; saveState(); }