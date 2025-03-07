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
        // console.log('TEST TAB ACTIVATED');
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
            eventType: 'focus',
            handler: async function (event) {
                let target = event.target;
                let tagName = target.tagName;
                const time = Date.now();
                let targetCssSelector = generateCssSelector(target);
                //TODO: do we need to identify the tab and url to make sure we are identifying the element on the right page?
                const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');
                const elementValue = target.value;
                const message = {
                    action: 'focus', 
                    tabId: tabInfoResponse.tabId, 
                    tabUrl: tabInfoResponse.tabUrl, 
                    tagName, 
                    targetCssSelector, 
                    elementValue, 
                    time
                };
                const focusResponse = await chrome.runtime.sendMessage(message);
                console.log(`Focus! Values stored in background storage => action: ${focusResponse.action}, tabId: ${focusResponse.tabId}, tabUrl: ${focusResponse.tabUrl}, tagName: ${focusResponse.tagName}, targetCssSelector: ${focusResponse.targetCssSelector}, initialValue: ${focusResponse.intialValue}, interval: ${focusResponse.interval}`);
                let endTime = Date.now();
                console.log(`Round trip operation from focus to storage to response received back in content script: ${endTime - time} ms`);
                // }
            }
        },
        {
            element: document, 
            eventType: 'click', 
            handler: async function (event) {
                let target = event.target;
                let tagName = target.tagName;
                let time = Date.now();
                let targetCssSelector = generateCssSelector(target);
                let cursorPosition = target.selectionStart;
                const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');    
                const message = {
                    action: 'click', 
                    tabId: tabInfoResponse.tabId, 
                    tabUrl: tabInfoResponse.tabUrl, 
                    tagName, 
                    cursorPosition, 
                    targetCssSelector, 
                    time
                };            
                const mouseClickResponse = await chrome.runtime.sendMessage(message);
                console.log(`Mouse clicked! Values stored in background storage => action: ${mouseClickResponse.action}, stepId: ${mouseClickResponse.stepId}, tabId: ${mouseClickResponse.tabId}, tabUrl: ${mouseClickResponse.tabUrl}, tagName: ${mouseClickResponse.tagName}, cursorPosition: ${mouseClickResponse.cursorPosition}, targetCssSelector: ${mouseClickResponse.targetCssSelector}, interval: ${mouseClickResponse.interval}`);
                let endTime = Date.now();
                console.log(`Round trip operation from mouse click to storage to response received back in content script: ${endTime - time} ms`);
            }
        },
        {
            element: document,
            eventType: 'keydown',
            handler: async function (event) {
                let target = event.target;
                let tagName = target.tagName;
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
                const tabInfoResponse = await chrome.runtime.sendMessage('get-tab-info');
                const message = {
                    action: 'keydown', 
                    tabId: tabInfoResponse.tabId, 
                    tabUrl: tabInfoResponse.tabUrl, 
                    tagName, 
                    key, 
                    code, 
                    modifiers, 
                    cursorPosition, 
                    targetCssSelector, 
                    time
                };
                const keydownResponse = await chrome.runtime.sendMessage(message);
                console.log(`Keydown! Values stored in background storage => action: ${keydownResponse.action}, stepId: ${keydownResponse.stepId}, tabId: ${keydownResponse.tabId}, tabUrl: ${keydownResponse.tabUrl}, tagName: ${keydownResponse.tagName}, key: ${keydownResponse.key}, code: ${keydownResponse.code}, modifiers: ${keydownResponse.modifiers}, cursorPosition: ${keydownResponse.cursorPosition}, targetCssSelector: ${keydownResponse.targetCssSelector}, interval: ${keydownResponse.interval}`);
                let endTime = Date.now();
                console.log(`Round trip operation from keydown to storage to response received back in content script: ${endTime - time} ms`);
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
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {      
        if (message.action === 'start-recording') {
            addAllListeners(listeners);
            sendResponse({ tabId: message.tabId, tabUrl: window.location.href, message: 'content-script-recording-started', alert: `Recording started on tab ${message.tabId}` });
        }
        if (message.action === 'stop-recording') {
            removeAllListeners(listeners);
            sendResponse({ tabId: message.tabId, message: 'content-script-recording-stopped', alert: `Recording stopped on tab ${message.tabId}` });
        }
        // if (message.type === 'playback-event') {
        //     playbackEvent(message.event);
        //     sendResponse({ event: message.event });
        // }
        if (message.action === 'get-bounding-box') {
            const { event } = message;
            sendResponse({ boundingBox: getBoundingBox(event) });
        }
    });
}

function addAllListeners(listeners) {
    listeners.forEach(({ element, eventType, handler }) => {
        //element has length is using querySelectorAll to get elements in listeners
        if (element.length) {
            element.forEach(el => {
                if (eventType === 'focus') {
                    //NOTE: passing true to capture event during capture phase 
                    return el.addEventListener(eventType, handler, true);
                }
                el.addEventListener(eventType, handler);
            });
        } else {
            if (eventType === 'focus') {
                return element.addEventListener(eventType, handler, true);
            }
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
                if (eventType === 'focus') {
                    return el.removeEventListener(eventType, handler, true);
                }
                el.removeEventListener(eventType, handler);
            });
        } else {
            if (eventType === 'focus') {
                return element.removeEventListener(eventType, handler, true);
            }
            element.removeEventListener(eventType, handler);
        }
    });
}

// function playbackEvent(event) {
//     switch(event.action) {
//         case 'click':
//             generateMouseEvent(event);
//             break;
//         case 'keydown': 
//             generateTyping(event);
//             break;
//         case 'focus':
//             focusOnElement(event);
//             break;
//         default:
//             break;
//     }
// }

function getBoundingBox(event) {
    const { targetCssSelector, action } = event;
    const element = document.querySelector(targetCssSelector);
    console.log('element in getBoundingBox:', element)
    console.log('action in getBoundingBox: ', action);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    const result = {
        x,
        y,
        width: rect.width,
        height: rect.height
    };
    console.log('result in getBoundingBox:', result)
    return result;
}

// function focusOnElement(event) {
//     const { action, interval, tabId, tabUrl, tagName, targetCssSelector, initialValue } = event;
//     const element = document.querySelector(targetCssSelector);
//     element.focus();
// }

// function generateMouseEvent(event) {
//     const { action, interval, x, y, tabUrl, tabId, targetCssSelector } = event;
//     if (action === 'click') {
//         clickMouseLeft(x, y, targetCssSelector);
//     }
// }


// function clickMouseLeft(x, y, cssSelector) {
//     const clickEvent = new MouseEvent('click', {
//         bubbles: true,
//         cancelable: true,
//         view: window,
//         // clientX: x,    // required - x coordinate relative to viewport
//         // clientY: y,    // required - y coordinate relative to viewport
//         button: 0      // 0=left, 1=middle, 2=right
//     });
//     // const element = document.elementFromPoint(x, y);
//     const element = document.querySelector(cssSelector);
//     element.dispatchEvent(clickEvent);
// }

// //TODO: why does the targetElement.value always reset even if there was something in the text box before playback
// //TODO: handle backspace, space, delete, enter
// function generateTyping(event) {
//     const { action, interval, key, code, modifiers, tabUrl, tabId, cursorPosition, targetCssSelector } = event;
//     const element = document.querySelector(targetCssSelector); 
    
//     const options = {
//         key,
//         code,
//         bubbles: true,
//         cancelable: true,
//         composed: true, 
//         ...modifiers
//     };

//     //return early if element is not text editable
//     const tagName = element.tagName;
//     if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') return console.log(`content-script => generateTyping: target is not a text editable element ${tagName} / ${typeof tagName}`);
    
//     const isTypeableChar = key.length === 1;
    
//     let type;
//     if (isTypeableChar) {
//         type = isNumber(key) ? 'Number' : (isLetter(key) ? 'Letter' : 'Symbol');
//     } else {
//         type = key;
//     }

//     const inputEvent = new InputEvent('input', { bubbles: true, cancelable: true, composed: true });
//     const keydownEvent = new KeyboardEvent("keydown", options);
//     const keyupEvent = new KeyboardEvent("keyup", options);

    
//     const dispatch = {
//         'Number': () => typeNumber(element, key, cursorPosition),
//         'Letter': () => typeLetter(element, key, cursorPosition, modifiers.shiftKey),
//         'Symbol': () => typeSymbol(element, key, cursorPosition),
//         'Backspace': () => handleBackspace(element, cursorPosition),
//         'Delete': () => handleDelete(element, cursorPosition),
//         'Enter': () => handleEnter(element),
//     };
    
//     if (!dispatch[type]) return;
    
//     // Dispatch the events for any event listeners on the page
//     element.dispatchEvent(keydownEvent); 
//     element.dispatchEvent(keyupEvent);
    
//     dispatch[type]();

//     element.dispatchEvent(inputEvent);  
// }


function generateCssSelector(target) {
    const path = [];
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

// function isLetter(key) {
//     return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].includes(key.toLowerCase());
// }

// function isNumber(key) {
//     return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(key);
// }

// function handleBackspace(element, cursor) {
//     if (cursor === 0) return;
//     return element.value = element.value.slice(0, cursor - 1) + element.value.slice(cursor);

// }

// function handleDelete(element, cursor) {
//     if (cursor === element.value.length) return;
//     return element.value = element.value.slice(0, cursor) + element.value.slice(cursor + 1);
// }

// function typeLetter(element, key, cursor, shift) {
//     //handle caps lock cap letters
//     const length = element.value.length;
//     if (shift) key = key.toUpperCase();
//     if (length === 0 || cursor === length) return element.value += key;
//     if (cursor === 0) return  element.value = key + element.value;
//     const first = element.value.slice(0, cursor);
//     const second = element.value.slice(cursor);
//     return element.value = first + key + second;
// }

// function typeSymbol(element, key, cursor) {
//     const length = element.value.length;
//     if (length === 0 || cursor === length) return element.value += key;
//     if (cursor === 0) return  element.value = key + element.value;
//     const first = element.value.slice(0, cursor);
//     const second = element.value.slice(cursor);
//     return element.value = first + key + second;
// }

// function typeNumber(element, key, cursor) {
//     const length = element.value.length;
//     if (length === 0 || cursor === length) return element.value += key;
//     if (cursor === 0) return  element.value = key + element.value;
//     const first = element.value.slice(0, cursor);
//     const second = element.value.slice(cursor);
//     return element.value = first + key + second;
// }

// function handleEnter(element) {
// //Dispatch event + handle form submission if needed

// }