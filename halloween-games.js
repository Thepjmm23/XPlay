// Halloween Games System - XPlay (Enhanced with Multiplayer)
class HalloweenGames {
    constructor() {
        this.items = {};
        this.collectedItems = new Map();
        this.currentGame = 'trick-or-treat';
        this.cookieName = 'xplay_halloween_collection';
        this.playerCookieName = 'xplay_halloween_player';
        this.dailyLimitCookie = 'xplay_halloween_daily';

        // Player system
        this.currentPlayer = null;
        this.playersDB = {};
        this.dailyTreatsUsed = 0;
        this.lastTreatReset = null;

        this.init();
    }

    async init() {
        console.log('Initializing Halloween Games...');
        await this.loadItemsData();
        await this.loadPlayersData();
        this.loadPlayerData();
        this.loadDailyData();
        this.loadCollection();
        this.setupEventListeners();

        // Force update displays immediately after loading
        this.updateCollectionDisplay();
        this.updateTradeSelect();
        this.updatePlayerDisplay();
        this.updateDailyCounter();
        this.updateDebugDisplay();

        console.log('Halloween Games initialized successfully');
    }

    async loadItemsData() {
        try {
            const response = await fetch('./Data/halloween-items.json');
            const data = await response.json();
            this.items = data.items;
            this.rarityWeights = data.rarityWeights;
            this.gameSettings = data.gameSettings;
        } catch (error) {
            console.error('Failed to load Halloween items:', error);
            this.items = this.getFallbackItems();
        }
    }

    async loadPlayersData() {
        try {
            const response = await fetch('./Data/halloween-players.json');
            const data = await response.json();
            this.playersDB = data.players;
        } catch (error) {
            console.error('Failed to load players data:', error);
            this.playersDB = {};
        }
    }

    savePlayersData() {
        try {
            const data = {
                players: this.playersDB,
                globalStats: {
                    totalTreatsGiven: 0,
                    totalTrades: 0,
                    totalPlayers: Object.keys(this.playersDB).length,
                    lastReset: new Date().toISOString()
                }
            };

            // In a real app, this would be sent to a server
            localStorage.setItem('xplay_halloween_players', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving players data:', error);
        }
    }

    loadPlayerData() {
        try {
            const saved = this.getCookie(this.playerCookieName);
            if (saved) {
                this.currentPlayer = JSON.parse(saved);
            } else {
                this.currentPlayer = {
                    id: 'player_' + Date.now() + Math.random().toString(36).substr(2, 9),
                    name: 'Anonymous Player',
                    avatar: '👤',
                    joinedAt: Date.now(),
                    totalTreats: 0,
                    totalTrades: 0
                };
                this.savePlayerData();
            }

            // Ensure player exists in database
            if (!this.playersDB[this.currentPlayer.id]) {
                this.playersDB[this.currentPlayer.id] = { ...this.currentPlayer };
                this.savePlayersData();
            }
        } catch (error) {
            console.error('Error loading player data:', error);
            this.currentPlayer = {
                id: 'player_' + Date.now(),
                name: 'Anonymous Player',
                avatar: '👤'
            };
        }
    }

    savePlayerData() {
        try {
            this.setCookie(this.playerCookieName, JSON.stringify(this.currentPlayer), 365);
        } catch (error) {
            console.error('Error saving player data:', error);
        }
    }

    loadDailyData() {
        try {
            const saved = this.getCookie(this.dailyLimitCookie);
            if (saved) {
                const data = JSON.parse(saved);
                const today = new Date().toDateString();

                if (data.date === today) {
                    this.dailyTreatsUsed = data.treatsUsed;
                    this.lastTreatReset = new Date(data.date);
                } else {
                    // Reset for new day
                    this.dailyTreatsUsed = 0;
                    this.lastTreatReset = new Date(today);
                    this.saveDailyData();
                }
            } else {
                this.dailyTreatsUsed = 0;
                this.lastTreatReset = new Date();
                this.saveDailyData();
            }
        } catch (error) {
            console.error('Error loading daily data:', error);
            this.dailyTreatsUsed = 0;
        }
    }

    saveDailyData() {
        try {
            const data = {
                date: new Date().toDateString(),
                treatsUsed: this.dailyTreatsUsed
            };
            this.setCookie(this.dailyLimitCookie, JSON.stringify(data), 1);
        } catch (error) {
            console.error('Error saving daily data:', error);
        }
    }

    loadCollection() {
        try {
            const saved = this.getCookie(this.cookieName);
            if (saved) {
                const collection = JSON.parse(saved);
                this.collectedItems = new Map(Object.entries(collection));
                console.log('Loaded collection:', this.collectedItems.size, 'items');
            } else {
                this.collectedItems = new Map();
                console.log('No saved collection found');
            }
        } catch (error) {
            console.error('Error loading collection:', error);
            this.collectedItems = new Map();
        }
    }

    saveCollection() {
        try {
            const collectionObj = Object.fromEntries(this.collectedItems);
            this.setCookie(this.cookieName, JSON.stringify(collectionObj), 30);
            console.log('Saved collection:', this.collectedItems.size, 'items');
        } catch (error) {
            console.error('Error saving collection:', error);
        }
    }

    // Cookie helpers
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie ? document.cookie.split(';') : [];
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
        }
        return null;
    }

    setupEventListeners() {
        // Game navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                this.switchGame(btn.dataset.game);
            });
        });

        // Trick or Treat button
        const trickOrTreatBtn = document.getElementById('trick-or-treat-btn');
        if (trickOrTreatBtn) {
            trickOrTreatBtn.addEventListener('click', () => {
                this.playTrickOrTreat();
            });
        }

        // Player name change
        const nameInput = document.getElementById('player-name-input');
        const nameChangeBtn = document.getElementById('change-name-btn');
        if (nameInput && nameChangeBtn) {
            nameChangeBtn.addEventListener('click', () => {
                this.changePlayerName(nameInput.value.trim());
            });
        }

        // Debug menu
        const debugBtn = document.getElementById('debug-menu-btn');
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                this.toggleDebugMenu();
            });
        }

        // Item detail views
        document.addEventListener('click', (e) => {
            if (e.target.closest('.collection-item')) {
                const itemElement = e.target.closest('.collection-item');
                const itemId = itemElement.dataset.itemId;
                if (itemId) {
                    this.showItemDetails(itemId);
                }
            }
        });
    }

    switchGame(gameName) {
        this.currentGame = gameName;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.game === gameName);
        });

        // Update game sections
        document.querySelectorAll('.game-section').forEach(section => {
            section.classList.toggle('active', section.id === `${gameName}-game`);
        });

        // Update page title based on game
        const title = gameName === 'roles' ? '👑 Get Those ROLES - XPlay' : '🎃 Halloween Games - XPlay';
        document.title = title;
    }

    playTrickOrTreat() {
        // Check daily limit
        if (this.dailyTreatsUsed >= 3) {
            this.showDailyLimitMessage();
            return;
        }

        const btn = document.getElementById('trick-or-treat-btn');
        const resultDiv = document.getElementById('treat-result');

        if (!btn || !resultDiv) return;

        // Animate button
        btn.classList.add('spinning');
        btn.textContent = '🎲 Getting Treat... 🎲';

        setTimeout(() => {
            const item = this.getRandomItem();
            if (item) {
                this.addToCollection(item);
                this.currentPlayer.totalTreats++;
                this.savePlayerData();

                // Update daily counter
                this.dailyTreatsUsed++;
                this.saveDailyData();
                this.updateDailyCounter();

                // Show result
                resultDiv.innerHTML = `
                    <div class="treat-result-item" style="border-color: ${item.color}">
                        <div class="item-emoji">${item.emoji}</div>
                        <div class="item-details">
                            <div class="item-name">${item.name}</div>
                            <div class="item-rarity ${item.rarity}">${this.capitalizeFirst(item.rarity)}!</div>
                            <div class="item-description">${item.description}</div>
                        </div>
                    </div>
                `;
                resultDiv.classList.add('show');

                // Animate result
                setTimeout(() => {
                    resultDiv.classList.remove('show');
                }, 4000);

                // Update displays
                this.updateCollectionDisplay();
                this.updateTradeSelect();
            }

            // Reset button
            btn.classList.remove('spinning');
            btn.textContent = '🍬 Trick or Treat! 🍬';
        }, 1500);
    }

    showDailyLimitMessage() {
        const resultDiv = document.getElementById('treat-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="daily-limit-message">
                    <div class="limit-emoji">🚫</div>
                    <div class="limit-text">
                        <div class="limit-title">Daily Limit Reached!</div>
                        <div class="limit-desc">You've used all 3 trick-or-treats for today.<br>Come back tomorrow for more spooky items!</div>
                    </div>
                </div>
            `;
            resultDiv.classList.add('show');

            setTimeout(() => {
                resultDiv.classList.remove('show');
            }, 3000);
        }
    }

    getRandomItem() {
        const totalWeight = Object.values(this.rarityWeights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
            random -= weight;
            if (random <= 0) {
                const items = this.items[rarity];
                if (items && items.length > 0) {
                    return items[Math.floor(Math.random() * items.length)];
                }
            }
        }

        return null;
    }

    addToCollection(item) {
        const currentCount = this.collectedItems.get(item.id) || 0;
        this.collectedItems.set(item.id, currentCount + 1);
        this.saveCollection(); // Save immediately when item is added
    }

    updateCollectionDisplay() {
        const grid = document.getElementById('collection-grid');
        if (!grid) return;

        if (this.collectedItems.size === 0) {
            grid.innerHTML = '<p class="empty-collection">No items collected yet. Go trick-or-treating!</p>';
            return;
        }

        let html = '';
        this.collectedItems.forEach((count, itemId) => {
            // Find item data
            let item = null;
            for (const rarityItems of Object.values(this.items)) {
                item = rarityItems.find(i => i.id === itemId);
                if (item) break;
            }

            if (item) {
                html += `
                    <div class="collection-item" data-item-id="${itemId}" style="border-color: ${item.color}; cursor: pointer;">
                        <div class="item-emoji">${item.emoji}</div>
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-count">×${count}</div>
                        </div>
                    </div>
                `;
            }
        });

        grid.innerHTML = html;
    }

    showItemDetails(itemId) {
        let item = null;
        for (const rarityItems of Object.values(this.items)) {
            item = rarityItems.find(i => i.id === itemId);
            if (item) break;
        }

        if (!item) return;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'item-detail-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-item-emoji">${item.emoji}</div>
                    <div class="modal-item-name">${item.name}</div>
                    <div class="modal-item-rarity ${item.rarity}">${this.capitalizeFirst(item.rarity)}</div>
                </div>
                <div class="modal-body">
                    <div class="modal-description">${item.description}</div>
                    <div class="modal-stats">
                        <div class="stat-item">
                            <span class="stat-label">Rarity:</span>
                            <span class="stat-value ${item.rarity}">${this.capitalizeFirst(item.rarity)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">In Collection:</span>
                            <span class="stat-value">×${this.collectedItems.get(itemId) || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Item ID:</span>
                            <span class="stat-value">${itemId}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-close-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    updateTradeSelect() {
        const select = document.getElementById('trade-from');
        if (!select) return;

        // Clear existing options
        select.innerHTML = '<option value="">Select item to trade...</option>';

        if (this.collectedItems.size === 0) return;

        this.collectedItems.forEach((count, itemId) => {
            if (count > 0) {
                // Find item data
                let item = null;
                for (const rarityItems of Object.values(this.items)) {
                    item = rarityItems.find(i => i.id === itemId);
                    if (item) break;
                }

                if (item) {
                    const option = document.createElement('option');
                    option.value = itemId;
                    option.textContent = `${item.emoji} ${item.name} (×${count})`;
                    select.appendChild(option);
                }
            }
        });
    }

    initiateTrade() {
        const select = document.getElementById('trade-from');
        const tradeArea = document.getElementById('trade-area');

        if (!select || !tradeArea) return;

        const itemId = select.value;
        if (!itemId) {
            alert('Please select an item to trade!');
            return;
        }

        // Check if user has the item
        const count = this.collectedItems.get(itemId) || 0;
        if (count <= 0) {
            alert('You don\'t have this item to trade!');
            return;
        }

        // Show trade interface
        const item = this.getItemById(itemId);
        if (item) {
            tradeArea.innerHTML = `
                <div class="trade-interface">
                    <h4>Trading: ${item.emoji} ${item.name}</h4>
                    <div class="trade-offer">
                        <div class="trade-item">
                            <div class="item-emoji">${item.emoji}</div>
                            <div class="item-name">${item.name}</div>
                        </div>
                        <div class="trade-arrow">→</div>
                        <div class="trade-mystery">
                            <div class="mystery-box">🎁</div>
                            <div class="mystery-text">Mystery Item</div>
                        </div>
                    </div>
                    <div class="trade-buttons">
                        <button class="trade-confirm">Confirm Trade</button>
                        <button class="trade-cancel">Cancel</button>
                    </div>
                </div>
            `;
            tradeArea.classList.remove('hidden');

            // Add event listeners for trade buttons
            const confirmBtn = tradeArea.querySelector('.trade-confirm');
            const cancelBtn = tradeArea.querySelector('.trade-cancel');

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.confirmTrade(itemId);
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.cancelTrade();
                });
            }
        }
    }

    confirmTrade(itemId) {
        // Remove one instance of the item
        const currentCount = this.collectedItems.get(itemId) || 0;
        if (currentCount <= 0) {
            alert('You don\'t have this item to trade!');
            return;
        }

        // Get a random item in return
        const newItem = this.getRandomItem();
        if (!newItem) {
            alert('Trade failed - no items available!');
            return;
        }

        // Perform the trade
        this.collectedItems.set(itemId, currentCount - 1);
        this.addToCollection(newItem);
        this.currentPlayer.totalTrades++;
        this.savePlayerData();

        // Save collection after trade
        this.saveCollection();

        // Show result
        const tradeArea = document.getElementById('trade-area');
        if (tradeArea) {
            tradeArea.innerHTML = `
                <div class="trade-result">
                    <h4>Trade Successful!</h4>
                    <div class="trade-summary">
                        <div class="trade-given">
                            <div class="item-emoji">${this.getItemById(itemId).emoji}</div>
                            <div class="trade-text">You gave: ${this.getItemById(itemId).name}</div>
                        </div>
                        <div class="trade-arrow">⇄</div>
                        <div class="trade-received">
                            <div class="item-emoji">${newItem.emoji}</div>
                            <div class="trade-text">You got: ${newItem.name} (${this.capitalizeFirst(newItem.rarity)})</div>
                        </div>
                    </div>
                    <button class="close-trade">Close</button>
                </div>
            `;

            const closeBtn = tradeArea.querySelector('.close-trade');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeTrade();
                });
            }
        }

        // Update displays
        this.updateCollectionDisplay();
        this.updateTradeSelect();
    }

    cancelTrade() {
        const tradeArea = document.getElementById('trade-area');
        if (tradeArea) {
            tradeArea.classList.add('hidden');
            tradeArea.innerHTML = '';
        }
    }

    closeTrade() {
        this.cancelTrade();
    }

    changePlayerName(newName) {
        if (!newName || newName.trim().length < 2) {
            alert('Name must be at least 2 characters long!');
            return;
        }

        if (newName.length > 20) {
            alert('Name cannot be longer than 20 characters!');
            return;
        }

        const oldName = this.currentPlayer.name;
        this.currentPlayer.name = newName.trim();

        // Update in database
        if (this.playersDB[this.currentPlayer.id]) {
            this.playersDB[this.currentPlayer.id].name = newName.trim();
            this.savePlayersData();
        }

        this.savePlayerData();
        this.updatePlayerDisplay();

        // Show success message
        this.showNotification(`Name changed from "${oldName}" to "${newName}"!`, 'success');
    }

    updatePlayerDisplay() {
        const nameDisplay = document.getElementById('current-player-name');
        const nameInput = document.getElementById('player-name-input');

        if (nameDisplay) nameDisplay.textContent = this.currentPlayer.name;
        if (nameInput) nameInput.value = this.currentPlayer.name;
    }

    updateDailyCounter() {
        const counterDisplay = document.getElementById('daily-counter');
        if (counterDisplay) {
            const remaining = Math.max(0, 3 - this.dailyTreatsUsed);
            counterDisplay.textContent = `Treats today: ${this.dailyTreatsUsed}/3 (${remaining} remaining)`;
        }
    }

    getItemById(itemId) {
        for (const rarityItems of Object.values(this.items)) {
            const item = rarityItems.find(i => i.id === itemId);
            if (item) return item;
        }
        return null;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    toggleDebugMenu() {
        let debugModal = document.getElementById('debug-modal');
        if (debugModal) {
            debugModal.remove();
            return;
        }

        // Create debug modal
        debugModal = document.createElement('div');
        debugModal.id = 'debug-modal';
        debugModal.className = 'debug-modal';
        debugModal.innerHTML = `
            <div class="debug-content">
                <div class="debug-header">
                    <h3>🔧 Debug Menu</h3>
                    <button class="debug-close">&times;</button>
                </div>
                <div class="debug-body">
                    <div class="debug-section">
                        <h4>🎃 Trick or Treat</h4>
                        <div class="debug-controls">
                            <button id="add-treat-btn" class="debug-btn">Add 1 Treat</button>
                            <button id="reset-daily-btn" class="debug-btn">Reset Daily Limit</button>
                            <button id="max-treats-btn" class="debug-btn">Set to 3/3</button>
                        </div>
                        <div class="debug-info">
                            <p>Current: <span id="debug-current-treats">${this.dailyTreatsUsed}/3</span></p>
                            <p>Player: <span id="debug-player-name">${this.currentPlayer.name}</span></p>
                            <p>Items Collected: <span id="debug-items-count">${this.collectedItems.size}</span></p>
                        </div>
                    </div>

                    <div class="debug-section">
                        <h4>📊 Player Stats</h4>
                        <div class="debug-controls">
                            <button id="reset-player-btn" class="debug-btn">Reset Player Data</button>
                            <button id="add-random-items-btn" class="debug-btn">Add 5 Random Items</button>
                        </div>
                    </div>

                    <div class="debug-section">
                        <h4>🗂️ Data Management</h4>
                        <div class="debug-controls">
                            <button id="export-data-btn" class="debug-btn">Export All Data</button>
                            <button id="clear-data-btn" class="debug-btn danger">Clear All Data</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(debugModal);

        // Add event listeners
        const closeBtn = debugModal.querySelector('.debug-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                debugModal.remove();
            });
        }

        debugModal.addEventListener('click', (e) => {
            if (e.target === debugModal) {
                debugModal.remove();
            }
        });

        // Debug action listeners
        const addTreatBtn = document.getElementById('add-treat-btn');
        if (addTreatBtn) {
            addTreatBtn.addEventListener('click', () => {
                this.addTreat();
            });
        }

        const resetDailyBtn = document.getElementById('reset-daily-btn');
        if (resetDailyBtn) {
            resetDailyBtn.addEventListener('click', () => {
                this.resetDailyLimit();
            });
        }

        const maxTreatsBtn = document.getElementById('max-treats-btn');
        if (maxTreatsBtn) {
            maxTreatsBtn.addEventListener('click', () => {
                this.setMaxTreats();
            });
        }

        const resetPlayerBtn = document.getElementById('reset-player-btn');
        if (resetPlayerBtn) {
            resetPlayerBtn.addEventListener('click', () => {
                this.resetPlayerData();
            });
        }

        const addRandomItemsBtn = document.getElementById('add-random-items-btn');
        if (addRandomItemsBtn) {
            addRandomItemsBtn.addEventListener('click', () => {
                this.addRandomItems();
            });
        }

        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportDebugData();
            });
        }

        const clearDataBtn = document.getElementById('clear-data-btn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllDebugData();
            });
        }
    }

    addTreat() {
        this.dailyTreatsUsed = Math.min(3, this.dailyTreatsUsed + 1);
        this.saveDailyData();
        this.updateDailyCounter();
        this.updateDebugDisplay();
        this.showNotification(`Added 1 treat! Current: ${this.dailyTreatsUsed}/3`, 'success');
    }

    resetDailyLimit() {
        this.dailyTreatsUsed = 0;
        this.saveDailyData();
        this.updateDailyCounter();
        this.updateDebugDisplay();
        this.showNotification('Daily limit reset to 0/3', 'success');
    }

    setMaxTreats() {
        this.dailyTreatsUsed = 3;
        this.saveDailyData();
        this.updateDailyCounter();
        this.updateDebugDisplay();
        this.showNotification('Set to maximum 3/3 treats', 'success');
    }

    resetPlayerData() {
        if (confirm('Reset all player data? This cannot be undone!')) {
            this.currentPlayer = {
                id: 'player_' + Date.now() + Math.random().toString(36).substr(2, 9),
                name: 'Anonymous Player',
                avatar: '👤',
                joinedAt: Date.now(),
                totalTreats: 0,
                totalTrades: 0
            };
            this.collectedItems.clear();
            this.savePlayerData();
            this.saveCollection();
            this.updatePlayerDisplay();
            this.updateCollectionDisplay();
            this.updateTradeSelect();
            this.updateDebugDisplay();
            this.showNotification('Player data reset!', 'success');
        }
    }

    addRandomItems() {
        for (let i = 0; i < 5; i++) {
            const item = this.getRandomItem();
            if (item) {
                this.addToCollection(item);
            }
        }
        this.updateCollectionDisplay();
        this.updateTradeSelect();
        this.updateDebugDisplay();
        this.showNotification('Added 5 random items to collection!', 'success');
    }

    exportDebugData() {
        const data = {
            player: this.currentPlayer,
            collection: Object.fromEntries(this.collectedItems),
            dailyData: {
                treatsUsed: this.dailyTreatsUsed,
                date: new Date().toDateString()
            },
            itemsData: this.items,
            exportTime: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `halloween-debug-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Debug data exported!', 'success');
    }

    clearAllDebugData() {
        if (confirm('Clear ALL game data? This cannot be undone!')) {
            // Clear cookies
            this.setCookie(this.cookieName, '', -1);
            this.setCookie(this.playerCookieName, '', -1);
            this.setCookie(this.dailyLimitCookie, '', -1);

            // Reset state
            this.currentPlayer = {
                id: 'player_' + Date.now(),
                name: 'Anonymous Player',
                avatar: '👤'
            };
            this.collectedItems.clear();
            this.dailyTreatsUsed = 0;

            this.savePlayerData();
            this.saveCollection();
            this.saveDailyData();
            this.updatePlayerDisplay();
            this.updateCollectionDisplay();
            this.updateTradeSelect();
            this.updateDailyCounter();
            this.updateDebugDisplay();

            this.showNotification('All data cleared!', 'success');
        }
    }

    updateDebugDisplay() {
        const currentTreatsEl = document.getElementById('debug-current-treats');
        const playerNameEl = document.getElementById('debug-player-name');
        const itemsCountEl = document.getElementById('debug-items-count');

        if (currentTreatsEl) currentTreatsEl.textContent = `${this.dailyTreatsUsed}/3`;
        if (playerNameEl) playerNameEl.textContent = this.currentPlayer.name;
        if (itemsCountEl) itemsCountEl.textContent = this.collectedItems.size;
    }

    getFallbackItems() {
        return {
            common: [
                { id: 'candy', name: 'Candy', emoji: '🍬', description: 'Sweet treat', rarity: 'common' }
            ],
            uncommon: [
                { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', description: 'Jack-o-lantern material', rarity: 'uncommon' }
            ],
            rare: [
                { id: 'ghost', name: 'Ghost Figure', emoji: '👻', description: 'Spooky decoration', rarity: 'rare' }
            ],
            epic: [
                { id: 'witch_hat', name: 'Witch Hat', emoji: '🧙‍♀️', description: 'Magical headwear', rarity: 'epic' }
            ],
            legendary: [
                { id: 'treasure', name: 'Cursed Treasure', emoji: '💰', description: 'Pirate gold', rarity: 'legendary' }
            ]
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.halloweenGames = new HalloweenGames();
});
