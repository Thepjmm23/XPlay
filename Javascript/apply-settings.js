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

        // Anti-Close
        const antiCloseEnabled = localStorage.getItem('antiClose') === 'true';
        if (antiCloseEnabled) {
            window.addEventListener('beforeunload', (e) => {
                e.preventDefault();
                e.returnValue = '';
            });
        }

        // Theme
        const savedTheme = localStorage.getItem('theme') || 'space';
        document.body.className = savedTheme + '-theme';
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
