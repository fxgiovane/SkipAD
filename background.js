chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ['skipad_rules']
  });
});
