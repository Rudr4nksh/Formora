/** Visual comfort: reading backgrounds and dark/light modes. */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;
  const STYLE_ID = 'formora-style-visual-comfort';

  const THEMES = {
    default: null,
    warm: { bg: '#faf6ee', text: '#2c2620', cardBg: '#f3ece0', link: '#8c4800' },
    sepia: { bg: '#f4ecd8', text: '#3b3127', cardBg: '#eae1cc', link: '#7a4210' },
    'soft-gray': { bg: '#f1f5f9', text: '#1e293b', cardBg: '#e2e8f0', link: '#2563eb' },
    dark: { bg: '#18191c', text: '#e2e8f0', cardBg: '#222429', link: '#60a5fa' },
    black: { bg: '#000000', text: '#f1f5f9', cardBg: '#121212', link: '#93c5fd' }
  };

  function apply(config) {
    const visual = config.visualComfort || {};
    const themeKey = visual.background || 'default';
    const theme = THEMES[themeKey];

    if (!theme) {
      revert();
      return;
    }

    dom.injectStyle(STYLE_ID, `
      html[data-formora-active],
      html[data-formora-active] body,
      html[data-formora-active] div,
      html[data-formora-active] main,
      html[data-formora-active] article,
      html[data-formora-active] section,
      html[data-formora-active] header,
      html[data-formora-active] footer,
      html[data-formora-active] aside,
      html[data-formora-active] nav,
      html[data-formora-active] table,
      html[data-formora-active] tr,
      html[data-formora-active] td,
      html[data-formora-active] ul,
      html[data-formora-active] ol,
      html[data-formora-active] li,
      html[data-formora-active] form,
      html[data-formora-active] details {
        background-color: ${theme.bg} !important;
        color: ${theme.text} !important;
      }
      html[data-formora-active] p,
      html[data-formora-active] li,
      html[data-formora-active] h1,
      html[data-formora-active] h2,
      html[data-formora-active] h3,
      html[data-formora-active] h4,
      html[data-formora-active] h5,
      html[data-formora-active] h6,
      html[data-formora-active] span,
      html[data-formora-active] label,
      html[data-formora-active] blockquote,
      html[data-formora-active] summary {
        color: ${theme.text} !important;
      }
      html[data-formora-active] a {
        color: ${theme.link} !important;
      }
    `);
  }

  function revert() {
    dom.removeStyle(STYLE_ID);
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.visual = { apply, revert };
})();
