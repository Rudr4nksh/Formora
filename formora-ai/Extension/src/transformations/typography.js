/**
 * Formora transformation: typography / font family & sizing
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const STYLE_ID = 'formora-style-typography';
  const CLASS_PREFIX = 'formora-font-';
  const SCALES = {
    small: 0.9,
    medium: 1.0,
    large: 1.25,
    'x-large': 1.5,
  };

  const FAMILIES = {
    system: '',
    serif: 'Georgia, Cambria, "Times New Roman", serif',
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    dyslexia: 'OpenDyslexic, "Comic Sans MS", Arial, sans-serif',
    mono: 'Consolas, Monaco, "Courier New", monospace'
  };

  function buildCss(scale, family) {
    const fontRule = family ? `font-family: ${family} !important;` : '';
    const sizeRule = scale !== 1.0 ? `font-size: calc(1em * ${scale}) !important;` : '';

    if (!fontRule && !sizeRule) return '';

    return `
      html[data-formora-active] body,
      html[data-formora-active] body * {
        ${fontRule}
        ${sizeRule}
      }
      html[data-formora-active] p,
      html[data-formora-active] li,
      html[data-formora-active] span,
      html[data-formora-active] a,
      html[data-formora-active] h1,
      html[data-formora-active] h2,
      html[data-formora-active] h3 {
        line-height: 1.6 !important;
      }
    `;
  }

  function apply(config) {
    const family = FAMILIES[config.fontFamily] || '';
    const size = config.fontSize in SCALES ? config.fontSize : 'medium';
    const scale = SCALES[size];

    if (size === 'medium' && !family) {
      revert();
      return;
    }

    const css = buildCss(scale, family);
    if (css) {
      dom.injectStyle(STYLE_ID, css);
    } else {
      revert();
    }
  }

  function revert() {
    dom.removeStyle(STYLE_ID);
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.typography = { apply, revert };
})();
