/**
 * Formora transformation: fontSize
 *
 * Scales all text on the page by injecting a single <style> tag rather than
 * touching individual elements. This keeps the transformation:
 *   - cheap (one DOM write, no tree walking)
 *   - reversible (remove the tag = fully restored page)
 *   - safe to re-apply (id lookup replaces any previous instance)
 *
 * params: { scale: number }  e.g. 1.25 => 125% text size
 */
window.Formora = window.Formora || {};
window.Formora.transformations = window.Formora.transformations || {};

const FONT_SIZE_STYLE_ID = "formora-style-fontSize";

window.Formora.transformations.fontSize = {
  apply(params) {
    const scale = Number(params && params.scale) || 1;

    let styleEl = document.getElementById(FONT_SIZE_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = FONT_SIZE_STYLE_ID;
      document.documentElement.appendChild(styleEl);
    }

    // html { font-size: X% } scales every `rem`/`em`-based and most
    // browser default font sizes site-wide without walking the DOM.
    styleEl.textContent = `html { font-size: ${scale * 100}% !important; }`;
  },

  revert() {
    const styleEl = document.getElementById(FONT_SIZE_STYLE_ID);
    if (styleEl) styleEl.remove();
  },
};