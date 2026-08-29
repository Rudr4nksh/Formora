/**
 * Formora — background service worker (Manifest V3).
 *
 * Service workers don't share a JS context with content scripts, so these
 * constants are duplicated from src/shared/messageTypes.js and
 * defaultConfig.js. Keep them in sync if either file changes.
 *
 * Responsibilities:
 *   1. On install, seed chrome.storage with a default config and inject
 *      the content script into any tabs that were already open (tabs
 *      opened before install don't get the manifest's declarative
 *      content_scripts automatically — this makes the demo work without
 *      requiring a page refresh).
 *   2. Act as the landing point for the web app: once Team 1's web app
 *      is ready, it will postMessage a finished config to this worker via
 *      chrome.runtime.sendMessage(EXTENSION_ID, {...}) (allowed by the
 *      externally_connectable entry in manifest.json). We store it and
 *      forward it to the active tab's content script.
 */
const STORAGE_KEY = "formora_config";

const MessageTypes = {
  APPLY_CONFIG: "FORMORA_APPLY_CONFIG",
  RESET_CONFIG: "FORMORA_RESET_CONFIG",
  GET_STATE: "FORMORA_GET_STATE",
  STATE_UPDATED: "FORMORA_STATE_UPDATED",
  CONFIG_FROM_WEBAPP: "FORMORA_CONFIG_FROM_WEBAPP",
};

const DEFAULT_CONFIG = {
  version: 1,
  updatedAt: null,
  transformations: [
    {
      id: "increase-text-size",
      type: "fontSize",
      enabled: true,
      params: { scale: 1.25 },
    },
    {
      id: "comfortable-line-spacing",
      type: "lineSpacing",
      enabled: false,
      params: { multiplier: 1.5 },
    },
  ],
};

// --- Install: seed storage + inject into already-open tabs --------------
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get([STORAGE_KEY]);
  if (!existing[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_CONFIG });
  }

  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          "src/shared/messageTypes.js",
          "src/shared/defaultConfig.js",
          "src/transformations/fontSize.js",
          "src/transformations/lineSpacing.js",
          "src/transformations/registry.js",
          "src/content/content.js",
        ],
      });
    } catch (err) {
      // Tabs like chrome:// pages will reject injection — safe to ignore.
    }
  }
});

// --- Bridge: web app (external site) -> extension -> active tab --------
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message.type !== MessageTypes.CONFIG_FROM_WEBAPP) return;

  chrome.storage.local.set({ [STORAGE_KEY]: message.config }, async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      chrome.tabs.sendMessage(activeTab.id, {
        type: MessageTypes.APPLY_CONFIG,
        config: message.config,
      });
    }
    sendResponse({ ok: true });
  });

  return true; // async sendResponse
});