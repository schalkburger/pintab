/**
 * scripts/options.js
 *
 * Implements the collapsible Advanced Settings feature and the Save Feedback toast notification.
 * This logic uses standard DOM manipulation and is separate from the thirdparty.js (jQuery) form logic.
 */

// --- 1. Collapsible Advanced Settings Logic ---

/**
 * Handles the toggle state of the Advanced Settings collapsible section.
 * @param {MouseEvent | KeyboardEvent} event - The event object from the click or keydown listener.
 */
const handleToggleAdvancedSettings = (event) => {
  // Prevent default action if it's a keyboard event on the button (e.g., Spacebar)
  if (event instanceof KeyboardEvent && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
  }

  const advancedSettingsTrigger = document.getElementById("js-advanced-settings-toggle");
  const advancedSettingsContent = document.getElementById("js-advanced-settings-content");
  const chevronIcon = document.getElementById("js-chevron-icon");

  if (!advancedSettingsTrigger || !advancedSettingsContent || !chevronIcon) {
    console.error("Missing required elements for advanced settings toggle.");
    return;
  }

  // Get the current expanded state from the ARIA attribute
  const isExpanded = advancedSettingsTrigger.getAttribute("aria-expanded") === "true";

  // Toggle ARIA attribute
  advancedSettingsTrigger.setAttribute("aria-expanded", String(!isExpanded));

  // Toggle the 'hidden' class on the content
  advancedSettingsContent.classList.toggle("hidden");

  // Toggle the visual state of the chevron icon (rotate-180)
  chevronIcon.classList.toggle("rotate-180");
};

/**
 * Initializes the event listeners for the Advanced Settings toggle.
 */
const initializeAdvancedSettingsToggle = () => {
  const advancedSettingsTrigger = document.getElementById("js-advanced-settings-toggle");

  if (advancedSettingsTrigger) {
    // Click handler
    advancedSettingsTrigger.addEventListener("click", handleToggleAdvancedSettings);

    // Keyboard handler for accessibility (Enter and Spacebar)
    advancedSettingsTrigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        handleToggleAdvancedSettings(event);
      }
    });
  }
};

// --- 2. Save Feedback Toast Logic ---

const TOAST_TIMEOUT_MS = 3000;
const TOAST_FADE_DURATION_MS = 300;

/**
 * Creates and displays a toast notification.
 * @param {string} message - The message to display in the toast.
 * @param {'success' | 'error'} type - The type of toast to display.
 */
const createToastAlert = (message, type) => {
  const toastContainer = document.getElementById("js-toast-container");
  if (!toastContainer) {
    console.error("Toast container element not found.");
    return;
  }

  // 1. Define classes and icon based on type
  const baseClasses = "pointer-events-auto fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl flex items-center transition-opacity duration-300 ease-in-out";
  const typeClasses = type === "success" ? "bg-green-800 text-white" : "bg-red-600 text-white";

  const iconSvg =
    type === "success"
      ? `<svg class="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
         <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882L9.1 11.026l-1.636-1.637a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.05-4.5z" clip-rule="evenodd" />
       </svg>`
      : `<svg class="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
         <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94l-1.72-1.72z" clip-rule="evenodd" />
       </svg>`;

  // 2. Create the alert element
  const alertElement = document.createElement("div");
  alertElement.classList.add(...baseClasses.split(" "), ...typeClasses.split(" "));
  alertElement.setAttribute("role", "alert");
  // Initial opacity set for the fade-in effect
  alertElement.style.opacity = "0";

  // 3. Add content
  alertElement.innerHTML = `${iconSvg}<p class="font-medium">${message}</p>`;

  // 4. Append and trigger fade-in
  toastContainer.appendChild(alertElement);
  // Using requestAnimationFrame ensures the element is in the DOM before transition starts
  requestAnimationFrame(() => (alertElement.style.opacity = "1"));

  // 5. Set timeout for automatic fade-out and removal
  setTimeout(() => {
    // Fade-out
    alertElement.style.opacity = "0";
    // Remove after transition finishes
    setTimeout(() => {
      if (toastContainer.contains(alertElement)) {
        toastContainer.removeChild(alertElement);
      }
    }, TOAST_FADE_DURATION_MS);
  }, TOAST_TIMEOUT_MS);
};

/**
 * Mocks the form submission handler to trigger the save feedback toast.
 * NOTE: The actual form submission and settings saving logic is in thirdparty.js.
 * This function hooks into the submit event to provide UX feedback AFTER the original logic runs.
 *
 * @param {SubmitEvent} event - The form submit event object.
 */
const handleFormSubmit = (event) => {
  event.preventDefault();

  setTimeout(() => {
    createToastAlert("Settings successfully saved!", "success");
    clearUnsavedChanges(); // ← Just add this one line
  }, 100);
};

/**
 * Initializes the event listener for the form submission to show the toast.
 */
const initializeSaveFeedback = () => {
  const settingsForm = document.querySelector(".settings-container");

  if (settingsForm) {
    // Attach to the submit event
    settingsForm.addEventListener("submit", handleFormSubmit);
  }
};

// --- 3. Import/Export Rules Logic ---

/**
 * Exports the current URL Pinning Rules as a JSON file.
 */
const handleExportRules = () => {
  chrome.storage.sync.get("regexes", (data) => {
    const rules = data.regexes || [];
    const json = JSON.stringify(rules, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: "pintab_rules.json",
      saveAs: true,
    });
  });
};

/**
 * Handles the import of URL Pinning Rules from a JSON file.
 * Validates the JSON, replaces existing rules in storage, shows a toast, and reloads the page.
 * @param {Event} event - The change event from the file input.
 */
const handleImportRules = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedRules = JSON.parse(e.target.result);

      // Basic validation: Must be an array
      if (!Array.isArray(importedRules)) {
        throw new Error("Invalid format: Must be an array of rules.");
      }

      // Validate each rule
      for (let rule of importedRules) {
        if (typeof rule !== "object" || !rule.regex || typeof rule.regex !== "string") {
          throw new Error('Invalid rule: Each rule must have a "regex" string.');
        }
        if (rule.name && typeof rule.name !== "string") {
          throw new Error('Invalid rule: "name" must be a string.');
        }
        if (rule.index !== undefined && typeof rule.index !== "number") {
          throw new Error('Invalid rule: "index" must be a number.');
        }
        if (rule.disable !== undefined && typeof rule.disable !== "boolean") {
          throw new Error('Invalid rule: "disable" must be a boolean.');
        }
        // No additional properties allowed (strict schema)
        const allowedKeys = ["name", "regex", "index", "disable"];
        for (let key in rule) {
          if (!allowedKeys.includes(key)) {
            throw new Error(`Invalid rule: Unknown property "${key}".`);
          }
        }
      }

      // Replace existing rules in storage
      chrome.storage.sync.set({ regexes: importedRules }, () => {
        createToastAlert("Rules imported successfully! Reloading...", "success");
        // Reload the page to refresh the form with new rules
        setTimeout(() => location.reload(), 1500);
      });
    } catch (err) {
      createToastAlert("Import failed: " + err.message, "error");
    }
  };
  reader.readAsText(file);
};

/**
 * Initializes the event listeners for import and export buttons.
 */
const initializeImportExport = () => {
  const exportButton = document.getElementById("js-export-button");
  if (exportButton) {
    exportButton.addEventListener("click", handleExportRules);
  }

  const importButton = document.getElementById("js-import-button");
  const importFile = document.getElementById("js-import-file");
  if (importButton && importFile) {
    importButton.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", handleImportRules);
  }
};

// --- 5. Unsaved Changes Detection ---

let hasUnsavedChanges = false;

/**
 * Marks the form as having unsaved changes.
 */
const markUnsavedChanges = () => {
  hasUnsavedChanges = true;
};

/**
 * Clears the unsaved changes flag (called after successful save).
 */
const clearUnsavedChanges = () => {
  hasUnsavedChanges = false;
};

/**
 * Handles the browser's beforeunload event to warn about unsaved changes.
 * @param {BeforeUnloadEvent} event
 */
const handleBeforeUnload = (event) => {
  if (hasUnsavedChanges) {
    // Most browsers show a standard message; we just need to set returnValue
    event.preventDefault();
    event.returnValue = ""; // Required for Chrome to show the dialog
    return ""; // Some browsers use this
  }
};

/**
 * Attaches listeners to detect changes in the form.
 * This covers:
 * - Input/checkbox changes (including advanced settings)
 * - Rule addition/removal (via template system)
 * - Import (which reloads anyway, but we'll mark as dirty if needed)
 */
const initializeUnsavedChangesDetection = () => {
  const form = document.querySelector(".settings-container");

  if (!form) return;

  // 1. Listen for any input/change in static fields (checkboxes, etc.)
  form.addEventListener("input", markUnsavedChanges);
  form.addEventListener("change", markUnsavedChanges);

  // 2. Detect rule additions (Add New Rule button)
  const addRuleButton = document.querySelector(".js-add-template-text");
  if (addRuleButton) {
    addRuleButton.addEventListener("click", markUnsavedChanges);
  }

  // 3. Detect rule removals (Remove buttons are added dynamically)
  // Use event delegation on the rule container
  const ruleContainer = document.getElementById("js-rule-container");
  if (ruleContainer) {
    ruleContainer.addEventListener("click", (e) => {
      if (e.target.closest(".js-remove-button")) {
        markUnsavedChanges();
      }
    });
  }

  // 4. Import rules: technically changes data, but we reload anyway — still mark dirty
  const importButton = document.getElementById("js-import-button");
  if (importButton) {
    importButton.addEventListener("click", markUnsavedChanges);
  }

  // 5. Attach beforeunload listener
  window.addEventListener("beforeunload", handleBeforeUnload);
};

// --- 4. Initialization ---

/**
 * Runs all initial setup functions once the DOM is fully loaded.
 */
const initializeOptionsPage = () => {
  initializeAdvancedSettingsToggle();
  initializeSaveFeedback();
  initializeImportExport();
  initializeUnsavedChangesDetection();
};

// Wait for the DOM to be fully loaded before running initialization code
document.addEventListener("DOMContentLoaded", initializeOptionsPage);
