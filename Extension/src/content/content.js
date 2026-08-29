/**
 * Formora content script
 *
 * Responsibilities:
 *  - On load, read stored {enabled, config} and apply if enabled, so
 *    personalization survives page refreshes/navigations.
 *  - Listen for messages from the popup / background worker and
 *    apply/revert/report state on demand.
 *
 * This file loads LAST (see manifest.json) so window.__formora.engine
 * and friends already exist.
 */
(function () {
  const NS = window.__formora;
  if (!NS || !NS.engine) {
    console.error('[Formora] engine failed to load — check manifest content_scripts order');
    return;
  }

  async function init() {
    try {
      const { enabled, config } = await NS.storage.getState();
      if (enabled && config) {
        NS.engine.applyConfig(config);
      }
    } catch (err) {
      console.error('[Formora] failed to restore state', err);
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return undefined;

    switch (message.type) {
      case 'FORMORA_APPLY': {
        const applied = NS.engine.applyConfig(message.config);
        NS.storage.setState({ enabled: true, config: applied });
        sendResponse({ ok: true, config: applied });
        break;
      }
      case 'FORMORA_REVERT': {
        NS.engine.revertAll();
        NS.storage.setState({ enabled: false });
        sendResponse({ ok: true });
        break;
      }
      case 'FORMORA_GET_STATE': {
        sendResponse({
          ok: true,
          active: NS.engine.isActive(),
          config: NS.engine.getCurrentConfig(),
        });
        break;
      }
      default:
        return undefined;
    }
    return true; // keep the message channel open for async sendResponse
  });

  init();
})();
