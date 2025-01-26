//TODO: finish this logic to apply if page reloaded from cache
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      console.log("Reinitializing content script after bfcache restore.");
      // Your reinitialization logic here
    }
  });
  

const listeners = [
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
            console.log('mouseClickResponse:', mouseClickResponse)
            console.log(`Mouse clicked! Values stored in background storage => stepId: ${mouseClickResponse.stepId} tabId: ${mouseClickResponse.tabId}, tabUrl: ${mouseClickResponse.tabUrl}, x: ${mouseClickResponse.x}, y: ${mouseClickResponse.y}, targetCssSelector: ${mouseClickResponse.targetCssSelector}, interval: ${mouseClickResponse.interval}`);
            
            let endTime = Date.now();
            console.log(`Round trip operation from mouse click to storage to response received back in content script: ${endTime - mouseClickResponse.time} ms`);
        }
    },
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
            console.log('keydownResponse:', keydownResponse)
            console.log(`Keydown! Values stored in background storage => stepId: ${keydownResponse.stepId} tabId: ${keydownResponse.tabId}, tabUrl: ${keydownResponse.tabUrl}, keyValue: ${keydownResponse.keyValue}, targetCssSelector: ${keydownResponse.targetCssSelector}, interval: ${keydownResponse.interval}`);
            
            let endTime = Date.now();
            console.log(`Round trip operation from keydown to storage to response received back in content script: ${endTime - keydownResponse.time} ms`);
        }
    },
];

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
        console.log(`content-script.js: playbackArray => ${JSON.stringify(message.playbackArray, null, 2)}`);
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
    //TODO: playbackarray[0] is the url of the first event, e.g. click, but it's not where you are when you start recording. it should be
    const firstEvent = playbackArray[0];
    chrome.runtime.sendMessage('get-tab-info', (response) => {
        console.log(`Playback tabUrl: ${response.tabUrl}`);
        //TODO: this is not working correctly. i navigate back to starting url and it alerts me to navigate back to starting url
        if (response.tabUrl === firstEvent.tabUrl) {
            continuePlayback(playbackArray, signalController);
        } else {
            chrome.runtime.sendMessage('stop-playback', (response) => {
                if (chrome.runtime.lastError) {
                    console.log(`startPlayback: error occured on stop-playback message from content-script => ${chrome.runtime.lastError}`);
                } else if (response.message === 'wrong-tab') {
                    alert(`startPlayback: ${response.tabId} is not the test tab`);
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
        } else if (event.action === 'keydown') {
            timeoutId = setTimeout(generateTyping, totalInterval, event);
        }
        signalController.timeoutIds.push(timeoutId);
        if (index === playbackArray.length - 1) {
            const timeoutId = setTimeout(() => {
                //TODO: error handling
                chrome.runtime.sendMessage('playback-complete', (response) => {
                    if (response.message !== 'wrong-tab') {
                        alert(`content-script.js: ${response.message} on tab ${response.tabId}`);
                    } else {
                        alert(`content-script.js: tab ${response.tabId} is not the set test tab`);
                    }

                });
            }, totalInterval + 50);
            signalController.timeoutIds.push(timeoutId);
        }
        index++;
    }
}

function generateMouseEvent(event) {
    const { action, interval, x, y, tabUrl, tabId } = event;
    if (action === 'click') {
        clickMouseLeft(x, y);
    }
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

//TODO: why does the targetElement.value always reset even if there was something in the text box before playback
//TODO: handle backspace, space, delete, enter
function generateTyping(event) {
    const { action, interval, keyValue, tabUrl, tabId, targetCssSelector } = event;
    const targetElement = document.querySelector(targetCssSelector); 

    const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: keyValue,
    });

    const keydownEvent = new KeyboardEvent("keydown", {
        key: keyValue,        // The key that was pressed
        // code: "KeyA",    // The physical key on the keyboard
        // keyCode: 65,     // Deprecated but sometimes needed for older browsers
        // charCode: 65,    // Deprecated
        // which: 65,       // Deprecated but used in some older libraries
        bubbles: true,   // Ensures the event bubbles up the DOM
        cancelable: true // Allows event.preventDefault() to be called
    });

    const keyupEvent = new KeyboardEvent("keyup", { 
        key: keyValue, 
        bubbles: true, 
        cancelable: true 
    });
        
    // Dispatch the events for any event listeners on the page
    targetElement.dispatchEvent(keydownEvent); 
    
    //update value: this will start the element value back at empty. not sure why
    const currVal = targetElement.value || '';
    if (isAlphaNumeric(keyValue)) {
        targetElement.value = currVal + keyValue;
    }

    targetElement.dispatchEvent(inputEvent);  
    targetElement.dispatchEvent(keyupEvent);
}


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

function isAlphaNumeric(keyValue) {
    return (['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].includes(keyValue.toLowerCase()) || ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(keyValue));
}

function handleBackspace() {
    
}

function handleEnter() {

}