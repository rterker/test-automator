document.addEventListener('DOMContentLoaded', () => {
  const controls = document.querySelector('#open-controls');
  controls.addEventListener('click', (event) => {
    chrome.windows.create({
      url: chrome.runtime.getURL('controls.html'),
      type: 'popup',
      width: 1000,
      height: 2000
    });
  });
});