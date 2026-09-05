# T&E Analytics Dashboard

This is a static HTML/CSS/JavaScript dashboard for the 2025 consolidated travel and expense data. It uses generated JSON and does not require Microsoft Excel, a backend, a database, React, or a framework runtime.

## Source Workbook Protection

`2025 consolidated file matching with the control number.xlsx` is a read-only source. The preprocessing code opens it with `openpyxl.load_workbook(..., read_only=True, data_only=True)`, contains no `workbook.save()` call, and refuses any output path that resolves to the workbook path. All generated files are written under `dashboard/data`.

## Rebuild Data

From the `T&E new` directory, use the workspace virtual environment:

```powershell
& "../.venv/Scripts/python.exe" "preprocessing/build_dashboard_data.py"
```

Install the audit dependency first when setting up a new environment:

```powershell
& "../.venv/Scripts/python.exe" -m pip install -r requirements-audit.txt
```

The build streams each sheet, normalizes portal records independently, writes aggregate JSON, and exits with an error when a portal or consolidated total differs from the accepted audit by more than ₹1.

## Preview Locally

Browser security prevents ES modules from fetching JSON through `file://`. Start a simple local static server:

```powershell
& "../.venv/Scripts/python.exe" -m http.server 8080 --directory dashboard
```

Open `http://localhost:8080/`. The deployed GitHub Pages site does not need an active server.

## GitHub Pages

Upload the **contents** of this `dashboard` folder to the root of a GitHub repository. The included `.github/workflows/deploy-pages.yml` workflow publishes the repository as a GitHub Pages site whenever the `main` branch changes. All application paths are relative, so project-site deployment is supported.

Full browser-based instructions and public URL formats are in `DEPLOYMENT.md`.

> **Public-data warning:** Generated JSON contains business aggregates, dimension values, and employee names. Obtain the required internal approval before publishing it in a public repository.

## Folder Structure

- `index.html`: static application entry point
- `css/`: design system, responsive rules, and print styles
- `js/`: state, filtering, formatting, loading, UI, chart, and table modules
- `data/`: manifest, summary, dimensions, and section aggregate JSON
- `data/transaction-partitions/`: reserved for lazy-loaded detailed records
- `assets/`: approved local static assets
- `../preprocessing/`: read-only workbook preprocessing modules

## Data Refresh Procedure

1. Replace neither the name nor location of the source workbook.
2. Run `audit_workbook.py --output-dir .` if the workbook contents changed.
3. Review `workbook_audit.md` and accept any mapping changes.
4. Run `preprocessing/build_dashboard_data.py`.
5. Confirm the console reports `[OK]` for every portal and `audit reconciliation PASS`.
6. Preview the dashboard and publish the `dashboard` directory.

## Reconciliation

The current build reproduces the accepted controls in crores:

| Portal | Calculated |
|---|---:|
| Concur | 50.785403 |
| Navan | 28.949231 |
| MYF | 30.236775 |
| Etrec | 39.033330 |
| PO Based | 16.912856 |
| Consolidated | 165.917594 |
| Reported/control | 164.900000 |
| Delta | 1.017594 |

Raw values remain INR. The dashboard supports ₹, ₹ Thousand, ₹ Lakh, and ₹ Cr display units.

## Known Source Limitations

- MYF is monthly aggregated data. It is excluded from transaction counts, employee metrics, average claim size, and duplicate analysis.
- Employee data is unavailable for MYF and PO Based.
- Vendor data is unavailable for MYF and Etrec.
- City data is unavailable for MYF and PO Based.
- Auditor comments and approver-change fields exist only in Concur.
- Finance sub-function and CMT are unavailable in MYF and Etrec.
- Negative values are retained: Concur 12, Etrec 29, and PO Based 861 source rows.
- Duplicate flags are defined but no records are deleted. Full duplicate detection and detailed partition output are deferred to the detailed transaction-table stage.

## Troubleshooting

- **Dashboard data could not be loaded:** preview through HTTP rather than opening `index.html` directly.
- **Workbook not found:** confirm the workbook remains beside `audit_workbook.py` with its original name.
- **Reconciliation failure:** rerun the audit, inspect changed mappings or amounts, and do not publish until the cause is resolved.
- **Unavailable portal metric:** this is intentional when the source portal does not contain the required field; the UI must show “Not available for this portal”.