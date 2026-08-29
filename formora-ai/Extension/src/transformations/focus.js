/**
 * Formora transformation: Focus Mode
 *
 * Smoothly highlights the paragraph/block under cursor with a reading line indicator.
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const STYLE_ID = 'formora-style-focus';
  const CLASS_FOCUS_ACTIVE = 'formora-focus-active';

  function apply(config) {
    if (!config.focusMode) {
      revert();
      return;
    }

    document.documentElement.classList.add(CLASS_FOCUS_ACTIVE);

    dom.injectStyle(STYLE_ID, `
      html.${CLASS_FOCUS_ACTIVE} p,
      html.${CLASS_FOCUS_ACTIVE} article,
      html.${CLASS_FOCUS_ACTIVE} li,
      html.${CLASS_FOCUS_ACTIVE} blockquote,
      html.${CLASS_FOCUS_ACTIVE} h1,
      html.${CLASS_FOCUS_ACTIVE} h2,
      html.${CLASS_FOCUS_ACTIVE} h3 {
        transition: opacity 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease !important;
      }

      /* Highlight hovered paragraph or heading */
      html.${CLASS_FOCUS_ACTIVE} p:hover,
      html.${CLASS_FOCUS_ACTIVE} li:hover,
      html.${CLASS_FOCUS_ACTIVE} blockquote:hover,
      html.${CLASS_FOCUS_ACTIVE} h1:hover,
      html.${CLASS_FOCUS_ACTIVE} h2:hover,
      html.${CLASS_FOCUS_ACTIVE} h3:hover {
        opacity: 1.0 !important;
        background-color: rgba(108, 76, 224, 0.07) !important;
        box-shadow: -4px 0 0 0 #6c4ce0, 0 2px 8px rgba(0, 0, 0, 0.05) !important;
        padding-left: 8px !important;
        border-radius: 4px !important;
      }
    `);
  }

  function revert() {
    document.documentElement.classList.remove(CLASS_FOCUS_ACTIVE);
    dom.removeStyle(STYLE_ID);
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.focus = { apply, revert };
})();
