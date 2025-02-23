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

// const path = import.meta.url;

export function handlePopupMessage(message, sender, sendResponse) {
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
    console.log('IN MESSAGE HANDLERS START-PLAYBACK');
    const recordingId = getRecordingId();
    getPlaybackObject(recordingId)
    .then((playbackObject) => {
      console.log('playbackArray object initially:', playbackObject);
      //message sent to content-script
      chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'start-playback', playbackObject }, (response) => {
        if (response.message === 'content-script-playback-started') {
          setPlaybackStatus(true);
        } else {
          response.message = chrome.runtime.lastError;
          response.alert = `messageHandlers.js: error message received from content-script when attempting to start-playback`;
          console.log(`messageHandlers.js: error message received from content-script when attempting to start-playback`);
        }
        return sendResponse(response);
      });
    })
    .catch((err) => {
      console.log(`Error when attempting to retrieve playbackObject: ${err}. start-playback message was not sent to content-script.js`);
    });
  }

  if (message === 'stop-playback') {
    // stop the current playback using some sort of id
    chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'stop-playback' }, (response) => {
      setPlaybackStatus(false);
      if (response.message !== 'content-script-playback-stopped') {
        response.message = chrome.runtime.lastError;
        response.alert = `messageHandlers.js: error message received from content-script when attempting to stop-playback`;
        console.log(`messageHandlers.js: error message received from content-script when attempting to stop-playback`);
      }
      return sendResponse(response);
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

  if (message.action === 'playback-complete') {
    setPlaybackStatus(false);
    return sendResponse();
  }

  if (message.action === 'auto-stop-playback') {
    setPlaybackStatus(false);
    return sendResponse(message);
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