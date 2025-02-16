import { 
  incrementAndGetTime
} from "./recording.js";

//No need to get storage object for recordingId b/c this is the initial storage for each recordingId, so nothing is being overwritten
export function storeInitUrl(recordingId, initUrl) {
  chrome.storage.session.set({ [recordingId]: { initUrl } }, function(err) {
    if (err) {
      console.error(`Error occured in storeInitUrl: ${err}`);
    }
  });
}

//TODO: complete this storage
export function storeInitialValue({ recordingId, message, next }, callback) {
  const { cssSelector, value } = message;
  const entry = {
    [cssSelector] : value
  };
  chrome.storage.session.get(recordingId, function(data) {
    console.log(`storeInitialValue: entry is ${entry}`);
    const recordingObject = data[recordingId] ?? {};
    const initialValues = recordingObject?.initialValues ?? {};
    const newInitialValues = {
      ...initialValues,
      ...entry
    };
    console.log(`storeInitialValue: newInitialValues is ${JSON.stringify(newInitialValues, null, 2)}`);

    const newRecordingObject = {
      ...recordingObject,
      initialValues: newInitialValues
    };
    
    console.log('storeInitialValue: newRecordingObject is', newRecordingObject)

    chrome.storage.session.set({ [recordingId]: newRecordingObject }, function() {
      console.log(`storeInitialValue set value afterwards: ${{ [recordingId]: newRecordingObject }}`);
      console.log(`Calling callback with next: ${next}`);
      callback(next);
    });
  });

}

export function storeEvent(recordingId, message, sendResponse) {
  const { time } = message;
  const entry = message;
  const interval = incrementAndGetTime(recordingId, time);
  entry.interval = interval;

  chrome.storage.session.get(recordingId, function(data){
    const nextStepId = data[recordingId]?.nextStepId ?? 0;
    console.log(`recordingId ${recordingId} data:`, data[recordingId])
    console.log(`recordingId ${recordingId} nextStepId:`, nextStepId)
    entry.stepId = nextStepId;
    const currentSteps = data[recordingId]?.steps || [];
    console.log(`recordingId ${recordingId} steps:`, currentSteps)
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
      sendResponse({ ...entry });
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
