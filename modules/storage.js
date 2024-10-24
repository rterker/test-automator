export function storeMousemove(entry, sendResponse) {
  chrome.storage.session.set(entry).then(() => {
    return chrome.storage.session.get(["tabId", "tabUrl", "x", "y", "time"]);
  })
  .then(({ tabId, tabUrl, x, y, time }) => {
    console.log(`Mousemove values set in storage => tabId: ${tabId}, tabUrl: ${tabUrl}, x: ${x}, y: ${y}, time: ${time}`);
    sendResponse({ tabId, tabUrl, x, y, time });
  }); 
}

export function storeMouseClick(entry, sendResponse) {
  chrome.storage.session.set(entry).then(() => {
    return chrome.storage.session.get(["tabId", "tabUrl", "x", "y", "targetCssSelector", "time"]);
  })
  .then(({ tabId, tabUrl, x, y, targetCssSelector, time }) => {
    console.log(`Mouse click values set in storage => tabId: ${tabId}, tabUrl: ${tabUrl}, x: ${x}, y: ${y}, time: ${time}, targetCssSelector: ${targetCssSelector}`);
    sendResponse({ tabId, tabUrl, x, y, targetCssSelector, time });
  });  
}