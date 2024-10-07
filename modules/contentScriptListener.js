console.log('contentScriptListener.js is loading...');

import { isRecording, isPlaying } from "./tabExtensionStatus.js";

export const setupContentScriptListener = () => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('contentScriptListener.js: message received.');
    
        if (message === 'content-script-loaded') {
          console.log(`contentScriptListener.js: sender.tab.id = ${sender.tab.id}`);
            const recording = isRecording(sender.tab.id);
            if (recording) {
                sendResponse('recording-enabled');
            } else if (!recording) {
                sendResponse('recording-disabled');
            }
        }
    
        // if (message.action === 'mousemove') {
        //     const { x, y, tabUrl, target, time } = message;
        //     const obj = {x, y, tabUrl, target};
        //     chrome.storage.session.set({ x, y, tabUrl, target, time }).then(() => {
        //         console.log("Values set in storage");
    
        //       });
              
        //       chrome.storage.session.get(["x", "y", "tabUrl", "target", "time"]).then((result) => {
        //         console.log('x=', result.x);
        //         console.log('y=', result.y);
        //         console.log('tabUrl=', result.tabUrl);
        //         console.log('target=', result.target);
        //         console.log('time=', result.time);
        //       });
        //     sendResponse({ x, y, tabUrl, target, time });
        // }
    
        // if (message.action === 'click') {
        //     const { x, y, tabUrl, target, time } = message;
        //     chrome.storage.session.set({ key: value }).then(() => {
        //         console.log("Value was set");
        //       });
              
        //       chrome.storage.session.get(["key"]).then((result) => {
        //         console.log("Value is " + result.key);
        //       });
        //     sendResponse({ x, y, tabUrl, target, time });
        // }
    });
} 