import {    
  isPlaying, 
  isRecording, 
  togglePlayback, 
  toggleRecording,
  setPlaybackStatus
} from "./tabStatus.js";

import {
  initializeRecordingTimer,
  getRecordingId
} from "./recordingStatus.js";

import { 
  storeMouseEvent,
  getPlaybackObject
} from "./storage.js";

export function handlePopupMessage(message, sender, sendResponse) {
  // console.log(`messageHandlers.js: popupMessage message received from ${JSON.stringify(sender, null, 2)}`);
  //getting current tab this way since messages from popup don't contain it
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tabId = tabs[0].id;
    console.log(`popupMessage: current tabId is ${tabId}`);
    if (message === 'get-recording-status') {
      console.log(`popupMessage: get-recording-status message received.`);
      const playing = isPlaying(tabId);
      const recording = isRecording(tabId);
      console.log(`popupMessage: playing status is ${playing}.`);
      console.log(`popupMessage: recording status is ${recording}.`);
      sendResponse({ tabId: tabId, isPlaying: playing, isRecording: recording });
    }
    if (message === 'get-playback-status') {
      console.log(`popupMessage: get-playback-status message received.`);
      const playing = isPlaying(tabId);
      const recording = isRecording(tabId);
      console.log(`popupMessage: playing status is ${playing}.`);
      console.log(`popupMessage: recording status is ${recording}.`);
      sendResponse({ tabId: tabId, isPlaying: playing, isRecording: recording });
    }
    if (message === 'start-recording') {
      //message sent to content-script
      chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'start-recording' }, (response) => {
        // console.log(`popupMessage: response from start-recording message sent to content-script: ${JSON.stringify(response, null, 2)}`);
        if (response.message === 'content-script-recording-started') {
            //toggle and save current recording status in background
            toggleRecording(response.tabId);
            initializeRecordingTimer();
        } else {
          response.message = chrome.runtime.lastError;
          console.log(`messageHandlers.js: error message received from content-script when attempting to start-recording`);
        }
        //response sent to popup.js - not doing anything with message in popup currently
        sendResponse({ tabId: response.tabId, message: response.message });
      });
    }
    if (message === 'stop-recording') {
      //message sent to content-script
      chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'stop-recording' }, (response) => {
        // console.log(`popupMessage: response from stop-recording message sent to content-script: ${JSON.stringify(response, null, 2)}`);
        if (response.message === 'content-script-recording-stopped') {
            //toggle and save current recording status in background
            toggleRecording(response.tabId);
          } else {
            response.message = chrome.runtime.lastError;
            console.log(`messageHandlers.js: error message received from content-script when attempting to stop-recording`);
          }
        //response sent to popup.js - not doing anything with message in popup currently
        sendResponse({ tabId: response.tabId, message: response.message });
      });
    }
    if (message === 'start-playback') {
      //TODO: actually pass in a real recording id here, not just test. this should come from input in popup
      getPlaybackObject('test')
      .then((playbackObject) => {
        const playbackArray = playbackObject['test'];
        //message sent to content-script
        chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'start-playback', playbackArray }, (response) => {
         if (response.message === 'content-script-playback-started') {
           //toggle and save current playback status in background
           togglePlayback(response.tabId);
         } else {
           response.message = chrome.runtime.lastError;
           console.log(`messageHandlers.js: error message received from content-script when attempting to start-playback`);
         }
         //response sent to popup.js - not doing anything with message in popup currently
         sendResponse({ tabId: response.tabId, message: response.message });
       });
      })
      .catch((err) => {
        console.error(`Error when attempting to retrieve playbackObject: ${err}. start-playback message was not sent to content-script.js`);
      });
    }
    if (message === 'stop-playback') {
      // stop the current playback using some sort of id
      chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'stop-playback' }, (response) => {
        if (response.message === 'content-script-playback-stopped') {
          //toggle and save current playback status in background
          togglePlayback(response.tabId);
        } else {
          response.message = chrome.runtime.lastError;
          console.log(`messageHandlers.js: error message received from content-script when attempting to stop-playback`);
        }
        //response sent to popup.js - not doing anything with message in popup currently
        sendResponse({ tabId: response.tabId, message: response.message });
      });
    }
  });
}

export function handleContentScriptMessage(message, sender, sendResponse) {
  // console.log(`messageHandlers.js: contentScript message received from ${JSON.stringify(sender, null, 2)}`);
  
  const tabId = sender.tab.id;
  const tabUrl = sender.tab.url;

  if (message === 'get-tab-info') {
    console.log('messageHandlers.js: sending tab info to content script on initialization: ');
    console.log(`messageHandlers.js: tabId => ${tabId}`);
    console.log(`messageHandlers.js: tabUrl => ${tabUrl}`);
    return sendResponse({ tabId, tabUrl });
  }
  
  //this is important b/c it covers cases where we are still in the same tab, but the window content changed, e.g. following a link
  //TODO: isRecording returns undefined here when you refresh the page instead of starting a new tab
  if (message === 'is-recording-already-enabled') {
    console.log(`messageHandlers.js: checking if recording already enabled for tabId: ${tabId}`);
    const recording = isRecording(tabId);

    let response;
    if (recording) {
        response = 'recording-enabled';
    } else if (!recording) {
        response = 'recording-disabled';
    }
    return sendResponse(response);
  }

  if (message === 'playback-complete') {
    togglePlayback(tabId);
    return sendResponse({ tabId, message });
  }

  if (message === 'stop-playback') {
    setPlaybackStatus(tabId, false);
    return sendResponse({ tabId, message });
  }

  if (isRecording(tabId)) {
    return handleRecordingEvents(message, sender, sendResponse);
  } 
}

function handleRecordingEvents(message, sender, sendResponse) {
  const recordingId = getRecordingId();

  storeMouseEvent(recordingId, message, sendResponse);
  //handle sendResponse for recording events asynchronously, as the storage api is async
  return true;   
};

//for all playback:
//  tabId to check that the playback will be for the correct tab
//  url to check that the playback will be for the correct url
//  generate a unique id
//  TODO LATER: we will have the user input more id info, like title and description



