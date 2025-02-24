// import { logger, ERROR } from "../modules/logger.js";

document.addEventListener('DOMContentLoaded', () => {  
    // const path = import.meta.url;
     
    const recordButton = document.getElementById('record');
    const recordingText = document.querySelector('#recording-text');
    const playbackButton = document.getElementById('playback');
    const playbackText = document.querySelector('#playback-text');
    const testId = document.getElementById('testId');
    const submit = document.getElementById('submit');
    const refresh = document.getElementById('refresh');  
    const openWindow = document.getElementById('open-window');

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const { action, tabId, alertMessage } = message;

        switch (action) {
            case 'playback-complete':
                playbackButton.classList.remove('playing');
                playbackText.textContent = 'Playback';
                alert(alertMessage);
                break;
            case 'auto-stop-playback':
                playbackButton.classList.remove('playing');
                playbackText.textContent = 'Playback';
                alert(alertMessage);
            break;
        
            default:
                break;
        }
    });

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
            console.log(`Response received for get-recording-status message.`);
            const playing = response.isPlaying;
            const recording = response.isRecording;
            console.log(`RecordButton listener => playing in tab ${response.tabId}? ${playing}`); 
            console.log(`RecordButton listener => recording in tab ${response.tabId}? ${recording}`); 
    
            if (playing) {
                return alert(`Playback in progress. Please end playback before attempting to record.`);
            }
    
            if (!recording) {
                recordButton.classList.add('recording');
                recordingText.textContent = 'Recording...';
                chrome.runtime.sendMessage('start-recording', (response) => {
                    if (response.error) {
                        recordButton.classList.remove('recording');
                        recordingText.textContent = 'Record';
                    }
                    if (response.message === 'content-script-recording-started') {
                        console.log(`Recording started for tab: ${response.tabId}`);
                    }
                    alert(response.alert);
                });
            } else if (recording) {
                recordButton.classList.remove('recording');
                recordingText.textContent = 'Record';
                chrome.runtime.sendMessage('stop-recording', (response) => {;
                    const error = chrome.runtime.lastError;
                    if (error) {
                        console.error(error);
                    } 
                    if (response.message === 'content-script-recording-stopped') {
                        console.log(`Recording stopped for tab: ${response.tabId}`);
                    }
                    alert(response.alert);
                });
            } else {
                console.error(`Error occured in recordButton event listener: ${chrome.runtime.lastError}`);
            }
        });
    });
    
    playbackButton.addEventListener('click', (event) => {
        chrome.runtime.sendMessage('get-playback-status', (response) => {
            console.log(`Response received for get-playback-status message.`);
            const playing = response.isPlaying;
            const recording = response.isRecording;
            console.log(`playbackbutton listener => playing in tab ${response.tabId}? ${playing}`); 
            console.log(`playbackbutton listener => recording in tab ${response.tabId}? ${recording}`); 
    
            if (recording) {
                return alert('Recording in progress. Please end recording before attempting to plackback.');
            }
    
            if (!playing) {
                playbackButton.classList.add('playing');
                playbackText.textContent = 'Playing...';
                chrome.runtime.sendMessage('start-playback', (response) => {
                    if (response.error) {
                        playbackButton.classList.remove('playing');
                        playbackText.textContent = 'Playback';
                        console.error(response.error);
                    } else {
                        console.log(`Playback started for tab: ${response.tabId}`);
                    }
                    alert(response.alert);
                });
            } else if (playing) {
                //TODO: REFACTOR
                playbackButton.classList.remove('playing');
                playbackText.textContent = 'Playback';
                chrome.runtime.sendMessage('stop-playback', (response) => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        console.error(error);
                    } else {
                        console.log(`Playback stopped for tab: ${response.tabId}`);
                    }
                    alert(response.alert);
                });
            } else {
                console.error(`Error occured in playbackButton event listener: ${chrome.runtime.lastError}`);
            }
        });
    });
});

