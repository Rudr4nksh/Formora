/**
 * Formora — default transformation configuration.
 *
 * This is the shape the web app is expected to produce and hand to the
 * extension. For the hackathon foundation we hardcode a sample config here
 * so the extension is fully testable before the web app's config export
 * exists. Once Team 1's web app is ready, this same shape will arrive via
 * chrome.storage (set by background.js from an externally_connectable
 * message) instead of this constant.
 *
 * Config shape:
 * {
 *   version: number,
 *   updatedAt: string (ISO date),
 *   transformations: [
 *     {
 *       id: string,          // unique id for this rule
 *       type: string,        // maps to a key in the transformation registry
 *       enabled: boolean,
 *       params: object        // transformation-specific options
 *     },
 *     ...
 *   ]
 * }
 */
window.Formora = window.Formora || {};

window.Formora.DEFAULT_CONFIG = {
  version: 1,
  updatedAt: null,
  transformations: [
    {
      id: "increase-text-size",
      type: "fontSize",
      enabled: true,
      params: { scale: 1.25 }, // 125% of original size
    },
    {
      id: "comfortable-line-spacing",
      type: "lineSpacing",
      enabled: false,
      params: { multiplier: 1.5 },
    },
  ],
};

window.Formora.STORAGE_KEY = "formora_config";