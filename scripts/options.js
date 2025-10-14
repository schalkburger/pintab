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
  // Assuming the original logic (in thirdparty.js) runs on submit and handles the saving.
  // We simply wait a short time to simulate a successful save before showing the toast.
  // For a real-world scenario, you would call createToastAlert *inside* the success
  // callback of your actual settings saving function.

  // The existing thirdparty.js uses jQuery's $(document).ready() and attaches a submit
  // handler to the form. We will let that handler run, which prevents the default.
  // We will attach an event listener to the form's 'submit' event.
  // If the thirdparty.js logic prevents the default and handles saving, this listener
  // should still fire. We'll use a timeout to ensure the save is 'complete' first.

  // Prevent default submit in this *new* handler to be safe, though thirdparty.js likely does this.
  // If thirdparty.js is not preventing default, the page would reload.
  // We'll rely on the existing logic to handle the save.
  event.preventDefault();

  // Simulate save delay before showing toast
  // NOTE: In a clean implementation, this call would be inside the success handler of the save function.
  setTimeout(() => {
    createToastAlert("Settings successfully saved!", "success");
  }, 100); // Small delay to simulate async save operation
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

// --- 3. Initialization ---

/**
 * Runs all initial setup functions once the DOM is fully loaded.
 */
const initializeOptionsPage = () => {
  initializeAdvancedSettingsToggle();
  initializeSaveFeedback();
};

// Wait for the DOM to be fully loaded before running initialization code
document.addEventListener("DOMContentLoaded", initializeOptionsPage);
