import { logger } from "./logger.js";

const path = import.meta.url;

let testTabId;
let tabHasFocus;
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


export function isPlaying() {
    logger.log(`isPlaying: Playback status of ${testTabId} is ${tabPlaybackStatus[testTabId]}`, path);
    return tabPlaybackStatus[testTabId];
}

export function isRecording() {
    logger.log(`isRecording: Recording status of ${testTabId} is ${tabRecordingStatus[testTabId]}`, path);
    return tabRecordingStatus[testTabId];
}

export function setRecordingStatus(status) {
    tabRecordingStatus[testTabId] = status;
    logger.log(`setRecordingStatus: Recording status of ${testTabId} set to ${status}`, path);
}

export function setPlaybackStatus(status) {
    tabPlaybackStatus[testTabId] = status;
    logger.log(`setPlaybackStatus: Playback status of ${testTabId} set to ${status}`, path);
}

export function setTabFocusStatus(status) {
    tabHasFocus = status;
}

export function getTabFocusStatus() {
    return tabHasFocus;
}

