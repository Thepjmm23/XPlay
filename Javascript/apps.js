document.addEventListener('DOMContentLoaded', () => {
    console.log('Apps Showcase loaded');

    // Get DOM elements
    const appsGrid = document.getElementById('apps-grid');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const categoryButtons = document.querySelectorAll('.category-btn');

    let allApps = [];

    // Initialize
    initializeApps();

    function initializeApps() {
        console.log('Initializing apps showcase...');
        showLoadingState();
        loadApps();
        setupCategoryFiltering();
        console.log('Apps showcase initialized');
    }

    function loadApps() {
        fetch('./Data/apps.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load apps data');
                }
                return response.json();
            })
            .then(data => {
                console.log('Apps data loaded:', data);
                allApps = data.apps;
                displayApps(allApps);
                hideLoadingState();
            })
            .catch(error => {
                console.error('Error loading apps:', error);
                showErrorState();
            });
    }

    function displayApps(apps) {
        appsGrid.innerHTML = '';

        apps.forEach(app => {
            const appCard = createAppCard(app);
            appsGrid.appendChild(appCard);
        });

        console.log(`Displayed ${apps.length} apps`);
    }

    function createAppCard(app) {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.dataset.category = app.category;

        // Create icon based on app name
        const icon = getAppIcon(app.name);

        card.innerHTML = `
            <div class="app-icon">${icon}</div>
            <div class="app-content">
                <h3>${app.name}</h3>
                <p>${app.description}</p>
                <button class="app-button" onclick="openApp('${app.file}')">Launch App</button>
            </div>
        `;

        return card;
    }

    function getAppIcon(appName) {
        const iconMap = {
            'Google Translate': '🌐',
            'YouTube': '📺',
            'GitHub': '🐙',
            'Discord': '💬',
            'Notion': '📝',
            'Figma': '🎨',
            'Spotify': '🎵',
            'Reddit': '🟠',
            'Khan Academy': '🎓',
            'CodePen': '💻',
            'Twitch': '📺',
            'LinkedIn': '💼',
            'Duolingo': '🦉',
            'Canva': '🎨',
            'Netflix': '🍿',
            'Stack Overflow': '💡',
            'Trello': '📋',
            'Pinterest': '📌',
            'Coursera': '🎓',
            'Slack': '💬',
            'Windows 11 Web': '🪟'
        };

        return iconMap[appName] || '📱';
    }

    function setupCategoryFiltering() {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');

                const category = button.dataset.category;
                filterApps(category);
            });
        });
    }

    function filterApps(category) {
        let filteredApps;

        if (category === 'all') {
            filteredApps = allApps;
        } else {
            filteredApps = allApps.filter(app => app.category === category);
        }

        displayApps(filteredApps);
    }

    function showLoadingState() {
        loadingState.style.display = 'flex';
        appsGrid.style.display = 'none';
        errorState.style.display = 'none';
    }

    function hideLoadingState() {
        loadingState.style.display = 'none';
        appsGrid.style.display = 'grid';
        errorState.style.display = 'none';
    }

    function showErrorState() {
        loadingState.style.display = 'none';
        appsGrid.style.display = 'none';
        errorState.style.display = 'flex';
    }

    // Global function to open apps
    window.openApp = function(url) {
        console.log('Opening app:', url);
        window.open(url, '_blank');
    };

    console.log('Apps showcase ready');
});
