console.log('background.js loaded');

//this onclicked event happens when you click on the extension icon
chrome.action.onClicked.addListener((tab) => {
    console.log(`Tab url is ${tab.url}`)
});