// import { console, ERROR } from "./console.js";

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
    console.log(`initializeTestTab: Recording status of ${tabId} is ${tabRecordingStatus[tabId]}`);
    console.log(`initializeTestTab: Playback status of ${tabId} is ${tabPlaybackStatus[tabId]}`);
}


export function isPlaying() {
    console.log(`isPlaying: Playback status of ${testTabId} is ${tabPlaybackStatus[testTabId]}`);
    return tabPlaybackStatus[testTabId];
}

export function isRecording() {
    console.log(`isRecording: Recording status of ${testTabId} is ${tabRecordingStatus[testTabId]}`);
    return tabRecordingStatus[testTabId];
}

export function setRecordingStatus(status) {
    tabRecordingStatus[testTabId] = status;
    console.log(`setRecordingStatus: Recording status of ${testTabId} set to ${status}`);
}

export function setPlaybackStatus(status) {
    tabPlaybackStatus[testTabId] = status;
    console.log(`setPlaybackStatus: Playback status of ${testTabId} set to ${status}`);
}

export function setTabFocusStatus(status) {
    tabHasFocus = status;
}

export function getTabFocusStatus() {
    return tabHasFocus;
}