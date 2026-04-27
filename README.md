<div align="center">
  <img src="src/public/images/icon.svg" alt="Redly" width="96" height="96">
  <h1>Redly</h1>
  <p><em>Reddit, quietly.</em></p>
  <p>A fast, minimal, read-only Reddit client for Android.</p>
  <p>
    <a href="https://github.com/dinler03/redly/releases/latest"><img src="https://img.shields.io/github/v/release/dinler03/redly?color=ef6c1a&label=release" alt="Latest release"></a>
    <a href="https://github.com/dinler03/redly/actions/workflows/build.yml"><img src="https://github.com/dinler03/redly/actions/workflows/build.yml/badge.svg" alt="Build status"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0--or--later-blue.svg" alt="License: GPL-3.0-or-later"></a>
    <img src="https://img.shields.io/badge/platform-Android%207.0%2B-3ddc84?logo=android&logoColor=white" alt="Platform: Android 7.0+">
    <img src="https://img.shields.io/badge/built%20with-Vue%203%20%2B%20Capacitor-42b883?logo=vue.js&logoColor=white" alt="Built with Vue 3 and Capacitor">
  </p>
</div>

> **Redly is a fork and rebrand of [kaangiray26/geddit-app](https://github.com/kaangiray26/geddit-app),**
> originally licensed under GPL-3.0. The original copyright is preserved in
> [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE). All significant changes are
> tracked in [`CHANGELOG.md`](./CHANGELOG.md).

---

## About

Redly is a lightweight Reddit reader built around a single idea: **less noise,
more content.** No accounts. No notifications. No ads. No telemetry. Just a
clean reading experience.

It uses Reddit's public JSON feeds instead of the official API, so it does not
require a Reddit account or API key, and it is not subject to OAuth rate limits.

Redly is built with **Vue 3**, **Vite**, and **Capacitor 8**, and is currently
distributed as an Android application.

## Screenshots

| Home | Post | Subreddit | Settings |
|:---:|:---:|:---:|:---:|
| ![Home — popular feed](docs/screenshots/01-home.png) | ![Post detail with comments](docs/screenshots/02-post.png) | ![Subreddit view](docs/screenshots/03-subreddit.png) | ![Profile and settings](docs/screenshots/04-settings.png) |

## Features

- Browse posts, comments, subreddits, and users
- View images, GIFs, galleries, and HLS videos
- Redgifs video playback (Redgifs API v2, HD stream with audio)
- YouTube embed playback inside the app
- Follow your favorite communities locally — no account required
- **Download videos with audio** — Reddit videos are downloaded as a single
  muxed `.mp4` (video + audio combined on-device via Android `MediaMuxer`).
  The audio stream URL is resolved by parsing Reddit's DASH manifest, the
  same approach `yt-dlp` uses, so audio is found reliably across every
  video age and codec variant Reddit has shipped.
- Save images to device storage
- Linear comment trees with collapse / expand
- Share posts as standard or `old.reddit.com` links
- Search posts, subreddits, and users
- Open Reddit links from other apps directly inside Redly
- Material Design 3 dark theme — the **Ember Dark** palette
- Fully offline-capable Material Icons font (no Google Fonts CDN)
- English and Turkish UI
- Fully local: no telemetry, no tracking, no analytics
- Automatic in-app update check via GitHub Releases (optional, can be disabled)

## Requirements

- **Android 7.0 (API 24)** or newer
- ~10 MB of free storage
- An internet connection (the app does not cache feeds offline)

## Installation

### From GitHub Releases

1. Open the [latest release](https://github.com/dinler03/redly/releases/latest).
2. Download the `Redly_v*.apk` asset.
3. On your Android device, allow installation from unknown sources for your
   browser or file manager.
4. Install the APK.

The app will then check for new releases on its own (you can disable this in
**Settings → Check for updates**).

### Building from source

See [Development](#development) below, or read [`CONTRIBUTING.md`](./CONTRIBUTING.md)
for the full setup.

### F-Droid

F-Droid metadata is already prepared under [`fastlane/`](./fastlane). A
submission to the F-Droid catalog is on the roadmap but has not happened yet.

## Development

```bash
# Install dependencies
npm install

# Run the dev server (http://localhost:8000)
npm run dev

# Production web build + Capacitor sync
npm run build

# Build the Android debug APK
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

The Vue app lives under `src/`, which is also Vite's root. The dev server
proxies Reddit JSON calls through `/reddit-api` so they can carry a custom
`User-Agent` header.

On Android, requests go through `CapacitorHttp.request()` directly to bypass
the WebView's header restrictions. The global `CapacitorHttp` fetch/XHR patch
is intentionally **disabled** so that `hls.js` can stream HLS video segments
via native XHR without binary-to-base64 corruption.

For a deeper walkthrough of the architecture, the directory layout, the
`localStorage` schema, and the routing table, see
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Framework    | Vue 3 (Composition API, `<script setup>`) |
| Build        | Vite 8 |
| Mobile shell | Capacitor 8 (Android) |
| HTTP         | `CapacitorHttp.request()` (native), Vite proxy (web) |
| Routing      | Vue Router 5 |
| Styling      | Bootstrap 5 SCSS + Material Design 3 + Ember Dark palette |
| State        | Vue `reactive()` + `localStorage` |
| Markdown     | `marked`, `showdown` |
| Video        | `hls.js` (HLS playback) + native `VideoMuxPlugin` (audio mux) |
| Redgifs      | Redgifs API v2 (direct HD MP4 URL) |
| Search       | `fuse.js` |
| Gestures     | `hammerjs` |

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md)
and [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) before opening an issue or
pull request.

To report a bug or request a feature, open an
[issue](https://github.com/dinler03/redly/issues/new/choose) and pick the
appropriate template.

## License

Redly is released under the
[GNU General Public License v3.0 or later](./LICENSE).

See [`NOTICE`](./NOTICE) for full attribution to the upstream Geddit project.

## Disclaimer

Redly is an **unofficial, third-party Reddit client**. It is not affiliated
with, endorsed by, or sponsored by Reddit, Inc. All Reddit content displayed
in Redly belongs to its respective authors and is subject to Reddit's content
policies.

Redly is a read-only client that consumes publicly available JSON feeds. It
does not collect data from its users. The maintainers are not responsible for
how the application is used. Use at your own risk.
