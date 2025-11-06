chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "getRecentPDFs") {
    chrome.downloads.search({ limit: 10, orderBy: ['-startTime'] }, (results) => {
      const pdfs = results
        .filter(f => f.filename.endsWith(".pdf"))
        .map(f => ({ id: f.id, filename: f.filename, url: f.url }));
      sendResponse(pdfs);
    });
    return true; // keep the message channel open
  }
});