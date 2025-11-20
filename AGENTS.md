# Repository Guidelines

## Project Structure & Module Organization
- Electron entry: `main.js` sets windows (`dashboard.html` + `dashboard.js`, `capture.html`) and starts the Express/WebSocket sync server on port 3000.
- Renderer/web UI: dashboard in `dashboard.*`, popup in `popup.*`, web dashboard in `web-dashboard.*` + `web-api.js` + `web-manifest.json`.
- Assets: icons in `icon.*`, `icons.iconset/`, `extension/icons/`; packaged outputs go to `dist/` (git-ignored). Helper scripts and exports live at repo root (`导出数据到网页端.js`, `info-filter-export-*.json`, `启动应用.sh`).

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm start` — run the Electron app in dev mode (opens dashboard and capture window shortcuts).
- `npm run build` — macOS directory build via `electron-builder` (outputs under `dist/mac-*`).
- `npm run build:dmg` — macOS DMG installer.
- `npm run build:win` — Windows NSIS installer (run on Windows).
- `npm run dist` — default `electron-builder` packaging.

## Coding Style & Naming Conventions
- JavaScript: 2-space indent, semicolons, `const`/`let`. Keep functions small and reuse existing DOM helpers in `dashboard.js`/`popup.js`.
- File names stay lower-case, short, and hyphenated (`web-dashboard.js`, `popup.html`). Keep HTML/CSS/JS co-located per feature.
- Prefer vanilla JS; add dependencies only when necessary and document why in the PR.

## Testing Guidelines
- No automated suite yet; focus on manual checks:
  - `npm start`: confirm global shortcut, capture flow, add/edit/delete, pin, drag-sort.
  - Sync: open `web-dashboard.html` via the local server (port 3000) and ensure CRUD syncs instantly.
  - Packaging: after `npm run build`, smoke-test the app from `dist/`.
- If you add tests, place them next to the feature or under `test/` and add a script to `package.json`.

## Commit & Pull Request Guidelines
- Follow the short, action-led commit style used here (concise verbs, often Chinese: `更新 index.html`, `修复导入按钮显示问题`). One logical change per commit; never commit `dist/`, `build/`, or `node_modules/`.
- PR checklist: summary, verification steps (`npm start`, build command), screenshots/GIFs for UI (dashboard/capture/popup/web), and notes if Electron Store keys change or migrations are needed. Mention platforms tested (macOS/Windows).

## Security & Configuration Notes
- The local server binds `0.0.0.0:3000`; disable or restrict if working on untrusted networks.
- User data lives in Electron Store (`~/Library/Application Support/info-filter-desktop/` on macOS, `%APPDATA%/info-filter-desktop/` on Windows); handle key changes with migrations and communicate backup steps when altering schemas.
