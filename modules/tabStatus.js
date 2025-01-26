import { logger } from "./logger.js";

const path = import.meta.url;

let testTabId;
const tabRecordingStatus = {};
const tabPlaybackStatus = {};

export function setTestTabId(tabId) {
    testTabId = tabId;
}

export function getTestTabId() {
    return testTabId;
}

export function initializeTestTab(tabId) {
    tabRecordingStatus[tabId] = false;
    tabPlaybackStatus[tabId] = false;
    logger.log(`initializeTestTab: Recording status of ${tabId} is ${tabRecordingStatus[tabId]}`, path);
    logger.log(`initializeTestTab: Playback status of ${tabId} is ${tabPlaybackStatus[tabId]}`, path);
}

//TODO: returning undefined
export function isPlaying(tabId) {
    logger.log(`isPlaying: Playback status of ${tabId} is ${tabPlaybackStatus[tabId]}`, path);
    return tabPlaybackStatus[tabId];
}

//TODO: returning undefined
export function isRecording(tabId) {
    logger.log(`isRecording: Recording status of ${tabId} is ${tabRecordingStatus[tabId]}`, path);
    return tabRecordingStatus[tabId];
}

export function setRecordingStatus(tabId, status) {
    tabRecordingStatus[tabId] = status;
    logger.log(`setRecordingStatus: Recording status of ${tabId} set to ${status}`, path);
}

export function setPlaybackStatus(tabId, status) {
    tabPlaybackStatus[tabId] = status;
    logger.log(`setPlaybackStatus: Playback status of ${tabId} set to ${status}`, path);
}

