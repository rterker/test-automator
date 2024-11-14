//TODO: save recordingId in a persistent location like storage api or database later on
//TODO: increment recordingId later on. just returning 1 each time now for prototype
//TODO: refactor this whole file later after proof of concept

import { 
  logger,
  ERROR
} from "./logger.js";

const path = import.meta.url;

logger.log('recordingStatus.js is loading...', path);

let recordingId = 'test';
let timer = {};

export function initializeRecordingTimer() {
  const now = Date.now();
  timer[recordingId] = {
    intervalTime: 0,
    startTime: now,
    tracker: now
  };
  return timer[recordingId].intervalTime;
}

export function getRecordingId() {
  return recordingId;
}

export function incrementAndGetTime(recordingId, newTime) {
  timer[recordingId].intervalTime = newTime - timer[recordingId].tracker;
  timer[recordingId].tracker = newTime;
  return timer[recordingId].intervalTime;
}