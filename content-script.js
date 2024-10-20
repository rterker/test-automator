console.log('content-script.js is loading...');

let tabUrl;
let tabId;

//tabUrl and tabId are assigned asynchronously here, so there could be an issue, since the listener handlers use these values
chrome.runtime.sendMessage('get-tab-info', (response) => {
    console.log(`Context script tab info:`);
    console.log(`tabId: ${response.tabId}`);
    console.log(`tabUrl: ${response.tabUrl}`);
    tabUrl = response.tabUrl;
    tabId = response.tabId;
});

chrome.runtime.sendMessage('is-recording-already-enabled', (response) => {
    if (response === 'recording-enabled') {
        console.log(`content-script.js: content of window changed. confirmed that recording should still be enabled.`);
        addAllListeners();
    } else if (response === 'recording-disabled') {
        console.log(`content-script.js: content of window changed. confirmed that recording should still be disabled.`);
        removeAllListeners();
    }
});

const listeners = [
    {
        element: document, 
        eventType: 'mousemove', 
        handler: async function (event) {
            let x = event.clientX;
            let y = event.clientY;
            let time = Date.now();

            const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');
            
            console.log('\n');
            console.log(`content-script.js: mousemove tab info:`);
            console.log(`tabId: ${tabInfoResponse.tabId}`);
            console.log(`tabUrl: ${tabInfoResponse.tabUrl}`);
            
            const mouseMoveResponse = await chrome.runtime.sendMessage({ action: 'mousemove', tabId: tabInfoResponse.tabId, tabUrl: tabInfoResponse.tabUrl, x, y, time });
            ({ x, y, time } = mouseMoveResponse);
            console.log(`Mouse moved! Values stored in background storage => tabId: ${mouseMoveResponse.tabId}, tabUrl: ${mouseMoveResponse.tabUrl}, x: ${x}, y: ${y}, time: ${time}`);

            let endTime = Date.now();
            console.log(`Round trip operation from mouse move to storage to response received back in content script: ${endTime - time} ms`);
        }
    },
    {
        element: document, 
        eventType: 'click', 
        handler: async function (event) {
            let x = event.clientX;
            let y = event.clientY;
            let target = event.target;
            let time = Date.now();

            console.log('\n');
            console.log(`In content-script.js, click target is ${target}`);
            console.log(`Target nodeName is ${target.nodeName}`);
            console.log(`Target nodeType is ${target.nodeType}`);
            
            const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');
            
            console.log(`content-script.js: mousemove tab info:`);
            console.log(`tabId: ${tabInfoResponse.tabId}`);
            console.log(`tabUrl: ${tabInfoResponse.tabUrl}`);
            
            const mouseClickResponse = await chrome.runtime.sendMessage({ action: 'click', tabId: tabInfoResponse.tabId, tabUrl: tabInfoResponse.tabUrl, x, y, target, time });
            ({ x, y, target, time } = mouseClickResponse);
            console.log(`Mouse clicked! Values stored in background storage => tabId: ${mouseClickResponse.tabId}, tabUrl: ${mouseClickResponse.tabUrl}, x: ${x}, y: ${y}, time: ${time}, target: ${target}`);
            
            let endTime = Date.now();
            console.log(`Round trip operation from mouse click to storage to response received back in content script: ${endTime - time} ms`);
        }
    },
];

function addAllListeners() {
    listeners.forEach(({ element, eventType, handler }) => {
        element.addEventListener(eventType, handler);
    }
    );
}

function removeAllListeners() {
    listeners.forEach(({ element, eventType, handler }) => {
        element.removeEventListener(eventType, handler);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('content-script.js: received message from background');

    if (message.action === 'start-recording') {
        addAllListeners();
        alert(`content-script.js: recording started on tab ${message.tabId}`);
        sendResponse({ tabId: message.tabId, message: 'content-script-recording-started'});
    }
    if (message.action === 'stop-recording') {
        removeAllListeners();
        alert(`content-script.js: recording stopped on tab ${message.tabId}`);
        sendResponse({ tabId: message.tabId, message: 'content-script-recording-stopped'});
    }
});

