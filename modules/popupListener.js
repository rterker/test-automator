import { isExtensionEnabled, toggleExtension } from "./tabExtensionStatus.js";

//TODO: get tab id in here
export const setupPopupMessageListener = () => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('popupMessageListener received message in background.');
        if (message === 'start-recording') {

        }
        if (message === 'stop-recording') {

        }
        if (message === 'start-playback') {

        }
        if (message === 'stop-playback') {

        }
        
    });
}

// this onclicked event happens when you click on the extension icon
// chrome.action.onClicked.addListener((tab) => {
//     if (isExtensionEnabled(tab.id)) {
//         toggleExtension(tab.id);
//         chrome.tabs.sendMessage(tab.id, { tabId: tab.id, action: 'disable-extension' } );
//     } else if (!isExtensionEnabled(tab.id)) {
//         toggleExtension(tab.id);
//         chrome.tabs.sendMessage(tab.id, { tabId: tab.id, action: 'enable-extension' } );
//     }
// });