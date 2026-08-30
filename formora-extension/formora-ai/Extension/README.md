# Formora — Chrome Extension (Team 2)

Personalization layer for the web. This folder is self-contained and does
not depend on the web app to run standalone tests.

## File structure

```
extension/
├── manifest.json
├── README.md
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── test-page.html                 ← standalone page for manual testing
└── src/
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    ├── content/
    │   └── content.js             ← entry point injected into every page
    ├── background/
    │   └── background.js          ← MV3 service worker
    ├── transformations/
    │   ├── index.js                ← engine: applyConfig / revertAll
    │   ├── typography.js
    │   ├── spacing.js
    │   ├── buttons.js
    │   ├── navigation.js
    │   ├── clutter.js
    │   └── images.js
    └── shared/
        ├── config.js               ← schema + normalizeConfig()
        ├── dom-utils.js             ← qs/qsa/mark/injectStyle/etc.
        └── storage.js               ← chrome.storage.local wrapper
```

## Loading the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin "Formora" from the extensions toolbar icon for easy access

Any time you edit a file, go back to `chrome://extensions` and click the
refresh icon on the Formora card, then reload the target tab.

## Manual test (proves the core pipeline)

1. Load the extension (above)
2. Open `extension/test-page.html` directly in Chrome (or any real site)
3. Click the Formora icon → flip the master toggle on
4. You should immediately see:
   - Larger, more readable text
   - More breathing room between paragraphs/list items
   - Buttons/links outlined in yellow
   - A "More" toggle on long navigation bars
   - Ad/cookie/newsletter-style blocks dimmed out
5. Flip the toggle off → the page returns to its original appearance

This proves the full chain:
**Chrome → Extension → Content Script → DOM → Visible, reversible transformation.**

## Config contract (web app → extension)

The web app should push a config object shaped like:

```json
{
  "fontSize": "large",
  "contentDensity": "low",
  "simplifyNavigation": true,
  "highlightActions": true,
  "reduceVisualClutter": true
}
```

From the web app's origin (must be listed in `externally_connectable` in
manifest.json — currently `*.formora.app` and localhost:3000/5173):

```js
chrome.runtime.sendMessage(
  "<EXTENSION_ID>",
  { type: "FORMORA_CONFIG_PUSH", config: { fontSize: "large", ... } },
  (response) => console.log(response)
);
```

The background worker stores the config and forwards it to whichever tab
is currently active. Unknown/invalid fields are ignored —
`shared/config.js` normalizes everything against `DEFAULT_CONFIG` before
any transformation runs, so a malformed config from the web app can't
crash the content script.

## Design notes / trade-offs

- **Reversibility first.** Every visual change is either (a) a scoped
  CSS rule under `html[data-formora-active]`, toggled by a class, or
  (b) a class added to a detected element. Turning Formora off removes
  the injected `<style>` tags and strips every `formora-*` class —
  nothing is deleted from the original DOM except elements Formora
  itself created (like the nav "More" button).
- **Conservative detection.** Buttons/navigation/clutter modules use
  narrow, well-established selectors (`role="button"`, `class*="cta"`,
  `<nav>`, `class*="cookie"`, etc.) instead of walking every element,
  so we don't mangle app shells or layouts we don't understand.
- **Dynamic content.** A single debounced `MutationObserver` re-runs
  detection (not the CSS injection, which is already global) when new
  nodes are added — covers SPA navigation and infinite scroll without
  re-scanning the whole DOM on every keystroke.
- **Known limitation:** clutter reduction includes a blanket
  `animation-duration` override for cosmetic flattening. This is a
  hackathon shortcut — a production version should scope it more
  narrowly so it never touches loading spinners.
