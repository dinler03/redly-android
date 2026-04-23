# Contributing to Redly

Thanks for your interest in Redly. This document explains how to set up the
project locally, what kinds of contributions are accepted, and how to submit
them so they can be reviewed and merged smoothly.

## Code of conduct

Participation in this project is governed by our
[Code of Conduct](./CODE_OF_CONDUCT.md). By contributing, you agree to abide
by its terms.

## Project scope

Redly is intentionally **minimal and read-only**. The following are explicitly
out of scope and will not be merged:

- Anything that requires a Reddit account or OAuth.
- Write actions: voting, posting, commenting, sending messages, moderation.
- Telemetry, analytics, crash reporting, or any user tracking.
- Push notifications.
- In-app purchases, ads, or sponsored content.
- iOS / desktop targets (the project is Android-first by design).

If you are unsure whether a feature fits, open an issue first using the
**Feature request** template and ask. It saves everyone time.

## Getting started

### Prerequisites

| Tool                 | Version       | Notes |
|----------------------|---------------|-------|
| Node.js              | **22 LTS** or newer | Required by Capacitor 8 CLI |
| npm                  | 10 or newer   | Comes with Node |
| JDK                  | **17** (Temurin) | Required by Android Gradle Plugin |
| Android SDK          | Platform **36** | `compileSdk` and `targetSdk` are 36 |
| Android build tools  | 35.x or newer | Auto-installed by Android Studio |

You do **not** need to install Gradle separately — the Gradle wrapper
(`android/gradlew`) is checked in.

### Setup

```bash
git clone https://github.com/dinler03/redly.git
cd redly
npm install
```

If you are working on the Android shell, also create
`android/local.properties` with the path to your SDK:

```
sdk.dir=/absolute/path/to/Android/Sdk
```

This file is gitignored. Android Studio creates it for you on first open.

### Running the dev server

```bash
npm run dev
```

The dev server runs at `http://localhost:8000`. Reddit JSON requests are
proxied through `/reddit-api` so they can carry the `redly/0.1` `User-Agent`
header that Reddit requires.

### Building the web bundle

```bash
npm run build
# = vite build  +  npx cap sync
```

Or, just the Vite build without syncing Android:

```bash
npx vite build
```

### Building the Android APK

```bash
npm run build
cd android
./gradlew assembleDebug
```

The output APK lives at `android/app/build/outputs/apk/debug/app-debug.apk`.

The same commands run in CI on every push and pull request — see
[`.github/workflows/build.yml`](./.github/workflows/build.yml).

## Project layout

A high-level overview lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
The most important entry points are:

- `src/components/App.vue` — root layout
- `src/router/index.js` — routes
- `src/js/redly.js` — Reddit JSON client (`class Redly`)
- `src/js/store.js` — global reactive state
- `src/js/main.js` — app entry + `localStorage` defaults
- `src/assets/redly.css` — Ember Dark color palette

## Coding style

- **Vue:** Composition API with `<script setup>`. One component per file.
- **JS:** Modern ES modules. `async`/`await` over `.then()` chains where it
  improves readability.
- **CSS:** Bootstrap utilities + Material Design 3 classes + Ember Dark palette
  tokens (`--ink-*`, `--ember*`). Prefer CSS variables over hardcoded colors.
- **Naming:** the brand is always **Redly** (capital R). The bundle ID and
  Java package are always `app.redly.client`.
- **Tests:** there is no automated test suite yet. Verify changes manually by
  running both the dev server and the Android debug APK.

## Branching & commits

- Base your branch on `main`. Use a short, descriptive name (e.g.
  `fix/share-old-reddit`, `feat/comment-collapse`).
- Keep commits focused. Avoid drive-by reformatting or unrelated cleanups.
- Write commit messages in the imperative mood:
  - `fix: handle empty Following feed`
  - `feat: add Turkish translation for settings`
  - `chore: bump capacitor to 5.4.1`
- If your change is user-visible, add an entry to the `[Unreleased]` section
  of [`CHANGELOG.md`](./CHANGELOG.md).

## Submitting a pull request

1. Fork the repository and create your feature branch from `main`.
2. Make focused commits with clear messages.
3. Run `npm run build` and `cd android && ./gradlew assembleDebug` locally and
   make sure both succeed.
4. If your change touches the UI, manually test the affected screens
   (home feed, post detail, video playback, settings).
5. Open a pull request against `main`. The
   [PR template](./.github/PULL_REQUEST_TEMPLATE.md) will guide you through
   the checklist.
6. Be patient — Redly is maintained in spare time. Reviews may take a few
   days.

CI will automatically build the web bundle and the Android APK for every PR.
Please make sure the build is green before requesting a review.

## Reporting bugs

Open an issue using the **Bug report** template and include:

- Device manufacturer and model
- Android version
- Redly version (visible in **Settings → About**)
- Clear steps to reproduce
- Expected vs. actual behavior
- A screenshot, screen recording, or `adb logcat` output if available

## Requesting features

Use the **Feature request** template. Please confirm in the form that your
request fits the [project scope](#project-scope).

## License

By contributing to Redly, you agree that your contributions will be licensed
under the [GNU General Public License v3.0 or later](./LICENSE).
