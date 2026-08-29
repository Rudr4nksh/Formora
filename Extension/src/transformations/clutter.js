/**
 * Formora transformation: visual clutter reduction
 *
 * Two layers, both reversible:
 *  1. Detection — a curated selector list for common non-content chrome
 *     (ads, cookie banners, share widgets, popups/newsletter overlays).
 *     Matches are DIMMED, not removed, so nothing actually breaks if the
 *     heuristic misfires on a page we don't fully understand.
 *  2. A light global "flatten" pass (fewer shadows/animations) scoped
 *     under the active attribute — purely cosmetic, never structural.
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const STYLE_ID = 'formora-style-clutter';
  const CLASS = 'formora-clutter';

  // Intentionally conservative — matches by common, well-established
  // naming conventions rather than guessing at arbitrary page structure.
  const CLUTTER_SELECTORS = [
    '[class*="cookie" i]:not(nav):not(header)',
    '[id*="cookie" i]:not(nav):not(header)',
    '[class*="newsletter" i]',
    '[class*="social-share" i]',
    '[class*="share-buttons" i]',
    '[class*="advert" i]',
    '[class*="advertisement" i]',
    '[id*="advert" i]',
    'ins.adsbygoogle',
    '[class*="promo-banner" i]',
    '[class*="popup" i]:not(nav)',
    '[class*="modal-overlay" i]',
  ].join(', ');

  const MAX_TARGETS = 80;

  const CSS = `
    html[data-formora-active] .${CLASS} {
      opacity: 0.12 !important;
      filter: grayscale(1) !important;
      pointer-events: none !important;
      transition: opacity 0.15s ease !important;
    }
    html[data-formora-active] .${CLASS}:hover,
    html[data-formora-active] .${CLASS}:focus-within {
      opacity: 0.9 !important;
      pointer-events: auto !important;
    }
    /* Light cosmetic flattening — animations/shadows only, nothing structural */
    html[data-formora-active] {
      --formora-clutter-active: 1;
    }
    html[data-formora-active] * {
      animation-duration: 0.001s !important;
      animation-delay: 0s !important;
    }
  `;

  function detect(root = document) {
    const candidates = dom.qsa(CLUTTER_SELECTORS, root);
    let count = 0;
    for (const el of candidates) {
      if (count >= MAX_TARGETS) break;
      // Never touch the <html>/<body> themselves even if a selector
      // somehow matches them, and skip elements that contain the main
      // content landmark to avoid dimming an entire page by accident.
      if (el === document.documentElement || el === document.body) continue;
      if (el.querySelector('main, [role="main"]')) continue;
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
  NS.transformations.clutter = { apply, revert, detect };
})();
