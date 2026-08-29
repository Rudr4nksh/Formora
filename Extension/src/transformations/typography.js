/**
 * Formora transformation: typography / readability
 *
 * Pure CSS, scoped under [data-formora-active], driven by a class on <html>.
 * No DOM structure is touched, so revert is just "remove the class".
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const STYLE_ID = 'formora-style-typography';
  const CLASS_PREFIX = 'formora-font-';
  const SCALES = {
    small: 0.95,
    medium: 1.0,
    large: 1.2,
    'x-large': 1.45,
  };

  function buildCss(scale) {
    // Scale root font-size; everything using rem/em follows proportionally.
    // Also nudge line-height and paragraph spacing for readability, since a
    // bigger font with cramped line-height is often *harder* to read.
    return `
      html[data-formora-active] {
        font-size: ${16 * scale}px !important;
      }
      html[data-formora-active] body {
        line-height: 1.6 !important;
      }
      html[data-formora-active] p,
      html[data-formora-active] li,
      html[data-formora-active] span,
      html[data-formora-active] a,
      html[data-formora-active] label,
      html[data-formora-active] td,
      html[data-formora-active] th {
        line-height: 1.6 !important;
      }
    `;
  }

  function apply(config) {
    const html = document.documentElement;

    // Clear any previous size class before applying the new one.
    Object.keys(SCALES).forEach((k) => html.classList.remove(`${CLASS_PREFIX}${k}`));

    const size = config.fontSize in SCALES ? config.fontSize : 'medium';
    html.classList.add(`${CLASS_PREFIX}${size}`);
    dom.injectStyle(STYLE_ID, buildCss(SCALES[size]));
  }

  function revert() {
    const html = document.documentElement;
    Object.keys(SCALES).forEach((k) => html.classList.remove(`${CLASS_PREFIX}${k}`));
    dom.removeStyle(STYLE_ID);
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.typography = { apply, revert };
})();
