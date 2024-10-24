import { 
  incrementAndGetTime
} from "./recordingStatus.js";

// function storeMousemove(entry, sendResponse) {
//   chrome.storage.session.set(entry).then(() => {
//     return chrome.storage.session.get(["tabId", "tabUrl", "x", "y", "time"]);
//   })
//   .then(({ tabId, tabUrl, x, y, time }) => {
//     console.log(`Mousemove values set in storage => tabId: ${tabId}, tabUrl: ${tabUrl}, x: ${x}, y: ${y}, time: ${time}`);
//     sendResponse({ tabId, tabUrl, x, y, time });
//   }); 
// }

// function storeMouseClick(entry, sendResponse) {
//   chrome.storage.session.set(entry).then(() => {
//     return chrome.storage.session.get(["tabId", "tabUrl", "x", "y", "targetCssSelector", "time"]);
//   })
//   .then(({ tabId, tabUrl, x, y, targetCssSelector, time }) => {
//     console.log(`Mouse click values set in storage => tabId: ${tabId}, tabUrl: ${tabUrl}, x: ${x}, y: ${y}, time: ${time}, targetCssSelector: ${targetCssSelector}`);
//     sendResponse({ tabId, tabUrl, x, y, targetCssSelector, time });
//   });  
// }

export function storeMouseEvent(recordingId, message, sendResponse) {
  // currently not doing anything with targetCssSelector
  const { action, tabId, tabUrl, x, y, targetCssSelector, time } = message;
  const interval = incrementAndGetTime(recordingId, time);
  const entry = { action, tabId, tabUrl, x, y, interval };
  
  chrome.storage.session.get([recordingId], function(data){
    const currentData = data[recordingId] || [];
    const newData = [
      ...currentData,
      entry
    ];
    console.log(`storage.js: ${action} data being stored => ${ JSON.stringify({ [recordingId]: newData }) }`);
    chrome.storage.session.set({ [recordingId]: newData }, function() {
      sendResponse({ ...entry, time });
    });
  });
}


//mouse moves: 
//  x,y for distance
//  interval between each time


//mouse clicks
//  x,y for location of click
//  event target for click target - when using MouseEvent this is N/A


