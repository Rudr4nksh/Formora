/**
 * Formora transformation: navigation simplification
 *
 * Finds semantic navigation regions (<nav>, [role="navigation"]) and:
 *  1. visually simplifies them (flatten backgrounds, consistent spacing)
 *  2. keeps the first N direct link items visible and tucks the rest
 *     behind a "More" toggle, instead of deleting them.
 *
 * We only ever touch elements *inside* a detected nav region, and we
 * never remove nodes from the DOM — hidden items get a class, not a
 * `.remove()`, so functionality (and any JS listeners on them) survives.
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const STYLE_ID = 'formora-style-navigation';
  const NAV_CLASS = 'formora-nav';
  const OVERFLOW_CLASS = 'formora-nav-overflow';
  const TOGGLE_CLASS = 'formora-nav-toggle';
  const OPEN_CLASS = 'formora-nav-open';

  const VISIBLE_ITEM_LIMIT = 6;
  const NAV_SELECTOR = 'nav, [role="navigation"]';

  const CSS = `
    html[data-formora-active] .${NAV_CLASS} {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 8px !important;
    }
    html[data-formora-active] .${OVERFLOW_CLASS} {
      display: none !important;
    }
    html[data-formora-active] .${NAV_CLASS}.${OPEN_CLASS} .${OVERFLOW_CLASS} {
      display: inline-flex !important;
    }
    html[data-formora-active] .${TOGGLE_CLASS} {
      font: inherit !important;
      background: #f1f1f1 !important;
      border: 1px solid #ccc !important;
      border-radius: 6px !important;
      padding: 4px 10px !important;
      cursor: pointer !important;
    }
  `;

  function findTopLevelItems(nav) {
    // Prefer an explicit <ul>/<ol> list, otherwise fall back to direct
    // link/button children. This avoids reaching into nested submenus.
    const list = nav.querySelector(':scope > ul, :scope > ol');
    if (list) return Array.from(list.children).filter((el) => el.matches('li, a, button'));
    return Array.from(nav.children).filter((el) => el.matches('a, button, li'));
  }

  function simplifyNav(nav) {
    if (nav.dataset.formoraNavDone === '1') return; // avoid double-wrapping
    const items = findTopLevelItems(nav);
    if (items.length <= VISIBLE_ITEM_LIMIT) {
      dom.mark(nav, NAV_CLASS);
      nav.dataset.formoraNavDone = '1';
      return;
    }

    dom.mark(nav, NAV_CLASS);
    const overflow = items.slice(VISIBLE_ITEM_LIMIT);
    overflow.forEach((item) => dom.mark(item, OVERFLOW_CLASS));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = `More (${overflow.length})`;
    toggle.className = TOGGLE_CLASS;
    toggle.setAttribute('data-formora-marked', '1');
    toggle.addEventListener('click', () => nav.classList.toggle(OPEN_CLASS));
    nav.appendChild(toggle);

    nav.dataset.formoraNavDone = '1';
  }

  function detect(root = document) {
    dom.qsa(NAV_SELECTOR, root).forEach((nav) => {
      if (dom.isVisible(nav)) simplifyNav(nav);
    });
  }

  function apply(config) {
    dom.injectStyle(STYLE_ID, CSS);
    detect(document);
  }

  function revert() {
    dom.removeStyle(STYLE_ID);
    // Remove toggle buttons we injected, then unmark everything else.
    dom.qsa(`.${TOGGLE_CLASS}`).forEach((btn) => btn.remove());
    dom.qsa(`.${NAV_CLASS}`).forEach((nav) => {
      nav.classList.remove(NAV_CLASS, OPEN_CLASS);
      delete nav.dataset.formoraNavDone;
    });
    dom.qsa(`.${OVERFLOW_CLASS}`).forEach((el) => el.classList.remove(OVERFLOW_CLASS));
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.navigation = { apply, revert, detect };
})();
