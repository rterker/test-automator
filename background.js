import { isExtensionEnabled, initializeTab, toggleExtension } from "./modules/tabExtensionStatus.js";
import {} from "./modules/storage.js";

console.log('background.js loaded');

chrome.tabs.onCreated.addListener((tab) => {
    initializeTab(tab.id);
    console.log(`Tab ${tab.id} created`)
});

// this onclicked event happens when you click on the extension icon
chrome.action.onClicked.addListener((tab) => {
    if (isExtensionEnabled(tab.id)) {
        toggleExtension(tab.id);
        chrome.tabs.sendMessage(tab.id, { tabId: tab.id, action: 'disable-extension' } );
    } else if (!isExtensionEnabled(tab.id)) {
        toggleExtension(tab.id);
        chrome.tabs.sendMessage(tab.id, { tabId: tab.id, action: 'enable-extension' } );
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message from content-script');

    if (message === 'content-script-loaded') {
        if (isExtensionEnabled(sender.tab.id)) {
            sendResponse('extension-enabled');
        } else {
            sendResponse('extension-not-enabled');
        }
    }

    if (message.action === 'mousemove') {
        const { x, y, tabUrl, target, time } = message;
        chrome.storage.session.set({ key: value }).then(() => {
            console.log("Value was set");
          });
          
          chrome.storage.session.get(["key"]).then((result) => {
            console.log("Value is " + result.key);
          });
        sendResponse({ x, y, tabUrl, target, time });
    }

    if (message.action === 'click') {
        const { x, y, tabUrl, target, time } = message;
        chrome.storage.session.set({ key: value }).then(() => {
            console.log("Value was set");
          });
          
          chrome.storage.session.get(["key"]).then((result) => {
            console.log("Value is " + result.key);
          });
        sendResponse({ x, y, tabUrl, target, time });
    }
});


