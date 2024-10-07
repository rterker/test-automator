console.log('Popup.js is loading...');

const recordButton = document.getElementById('record-button');
const playbackButton = document.getElementById('playback-button');

// const addRecordingListener = initializeRecordListener();
// const addPlaybackListener = initializePlaybackListener();

// addPlaybackListener();
// addRecordingListener();

// function initializeRecordListener() {
//     let recording = false;

//     return () => {
//         recordButton.addEventListener('click', (event) => {
//             console.log(`Recording? ${recording}`);
//             if (!recording) {
//                 chrome.runtime.sendMessage('start-recording', (response) => {
            
//                 });
//             } else {
//                 chrome.runtime.sendMessage('stop-recording', (response) => {
            
//                 });
//             }
//             recording = !recording;
//         });
//     }

// }

// (() => {
//     let recording = false;
//     recordButton.addEventListener('click', (event) => {
//         console.log(`Recording? ${recording}`);
//         if (!recording) {
//             chrome.runtime.sendMessage('start-recording', (response) => {
        
//             });
//         } else {
//             chrome.runtime.sendMessage('stop-recording', (response) => {
        
//             });
//         }
//         recording = !recording;
//     });
// })();


// function initializePlaybackListener() {
//     let playing = false;

//     return () => {
//         playbackButton.addEventListener('click', (event) => {
//             console.log(`Playing? ${playing}`);
//             if (!playing) {
//                 chrome.runtime.sendMessage('start-playback', (response) => {
            
//                 });
//             } else {
//                 chrome.runtime.sendMessage('stop-playback', (response) => {
            
//                 });
//             }
//             playing = !playing;
//         });
//     }
// }

// (() => {
//     let playing = false;
//     playbackButton.addEventListener('click', (event) => {
//         console.log(`Playing? ${playing}`);
//         if (!playing) {
//             chrome.runtime.sendMessage('start-playback', (response) => {
        
//             });
//         } else {
//             chrome.runtime.sendMessage('stop-playback', (response) => {
        
//             });
//         }
//         playing = !playing;
//     });
// })();


recordButton.addEventListener('click', (event) => {
    console.log(`popup.js: recordButton 'click' listener being added.`);
    new Promise((resolve, reject) => {
        chrome.runtime.sendMessage('get-recording-status', (response) => {
            console.log(`popup.js: response received for get-recording-status message.`);
            if (response.isRecording) {
                resolve(true);
            } else if (!response.isRecording) {
                resolve(false);
            } else {
                reject(runtime.lastError);
            }
        });
    })
    .then((recordingStatus) => {
        console.log(`popup.js: recordButton listener => recording? ${recordingStatus}`); 
        if (recordingStatus === false) {
            chrome.runtime.sendMessage('start-recording', (response) => {
    
    
            });
        } else if (recordingStatus === true) {
            chrome.runtime.sendMessage('stop-recording', (response) => {
    
            });
        }
    })
    .catch((err) => {
        console.log(`Error occured in recordButton event listener: ${err}`);
    });

});



playbackButton.addEventListener('click', (event) => {
    chrome.runtime.sendMessage('get-playback-status', (response) => {

    });
});
