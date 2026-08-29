/**
 * Formora transformation: lineSpacing
 *
 * A second transformation, included to prove the registry pattern in
 * registry.js is genuinely pluggable and not just a wrapper around
 * fontSize. Same inject/remove <style> approach as fontSize.js.
 *
 * params: { multiplier: number }  e.g. 1.5 => 1.5x line-height
 */
window.Formora = window.Formora || {};
window.Formora.transformations = window.Formora.transformations || {};

const LINE_SPACING_STYLE_ID = "formora-style-lineSpacing";

window.Formora.transformations.lineSpacing = {
  apply(params) {
    const multiplier = Number(params && params.multiplier) || 1;

    let styleEl = document.getElementById(LINE_SPACING_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = LINE_SPACING_STYLE_ID;
      document.documentElement.appendChild(styleEl);
    }

    styleEl.textContent = `body, body * { line-height: ${multiplier} !important; }`;
  },

  revert() {
    const styleEl = document.getElementById(LINE_SPACING_STYLE_ID);
    if (styleEl) styleEl.remove();
  },
};