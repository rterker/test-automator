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

(() => {
    let recording = false;
    recordButton.addEventListener('click', (event) => {
        console.log(`Recording? ${recording}`);
        if (!recording) {
            chrome.runtime.sendMessage('start-recording', (response) => {
        
            });
        } else {
            chrome.runtime.sendMessage('stop-recording', (response) => {
        
            });
        }
        recording = !recording;
    });
})();


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

(() => {
    let playing = false;
    playbackButton.addEventListener('click', (event) => {
        console.log(`Playing? ${playing}`);
        if (!playing) {
            chrome.runtime.sendMessage('start-playback', (response) => {
        
            });
        } else {
            chrome.runtime.sendMessage('stop-playback', (response) => {
        
            });
        }
        playing = !playing;
    });
})();