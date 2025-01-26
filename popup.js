document.addEventListener('DOMContentLoaded', () => {
  const controls = document.querySelector('#open-controls');
  controls.addEventListener('click', (event) => {
    chrome.runtime.sendMessage('control-window-check', async ({ controlWindowTabId }) => {
      if (!controlWindowTabId) {
        const controlWindow = await chrome.windows.create({
          url: chrome.runtime.getURL('controls.html'),
          type: 'popup',
          width: 600,
          height: 900,
          focused: true
        });
    
        const tabId = controlWindow.tabs[0].id;
        chrome.runtime.sendMessage({ action: 'add-control-window-tab-id', tabId });
      }
    });
  });
});