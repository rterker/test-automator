console.log('popup.js is loading...');

const recordButton = document.getElementById('record-button');
const playbackButton = document.getElementById('playback-button');

function errorHandler(file, location, error) {
    return console.log(`${file}: error occured in ${location}: ${error}`);
  }

recordButton.addEventListener('click', (event) => {
    chrome.runtime.sendMessage('get-recording-status', (response) => {
        console.log(`popup.js: response received for get-recording-status message.`);
        const recording = response.isRecording;
        console.log(`popup.js: recordButton listener => recording in tab ${response.tabId}? ${recording}`); 
        if (!recording) {
            chrome.runtime.sendMessage('start-recording', (response) => {
                const error = runtime.lastError;
                if (error) {
                    errorHandler('popup.js', 'recordButton', error);
                } else {
                    console.log(`popup.js: recording started for tab: ${response.tabId}`);
                }
            });
        } else if (recording) {
            chrome.runtime.sendMessage('stop-recording', (response) => {;
                const error = runtime.lastError;
                if (error) {
                    errorHandler('popup.js', 'recordButton', error);
                } else {
                    console.log(`popup.js: recording stopped for tab: ${response.tabId}`);
                }
            });
        } else {
            console.log(`popup.js: error occured in recordButton event listener: ${runtime.lastError}`);
        }
    });
});

playbackButton.addEventListener('click', (event) => {
    chrome.runtime.sendMessage('get-playback-status', (response) => {
        console.log(`popup.js: response received for get-playback-status message.`);
        const playing = response.isPlaying;
        const recording = response.isRecording;
        console.log(`popup.js: playbackbutton listener => playing in tab ${response.tabId}? ${playing}`); 
        console.log(`popup.js: playbackbutton listener => recording in tab ${response.tabId}? ${recording}`); 

        if (recording) {
            return alert('Recording in progress. Please end recording before attempting to plackback.');
        }

        if (!playing) {
            chrome.runtime.sendMessage('start-playing', (response) => {
                const error = runtime.lastError;
                if (error) {
                    errorHandler('popup.js', 'playbackButton', error);
                } else {
                    console.log(`popup.js: playback started for tab: ${response.tabId}`);
                }
            });
        } else if (playing) {
            chrome.runtime.sendMessage('stop-playing', (response) => {
                const error = runtime.lastError;
                if (error) {
                    errorHandler('popup.js', 'playbackButton', error);
                } else {
                    console.log(`popup.js: playback stopped for tab: ${response.tabId}`);
                }
            });
        } else {
            errorHandler('popup.js', 'playbackButton', runtime.lastError);
        }
    });
});
