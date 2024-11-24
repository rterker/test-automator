import { logger } from "./logger.js";

const path = import.meta.url;

logger.log('tabStatus.js is loading...', path);

const tabRecordingStatus = {};
const tabPlaybackStatus = {};

export function initializeTab(tabId) {
    tabRecordingStatus[tabId] = false;
    tabPlaybackStatus[tabId] = false;
    logger.log(`initializeTab: Recording status of ${tabId} is ${tabRecordingStatus[tabId]}`, path);
    logger.log(`initializeTab: Playback status of ${tabId} is ${tabPlaybackStatus[tabId]}`, path);
}

export function isPlaying(tabId) {
    logger.log(`isPlaying: Playback status of ${tabId} is ${tabPlaybackStatus[tabId]}`, path);
    return tabPlaybackStatus[tabId];
}

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

