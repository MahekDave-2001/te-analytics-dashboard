import { formatINR, formatInteger } from "./formatters.js";

export const SECTIONS = [
  ["executive", "Executive Summary", "Performance, mix and reconciliation"],
  ["portal", "Portal Analysis", "Source contribution and completeness"],
  ["function", "Function & Cost Center", "Organizational spend drilldown"],
  ["employee", "Employee & Approver", "Available for Concur, Navan and Etrec"],
  ["travel", "Travel Analytics", "Air, hotel and ground transport"],
  ["meals", "Meals, Allowances & Events", "Meals, daily allowance and event spend"],
  ["exceptions", "Controls & Exceptions", "Potential exceptions and review indicators"],
  ["quality", "Data Quality", "Completeness, mappings and parse status"],
  ["transactions", "Detailed Transactions", "Partitioned source-level records"],
];

export function renderAccordions(container, expanded, onToggle) {
  const fragment = document.createDocumentFragment();
  SECTIONS.forEach(([id, title, subtitle], index) => {
    const section = document.createElement("article"); section.className = "accordion"; section.dataset.section = id;
    const isExpanded = expanded.includes(id);
    const content = id === "executive"
      ? '<div class="section-loading" role="status">Loading Executive Summary…</div>'
      : id === "portal"
        ? '<div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Portal</th><th>Source rows</th><th>Portal total</th><th>Availability note</th></tr></thead><tbody id="portal-totals"><tr><td colspan="4">Loading portal controls…</td></tr></tbody></table></div>'
        : '<div class="section-placeholder">Section framework ready. Analytical visuals are scheduled for the next build stage.</div>';
    section.innerHTML = `<button class="accordion-trigger" type="button" aria-expanded="${isExpanded}" aria-controls="section-${id}"><span class="section-number">${String(index + 1).padStart(2, "0")}</span><span class="accordion-title">${title}<span class="accordion-subtitle">${subtitle}</span></span><span aria-hidden="true">${isExpanded ? "−" : "+"}</span></button><div id="section-${id}" class="accordion-content" ${isExpanded ? "" : "hidden"}>${content}</div>`;
    section.querySelector("button").addEventListener("click", event => onToggle(id, section, event.currentTarget));
    fragment.append(section);
  });
  container.replaceChildren(fragment);
}

export function renderReconciliation(container, summary, unit) {
  const items = [["Consolidated spend", summary.consolidatedTotalINR, "Full calculated portal total", ""], ["Reported / control", summary.reportedControlINR, "Total Summary control value", "accent"], ["Reconciliation delta", summary.reconciliationDeltaINR, "Calculated less reported", "warning"]];
  container.innerHTML = items.map(([label, value, note, style]) => `<article class="metric-card ${style}"><div class="metric-label">${label}</div><div class="metric-value" title="₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 6 })}">${formatINR(value, unit, unit === "raw" ? 0 : 2)}</div><div class="metric-note">${note}</div></article>`).join("");
}

export function renderPortalTotals(container, portals, unit) {
  container.innerHTML = portals.map(item => `<tr><td><strong>${item.portal}</strong></td><td>${formatInteger(item.sourceRows)}</td><td title="₹${Number(item.totalINR).toLocaleString("en-IN", { maximumFractionDigits: 6 })}">${formatINR(item.totalINR, unit, unit === "raw" ? 0 : 3)}</td><td>${item.transactionMetricsAvailable ? "Transaction metrics available" : "Monthly aggregate source; transaction metrics unavailable"}</td></tr>`).join("");
}