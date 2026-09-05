# GitHub Pages Deployment

## Upload Folder

Upload the **contents** of the local `T&E new/dashboard` folder to the root of a GitHub repository.

The repository root must contain `index.html`, `css`, `js`, `data`, `assets`, `.nojekyll`, and `.github`. Do not upload the enclosing `dashboard` folder as a single nested folder, and do not upload the Excel workbook.

## Deployment Checklist

- [ ] Upload the contents of `T&E new/dashboard`, not the enclosing folder.
- [ ] Confirm `index.html` is at the repository root.
- [ ] Confirm `.github/workflows/deploy-pages.yml` is present.
- [ ] Confirm `.nojekyll` is present.
- [ ] Confirm `css`, `js`, `data`, and `assets` are present.
- [ ] Confirm the Excel workbook is not in the repository or upload package.
- [ ] Confirm generated `manifest.json` reports `reconciliationStatus: PASS`.
- [ ] Confirm the site is served through HTTP(S), not opened with `file://`.
- [ ] Confirm the browser can load `data/manifest.json`, `data/summary.json`, and `data/dimensions.json`.
- [ ] Confirm GitHub Pages is configured with **GitHub Actions** as the source.
- [ ] Confirm the Pages workflow finishes with a green check.
- [ ] Review public-data approval for business aggregates, dimensions, and employee names.

## Before Publishing

GitHub Pages is public for a public repository. The generated JSON currently contains business aggregates, dimension values, and employee names. Obtain the required internal approval before publishing this repository publicly.

## Browser Deployment Steps

1. Sign in at `https://github.com`.
2. Select **New repository**.
3. Enter a repository name, for example `te-analytics-dashboard`.
4. Choose **Public**. Do not initialize the repository with another README, license, or `.gitignore.
5. Select **Create repository**.
6. On the empty repository page, select **uploading an existing file**.
7. Open the local `T&E new/dashboard` folder and upload its contents to the repository root. Hidden folders may not be selectable through some file dialogs; verify that `.github/workflows/deploy-pages.yml` is included.
8. Commit the upload directly to the `main` branch.
9. Open **Settings > Pages** in the repository.
10. Under **Build and deployment**, set **Source** to **GitHub Actions**.
11. Open the **Actions** tab and select **Deploy dashboard to GitHub Pages**.
12. If it did not start automatically, select **Run workflow**, choose `main`, and run it.
13. Wait for the workflow to show a green check. Its deployment summary contains the public URL.

## Public URL

For GitHub account `YOUR-USERNAME` and repository `te-analytics-dashboard`, the URL will be:

`https://YOUR-USERNAME.github.io/te-analytics-dashboard/`

If the repository is named exactly `YOUR-USERNAME.github.io`, the URL will instead be:

`https://YOUR-USERNAME.github.io/`

Repository names are case-sensitive in links. Use the exact lowercase name shown by GitHub.

## Updating the Site

Regenerate data locally, then replace the changed files under `data` in the GitHub repository. Every commit to `main` automatically runs the Pages workflow and updates the public site.