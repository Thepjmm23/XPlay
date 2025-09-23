(function() {
    // Function to apply settings from localStorage
    function applySettings() {
        // Tab Cloak
        const savedTitle = localStorage.getItem('tabTitle');
        const savedIcon = localStorage.getItem('tabIcon');
        if (savedTitle) {
            document.title = savedTitle;
        }
        if (savedIcon) {
            const iconLink = document.querySelector("link[rel*='icon']") || document.createElement('link');
            iconLink.type = 'image/x-icon';
            iconLink.rel = 'shortcut icon';
            iconLink.href = savedIcon;
            document.getElementsByTagName('head')[0].appendChild(iconLink);
        }

        // Interactivity
        const clickEffectEnabled = localStorage.getItem('clickEffect') === 'true';
        // Only update toggle if it exists on this page
        const clickEffectToggle = document.getElementById('click-effect-toggle');
        if (clickEffectToggle) {
            clickEffectToggle.checked = clickEffectEnabled;
        }

        // Anti-Close
        const antiCloseEnabled = localStorage.getItem('antiClose') === 'true';
        if (antiCloseEnabled) {
            window.addEventListener('beforeunload', (e) => {
                e.preventDefault();
                e.returnValue = '';
            });
        }

        // Custom Theme - Apply FIRST before theme styles (highest priority)
        const savedCustomCss = localStorage.getItem('customCss');
        const customCssEnabled = localStorage.getItem('customCssEnabled') !== 'false';

        if (savedCustomCss && customCssEnabled) {
            // Remove any existing custom CSS
            const existingStyle = document.getElementById('custom-theme-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            // Apply custom CSS FIRST with highest priority
            const style = document.createElement('style');
            style.id = 'custom-theme-styles';
            style.textContent = savedCustomCss;
            document.head.appendChild(style);

            // Debug: Log successful application
            console.log('✅ Custom CSS applied FIRST:', savedCustomCss.substring(0, 100) + '...');
        } else {
            console.log('ℹ️ No custom CSS to apply or custom CSS disabled');
        }

        // Theme - Apply AFTER custom CSS so custom CSS can override
        const savedTheme = localStorage.getItem('theme') || 'space';
        document.body.className = savedTheme + '-theme';

        // Listen for custom CSS changes from settings (real-time sync)
        window.addEventListener('customCssChanged', (event) => {
            const { css, enabled } = event.detail;

            if (enabled && css) {
                // Remove existing custom CSS
                const existingStyle = document.getElementById('custom-theme-styles');
                if (existingStyle) {
                    existingStyle.remove();
                }

                // Apply new custom CSS immediately
                const style = document.createElement('style');
                style.id = 'custom-theme-styles';
                style.textContent = css;
                document.head.appendChild(style);
            } else {
                // Remove custom CSS
                const existingStyle = document.getElementById('custom-theme-styles');
                if (existingStyle) {
                    existingStyle.remove();
                }
            }
        });

        // Listen for localStorage changes (works across all pages/tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'customCss' || e.key === 'customCssEnabled') {
                const updatedCss = localStorage.getItem('customCss');
                const updatedEnabled = localStorage.getItem('customCssEnabled') !== 'false';

                if (updatedCss && updatedEnabled) {
                    // Remove existing and apply updated CSS
                    const existingStyle = document.getElementById('custom-theme-styles');
                    if (existingStyle) {
                        existingStyle.remove();
                    }

                    const style = document.createElement('style');
                    style.id = 'custom-theme-styles';
                    style.textContent = updatedCss;
                    document.head.appendChild(style);
                } else {
                    // Remove custom CSS
                    const existingStyle = document.getElementById('custom-theme-styles');
                    if (existingStyle) {
                        existingStyle.remove();
                    }
                }
            }
        });
    }

    // Run as soon as the body exists
    function initialize() {
        applySettings();

        const newTabButton = document.getElementById('open-in-new-tab');
        if (newTabButton) {
            newTabButton.addEventListener('click', () => {
                try {
                    const url = window.location.href;
                    const newWindow = window.open('about:blank', '_blank');
                    if (newWindow) {
                        newWindow.document.title = document.title;
                        const iframe = newWindow.document.createElement('iframe');
                        iframe.style.position = 'fixed';
                        iframe.style.top = '0';
                        iframe.style.left = '0';
                        iframe.style.width = '100%';
                        iframe.style.height = '100%';
                        iframe.style.border = 'none';
                        iframe.src = url;
                        newWindow.document.body.style.margin = '0';
                        newWindow.document.body.appendChild(iframe);
                    } else {
                        alert('Please allow popups for this feature to work.');
                    }
                } catch (e) {
                    console.error('Could not open in new tab:', e);
                    alert('An error occurred. Please ensure popups are not blocked.');
                }
            });
        }
    }

    // Run as soon as possible, even before DOM is ready
    function applyCustomCssNow() {
        const savedCustomCss = localStorage.getItem('customCss');
        const customCssEnabled = localStorage.getItem('customCssEnabled') !== 'false';

        if (savedCustomCss && customCssEnabled) {
            // Remove any existing custom CSS
            const existingStyle = document.getElementById('custom-theme-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            // Apply custom CSS immediately with highest priority
            const style = document.createElement('style');
            style.id = 'custom-theme-styles';
            style.textContent = savedCustomCss;
            document.head.appendChild(style);

            // Apply theme AFTER custom CSS
            const savedTheme = localStorage.getItem('theme') || 'space';
            document.body.className = savedTheme + '-theme';
        }
    }

    // Apply immediately if document is ready
    if (document.readyState !== 'loading') {
        applyCustomCssNow();
    } else {
        // Apply as soon as DOM is available
        document.addEventListener('DOMContentLoaded', applyCustomCssNow);
    }
})();
