import { setPlaybackStatus } from "./tabStatus.js";
import { getTestTabId } from "./tabStatus.js";

const playing = {};

export function stopPlayback(recordingId) {
  const playback = playing[recordingId];
  playback.stopPlayback();
  delete playing[recordingId];
}

class SignalController {
  constructor() {
    this.shouldStop = false;
    this.timeoutIds = [];
  }

  stopPlayback() {
    this.shouldStop = true
    this.timeoutIds.forEach(id => {
        console.log('clearing out timeoutId: ', id);
        clearTimeout(id);
    });
    this.timeoutIds = [];
  }
}

class Playback {
  constructor(recordingId, playbackObject) {
    this.recordingId = recordingId;
    this.playbackObject = playbackObject;
    this.signalController = new SignalController();
    this.steps = this.playbackObject.steps;
    this.tabId = getTestTabId();
    this.tabUrl = null;
  }

  static async create(recordingId, playbackObject) {
    const instance = new Playback(recordingId, playbackObject);
    instance.tabUrl = await instance.getTabUrl();
    return instance;
  }

  getTabUrl() {
    return new Promise((res, rej) => {
      chrome.tabs.get(this.tabId, function(tab) {
        console.log('getTabUrl: tab.url is ', tab.url);
        if (chrome.runtime.lastError) return rej(chrome.runtime.lastError);
        return res(tab.url);
      });
    });
  }

  pushToPlaying() {
    playing[this.recordingId] = this;
  }

  startPlayback() {
    setPlaybackStatus(true);
    const initUrl = this.playbackObject.initUrl;
    console.log(`Playback tabUrl: ${this.tabUrl}`);
    console.log(`Playback tabId: ${this.tabId}`);
    console.log(`Playback initUrl: ${initUrl}`);
    if (this.tabUrl === initUrl) {
        this.continuePlayback();
    } else {
      setPlaybackStatus(false);
      const action = 'auto-stop-playback';
      const alertMessage = `Please navigate to starting url before clicking playback.`;
      chrome.runtime.sendMessage({ action, tabId: this.tabId, alertMessage });
    }
  }

  async continuePlayback() {
    this.pushToPlaying();
    let totalInterval = 0;
    let index = 0;
    while (!this.signalController.shouldStop && index < this.steps.length) {
      const event = this.steps[index];
      const { boundingBox, error } = await this.getBoundingBox(event);
      if (error) console.error('Error occured in playback: ', error);
      const interval = event.interval;
      totalInterval += interval;
      //TODO: complete this and everything below in this function
      this.simulateEventWithTimeout(boundingBox, totalInterval, event);
      // const timeoutId = setTimeout(this.sendEvent, totalInterval, event);
      // this.signalController.timeoutIds.push(timeoutId);
      // if (index === this.steps.length - 1) {
      //   const timeoutId = setTimeout(() => {
      //     //TODO: stop playback here to remove from playing object
      //     setPlaybackStatus(false);
      //     const action = 'playback-complete';
      //     const alertMessage = `${action} on tab ${this.tabId}`;
      //     chrome.runtime.sendMessage({ action, tabId: this.tabId, alertMessage });
      //   }, totalInterval + 50);
      //   this.signalController.timeoutIds.push(timeoutId);
      // }
      // index++;
    }
  }

  //TODO: need to handle async here so we get the bounding box and only after that we continue
  async getBoundingBox(event) {
    const message = {
      action: 'get-bounding-box', 
      event
    };
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(event.tabId, message, (response) => {
        const error = chrome.runtime.lastError;
        if (error) return reject({ error });
        const boundingBox = response.boundingBox;
        console.log('bounding box in playback is: ', boundingBox);
        return resolve({ boundingBox });
      });
    });
  }

  //TODO: finish this, don't think we need async here
  simulateEventWithTimeout(boundingBox, totalInterval, event) {
    const timeoutId = setTimeout(this.generateEvent, totalInterval, event);
    return timeoutId;
  }

  // sendEvent(event) {
  //   const wrappedEvent = {
  //     type: 'playback-event',
  //     event
  //   };
  //   console.log('wrappedEvent: ', wrappedEvent);
  //   chrome.tabs.sendMessage(event.tabId, wrappedEvent, (response) => {
  //     console.log('response: ', response);
  //     console.log(`Event played: ${response.event}`);
  //   });
  // }

  stopPlayback() {
    this.signalController.stopPlayback();
    setPlaybackStatus(false);
  }
}

export default Playback;




//dispatch error messages to control window


//send message to stop playback from controls to playback class
//alert user that playback has stopped
//set playback status to false
//dispatch error messages to control window


