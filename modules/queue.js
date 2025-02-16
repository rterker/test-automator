import { getInitialValue, setInitialValue } from "./initialValues.js";
import { storeInitialValue, storeEvent } from "./storage.js";

let id = 0;
const queue = {};

export function sendToQueue({ recordingId, message, sendResponse }) {
  queue[id] = {
    next: ++id,
    recordingId,
    message,
    sendResponse
  };
  console.log('sent to queue: ', queue[id]);
  //storing initial element value for every element interaction during recording
  if (message.value && !getInitialValue(message.targetCssSelector)) {
    //in memory storage rather than getting from long term memory every time we do the above check
    setInitialValue(queue[id]);
    storeInitialValue(queue[id], function(next) {
      console.log('handleRecordingEvents next:', next)
      storeEvent(recordingId, message, sendResponse);
    });
  } else {
    storeEvent(recordingId, message, sendResponse);
  }
}



//receive message and add to queue with the id
//call storage with this message and pass the next id
//return the next id from storage and call with that message
