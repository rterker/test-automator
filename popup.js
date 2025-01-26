document.addEventListener('DOMContentLoaded', () => {
  const controls = document.querySelector('#open-controls');
  controls.addEventListener('click', (event) => {
    chrome.runtime.sendMessage('control-window-check', async ({ controlWindowId }) => {
      if (!controlWindowId) {
        const controlWindow = await chrome.windows.create({
          url: chrome.runtime.getURL('controls.html'),
          type: 'popup',
          width: 700,
          height: 900,
          focused: true
        });
    
        const windowId = controlWindow.id;
        chrome.runtime.sendMessage({ action: 'add-control-window-id', windowId });
      }
    });
  });
});