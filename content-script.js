console.log('content-script.js is loading...');

let tabUrl = window.location.href;

//we are enabling/disabling extension by tab, so in the case where you are in the same tab but change the content of the document, 
//check if the extension is enabled in background, so you can automatically reenable
chrome.runtime.sendMessage('content-script-loaded', (response) => {
    if (response === 'recording-enabled') {
        console.log(`content-script.js: recording-enabled message received.`);
        addAllListeners();
    } else if (response === 'recording-disabled') {
        console.log(`content-script.js: recording-disabled message received.`);
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
            let target = event.target;
            let time = Date.now();
        
            const response = await chrome.runtime.sendMessage({ action: 'mousemove', x, y, tabUrl, target, time });
            ({ x, y, tabUrl, time } = response);
            console.log(`Location of mouse is x-axis: ${x}, y-axis: ${y} @ ${time} `);
            console.log(`Url is ${tabUrl}`);
            console.log(`Mouse move target is ${target}`);
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
    console.log('Content-script received message from background');

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

