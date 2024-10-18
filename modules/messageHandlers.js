import {    
  isPlaying, 
  isRecording, 
  togglePlayback, 
  toggleRecording
} from "./tabExtensionStatus.js";

export function handlePopupMessage(message, sender, sendResponse) {
  console.log(`messageHandlers.js: popupMessage message received from ${JSON.stringify(sender, null, 2)}`);
  const tabId = sender.tab.id;
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
          console.log(`popupMessage: response from start-recording message sent to content-script: ${JSON.stringify(response, null, 2)}`);
          if (response.message === 'content-script-recording-started') {
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
          console.log(`popupMessage: response from stop-recording message sent to content-script: ${JSON.stringify(response, null, 2)}`);
          if (response.message === 'content-script-recording-stopped') {
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
   
}

export function handleContentScriptMessage(message, sender, sendResponse) {
  console.log(`messageHandlers.js: contentScript message received from ${JSON.stringify(sender, null, 2)}`);
  if (message === 'content-script-loaded') {
      console.log(`contentScriptListener.js: sender.tab.id = ${sender.tab.id}`);
        const recording = isRecording(sender.tab.id);
        if (recording) {
            sendResponse('recording-enabled');
        } else if (!recording) {
            sendResponse('recording-disabled');
        }
    }

    // if (message.action === 'mousemove') {
    //     const { x, y, tabUrl, target, time } = message;
    //     const obj = {x, y, tabUrl, target};
    //     chrome.storage.session.set({ x, y, tabUrl, target, time }).then(() => {
    //         console.log("Values set in storage");

    //       });
          
    //       chrome.storage.session.get(["x", "y", "tabUrl", "target", "time"]).then((result) => {
    //         console.log('x=', result.x);
    //         console.log('y=', result.y);
    //         console.log('tabUrl=', result.tabUrl);
    //         console.log('target=', result.target);
    //         console.log('time=', result.time);
    //       });
    //     sendResponse({ x, y, tabUrl, target, time });
    // }

    // if (message.action === 'click') {
    //     const { x, y, tabUrl, target, time } = message;
    //     chrome.storage.session.set({ key: value }).then(() => {
    //         console.log("Value was set");
    //       });
          
    //       chrome.storage.session.get(["key"]).then((result) => {
    //         console.log("Value is " + result.key);
    //       });
    //     sendResponse({ x, y, tabUrl, target, time });
    // }
}