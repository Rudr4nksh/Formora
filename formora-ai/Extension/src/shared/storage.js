/**
 * Formora — storage helper
 *
 * Thin promise wrapper around chrome.storage.local so the rest of the
 * codebase never touches the callback API directly.
 *
 * Keys:
 *   formora_enabled  -> boolean, master on/off switch
 *   formora_config   -> the normalized transformation config
 */
(function () {
  const NS = (window.__formora = window.__formora || {});

  const KEYS = {
    ENABLED: 'formora_enabled',
    CONFIG: 'formora_config',
  };

  function getState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([KEYS.ENABLED, KEYS.CONFIG], (result) => {
        resolve({
          enabled: Boolean(result[KEYS.ENABLED]),
          config: result[KEYS.CONFIG] || null,
        });
      });
    });
  }

  function setState({ enabled, config }) {
    return new Promise((resolve) => {
      const payload = {};
      if (enabled !== undefined) payload[KEYS.ENABLED] = enabled;
      if (config !== undefined) payload[KEYS.CONFIG] = config;
      chrome.storage.local.set(payload, resolve);
    });
  }

  NS.storage = { KEYS, getState, setState };
})();
