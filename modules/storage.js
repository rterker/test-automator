import { 
  incrementAndGetTime
} from "./recordingStatus.js";

export function storeEvent(recordingId, message, sendResponse) {
  const { time } = message;
  const entry = createEntry(message);
  const interval = incrementAndGetTime(recordingId, time);
  entry.interval = interval;

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
      sendResponse({ ...entry });
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

function createEntry(messageObject) {
  const entry = {};
  for (let key in messageObject) {
    entry[key] = messageObject[key];
  }
  return entry;
}