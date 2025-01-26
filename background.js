import { initializeTestTab, setTestTabId, setTabFocusStatus } from "./modules/tabStatus.js";
import { handleContentScriptMessage, handlePopupMessage } from "./modules/messageHandlers.js";
import { logger } from "./modules/logger.js";

const path = import.meta.url;
let controlWindowId;
//TODO: will need to clean up how this is being handled, using more encapsulation, etc. all the logic is currently in this module
let controlWindowFocus = false;

//TODO: probably should turn everything off and reset all statuses etc if the control window is closed
chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === controlWindowId) {
        controlWindowId = undefined;
        controlWindowFocus = false;
        logger.log(`Control window id ${windowId} removed`, path);
        logger.log(`Conrol window focus set to: ${controlWindowFocus}`, path);
    }
    return;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message sender: ', sender);
    console.log('message: ', message);
    if (message === 'control-window-check') {
        return sendResponse({ controlWindowId });
    }
    
    if (message.action === 'add-control-window-id') {
        controlWindowId = message.windowId;
        controlWindowFocus = true;
        logger.log(`Conrol window id set to: ${controlWindowId}`, path);
        logger.log(`Conrol window focus set to: ${controlWindowFocus}`, path);
        return;
    }

    if (message.action === 'control-window-hidden') {
        controlWindowFocus = false;
    }
    if (message.action === 'control-window-focus') {
        controlWindowFocus = true;
    }
    if (message.action === 'test-tab-hidden') {
        setTabFocusStatus(false);
    }
    if (message.action === 'test-tab-focus') {
        setTabFocusStatus(true);
    }
    
    if (message.action === 'open-test-window') {
        const tabId = message.tabId;
        console.log(`Test window opened with tab id of ${tabId}`);
        setTestTabId(tabId);
        initializeTestTab(tabId);
        logger.log(`Test tab ${tabId} initialized.`, path)
        return;
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


