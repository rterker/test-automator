import { 
  incrementAndGetTime
} from "./recording.js";

//No need to get storage object for recordingId b/c this is the initial storage for each recordingId, so nothing is being overwritten
export function storeInitUrl(recordingId, initUrl) {
  return new Promise((resolve, reject) => {
    chrome.storage.session.set({ [recordingId]: { initUrl } }, function(err) {
      console.log(`storeInitUrl: recordingId ${recordingId} initUrl after update ${JSON.stringify({ [recordingId]: { initUrl } }, null, 2)}`);
      if (err) {
        console.error(`Error occured in storeInitUrl: ${err.message}`);
        return reject({ status: 'fail', error: err });
      }
      return resolve({ status: 'success' });
    });
  });
}

export function storeInitialValue(recordingId, message, next) {
  const { targetCssSelector, elementValue } = message;
  const entry = {
    [targetCssSelector] : elementValue
  };
  chrome.storage.session.get(recordingId, function(data) {
    console.log(`storeInitialValue: new entry is ${JSON.stringify(entry, null, 2)}`);
    const recordingObject = data[recordingId] ?? {};
    const initialValues = recordingObject?.initialValues ?? {};
    const newInitialValues = {
      ...initialValues,
      ...entry
    };
    console.log(`storeInitialValue: new initial values after update is ${JSON.stringify(newInitialValues, null, 2)}`);

    const newRecordingObject = {
      ...recordingObject,
      initialValues: newInitialValues
    };
    
    chrome.storage.session.set({ [recordingId]: newRecordingObject }, function() {
      console.log(`storeInitialValue: newRecordingObject for ${recordingId} after update: ${JSON.stringify({ [recordingId]: newRecordingObject }, null, 2)}`);
      next();
    });
  });
}

export function storeEvent(recordingId, message, sendResponse, next) {
  const { time } = message;
  const entry = message;

  if (time) {
    const interval = incrementAndGetTime(recordingId, time);
    entry.interval = interval;
  }

  chrome.storage.session.get(recordingId, function(data){
    const currentData = data[recordingId];
    const nextStepId = data[recordingId]?.nextStepId ?? 0;
    console.log(`storeEvent: recordingId ${recordingId} data before update:`, JSON.stringify(data[recordingId], null, 2));
    console.log(`storeEvent: recordingId ${recordingId} nextStepId being assigned to current update:`, JSON.stringify(nextStepId, null, 2));
    entry.stepId = nextStepId;
    const currentSteps = data[recordingId]?.steps || [];
    const newSteps = [
      ...currentSteps,
      entry
    ];

    const initUrl = data[recordingId].initUrl;
    
    const newEntry = {
      ...currentData,
      nextStepId: nextStepId + 1,
      steps: newSteps
    };
    
    chrome.storage.session.set({ [recordingId]: newEntry }, function() {
    console.log(`storeEvent: recordingId ${recordingId} object after update:`, JSON.stringify({ [recordingId]: newEntry }, null, 2));
      sendResponse({ ...entry });
      next();
    });
  });
}

export function getPlaybackObject(recordingId) {
  return new Promise((resolve, reject) => {
    chrome.storage.session.get(recordingId, function(data){
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      return resolve(data[recordingId]);
    });
  });
}
