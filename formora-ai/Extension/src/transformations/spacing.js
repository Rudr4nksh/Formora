/**
 * Formora transformation: spacing / content density
 *
 * Targets well-known text-content elements only (p, li, article, section,
 * blockquote, td...) rather than every element on the page, so we don't
 * mangle layout containers, grids, or app shells we don't understand.
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const STYLE_ID = 'formora-style-spacing';

  // Multiplier applied to margin/padding of content elements.
  const DENSITY_SCALE = {
    low: 1.6, // spacious
    medium: 1.0,
    high: 0.7, // compact
  };

  const CONTENT_SELECTORS = [
    'p',
    'li',
    'article',
    'section',
    'blockquote',
    'td',
    'th',
    'figure',
    'figcaption',
  ].join(', ');

  function buildCss(scale) {
    const gap = (12 * scale).toFixed(1);
    const lineGap = (1.4 * scale).toFixed(2);
    return `
      html[data-formora-active] :is(${CONTENT_SELECTORS}) {
        margin-bottom: ${gap}px !important;
      }
      html[data-formora-active] p {
        line-height: ${lineGap} !important;
      }
    `;
  }

  function apply(config) {
    const html = document.documentElement;
    const density = config.contentDensity in DENSITY_SCALE ? config.contentDensity : 'medium';

    // Medium is the website's original layout; do not alter it unless the
    // user explicitly chooses spacious or compact content.
    if (density === 'medium') {
      revert();
      return;
    }

    Object.keys(DENSITY_SCALE).forEach((k) => html.classList.remove(`formora-density-${k}`));
    html.classList.add(`formora-density-${density}`);

    dom.injectStyle(STYLE_ID, buildCss(DENSITY_SCALE[density]));
  }

  function revert() {
    const html = document.documentElement;
    Object.keys(DENSITY_SCALE).forEach((k) => html.classList.remove(`formora-density-${k}`));
    dom.removeStyle(STYLE_ID);
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.spacing = { apply, revert };
})();
