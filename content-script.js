const listeners = [
    // {
    //     element: document, 
    //     eventType: 'mousemove', 
    //     handler: async function (event) {
    //         let x = event.clientX;
    //         let y = event.clientY;
    //         let time = Date.now();

    //         const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');
            
    //         // console.log('\n');
    //         // console.log(`content-script.js: mousemove tab info:`);
    //         // console.log(`tabId: ${tabInfoResponse.tabId}`);
    //         // console.log(`tabUrl: ${tabInfoResponse.tabUrl}`);
            
    //         const mouseMoveResponse = await chrome.runtime.sendMessage({ action: 'mousemove', tabId: tabInfoResponse.tabId, tabUrl: tabInfoResponse.tabUrl, x, y, time });
    //         //currently not being sent back targetCssSelector
    //         // console.log(`Mouse moved! Values stored in background storage => tabId: ${mouseMoveResponse.tabId}, tabUrl: ${mouseMoveResponse.tabUrl}, x: ${mouseMoveResponse.x}, y: ${mouseMoveResponse.y}, interval: ${mouseMoveResponse.interval}`);

    //         let endTime = Date.now();
    //         // console.log(`Round trip operation from mouse move to storage to response received back in content script: ${endTime - mouseMoveResponse.time} ms`);
    //     }
    // },
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
            let targetCssSelector = generateCssSelector(target);
            console.log('cssSelector for clicked target:', targetCssSelector)
            
            const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');
            
            console.log(`content-script.js: click tab info:`);
            console.log(`tabId: ${tabInfoResponse.tabId}`);
            console.log(`tabUrl: ${tabInfoResponse.tabUrl}`);
            
            const mouseClickResponse = await chrome.runtime.sendMessage({ action: 'click', tabId: tabInfoResponse.tabId, tabUrl: tabInfoResponse.tabUrl, x, y, targetCssSelector, time });
            //currently not being sent back targetCssSelector
            console.log(`Mouse clicked! Values stored in background storage => latestStepId: ${mouseClickResponse.latestStepId} tabId: ${mouseClickResponse.tabId}, tabUrl: ${mouseClickResponse.tabUrl}, x: ${mouseClickResponse.x}, y: ${mouseClickResponse.y}, interval: ${mouseClickResponse.interval}`);
            
            let endTime = Date.now();
            console.log(`Round trip operation from mouse click to storage to response received back in content script: ${endTime - mouseClickResponse.time} ms`);
        }
    },
    // {
    //     element: document.querySelectorAll('input'),
    //     eventType: 'input',
    //     handler: async function (event) {
    //         let target = event.target;
    //         let time = Date.now();
    //         let inputText;

    //         console.log('\n');
    //         console.log(`In content-script.js, input target is ${target}`);
    //         let targetCssSelector = generateCssSelector(target);
    //         console.log('cssSelector for input target:', targetCssSelector);

    //         //TODO: handle target.isContentEditable elements
    //         if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    //             inputText = target.value;

    //             const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');
    
    //             console.log(`content-script.js: input tab info:`);
    //             console.log(`tabId: ${tabInfoResponse.tabId}`);
    //             console.log(`tabUrl: ${tabInfoResponse.tabUrl}`);
                
    //             //TODO: handle background messaging and storage
    //             const inputResponse = await chrome.runtime.sendMessage({ action: 'input', tabId: tabInfoResponse.tabId, tabUrl: tabInfoResponse.tabUrl, inputText, targetCssSelector, time });
    //             //currently not being sent back targetCssSelector
    //             console.log(`Input typed! Values stored in background storage => latestStepId: ${inputResponse.latestStepId} tabId: ${inputResponse.tabId}, tabUrl: ${inputResponse.tabUrl}, inputText: ${inputResponse.inputText}, interval: ${inputResponse.interval}`);
                
    //             let endTime = Date.now();
    //             console.log(`Round trip operation from input to storage to response received back in content script: ${endTime - inputResponse.time} ms`);
    //         }

    //     }
    // },
    {
        element: document,
        eventType: 'keydown',
        handler: async function (event) {
            let target = event.target;
            let time = Date.now();
            let keyValue = event.key;

            console.log('\n');
            console.log(`In content-script.js, input target is ${target}`);
            console.log(`In content-script.js, key pressed is ${keyValue}`);
            let targetCssSelector = generateCssSelector(target);
            console.log('cssSelector for input target:', targetCssSelector);


            const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');

            console.log(`content-script.js: input tab info:`);
            console.log(`tabId: ${tabInfoResponse.tabId}`);
            console.log(`tabUrl: ${tabInfoResponse.tabUrl}`);
            
            //TODO: handle background messaging and storage
            const keydownResponse = await chrome.runtime.sendMessage({ action: 'keydown', tabId: tabInfoResponse.tabId, tabUrl: tabInfoResponse.tabUrl, keyValue, targetCssSelector, time });
            //currently not being sent back targetCssSelector
            console.log(`Keydown! Values stored in background storage => latestStepId: ${keydownResponse.latestStepId} tabId: ${keydownResponse.tabId}, tabUrl: ${keydownResponse.tabUrl}, inputText: ${keydownResponse.keyValue}, interval: ${keydownResponse.interval}`);
            
            let endTime = Date.now();
            console.log(`Round trip operation from keydown to storage to response received back in content script: ${endTime - keydownResponse.time} ms`);
        }
    },
];

console.log('content-script.js is loading...');

chrome.runtime.sendMessage('is-recording-already-enabled', (response) => {
    if (response === 'recording-enabled') {
        console.log(`content-script.js: content of window changed. confirmed that recording should still be enabled.`);
        addAllListeners();
    } else if (response === 'recording-disabled') {
        console.log(`content-script.js: content of window changed. confirmed that recording should still be disabled.`);
        removeAllListeners();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('content-script.js: received message from background');
    
    const signalController = {
        shouldStop: false,
        timeoutIds: [],
        stopPlayback: function() {
            this.shouldStop = true
            this.timeoutIds.forEach(id => clearTimeout(id));
            this.timeoutIds = [];
        }
    };

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
    if (message.action === 'start-playback') {
        alert(`content-script.js: playback started on tab ${message.tabId}`);
        sendResponse({ tabId: message.tabId, message: 'content-script-playback-started'});
        console.log(`content-script.js: playbackArray => ${JSON.stringify(message.playbackArray)}`);
        startPlayback(message.playbackArray, signalController);
    }
    if (message.action === 'stop-playback') {
        signalController.stopPlayback();
        alert(`content-script.js: playback stopped on tab ${message.tabId}`);
        sendResponse({ tabId: message.tabId, message: 'content-script-playback-stopped'});
    }
});

function addAllListeners() {
    listeners.forEach(({ element, eventType, handler }) => {
        //element has length is using querySelectorAll to get elements in listeners
        if (element.length) {
            element.forEach(el => {
                el.addEventListener(eventType, handler);
            });
        } else {
            element.addEventListener(eventType, handler);
        }
    }
    );
}

function removeAllListeners() {
    listeners.forEach(({ element, eventType, handler }) => {
        //element has length is using querySelectorAll to get elements in listeners
        if (element.length) {
            element.forEach(el => {
                el.removeEventListener(eventType, handler);
            });
        } else {
            element.removeEventListener(eventType, handler);
        }
    });
}

function startPlayback(playbackArray, signalController) {
    const firstEvent = playbackArray[0];
    chrome.runtime.sendMessage('get-tab-info', (response) => {
        console.log(`Playback tabUrl: ${response.tabUrl}`);
        if (response.tabUrl === firstEvent.tabUrl) {
            continuePlayback(playbackArray, signalController);
        } else {
            chrome.runtime.sendMessage('stop-playback', (response) => {
                if (chrome.runtime.lastError) {
                    console.log(`startPlayback: error occured on stop-playback message from content-script => ${chrome.runtime.lastError}`);
                } else {
                    console.log(`startPlayback: ${response.message} occured on tab ${response.tabId}.`);
                    alert(`Please navigate to starting url before clicking playback.`);
                }
            });
        }
    });
}

function continuePlayback(playbackArray, signalController) {
    let totalInterval = 0;
    let index = 0;
    while (!signalController.shouldStop && index < playbackArray.length) {
        let timeoutId;
        const event = playbackArray[index];
        const interval = event.interval;
        totalInterval += interval;
        if (event.action === 'click') {
            timeoutId = setTimeout(generateMouseEvent, totalInterval, event);
        } else if (event.action === 'input') {
            timeoutId = setTimeout(generateInputEvent, totalInterval, event);
        }
        signalController.timeoutIds.push(timeoutId);
        if (index === playbackArray.length - 1) {
            const timeoutId = setTimeout(() => {
                //TODO: error handling
                chrome.runtime.sendMessage('playback-complete', (response) => {
                    alert(`content-script.js: ${response.message} on tab ${response.tabId}`);
                });
            }, totalInterval + 50);
            signalController.timeoutIds.push(timeoutId);
        }
        index++;
    }
}

function generateMouseEvent(event) {
    const { action, interval, x, y, tabUrl, tabId } = event;
    if (action === 'mousemove') {
        moveMouse(x, y);
    }
    if (action === 'click') {
        clickMouseLeft(x, y);
    }
}

function moveMouse(x, y) {
    const moveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,    // required - x coordinate relative to viewport
        clientY: y     // required - y coordinate relative to viewport
    });
    const element = document.elementFromPoint(x, y);
    element.dispatchEvent(moveEvent);
}

function clickMouseLeft(x, y) {
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,    // required - x coordinate relative to viewport
        clientY: y,    // required - y coordinate relative to viewport
        button: 0      // 0=left, 1=middle, 2=right
    });
    const element = document.elementFromPoint(x, y);
    element.dispatchEvent(clickEvent);
}

//TODO: generate input text on element on playback
//TODO: need to handle based on cssSelector possibly
function generateInputEvent(event) {
    const { action, interval, inputText, tabUrl, tabId } = event;
    const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
    });
};


function generateCssSelector(target) {
    const path = [];
    // first check if the element has an id, if it does, use #elementId,
    // if (target.id) {
    //         return `#${target.id}`;
    // }
    // if not: find if there are any siblings of same type:
    let current = target;
    while (current !== null) {
        const currTagName = current.tagName.toLowerCase();
        const parent = current.parentElement;
        //reach html element and parent is null
        if (parent === null) {
            path.unshift(currTagName);
            break;
        }

        const siblings = parent.children;
        if (siblings.length === 1) {
            path.unshift(currTagName);
            current = parent;
            continue;
        }

        let totalCount = 0;
        let currCount;
        for (let sibling of siblings) {
            if (current === sibling) {
                totalCount++;
                currCount = totalCount;
                continue;
            }
            const siblingTagName = sibling.tagName.toLowerCase();
            if (siblingTagName === currTagName) {
                totalCount++;
            }
        }

        if (totalCount === 1) {
            path.unshift(currTagName);
        } else {
            path.unshift(`${currTagName}:nth-of-type(${currCount})`);
        }

        current = parent;
    }

    return path.join(' > ');
}


//is this a textbox
//if it's a textbox, capture the text

