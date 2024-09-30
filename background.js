import { isExtensionEnabled, initializeTab, toggleExtension } from "./modules/tabExtensionStatus.js";

console.log('background.js loaded');

chrome.tabs.onCreated.addListener((tab) => {
    initializeTab(tab.id);
    console.log(`Tab ${tab.id} created`)
});

// this onclicked event happens when you click on the extension icon
chrome.action.onClicked.addListener((tab) => {
    if (isExtensionEnabled(tab.id)) {
        toggleExtension(tab.id);
        console.log(`Extension disabled for ${tab.id}`);
        chrome.tabs.sendMessage(tab.id, { action: 'disable-extension' } );
    } else if (!isExtensionEnabled(tab.id)) {
        toggleExtension(tab.id);
        console.log(`Extension enabled for ${tab.id}`);
        chrome.tabs.sendMessage(tab.id, { action: 'enable-extension' } );
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message from content-script');

    if (message.action === 'mousemove') {
        sendResponse({ x: message.x, y: message.y, tabUrl: message.tabUrl });
    }

    if (message.action === 'click') {
        sendResponse({ x: message.x, y: message.y, tabUrl: message.tabUrl });
    }
});


