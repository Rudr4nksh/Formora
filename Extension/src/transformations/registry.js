/**
 * Formora — transformation engine.
 *
 * This is the piece that turns a "Transformation Configuration" (produced
 * by the web app) into actual DOM changes. It knows nothing about Chrome
 * messaging or storage — it just takes a config object and applies/reverts
 * whatever transformation types it recognizes.
 *
 * To add a new transformation for the hackathon:
 *   1. Create src/transformations/<name>.js following fontSize.js's shape:
 *        { apply(params), revert() }
 *   2. Register it in TRANSFORMATION_TYPES below.
 *   3. Add the new <script> to manifest.json's content_scripts.js array
 *      (before registry.js, since registry.js reads from it at apply-time).
 *
 * Not implemented yet (left as placeholders for the team / stretch goals):
 *   - contrast       (increase color contrast for readability)
 *   - hideElement     (remove/hide distracting elements, e.g. ads)
 *   - colorTheme      (dark mode / custom palette overrides)
 */
window.Formora = window.Formora || {};

// Maps a config entry's `type` field to the module that implements it.
const TRANSFORMATION_TYPES = {
  fontSize: () => window.Formora.transformations.fontSize,
  lineSpacing: () => window.Formora.transformations.lineSpacing,
};

function applyConfig(config) {
  if (!config || !Array.isArray(config.transformations)) return;

  for (const rule of config.transformations) {
    const getModule = TRANSFORMATION_TYPES[rule.type];
    if (!getModule) {
      console.warn(`[Formora] Unknown transformation type: "${rule.type}"`);
      continue;
    }

    const module = getModule();
    if (!module) continue;

    if (rule.enabled) {
      module.apply(rule.params || {});
    } else {
      module.revert();
    }
  }
}

function resetAll() {
  for (const key of Object.keys(TRANSFORMATION_TYPES)) {
    const module = TRANSFORMATION_TYPES[key]();
    if (module) module.revert();
  }
}

window.Formora.engine = { applyConfig, resetAll };