import { initializeTestTab, setTestTabId, setTabFocusStatus } from "./modules/tabStatus.js";
import { setControlWindowId, getControlWindowId, setControlWindowFocus, getControlWindowFocus } from "./modules/controlWindow.js";
import { handleContentScriptMessage, handlePopupMessage } from "./modules/messageHandlers.js";
import { logger, ERROR } from "./modules/logger.js";

const path = import.meta.url;

//TODO: probably should turn everything off and reset all statuses etc if the control window is closed
chrome.windows.onRemoved.addListener((windowId) => {
    const controlWindowId = getControlWindowId();
    if (windowId === controlWindowId) {
        setControlWindowId(undefined);
        setControlWindowFocus(false);
        logger.log(`Control window id ${windowId} removed`, path);
        logger.log(`Conrol window focus set to: false}`, path);
    }
    return;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message sender: ', sender);
    console.log('message: ', message);
    if (message === 'control-window-check') {
        const controlWindowId = getControlWindowId();
        return sendResponse({ controlWindowId });
    }
    
    if (message.action === 'add-control-window-id') {
        const controlWindowId = setControlWindowId(message.windowId);
        setControlWindowFocus(true);
        logger.log(`Control window id set to: ${controlWindowId}`, path);
        logger.log(`Control window focus set to: true`, path);
        return sendResponse({});
    }

    if (message.action === 'control-window-hidden') {
        logger.log('Control window is now hidden', path);
        setControlWindowFocus(false);
        return sendResponse({});
    }
    if (message.action === 'control-window-focus') {
        logger.log('Control window is now in focus', path);
        setControlWindowFocus(true);
        return sendResponse({});
    }
    if (message.action === 'test-tab-hidden') {
        logger.log('Test tab is now hidden', path);
        setTabFocusStatus(false);
        return sendResponse({});
    }
    if (message.action === 'test-tab-focus') {
        logger.log('Test tab is now in focus', path);
        setTabFocusStatus(true);
        return sendResponse({});
    }
    
    if (message.action === 'open-test-window') {
        const tabId = message.tabId;
        console.log(`Test window opened with tab id of ${tabId}`);
        setTestTabId(tabId);
        initializeTestTab(tabId);
        logger.log(`Test tab ${tabId} initialized.`, path)
        return sendResponse({});
    }
     
    const type = sender.tab?.url.split(":")[0];
    if (type === 'chrome-extension') {
        console.log('popup message =>');
        //TODO: wrap this in try catch? use that to reset ui if needed
        handlePopupMessage(message, sender, sendResponse);
        //keep connection open: allows you to call sendResponse async
        return true;
    } 
    if (type === 'http' || type === 'https') {
        console.log('content-script message => ');
        //TODO: wrap this in try catch? use that to reset ui if needed
        //returning here so that true can be returned when sendResponse needs to respond asynchronously
        const result = handleContentScriptMessage(message, sender, sendResponse);
        console.log('<= end of content-script message');
        return result;
    }
});


