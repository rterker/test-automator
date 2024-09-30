
const tabExtensionStatus = {};

export function initializeTab(tabId) {
    tabExtensionStatus[tabId] = false;
    console.log(`InitializeTab: Extension activation status of ${tabId} is ${tabExtensionStatus[tabId]}`);
}

export function isExtensionEnabled(tabId) {
    console.log(`isExtensionEnabled: Extension activation status of ${tabId} is ${tabExtensionStatus[tabId]}`);
    return tabExtensionStatus[tabId];
}

export function toggleExtension(tabId) {
    const toggledStatus = tabExtensionStatus[tabId] = !tabExtensionStatus[tabId];
    console.log(`toggleExtension: Extension activation status of ${tabId} is now ${toggledStatus}`);
    return toggledStatus;
}

