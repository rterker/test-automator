const logger = {
    log: function(message, path, type = 'INFO') {
        const entry = {
        time: new Date().toLocaleString(),
        type,
        message,
        path
        };

        if (type === 'INFO') console.log(entry);
        if (type === 'ERROR') console.error(entry);
    }
};

const path = 'chrome-extension://ofgadbmdeibbpnemdmcnjchnpfpmloop/popup.js';
const ERROR = 'ERROR';

logger.log('popup.js is loading...', path);

const recordButton = document.getElementById('record-button');
const playbackButton = document.getElementById('playback-button');


recordButton.addEventListener('click', (event) => {
    chrome.runtime.sendMessage('get-recording-status', (response) => {
        logger.log(`Response received for get-recording-status message.`, path);
        const playing = response.isPlaying;
        const recording = response.isRecording;
        logger.log(`RecordButton listener => playing in tab ${response.tabId}? ${playing}`, path); 
        logger.log(`RecordButton listener => recording in tab ${response.tabId}? ${recording}`, path); 

        if (playing) {
            return alert(`Playback in progress. Please end playback before attempting to record.`);
        }

        if (!recording) {
            chrome.runtime.sendMessage('start-recording', (response) => {
                const error = chrome.runtime.lastError;
                if (error) {
                    logger.log(error, path, ERROR);
                } else {
                    logger.log(`Recording started for tab: ${response.tabId}`, path);
                }
            });
        } else if (recording) {
            chrome.runtime.sendMessage('stop-recording', (response) => {;
                const error = chrome.runtime.lastError;
                if (error) {
                    logger.log(error, path, ERROR);
                } else {
                    logger.log(`Recording stopped for tab: ${response.tabId}`, path);
                }
            });
        } else {
            logger.log(`Error occured in recordButton event listener: ${chrome.runtime.lastError}`, path, ERROR);
        }
    });
});

//TODO: check on playback click whether the starting url is the same as the starting url for the recording. if not, throw an error and don't playback
playbackButton.addEventListener('click', (event) => {
    chrome.runtime.sendMessage('get-playback-status', (response) => {
        logger.log(`Response received for get-playback-status message.`, path);
        const playing = response.isPlaying;
        const recording = response.isRecording;
        logger.log(`playbackbutton listener => playing in tab ${response.tabId}? ${playing}`, path); 
        logger.log(`playbackbutton listener => recording in tab ${response.tabId}? ${recording}`, path); 

        if (recording) {
            return alert('Recording in progress. Please end recording before attempting to plackback.');
        }

        if (!playing) {
            chrome.runtime.sendMessage('start-playback', (response) => {
                const error = chrome.runtime.lastError;
                if (error) {
                    logger.log(error, path, ERROR);
                } else {
                    logger.log(`Playback started for tab: ${response.tabId}`, path);
                }
            });
        } else if (playing) {
            chrome.runtime.sendMessage('stop-playback', (response) => {
                const error = chrome.runtime.lastError;
                if (error) {
                    logger.log(error, path, ERROR);
                } else {
                    logger.log(`Playback stopped for tab: ${response.tabId}`, path);
                }
            });
        } else {
            logger.log(`Error occured in playbackButton event listener: ${chrome.runtime.lastError}`, path, ERROR);
        }
    });
});
