import { initializeTestTab, setTestTabId, setTabFocusStatus } from "./modules/tabStatus.js";
import { setControlWindowId, getControlWindowId, setControlWindowFocus, getControlWindowFocus } from "./modules/controlWindow.js";
import { handleContentScriptMessage, handlePopupMessage } from "./modules/messageHandlers.js";
// import { logger, ERROR } from "./modules/logger.js";

// const path = import.meta.url;

//TODO: probably should turn everything off and reset all statuses etc if the control window is closed
chrome.windows.onRemoved.addListener((windowId) => {
    const controlWindowId = getControlWindowId();
    if (windowId === controlWindowId) {
        setControlWindowId(undefined);
        setControlWindowFocus(false);
        console.log(`Control window id ${windowId} removed`);
        console.log(`Conrol window focus set to: false}`);
    }
    return;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'control-window-check') {
        const controlWindowId = getControlWindowId();
        return sendResponse({ controlWindowId });
    }
    
    if (message.action === 'add-control-window-id') {
        const controlWindowId = setControlWindowId(message.windowId);
        setControlWindowFocus(true);
        console.log(`Control window id set to: ${controlWindowId}`);
        console.log(`Control window focus set to: true`);
        return sendResponse({});
    }

    if (message.action === 'control-window-hidden') {
        console.log('Control window is now hidden');
        setControlWindowFocus(false);
        return sendResponse({});
    }
    if (message.action === 'control-window-focus') {
        console.log('Control window is now in focus');
        setControlWindowFocus(true);
        return sendResponse({});
    }
    if (message.action === 'test-tab-hidden') {
        console.log('Test tab is now hidden');
        setTabFocusStatus(false);
        return sendResponse({});
    }
    if (message.action === 'test-tab-focus') {
        console.log('Test tab is now in focus');
        setTabFocusStatus(true);
        return sendResponse({});
    }
    
    if (message.action === 'open-test-window') {
        const tabId = message.tabId;
        setTestTabId(tabId);
        initializeTestTab(tabId);
        console.log(`Test tab ${tabId} initialized.`);
        return sendResponse({});
    }
     
    const type = sender.tab?.url.split(":")[0];
    if (type === 'chrome-extension') {
        console.log('%cpopup message =>', 'color: blue');
        //TODO: wrap this in try catch? use that to reset ui if needed
        handlePopupMessage(message, sender, sendResponse);
        //keep connection open: allows you to call sendResponse async
        console.log('%c<= end of popup message', 'color: blue');
        return true;
    } 
    if (type === 'http' || type === 'https') {
        console.log('%ccontent-script message => ', 'color: blue');
        //TODO: wrap this in try catch? use that to reset ui if needed
        //returning here so that true can be returned when sendResponse needs to respond asynchronously
        const result = handleContentScriptMessage(message, sender, sendResponse);
        console.log('%c<= end of content-script message', 'color: blue');
        return result;
    }
});


