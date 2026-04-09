# Changelog

All notable changes to **Redly** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The "Check for updates" setting is now **off by default** on new
  installs. When users enable it manually, a confirmation dialog explains
  that Redly will reach out to `api.github.com` and that this bypasses
  F-Droid's update mechanism if Redly was installed from F-Droid. Existing
  users keep their previous preference.

### Removed

- Unused Google Services gradle blocks from `android/build.gradle` and
  `android/app/build.gradle` so the F-Droid scanner no longer flags them.

## [0.1.0] — 2026-04-08

Initial Redly release. This version is a fork and rebrand of
[`kaangiray26/geddit-app`](https://github.com/kaangiray26/geddit-app); the
original GPL-3.0 copyright is preserved in [`LICENSE`](./LICENSE) and
[`NOTICE`](./NOTICE).

### Added

- New brand identity: name **Redly**, slogan _"Reddit, quietly."_, and the
  **Ember Dark** color palette (`src/assets/redly.css`).
- Application bundle ID `app.redly.client` and application label `Redly`.
- New launcher SVG (`src/public/images/icon.svg`) and brand logo
  (`src/public/images/logo.svg`).
- Locally bundled Material Icons font (`src/public/fonts/`) so the app works
  fully offline — no Google Fonts CDN dependency.
- A 10-second timeout on every Reddit JSON fetch (`src/js/redly.js`) so the
  UI no longer hangs forever when the device is offline.
- Empty state for the **Following** feed when no subreddits are followed:
  shows a clear hint and an "Explore subreddits" CTA instead of silently
  falling back to the popular feed.
- English and Turkish UI strings for the new empty-state screens.
- `NOTICE` file with full attribution to the upstream Geddit project.
- `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.
- `ARCHITECTURE.md` — high-level overview of the tech stack, directory
  layout, state management, and CSS architecture.
- GitHub Actions workflows for continuous web + Android builds (`build.yml`)
  and tag-driven releases (`release.yml`).
- Issue templates (bug report, feature request) and a pull request template
  under `.github/`.

### Changed

- Java package renamed: `geddit.buzl.uk` → `app.redly.client`.
- All `Geddit` and `kaangiray26` references in code, manifests, and metadata
  replaced with `Redly` and `dinler03`. Attribution to the upstream project
  is preserved in `LICENSE`, `NOTICE`, `CHANGELOG.md`, and `README.md`.
- README rewritten from scratch around the Redly identity, with the fork
  attribution displayed prominently at the top.
- `package.json` `name` and `version` updated to `redly` / `0.1.0`, plus new
  `author`, `repository`, `homepage`, and `bugs` fields.
- `capacitor.config.json` `appId` and `appName` updated.
- Reddit client class renamed from `Geddit` to `Redly`. The HTTP `User-Agent`
  is now `redly/0.1`.

### Removed

- Legacy Geddit launcher icons, splash screens, and brand assets.
- `src/js/geddit.js` (replaced by `src/js/redly.js`).
- `docs/geddit.js`, `docs/geddit.min.js`, and `docs/version.json` (the in-app
  updater now uses the GitHub Releases API directly).
- Old screenshots and store assets pending replacement.
- Legacy build helpers (`deploy.sh`, `vue.config.js`) — replaced by the
  GitHub Actions workflows.

[Unreleased]: https://github.com/dinler03/redly/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dinler03/redly/releases/tag/v0.1.0
