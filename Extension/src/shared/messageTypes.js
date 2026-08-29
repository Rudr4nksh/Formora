/**
 * Formora — shared message type constants.
 *
 * Loaded as a plain (non-module) script in the content script bundle so it
 * can be shared via a single global namespace: window.Formora.
 *
 * The popup and background service worker import this same shape by
 * duplicating the constants (see popup.js / background.js) since MV3
 * service workers and content scripts don't share a JS context. Keep any
 * changes here mirrored there.
 */
window.Formora = window.Formora || {};

window.Formora.MessageTypes = {
  // popup/background -> content script
  APPLY_CONFIG: "FORMORA_APPLY_CONFIG",
  RESET_CONFIG: "FORMORA_RESET_CONFIG",
  GET_STATE: "FORMORA_GET_STATE",

  // content script -> popup/background (response payloads)
  STATE_UPDATED: "FORMORA_STATE_UPDATED",

  // web app -> background (externally_connectable)
  CONFIG_FROM_WEBAPP: "FORMORA_CONFIG_FROM_WEBAPP",
};
