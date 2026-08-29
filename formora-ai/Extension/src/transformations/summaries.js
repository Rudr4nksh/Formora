/**
 * Formora transformation: Summarize Paragraphs
 */
(function () {
  const NS = (window.__formora = window.__formora || {});
  const { dom } = NS;

  const CLASS = 'formora-paragraph-summary';
  const STYLE_ID = 'formora-style-summaries';

  function detect(root = document) {
    dom.qsa('p', root)
      .filter((p) => p.textContent.trim().length > 250 && !p.nextElementSibling?.classList?.contains(CLASS))
      .slice(0, 40)
      .forEach((p) => {
        const sentences = p.textContent.trim().match(/[^.!?]+[.!?]+/g) || [];
        const extract = sentences.slice(0, 2).join(' ').trim();
        if (!extract) return;

        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const preview = document.createElement('p');

        details.className = CLASS;
        details.setAttribute(dom.MARK_ATTR, '1');
        summary.textContent = '💡 Paragraph summary';
        preview.textContent = extract;

        details.append(summary, preview);
        p.insertAdjacentElement('afterend', details);
      });
  }

  function apply(config) {
    if (!config.summarizeLongParagraphs) {
      revert();
      return;
    }

    dom.injectStyle(STYLE_ID, `
      .${CLASS} {
        margin: 0.6em 0;
        padding: 0.6em 0.9em;
        border-left: 3px solid #6c4ce0;
        background: #f5f2ff;
        color: #303047;
        border-radius: 4px;
        font-size: 0.9em;
      }
      .${CLASS} summary {
        cursor: pointer;
        font-weight: 700;
        color: #5c42d9;
      }
      .${CLASS} p {
        margin: 0.5em 0 0 !important;
        line-height: 1.45 !important;
      }
    `);

    detect(document.body);
  }

  function revert() {
    dom.removeStyle(STYLE_ID);
    dom.qsa(`.${CLASS}`).forEach((el) => el.remove());
  }

  NS.transformations = NS.transformations || {};
  NS.transformations.summaries = { apply, revert, detect };
})();
