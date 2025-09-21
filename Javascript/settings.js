document.addEventListener('DOMContentLoaded', () => {
    // Tab Cloaking Elements
    const tabTitleInput = document.getElementById('tab-title');
    const tabIconInput = document.getElementById('tab-icon');
    const applyCloakButton = document.getElementById('apply-cloak');
    const resetCloakButton = document.getElementById('reset-cloak');

    // Anti-Close Elements
    const antiCloseToggle = document.getElementById('anti-close-toggle');

    // Theme Elements
    const themeSelect = document.getElementById('theme-select');

    // Interactive Elements
    const clickEffectToggle = document.getElementById('click-effect-toggle');
    const mouseInteractionSelect = document.getElementById('mouse-interaction-select');

    // --- Load settings from localStorage and apply them ---
    function loadSettings() {
        // Tab Cloak
        const savedTitle = localStorage.getItem('tabTitle');
        const savedIcon = localStorage.getItem('tabIcon');
        if (savedTitle) {
            document.title = savedTitle;
            tabTitleInput.value = savedTitle;
        }
        if (savedIcon) {
            document.querySelector("link[rel*='icon']").href = savedIcon;
            tabIconInput.value = savedIcon;
        }

        // Anti-Close
        const antiCloseEnabled = localStorage.getItem('antiClose') === 'true';
        antiCloseToggle.checked = antiCloseEnabled;
        if (antiCloseEnabled) {
            window.addEventListener('beforeunload', beforeUnloadHandler);
        }

        // Theme
        const savedTheme = localStorage.getItem('theme') || 'space';
        document.body.className = savedTheme + '-theme';
        themeSelect.value = savedTheme;

        // Interactivity
        const clickEffectEnabled = localStorage.getItem('clickEffect') === 'true';
        clickEffectToggle.checked = clickEffectEnabled;

        const mouseInteraction = localStorage.getItem('mouseInteraction') || 'off';
        mouseInteractionSelect.value = mouseInteraction;
    }

    // --- Event Handlers ---

    // Tab Cloaking
    applyCloakButton.addEventListener('click', () => {
        const newTitle = tabTitleInput.value.trim();
        const newIcon = tabIconInput.value.trim();

        if (newTitle) {
            localStorage.setItem('tabTitle', newTitle);
            document.title = newTitle;
        }
        if (newIcon) {
            localStorage.setItem('tabIcon', newIcon);
            document.querySelector("link[rel*='icon']").href = newIcon;
        }
    });

    resetCloakButton.addEventListener('click', () => {
        localStorage.removeItem('tabTitle');
        localStorage.removeItem('tabIcon');
        tabTitleInput.value = '';
        tabIconInput.value = '';
        // You might want to set these back to a default value
        document.title = 'Settings - Unblocked Games'; 
        document.querySelector("link[rel*='icon']").href = ''; // Default icon path
    });

    // Anti-Close
    const beforeUnloadHandler = (e) => {
        e.preventDefault();
        e.returnValue = '';
    };

    antiCloseToggle.addEventListener('change', () => {
        if (antiCloseToggle.checked) {
            localStorage.setItem('antiClose', 'true');
            window.addEventListener('beforeunload', beforeUnloadHandler);
        } else {
            localStorage.setItem('antiClose', 'false');
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        }
    });

    // Theme Selection
    themeSelect.addEventListener('change', () => {
        const selectedTheme = themeSelect.value;
        localStorage.setItem('theme', selectedTheme);
        document.body.className = selectedTheme + '-theme';
        // We'll need to update main.js to handle the background animation change
    });

    // Interactive Toggles
    clickEffectToggle.addEventListener('change', () => {
        localStorage.setItem('clickEffect', clickEffectToggle.checked);
    });

    mouseInteractionSelect.addEventListener('change', () => {
        localStorage.setItem('mouseInteraction', mouseInteractionSelect.value);
    });

    // Initial load
    loadSettings();
});