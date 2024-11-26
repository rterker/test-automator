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
    const nextStepId = data[recordingId]?.nextStepId ?? 0;
    console.log('data[recordingId]:', data[recordingId])
    console.log('nextStepId:', nextStepId)
    entry.stepId = nextStepId;
    const currentData = data[recordingId]?.steps || [];
    console.log('currentData:', currentData)
    const newData = [
      ...currentData,
      entry
    ];
    
    chrome.storage.session.set({ [recordingId]: { nextStepId: nextStepId + 1, steps: newData } }, function() {
      sendResponse({ ...entry, time });
    });
  });
}

// export function storeInputEvent(recordingId, message, sendResponse) {
//   //currently not doing anything with targetCssSelector
//   const { action, tabId, tabUrl, inputText, targetCssSelector, time } = message;
//   const interval = incrementAndGetTime(recordingId, time);
//   const entry = { action, tabId, tabUrl, inputText, interval };

//   chrome.storage.session.get([recordingId], function(data){
//     const nextStepId = data[recordingId]?.nextStepId ?? 0;
//     console.log('data[recordingId]:', data[recordingId])
//     console.log('nextStepId:', nextStepId)
//     entry.stepId = nextStepId;
//     const currentData = data[recordingId]?.steps || [];
//     console.log('currentData:', currentData)
//     const newData = [
//       ...currentData,
//       entry
//     ];
    
//     chrome.storage.session.set({ [recordingId]: { nextStepId: nextStepId + 1, steps: newData } }, function() {
//       sendResponse({ ...entry, time });
//     });
//   });
// }

export function storeKeydownEvent(recordingId, message, sendResponse) {
  const entry = createEntry(recordingId, message);

  chrome.storage.session.get([recordingId], function(data){
    const nextStepId = data[recordingId]?.nextStepId ?? 0;
    console.log('data[recordingId]:', data[recordingId])
    console.log('nextStepId:', nextStepId)
    entry.stepId = nextStepId;
    const currentData = data[recordingId]?.steps || [];
    console.log('currentData:', currentData)
    const newData = [
      ...currentData,
      entry
    ];
    
    chrome.storage.session.set({ [recordingId]: { nextStepId: nextStepId + 1, steps: newData } }, function() {
      sendResponse({ ...entry, time: message.time });
    });
  });
}

export function getPlaybackObject(recordingId) {
  return new Promise((resolve, reject) => {
    chrome.storage.session.get([recordingId], function(data){
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      return resolve(data);
    });
  });
}

function createEntry(recordingId, messageObject) {
  const interval = incrementAndGetTime(recordingId, messageObject.time);
  const entry = { interval };
  for (let key in messageObject) {
    entry[key] = messageObject[key];
  }
  console.log('entry in storage.js: ', entry);
  return entry;
}


//mouse moves: 
//  x,y for distance
//  interval between each time


//mouse clicks
//  x,y for location of click
//  event target for click target - when using MouseEvent this is N/A
