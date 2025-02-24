import {    
  isPlaying, 
  isRecording, 
  setRecordingStatus,
  setPlaybackStatus,
  getTestTabId
} from "./tabStatus.js";

import {
  initializeRecordingTimer,
  getRecordingId,
  setRecordingId
} from "./recording.js";

import { 
  getPlaybackObject,
  storeInitUrl,
  storeInitialValue,
  storeEvent
} from "./storage.js";

// import { 
//   logger,
//   ERROR
//  } from "./logger.js";

import { 
  getInitialValue, 
  setInitialValue 
} from "./initialValues.js";

import { 
  next, 
  start,
  pushToQueue,
  getQueueLength 
} from "./queue.js";

import Playback, { stopPlayback } from "./playback.js";
 
// const path = import.meta.url;

export async function handlePopupMessage(message, sender, sendResponse) {
  console.log(`handlePopupMessage message is: ${message}`);
  
  const tabId = getTestTabId();
  console.log(`popupMessage: test tabId is ${tabId}`);

  if (message === 'get-recording-status') {
    console.log(`popupMessage: get-recording-status message received.`);
    const playing = isPlaying();
    const recording = isRecording();
    console.log(`popupMessage: playing status is ${playing}.`);
    console.log(`popupMessage: recording status is ${recording}.`);
    return sendResponse({ tabId: tabId, isPlaying: playing, isRecording: recording });
  }

  if (message === 'get-playback-status') {
    console.log(`popupMessage: get-playback-status message received.`);
    const playing = isPlaying();
    const recording = isRecording();
    console.log(`popupMessage: playing status is ${playing}.`);
    console.log(`popupMessage: recording status is ${recording}.`);
    return sendResponse({ tabId: tabId, isPlaying: playing, isRecording: recording });
  }

  if (message === 'start-recording') {
    //message sent to content-script
      chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'start-recording' }, (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          const response = {
            error: true,
            message: error.message,
            alert: `Error received from content-script when attempting to start-recording: ${error.message}`
          };
          console.error(`messageHandlers.js: error message received from content-script when attempting to start-recording: ${error.message}`);
          return sendResponse(response);
        }
        if (response.message === 'content-script-recording-started') {
            //TODO: need to set real recording ids
            const recordingId = setRecordingId('test');
            setRecordingStatus(true);
            initializeRecordingTimer();
            //TODO: should we handle storing initial URL solely in storage? what happens if you stop recording then start again for same recording?
            storeInitUrl(recordingId, response.tabUrl);
            return sendResponse(response);
        } 
      });
  }

  if (message === 'stop-recording') {
    //message sent to content-script
    chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'stop-recording' }, (response) => {
      setRecordingStatus(false);
      if (response.message !== 'content-script-recording-stopped') {
          response.message = chrome.runtime.lastError;
          response.alert = `messageHandlers.js: error message received from content-script when attempting to stop-recording`;
          console.error(`messageHandlers.js: error message received from content-script when attempting to stop-recording`);
      }
      return sendResponse(response);
    });
  }

  if (message === 'start-playback') {
    //TODO: actually pass in a real recording id here, not just test. this should come from input in controls
    const recordingId = getRecordingId();
    return getPlaybackObject(recordingId)
    .then(playbackObject => Playback.create(recordingId, playbackObject))
    .then(playback => {
      console.log('messageHandlers.js: start-playback playback object initially:', playback);
      const tabId = playback.tabId;
      playback.startPlayback();
      return sendResponse({
        alert: `Playback started on tab ${tabId}`,
        tabId
      });
    })
    .catch(err => {
      console.error(`messageHandlers.js: error when attempting to start playback: ${err}.`);
      return sendResponse({
        error: true,
        alert: `Error occured when attempting to start playback: ${err}.`
      });
    });
  }

  //TODO: REFACTOR
  if (message === 'stop-playback') {
    // stop the current playback using some sort of id
    //TODO: actually pass in a real recording id here, not just test. this should come from input in controls
    const recordingId = getRecordingId();
    stopPlayback(recordingId);
    return sendResponse({
      alert: `Playback for ${recordingId} has been stopped.`
    });
  }
}

export function handleContentScriptMessage(message, sender, sendResponse) {
  console.log(`handleContentScriptMessage message is: ${message}`);
  
  const tabId = sender.tab.id;
  const tabUrl = sender.tab.url;
  const testTabId = getTestTabId();
  const isTestTab = tabId === testTabId;

  if (message === 'is-this-a-test-tab') {
    if (!isTestTab) {
      console.log(`In handleContentScriptMessage, content-script sender ${tabId} is not the test tab id`);
    }
    return sendResponse(isTestTab);
  }

  if (message === 'get-tab-info') {
    console.log(`handleContentScriptMessage: tabId is ${tabId} and testTabId is ${testTabId}\n
      handleContentScriptMessage: are we getting tab info for correct tab? ${isTestTab}`);

    console.log('messageHandlers.js: sending tab info to content script on initialization: ');
    console.log(`messageHandlers.js: tabId => ${tabId}`);
    console.log(`messageHandlers.js: tabUrl => ${tabUrl}`);
    return sendResponse({ tabId, tabUrl });
  }
  
  //this is important b/c it covers cases where we are still in the same tab, but the window content changed, e.g. following a link
  //TODO: isRecording returns undefined here when you refresh the page instead of starting a new tab. 
  //this to do may not apply anymore since we are now pulling tab id from the set test tab id
  if (message === 'is-recording-already-enabled') {
    console.log(`messageHandlers.js: checking if recording already enabled for tabId: ${tabId}`);
    const recording = isRecording();

    let response;
    if (recording) {
        response = 'recording-enabled';
    } else if (!recording) {
        response = 'recording-disabled';
    }
    return sendResponse(response);
  }

  if (isRecording()) {
    return handleRecordingEvents(message, sender, sendResponse);
  } 
}

function handleRecordingEvents(message, sender, sendResponse) {
  const recordingId = getRecordingId();
  const length = getQueueLength();

  if (message.action !== 'focus') {
    pushToQueue(() => storeEvent(recordingId, message, sendResponse, next));
    if (length === 0) {
      start();
    } 
  }
  //storing initial element value for every element interaction during recording
  if (message.action === 'focus' && getInitialValue(message.targetCssSelector) === undefined) {
    //in memory storage rather than getting from long term memory every time we do the above check
    setInitialValue(message.targetCssSelector, message.elementValue);
    pushToQueue(() => storeInitialValue(recordingId, message, next));
    if (length === 0) {
      start();
    }
  } 
  //handle sendResponse for recording events asynchronously, as the storage api is async
  return true;   
};

//  TODO LATER: we will have the user input more id info, like title and description