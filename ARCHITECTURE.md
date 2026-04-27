# Architecture

A high-level overview of how Redly is put together. This document is the entry
point for new contributors who want to understand the codebase before opening a
pull request. It is intentionally short — when something here disagrees with the
code, the code wins, and this file should be updated.

---

## Project summary

Redly is a read-only Reddit client for Android, built on top of Reddit's
public RSS/JSON feeds. It does not require a Reddit account, does not store
credentials, and does not collect telemetry. The application is shipped as a
single-screen Vue 3 web app wrapped in a Capacitor 8 Android shell.

The product goal is **"Reddit, quietly"** — minimal chrome, no notifications,
no ads, no auth flows.

---

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Framework    | Vue 3 (Composition API, `<script setup>`) |
| Build tool   | Vite 8 |
| Mobile shell | Capacitor 8 (Android only) |
| Routing      | Vue Router 5 |
| State        | Vue `reactive()` + `localStorage` (no Pinia / Vuex) |
| HTTP         | `CapacitorHttp.request()` on native, Vite `/reddit-api` proxy on web (v8 plugin API) |
| Styling      | Bootstrap 5 (SCSS) + Material Design 3 classes + Ember Dark palette |
| Markdown     | `marked`, `showdown` |
| Video        | `hls.js` |
| Search       | `fuse.js` |
| Gestures     | `hammerjs` |
| i18n         | Custom reactive `src/js/i18n.js` (English + Turkish) |

### Android target

| Setting        | Value |
|----------------|-------|
| `applicationId` | `app.redly.client` |
| `minSdkVersion` | 24 (Android 7.0 Nougat) |
| `targetSdkVersion` | 36 (Android 16) |
| `compileSdkVersion` | 36 |
| `versionName` / `versionCode` | `0.1.1` / `2` |

These values live in `android/variables.gradle` and `android/app/build.gradle`.

---

## Commands

```bash
npm install          # install dependencies
npm run dev          # start the Vite dev server on http://localhost:8000
npm run build        # vite build + npx cap sync (used by CI)
npm run preview      # preview the production web build

# Web bundle only (no Capacitor sync)
npx vite build

# Android debug APK
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Directory layout

```
.
├── android/                            # Capacitor Android shell
│   ├── app/
│   │   ├── build.gradle                # appId, versionCode, versionName
│   │   └── src/main/
│   │       ├── AndroidManifest.xml     # intent filters for Reddit links
│   │       ├── java/app/redly/client/
│   │       │   ├── MainActivity.java   # bundle id: app.redly.client
│   │       │   └── VideoMuxPlugin.java # native video+audio mux (MediaMuxer)
│   │       └── res/
│   │           ├── mipmap-*/           # launcher icons (Ember Dark)
│   │           ├── drawable-*/         # splash screens
│   │           └── values/strings.xml  # app label = "Redly"
│   └── variables.gradle                # SDK levels, AndroidX versions
│
├── fastlane/                           # F-Droid metadata
├── resources/                          # @capacitor/assets sources
│   ├── icon-only.svg                   # launcher source
│   └── logo.svg                        # brand source
│
├── src/                                # Vite root
│   ├── index.html                      # entry HTML
│   ├── manifest.webmanifest            # PWA manifest
│   │
│   ├── components/                     # Vue components (one per screen)
│   │   ├── App.vue                     # root layout
│   │   ├── Home.vue                    # popular / following feed
│   │   ├── Subreddit.vue               # /r/<name>
│   │   ├── Subreddits.vue              # followed list (manage)
│   │   ├── Search.vue                  # discovery
│   │   ├── Post.vue / FullPost.vue     # post detail + linear comment tree
│   │   ├── CompactPost.vue / CompactComment.vue / CompactSubreddit.vue
│   │   ├── User.vue / UserPosts.vue / UserComments.vue / UserOverview.vue
│   │   ├── Settings.vue                # preferences + about
│   │   ├── SavedPosts.vue              # /saved
│   │   ├── Gallery.vue                 # /gallery
│   │   ├── Preview.vue                 # /preview/:id/:ext (full-screen image)
│   │   ├── ImageViewer.vue
│   │   ├── NavigationBar.vue
│   │   ├── TopAppBar.vue / TopAppBarSubreddit.vue
│   │   └── UpdateManager.vue           # GitHub releases APK auto-update
│   │
│   ├── contents/                       # post body renderers
│   │   ├── FullImage.vue / FullText.vue / FullVideo.vue
│   │   ├── CompactLink.vue / CompactVideo.vue / CompactEmbed.vue
│   │   ├── FullGallery.vue / CompactGallery.vue
│   │   ├── RedgifsVideo.vue            # Redgifs API v2 player (HD URL + audio)
│   │   ├── YouTubeEmbed.vue            # YouTube iframe embed
│   │   ├── PollView.vue
│   │   └── Placeholder.vue
│   │
│   ├── js/
│   │   ├── main.js                     # entry point + localStorage defaults
│   │   ├── redly.js                    # Reddit JSON client (`class Redly`)
│   │   ├── store.js                    # global reactive state
│   │   ├── i18n.js                     # reactive translation layer
│   │   ├── media.js                    # Redgifs API v2 helpers, YouTube ID extraction
│   │   ├── util.js                     # shared helpers (time formatting, permissions)
│   │   └── event.js                    # cross-component event bus
│   │
│   ├── router/
│   │   └── index.js                    # Vue Router routes + scroll persistence
│   │
│   ├── scss/
│   │   └── styles.scss                 # Bootstrap SCSS entry
│   │
│   ├── assets/
│   │   ├── styles.css                  # main custom styles
│   │   ├── md3.css                     # Material Design 3 typography + components
│   │   ├── redly.css                   # Ember Dark palette tokens
│   │   ├── material-icons.css          # local @font-face for Material Icons
│   │   └── nord.css                    # legacy palette (slated for removal)
│   │
│   └── public/
│       ├── images/
│       │   ├── icon.svg                # 256×256 launcher SVG
│       │   └── logo.svg                # 512×512 brand logo
│       └── fonts/                      # local Material Icons font files
│
├── capacitor.config.json               # appId, appName, plugin config
├── vite.config.js                      # /reddit-api dev proxy
└── package.json                        # name: redly
```

---

## State management

Redly does not use Pinia or Vuex. There are two layers:

1. **Reactive in-memory state** — `src/js/store.js` exposes a single
   `reactive({...})` object that screens read from and write to. There is no
   action/mutation pattern; components mutate fields directly.

2. **Persistent preferences** — written straight to `localStorage`.
   `src/js/main.js` initializes any missing keys to their defaults on every
   app launch, so the rest of the code can assume keys always exist.

### `localStorage` keys

| Key                | Type           | Default          | Description |
|--------------------|----------------|------------------|-------------|
| `pages`            | JSON Array     | `[]`             | Navigation history used for scroll restoration |
| `subreddits`       | JSON Array     | `[]`             | Followed subreddits |
| `hidden_posts`     | JSON Array     | `[]`             | Hidden post IDs |
| `saved_posts`      | JSON Array     | `[]`             | Locally saved posts |
| `autoplay`         | JSON Boolean   | `true`           | Autoplay videos in feed |
| `load_media`       | JSON Boolean   | `true`           | Load images / video thumbnails |
| `title_size`       | JSON String    | `"title-medium"` | MD3 typography class |
| `check_for_updates`| JSON Boolean   | `true`           | Check GitHub Releases for new APKs |
| `in_app_browser`   | JSON Boolean   | `true`           | Open external links inside the app |
| `share_old_reddit` | JSON Boolean   | `false`          | Share posts as `old.reddit.com` links |
| `nsfw_filter`      | JSON String    | `"hide"`         | `hide` / `blur` / `show` |
| `language`         | JSON String    | `"en"`           | UI language: `en` or `tr` |
| `theme`            | JSON String    | `"dark"`         | Active theme (only `dark` is implemented) |

---

## Routing

Routes are defined in `src/router/index.js`. Some routes have aliases so that
deep links coming from external apps (Reddit share links) resolve correctly.

| Path                         | Aliases                                                                | Component   | Purpose |
|------------------------------|------------------------------------------------------------------------|-------------|---------|
| `/`                          | —                                                                      | `Home`      | Popular / Following feed |
| `/subreddits`                | —                                                                      | `Subreddits`| Manage followed subreddits |
| `/search`                    | —                                                                      | `Search`    | Discover posts, subreddits, users |
| `/settings`                  | —                                                                      | `Settings`  | Preferences + about screen |
| `/gallery`                   | —                                                                      | `Gallery`   | Locally saved gallery |
| `/saved`                     | —                                                                      | `SavedPosts`| Locally saved posts |
| `/post/:id`                  | `/r/:subreddit?/comments/:id/:title?`, `/comments/:id/:title?`         | `Post`      | Post detail + comments |
| `/r/:id/:sort?`              | —                                                                      | `Subreddit` | Subreddit feed |
| `/u/:id/:page?`              | `/user/:id/:page?`                                                     | `User`      | User profile (posts / comments / overview) |
| `/preview/:id/:ext`          | —                                                                      | `Preview`   | Full-screen image viewer |

The router also persists scroll positions per page in `localStorage["pages"]`
via a `beforeEach` hook so back-navigation feels native.

---

## Reddit client (`src/js/redly.js`)

`class Redly` is a thin wrapper over Reddit's public JSON endpoints. It does
**not** authenticate, register an OAuth app, or hit the official API — it only
reads the same JSON Reddit serves to anonymous browsers.

Key behaviors:

- **User-Agent:** `redly/0.1` (set via headers on every request).
- **Native HTTP path:** On Android, requests go through
  `CapacitorHttp.request()` directly. The WebView's `fetch()` cannot set a
  custom `User-Agent`, and Reddit rejects the default WebView UA.
- **Web HTTP path:** In `npm run dev`, requests go through Vite's
  `/reddit-api` proxy (`vite.config.js`), which adds the `User-Agent` header
  on the server side and forwards to `https://www.reddit.com`.
- **`CapacitorHttp.enabled: false`** in `capacitor.config.json` — this is
  load-bearing. When enabled, the plugin patches global `fetch`/`XHR` and
  base64-encodes binary payloads, which corrupts `hls.js`'s HLS segment stream.
  We use the plugin **explicitly** for Reddit JSON only and leave video alone.
- **10-second timeout** on every fetch (both code paths) so the UI never hangs
  forever when the device is offline. Callers handle the rejection by showing
  the offline error screen.
- **NSFW handling:** API calls always pass `include_over_18: true`, and the
  client tags posts with `over_18`. The UI then hides, blurs, or shows them
  based on the `nsfw_filter` preference.

---

## Styling

Bootstrap 5 SCSS is the foundation. On top of it:

- **Material Design 3 classes** in `src/assets/md3.css` provide typography
  (`headline-small`, `title-large`, `body-large`, `label-large`, …) and
  components.
- **Ember Dark palette** in `src/assets/redly.css` defines all color tokens:
  - **Surfaces:** `--ink-950` → `--ink-50` (11 steps from black to white).
  - **Accents:** `--ember`, `--ember-soft`, `--ember-deep`.
  - **Semantic:** `--redly-success`, `--redly-danger`, `--redly-warning`,
    `--redly-info`.
- **Elevation:** `.el-1` → `.el-5` for shadow tiers.
- **Custom spacing utilities** following Material's `dp` (density-independent
  pixel) naming: `dp-*`, `dpt-*`, `dpb-*`, `dps-*`, `dpe-*`, `dpx-*`, `dpy-*`.
- **Material Icons** are loaded from local `.ttf` / `.otf` files in
  `src/public/fonts/` (see `material-icons.css`). The app does **not** depend
  on Google Fonts CDN, so it works fully offline.

Currently only the Ember Dark theme exists. The settings screen has a theme
toggle stub, but a light theme has not been implemented yet.

---

## Build & release pipeline

Two GitHub Actions workflows live under `.github/workflows/`:

- **`build.yml`** — runs on every push and pull request to `main`. It builds
  the web bundle with Vite, runs `npx cap sync android`, then builds the
  Android debug APK with Gradle and uploads it as a workflow artifact.

- **`release.yml`** — triggered when a `v*` tag is pushed (or via
  `workflow_dispatch`). It builds a debug APK, renames it to
  `Redly_<tag>.apk`, extracts release notes from the matching `CHANGELOG.md`
  section, and creates a GitHub Release with the APK as an asset.

The release naming pattern (`Redly_v0.1.0.apk`) is **load-bearing**:
`src/components/UpdateManager.vue` queries the GitHub Releases API and expects
exactly that filename when downloading updates inside the app.

---

## Coding conventions

- **Vue:** Composition API with `<script setup>`. One component per file.
- **JS:** Modern ES modules, `async`/`await` over `.then()` chains.
- **Event listeners:** Use the `.passive` modifier on scroll / touch handlers
  where it does not break behavior.
- **CSS:** Mix Bootstrap utilities with MD3 + Ember Dark tokens. Prefer CSS
  variables over hardcoded colors.
- **Brand:** Always **Redly** (capital R). Bundle ID and Java package are
  always `app.redly.client`.
- **No tests yet.** Verify changes by running the dev server and the Android
  debug build.

---

## Native Capacitor plugins

Custom plugins live in `android/app/src/main/java/app/redly/client/` and are
registered in `MainActivity.onCreate()` before `super.onCreate()`.

### `VideoMuxPlugin` (`name = "VideoMux"`)

Exposed method: `muxAndSave({ videoUrl, audioUrl, outputPath })`

Downloads `videoUrl` (a video-only MP4) and `audioUrl` (an audio-only MP4),
then combines them with Android's `MediaMuxer` into a single `.mp4` at
`outputPath`. If `audioUrl` is empty (the video has no audio track), the
video-only file is copied to `outputPath` unchanged. `outputPath` may be
either a plain filesystem path or a `file://` URI — the plugin strips the
scheme. All network I/O and muxing run on a background thread; the call
resolves on the UI thread.

Audio URL discovery is done in JavaScript before this method is called.
`FullVideo.vue#findAudioUrl()` fetches `https://v.redd.it/{id}/DASHPlaylist.mpd`,
parses it with the WebView's built-in `DOMParser`, picks the highest-bandwidth
audio `Representation`, and resolves its `<BaseURL>` against the manifest URL.
This mirrors `yt-dlp`'s strategy and avoids the candidate-probing approach,
which silently dropped audio for posts whose audio file used an unexpected
filename (Reddit has used five different audio filenames over the years).

Called by `FullVideo.vue` → `download()` via:
```js
import { registerPlugin } from '@capacitor/core';
const VideoMux = registerPlugin('VideoMux');
await VideoMux.muxAndSave({ videoUrl, audioUrl, outputPath });
```

---

## Known limitations

- **No automated tests.** No unit, integration, or end-to-end test suite
  exists. Refactors must be manually verified in both the browser and the APK.
- **Android only.** There is no iOS Capacitor target. Adding one would require
  setting up Xcode signing and reproducing the launcher / splash assets.
- **Comment depth.** Comment replies are limited by what Reddit's public JSON
  endpoint returns in a single response.
- **NSFW filter is binary-ish.** `hide` / `blur` / `show` are the only modes;
  there is no per-subreddit or keyword filtering.
- **Launcher / splash regeneration.** If `resources/icon-only.svg` is updated,
  Android launcher icons and splash screens must be regenerated with
  `@capacitor/assets generate` or replaced manually under
  `android/app/src/main/res/`.
