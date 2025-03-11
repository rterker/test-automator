class DebuggerManager {
  constructor() {
    this.isTabAttached = {};

    chrome.debugger.onDetach.addListener(({ tabId }, reason) => {
      if (Object.prototype.hasOwnProperty.call(this.isTabAttached, tabId) && this.isTabAttached[tabId] === true) {
        this.isTabAttached[tabId] = false;
        console.log(`Debugger detached from tab ${tabId}. Reason: ${reason}`);
      }
    });
  }

  getTabAttachmentStatus(tabId) {
    return this.isTabAttached[tabId];
  }

  attachDebugger(tabId) {
    if (this.isTabAttached[tabId] === true) {
      console.log(`Debugger already attached for tab ${tabId} when attempting to attachDebugger`);
      return;
    }
    return new Promise((resolve, reject) => {
      chrome.debugger.attach({ tabId }, "1.3", () => {
        if (chrome.runtime.lastError) {
          console.error(`Error occured on tab ${tabId} when attaching debugger: ${chrome.runtime.lastError.message}`);
          return reject(chrome.runtime.lastError);
        }
        this.isTabAttached[tabId] = true;
        console.log(`Debugger attached successfully to tab: ${tabId}`);
        resolve();
      });
    });
  }

  detachDebugger(tabId) {
    if (this.isTabAttached[tabId] === false) {
      console.log(`Debugger already detached for tab ${tabId} when attempting to detachDebugger`);
      return;
    }
    return new Promise((resolve, reject) => {
      chrome.debugger.detach({ tabId }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error occured on tab ${tabId} when detaching debugger: ${chrome.runtime.lastError.message}`);
          return reject(chrome.runtime.lastError);
        }
        this.isTabAttached[tabId] = false;
        console.log(`Debugger detached successfully to tab: ${tabId}`);
        resolve();
      });
    });
  }
}


export const debuggerManager = new DebuggerManager();