import { initializeTab } from "./modules/tabStatus.js";
import { handleContentScriptMessage, handlePopupMessage } from "./modules/messageHandlers.js";
import { logger } from "./modules/logger.js";

const path = import.meta.url;
let controlWindowId;

chrome.tabs.onCreated.addListener((tab) => {
    initializeTab(tab.id);
    logger.log(`Tab ${tab.id} initialized.`, path)
});

chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === controlWindowId) {
        controlWindowId = undefined;
    }
    logger.log(`Control window id ${windowId} removed`, path);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message sender: ', sender);
    console.log('message: ', message);
    if (message === 'control-window-check') {
        sendResponse({ controlWindowId });
    }

    if (message.action === 'add-control-window-id') {
        controlWindowId = message.windowId;
        logger.log(`Conrol window id set to: ${controlWindowId}`, path);
    }
     
    const type = sender.tab?.url.split(":")[0];
    if (type === 'chrome-extension') {
        console.log('popup message =>');
        handlePopupMessage(message, sender, sendResponse);
        //keep connection open: allows you to call sendResponse async
        return true;
    } 
    if (type === 'http' || type === 'https') {
        console.log('content-script message => ');
        //returning here so that true can be returned when sendResponse needs to respond asynchronously
        const result = handleContentScriptMessage(message, sender, sendResponse);
        console.log('<= end of content-script message');
        return result;
    }
});


