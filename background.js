import { initializeTab } from "./modules/tabStatus.js";
import { handleContentScriptMessage, handlePopupMessage } from "./modules/messageHandlers.js";
import { logger } from "./modules/logger.js";

const path = import.meta.url;

logger.log('background.js is loading...', path);

chrome.tabs.onCreated.addListener((tab) => {
    initializeTab(tab.id);
    logger.log(`Tab ${tab.id} initialized.`, path)
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

