const $ = (id) => document.getElementById(id);

let baseConfig = {
  fontSize: 'medium',
  fontFamily: 'system',
  visualComfort: {
    background: 'default',
    contrast: 'standard'
  }
};

let suggestions = [];
let activeCardIndexes = new Set();

const status = (msg) => {
  if ($('status')) $('status').textContent = msg;
};

function readForm() {
  return {
    fontSize: $('fontSize') ? $('fontSize').value : 'medium',
    fontFamily: $('fontFamily') ? $('fontFamily').value : 'system',
    visualComfort: {
      background: $('background') ? $('background').value : 'default',
      contrast: 'standard'
    }
  };
}

function writeForm(config) {
  const visual = config.visualComfort || {};
  if ($('fontSize')) $('fontSize').value = config.fontSize || 'medium';
  if ($('fontFamily')) $('fontFamily').value = config.fontFamily || 'system';
  if ($('background')) $('background').value = visual.background || 'default';
}

async function message(type, payload = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab');

  try {
    return await chrome.tabs.sendMessage(tab.id, { type, ...payload });
  } catch (err) {
    if (String(err).includes('Receiving end does not exist') || String(err).includes('Could not establish connection')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/content.js']
        });
        return await chrome.tabs.sendMessage(tab.id, { type, ...payload });
      } catch (_) {
        throw new Error('Cannot customize this restricted browser page (e.g. chrome://)');
      }
    }
    throw err;
  }
}

async function getTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || '';
}

async function loadCachedAnalysis(url) {
  if (!url) return false;
  const key = 'formora_analysis_' + url;
  const data = await chrome.storage.local.get([key]);
  const cached = data[key];
  if (cached && cached.suggestions) {
    suggestions = cached.suggestions;
    if ($('pageCard') && cached.page) {
      $('pageCard').className = 'card';
      $('pageCard').innerHTML = `<b>${cached.page.readingMinutes}-minute page</b><br>${cached.page.wordCount.toLocaleString()} words · ${cached.page.headingCount} headings`;
    }
    if (cached.summary && $('result')) {
      $('result').textContent = cached.summary;
      $('result').hidden = false;
    }
    render();
    status('🤖 Saved AI recommendations loaded');
    return true;
  }
  return false;
}

async function saveCachedAnalysis(url, summary, suggestionsData, pageData) {
  if (!url) return;
  const key = 'formora_analysis_' + url;
  await chrome.storage.local.set({
    [key]: {
      summary,
      suggestions: suggestionsData,
      page: pageData,
      timestamp: Date.now()
    }
  });
}

function merge(config, patch) {
  return {
    ...config,
    ...patch,
    visualComfort: {
      ...config.visualComfort,
      ...(patch.visualComfort || {})
    }
  };
}

function removePatch(config, patch) {
  const result = { ...config };
  if (patch.fontSize && result.fontSize === patch.fontSize) {
    result.fontSize = 'medium';
  }
  if (patch.fontFamily && result.fontFamily === patch.fontFamily) {
    result.fontFamily = 'system';
  }
  if (patch.autoBoldImportant && result.autoBoldImportant) {
    result.autoBoldImportant = false;
  }
  if (patch.summarizeLongParagraphs && result.summarizeLongParagraphs) {
    result.summarizeLongParagraphs = false;
  }
  if (patch.focusMode && result.focusMode) {
    result.focusMode = false;
  }
  if (patch.visualComfort?.background && result.visualComfort?.background === patch.visualComfort.background) {
    result.visualComfort = { ...result.visualComfort, background: 'default' };
  }
  return result;
}

async function apply(config) {
  const response = await message('FORMORA_APPLY', { config });
  if (!response?.ok) throw new Error('Apply failed');
  baseConfig = response.config;
  await chrome.storage.local.set({ formora_enabled: true, formora_config: baseConfig });
  writeForm(baseConfig);
}

function render() {
  const container = $('recommendations');
  if (!container) return;
  container.innerHTML = '';

  const fragment = document.createDocumentFragment();

  suggestions.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'card recommendation';
    const isAdded = activeCardIndexes.has(index);

    card.innerHTML = `<div><b>${item.title}</b><p>${item.detail}</p></div><button class="secondary">${
      item.action === 'summary' ? 'Show' : (isAdded ? '✓ Added' : '+ Add')
    }</button>`;

    const btn = card.querySelector('button');
    if (isAdded) {
      btn.style.background = '#dcfce7';
      btn.style.color = '#166534';
    }

    btn.onclick = async () => {
      try {
        if (item.action === 'summary') {
          const response = await message('FORMORA_QUICK_SUMMARY');
          if ($('result')) {
            $('result').textContent = response.summary;
            $('result').hidden = false;
          }
        } else {
          if (activeCardIndexes.has(index)) {
            // TOGGLE OFF: Remove this patch
            activeCardIndexes.delete(index);
            const revertedConfig = removePatch(baseConfig, item.patch);
            await apply(revertedConfig);
            btn.textContent = '+ Add';
            btn.style.background = '';
            btn.style.color = '';
            status('Removed feature from webpage');
          } else {
            // TOGGLE ON: Add this patch
            activeCardIndexes.add(index);
            const stackedConfig = merge(baseConfig, item.patch);
            await apply(stackedConfig);
            btn.textContent = '✓ Added';
            btn.style.background = '#dcfce7';
            btn.style.color = '#166534';
            status('✓ Added feature to webpage!');
          }
        }
      } catch (e) {
        status(e.message || 'Refresh this page, then try again');
      }
    };
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
  if ($('applyAllBtn')) $('applyAllBtn').hidden = !suggestions.some((item) => item.patch);
}

async function fetchAIAnalysis(title, text) {
  const payload = JSON.stringify({ title: title || '', text: (text || '').slice(0, 1200) });
  const urls = ['http://127.0.0.1:8787/api/analyze', 'http://localhost:8787/api/analyze'];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      const result = await response.json();
      if (response.ok && result && result.suggestions) {
        return { ok: true, summary: result.summary, suggestions: result.suggestions };
      }
      if (result && result.error) {
        return { ok: false, error: result.error };
      }
    } catch (_) {}
  }
  return { ok: false, offline: true };
}

async function analyze() {
  status('Analyzing page with AI…');
  try {
    const pageInfo = await message('FORMORA_ANALYZE_PAGE');
    if ($('pageCard') && pageInfo?.page) {
      $('pageCard').className = 'card';
      $('pageCard').innerHTML = `<b>${pageInfo.page.readingMinutes}-minute page</b><br>${pageInfo.page.wordCount.toLocaleString()} words · ${pageInfo.page.headingCount} headings`;
    }

    const currentUrl = await getTabUrl();
    const pageText = pageInfo?.text || (document.body ? document.body.innerText : '');
    const aiResult = await fetchAIAnalysis(document.title, pageText);

    if (aiResult.ok && aiResult.suggestions) {
      suggestions = aiResult.suggestions;
      if (aiResult.summary && $('result')) {
        $('result').textContent = aiResult.summary;
        $('result').hidden = false;
      }
      activeCardIndexes.clear();
      render();
      await saveCachedAnalysis(currentUrl, aiResult.summary, aiResult.suggestions, pageInfo.page);
      status('🤖 AI recommendations ready & saved');
    } else {
      suggestions = pageInfo?.suggestions || [];
      activeCardIndexes.clear();
      render();
      const err = (aiResult.error || '').toLowerCase();
      if (err.includes('quota') || err.includes('rate') || err.includes('limit') || err.includes('429')) {
        status('⏳ Rate limit reached (retry in 30s) — local rules active');
      } else if (aiResult.offline) {
        status('Using local recommendations — AI server offline');
      } else {
        status('Using local recommendations (AI limit reached)');
      }
    }
  } catch (e) {
    status(e.message || 'Refresh this page, then analyze again');
  }
}

if ($('analyzeBtn')) $('analyzeBtn').onclick = analyze;
if ($('applyBtn')) $('applyBtn').onclick = () => apply(readForm()).then(() => status('✓ Applied to webpage!')).catch((e) => status(e.message));

if ($('resetBtn')) {
  $('resetBtn').onclick = async () => {
    try {
      const response = await message('FORMORA_REVERT');
      if (!response?.ok) throw new Error();
      activeCardIndexes.clear();
      baseConfig = {
        fontSize: 'medium',
        fontFamily: 'system',
        visualComfort: { background: 'default', contrast: 'standard' }
      };
      writeForm(baseConfig);
      render();
      await chrome.storage.local.set({ formora_enabled: false, formora_config: baseConfig });
      if ($('result')) $('result').hidden = true;
      status('Page reset');
    } catch (e) {
      status(e.message);
    }
  };
}

if ($('applyAllBtn')) {
  $('applyAllBtn').onclick = async () => {
    try {
      const combined = suggestions.reduce((config, item) => item.patch ? merge(config, item.patch) : config, baseConfig);
      suggestions.forEach((_, idx) => activeCardIndexes.add(idx));
      await apply(combined);
      render();
      $('applyAllBtn').textContent = '✓ All recommendations active!';
      $('applyAllBtn').style.background = '#16a34a';
      status('✓ Applied all AI recommendations together!');
    } catch (e) {
      status(e.message || 'Refresh this page, then try again');
    }
  };
}

// Live auto-apply when user changes font, size, or background
['fontSize', 'fontFamily', 'background'].forEach((id) => {
  const el = $(id);
  if (el) {
    el.onchange = () => apply(readForm()).then(() => status('✓ Applied to webpage!')).catch((e) => status(e.message));
  }
});

// Restore saved config and cached page analysis on popup open
chrome.storage.local.get(['formora_config']).then(({ formora_config }) => {
  if (formora_config) baseConfig = formora_config;
  writeForm(baseConfig);

  getTabUrl().then((url) => {
    loadCachedAnalysis(url);
  });
});
