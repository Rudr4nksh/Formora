# Formora — Chrome Extension

Team 2's scope: Chrome extension, content scripts, transformation engine,
and the website ↔ extension communication bridge.

## Pipeline this proves

```
Chrome (popup click)
  → Extension (popup.js sends a message)
    → Content Script (content.js receives it)
      → Transformation Engine (registry.js runs fontSize.js)
        → DOM (a <style> tag is injected)
          → Personalized Website (text is visibly larger)
```

## File structure

```
extension/
├── manifest.json                    Manifest V3 config
├── icons/                           Toolbar/store icons (16/48/128)
└── src/
    ├── popup/
    │   ├── popup.html               Extension toolbar popup UI
    │   ├── popup.css
    │   └── popup.js                 Sends APPLY_CONFIG/RESET_CONFIG to the active tab
    ├── content/
    │   └── content.js               Runs inside the webpage; applies config to DOM
    ├── background/
    │   └── background.js            Service worker: install hooks + web app bridge
    ├── transformations/
    │   ├── fontSize.js              Transformation #1 (proof of concept)
    │   ├── lineSpacing.js           Transformation #2 (proves it's pluggable)
    │   └── registry.js              Engine core: config -> apply/revert calls
    └── shared/
        ├── messageTypes.js          Message name constants
        └── defaultConfig.js         Sample TransformationConfig shape
```

## How the pieces fit together

- **Transformation Configuration** is a plain object:
  ```js
  {
    version: 1,
    transformations: [
      { id: "increase-text-size", type: "fontSize", enabled: true, params: { scale: 1.25 } }
    ]
  }
  ```
  This is the shape Team 1's web app is expected to eventually produce.

- **Transformation engine** (`transformations/registry.js`) doesn't know
  about Chrome APIs at all — it just takes a config object and calls
  `apply()`/`revert()` on whichever transformation modules match each
  rule's `type`. Adding a new transformation means adding one file and one
  registry entry; nothing else changes.

- **Content script** (`content/content.js`) is the only piece that touches
  both Chrome messaging and the DOM. On page load it checks
  `chrome.storage.local` for a saved config and re-applies it automatically
  (so transformations persist across refreshes/navigation). It also listens
  live for messages from the popup or background worker.

- **Popup** (`popup/`) is the manual trigger used for this first proof: a
  button sends a hardcoded test config (`fontSize`, scale `1.25`) straight
  to the content script via `chrome.tabs.sendMessage`.

- **Background service worker** (`background/background.js`) handles two
  things the popup can't: seeding a default config on install (and
  injecting the content script into tabs that were already open, so the
  demo doesn't require a manual refresh), and listening for
  `externally_connectable` messages — this is the eventual entry point for
  Team 1's web app to hand off a finished config without the user manually
  clicking anything in the popup.

## Loading the extension into Chrome

1. Open `chrome://extensions`.
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/` folder (the one containing `manifest.json`).
5. Formora should appear in your extensions list and in the toolbar
   (pin it via the puzzle-piece icon if it's hidden).

## Testing the proof-of-concept

1. Open any normal webpage (e.g. `https://en.wikipedia.org/wiki/Web_browser`).
   `chrome://` pages and the Chrome Web Store won't work — Chrome blocks
   extensions from running there.
2. Click the Formora icon in the toolbar.
3. Click **Increase text size** — the page's text should visibly grow.
4. Click **Reset page** — it returns to normal.
5. Refresh the page after applying — the transformation re-applies itself
   automatically (proves the storage → auto-apply-on-load path works, which
   is what real personalization needs, not just one-off clicks).

If the popup says *"Not connected yet"*, refresh the target tab once after
first loading the extension — tabs that were already open before install
need one reload (or rely on the auto-injection in `background.js`'s
`onInstalled` handler, which handles this for tabs open at install time).

## Notes for the rest of the team

- Team 1 (web app): once the config export exists, send it to the
  extension via `chrome.runtime.sendMessage(EXTENSION_ID, { type:
  "FORMORA_CONFIG_FROM_WEBAPP", config }, callback)` from the web app's
  origin. Add your dev/prod origins to `externally_connectable.matches` in
  `manifest.json` (localhost:3000 and `formora.app` are stubbed in already
  — update as needed).
- This does **not** attempt universal personalization yet — only two
  transformation types exist (`fontSize`, `lineSpacing`), applied via
  simple injected `<style>` tags. That's intentional for a 48-hour scope;
  the registry pattern is there so more can be added quickly.
