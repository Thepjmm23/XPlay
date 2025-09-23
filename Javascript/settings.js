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
    const themePreview = document.getElementById('theme-preview');
    const customCssInput = document.getElementById('custom-css');
    const applyCustomThemeButton = document.getElementById('apply-custom-theme');
    const saveCustomThemeButton = document.getElementById('save-custom-theme');
    const resetCustomThemeButton = document.getElementById('reset-custom-theme');
    const customCssToggle = document.getElementById('custom-css-toggle');

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

        // Theme Selection
        themeSelect.addEventListener('change', () => {
            const selectedTheme = themeSelect.value;
            localStorage.setItem('theme', selectedTheme);
            document.body.className = selectedTheme + '-theme';
            updateThemePreview(selectedTheme);
            // We'll need to update main.js to handle the background animation change
        });

        const savedTheme = localStorage.getItem('theme') || 'space';
        document.body.className = savedTheme + '-theme';
        themeSelect.value = savedTheme;

        // Custom Theme
        const savedCustomCss = localStorage.getItem('customCss');
        const customCssEnabled = localStorage.getItem('customCssEnabled') !== 'false';

        if (savedCustomCss) {
            customCssInput.value = savedCustomCss;
        }

        // Check if there's CSS from the gallery
        const galleryCss = sessionStorage.getItem('customCssFromGallery');
        if (galleryCss) {
            customCssInput.value = galleryCss;
            sessionStorage.removeItem('customCssFromGallery'); // Clean up
            alert('✅ CSS loaded from gallery!\n\nClick "Apply" to see your changes!');
        }

        customCssToggle.checked = customCssEnabled;

        // Update theme preview
        updateThemePreview(savedTheme);

        // Interactivity
        const clickEffectEnabled = localStorage.getItem('clickEffect') === 'true';
        clickEffectToggle.checked = clickEffectEnabled;

        // Enable click effects by default if not set
        if (localStorage.getItem('clickEffect') === null) {
            localStorage.setItem('clickEffect', 'true');
            clickEffectToggle.checked = true;
        }

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

    // Theme Preview Function
    function updateThemePreview(theme) {
        const previews = {
            'space': 'radial-gradient(ellipse at center, #1e3c72 0%, #2a5298 100%)',
            'ocean': 'linear-gradient(180deg, #001f3f 0%, #004080 50%, #0066cc 100%)',
            'hacking': 'linear-gradient(45deg, #000 0%, #0f0 50%, #000 100%)'
        };

        if (themePreview && previews[theme]) {
            themePreview.style.background = previews[theme];
        }
    }

    // Apply Custom Theme
    function applyCustomTheme() {
        const customCss = customCssInput.value.trim();
        if (customCss) {
            // Remove existing custom CSS
            const existingStyle = document.getElementById('custom-theme-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            // Apply to current page immediately
            const style = document.createElement('style');
            style.id = 'custom-theme-styles';
            style.textContent = customCss;
            document.head.appendChild(style);

            // Save to localStorage and broadcast to all pages
            localStorage.setItem('customCss', customCss);
            localStorage.setItem('customCssEnabled', 'true');

            // Broadcast change to all open pages
            window.dispatchEvent(new CustomEvent('customCssChanged', {
                detail: { css: customCss, enabled: true }
            }));
        }
    }

    applyCustomThemeButton.addEventListener('click', applyCustomTheme);

    // Save Custom Theme
    saveCustomThemeButton.addEventListener('click', () => {
        const customCss = customCssInput.value.trim();
        if (customCss) {
            // Save to localStorage
            localStorage.setItem('customCss', customCss);
            localStorage.setItem('customCssEnabled', 'true');

            // Apply immediately to current page
            applyCustomTheme();

            // Show success message
            alert('✅ Custom CSS saved and applied to ALL pages!\n\nYour changes now appear on every page of the site and will persist after refresh.');

            // Optional: Auto-close settings or show preview
            setTimeout(() => {
                alert('🎉 Try navigating to other pages - your custom CSS follows you everywhere!');
            }, 1000);
        } else {
            alert('Please enter some CSS code first.');
        }
    });

    // Custom CSS Toggle
    customCssToggle.addEventListener('change', () => {
        const isEnabled = customCssToggle.checked;
        localStorage.setItem('customCssEnabled', isEnabled);

        // Apply or remove custom CSS immediately
        if (isEnabled) {
            applyCustomTheme();
        } else {
            const existingStyle = document.getElementById('custom-theme-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
        }

        // Broadcast toggle change to all pages
        window.dispatchEvent(new CustomEvent('customCssChanged', {
            detail: { css: localStorage.getItem('customCss') || '', enabled: isEnabled }
        }));
    });

    // Reset Custom Theme
    resetCustomThemeButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your custom CSS? This cannot be undone.')) {
            localStorage.removeItem('customCss');
            localStorage.setItem('customCssEnabled', 'true');
            customCssInput.value = '';
            customCssToggle.checked = true;

            // Remove custom CSS styles from current page
            const existingStyle = document.getElementById('custom-theme-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            // Broadcast reset to all pages
            window.dispatchEvent(new CustomEvent('customCssChanged', {
                detail: { css: '', enabled: true }
            }));

            alert('Custom CSS has been reset on all pages!');
        }
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