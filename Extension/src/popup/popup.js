/**
 * Formora — popup script.
 *
 * Popups run in their own extension page context, so — like
 * background.js — these constants are duplicated from
 * src/shared/messageTypes.js. Keep them in sync if either file changes.
 *
 * This is the "prove the pipeline works" entry point:
 *   click button -> sendMessage to content script -> engine.applyConfig ->
 *   DOM changes visibly on the page behind the popup.
 */
const STORAGE_KEY = "formora_config";

const MessageTypes = {
  APPLY_CONFIG: "FORMORA_APPLY_CONFIG",
  RESET_CONFIG: "FORMORA_RESET_CONFIG",
  GET_STATE: "FORMORA_GET_STATE",
};

const TEST_CONFIG = {
  version: 1,
  updatedAt: new Date().toISOString(),
  transformations: [
    {
      id: "increase-text-size",
      type: "fontSize",
      enabled: true,
      params: { scale: 1.25 },
    },
  ],
};

const statusEl = document.getElementById("status");
const applyBtn = document.getElementById("applyBtn");
const resetBtn = document.getElementById("resetBtn");

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setStatus(text, tone = "info") {
  statusEl.textContent = text;
  statusEl.style.color = tone === "error" ? "#b91c1c" : "#4f46e5";
  statusEl.style.background = tone === "error" ? "#fef2f2" : "#eef2ff";
}

// Ask the content script what state it's currently in, so the popup UI
// reflects reality rather than assuming.
async function refreshStatus() {
  const tab = await getActiveTab();
  if (!tab || !tab.url || !/^https?:\/\//.test(tab.url)) {
    setStatus("Formora can't run on this page.", "error");
    applyBtn.disabled = true;
    resetBtn.disabled = true;
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: MessageTypes.GET_STATE }, (response) => {
    if (chrome.runtime.lastError || !response) {
      // Most likely the content script hasn't loaded yet on this tab
      // (e.g. extension was just installed). A page refresh fixes it.
      setStatus("Not connected yet — try refreshing the page.", "error");
      return;
    }
    const hasConfig = response.config && response.config.transformations?.length;
    setStatus(hasConfig ? "Transformation active on this page." : "Ready — no transformation applied yet.");
  });
}

applyBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab) return;

  chrome.tabs.sendMessage(tab.id, { type: MessageTypes.APPLY_CONFIG, config: TEST_CONFIG }, (response) => {
    if (chrome.runtime.lastError || !response) {
      setStatus("Couldn't reach the page — try refreshing it.", "error");
      return;
    }
    chrome.storage.local.set({ [STORAGE_KEY]: TEST_CONFIG });
    setStatus("Text size increased on this page ✓");
  });
});

resetBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab) return;

  chrome.tabs.sendMessage(tab.id, { type: MessageTypes.RESET_CONFIG }, (response) => {
    if (chrome.runtime.lastError || !response) {
      setStatus("Couldn't reach the page — try refreshing it.", "error");
      return;
    }
    chrome.storage.local.remove(STORAGE_KEY);
    setStatus("Page reset to normal.");
  });
});

refreshStatus();
