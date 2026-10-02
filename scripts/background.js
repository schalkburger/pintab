const ChromeExtensionSettingsManager = (function () {
  "use strict";
  function isFunction(fn) {
    return typeof fn === "function";
  }
  function ChromeExtensionSettingsManager() {
    if (!(this instanceof ChromeExtensionSettingsManager)) {
      return new ChromeExtensionSettingsManager();
    }
    return {
      load: function (onSuccess, onError) {
        chrome.storage.sync.get(null, function (data) {
          if (chrome.runtime.lastError && isFunction(onError)) {
            onError.call(null, chrome.runtime.lastError);
          } else if (isFunction(onSuccess)) {
            onSuccess.call(null, data);
          }
        });
      },
      save: function (data, onSuccess, onError) {
        chrome.storage.sync.set(data, function () {
          if (chrome.runtime.lastError && isFunction(onError)) {
            onError.call(null, chrome.runtime.lastError);
          } else if (isFunction(onSuccess)) {
            onSuccess.call(null);
          }
        });
      },
      clear: function (onSuccess, onError) {
        chrome.storage.sync.clear(function () {
          if (chrome.runtime.lastError && isFunction(onError)) {
            onError.call(null, chrome.runtime.lastError);
          } else if (isFunction(onSuccess)) {
            onSuccess.call(null);
          }
        });
      },
    };
  }
  ChromeExtensionSettingsManager.version = "0.0.16";
  return ChromeExtensionSettingsManager;
})();
const SettingsManager = (function () {
  "use strict";
  function isFunction(fn) {
    return !!fn && typeof fn === "function";
  }
  function merge(base, updates) {
    const isArray = Array.isArray(updates);
    let result = isArray ? [] : {};
    if (isArray) {
      base = base || [];
      result = result.concat(base);
      updates.forEach(function (update, index) {
        if (typeof result[index] === "undefined") {
          result[index] = update;
        } else if (typeof update === "object") {
          result[index] = merge(base[index], update);
        } else if (base.indexOf(update) === -1) {
          result.push(update);
        }
      });
    } else {
      if (base && typeof base === "object") {
        Object.keys(base).forEach(function (key) {
          result[key] = base[key];
        });
      }
      Object.keys(updates).forEach(function (key) {
        if (typeof updates[key] === "object" && updates[key] && base[key]) {
          result[key] = merge(base[key], updates[key]);
        } else {
          result[key] = updates[key];
        }
      });
    }
    return result;
  }
  function MemoryStorage() {
    let storage = {};
    return {
      load: function (callback) {
        if (isFunction(callback)) {
          setTimeout(function () {
            callback.call(null, storage);
          }, 0);
        }
      },
      save: function (data, callback) {
        storage = merge(storage, data);
        if (isFunction(callback)) {
          setTimeout(function () {
            callback.call(null);
          }, 0);
        }
      },
      clear: function (callback) {
        storage = {};
        if (isFunction(callback)) {
          setTimeout(function () {
            callback.call(null);
          }, 0);
        }
      },
    };
  }
  function SettingsManager(storage) {
    if (!(this instanceof SettingsManager)) {
      return new SettingsManager(storage);
    }
    const store = storage || new MemoryStorage();
    return {
      load: function (onSuccess, onError) {
        store.load(function (data) {
          if (isFunction(onSuccess)) {
            setTimeout(function () {
              onSuccess.call(null, data);
            }, 0);
          }
        }, onError);
      },
      save: function (data, onSuccess, onError) {
        if (data && typeof data === "object" && !Array.isArray(data)) {
          store.save(data, onSuccess, onError);
        } else {
          if (isFunction(onError)) {
            setTimeout(function () {
              onError.call(null);
            }, 0);
          }
        }
      },
      clear: function (onSuccess, onError) {
        store.clear(onSuccess, onError);
      },
    };
  }
  SettingsManager.version = "0.0.15";
  return SettingsManager;
})();
const DEFAULT_OPTIONS = { regexes: [{ regex: "http[s]?://mail.google.com/", comment: "GMail" }], debug: false, "pin-open-in-new": false, "release-to-right": true, "pin-new-tab": false };
(function () {
  "use strict";
  const SOURCE_TYPES = { browserAction: "browseraction", onCreated: "onCreated", onUpdated: "onUpdated" };
  const MODIFIER_TYPES = { openInNewTab: "openInNewTab", pinNewTab: "pinNewTab", rule: "rule", none: "none" };
  const OPTION_KEYS = { RULES: "regexes", OPEN_IN_NEW: "pin-open-in-new", PIN_NEW: "pin-new-tab", RELEASE_TO_RIGHT: "release-to-right" };
  const regexCache = {};
  function getRegex(pattern) {
    if (!(pattern in regexCache)) {
      try {
        regexCache[pattern] = new RegExp(pattern);
      } catch (err) {
        // Bad pattern from storage: cache the failure so we never throw here,
        // the rule just never matches.
        console.warn("Invalid regex pattern, skipping rule:", pattern, err.message);
        regexCache[pattern] = null;
      }
    }
    return regexCache[pattern];
  }
  const settingsManager = new SettingsManager(new ChromeExtensionSettingsManager());
  let settings = DEFAULT_OPTIONS;
  const pinnedTabs = [];
  function loadSettings(onSuccess, onError) {
    settingsManager.load(
      function (data) {
        console.log("Loaded settings:", data);
        const mergedSettings = Object.assign({}, DEFAULT_OPTIONS, data);
        if (!Array.isArray(mergedSettings.regexes)) {
          console.warn("Invalid regexes in storage, resetting to default:", mergedSettings.regexes);
          mergedSettings.regexes = DEFAULT_OPTIONS.regexes;
        }
        settings = mergedSettings;
        if (typeof onSuccess === "function") {
          onSuccess.call(null, settings);
        }
      },
      function (error) {
        console.error("Error getting settings:", error);
        settings = Object.assign({}, DEFAULT_OPTIONS);
        if (typeof onError === "function") {
          onError.call(null, error);
        }
      }
    );
  }
  function logDebug(...args) {
    const logArgs = [new Date(), ...args];
    loadSettings(
      function (settings) {
        if (settings.debug) {
          console.log(...logArgs);
        }
      },
      function () {
        console.log("Warning: Could not get debug setting, falling back to debug", ...logArgs);
      }
    );
  }
  function shouldPinTab(tabInfo, callback) {
    console.log("shouldPinTab: Checking tab", tabInfo.tab.url, "with settings:", settings);
    tabInfo.sourceModifiers = tabInfo.sourceModifiers || {};
    const rules = Array.isArray(settings[OPTION_KEYS.RULES]) ? settings[OPTION_KEYS.RULES] : [];
    console.log("Rules:", rules);
    if (settings[OPTION_KEYS.OPEN_IN_NEW] && tabInfo.tab.active === false && tabInfo.tab.status === "complete" && tabInfo.tab.openerTabId && tabInfo.tab.url !== "chrome://newtab/") {
      tabInfo.sourceModifiers[MODIFIER_TYPES.openInNewTab] = true;
      console.log("Pinning due to open-in-new");
      callback(true);
      return;
    }
    if (settings[OPTION_KEYS.PIN_NEW] && tabInfo.tab.status === "complete" && tabInfo.tab.url === "chrome://newtab/") {
      tabInfo.sourceModifiers[MODIFIER_TYPES.pinNewTab] = true;
      console.log("Pinning due to pin-new-tab");
      callback(true);
      return;
    }
    if (rules.length > 0) {
      for (let rule of rules) {
        tabInfo.rule = rule;
        const ruleRegex = getRegex(rule.regex);
        if (ruleRegex && ruleRegex.test(tabInfo.tab.url || "")) {
          tabInfo.sourceModifiers[MODIFIER_TYPES.rule] = true;
          console.log("Pinning due to rule:", rule);
          callback(!rule.disable);
          return;
        }
      }
    }
    tabInfo.sourceModifiers[MODIFIER_TYPES.none] = true;
    console.log("No pinning conditions met");
    callback(false);
  }
  function isTabPinned(tabInfo) {
    return pinnedTabs[tabInfo.tab.id] === true;
  }
  function unpinTab(tabInfo) {
    chrome.tabs.update(tabInfo.tab.id, { pinned: false }, function (tab) {
      if (tab && !tab.pinned && settings[OPTION_KEYS.RELEASE_TO_RIGHT]) {
        chrome.tabs.move(tabInfo.tab.id, { index: -1 });
      } else {
        logDebug("Could not unpin tab");
      }
    });
  }
  function pinTab(tabInfo) {
    const updateProps = { pinned: true };
    if (tabInfo.shouldActivate) {
      updateProps.active = true;
    }
    chrome.tabs.update(tabInfo.tab.id, updateProps, function (tab) {
      if (tab && tab.pinned) {
        if (tabInfo.rule && (tabInfo.rule.index || tabInfo.rule.index === 0)) {
          const index = parseInt(tabInfo.rule.index);
          if (index >= 0) {
            chrome.tabs.move(tabInfo.tab.id, { index });
          }
        }
        if (tabInfo.remember) {
          pinnedTabs[tabInfo.tab.id] = true;
        }
      } else {
        logDebug("Could not pin tab");
      }
    });
  }
  function processTab(tabInfo) {
    loadSettings(function () {
      console.log("processTab: Settings loaded", settings);
      shouldPinTab(tabInfo, function (shouldPin) {
        if (shouldPin && !isTabPinned(tabInfo)) {
          console.log("Pinning tab:", tabInfo.tab.url);
          tabInfo.remember = true;
          pinTab(tabInfo);
        } else {
          console.log("Not pinning tab:", tabInfo.tab.url);
        }
      });
    });
  }
  console.log("Initializing settings");
  loadSettings();
  chrome.action.onClicked.addListener(function () {
    console.log("Action clicked");
    chrome.windows.getCurrent({ populate: true }, function (window) {
      for (let tab of window.tabs) {
        if (tab.active) {
          if (tab.pinned) {
            console.log("Unpinning active tab:", tab.url);
            unpinTab({ tab, source: SOURCE_TYPES.browserAction });
          } else {
            console.log("Pinning active tab:", tab.url);
            pinTab({ tab, source: SOURCE_TYPES.browserAction, remember: false });
          }
          break;
        }
      }
    });
  });
  chrome.tabs.onCreated.addListener(function (tab) {
    console.log("Tab created:", tab.url);
    processTab({ tab, source: SOURCE_TYPES.onCreated });
  });
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log("Tab updated:", tab.url, changeInfo);
    processTab({ tab, source: SOURCE_TYPES.onUpdated });
  });
  chrome.tabs.onRemoved.addListener(function (tabId) {
    if (pinnedTabs[tabId]) {
      console.log("Tab removed, clearing pinned status:", tabId);
      delete pinnedTabs[tabId];
    }
  });
})();
