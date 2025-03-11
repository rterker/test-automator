import { isPlaying, setPlaybackStatus } from "./tabStatus.js";
import { getTestTabId } from "./tabStatus.js";
import { debuggerManager } from "./debuggerManager.js";

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
    try {
      instance.tabUrl = await instance.getTabUrl();
      await debuggerManager.attachDebugger(instance.tabId);
      return instance;
    } catch (error) {
      console.log(`Playback instance not created on tab ${this.tabId}`);
      throw error;
    }
  }

  getTabUrl() {
    return new Promise((resolve, reject) => {
      chrome.tabs.get(this.tabId, (tab) => {
        if (chrome.runtime.lastError) {
          console.error(`Error occured on tab ${this.tabId} when getting tabUrl: ${chrome.runtime.lastError}`);
          return reject(chrome.runtime.lastError);
        }
        console.log(`getTabUrl successful for tab ${this.tabId}. Url is ${tab.url}`);
        return resolve(tab.url);
      });
    });
  }

  pushToPlaying() {
    playing[this.recordingId] = this;
  }

  async sendCommand(method, commandParams = {}) {
    if (debuggerManager.getTabAttachmentStatus(this.tabId) === false) {
      try {
        await debuggerManager.attachDebugger(this.tabId);
      } catch (error) {
        console.error(`Error occured when attaching debugger to tab ${this.tabId} in sendCommand. Command (${method}) not sent.`);
        throw error;
      }
    }

    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({tabId: this.tabId}, method, commandParams, (result) => {
        if (chrome.runtime.lastError) {
          console.error(`Error occured on tab ${this.tabId} when sending debugger command => ${method}: ${chrome.runtime.lastError.message}`);
          return reject(chrome.runtime.lastError );
        }
        const resultMessage = result ? (` Result is ${result}.`) : '';
        console.log(`Command (${method}) successful!${JSON.stringify(resultMessage, null, 2)}`);
        return resolve(result);
      });
    });
  }

  async enableDebuggingDomains(domains) {
    const failed = [];
    const suceeded = [];
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      try {
        await this.sendCommand(domain);
        suceeded.push(domain);
      } catch (error) {
        failed.push(domain);
      }
    }
    if (failed.length === 0) {
      console.log(`All domains enabled successfully: ${suceeded}`);
    } else if (failed.length === domains.length) {
      console.log(`None of the requested domains were successfully enabled.`);
    } else {
      console.log(`The following domains were enabled: ${suceeded}`);
      console.log(`These domains were NOT enabled: ${failed}`);
    }
    return failed;
  }

  startPlayback() {
    setPlaybackStatus(true);
    const initUrl = this.playbackObject.initUrl;
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
    //TODO: wrap in try / catch
    await this.enableDebuggingDomains(['DOM.enable']);
    let totalInterval = 0;
    let index = 0;
    while (isPlaying() && index < this.steps.length) {
      const event = this.steps[index];
      const { action, targetCssSelector } = event;
      const { boundingBox, error } = await this.getBoundingBox(event);
      console.log(`result from getBoundingBox: ${JSON.stringify(boundingBox, null, 2)}`);
      if (error) console.error('Error occured in playback when getting bounding box: ', error);
      const interval = event.interval;
      totalInterval += interval;
      //TODO: refactor to control event generator using the event.action from the stored event. just doing click events now every time
      let eventGenerator;
      try {
        eventGenerator = new GenerateEvent(action, boundingBox, targetCssSelector);
      } catch (error) {
        await this.stopPlayback();
        continue;
      }
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
    //TODO: wrap in try / catch
    await debuggerManager.detachDebugger(this.tabId);
  }
}

class GenerateEvent {
  constructor(action, boundingBox, cssSelector) {
    this.action = action;
    this.cssSelector = cssSelector;
    try {
      this.type = this.setType();
    } catch (error) {
      console.error(`Error occured during GenerateEvent: ${error}`);
      throw error;
    }
    this.boundingBox = boundingBox;
    //TODO: seems to be an issue dispatching on certain elements. i think it may have to do with a wait
    this.x = this.boundingBox.x + (this.boundingBox.width / 2);
    this.y = this.boundingBox.y + (this.boundingBox.height / 2);
  }

  setType() {
    switch (this.action) {
      case 'click': 
        return ClickEvent;
      case 'focus':
        return FocusEvent;
      case 'keydown':
        return KeyboardEvent;
      default: 
        throw new Error(`Event action not recognized: ${this.action}`);
    }
  }

  async dispatch(tabId) {
    const event = new this.type(tabId, this.x, this.y, this.cssSelector);
    //TODO: wrap in try / catch => how to handle errors in dispatch?
    return await event.dispatch();
  }
}

class ClickEvent {
  constructor(tabId, x, y) {
    this.tabId = tabId;
    this.x = x;
    this.y = y;
  }

  async sendCommand(method, commandParams = {}) {
    if (debuggerManager.getTabAttachmentStatus(this.tabId) === false) {
      try {
        await debuggerManager.attachDebugger(this.tabId);
      } catch (error) {
        console.error(`Error occured when attaching debugger to tab ${this.tabId} in sendCommand. Command (${method}) not sent.`);
        throw error;
      }
    }

    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({tabId: this.tabId}, method, commandParams, (result) => {
        if (chrome.runtime.lastError) {
          console.error(`Error occured on tab ${this.tabId} when sending debugger command => ${method}: ${chrome.runtime.lastError.message}`);
          return reject(chrome.runtime.lastError );
        }
        const resultMessage = result ? (` Result is ${result}.`) : '';
        console.log(`Command (${method}) successful!${JSON.stringify(resultMessage, null, 2)}`);
        return resolve(result);
      });
    });
  }

  async dispatch() {
    const x = this.x;
    const y = this.y;
    try {
      let commandParams = {
        type: "mousePressed",
        x,
        y,
        button: "left",
        clickCount: 1
      };
      await this.sendCommand("Input.dispatchMouseEvent", commandParams);
      console.log('Mouse pressed!');
      commandParams = {
        type: "mouseReleased",
        x,
        y,
        button: "left",
        clickCount: 1
      };
      await this.sendCommand("Input.dispatchMouseEvent", commandParams);
      console.log('Mouse released!');
    } catch (error) {
      throw error;
    }
   }
}


class FocusEvent {
  constructor(tabId, x, y, cssSelector) {
    this.tabId = tabId;
    this.x = x;
    this.y = y;
    this.cssSelector = cssSelector;
  }
  
  async sendCommand(method, commandParams = {}) {
    if (debuggerManager.getTabAttachmentStatus(this.tabId) === false) {
      try {
        await debuggerManager.attachDebugger(this.tabId);
      } catch (error) {
        console.error(`Error occured when attaching debugger to tab ${this.tabId} in sendCommand. Command (${method}) not sent.`);
        throw error;
      }
    }

    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({tabId: this.tabId}, method, commandParams, (result) => {
        if (chrome.runtime.lastError) {
          console.error(`Error occured on tab ${this.tabId} when sending debugger command => ${method}: ${chrome.runtime.lastError.message}`);
          return reject(chrome.runtime.lastError );
        }
        const resultMessage = result ? (` Result is ${result}.`) : '';
        console.log(`Command (${method}) successful!${JSON.stringify(resultMessage, null, 2)}`);
        return resolve(result);
      });
    });
  }
  
  async dispatch() {
    try {
      const rootObject = await this.sendCommand(
        "DOM.getDocument"
      );
      if (!rootObject.root) {
        const error = `Root node not found in FocusEvent dispatch`;
        console.error(error);
        throw error;
      }
      const result = await this.sendCommand(
        "DOM.querySelector", 
        {
          nodeId: rootObject.root.nodeId, 
          selector: this.cssSelector 
        }
      );
      if (!result.nodeId) {
        const error = `Node not found in FocusEvent dispatch: ${this.cssSelector}`;
        console.error(error);
        throw error;
      }
      await this.sendCommand(
        "DOM.focus", 
        {
          nodeId: result.nodeId
        }
      );
    } catch (error) {
      throw error;
    }
  }
}

//TODO: COMPLETE THIS
class KeyboardEvent {
 constructor (x, y) {
  this.x = x;
  this.y = y;
 }
 dispatch(tabId) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand();
    chrome.debugger.sendCommand();
  });
 }
}


export default Playback;




//dispatch error messages to control window


//send message to stop playback from controls to playback class
//alert user that playback has stopped
//set playback status to false
//dispatch error messages to control window


// class Messenger {

// }


