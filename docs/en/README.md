<p align="center">
  <a href="../video/promo.mp4">
    <img alt="TradingWorks+ — your clock-in, time bank and alerts in one click" src="../imgs/promo/marquee-1400x560.png" width="100%">
  </a>
</p>

<h1 align="center">
  <img alt="Icon" src="../imgs/icon.png" width="28"> TradingWorks+
</h1>

<p align="center">
  Clock in, track your workday and time bank, and get notified at the right moment — without keeping a TradingWorks tab open all day.
</p>

<div align="center">

  [![Version](https://img.shields.io/badge/version-3.0.0-7c9a4e?logo=googlechrome&logoColor=white)](https://github.com/ErnaneJ/tradingworks-plus/releases)
  [![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE.md)
  [![Manifest V3](https://img.shields.io/badge/manifest-v3-orange?logo=googlechrome&logoColor=white)](../../src/manifest.json)
  [![Svelte](https://img.shields.io/badge/svelte-4-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev)

</div>

<p align="center">
  <a href="../../README.md">Português (Brasil)</a> ·
  <a href="../es/README.md">Español</a>
</p>

## What it is

TradingWorks+ is an unofficial browser extension, with no affiliation to the TWO company. The idea is simple: stop logging into [TradingWorks](https://app.tradingworks.net/) just to check whether you clocked in or how much time bank you have. The extension handles it in one click, right from the browser — nothing reinvented, just a more convenient way to see what the platform already shows you.

## Features

Clock in with one click and immediately see whether you're working, on a break, or done for the day. The day's timeline lays out clock-ins, breaks and overtime side by side, and your time bank is always within reach, with the current balance and month-by-month history. You can revisit attendance history whenever you need to check an earlier day, and anyone who approves a team's attendance can review and approve it right from the panel.

You also get to choose how you're notified — browser notification, generic webhook or Discord — for each event (clock-in, clock-out, break ending, shift ending soon, overtime, and more). The popup has 11 layouts, from a quick glance to the full dashboard, the theme follows the system (or a manual light/dark setting), and the interface speaks Portuguese, English or Spanish.

_Note: data is read directly from your already-authenticated TradingWorks browser session — the extension never asks for a login or password, it just reuses the session you already have open._

## Popup: 11 layouts

Click the layout icon in the popup header to cycle through them. A few examples, from the leanest to the most complete:

<table>
  <tr>
    <td align="center"><img src="../imgs/popup/minimal.png" width="160"><br><sub>Minimal</sub></td>
    <td align="center"><img src="../imgs/popup/ring.png" width="160"><br><sub>Ring</sub></td>
    <td align="center"><img src="../imgs/popup/stats.png" width="160"><br><sub>Stats</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="../imgs/popup/week.png" width="160"><br><sub>Week</sub></td>
    <td align="center"><img src="../imgs/popup/timebank.png" width="160"><br><sub>Time bank</sub></td>
    <td align="center"><img src="../imgs/popup/full.png" width="160"><br><sub>Full</sub></td>
  </tr>
</table>

The other five (standard, compact, timeline, classic and approvals) are part of the same cycle, right in the popup.

## Options panel

<table>
  <tr>
    <td align="center"><img src="../imgs/options/painel.png" width="260"><br><sub>Dashboard</sub></td>
    <td align="center"><img src="../imgs/options/notificacoes.png" width="260"><br><sub>Notifications</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="../imgs/options/historico.png" width="260"><br><sub>Attendance history</sub></td>
    <td align="center"><img src="../imgs/options/equipe.png" width="260"><br><sub>Team</sub></td>
  </tr>
</table>

> The screenshots above use fictitious demo data — none of them are real captures of any company or employee.

## Technologies

- [Svelte 4](https://svelte.dev) + [TypeScript](https://www.typescriptlang.org/) + [Vite 5](https://vitejs.dev)
- Chrome Extension **Manifest V3** (service worker, `chrome.alarms`, `chrome.storage`, `chrome.notifications`)
- [Vitest](https://vitest.dev) for tests

## Installation

### From the Chrome Web Store (recommended)

[Install TradingWorks+ from the Chrome Web Store](https://chromewebstore.google.com/detail/tradingworks+/gekmgdfmjoccmkagkbcboidgknlolihl)

### Manually, from source

Use this path if you want to try a specific branch or contribute to the project.

```bash
git clone git@github.com:ErnaneJ/tradingworks-plus.git
cd tradingworks-plus
npm install
npm run build
```

Then, in `chrome://extensions`: enable **Developer mode**, click **Load unpacked** and select the `dist/` folder produced by the build.

## Privacy

The extension doesn't send your clock-in data to any server of its own: everything stays stored locally in the browser (`chrome.storage.local`), and only leaves your device if you set up a webhook or Discord integration yourself in Notifications. Full details in the [Privacy Policy](../privacy_policy/en.md).

## Developing

Found a problem or want to suggest something? Open an [issue](https://github.com/ErnaneJ/tradingworks-plus/issues/new). Want to contribute code?

```bash
npm run dev       # watch-mode build
npm run typecheck # TypeScript + svelte-check
npm run test      # Vitest
```

Load the `dist/` folder as an unpacked extension (manual install above) to see your changes live. When you're done, open a PR — every contribution is welcome.

---

<div align="center">
  2023–2026 · <b>TradingWorks+</b> · <a href="https://github.com/ErnaneJ/tradingworks-plus/blob/main/LICENSE.md">MIT</a>
</div>
