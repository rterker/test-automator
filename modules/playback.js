import { setPlaybackStatus } from "./tabStatus.js";
import { getTestTabId } from "./tabStatus.js";


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
  constructor(playbackObject) {
    this.signalController = new SignalController();
    this.playbackObject = playbackObject;
    this.steps = this.playbackObject.steps;
    this.tabId = getTestTabId();
    this.tabUrl = null;
  }

  static async create(playbackObject) {
    const instance = new Playback(playbackObject);
    instance.tabUrl = await instance.getTabUrl();
    return instance;
  }

  async getTabUrl() {
    return new Promise((res, rej) => {
      chrome.tabs.get(this.tabId, function(tab) {
        if (chrome.runtime.lastError) return rej(chrome.runtime.lastError);
        return res(tab.url);
      });
    });
  }

  startPlayback() {
    const initUrl = this.playbackObject.initUrl;
    console.log(`Playback tabUrl: ${this.tabUrl}`);
    console.log(`Playback tabId: ${this.tabId}`);
    console.log(`Playback initUrl: ${initUrl}`);
    if (this.tabUrl === initUrl) {
        this.continuePlayback();
    } else {
      setPlaybackStatus(false);
      //TODO: send message to controls
      const action = 'auto-stop-playback';
      const alertMessage = `Please navigate to starting url before clicking playback.`;

    }
  }

  continuePlayback() {
    let totalInterval = 0;
    let index = 0;
    while (!this.signalController.shouldStop && index < this.steps.length) {
      let timeoutId;
      const event = this.steps[index];
      const interval = event.interval;
      totalInterval += interval;
      if (event.action === 'click') {
        //TODO: send event to content-script
        timeoutId = setTimeout(generateMouseEvent, totalInterval, event);
      } else if (event.action === 'keydown') {
        //TODO: send event to content-script
        timeoutId = setTimeout(generateTyping, totalInterval, event);
      }
      this.signalController.timeoutIds.push(timeoutId);
      if (index === this.length - 1) {
        const timeoutId = setTimeout(() => {
          setPlaybackStatus(false);
          //TODO: send message to controls that playback is complete
          const action = 'playback-complete';
          const alertMessage = `content-script.js: ${action} on tab ${this.tabId}`;
          chrome.runtime.sendMessage({ action, tabId, alertMessage });
        }, totalInterval + 50);
        signalController.timeoutIds.push(timeoutId);
      }
      index++;
    }
  }
}

export default Playback;



//send message to start playback from controls to playback class
//alert user that playback has started
//set playback status to true
//dispatch each playback step to content-script
//dispatch error messages to control window


//send message to stop playback from controls to playback class
//alert user that playback has stopped
//set playback status to false
//dispatch error messages to control window


