document.addEventListener('DOMContentLoaded', () => {
    const logger = {
        log: function(message, path, type = 'INFO') {
            const entry = {
                time: new Date().toLocaleString(),
                type,
                message,
                path
            };
    
            if (type === 'INFO') {
                console.log('time: ', entry.time);
                console.log('path: ', entry.path);
                console.log('type: ', entry.type);
                console.log('message: ', entry.message);
                console.log('============================================');
              }
              if (type === 'ERROR') {
                console.error('time: ', entry.time);
                console.error('path: ', entry.path);
                console.error('type: ', entry.type);
                console.error('message: ', entry.message);
                console.error('============================================');
              }
        }
    };
    
    const path = 'chrome-extension://ofgadbmdeibbpnemdmcnjchnpfpmloop/popup.js';
    const ERROR = 'ERROR';
     
    const recordButton = document.getElementById('record');
    const recordingText = document.querySelector('#recording-text');
    const playbackButton = document.getElementById('playback');
    const playbackText = document.querySelector('#playback-text');
    const testId = document.getElementById('testId');
    const submit = document.getElementById('submit');
    const refresh = document.getElementById('refresh');  
    const openWindow = document.getElementById('open-window');

    window.addEventListener('blur', () => {
        chrome.runtime.sendMessage({ action: 'control-window-hidden' });
    });
    window.addEventListener('focus', () => {
        chrome.runtime.sendMessage({ action: 'control-window-focus' });
    });

    openWindow.addEventListener('click', async (event) => {
        const newWindow = await chrome.windows.create({
            type: 'normal',
            width: 1100,
            height: 1200,
            focused: false
          });

          const tabId = newWindow.tabs[0].id;
          chrome.runtime.sendMessage({ action: 'open-test-window', tabId });
    });
    
    //TODO: clean up error handling here
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
                recordButton.classList.add('recording');
                recordingText.textContent = 'Recording...';
                chrome.runtime.sendMessage('start-recording', (response) => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        logger.log(error, path, ERROR);
                    } 
                    if (response.message === 'content-script-recording-started') {
                        logger.log(`Recording started for tab: ${response.tabId}`, path);
                    }
                    alert(response.alert);
                });
            } else if (recording) {
                recordButton.classList.remove('recording');
                recordingText.textContent = 'Record';
                chrome.runtime.sendMessage('stop-recording', (response) => {;
                    const error = chrome.runtime.lastError;
                    if (error) {
                        logger.log(error, path, ERROR);
                    } 
                    if (response.message === 'content-script-recording-stopped') {
                        logger.log(`Recording stopped for tab: ${response.tabId}`, path);
                    }
                    alert(response.alert);
                });
            } else {
                logger.log(`Error occured in recordButton event listener: ${chrome.runtime.lastError}`, path, ERROR);
            }
        });
    });
    
    //TODO: check on playback click whether the starting url is the same as the starting url for the recording. if not, throw an error and don't playback
    //TODO: clean up error handling here
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
                playbackButton.classList.add('playing');
                playbackText.textContent = 'Playing...';
                chrome.runtime.sendMessage('start-playback', (response) => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        logger.log(error, path, ERROR);
                    } else {
                        logger.log(`Playback started for tab: ${response.tabId}`, path);
                    }
                    alert(response.alert);
                });
            } else if (playing) {
                playbackButton.classList.remove('playing');
                playbackText.textContent = 'Playback';
                chrome.runtime.sendMessage('stop-playback', (response) => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        logger.log(error, path, ERROR);
                    } else {
                        logger.log(`Playback stopped for tab: ${response.tabId}`, path);
                    }
                    alert(response.alert);
                });
            } else {
                logger.log(`Error occured in playbackButton event listener: ${chrome.runtime.lastError}`, path, ERROR);
            }
        });
    });
});

