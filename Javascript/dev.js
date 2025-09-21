document.addEventListener('DOMContentLoaded', () => {
    const passwordPrompt = document.getElementById('password-prompt');
    const devPanel = document.getElementById('dev-panel');
    const passwordInput = document.getElementById('dev-password');
    const accessBtn = document.getElementById('access-btn');
    const errorMessage = document.getElementById('error-message');

    const correctPassword = 'XgM8-gDaM';

    // Check if already authenticated
    if (localStorage.getItem('devAuthenticated') === 'true') {
        showDevPanel();
    }

    accessBtn.addEventListener('click', () => {
        const enteredPassword = passwordInput.value;
        if (enteredPassword === correctPassword) {
            localStorage.setItem('devAuthenticated', 'true');
            showDevPanel();
        } else {
            errorMessage.textContent = 'Incorrect password. Access denied.';
            passwordInput.value = '';
        }
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            accessBtn.click();
        }
    });

    function showDevPanel() {
        passwordPrompt.style.display = 'none';
        devPanel.style.display = 'block';
        initializeDevControls();
    }

    function initializeDevControls() {
        // Load current settings
        loadCurrentSettings();

        // Add event listeners for all controls
        setupToggleControls();
        setupGlobalControls();
        setupFileViewer();
        setupSystemControls();
    }

    function loadCurrentSettings() {
        // Load current toggle states
        document.getElementById('toggle-mute').checked = localStorage.getItem('clickEffect') === 'true';
        document.getElementById('toggle-mouse-interaction').checked = localStorage.getItem('mouseInteraction') !== 'off';
        document.getElementById('toggle-cloak').checked = localStorage.getItem('tabTitle') !== null;
        document.getElementById('toggle-anti-close').checked = localStorage.getItem('antiClose') === 'true';
    }

    function setupToggleControls() {
        // Mute button toggle
        document.getElementById('toggle-mute').addEventListener('change', () => {
            const enabled = document.getElementById('toggle-mute').checked;
            if (enabled) {
                localStorage.setItem('clickEffect', 'true');
                broadcastChange('clickEffect', 'true');
            } else {
                localStorage.removeItem('clickEffect');
                broadcastChange('clickEffect', 'false');
            }
        });

        // Mouse interaction toggle
        document.getElementById('toggle-mouse-interaction').addEventListener('change', () => {
            const enabled = document.getElementById('toggle-mouse-interaction').checked;
            if (enabled) {
                localStorage.setItem('mouseInteraction', 'push');
                broadcastChange('mouseInteraction', 'push');
            } else {
                localStorage.setItem('mouseInteraction', 'off');
                broadcastChange('mouseInteraction', 'off');
            }
        });

        // Tab cloak toggle
        document.getElementById('toggle-cloak').addEventListener('change', () => {
            const enabled = document.getElementById('toggle-cloak').checked;
            if (enabled) {
                localStorage.setItem('tabTitle', 'ParaX Games');
                localStorage.setItem('tabIcon', '');
                broadcastChange('tabTitle', 'ParaX Games');
            } else {
                localStorage.removeItem('tabTitle');
                localStorage.removeItem('tabIcon');
                broadcastChange('tabTitle', '');
            }
        });

        // Anti-close toggle
        document.getElementById('toggle-anti-close').addEventListener('change', () => {
            const enabled = document.getElementById('toggle-anti-close').checked;
            if (enabled) {
                localStorage.setItem('antiClose', 'true');
            } else {
                localStorage.removeItem('antiClose');
            }
            broadcastChange('antiClose', enabled ? 'true' : 'false');
        });
    }

    function setupGlobalControls() {
        // Disable audio globally
        document.getElementById('disable-audio-global').addEventListener('click', () => {
            localStorage.setItem('clickEffect', 'false');
            broadcastChange('clickEffect', 'false');
        });

        // Enable audio globally
        document.getElementById('enable-audio-global').addEventListener('click', () => {
            localStorage.setItem('clickEffect', 'true');
            broadcastChange('clickEffect', 'true');
        });

        // Set themes globally
        document.getElementById('set-theme-space').addEventListener('click', () => {
            localStorage.setItem('theme', 'space');
            broadcastChange('theme', 'space');
        });

        document.getElementById('set-theme-hacking').addEventListener('click', () => {
            localStorage.setItem('theme', 'hacking');
            broadcastChange('theme', 'hacking');
        });

        document.getElementById('set-theme-ocean').addEventListener('click', () => {
            localStorage.setItem('theme', 'ocean');
            broadcastChange('theme', 'ocean');
        });
    }

    function setupFileViewer() {
        const fileItems = document.querySelectorAll('.file-item');
        const fileContent = document.getElementById('file-content');

        fileItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                fileItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');

                const path = item.dataset.path;
                showFileContent(path);
            });
        });
    }

    function showFileContent(path) {
        const fileContent = document.getElementById('file-content');

        // This is a demo - in a real implementation, you'd load the actual file content
        const fileContents = {
            'Pages/home.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParaX Games</title>
    <!-- Font and styles here -->
</head>
<body>
    <canvas id="starfield"></canvas>
    <nav>
        <!-- Navigation here -->
    </nav>
    <main>
        <h1>ParaX Games</h1>
        <p>ParaX Games is a website that allows you to play games that are blocked by your school</p>
    </main>
    <script src="../Javascript/main.js"></script>
</body>
</html>`,
            'style.css': `/* CSS content would be loaded here */`,
            'Data/games.json': `{\n    "games": [\n        /* Game list here */\n    ]\n}`
        };

        fileContent.innerHTML = fileContents[path] || `Content of ${path} would be displayed here.`;
        fileContent.style.display = 'block';
    }

    function setupSystemControls() {
        // Clear all user data
        document.getElementById('clear-storage').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all user data? This cannot be undone.')) {
                localStorage.clear();
                alert('All user data has been cleared.');
                location.reload();
            }
        });

        // Reset all settings
        document.getElementById('reset-settings').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to default?')) {
                const keysToKeep = ['devAuthenticated'];
                Object.keys(localStorage).forEach(key => {
                    if (!keysToKeep.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });
                alert('All settings have been reset to default.');
                location.reload();
            }
        });
    }

    function broadcastChange(key, value) {
        // Broadcast the change to all open tabs
        localStorage.setItem(key, value);
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
    }
});
