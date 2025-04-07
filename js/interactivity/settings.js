const SETTINGS_STORAGE_KEY = 'mySimpleWebAppSettings';

const DEFAULT_SETTINGS = {
    vertexProximityPx: 16,     // Default proximity for vertices
    edgeProximityPx: 8,       // Default proximity for edges
    explodeCoordinates: 4,    // Default value for explodeCoordinates
    clickDragTolerancePx: 4,  // How much the mouse can move before it's a drag and not a click
    selectedColor: '#0000ff',    // blue -  Default color for selected items
    regularColor: '#000000',   // black- Default color for regular items
    vertexColor: '#000000',
    edgeColor: '#333333',
    forRemovalColor: '#dc143c', // crimson - Default color for items marked for removal
    highlightColor: '#FFD700',    // gold - Default color for highlighted items
    willBeAddedColor: '#66cdaa' // Default color for potential additions
};

const ADD_COLOR =  'willBeAddedColor';
const HIGHTLIGHT_COLOR = 'highlightColor';
const REMOVE_COLOR = 'forRemovalColor';
const SELECT_COLOR = 'selectedColor';
const REGULAR_COLOR = 'regularColor';
const VERTEX_COLOR = 'vertexColor';
const EDGE_COLOR = 'edgeColor';
const PROXIMITY_VERTEX = 'vertexProximityPx';
const PROXIMITY_EDGE = 'edgeProximityPx';
const CLICK_TOLERANCE = 'clickDragTolerancePx';

const settingsManager = {
    settings: {}, // Holds the current settings in memory

    /**
     * Initializes the settings manager.
     * Loads settings from localStorage if available, otherwise saves defaults.
     * Should be called once when the application loads.
     */
    init: function() {
        console.log("Initializing settings manager...");
        let loadedSettings = null;
        try {
            const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                loadedSettings = JSON.parse(storedSettings);
                console.log("Loaded settings from localStorage");
            } else {
                 console.log("No settings found in localStorage.");
            }
        } catch (error) {
            console.error("Error parsing settings from localStorage:", error);
            // Proceed as if no settings were found
        }

        // Merge loaded settings with defaults. This ensures:
        // 1. Defaults are used if nothing is loaded.
        // 2. Existing user settings are preserved.
        // 3. If new settings are added to DEFAULT_SETTINGS in future updates,
        //    users with old saved data will get the new defaults correctly.
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings);

        // If nothing was loaded (or parsing failed), save the initial defaults
        if (!loadedSettings) {
            this.save();
            console.log("Saved default settings to localStorage.");
        } else if (JSON.stringify(this.settings) !== JSON.stringify(loadedSettings)) {
             this.save();
             console.log("Updated localStorage with merged settings.");
        }   

    },

    /**
     * Saves the current settings object to localStorage.
     * Automatically called by set() and resetToDefaults().
     */
    save: function() {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error("Error saving settings to localStorage:", error);
            // Consider potential storage limits if error occurs
        }
    },

    /**
     * Retrieves the value of a specific setting.
     * @param {string} key - The key of the setting to retrieve.
     * @returns {*} The value of the setting, or undefined if the key doesn't exist.
     */
    get: function(key) {
        // Check if the key exists in the managed settings (derived from defaults)
        if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
           return this.settings[key];
        } else {
           console.warn(`Settings key "${key}" does not exist in default settings.`);
           return undefined; // Or return null, depending on preference
        }
    },

    /**
     * Retrieves all current settings as a copy.
     * @returns {object} A copy of the current settings object.
     */
     getAll: function() {
        // Return a copy to prevent accidental direct modification of the internal object
        return { ...this.settings };
    },


    /**
     * Updates the value of a specific setting and saves to localStorage.
     * @param {string} key - The key of the setting to update.
     * @param {*} value - The new value for the setting.
     */
    set: function(key, value) {
        // Only allow setting keys that exist in the defaults to prevent pollution
        if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
            this.settings[key] = value;
            this.save(); // Persist changes immediately
            console.log(`Setting updated: ${key} =`, value);
        } else {
            console.warn(`Attempted to set unknown setting key "${key}". Ignoring.`);
        }
    },

    /**
     * Resets all settings to their default values and saves to localStorage.
     */
    resetToDefaults: function() {
        console.log("Resetting settings to defaults...");
        // Create a fresh copy from the defaults
        this.settings = { ...DEFAULT_SETTINGS };
        this.save(); // Persist the reset state
        console.log("Settings reset and saved:", this.settings);
        // Optional: Trigger an event or reload parts of the UI if needed
        // window.dispatchEvent(new CustomEvent('settings-reset'));
    },

     /**
     * Utility to completely clear the settings from localStorage.
     * Mostly for debugging or complete reset scenarios.
     */
    clearSavedSettings: function() {
        console.warn("Clearing all saved settings from localStorage!");
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
        console.log("Settings cleared from localStorage.");
    }
};

// --- IMPORTANT ---
// Initialize the settings manager when the script loads
settingsManager.init();












// Helper function to create a single setting item (label + input + optional display)
function createSettingInput(key, labelText, type, options = {}) {

    const currentSettings = settingsManager.getAll();
    const itemDiv = document.createElement('div');
    itemDiv.className = 'setting-item';

    const label = document.createElement('label');
    label.htmlFor = `setting-${key}`;
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = type;
    input.id = `setting-${key}`;
    input.value = currentSettings[key]; // Set initial value

    let valueDisplay = null;

    if (type === 'range') {
        input.min = options.min || 5;   // Default min/max for sliders
        input.max = options.max || 20;
        input.step = options.step || 1;

        // Span to display the slider's current value
        valueDisplay = document.createElement('span');
        valueDisplay.className = 'value-display';
        valueDisplay.id = `value-${key}`;
        valueDisplay.textContent = input.value;

        input.addEventListener('input', (event) => {
            const newValue = parseInt(event.target.value, 10);
            valueDisplay.textContent = newValue; // Update display immediately
            settingsManager.set(key, newValue); // Save setting immediately
        });
    } else if (type === 'number') {
         input.min = options.min || 0;
         input.step = options.step || 1;
         input.addEventListener('change', (event) => { // 'change' might be better than 'input' for number
            const newValue = parseInt(event.target.value, 10);
             // Basic validation if needed:
             if (!isNaN(newValue) && newValue >= (options.min || 0)) {
                settingsManager.set(key, newValue);
             } else {
                // Revert to last valid value if input is bad
                event.target.value = settingsManager.get(key);
             }
        });
    } else if (type === 'color') {
        input.addEventListener('input', (event) => {
            settingsManager.set(key, event.target.value); // Save setting immediately
        });
    }

    itemDiv.appendChild(label);
    itemDiv.appendChild(input);
    if (valueDisplay) {
        itemDiv.appendChild(valueDisplay); // Add value display next to slider
    }

    return itemDiv;
}





/**
 * Creates the HTML element containing the settings UI.
 * This element can be passed to showModal().
 * @returns {HTMLElement} A div element containing the settings panel UI.
 */
function createSettingsPanel() {
    const parentContainer = document.createElement('div');
    parentContainer.className = 'settings-parent-container';

    settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-panel-container';

    parentContainer.appendChild(settingsContainer);

    // --- Create UI Groups ---

    // Proximity Group
    const proximityGroup = document.createElement('div');
    proximityGroup.className = 'settings-group';
    const proximityHeader = document.createElement('h4');
    proximityHeader.textContent = 'Proximity Settings';
    proximityGroup.appendChild(proximityHeader);

    proximityGroup.appendChild(createSettingInput('vertexProximityPx', 'Vertex Hover (px)', 'range', { min: 5, max: 25 }));
    proximityGroup.appendChild(createSettingInput('edgeProximityPx', 'Edge Hover (px)', 'range', { min: 3, max: 20 }));

    settingsContainer.appendChild(proximityGroup);

    // Color Group
    const colorGroup = document.createElement('div');
    colorGroup.className = 'settings-group';
    const colorHeader = document.createElement('h4');
    colorHeader.textContent = 'Color Settings';
    colorGroup.appendChild(colorHeader);

    colorGroup.appendChild(createSettingInput(REGULAR_COLOR, 'Fallback color', 'color'));

    colorGroup.appendChild(createSettingInput(VERTEX_COLOR, 'Regular Vertex', 'color'));
    colorGroup.appendChild(createSettingInput(EDGE_COLOR, 'Regular Edge', 'color'));

    colorGroup.appendChild(createSettingInput(SELECT_COLOR, 'Selected Item', 'color'));
    colorGroup.appendChild(createSettingInput(REMOVE_COLOR, 'Marked for Removal', 'color'));
    colorGroup.appendChild(createSettingInput(HIGHTLIGHT_COLOR, 'Highlight Action', 'color'));
    colorGroup.appendChild(createSettingInput(ADD_COLOR, 'Potential Addition', 'color'));

    settingsContainer.appendChild(colorGroup);

    const miscGroup = document.createElement('div');
    miscGroup.className = 'settings-group';
    const miscHeader = document.createElement('h4');
    miscHeader.textContent = 'Miscellaneous Settings'
    miscGroup.appendChild(miscHeader);

    miscGroup.appendChild(createSettingInput('explodeCoordinates', 'Explode Factor', 'range', { min: 2, max: 20 }));
    miscGroup.appendChild(createSettingInput(CLICK_TOLERANCE, 'Click tolearnce (px)', 'range', {min: 1, max: 10}));

    settingsContainer.appendChild(miscGroup);    

    // Actions Group (Reset Button)
    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'settings-actions';
    const resetButton = document.createElement('button');
    resetButton.id = 'resetSettingsBtn';
    resetButton.textContent = 'Reset to Defaults';

    resetButton.addEventListener('click', () => {
        settingsManager.resetToDefaults();
        // IMPORTANT: Update the UI controls within *this panel* to reflect the defaults
        const newDefaults = settingsManager.getAll();
        settingsContainer.querySelectorAll('input').forEach(input => {
            const key = input.id.replace('setting-', ''); // Extract key from input ID
            if (Object.prototype.hasOwnProperty.call(newDefaults, key)) {
                input.value = newDefaults[key];
                // Also update slider value displays if they exist
                const valueDisplay = settingsContainer.querySelector(`#value-${key}`);
                if (valueDisplay) {
                    valueDisplay.textContent = newDefaults[key];
                }
            }
        });
        console.log("Settings panel UI updated to defaults.");
    });

    actionsGroup.appendChild(resetButton);
    parentContainer.appendChild(actionsGroup);

    return parentContainer;
}