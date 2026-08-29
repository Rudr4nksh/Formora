/**
 * Formora — transformation configuration schema
 */
(function () {
  const NS = (window.__formora = window.__formora || {});

  const FONT_SIZES = ['small', 'medium', 'large', 'x-large'];
  const FONT_FAMILIES = ['system', 'serif', 'sans', 'dyslexia', 'mono'];
  const DENSITIES = ['low', 'medium', 'high'];

  const DEFAULT_CONFIG = {
    fontSize: 'medium',
    fontFamily: 'system',
    contentDensity: 'medium',
    highlightActions: false,
    reduceVisualClutter: false,
    autoBoldImportant: false,
    summarizeLongParagraphs: false,
    focusMode: false,
    visualComfort: {
      background: 'default',
      contrast: 'standard',
    },
  };

  /** Merges partial/untrusted input over defaults and coerces values safely */
  function normalizeConfig(input) {
    const cfg = {
      ...DEFAULT_CONFIG,
      visualComfort: { ...DEFAULT_CONFIG.visualComfort }
    };

    if (!input || typeof input !== 'object') return cfg;

    if (FONT_SIZES.includes(input.fontSize)) cfg.fontSize = input.fontSize;
    if (DENSITIES.includes(input.contentDensity)) cfg.contentDensity = input.contentDensity;
    if (FONT_FAMILIES.includes(input.fontFamily)) cfg.fontFamily = input.fontFamily;

    cfg.highlightActions = Boolean(input.highlightActions);
    cfg.reduceVisualClutter = Boolean(input.reduceVisualClutter);
    cfg.autoBoldImportant = Boolean(input.autoBoldImportant);
    cfg.summarizeLongParagraphs = Boolean(input.summarizeLongParagraphs);
    cfg.focusMode = Boolean(input.focusMode);

    const visual = input.visualComfort;
    if (visual && typeof visual === 'object') {
      if (['default', 'warm', 'sepia', 'soft-gray', 'dark', 'black'].includes(visual.background)) {
        cfg.visualComfort.background = visual.background;
      }
      if (['standard', 'increased', 'maximum', 'reduced'].includes(visual.contrast)) {
        cfg.visualComfort.contrast = visual.contrast;
      }
    }

    return cfg;
  }

  NS.config = {
    FONT_SIZES,
    FONT_FAMILIES,
    DENSITIES,
    DEFAULT_CONFIG,
    normalizeConfig,
  };
})();
