import { initializeTab } from "./modules/tabStatus.js";
import { errorHandler } from "./modules/errorHandler.js";
import { handleContentScriptMessage, handlePopupMessage } from "./modules/messageHandlers.js";

console.log('background.js is loading...');

chrome.tabs.onCreated.addListener((tab) => {
    initializeTab(tab.id);
    console.log(`background.js: tab ${tab.id} initialized.`)
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // console.log(`background.js: message received from ${JSON.stringify(sender, null, 2)}`);    
    if (!sender.tab) {
        handlePopupMessage(message, sender, sendResponse);
        //keep connection open: allows you to call sendResponse async
        return true;
    } else {
        //returning here so that true can be returned when sendResponse needs to respond asynchronously
        return handleContentScriptMessage(message, sender, sendResponse);
    }
});

