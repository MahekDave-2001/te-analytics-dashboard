import { formatINR, formatInteger, UNITS } from "../formatters.js";

const chartInstances = new Map();
const FILTER_DIMENSIONS = ["month", "portal", "expenseGroup", "function"];
const TRAVEL_GROUPS = new Set(["Air Travel", "Hotel & Accommodation", "Cab & Local Transport", "Rail & Other Transport"]);
const PALETTE = ["#075ca8", "#007f7a", "#1683c5", "#4b799d", "#d8861b", "#5b6b7f", "#299b91", "#9a5f2f"];

function selectedRows(items, filters) {
  return items.filter(row => FILTER_DIMENSIONS.every(key => {
    const selected = filters[key] || [];
    return !selected.length || selected.includes(displayName(row[key]));
  }));
}

function displayName(value) {
  const label = String(value || "").trim();
  return label.toLocaleLowerCase() === "not available" ? "Unmapped" : label;
}

function aggregate(rows, dimension) {
  const values = new Map();
  rows.forEach(row => {
    const name = displayName(row[dimension]);
    values.set(name, (values.get(name) || 0) + Number(row.amount));
  });
  return [...values].map(([name, amount]) => ({ name, amount }));
}

function topWithOther(values, limit = 12) {
  const sorted = [...values].sort((left, right) => right.amount - left.amount);
  if (sorted.length <= limit) return sorted;
  const head = sorted.slice(0, limit);
  head.push({ name: "Other", amount: sorted.slice(limit).reduce((total, item) => total + item.amount, 0), filterable: false });
  return head.sort((left, right) => right.amount - left.amount);
}

function tooltipFormatter(params, total, unit) {
  const item = Array.isArray(params) ? params[0] : params;
  const amount = Number(item.data?.amount ?? item.value ?? 0);
  const percentage = total ? (amount / total) * 100 : 0;
  return `<strong>${item.name}</strong><br>${formatINR(amount, unit, 3)}<br><span style="color:#627087">Full value: ₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 6 })}<br>${percentage.toFixed(2)}% of selected spend</span>`;
}

function axisAmount(value, unit) {
  const config = UNITS[unit] || UNITS.crores;
  return `${(Number(value) / config.divisor).toLocaleString("en-IN", { maximumFractionDigits: 1 })}${config.suffix}`;
}

function baseOption(total, unit) {
  return {
    animationDuration: 450,
    color: PALETTE,
    textStyle: { fontFamily: "DM Sans, sans-serif", color: "#14243a" },
    tooltip: { trigger: "item", confine: true, backgroundColor: "#fff", borderColor: "#d9e1ea", textStyle: { color: "#14243a" }, formatter: params => tooltipFormatter(params, total, unit) },
    grid: { left: 58, right: 20, top: 24, bottom: 52, containLabel: false },
    aria: { enabled: true },
  };
}

function chartOption(kind, values, total, unit, selected) {
  const base = baseOption(total, unit);
  if (kind === "mix") {
    return {
      ...base,
      legend: { type: "scroll", orient: "vertical", right: 8, top: 18, bottom: 18, textStyle: { fontSize: 10 } },
      series: [{ type: "pie", radius: ["44%", "70%"], center: ["35%", "52%"], avoidLabelOverlap: true, label: { show: false }, emphasis: { label: { show: true, formatter: "{d}%", fontWeight: 700 } }, data: values.map(item => ({ value: item.amount, amount: item.amount, name: item.name, itemStyle: selected.includes(String(item.name)) ? { borderColor: "#d8861b", borderWidth: 3 } : undefined })) }],
    };
  }
  if (kind === "monthly") {
    const sorted = [...values].sort((left, right) => String(left.name).localeCompare(String(right.name)));
    return { ...base, xAxis: { type: "category", data: sorted.map(item => item.name.slice(5)), axisLabel: { formatter: value => new Date(2025, Number(value) - 1, 1).toLocaleString("en", { month: "short" }) } }, yAxis: { type: "value", axisLabel: { formatter: value => axisAmount(value, unit) }, splitLine: { lineStyle: { color: "#e8edf2" } } }, series: [{ type: "line", smooth: .22, symbolSize: 7, areaStyle: { color: "rgba(22,131,197,.10)" }, data: sorted.map(item => ({ value: item.amount, amount: item.amount, name: item.name, itemStyle: selected.includes(item.name) ? { color: "#d8861b" } : undefined })) }] };
  }
  const horizontal = ["function", "category", "vendor", "employee", "costCenter"].includes(kind);
  const data = values.map(item => ({ value: item.amount, amount: item.amount, name: item.name, itemStyle: selected.includes(String(item.name)) ? { color: "#d8861b" } : undefined, filterable: item.filterable !== false }));
  return {
    ...base,
    grid: horizontal ? { left: 130, right: 25, top: 16, bottom: 36 } : base.grid,
    xAxis: horizontal ? { type: "value", axisLabel: { formatter: value => axisAmount(value, unit) }, splitLine: { lineStyle: { color: "#e8edf2" } } } : { type: "category", data: values.map(item => item.name), axisLabel: { interval: 0, width: 88, overflow: "truncate" } },
    yAxis: horizontal ? { type: "category", inverse: true, data: values.map(item => item.name), axisLabel: { width: 112, overflow: "truncate" } } : { type: "value", axisLabel: { formatter: value => axisAmount(value, unit) }, splitLine: { lineStyle: { color: "#e8edf2" } } },
    series: [{ type: "bar", barMaxWidth: 42, data, itemStyle: { borderRadius: horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0] } }],
  };
}

function ensureChart(element, kind, values, total, unit, selected, onSelect, dimension) {
  const existing = chartInstances.get(element.id);
  if (existing && existing.element !== element) {
    existing.observer.disconnect();
    existing.chart.dispose();
    chartInstances.delete(element.id);
  }
  let chart = chartInstances.get(element.id)?.chart;
  if (!chart) {
    chart = globalThis.echarts.init(element);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(element);
    chartInstances.set(element.id, { element, chart, observer });
    chart.on("click", params => {
      if (params.data?.filterable === false) return;
      onSelect(dimension, String(params.data?.name || params.name));
    });
  }
  chart.setOption(chartOption(kind, values, total, unit, selected), true);
  chart.resize();
}

function exportChart(id, title) {
  const chart = chartInstances.get(id)?.chart;
  if (!chart) return;
  const link = document.createElement("a");
  link.download = `${title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  link.href = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#ffffff" });
  document.body.append(link);
  link.click();
  link.remove();
}

function metricCard(label, value, note, className = "") {
  return `<article class="executive-kpi ${className}"><div class="metric-label">${label}</div><div class="executive-kpi-value">${value}</div><div class="metric-note">${note}</div></article>`;
}

export function renderExecutiveSummary(container, data, unit, filters, onSelect, onClear) {
  const rows = selectedRows(data.items, filters);
  const vendorRows = selectedRows(data.vendorItems || [], filters).filter(row => !(filters.vendor || []).length || filters.vendor.includes(row.vendor));
  const employeeRows = selectedRows(data.employeeItems || [], filters).filter(row => !(filters.employeeName || []).length || filters.employeeName.includes(row.employeeName));
    const costCenterRows = selectedRows(data.costCenterItems || [], filters).filter(row => !(filters.costCenter || []).length || filters.costCenter.includes(row.costCenter));
  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
  const transactions = rows.reduce((sum, row) => sum + Number(row.transactionCount), 0);
  const domestic = rows.filter(row => row.domesticForeign === "Domestic").reduce((sum, row) => sum + Number(row.amount), 0);
  const foreign = rows.filter(row => row.domesticForeign === "Foreign").reduce((sum, row) => sum + Number(row.amount), 0);
  const travelSpend = rows.filter(row => TRAVEL_GROUPS.has(row.expenseGroup)).reduce((sum, row) => sum + Number(row.amount), 0);
  const travelSpendPercentage = total ? (travelSpend / total) * 100 : 0;
  const unmappedSpend = rows.filter(row => row.expenseGroup === "Unmapped").reduce((sum, row) => sum + Number(row.amount), 0);
  const unmappedPercentage = total ? (unmappedSpend / total) * 100 : 0;
  const employees = new Set(rows.flatMap(row => row.employees));
  const hasFilters = [...FILTER_DIMENSIONS, "vendor", "employeeName", "costCenter"].some(key => (filters[key] || []).length);

  container.innerHTML = `<div class="executive-toolbar"><div><h3>Executive performance</h3><p>Charts reconcile to ${formatINR(total, unit, 3)}</p></div><div class="quality-indicator"><span class="warning-badge">Unmapped</span><strong>${unmappedPercentage.toFixed(1)}%</strong><span>${formatINR(unmappedSpend, unit, 2)} of selected spend</span></div><button id="clear-executive-filters" class="button button-outline" type="button" ${hasFilters ? "" : "disabled"}>Clear chart selection</button></div><div class="executive-kpi-grid">${metricCard("Total T&E Spend", formatINR(total, unit, 2), "Selected portfolio spend", "primary")}${metricCard("Travel Spend %", `${travelSpendPercentage.toFixed(1)}%`, `${formatINR(travelSpend, unit, 2)} across core travel groups`, "accent")}${metricCard("Domestic Spend", formatINR(domestic, unit, 2), "Available in Concur and Navan")}${metricCard("Foreign Spend", formatINR(foreign, unit, 2), "Foreign and international bookings")}${metricCard("Total Employees", formatInteger(employees.size), "Concur, Navan and Etrec")}${metricCard("Cost Centers", formatInteger(new Set(rows.flatMap(row => row.costCenters)).size), "Distinct mapped cost centers")}${metricCard("Transactions", formatInteger(transactions), "MYF monthly aggregates excluded")}${metricCard("Reconciliation Delta", formatINR(data.reconciliationDeltaINR, unit, 2), "Full portfolio delta", "warning")}</div><div class="executive-chart-grid">${[["monthly", "Monthly Spend Trend", "Spend movement through 2025", "wide"], ["portal", "Spend by Portal", "Contribution from each source", ""], ["function", "Spend by Function", "Top functions by contribution", ""], ["category-mix", "Expense Category Mix", "Contribution to selected spend", ""], ["category", "Top Expense Categories", "Management expense groups", ""], ["vendor", "Top 10 Vendors", "Available vendor spend", ""], ["employee", "Top 10 Employees", "Factual spend view", ""], ["cost-center", "Top 10 Cost Centers", "Highest spend cost centers", "wide"]].map(([id, title, subtitle, size]) => `<article class="chart-card ${size === "wide" ? "chart-card-wide" : ""}"><header><div><h3>${title}</h3><p>${subtitle}</p></div><button class="chart-export" type="button" data-chart="executive-${id}" data-title="${title}" title="Export ${title} as PNG" aria-label="Export ${title} as PNG">↓</button></header><div id="executive-${id}" class="chart-canvas" role="img" aria-label="${title}"></div></article>`).join("")}</div>${rows.length ? "" : '<div class="section-placeholder">No Executive Summary data matches the selected chart filters.</div>'}`;
  container.querySelector("#clear-executive-filters").addEventListener("click", onClear);
  container.querySelectorAll(".chart-export").forEach(button => button.addEventListener("click", () => exportChart(button.dataset.chart, button.dataset.title)));
  if (!rows.length) return;
  requestAnimationFrame(() => {
    ensureChart(container.querySelector("#executive-monthly"), "monthly", aggregate(rows, "month"), total, unit, filters.month || [], onSelect, "month");
    ensureChart(container.querySelector("#executive-portal"), "portal", aggregate(rows, "portal").sort((a, b) => b.amount - a.amount), total, unit, filters.portal || [], onSelect, "portal");
    ensureChart(container.querySelector("#executive-category"), "category", aggregate(rows, "expenseGroup").sort((a, b) => b.amount - a.amount), total, unit, filters.expenseGroup || [], onSelect, "expenseGroup");
    ensureChart(container.querySelector("#executive-category-mix"), "mix", aggregate(rows, "expenseGroup").sort((a, b) => b.amount - a.amount), total, unit, filters.expenseGroup || [], onSelect, "expenseGroup");
    ensureChart(container.querySelector("#executive-function"), "function", topWithOther(aggregate(rows, "function")), total, unit, filters.function || [], onSelect, "function");
    ensureChart(container.querySelector("#executive-vendor"), "vendor", aggregate(vendorRows, "vendor").sort((a, b) => b.amount - a.amount), total, unit, filters.vendor || [], onSelect, "vendor");
    ensureChart(container.querySelector("#executive-employee"), "employee", aggregate(employeeRows, "employeeName").sort((a, b) => b.amount - a.amount), total, unit, filters.employeeName || [], onSelect, "employeeName");
    ensureChart(container.querySelector("#executive-cost-center"), "costCenter", aggregate(costCenterRows, "costCenter").sort((a, b) => b.amount - a.amount), total, unit, filters.costCenter || [], onSelect, "costCenter");
  });
}

export function resizeExecutiveCharts() { chartInstances.forEach(({ chart }) => chart.resize()); }