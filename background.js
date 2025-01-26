import { initializeTab } from "./modules/tabStatus.js";
import { handleContentScriptMessage, handlePopupMessage } from "./modules/messageHandlers.js";
import { logger } from "./modules/logger.js";

const path = import.meta.url;
let controlWindowTabId;

chrome.tabs.onCreated.addListener((tab) => {
    initializeTab(tab.id);
    logger.log(`Tab ${tab.id} initialized.`, path)
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message sender: ', sender);
    console.log('message: ', message);
    if (message === 'control-window-check') {
        sendResponse({ controlWindowTabId });
    }

    if (message.action === 'add-control-window-tab-id') {
        controlWindowTabId = message.tabId;
        logger.log(`Conrol window tab id set to: ${controlWindowTabId}`, path);
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


