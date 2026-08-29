/**
 * Formora — content script.
 *
 * This is the piece that actually lives inside the webpage. Its only jobs:
 *   1. On load, check chrome.storage for a saved config and apply it
 *      (this is how a config set once from the popup/web app persists
 *      across page loads/navigations).
 *   2. Listen for live messages from the popup/background and run them
 *      through the transformation engine immediately.
 *
 * Pipeline this file completes:
 *   Chrome (popup click) -> Extension (background/popup) -> Content Script
 *   (this file) -> DOM -> Personalized Website
 */
const { MessageTypes } = window.Formora;
const { STORAGE_KEY } = window.Formora;
const { engine } = window.Formora;

let currentConfig = null;

// --- 1. Apply any saved config as soon as the page is ready -------------
chrome.storage.local.get([STORAGE_KEY], (result) => {
  const saved = result[STORAGE_KEY];
  if (saved) {
    currentConfig = saved;
    engine.applyConfig(saved);
  }
});

// --- 2. React to live messages from popup / background ------------------
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case MessageTypes.APPLY_CONFIG: {
      currentConfig = message.config;
      engine.applyConfig(message.config);
      sendResponse({ ok: true });
      break;
    }

    case MessageTypes.RESET_CONFIG: {
      currentConfig = null;
      engine.resetAll();
      sendResponse({ ok: true });
      break;
    }

    case MessageTypes.GET_STATE: {
      sendResponse({ ok: true, config: currentConfig });
      break;
    }

    default:
      break;
  }

  // Returning true keeps the message channel open for the async
  // sendResponse calls above (not strictly needed here since they're
  // synchronous, but kept for forward-compatibility with async transforms).
  return true;
});