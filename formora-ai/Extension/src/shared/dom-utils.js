/**
 * Formora — DOM utilities
 *
 * Content scripts in MV3 don't share an ES module graph by default, so every
 * file in this extension attaches itself to a single global namespace,
 * `window.__formora`. Load order is controlled in manifest.json.
 */
(function () {
  const NS = (window.__formora = window.__formora || {});

  const MARK_ATTR = 'data-formora-marked'; // marks any element Formora has touched
  const ROOT_ATTR = 'data-formora-active'; // set on <html> while Formora is on

  function qs(selector, root = document) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function qsa(selector, root = document) {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  /** Adds one or more classes and records that Formora touched this element,
   *  so it can be found again during revert without a full class list. */
  function mark(el, ...classes) {
    if (!el) return;
    el.classList.add(...classes);
    el.setAttribute(MARK_ATTR, '1');
  }

  /** Removes every class starting with "formora-" from a single element. */
  function unmarkElement(el) {
    if (!el) return;
    const toRemove = Array.from(el.classList).filter((c) => c.startsWith('formora-'));
    if (toRemove.length) el.classList.remove(...toRemove);
    el.removeAttribute(MARK_ATTR);
  }

  /** Sweeps the whole document (or a root) for anything Formora marked and
   *  strips its classes/attributes. This is the main revert mechanism for
   *  detection-based transformations (buttons, navigation, clutter). */
  function unmarkAll(root = document) {
    qsa(`[${MARK_ATTR}]`, root).forEach(unmarkElement);
  }

  /** Injects (or replaces) a <style> tag owned by Formora. Centralizing this
   *  makes every CSS-based transformation reversible with one call. */
  function injectStyle(id, css) {
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      tag.setAttribute('data-formora-style', '1');
      document.documentElement.appendChild(tag);
    }
    tag.textContent = css;
    return tag;
  }

  function removeStyle(id) {
    const tag = document.getElementById(id);
    if (tag) tag.remove();
  }

  function removeAllFormoraStyles() {
    qsa('[data-formora-style]').forEach((el) => el.remove());
  }

  function debounce(fn, wait = 200) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  NS.dom = {
    MARK_ATTR,
    ROOT_ATTR,
    qs,
    qsa,
    isVisible,
    mark,
    unmarkElement,
    unmarkAll,
    injectStyle,
    removeStyle,
    removeAllFormoraStyles,
    debounce,
  };
})();
