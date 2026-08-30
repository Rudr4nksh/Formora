/**
 * Formora Background Service Worker (MV3)
 */
const STORAGE_KEYS = { ENABLED: 'formora_enabled', CONFIG: 'formora_config' };

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (_) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/content.js']
      });
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
}

async function pushConfigToActiveTab(config) {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return { ok: false, error: 'no-active-tab' };
  return await sendToTab(tab.id, { type: 'FORMORA_APPLY', config });
}

// --- Messages from external Formora Web App ---
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'FORMORA_CONFIG_PUSH') {
    sendResponse({ ok: false, error: 'unknown-message-type' });
    return false;
  }

  const config = message.config;
  chrome.storage.local.set(
    { [STORAGE_KEYS.CONFIG]: config, [STORAGE_KEYS.ENABLED]: true },
    async () => {
      const result = await pushConfigToActiveTab(config);
      sendResponse({ ok: true, forwarded: result });
    }
  );
  return true;
});

// --- AI Server Query ---
async function analyzeWithAIServer(title, text) {
  try {
    const response = await fetch('http://localhost:8787/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || '', text: (text || '').slice(0, 18000) }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { ok: false, error: result.error || 'AI server error' };
    }
    return { ok: true, summary: result.summary, suggestions: result.suggestions };
  } catch (err) {
    return { ok: false, error: err.message || 'Could not connect to http://localhost:8787' };
  }
}

// --- Popup & Extension Messages ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return undefined;

  if (message.type === 'FORMORA_PUSH_TO_ACTIVE_TAB') {
    pushConfigToActiveTab(message.config).then(sendResponse);
    return true;
  }
  if (message.type === 'FORMORA_ANALYZE_AI') {
    analyzeWithAIServer(message.title, message.text).then(sendResponse);
    return true;
  }
  if (message.type === 'FORMORA_SEND_TO_ACTIVE') {
    getActiveTab().then((tab) => {
      if (!tab || !tab.id) {
        sendResponse({ ok: false, error: 'no-active-tab' });
        return;
      }
      sendToTab(tab.id, message.payload).then(sendResponse);
    });
    return true;
  }
});
