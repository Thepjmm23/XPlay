// Roles Game System - XPlay
class RolesGame {
    constructor() {
        this.roles = {};
        this.collectedRoles = new Map();
        this.currentGame = 'roles';
        this.cookieName = 'xplay_roles_collection';
        this.playerCookieName = 'xplay_roles_player';
        this.dailyLimitCookie = 'xplay_roles_daily';

        // Player system
        this.currentPlayer = null;
        this.playersDB = {};
        this.dailyRolesUsed = 0;
        this.lastRoleReset = null;

        this.init();
    }

    async init() {
        console.log('Initializing Roles Game...');
        await this.loadRolesData();
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

        console.log('Roles Game initialized successfully');
    }

    async loadRolesData() {
        try {
            const response = await fetch('./Data/roles-data.json');
            const data = await response.json();
            this.roles = data.roles;
            this.rarityWeights = data.rarityWeights;
            this.gameSettings = data.gameSettings;
        } catch (error) {
            console.error('Failed to load roles data:', error);
            this.roles = this.getFallbackRoles();
        }
    }

    async loadPlayersData() {
        try {
            const response = await fetch('./Data/roles-players.json');
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
                    totalRolesGiven: 0,
                    totalTrades: 0,
                    totalPlayers: Object.keys(this.playersDB).length,
                    lastReset: new Date().toISOString()
                }
            };

            // In a real app, this would be sent to a server
            localStorage.setItem('xplay_roles_players', JSON.stringify(data));
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
                    totalRoles: 0,
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
                    this.dailyRolesUsed = data.rolesUsed;
                    this.lastRoleReset = new Date(data.date);
                } else {
                    // Reset for new day
                    this.dailyRolesUsed = 0;
                    this.lastRoleReset = new Date(today);
                    this.saveDailyData();
                }
            } else {
                this.dailyRolesUsed = 0;
                this.lastRoleReset = new Date();
                this.saveDailyData();
            }
        } catch (error) {
            console.error('Error loading daily data:', error);
            this.dailyRolesUsed = 0;
        }
    }

    saveDailyData() {
        try {
            const data = {
                date: new Date().toDateString(),
                rolesUsed: this.dailyRolesUsed
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
                this.collectedRoles = new Map(Object.entries(collection));
                console.log('Loaded roles collection:', this.collectedRoles.size, 'roles');
            } else {
                this.collectedRoles = new Map();
                console.log('No saved roles collection found');
            }
        } catch (error) {
            console.error('Error loading collection:', error);
            this.collectedRoles = new Map();
        }
    }

    saveCollection() {
        try {
            const collectionObj = Object.fromEntries(this.collectedRoles);
            this.setCookie(this.cookieName, JSON.stringify(collectionObj), 30);
            console.log('Saved roles collection:', this.collectedRoles.size, 'roles');
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
        // Get roles button
        const getRolesBtn = document.getElementById('get-roles-btn');
        if (getRolesBtn) {
            getRolesBtn.addEventListener('click', () => {
                this.playGetRoles();
            });
        }

        // Role trading
        const initiateRolesTradeBtn = document.getElementById('initiate-roles-trade');
        if (initiateRolesTradeBtn) {
            initiateRolesTradeBtn.addEventListener('click', () => {
                this.initiateRoleTrade();
            });
        }

        // Role detail views
        document.addEventListener('click', (e) => {
            if (e.target.closest('.roles-collection-item')) {
                const itemElement = e.target.closest('.roles-collection-item');
                const roleId = itemElement.dataset.roleId;
                if (roleId) {
                    this.showRoleDetails(roleId);
                }
            }
        });
    }

    playGetRoles() {
        // Check daily limit
        if (this.dailyRolesUsed >= 2) {
            this.showDailyLimitMessage();
            return;
        }

        const btn = document.getElementById('get-roles-btn');
        const resultDiv = document.getElementById('roles-result');

        if (!btn || !resultDiv) return;

        // Animate button
        btn.classList.add('spinning');
        btn.textContent = '🎲 Getting Role... 🎲';

        setTimeout(() => {
            const role = this.getRandomRole();
            if (role) {
                this.addToCollection(role);
                this.currentPlayer.totalRoles++;
                this.savePlayerData();

                // Update daily counter
                this.dailyRolesUsed++;
                this.saveDailyData();
                this.updateDailyCounter();

                // Show result
                resultDiv.innerHTML = `
                    <div class="treat-result-item" style="border-color: ${role.color}">
                        <div class="item-emoji">${role.emoji}</div>
                        <div class="item-details">
                            <div class="item-name">${role.name}</div>
                            <div class="item-rarity ${role.rarity}">${this.capitalizeFirst(role.rarity)}!</div>
                            <div class="item-description">${role.description}</div>
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
            btn.textContent = '🎲 Get ROLE! 🎲';
        }, 1500);
    }

    showDailyLimitMessage() {
        const resultDiv = document.getElementById('roles-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="daily-limit-message">
                    <div class="limit-emoji">🚫</div>
                    <div class="limit-text">
                        <div class="limit-title">Daily Limit Reached!</div>
                        <div class="limit-desc">You've collected all 2 roles for today.<br>Come back tomorrow for more awesome roles!</div>
                    </div>
                </div>
            `;
            resultDiv.classList.add('show');

            setTimeout(() => {
                resultDiv.classList.remove('show');
            }, 3000);
        }
    }

    getRandomRole() {
        const totalWeight = Object.values(this.rarityWeights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
            random -= weight;
            if (random <= 0) {
                const roles = this.roles[rarity];
                if (roles && roles.length > 0) {
                    return roles[Math.floor(Math.random() * roles.length)];
                }
            }
        }

        return null;
    }

    addToCollection(role) {
        const currentCount = this.collectedRoles.get(role.id) || 0;
        this.collectedRoles.set(role.id, currentCount + 1);
        this.saveCollection(); // Save immediately when role is added
    }

    updateCollectionDisplay() {
        const grid = document.getElementById('roles-collection-grid');
        if (!grid) return;

        if (this.collectedRoles.size === 0) {
            grid.innerHTML = '<p class="empty-collection">No roles collected yet. Go get some roles!</p>';
            return;
        }

        let html = '';
        this.collectedRoles.forEach((count, roleId) => {
            let role = null;
            for (const rarityRoles of Object.values(this.roles)) {
                role = rarityRoles.find(r => r.id === roleId);
                if (role) break;
            }

            if (role) {
                html += `
                    <div class="roles-collection-item" data-role-id="${roleId}" style="border-color: ${role.color}; cursor: pointer;">
                        <div class="item-emoji">${role.emoji}</div>
                        <div class="item-info">
                            <div class="item-name">${role.name}</div>
                            <div class="item-count">×${count}</div>
                        </div>
                    </div>
                `;
            }
        });

        grid.innerHTML = html;
    }

    showRoleDetails(roleId) {
        let role = null;
        for (const rarityRoles of Object.values(this.roles)) {
            role = rarityRoles.find(r => r.id === roleId);
            if (role) break;
        }

        if (!role) return;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'role-detail-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-item-emoji">${role.emoji}</div>
                    <div class="modal-item-name">${role.name}</div>
                    <div class="modal-item-rarity ${role.rarity}">${this.capitalizeFirst(role.rarity)}</div>
                </div>
                <div class="modal-body">
                    <div class="modal-description">${role.description}</div>
                    <div class="modal-stats">
                        <div class="stat-item">
                            <span class="stat-label">Rarity:</span>
                            <span class="stat-value ${role.rarity}">${this.capitalizeFirst(role.rarity)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">In Collection:</span>
                            <span class="stat-value">×${this.collectedRoles.get(roleId) || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Role ID:</span>
                            <span class="stat-value">${roleId}</span>
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
        const select = document.getElementById('roles-trade-from');
        if (!select) return;

        // Clear existing options
        select.innerHTML = '<option value="">Select role to trade...</option>';

        if (this.collectedRoles.size === 0) return;

        this.collectedRoles.forEach((count, roleId) => {
            if (count > 0) {
                let role = null;
                for (const rarityRoles of Object.values(this.roles)) {
                    role = rarityRoles.find(r => r.id === roleId);
                    if (role) break;
                }

                if (role) {
                    const option = document.createElement('option');
                    option.value = roleId;
                    option.textContent = `${role.emoji} ${role.name} (×${count})`;
                    select.appendChild(option);
                }
            }
        });
    }

    initiateRoleTrade() {
        const select = document.getElementById('roles-trade-from');
        const tradeArea = document.getElementById('roles-trade-area');

        if (!select || !tradeArea) return;

        const roleId = select.value;
        if (!roleId) {
            alert('Please select a role to trade!');
            return;
        }

        // Check if user has the role
        const count = this.collectedRoles.get(roleId) || 0;
        if (count <= 0) {
            alert('You don\'t have this role to trade!');
            return;
        }

        // Show trade interface
        const role = this.getRoleById(roleId);
        if (role) {
            tradeArea.innerHTML = `
                <div class="trade-interface">
                    <h4>Trading: ${role.emoji} ${role.name}</h4>
                    <div class="trade-offer">
                        <div class="trade-item">
                            <div class="item-emoji">${role.emoji}</div>
                            <div class="item-name">${role.name}</div>
                        </div>
                        <div class="trade-arrow">→</div>
                        <div class="trade-mystery">
                            <div class="mystery-box">🎁</div>
                            <div class="mystery-text">Mystery Role</div>
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
                    this.confirmRoleTrade(roleId);
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.cancelRoleTrade();
                });
            }
        }
    }

    confirmRoleTrade(roleId) {
        // Remove one instance of the role
        const currentCount = this.collectedRoles.get(roleId) || 0;
        if (currentCount <= 0) {
            alert('You don\'t have this role to trade!');
            return;
        }

        // Get a random role in return
        const newRole = this.getRandomRole();
        if (!newRole) {
            alert('Trade failed - no roles available!');
            return;
        }

        // Perform the trade
        this.collectedRoles.set(roleId, currentCount - 1);
        this.addToCollection(newRole);
        this.currentPlayer.totalTrades++;
        this.savePlayerData();

        // Save collection after trade
        this.saveCollection();

        // Show result
        const tradeArea = document.getElementById('roles-trade-area');
        if (tradeArea) {
            tradeArea.innerHTML = `
                <div class="trade-result">
                    <h4>Trade Successful!</h4>
                    <div class="trade-summary">
                        <div class="trade-given">
                            <div class="item-emoji">${this.getRoleById(roleId).emoji}</div>
                            <div class="trade-text">You gave: ${this.getRoleById(roleId).name}</div>
                        </div>
                        <div class="trade-arrow">⇄</div>
                        <div class="trade-received">
                            <div class="item-emoji">${newRole.emoji}</div>
                            <div class="trade-text">You got: ${newRole.name} (${this.capitalizeFirst(newRole.rarity)})</div>
                        </div>
                    </div>
                    <button class="close-trade">Close</button>
                </div>
            `;

            const closeBtn = tradeArea.querySelector('.close-trade');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeRoleTrade();
                });
            }
        }

        // Update displays
        this.updateCollectionDisplay();
        this.updateTradeSelect();
    }

    cancelRoleTrade() {
        const tradeArea = document.getElementById('roles-trade-area');
        if (tradeArea) {
            tradeArea.classList.add('hidden');
            tradeArea.innerHTML = '';
        }
    }

    closeRoleTrade() {
        this.cancelRoleTrade();
    }

    updatePlayerDisplay() {
        // This is handled by the main HalloweenGames class
    }

    updateDailyCounter() {
        const counterDisplay = document.getElementById('roles-daily-counter');
        if (counterDisplay) {
            const remaining = Math.max(0, 2 - this.dailyRolesUsed);
            counterDisplay.textContent = `Roles today: ${this.dailyRolesUsed}/2 (${remaining} remaining)`;
        }
    }

    getRoleById(roleId) {
        for (const rarityRoles of Object.values(this.roles)) {
            const role = rarityRoles.find(r => r.id === roleId);
            if (role) return role;
        }
        return null;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getFallbackRoles() {
        return {
            common: [
                { id: 'basic', name: 'Basic', emoji: '👤', description: 'Default role', rarity: 'common' }
            ],
            uncommon: [
                { id: 'cool', name: 'Cool', emoji: '😎', description: 'Pretty cool role', rarity: 'uncommon' }
            ],
            rare: [
                { id: 'epic', name: 'Epic', emoji: '🎮', description: 'Epic role', rarity: 'rare' }
            ],
            epic: [
                { id: 'sigma', name: 'Sigma', emoji: '🐺', description: 'Sigma role', rarity: 'epic' }
            ],
            legendary: [
                { id: 'legend', name: 'Legend', emoji: '👑', description: 'Legendary role', rarity: 'legendary' }
            ]
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.rolesGame = new RolesGame();
});
