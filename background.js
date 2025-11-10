chrome.runtime.onInstalled.addListener(() => {
  console.log("PDF Merge Extension installed.");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // No background logic — just acknowledge
  sendResponse({ ok: true });
  return true;
});
