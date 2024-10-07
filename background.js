import { initializeTab } from "./modules/tabExtensionStatus.js";
import { setupContentScriptListener } from "./modules/contentScriptListener.js";
import { setupPopupMessageListener } from "./modules/popupListener.js";

console.log('background.js is loading...');

chrome.tabs.onCreated.addListener((tab) => {
    initializeTab(tab.id);
    console.log(`background.js: tab ${tab.id} initialized.`)
});

setupContentScriptListener();
setupPopupMessageListener();








