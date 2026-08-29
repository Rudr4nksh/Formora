/**
 * Formora popup
 *
 * Reads current state from chrome.storage on open, reflects it in the
 * form, and sends FORMORA_APPLY / FORMORA_REVERT to the active tab's
 * content script whenever the user flips the master toggle or clicks
 * "Apply".
 */

const STORAGE_KEYS = { ENABLED: 'formora_enabled', CONFIG: 'formora_config' };

const els = {
  masterToggle: document.getElementById('masterToggle'),
  controls: document.getElementById('controls'),
  fontSize: document.getElementById('fontSize'),
  contentDensity: document.getElementById('contentDensity'),
  simplifyNavigation: document.getElementById('simplifyNavigation'),
  highlightActions: document.getElementById('highlightActions'),
  reduceVisualClutter: document.getElementById('reduceVisualClutter'),
  applyBtn: document.getElementById('applyBtn'),
  status: document.getElementById('status'),
};

function readForm() {
  return {
    fontSize: els.fontSize.value,
    contentDensity: els.contentDensity.value,
    simplifyNavigation: els.simplifyNavigation.checked,
    highlightActions: els.highlightActions.checked,
    reduceVisualClutter: els.reduceVisualClutter.checked,
  };
}

function writeForm(config) {
  if (!config) return;
  els.fontSize.value = config.fontSize || 'medium';
  els.contentDensity.value = config.contentDensity || 'medium';
  els.simplifyNavigation.checked = Boolean(config.simplifyNavigation);
  els.highlightActions.checked = Boolean(config.highlightActions);
  els.reduceVisualClutter.checked = Boolean(config.reduceVisualClutter);
}

function setControlsEnabled(enabled) {
  els.controls.style.opacity = enabled ? '1' : '0.5';
  Array.from(els.controls.querySelectorAll('select, input, button')).forEach((el) => {
    if (el.id !== 'masterToggle') el.disabled = !enabled;
  });
}

function setStatus(text, timeout = 1500) {
  els.status.textContent = text;
  if (timeout) setTimeout(() => (els.status.textContent = ''), timeout);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToActiveTab(message) {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return { ok: false, error: 'no-active-tab' };
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    // Most common cause: content script isn't injected on this page
    // (chrome:// URLs, the Chrome Web Store, etc.)
    return { ok: false, error: String(err) };
  }
}

async function loadInitialState() {
  const stored = await chrome.storage.local.get([STORAGE_KEYS.ENABLED, STORAGE_KEYS.CONFIG]);
  const enabled = Boolean(stored[STORAGE_KEYS.ENABLED]);
  const config = stored[STORAGE_KEYS.CONFIG];

  els.masterToggle.checked = enabled;
  setControlsEnabled(enabled);
  if (config) writeForm(config);
}

async function applyCurrentConfig() {
  const config = readForm();
  els.applyBtn.disabled = true;
  const result = await sendToActiveTab({ type: 'FORMORA_APPLY', config });
  els.applyBtn.disabled = false;

  if (result && result.ok) {
    setStatus('Applied ✓');
  } else {
    setStatus('Could not apply on this page');
  }
}

async function handleMasterToggle() {
  const enabled = els.masterToggle.checked;
  setControlsEnabled(enabled);

  if (enabled) {
    await applyCurrentConfig();
  } else {
    const result = await sendToActiveTab({ type: 'FORMORA_REVERT' });
    setStatus(result && result.ok ? 'Reverted' : 'Could not revert on this page');
  }
}

els.masterToggle.addEventListener('change', handleMasterToggle);
els.applyBtn.addEventListener('click', applyCurrentConfig);

loadInitialState();
