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
    this.isDebuggerAttached = false;

    chrome.debugger.onDetach.addListener(({ tabId }, reason) => {
      if (tabId === this.tabId) {
        this.isDebuggerAttached = false;
        console.log(`Debugger detached from tab ${tabId}. Reason: ${reason}`);
      }
    });
  }

  static async create(recordingId, playbackObject) {
    const instance = new Playback(recordingId, playbackObject);
    try {
      instance.tabUrl = await instance.getTabUrl();
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

  attachDebugger() {
    if (this.isDebuggerAttached) {
      console.log(`Debugger already attached for tab ${this.tabId} when attempting to attachDebugger`);
      return;
    }
    return new Promise((resolve, reject) => {
      chrome.debugger.attach({ tabId: this.tabId }, "1.3", () => {
        if (chrome.runtime.lastError) {
          console.error(`Error occured on tab ${this.tabId} when attaching debugger: ${chrome.runtime.lastError.message}`);
          return reject(chrome.runtime.lastError);
        }
        this.isDebuggerAttached = true;
        console.log(`Debugger attached successfully to tab: ${this.tabId}`);
        resolve();
      });
    });
  }

  detachDebugger() {
    if (!this.isDebuggerAttached) {
      console.log(`Debugger already detached for tab ${this.tabId} when attempting to detachDebugger`);
      return;
    }
    return new Promise((resolve, reject) => {
      chrome.debugger.detach({ tabId: this.tabId }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error occured on tab ${this.tabId} when detaching debugger: ${chrome.runtime.lastError.message}`);
          return reject(chrome.runtime.lastError);
        }
        this.isDebuggerAttached = false;
        console.log(`Debugger detached successfully to tab: ${this.tabId}`);
        resolve();
      });
    });
  }

  async sendCommand(method, commandParams) {
    if (!this.isDebuggerAttached) {
      try {
        await this.attachDebugger();
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
        console.log(`Command (${method}) successful!${resultMessage}`);
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
    await this.attachDebugger();
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
    await this.detachDebugger();
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
    const event = new this.type(this.x, this.y, this.cssSelector);
    //TODO: wrap in try / catch
    return await event.dispatch(tabId);
  }
}

class ClickEvent {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  dispatch(tabId) {
    const x = this.x;
    const y = this.y;

    //TODO: handle errors
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(
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
        },
        () => {
          console.log('Mouse pressed!');
          chrome.debugger.sendCommand(
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
            },
            () => {
              console.log('Mouse released!');
              return resolve();
            }
          );
        }
      );
    });
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

class FocusEvent {
  constructor(x, y, cssSelector) {
    this.x = x;
    this.y = y;
    this.cssSelector = cssSelector;
    console.log(`cssSelector in FocusEvent: ${this.cssSelector}`);
  }

  dispatch(tabId) {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(
        {
          tabId
        },
        "DOM.querySelector",
        {
          nodeId: 1, 
          selector: this.cssSelector 
        }, 
        (result) => {
          console.log(`nodeId of focus element in FocusEvent is: ${result.nodeId}`);
          if (result && result.nodeId) {
            chrome.debugger.sendCommand(
              {
                tabId: targetTabId
              },
              "DOM.focus",
              {
                nodeId: result.nodeId
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error(`Error occured in FocusEvent dispatch: ${chrome.runtime.lastError.message}`);
                  return reject(chrome.runtime.lastError);
                }
                return resolve();
              }
            );
          } else {
            console.error(`Node not found in FocusEvent dispatch: ${this.cssSelector}`);
            return reject();
          }
        }
      );
    });
  }

}

export default Playback;




//dispatch error messages to control window


//send message to stop playback from controls to playback class
//alert user that playback has stopped
//set playback status to false
//dispatch error messages to control window


