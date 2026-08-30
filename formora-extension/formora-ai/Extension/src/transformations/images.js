/**
 * Formora transformation: image de-emphasis
 *
 * Bonus module, only active when reduceVisualClutter is on. Targets
 * clearly decorative images (empty alt text, role="presentation") that
 * sit outside <main>/[role="main"], and shrinks them rather than hiding
 * them, so page layout doesn't jump.
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const STYLE_ID = 'formora-style-images';
  const CLASS = 'formora-img-muted';
  const MAX_TARGETS = 60;

  const CSS = `
    html[data-formora-active] .${CLASS} {
      filter: grayscale(0.6) brightness(1.02) !important;
      max-height: 140px !important;
      object-fit: cover !important;
    }
  `;

  function isDecorative(img) {
    if (img.getAttribute('role') === 'presentation') return true;
    const alt = img.getAttribute('alt');
    return alt !== null && alt.trim() === '';
  }

  function isInsideMainContent(img) {
    return Boolean(img.closest('main, [role="main"], article'));
  }

  function detect(root = document) {
    const imgs = dom.qsa('img', root);
    let count = 0;
    for (const img of imgs) {
      if (count >= MAX_TARGETS) break;
      if (!dom.isVisible(img)) continue;
      if (isInsideMainContent(img)) continue; // don't touch content images
      if (!isDecorative(img)) continue;
      dom.mark(img, CLASS);
      count += 1;
    }
  }

  function apply(config) {
    if (!config.reduceVisualClutter) return;
    dom.injectStyle(STYLE_ID, CSS);
    detect(document);
  }

  function revert() {
    dom.removeStyle(STYLE_ID);
    dom.qsa(`.${CLASS}`).forEach((el) => el.classList.remove(CLASS));
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.images = { apply, revert, detect };
})();
