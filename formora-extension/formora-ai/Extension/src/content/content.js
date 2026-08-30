/**
 * Formora Content Script — Entity, Name & Title Auto-Bolding Engine
 */
(function () {
  if (window.__formora_injected) return;
  window.__formora_injected = true;

  const STYLE_ID = 'formora-injected-style';
  const BIONIC_CLASS = 'formora-bionic-bold';
  const SUMMARY_CLASS = 'formora-summary-block';
  const FOCUS_CLASS = 'formora-focus-mode';

  // Advanced Entity, Name & Title Keyword Regex:
  // 1. Honorifics & Full Names (e.g. Dr. Albert Einstein, President Washington, Mr. John Smith)
  // 2. Multi-word Proper Entities (e.g. United States, Google DeepMind, World War II)
  // 3. Single Capitalized Proper Nouns (e.g. Wikipedia, Formora, Python, London)
  // 4. Dates, Currency, Percentages & Numbers (e.g. January 2001, $100, 50%, 2026)
  // 5. Key Subject Terms (7+ character domain words)
  const KEYWORD_REGEX = /\b(?:(?:Mr|Ms|Mrs|Dr|Prof|Sir|Lord|President|Prime Minister|CEO|Founder|Director|Chairman|King|Queen|Captain|General)\.?\s+)?[A-Z][a-z0-9_-]+(?:\s+[A-Z][a-z0-9_-]+)*\b|\b(?:\d[\d,.]*%?|\$\d[\d,.]*|₹\s?\d[\d,.]*|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s+\d{4})?|[a-zA-Z]{7,})\b/g;

  let currentConfig = null;

  function injectCSS(id, css) {
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      (document.head || document.documentElement).appendChild(style);
    }
    if (style.textContent !== css) {
      style.textContent = css;
    }
  }

  function removeCSS(id) {
    const style = document.getElementById(id);
    if (style) style.remove();
  }

  // Extract core reading text without navbar/footer clutter for >85% token savings
  function extractCoreText() {
    const nodes = Array.from(document.querySelectorAll('h1, h2, h3, main p, article p, p, blockquote'))
      .map((el) => el.innerText.trim())
      .filter((t) => t.length > 25);
    const uniqueText = Array.from(new Set(nodes)).join('\n');
    return (uniqueText || document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
  }

  // --- 1 & 4. Comprehensive Dark Mode & Typography CSS ---
  function applyCssTransformations(config) {
    const families = {
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", serif',
      dyslexia: 'OpenDyslexic, "Comic Sans MS", Arial, sans-serif',
      mono: 'Consolas, Monaco, "Courier New", monospace'
    };

    const themes = {
      warm: { bg: '#faf6ee', text: '#2c2620', cardBg: '#f3ece0', link: '#8c4800' },
      sepia: { bg: '#f4ecd8', text: '#3b3127', cardBg: '#eae1cc', link: '#7a4210' },
      'soft-gray': { bg: '#f1f5f9', text: '#1e293b', cardBg: '#e2e8f0', link: '#2563eb' },
      dark: { bg: '#18191c', text: '#e2e8f0', cardBg: '#222429', link: '#60a5fa' },
      black: { bg: '#000000', text: '#f1f5f9', cardBg: '#121212', link: '#93c5fd' }
    };

    const font = families[config.fontFamily] || '';
    const scaleMap = { small: 0.95, medium: 1.0, large: 1.12, 'x-large': 1.25 };
    const scale = scaleMap[config.fontSize] || 1.0;

    const themeKey = config.visualComfort?.background || 'default';
    const theme = themes[themeKey] || null;

    // Apply document-level proportional page zoom
    if (scale !== 1.0) {
      document.documentElement.style.zoom = String(scale);
    } else {
      document.documentElement.style.zoom = '';
    }

    let fontCss = '';
    if (font) {
      fontCss = `
        html[data-formora-active] p,
        html[data-formora-active] li,
        html[data-formora-active] article,
        html[data-formora-active] h1,
        html[data-formora-active] h2,
        html[data-formora-active] h3,
        html[data-formora-active] h4,
        html[data-formora-active] h5,
        html[data-formora-active] h6,
        html[data-formora-active] blockquote,
        html[data-formora-active] span,
        html[data-formora-active] a {
          font-family: ${font} !important;
        }
      `;
    }

    let themeCss = '';
    if (theme) {
      themeCss = `
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
        html[data-formora-active] tbody,
        html[data-formora-active] tr,
        html[data-formora-active] td,
        html[data-formora-active] th,
        html[data-formora-active] ul,
        html[data-formora-active] ol,
        html[data-formora-active] li,
        html[data-formora-active] form,
        html[data-formora-active] fieldset,
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
        html[data-formora-active] summary,
        html[data-formora-active] b,
        html[data-formora-active] strong,
        html[data-formora-active] em,
        html[data-formora-active] i,
        html[data-formora-active] code,
        html[data-formora-active] pre,
        html[data-formora-active] dt,
        html[data-formora-active] dd {
          color: ${theme.text} !important;
        }
        html[data-formora-active] a,
        html[data-formora-active] a * {
          color: ${theme.link} !important;
        }
      `;
    }

    let featureCss = '';
    if (themeKey === 'dark' || themeKey === 'black') {
      featureCss = `
        html[data-formora-active] b.formora-bionic-bold {
          color: #ffffff !important;
          font-weight: 800 !important;
        }
        html[data-formora-active] details.formora-summary-block {
          background: #232238 !important;
          color: #e2e8f0 !important;
          border-left-color: #8b5cf6 !important;
        }
        html[data-formora-active] details.formora-summary-block summary {
          color: #c4b5fd !important;
        }
        html[data-formora-active].formora-focus-mode p:hover,
        html[data-formora-active].formora-focus-mode li:hover,
        html[data-formora-active].formora-focus-mode h1:hover,
        html[data-formora-active].formora-focus-mode h2:hover,
        html[data-formora-active].formora-focus-mode h3:hover {
          background-color: rgba(139, 92, 246, 0.18) !important;
          box-shadow: -4px 0 0 0 #a78bfa, 0 2px 8px rgba(0,0,0,0.4) !important;
        }
      `;
    }

    if (fontCss || themeCss || scale !== 1.0) {
      injectCSS(STYLE_ID, `
        ${themeCss}
        ${fontCss}
        ${featureCss}
        body, p, li, article, h1, h2, h3 {
          transition: background-color 0.2s ease, color 0.2s ease !important;
        }
      `);
      document.documentElement.setAttribute('data-formora-active', '1');
    } else {
      removeCSS(STYLE_ID);
      document.documentElement.removeAttribute('data-formora-active');
    }
  }

  // --- 2. Entity, Name & Title Keyword Bolding ---
  function applyBionicReading(enable) {
    document.querySelectorAll('[data-formora-bionic-orig]').forEach((el) => {
      el.innerHTML = el.dataset.formoraBionicOrig;
      delete el.dataset.formoraBionicOrig;
    });

    if (!enable) return;

    const paragraphs = Array.from(document.querySelectorAll('p, article p, li')).slice(0, 30);

    paragraphs.forEach((p) => {
      if (p.textContent.trim().length < 20 || p.closest(`.${SUMMARY_CLASS}`) || p.dataset.formoraBionicOrig) return;
      p.dataset.formoraBionicOrig = p.innerHTML;

      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
      const textNodes = [];
      let n;
      while ((n = walker.nextNode())) textNodes.push(n);

      textNodes.slice(0, 40).forEach((node) => {
        if (!node.parentElement || ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'BUTTON', 'DETAILS', 'SUMMARY'].includes(node.parentElement.tagName)) return;
        const text = node.nodeValue;
        if (!text || text.trim().length < 3) return;

        const html = text.replace(KEYWORD_REGEX, (match) => {
          return `<b class="${BIONIC_CLASS}" style="font-weight:800!important;">${match}</b>`;
        });

        const span = document.createElement('span');
        span.innerHTML = html;
        node.parentNode.replaceChild(span, node);
      });
    });
  }

  // --- 3. Paragraph Summaries ---
  function applyParagraphSummaries(enable) {
    document.querySelectorAll(`.${SUMMARY_CLASS}`).forEach((el) => el.remove());

    if (!enable) return;

    const paragraphs = Array.from(document.querySelectorAll('p')).slice(0, 20);
    paragraphs.forEach((p) => {
      if (p.textContent.trim().length > 260 && !p.nextElementSibling?.classList?.contains(SUMMARY_CLASS)) {
        const sentences = p.textContent.trim().match(/[^.!?]+[.!?]+/g) || [];
        const previewText = sentences.slice(0, 2).join(' ').trim();
        if (!previewText) return;

        const details = document.createElement('details');
        details.className = SUMMARY_CLASS;
        details.style.cssText = 'margin:0.6em 0;padding:0.6em 0.9em;border-left:4px solid #6c4ce0;background:#f5f2ff;color:#303047;border-radius:4px;font-size:0.9em;';
        details.innerHTML = `<summary style="cursor:pointer;font-weight:700;color:#5c42d9;">💡 Paragraph summary</summary><p style="margin:0.4em 0 0!important;line-height:1.45!important;">${previewText}</p>`;
        p.insertAdjacentElement('afterend', details);
      }
    });
  }

  // --- 5. Focus Mode ---
  function applyFocusMode(enable) {
    removeCSS('formora-focus-style');

    if (!enable) {
      document.documentElement.classList.remove(FOCUS_CLASS);
      return;
    }

    document.documentElement.classList.add(FOCUS_CLASS);
    injectCSS('formora-focus-style', `
      html.${FOCUS_CLASS} p,
      html.${FOCUS_CLASS} li,
      html.${FOCUS_CLASS} h1,
      html.${FOCUS_CLASS} h2,
      html.${FOCUS_CLASS} h3 {
        transition: background-color 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease !important;
      }
      html.${FOCUS_CLASS} p:hover,
      html.${FOCUS_CLASS} li:hover,
      html.${FOCUS_CLASS} h1:hover,
      html.${FOCUS_CLASS} h2:hover,
      html.${FOCUS_CLASS} h3:hover {
        background-color: rgba(108, 76, 224, 0.08) !important;
        box-shadow: -4px 0 0 0 #6c4ce0, 0 2px 8px rgba(0,0,0,0.06) !important;
        padding-left: 8px !important;
        border-radius: 3px !important;
      }
    `);
  }

  // --- Main Unified Apply Handler ---
  function applyAll(config) {
    currentConfig = config;
    applyCssTransformations(config);
    applyParagraphSummaries(Boolean(config.summarizeLongParagraphs));
    applyBionicReading(Boolean(config.autoBoldImportant));
    applyFocusMode(Boolean(config.focusMode));
  }

  function revertAll() {
    currentConfig = null;
    document.documentElement.style.zoom = '';
    removeCSS(STYLE_ID);
    removeCSS('formora-focus-style');
    applyBionicReading(false);
    applyParagraphSummaries(false);
    applyFocusMode(false);
    document.documentElement.removeAttribute('data-formora-active');
  }

  function inspect() {
    const text = extractCoreText();
    const wordCount = text ? text.split(' ').length : 0;
    const headingCount = document.querySelectorAll('h1, h2, h3').length;
    return {
      ok: true,
      text,
      page: { wordCount, headingCount, readingMinutes: Math.max(1, Math.ceil(wordCount / 220)) }
    };
  }

  // --- Message Listener ---
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;

    if (msg.type === 'FORMORA_APPLY') {
      applyAll(msg.config);
      sendResponse({ ok: true, config: msg.config });
    } else if (msg.type === 'FORMORA_REVERT') {
      revertAll();
      sendResponse({ ok: true });
    } else if (msg.type === 'FORMORA_ANALYZE_PAGE') {
      sendResponse(inspect());
    } else if (msg.type === 'FORMORA_PING') {
      sendResponse({ ok: true, active: Boolean(currentConfig) });
    }
    return true;
  });
})();
