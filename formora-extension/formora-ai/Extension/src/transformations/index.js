/**
 * Formora transformation engine
 *
 * Orchestrates every module in src/transformations/*. This is the only
 * file content.js needs to talk to.
 *
 * Design:
 *  - "CSS-driven" modules (typography, spacing) never touch DOM structure;
 *    they toggle a class on <html> and inject scoped CSS.
 *  - "Detection-driven" modules (buttons, navigation, clutter, images)
 *    find relevant elements and mark them with a class; CSS does the
 *    rest. Detection re-runs on mutations so late-rendered content
 *    (SPAs, infinite scroll) gets caught too.
 *  - Every module exposes apply(config) and revert(), and nothing here
 *    ever calls el.remove() on page content — only on elements Formora
 *    itself injected (e.g. the nav "More" button).
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  // Order matters a little: typography/spacing first (pure CSS, cheap),
  // then detection-based ones.
  const MODULE_ORDER = ['typography', 'spacing', 'buttons', 'navigation', 'clutter', 'images', 'visual', 'emphasis', 'summaries', 'focus'];

  let observer = null;
  let currentConfig = null;
  let active = false;

  function getModules() {
    return MODULE_ORDER.map((name) => NS.transformations[name]).filter(Boolean);
  }

  function runDetectionPass(root = document) {
    if (!active) return;
    // Only detection-driven modules expose detect(); CSS-driven ones don't.
    getModules().forEach((mod) => {
      if (typeof mod.detect === 'function') {
        try {
          mod.detect(root);
        } catch (err) {
          console.warn('[Formora] detection pass failed for a module', err);
        }
      }
    });
  }

  function startObserving() {
    if (observer) return;
    const debouncedPass = dom.debounce(() => runDetectionPass(document), 250);
    observer = new MutationObserver((mutations) => {
      // Cheap filter: ignore mutations Formora itself caused (class/style
      // changes on already-marked elements) to avoid feedback loops.
      const hasRealAddition = mutations.some((m) => m.addedNodes && m.addedNodes.length > 0);
      if (hasRealAddition) debouncedPass();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserving() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  /** Applies the given config to the current page. Safe to call repeatedly
   *  (e.g. when the user tweaks settings) — each module clears its own
   *  previous state before reapplying. */
  function applyConfig(rawConfig) {
    currentConfig = NS.config.normalizeConfig(rawConfig);
    document.documentElement.setAttribute(dom.ROOT_ATTR, '1');
    active = true;

    getModules().forEach((mod) => {
      try {
        mod.apply(currentConfig);
      } catch (err) {
        console.error('[Formora] transformation failed, skipping module', err);
      }
    });

    startObserving();
    return currentConfig;
  }

  /** Reverts every transformation and restores the page as closely as
   *  practical: removes injected stylesheets, strips Formora classes,
   *  and removes only the elements Formora itself created. */
  function revertAll() {
    active = false;
    stopObserving();

    getModules().forEach((mod) => {
      try {
        mod.revert();
      } catch (err) {
        console.error('[Formora] revert failed for a module', err);
      }
    });

    dom.removeAllFormoraStyles();
    dom.unmarkAll(document);
    document.documentElement.removeAttribute(dom.ROOT_ATTR);
    currentConfig = null;
  }

  function isActive() {
    return active;
  }

  function getCurrentConfig() {
    return currentConfig;
  }

  NS.engine = { applyConfig, revertAll, isActive, getCurrentConfig, runDetectionPass };
})();
