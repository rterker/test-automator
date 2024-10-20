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
        
            const response = await chrome.runtime.sendMessage({ action: 'mousemove', tabId, tabUrl, x, y, time });
            ({ tabId, tabUrl, x, y, time } = response);
            console.log(`Values stored in background storage => tabId: ${tabId}, tabUrl: ${tabUrl}, x: ${x}, y: ${y}, time: ${time}`);
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
        
            const response = await chrome.runtime.sendMessage({ action: 'click', x, y, tabUrl, target, time });
            ({ x, y, tabUrl, target, time } = response);
            console.log(`Mouse clicked at x-axis: ${x}, y-axis ${y} @ ${time} `);
            console.log(`Url is ${tabUrl}`);
            console.log(`Click target is ${target}`);
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

