import { loadJSON } from "./data-loader.js";
import { createFilters, renderFilterChips } from "./filters.js";
import { formatTimestamp } from "./formatters.js";
import { state, saveState, setExpanded, resetFilters } from "./state.js";
import { renderAccordions, renderPortalTotals, renderReconciliation } from "./ui.js";

let summary;
let manifest;
let executiveData;
let executiveModule;

function showError(message) { const banner = document.querySelector("#error-banner"); banner.textContent = message; banner.hidden = false; }
function updateFilters() {
  const chips = document.querySelector("#active-filter-chips");
  renderFilterChips(chips, (key, value) => { state.filters[key] = state.filters[key].filter(item => item !== value); saveState(); updateFilters(); });
  const count = Object.values(state.filters).reduce((total, values) => total + values.length, 0);
  document.querySelector("#filter-summary").textContent = count ? `${count} active selection${count === 1 ? "" : "s"}` : "No active filters";
  renderExecutiveIfReady();
}
function refreshValues() { if (!summary) return; renderReconciliation(document.querySelector("#reconciliation-cards"), summary, state.unit); renderPortalTotals(document.querySelector("#portal-totals"), summary.portalTotals, state.unit); renderExecutiveIfReady(); }
function toggleChartFilter(key, value) {
  const selected = new Set(state.filters[key] || []);
  selected.has(value) ? selected.delete(value) : selected.add(value);
  state.filters[key] = [...selected]; saveState(); updateFilters();
}
function clearExecutiveFilters() {
  ["month", "portal", "expenseGroup", "function", "vendor", "employeeName", "costCenter"].forEach(key => { state.filters[key] = []; });
  saveState(); updateFilters();
}
function renderExecutiveIfReady() {
  const container = document.querySelector("#section-executive");
  if (container && executiveData && executiveModule && !container.hidden) executiveModule.renderExecutiveSummary(container, executiveData, state.unit, state.filters, toggleChartFilter, clearExecutiveFilters);
}
async function loadExecutive() {
  if (!executiveData) {
    [executiveData, executiveModule] = await Promise.all([loadJSON("data/executive-summary.json"), import("./charts/executive-charts.js")]);
  }
  renderExecutiveIfReady();
}
function toggleSection(id, section, trigger) {
  const content = section.querySelector(".accordion-content"); const expanded = content.hidden;
  content.hidden = !expanded; trigger.setAttribute("aria-expanded", String(expanded)); trigger.lastElementChild.textContent = expanded ? "−" : "+"; setExpanded(id, expanded);
  if (expanded) requestAnimationFrame(() => section.dispatchEvent(new CustomEvent("section:opened", { bubbles: true, detail: { id } })));
  if (expanded && id === "executive") loadExecutive().catch(() => { section.querySelector(".accordion-content").innerHTML = '<div class="section-placeholder">Executive Summary data could not be loaded.</div>'; });
}

async function start() {
  document.body.dataset.theme = state.theme;
  document.querySelector("#unit-selector").value = state.unit;
  document.querySelector("#theme-selector").value = state.theme;
  renderAccordions(document.querySelector("#dashboard-sections"), state.expandedSections, toggleSection);
  const panel = document.querySelector("#filter-panel");
  document.querySelector("#filter-toggle").addEventListener("click", event => { panel.hidden = !panel.hidden; event.currentTarget.setAttribute("aria-expanded", String(!panel.hidden)); });
  document.querySelector("#unit-selector").addEventListener("change", event => { state.unit = event.target.value; saveState(); refreshValues(); });
  document.querySelector("#theme-selector").addEventListener("change", event => { state.theme = event.target.value; document.body.dataset.theme = state.theme; saveState(); });
  document.querySelector("#reset-filters").addEventListener("click", () => { resetFilters(); location.reload(); });
  try {
    [manifest, summary] = await Promise.all([loadJSON("data/manifest.json"), loadJSON("data/summary.json")]);
    const dimensions = await loadJSON("data/dimensions.json");
    document.querySelector("#last-refresh").textContent = formatTimestamp(manifest.builtAt);
    document.querySelector("#source-status").textContent = `${manifest.sourceWorkbook} · ready`;
    const status = document.querySelector("#reconciliation-status"); status.textContent = manifest.reconciliationStatus; status.classList.toggle("pass", manifest.reconciliationStatus === "PASS");
    createFilters(document.querySelector("#filter-grid"), dimensions, updateFilters); updateFilters(); refreshValues();
    if (state.expandedSections.includes("executive")) await loadExecutive();
  } catch (error) {
    if (error.name !== "AbortError") showError("Dashboard data could not be loaded. Preview through a local HTTP server and rebuild the data if the issue continues.");
  }
}

start();