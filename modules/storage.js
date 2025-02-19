import { 
  incrementAndGetTime
} from "./recording.js";

//No need to get storage object for recordingId b/c this is the initial storage for each recordingId, so nothing is being overwritten
export function storeInitUrl(recordingId, initUrl) {
  chrome.storage.session.set({ [recordingId]: { initUrl } }, function(err) {
    console.log(`storeInitUrl: recordingId ${recordingId} initUrl after update ${JSON.stringify({ [recordingId]: { initUrl } }, null, 2)}`);
    if (err) {
      console.error(`Error occured in storeInitUrl: ${err}`);
    }
  });
}

//TODO: complete this storage
export function storeInitialValue(recordingId, message, next) {
  const { cssSelector, value } = message;
  const entry = {
    [cssSelector] : value
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
  const interval = incrementAndGetTime(recordingId, time);
  entry.interval = interval;

  chrome.storage.session.get(recordingId, function(data){
    const nextStepId = data[recordingId]?.nextStepId ?? 0;
    console.log(`recordingId ${recordingId} data before update:`, JSON.stringify(data[recordingId], null, 2));
    console.log(`recordingId ${recordingId} nextStepId being assigned to current update:`, JSON.stringify(nextStepId, null, 2));
    entry.stepId = nextStepId;
    const currentSteps = data[recordingId]?.steps || [];
    console.log(`recordingId ${recordingId} steps before update:`, JSON.stringify(currentSteps, null, 2));
    const newSteps = [
      ...currentSteps,
      entry
    ];

    const initUrl = data[recordingId].initUrl;
    
    const newEntry = {
      initUrl,
      nextStepId: nextStepId + 1,
      steps: newSteps
    };
    
    chrome.storage.session.set({ [recordingId]: newEntry }, function() {
    console.log(`recordingId ${recordingId} object after update:`, JSON.stringify({ [recordingId]: newEntry }, null, 2));
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
