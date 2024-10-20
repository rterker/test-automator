import {    
  isPlaying, 
  isRecording, 
  togglePlayback, 
  toggleRecording
} from "./tabExtensionStatus.js";

export function handlePopupMessage(message, sender, sendResponse) {
  // console.log(`messageHandlers.js: popupMessage message received from ${JSON.stringify(sender, null, 2)}`);
  //getting current tab this way since messages from popup don't contain it
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tabId = tabs[0].id;
    console.log(`popupMessage: current tabId is ${tabId}`);
    if (message === 'get-recording-status') {
      console.log(`popupMessage: get-recording-status message received.`);
      const recording = isRecording(tabId);
      console.log(`popupMessage: recording status is ${recording}.`);
      sendResponse({ tabId: tabId, isRecording: recording });
    }
    if (message === 'get-playback-status') {
      console.log(`popupMessage: get-playback-status message received.`);
      const playing = isPlaying(tabId);
      console.log(`popupMessage: playing status is ${playing}.`);
      sendResponse({ tabId: tabId, isPlaying: playing });
    }
    if (message === 'start-recording') {
      //message sent to content-script
      //TODO: error handling here
      chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'start-recording' }, (response) => {
        // console.log(`popupMessage: response from start-recording message sent to content-script: ${JSON.stringify(response, null, 2)}`);
        if (response.message === 'content-script-recording-started') {
            //toggle and save current recording status in background
            toggleRecording(response.tabId);
        }
        //response sent to popup.js
        sendResponse({ tabId: response.tabId, message: response.message });
      });
    }
    if (message === 'stop-recording') {
      //message sent to content-script
      //TODO: error handling here
      chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'stop-recording' }, (response) => {
        // console.log(`popupMessage: response from stop-recording message sent to content-script: ${JSON.stringify(response, null, 2)}`);
        if (response.message === 'content-script-recording-stopped') {
            //toggle and save current recording status in background
            toggleRecording(response.tabId);
        }
        //response sent to popup.js
        sendResponse({ tabId: response.tabId, message: response.message });
      });
    }
    if (message === 'start-playback') {
  
    }
    if (message === 'stop-playback') {
  
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
    sendResponse({ tabId, tabUrl });
  }
  
  if (message === 'is-recording-already-enabled') {
    console.log(`messageHandlers.js: checking if recording already enabled for tabId: ${tabId}`);
    const recording = isRecording(tabId);
    if (recording) {
        sendResponse('recording-enabled');
    } else if (!recording) {
        sendResponse('recording-disabled');
    }
  }
  if (message.action === 'mousemove' || message.action === 'click') {
    return handleMouseEventMessages(message, sender, sendResponse);
  }
}

function handleMouseEventMessages(message, sender, sendResponse) {
  //target is undefined for mousemove
  const { tabId, tabUrl, x, y, target, time } = message;

  if (message.action === 'mousemove') {
    const entry = { tabId, tabUrl, x, y, time };
    chrome.storage.session.set(entry).then(() => {
      return chrome.storage.session.get(["tabId", "tabUrl", "x", "y", "time"]);
    })
    .then(({ tabId, tabUrl, x, y, time }) => {
      console.log(`Values set in storage => tabId: ${tabId}, tabUrl: ${tabUrl}, x: ${x}, y: ${y}, time: ${time}`);
      sendResponse({ tabId, tabUrl, x, y, time });
    });
    //handle sendResponse for mousemove event asynchronously
    return true;      
  }

  if (message.action === 'click') {
    chrome.storage.session.set({ key: value }).then(() => {
      console.log("Value was set");
    });
    
    chrome.storage.session.get(["key"]).then((result) => {
      console.log("Value is " + result.key);
    });
    sendResponse({ x, y, tabUrl, target, time });
  }
};

//mouse moves: 
//  x,y for distance
//  start, end times for movement
//  tabId to check that the playback will be for the correct tab
//  url

//mouse clicks
//  x,y for location of click
//  event target for click target
//  tabId to check that the playback will be for the correct tab
//  url
