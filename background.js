chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ active: true }, (data) => {
    chrome.declarativeNetRequest.updateEnabledRulesets(
      data.active
        ? { enableRulesetIds: ['skipad_rules'] }
        : { disableRulesetIds: ['skipad_rules'] }
    );
  });
});

chrome.storage.onChanged.addListener((changes, ns) => {
  if (ns === 'local' && changes.active) {
    chrome.declarativeNetRequest.updateEnabledRulesets(
      changes.active.newValue
        ? { enableRulesetIds: ['skipad_rules'] }
        : { disableRulesetIds: ['skipad_rules'] }
    );
  }
});
