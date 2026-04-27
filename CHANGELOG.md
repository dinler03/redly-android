# Changelog

All notable changes to **Redly** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] — 2026-04-27

### Added

- **`VideoMuxPlugin`** — new native Capacitor plugin (`app.redly.client`)
  that combines a Reddit video-only DASH stream with its matching
  audio-only stream on-device using Android's `MediaMuxer`. No third-party
  libraries required. Called automatically by `FullVideo.vue` when the
  user taps the download button.
- **DASH manifest parsing** in `FullVideo.vue` (`findAudioUrl()`) — the
  audio stream URL is now resolved by fetching
  `https://v.redd.it/{id}/DASHPlaylist.mpd` and reading the audio
  `Representation`'s `<BaseURL>`. This mirrors `yt-dlp`'s strategy and is
  the only reliable approach: Reddit has used at least five different
  audio filenames over the years (CMAF_AUDIO_*, DASH_AUDIO_*,
  `DASH_audio.mp4`, `audio.mp4`, even just `audio` with no extension on
  pre-2020 posts).

### Fixed

- **Video downloads now include audio.** Previously the download button
  saved the video-only DASH fallback URL (`DASH_1080.mp4`), which has no
  audio. After fixing several layered bugs, downloads are now muxed `.mp4`
  files containing both tracks:
  - `registerPlugin('VideoMux')` was being called inside an async
    `.then()` callback, so the plugin reference was still `null` when
    `download()` ran. It's now registered synchronously at module init.
  - `Filesystem.getUri()` returns a `file:///...` URI, but `MediaMuxer`
    needs a plain filesystem path. The Java plugin now strips the scheme
    via `Uri.parse().getPath()`.
  - The `MediaMuxer` sample buffer was 1 MB, smaller than 1080p H.264
    keyframes; raised to 4 MB.
  - Audio URL discovery was a hardcoded probe list that missed older
    posts; replaced with a DASH manifest parse (see "Added" above).
- **Redgifs fullscreen distortion fixed.** `RedgifsVideo.vue` previously
  forced `aspect-ratio: 16/9` on every video element, squishing portrait
  and square Redgifs content. The aspect ratio is now computed from
  `videoWidth` / `videoHeight` after `loadedmetadata` fires, and a
  `:fullscreen` CSS rule resets the constraint when the video enters
  native HTML5 fullscreen, so the picture letterboxes / pillarboxes to
  the screen instead of distorting.

## [0.1.1-prev] — 2026-04-23

### Changed

- **Capacitor 5 → 8**: upgraded `@capacitor/android`, `@capacitor/core`,
  `@capacitor/cli` and all first-party Capacitor plugins to v8.
- **Android SDK target raised**: `compileSdkVersion` and `targetSdkVersion`
  bumped from 33 → 36 (required by the new AndroidX libraries).
  `minSdkVersion` raised from 22 → 24 (required by cordova-android 14).
- **Android build toolchain**: Android Gradle Plugin 8.2.0 → 8.13.0;
  Gradle wrapper 8.7 → 8.14.
- **AndroidX library versions** updated to match Capacitor 8 defaults:
  `activity` 1.7.0 → 1.11.0, `appcompat` 1.6.1 → 1.7.1,
  `core` 1.13.1 → 1.17.0, `fragment` 1.5.6 → 1.8.9,
  `webkit` 1.6.1 → 1.14.0, and others.
- **Vue 3.3 → 3.5.33**, **vue-router 4 → 5**, **@vueuse/core 10 → 14**.
- **fuse.js 6 → 7**, **hls.js 1.4 → 1.6**.
- **Vite 4 → 8**, **@vitejs/plugin-vue 4 → 6**, **sass 1.64 → 1.99**,
  **@capacitor/assets 2 → 3**.
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

[Unreleased]: https://github.com/dinler03/redly/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/dinler03/redly/compare/v0.1.0...v0.1.1
[0.1.1-prev]: https://github.com/dinler03/redly/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/dinler03/redly/releases/tag/v0.1.0
