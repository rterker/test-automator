console.log('content-script.js loaded');

const tabUrl = window.location.href;

const listeners = [
    {
        element: document, 
        eventType: 'mousemove', 
        handler: async function (event) {
            const x = event.clientX;
            const y = event.clientY;
        
            const response = await chrome.runtime.sendMessage({ action: 'mousemove', x, y, tabUrl });
            console.log(`Location of mouse is x-axis: ${response.x}, y-axis: ${response.y} `);
            console.log(`Url is ${response.tabUrl}`);
        }
    },
    {
        element: document, 
        eventType: 'click', 
        handler: async function (event) {
            const x = event.clientX;
            const y = event.clientY;
        
            const response = await chrome.runtime.sendMessage({ action: 'click', x, y, tabUrl });
            console.log(`Mouse clicked at x-axis: ${response.x}, y-axis ${response.y}`);
            console.log(`Url is ${response.tabUrl}`);
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

    if (message.action === 'enable-extension') {
        addAllListeners();
        alert(`Extension enabled for ${tabUrl}`);
    }

    if (message.action === 'disable-extension') {
        removeAllListeners();
        alert(`Extension disabled for ${tabUrl}`);
    }
});

