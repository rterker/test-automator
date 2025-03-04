import { isPlaying, setPlaybackStatus } from "./tabStatus.js";
import { getTestTabId } from "./tabStatus.js";

const playing = {};

export async function stopPlayback(recordingId) {
  const playback = playing[recordingId];
  await playback.stopPlayback();
}

//TODO: eventually bring playback status in here rather than having it in a separate module
class Playback {
  constructor(recordingId, playbackObject) {
    this.recordingId = recordingId;
    this.playbackObject = playbackObject;
    this.steps = this.playbackObject.steps;
    this.tabId = getTestTabId();
    this.tabUrl = null;
    this.timeoutIds = [];
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
      const alertMessage = `Please navigate to starting url [${initUrl}] before clicking playback.`;
      chrome.runtime.sendMessage({ action, tabId: this.tabId, alertMessage });
    }
  }

  async continuePlayback() {
    this.pushToPlaying();
    await chrome.debugger.attach(
      {
        tabId: this.tabId
      },
      "1.3"
    );
    let totalInterval = 0;
    let index = 0;
    while (isPlaying() && index < this.steps.length) {
      const event = this.steps[index];
      const { boundingBox, error } = await this.getBoundingBox(event);
      console.log(`result from getBoundingBox: ${boundingBox}`);
      if (error) console.error('Error occured in playback when getting bounding box: ', error);
      const interval = event.interval;
      totalInterval += interval;
      //TODO: refactor to control event generator using the event.action from the stored event. just doing click events now every time
      const eventGenerator = new GenerateEvent(ClickEvent, boundingBox);
      const boundDipatch = eventGenerator.dispatch.bind(eventGenerator);
      const timeoutId = setTimeout(boundDipatch, totalInterval, this.tabId);
      this.timeoutIds.push(timeoutId);
      //TODO: may need to check if playing in this last setTimeout to determine if this needs to happen
      if (index === this.steps.length - 1) {
        const timeoutId = setTimeout(() => {
          this.stopPlayback.bind(this)();
          const action = 'playback-complete';
          const alertMessage = `${action} on tab ${this.tabId}`;
          chrome.runtime.sendMessage({ action, tabId: this.tabId, alertMessage });
        }, totalInterval + 50);
        this.timeoutIds.push(timeoutId);
      }
      index++;
    }
  }

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
        return resolve({ boundingBox });
      });
    });
  }

  async stopPlayback() {
    this.timeoutIds.forEach(id => {
      clearTimeout(id);
    });
    this.timeoutIds = [];
    setPlaybackStatus(false);
    delete playing[this.recordingId];
    await chrome.debugger.detach({ tabId: this.tabId });
  }
}

class GenerateEvent {
  constructor(type, boundingBox) {
    this.type = type;
    this.boundingBox = boundingBox;
    //TODO: seems to be an issue dispatching on certain elements. i think it may have to do with a wait
    this.x = this.boundingBox.x + (this.boundingBox.width / 2);
    this.y = this.boundingBox.y + (this.boundingBox.height / 2);
  }
  async dispatch(tabId) {
    const event = new this.type(this.x, this.y);
    return await event.dispatch(tabId);
  }
}

class ClickEvent {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  async dispatch(tabId) {
    const x = this.x;
    const y = this.y;

    await chrome.debugger.sendCommand(
      {
        tabId
      },
      "Input.dispatchMouseEvent",
      {
        type: "mousePressed",
        x,
        y,
        button: "left",
        clickCount: 1
      }
    );
    await chrome.debugger.sendCommand(
      {
        tabId
      },
      "Input.dispatchMouseEvent",
      {
        type: "mouseReleased",
        x,
        y,
        button: "left",
        clickCount: 1
      }
    );
  }
}

//TODO: COMPLETE THIS
class KeyboardEvent {
 constructor (x, y) {
  this.x = x;
  this.y = y;
 }
 async dispatch(tabId) {
  await chrome.debugger.sendCommand();
  await chrome.debugger.sendCommand();
 }
}

export default Playback;




//dispatch error messages to control window


//send message to stop playback from controls to playback class
//alert user that playback has stopped
//set playback status to false
//dispatch error messages to control window


