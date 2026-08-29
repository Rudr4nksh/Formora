/**
 * Formora transformation: button / action highlighting
 *
 * Detection-based: we find likely "primary action" elements using a
 * conservative selector list, tag them with a class, and let CSS do the
 * visual work. Detection re-runs on DOM changes (see index.js), so it
 * also catches elements added after initial load.
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const STYLE_ID = 'formora-style-buttons';
  const CLASS = 'formora-cta';

  // Conservative: real buttons, submit inputs, and links/elements that
  // explicitly self-identify as buttons via role or class/id naming.
  // We deliberately do NOT grab every <a>, since most links are navigation,
  // not actions.
  const CANDIDATE_SELECTOR = [
    'button:not([disabled])',
    'input[type="submit"]:not([disabled])',
    'input[type="button"]:not([disabled])',
    '[role="button"]',
    'a[class*="btn" i]',
    'a[class*="button" i]',
    'a[class*="cta" i]',
  ].join(', ');

  const MAX_TARGETS = 150; // safety cap for very large/complex pages

  const CSS = `
    html[data-formora-active] .${CLASS} {
      outline: 3px solid #FFD54A !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(255, 213, 74, 0.35) !important;
      position: relative !important;
      z-index: 1 !important;
      transition: outline-color 0.15s ease !important;
    }
    html[data-formora-active] .${CLASS}:hover {
      outline-color: #FFB300 !important;
    }
  `;

  function detect(root = document) {
    const candidates = dom.qsa(CANDIDATE_SELECTOR, root);
    let count = 0;
    for (const el of candidates) {
      if (count >= MAX_TARGETS) break;
      if (!dom.isVisible(el)) continue;
      dom.mark(el, CLASS);
      count += 1;
    }
  }

  function apply(config) {
    dom.injectStyle(STYLE_ID, CSS);
    detect(document);
  }

  function revert() {
    dom.removeStyle(STYLE_ID);
    dom.qsa(`.${CLASS}`).forEach((el) => el.classList.remove(CLASS));
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.buttons = { apply, revert, detect, CLASS };
})();
