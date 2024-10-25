console.log('tabStatus.js is loading...');

const tabRecordingStatus = {};
const tabPlaybackStatus = {};

export function initializeTab(tabId) {
    tabRecordingStatus[tabId] = false;
    tabPlaybackStatus[tabId] = false;
    console.log(`initializeTab: Recording status of ${tabId} is ${tabRecordingStatus[tabId]}`);
    console.log(`initializeTab: Playback status of ${tabId} is ${tabPlaybackStatus[tabId]}`);
}

export function isPlaying(tabId) {
    console.log(`isPlaying: Playback status of ${tabId} is ${tabPlaybackStatus[tabId]}`);
    return tabPlaybackStatus[tabId];
}

export function isRecording(tabId) {
    console.log(`isRecording: Recording status of ${tabId} is ${tabRecordingStatus[tabId]}`);
    return tabRecordingStatus[tabId];
}

export function toggleRecording(tabId) {
    const toggledStatus = tabRecordingStatus[tabId] = !tabRecordingStatus[tabId];
    console.log(`toggleRecording: Recording status of ${tabId} is now ${toggledStatus}`);
    return toggledStatus;
}

export function togglePlayback(tabId) {
    const toggledStatus = tabPlaybackStatus[tabId] = !tabPlaybackStatus[tabId];
    console.log(`togglePlayback: Playback status of ${tabId} is now ${toggledStatus}`);
    return toggledStatus;
}

export function setPlaybackStatus(tabId, status) {
    tabPlaybackStatus[tabId] = status;
    console.log(`setPlaybackStatus: Playback status of ${tabId} set to ${status}`);
}

