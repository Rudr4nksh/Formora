/**
 * Formora background service worker (MV3)
 *
 * Two jobs:
 *  1. Receive a transformation config pushed from the Formora web app
 *     (via chrome.runtime.sendMessage with externally_connectable) and
 *     persist it + forward it to the active tab's content script.
 *  2. Small utility relay for the popup, in case it ever needs to reach
 *     a tab that isn't the one it's attached to (not used yet, but kept
 *     here so popup.js doesn't need tabs.sendMessage duplicated).
 *
 * The web app itself is Team 1's responsibility — this file only defines
 * the extension side of the contract:
 *
 *   window.postMessage(...)  [web app]  -- not used, we use runtime API --
 *   chrome.runtime.sendMessage(EXTENSION_ID, { type: 'FORMORA_CONFIG_PUSH', config })
 */

const STORAGE_KEYS = { ENABLED: 'formora_enabled', CONFIG: 'formora_config' };

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function pushConfigToActiveTab(config) {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return { ok: false, error: 'no-active-tab' };

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'FORMORA_APPLY',
      config,
    });
    return response || { ok: true };
  } catch (err) {
    // Content script may not be injected yet (e.g. chrome:// pages) —
    // this is expected on some tabs, not a real failure.
    return { ok: false, error: String(err) };
  }
}

// --- Messages from the Formora website (externally_connectable) ---------
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'FORMORA_CONFIG_PUSH') {
    sendResponse({ ok: false, error: 'unknown-message-type' });
    return false;
  }

  const config = message.config;

  chrome.storage.local.set(
    { [STORAGE_KEYS.CONFIG]: config, [STORAGE_KEYS.ENABLED]: true },
    async () => {
      const result = await pushConfigToActiveTab(config);
      sendResponse({ ok: true, forwarded: result });
    }
  );

  return true; // async response
});

// --- Messages from the popup (kept generic for future use) --------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'FORMORA_PUSH_TO_ACTIVE_TAB') return undefined;
  pushConfigToActiveTab(message.config).then(sendResponse);
  return true;
});
