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
 
export async function handlePopupMessage(message, sender, sendResponse) {
  const tabId = getTestTabId();

  if (message === 'get-recording-status') {
    const playing = isPlaying();
    const recording = isRecording();
    console.log(`messageHandlers.js: checking recording and playback status upon clicking record button => playing status is ${playing} and recording status is ${recording}.`);
    return sendResponse({ tabId: tabId, isPlaying: playing, isRecording: recording });
  }

  if (message === 'get-playback-status') {
    const playing = isPlaying();
    const recording = isRecording();
    console.log(`messageHandlers.js: checking recording and playback status upon clicking playback button => playing status is ${playing} and recording status is ${recording}.`);
    return sendResponse({ tabId: tabId, isPlaying: playing, isRecording: recording });
  }

  if (message === 'start-recording') {
    //message sent to content-script
    chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'start-recording' }, (messageResponse) => {
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
      if (messageResponse.message === 'content-script-recording-started') {
        //TODO: need to set real recording ids
        const recordingId = setRecordingId('test');
        setRecordingStatus(true);
        initializeRecordingTimer();
        //TODO: should we handle storing initial URL solely in storage? what happens if you stop recording then start again for same recording?
        storeInitUrl(recordingId, response.tabUrl);
        return sendResponse(messageResponse);
      } 
    });
  }

  if (message === 'stop-recording') {
    //message sent to content-script
    chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'stop-recording' }, (messageResponse) => {
      const error = chrome.runtime.lastError;
      if (error) {
        const response = {
          error: true,
          message: error.message,
          alert: `Error received from content-script when attempting to stop-recording: ${error.message}`
        };
        console.error(`messageHandlers.js: error message received from content-script when attempting to stop-recording: ${error.message}`);
        return sendResponse(response);
      }
      if (messageResponse.message === 'content-script-recording-stopped') {
        //TODO: we need to shut off recording if there is an error too. how to handle that
        setRecordingStatus(false);
        return sendResponse(messageResponse);
      }
    });
  }

  if (message === 'start-playback') {
    //TODO: actually pass in a real recording id here, not just test. this should come from input in controls
    const recordingId = getRecordingId();
    return getPlaybackObject(recordingId)
    .then(playbackObject => Playback.create(recordingId, playbackObject))
    .then(playback => {
      const tabId = playback.tabId;
      playback.startPlayback();
      return sendResponse({
        alert: `Playback started on tab ${tabId}`,
        tabId
      });
    })
    .catch(err => {
      console.error(`messageHandlers.js: error when attempting to start playback: ${err.message ? err.message : err}.`);
      return sendResponse({
        error: true,
        message: err.message ? err.message : err,
        alert: `Error occured when attempting to start playback: ${err.message ? err.message : err}.`
      });
    });
  }

  if (message === 'stop-playback') {
    // stop the current playback using some sort of id
    //TODO: actually pass in a real recording id here, not just test. this should come from input in controls
    const recordingId = getRecordingId();
    try {
      await stopPlayback(recordingId);
      return sendResponse({
        tabId,
        alert: `Playback for ${recordingId} has been stopped.`
      });
    } catch (err) {
      console.error(`messageHandlers.js: error when attempting to stop playback: ${err.message ? err.message : err}.`);
      return sendResponse({
        error: true,
        message: err.message ? err.message : err,
        alert: `Error occured when attempting to stop playback: ${err.message ? err.message : err}.`
      });
    }
  }
}

export function handleContentScriptMessage(message, sender, sendResponse) {
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
    console.log(`handleContentScriptMessage: tabId is ${tabId} and testTabId is ${testTabId}. These should be equal.`);

    console.log(`messageHandlers.js: sending tab info to content script on initialization => tabId is ${tabId} and tabUrl is ${tabUrl}`);
    return sendResponse({ tabId, tabUrl });
  }
  
  //this is important b/c it covers cases where we are still in the same tab, but the window content changed, e.g. following a link
  //TODO: isRecording returns undefined here when you refresh the page instead of starting a new tab (this to do may not apply anymore since we are now pulling tab id from the set test tab id)
  if (message === 'is-recording-already-enabled') {
    const recording = isRecording();
    console.log(`messageHandlers.js: checking if recording is already enabled for tabId ${tabId} => ${recording}`);

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

  //storing initial element value for every element interaction during recording
  if (message.action === 'focus' && getInitialValue(message.targetCssSelector) === undefined) {
    //in memory storage rather than getting from long term memory every time we do the above check
    setInitialValue(message.targetCssSelector, message.elementValue);
    pushToQueue(() => storeInitialValue(recordingId, message, next), () => storeEvent(recordingId, message, sendResponse, next));
    if (length === 0) {
      start();
    }
  } else {
    pushToQueue(() => storeEvent(recordingId, message, sendResponse, next));
    if (length === 0) {
      start();
    } 
  }
  //handle sendResponse for recording events asynchronously, as the storage api is async
  return true;   
};

//  TODO LATER: we will have the user input more id info, like title and description