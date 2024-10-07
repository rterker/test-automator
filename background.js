import { initializeTab } from "./modules/tabExtensionStatus.js";
import { setupContentScriptListener } from "./modules/contentScriptListener.js";
import { setupPopupMessageListener } from "./modules/popupListener.js";
import {} from "./modules/storage.js";

console.log('background.js loaded');

chrome.tabs.onCreated.addListener((tab) => {
    initializeTab(tab.id);
    console.log(`Tab ${tab.id} created`)
});

setupContentScriptListener();
setupPopupMessageListener();








