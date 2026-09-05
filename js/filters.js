import { state, saveState } from "./state.js";

const FILTERS = [
  ["dateRange", "Date range"], ["quarter", "Quarter"], ["month", "Month"], ["portal", "Portal"],
  ["function", "Function"], ["financeSubFunction", "Finance Sub Function"], ["cmt", "CMT"], ["costCenter", "Cost Center"],
  ["employeeName", "Employee"], ["workLevel", "Work Level"], ["approverName", "Approver"], ["expenseGroup", "Expense Group"],
  ["expenseCategory", "Expense Category"], ["vendor", "Vendor"], ["normalizedCity", "City"], ["country", "Country"],
  ["domesticForeign", "Domestic/Foreign"], ["paymentText", "Payment Method"], ["reimbursableStatus", "Reimbursable Status"], ["exceptionCategory", "Exception Category"],
];

const STATIC_OPTIONS = {
  dateRange: ["2025-01-01 to 2025-12-31"],
  quarter: ["Q1", "Q2", "Q3", "Q4"],
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  portal: ["Concur", "Navan", "MYF", "Etrec", "PO Based"],
  reimbursableStatus: ["Available for Concur only", "Not available for this portal"],
  exceptionCategory: ["Potential Duplicate", "Missing Receipt", "Receipt Date Mismatch", "Receipt Amount Mismatch", "Incorrect Expense Category", "Alcohol Flag", "Potential Personal Expense", "Tax Invoice Issue", "Threshold Exception", "Approver Change", "Rejected or Resubmitted", "Other Review Comment"],
};

export function createFilters(container, dimensions, onChange) {
  const fragment = document.createDocumentFragment();
  for (const [key, label] of FILTERS) {
    const options = Object.freeze([...(STATIC_OPTIONS[key] || dimensions[key] || [])]);
    const control = document.createElement("div");
    control.className = "filter-control";
    control.dataset.filter = key;
    control.innerHTML = `<button class="filter-open" type="button" aria-expanded="false"><span>${label}</span><span class="selected-count">${(state.filters[key] || []).length}</span></button><div class="filter-menu" hidden><input class="filter-search" type="search" placeholder="Search ${label}" aria-label="Search ${label}"><div class="filter-list"></div><div class="filter-actions"><button data-action="all">Select All</button><button data-action="clear">Clear All</button><button data-action="invert">Invert</button><button data-action="cancel">Cancel</button><button class="apply" data-action="apply">Apply</button></div></div>`;
    const menu = control.querySelector(".filter-menu");
    const list = control.querySelector(".filter-list");
    let draft = new Set(state.filters[key] || []);
    let committed = new Set(draft);

    const renderOptions = (query = "") => {
      const scrollTop = list.scrollTop;
      const visible = options.filter(option => String(option).toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0, 1000);
      const optionFragment = document.createDocumentFragment();
      visible.forEach(option => {
        const row = document.createElement("label");
        row.className = "filter-option";
        row.dataset.key = String(option);
        const input = document.createElement("input");
        input.type = "checkbox"; input.checked = draft.has(String(option)); input.value = String(option);
        row.append(input, document.createTextNode(String(option)));
        optionFragment.append(row);
      });
      list.replaceChildren(optionFragment);
      list.scrollTop = scrollTop;
    };
    renderOptions();
    control.querySelector(".filter-open").addEventListener("click", event => {
      const opening = menu.hidden;
      document.querySelectorAll(".filter-menu:not([hidden])").forEach(item => { item.hidden = true; });
      menu.hidden = !opening; event.currentTarget.setAttribute("aria-expanded", String(opening));
    });
    let debounce;
    control.querySelector(".filter-search").addEventListener("input", event => { clearTimeout(debounce); debounce = setTimeout(() => renderOptions(event.target.value), 160); });
    list.addEventListener("change", event => {
      const scrollTop = list.scrollTop;
      event.target.checked ? draft.add(event.target.value) : draft.delete(event.target.value);
      list.scrollTop = scrollTop;
    });
    control.querySelector(".filter-actions").addEventListener("click", event => {
      const action = event.target.dataset.action; if (!action) return;
      if (action === "all") draft = new Set(options.map(String));
      if (action === "clear") draft.clear();
      if (action === "invert") draft = new Set(options.map(String).filter(value => !draft.has(value)));
      if (action === "cancel") { draft = new Set(committed); menu.hidden = true; }
      if (action === "apply") { committed = new Set(draft); state.filters[key] = [...committed]; saveState(); menu.hidden = true; onChange(); }
      if (["all", "clear", "invert"].includes(action)) renderOptions(control.querySelector(".filter-search").value);
      control.querySelector(".selected-count").textContent = draft.size;
    });
    fragment.append(control);
  }
  container.replaceChildren(fragment);
}

export function renderFilterChips(container, onRemove) {
  const fragment = document.createDocumentFragment();
  Object.entries(state.filters).forEach(([key, values]) => values.forEach(value => {
    const button = document.createElement("button");
    button.className = "chip"; button.type = "button"; button.textContent = `${key}: ${value} ×`;
    button.addEventListener("click", () => onRemove(key, value)); fragment.append(button);
  }));
  container.replaceChildren(fragment);
}