console.log('popupListener.js is loading...');

import { isPlaying, isRecording, togglePlayback, toggleRecording } from "./tabExtensionStatus.js";

//TODO: pass tabId with each message
//TODO: modularize
export const setupPopupMessageListener = () => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('popupListener.js: message received.');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            console.log(`popupListener.js: current tabId is ${tabId}`);

            if (message === 'get-recording-status') {
                console.log(`popupListener.js: get-recording-status message received.`);
                const recording = isRecording(tabId);
                console.log(`popupListener.js: recording status is ${recording}.`);
                sendResponse({ isRecording: recording });
            }
            if (message === 'start-recording') {
                chrome.tabs.sendMessage(tabId, { tabId, action: 'start-recording' } );
            }
            if (message === 'stop-recording') {
                chrome.tabs.sendMessage(tabId, { tabId, action: 'stop-recording' } );
            }
            if (message === 'start-playback') {
    
            }
            if (message === 'stop-playback') {
    
            }
            if (message === 'get-playback-status') {
                const playing = isPlaying(tabId);
                sendResponse({ isPlaying: playing });
            }

        });
        //this line tells chrome that we are sending an async response and to keep the message connection open waiting
        return true;
        
    });
}

// this onclicked event happens when you click on the extension icon
// chrome.action.onClicked.addListener((tab) => {
    // if (isExtensionEnabled(tab.id)) {
    //     toggleExtension(tab.id);
    //     chrome.tabs.sendMessage(tab.id, { tabId: tab.id, action: 'disable-extension' } );
    // } else if (!isExtensionEnabled(tab.id)) {
    //     toggleExtension(tab.id);
    //     chrome.tabs.sendMessage(tab.id, { tabId: tab.id, action: 'enable-extension' } );
    // }
// });