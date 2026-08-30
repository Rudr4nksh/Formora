/**
 * Formora transformation: Auto-bold key text / Bionic reading
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const CLASS = 'formora-important';
  const STYLE_ID = 'formora-style-emphasis';

  function bionicTransform(text) {
    return text.replace(/\b[a-zA-Z]{2,}\b/g, (word) => {
      const mid = Math.max(1, Math.ceil(word.length * 0.45));
      return `<b class="${CLASS}" ${dom.MARK_ATTR}="1">${word.slice(0, mid)}</b>${word.slice(mid)}`;
    });
  }

  function detect(root = document) {
    dom.qsa('p, li, article p', root).forEach((el) => {
      if (el.dataset.formoraBionic) return;
      el.dataset.formoraBionic = '1';
      const originalHtml = el.innerHTML;
      el.dataset.formoraOriginal = originalHtml;

      // Transform text nodes inside paragraph
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.parentElement || node.parentElement.closest(`.${CLASS}, script, style, textarea, input, button, select, [contenteditable]`)) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.nodeValue.trim().length > 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });

      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);

      nodes.slice(0, 150).forEach((node) => {
        const span = document.createElement('span');
        span.setAttribute(dom.MARK_ATTR, '1');
        span.innerHTML = bionicTransform(node.nodeValue);
        node.parentNode.replaceChild(span, node);
      });
    });
  }

  function apply(config) {
    if (!config.autoBoldImportant) {
      revert();
      return;
    }

    dom.injectStyle(STYLE_ID, `
      .${CLASS} {
        font-weight: 800 !important;
        color: inherit !important;
      }
    `);

    detect(document.body);
  }

  function revert() {
    dom.removeStyle(STYLE_ID);
    dom.qsa('[data-formora-bionic]').forEach((el) => {
      if (el.dataset.formoraOriginal) {
        el.innerHTML = el.dataset.formoraOriginal;
      }
      delete el.dataset.formoraBionic;
      delete el.dataset.formoraOriginal;
    });
    dom.unmarkAll(document);
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.emphasis = { apply, revert, detect };
})();
