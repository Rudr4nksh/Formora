/**
 * Formora — transformation configuration schema
 *
 * This is the contract between the web app (Team 1) and the extension
 * (Team 2). The web app produces an object matching this shape; the
 * extension only ever reads it.
 */
(function () {
  const NS = (window.__formora = window.__formora || {});

  const FONT_SIZES = ['small', 'medium', 'large', 'x-large'];
  const DENSITIES = ['low', 'medium', 'high']; // "low" = spacious, "high" = compact

  const DEFAULT_CONFIG = {
    fontSize: 'medium',
    contentDensity: 'medium',
    simplifyNavigation: false,
    highlightActions: false,
    reduceVisualClutter: false,
  };

  /** Merges partial/untrusted input over the defaults and coerces bad
   *  values back to something safe, instead of throwing. Configs may come
   *  from an external website via postMessage, so never trust them blindly. */
  function normalizeConfig(input) {
    const cfg = { ...DEFAULT_CONFIG };
    if (!input || typeof input !== 'object') return cfg;

    if (FONT_SIZES.includes(input.fontSize)) cfg.fontSize = input.fontSize;
    if (DENSITIES.includes(input.contentDensity)) cfg.contentDensity = input.contentDensity;

    cfg.simplifyNavigation = Boolean(input.simplifyNavigation);
    cfg.highlightActions = Boolean(input.highlightActions);
    cfg.reduceVisualClutter = Boolean(input.reduceVisualClutter);

    return cfg;
  }

  NS.config = {
    FONT_SIZES,
    DENSITIES,
    DEFAULT_CONFIG,
    normalizeConfig,
  };
})();
