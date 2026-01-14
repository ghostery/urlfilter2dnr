/* eslint-disable no-undef */
chrome.runtime.onInstalled.addListener(async function () {
  console.log('Installed:', await chrome.runtime.getPlatformInfo());
});
