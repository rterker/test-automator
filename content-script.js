//TODO: finish this logic to apply if page reloaded from cache
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      console.log("Reinitializing content script after bfcache restore.");
      // Your reinitialization logic here
    }
});
  
chrome.runtime.sendMessage('is-this-a-test-tab', (response) => {
    if (response === true) {
        //these event listeners seem a little unreliable, so may need to choose another one later, but this is ok for now
        window.addEventListener('blur', () => {
            chrome.runtime.sendMessage({ action: 'test-tab-hidden' });
        });
        window.addEventListener('focus', () => {
            chrome.runtime.sendMessage({ action: 'test-tab-focus' });
        });
        console.log('TEST TAB ACTIVATED');
        activateTestTab();
    } 
    if (response === false) {
        console.log('is-this-a-test-tab message returned false. This tab is not activated for testing.');
    }
});
    
function activateTestTab() {
    const listeners = [
        {
            element: document, 
            eventType: 'click', 
            handler: async function (event) {
                let x = event.clientX;
                let y = event.clientY;
                let target = event.target;
                let time = Date.now();
                let targetCssSelector = generateCssSelector(target);
                let cursorPosition = target.selectionStart;
                const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');

                console.log(`content-script.js: click tab info:`);
                console.log(`tabId: ${tabInfoResponse.tabId}`);
                console.log(`tabUrl: ${tabInfoResponse.tabUrl}`);
                
                const mouseClickResponse = await chrome.runtime.sendMessage({ action: 'click', tabId: tabInfoResponse.tabId, tabUrl: tabInfoResponse.tabUrl, x, y, cursorPosition, targetCssSelector, time });
                console.log('mouseClickResponse:', mouseClickResponse)
                console.log(`Mouse clicked! Values stored in background storage => action: ${mouseClickResponse.action} stepId: ${mouseClickResponse.stepId} \
                    tabId: ${mouseClickResponse.tabId}, tabUrl: ${mouseClickResponse.tabUrl}, x: ${mouseClickResponse.x}, y: ${mouseClickResponse.y}, \
                    cursorPosition: ${mouseClickResponse.cursorPosition}, targetCssSelector: ${mouseClickResponse.targetCssSelector}, interval: ${mouseClickResponse.interval}`);
                
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
                let key = event.key;
                let code = event.code;
                let modifiers = {
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    altKey: event.altKey,
                    metaKey: event.metaKey
                };
                let cursorPosition = target.selectionStart;
                let targetCssSelector = generateCssSelector(target);    
    
                console.log('\n');
                console.log(`In content-script.js, input target is ${target}`);
                console.log(`In content-script.js, key pressed is ${key}`);
                console.log(`In content-script.js, code pressed is ${code}`);
                console.log(`In content-script.js, modifiers pressed are ${JSON.stringify(modifiers, null, 2)}`);
    
                const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');
    
                console.log(`content-script.js: input tab info:`);
                console.log(`tabId: ${tabInfoResponse.tabId}`);
                console.log(`tabUrl: ${tabInfoResponse.tabUrl}`);
                
                const keydownResponse = await chrome.runtime.sendMessage({ action: 'keydown', tabId: tabInfoResponse.tabId, tabUrl: tabInfoResponse.tabUrl, key, code, modifiers, cursorPosition, targetCssSelector, time });
                console.log('keydownResponse:', keydownResponse)
                console.log(`Keydown! Values stored in background storage => action: ${keydownResponse.action} stepId: ${keydownResponse.stepId} \
                    tabId: ${keydownResponse.tabId}, tabUrl: ${keydownResponse.tabUrl}, key: ${keydownResponse.key}, code: ${keydownResponse.code}, \
                    modifiers: ${keydownResponse.modifiers}, cursorPosition: ${keydownResponse.cursorPosition}, targetCssSelector: ${keydownResponse.targetCssSelector}, 
                    interval: ${keydownResponse.interval}`);
                
                let endTime = Date.now();
                console.log(`Round trip operation from keydown to storage to response received back in content script: ${endTime - keydownResponse.time} ms`);
            }
        },
    ];

    chrome.runtime.sendMessage('is-recording-already-enabled', (response) => {
        if (response === 'recording-enabled') {
            console.log(`content-script.js: content of window changed. confirmed that recording should still be enabled.`);
            addAllListeners(listeners);
        } else if (response === 'recording-disabled') {
            console.log(`content-script.js: content of window changed. confirmed that recording should still be disabled.`);
            removeAllListeners(listeners);
        }
    });

    const signalController = {
        shouldStop: false,
        timeoutIds: [],
        stopPlayback: function() {
            this.shouldStop = true
            this.timeoutIds.forEach(id => {
                console.log('clearing out timeoutId: ', id);
                clearTimeout(id);
            });
            this.timeoutIds = [];
        }
    };
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('content-script.js: received message from background');
        
    
        if (message.action === 'start-recording') {
            addAllListeners(listeners);
            sendResponse({ tabId: message.tabId, tabUrl: window.location.href, message: 'content-script-recording-started', alert: `content-script.js: recording started on tab ${message.tabId}` });
        }
        if (message.action === 'stop-recording') {
            removeAllListeners(listeners);
            sendResponse({ tabId: message.tabId, message: 'content-script-recording-stopped', alert: `content-script.js: recording stopped on tab ${message.tabId}` });
        }
        if (message.action === 'start-playback') {
            sendResponse({ tabId: message.tabId, message: 'content-script-playback-started', alert: `content-script.js: playback started on tab ${message.tabId}` });
            console.log(`content-script.js: playbackObject => ${JSON.stringify(message.playbackObject, null, 2)}`);
            startPlayback(message.playbackObject, message.tabId, signalController);
        }
        if (message.action === 'stop-playback') {
            signalController.stopPlayback();
            sendResponse({ tabId: message.tabId, message: 'content-script-playback-stopped', alert: `content-script.js: playback stopped on tab ${message.tabId}` });
        }
    });
}



function addAllListeners(listeners) {
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

function removeAllListeners(listeners) {
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

function startPlayback(playbackObject, tabId, signalController) {
    const playbackSteps = playbackObject.steps;
    const initUrl = playbackObject.initUrl;
    chrome.runtime.sendMessage('get-tab-info', (response) => {
        console.log(`Playback tabUrl: ${response.tabUrl}`);
        console.log(`Playback tabId: ${response.tabId}`);
        console.log(`Playback initUrl: ${initUrl}`);
        if (response.tabUrl === initUrl) {
            continuePlayback(playbackSteps, tabId, signalController);
        } else {
            const action = 'auto-stop-playback';
            const alertMessage = `Please navigate to starting url before clicking playback.`;
            chrome.runtime.sendMessage({ action, tabId, alertMessage }, (response) => {
                console.log('STOP-PLAYBACK AUTO-INVOKED');
                if (chrome.runtime.lastError) {
                    console.log(`startPlayback: error occured on stop-playback message from content-script => ${chrome.runtime.lastError}`);
                } else {
                    console.log(`startPlayback: ${response.action} occured on tab ${response.tabId}.`);
                }
            });
        }
    });
}

function continuePlayback(playbackSteps, tabId, signalController) {
    let totalInterval = 0;
    let index = 0;
    while (!signalController.shouldStop && index < playbackSteps.length) {
        let timeoutId;
        const event = playbackSteps[index];
        const interval = event.interval;
        totalInterval += interval;
        if (event.action === 'click') {
            timeoutId = setTimeout(generateMouseEvent, totalInterval, event);
        } else if (event.action === 'keydown') {
            timeoutId = setTimeout(generateTyping, totalInterval, event);
        }
        signalController.timeoutIds.push(timeoutId);
        if (index === playbackSteps.length - 1) {
            const timeoutId = setTimeout(() => {

                //TODO: error handling
                const action = 'playback-complete';
                const alertMessage = `content-script.js: ${action} on tab ${tabId}`;
                chrome.runtime.sendMessage({ action, tabId, alertMessage });
            }, totalInterval + 50);
            signalController.timeoutIds.push(timeoutId);
        }
        index++;
    }
}

function generateMouseEvent(event) {
    const { action, interval, x, y, tabUrl, tabId, targetCssSelector } = event;
    if (action === 'click') {
        clickMouseLeft(x, y, targetCssSelector);
    }
}

function clickMouseLeft(x, y, cssSelector) {
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        // clientX: x,    // required - x coordinate relative to viewport
        // clientY: y,    // required - y coordinate relative to viewport
        button: 0      // 0=left, 1=middle, 2=right
    });
    // const element = document.elementFromPoint(x, y);
    const element = document.querySelector(cssSelector);
    element.dispatchEvent(clickEvent);
}

//TODO: why does the targetElement.value always reset even if there was something in the text box before playback
//TODO: handle backspace, space, delete, enter
function generateTyping(event) {
    const { action, interval, key, code, modifiers, tabUrl, tabId, cursorPosition, targetCssSelector } = event;
    const element = document.querySelector(targetCssSelector); 
    
    const options = {
        key,
        code,
        bubbles: true,
        cancelable: true,
        composed: true, 
        ...modifiers
    };

    //return early if element is not text editable
    const tagName = element.tagName;
    if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') return console.log(`content-script => generateTyping: target is not a text editable element ${tagName} / ${typeof tagName}`);
    
    const isTypeableChar = key.length === 1;
    
    let type;
    if (isTypeableChar) {
        type = isNumber(key) ? 'Number' : (isLetter(key) ? 'Letter' : 'Symbol');
    } else {
        type = key;
    }

    const inputEvent = new InputEvent('input');
    const keydownEvent = new KeyboardEvent("keydown", options);
    const keyupEvent = new KeyboardEvent("keyup", options);

    
    const dispatch = {
        'Number': () => typeNumber(element, key, cursorPosition),
        'Letter': () => typeLetter(element, key, cursorPosition, modifiers.shiftKey),
        'Symbol': () => typeSymbol(element, key, cursorPosition),
        'Backspace': () => handleBackspace(element, cursorPosition),
        'Delete': () => handleDelete(element, cursorPosition),
        'Enter': () => handleEnter(element),
    };
    
    if (!dispatch[type]) return;
    
    // Dispatch the events for any event listeners on the page
    element.dispatchEvent(keydownEvent); 
    
    dispatch[type]();

    element.dispatchEvent(inputEvent);  
    element.dispatchEvent(keyupEvent);
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

function isLetter(key) {
    return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].includes(key.toLowerCase());
}

function isNumber(key) {
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(key);
}

function handleBackspace(element, cursor) {
    if (cursor === 0) return;
    return element.value = element.value.slice(0, cursor - 1) + element.value.slice(cursor);

}

function handleDelete(element, cursor) {
    if (cursor === element.value.length) return;
    return element.value = element.value.slice(0, cursor) + element.value.slice(cursor + 1);
}

function typeLetter(element, key, cursor, shift) {
    //handle caps lock cap letters
    const length = element.value.length;
    if (shift) key = key.toUpperCase();
    if (length === 0 || cursor === length) return element.value += key;
    if (cursor === 0) return  element.value = key + element.value;
    const first = element.value.slice(0, cursor);
    const second = element.value.slice(cursor);
    return element.value = first + key + second;
}

function typeSymbol(element, key, cursor) {
    const length = element.value.length;
    if (length === 0 || cursor === length) return element.value += key;
    if (cursor === 0) return  element.value = key + element.value;
    const first = element.value.slice(0, cursor);
    const second = element.value.slice(cursor);
    return element.value = first + key + second;
}

function typeNumber(element, key, cursor) {
    const length = element.value.length;
    if (length === 0 || cursor === length) return element.value += key;
    if (cursor === 0) return  element.value = key + element.value;
    const first = element.value.slice(0, cursor);
    const second = element.value.slice(cursor);
    return element.value = first + key + second;
}

function handleEnter(element) {
//Dispatch event + handle form submission if needed

}