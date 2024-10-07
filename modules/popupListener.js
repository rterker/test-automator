import { isPlaying, isRecording, togglePlayback, toggleRecording } from "./tabExtensionStatus.js";

export const setupPopupMessageListener = () => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('popupMessageListener received message in background.');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            console.log(`All tabs: ${tabs}`);
            console.log(`From popupListener, current tabId is ${tabId}`);
            if (message === 'start-recording') {
                const recording = isRecording(tabId);
                if (recording) {
                    toggleRecording(tabId);
                    chrome.tabs.sendMessage(tabId, { tabId, action: 'disable-extension' } );
                } else if (!recording) {
                    toggleRecording(tabId);
                    chrome.tabs.sendMessage(tabId, { tabId: tabId, action: 'enable-extension' } );
                }
            }
            if (message === 'stop-recording') {
    
            }
            if (message === 'start-playback') {
    
            }
            if (message === 'stop-playback') {
    
            }

        });
        
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