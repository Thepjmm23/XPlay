// Enhanced Chat System - XPlay (refactored, fixed, and hardened)
class ChatSystem {
    constructor() {
        // Core state
        this.currentUser = null;
        this.currentChannel = 'general';
        this.users = new Map();
        this.messages = new Map();
        this.refreshInterval = null;
        this.lastActivity = Date.now();
        this.loginEvents = new Map(); // Login events tracking

        // Session management
        this.sessionCookieName = 'xplay_chat_session';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

        // Initialize
        this.initializeDefaultMessages();
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateAuthDisplay();
        this.displayMessages();

        // Periodic autosave (optional)
        this.startAutoSave();
    }

    /* ---------------------------
       Cookie helpers / Session
       --------------------------- */
    setCookie(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
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

    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    saveSession(user) {
        if (!user || !user.id) return;
        const sessionData = {
            id: user.id,
            username: user.username,
            avatar: user.avatar || '👤',
            loginTime: Date.now()
        };
        this.setCookie(this.sessionCookieName, JSON.stringify(sessionData), 7);
    }

    loadSession() {
        const sessionData = this.getCookie(this.sessionCookieName);
        if (!sessionData) return null;
        try {
            const session = JSON.parse(sessionData);
            const sessionAge = Date.now() - (session.loginTime || 0);
            if (sessionAge < this.sessionTimeout) {
                return session;
            } else {
                this.deleteCookie(this.sessionCookieName);
                return null;
            }
        } catch (error) {
            console.error('Error parsing session cookie:', error);
            this.deleteCookie(this.sessionCookieName);
            return null;
        }
    }

    clearSession() {
        this.deleteCookie(this.sessionCookieName);
    }

    /* ---------------------------
       Event listeners (defensive)
       --------------------------- */
    setupEventListeners() {
        // Channel switching
        document.querySelectorAll('.channel-item').forEach(channelEl => {
            channelEl.addEventListener('click', () => {
                this.switchChannel(channelEl.dataset.channel);
            });
        });

        // Auth toggle
        const authToggle = document.getElementById('auth-toggle');
        if (authToggle) authToggle.addEventListener('click', () => this.showAuthModal());

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.tab));
        });

        // Sign in / Sign up submissions
        const signinSubmit = document.getElementById('signin-submit');
        if (signinSubmit) signinSubmit.addEventListener('click', () => this.handleSignIn());

        const signupSubmit = document.getElementById('signup-submit');
        if (signupSubmit) signupSubmit.addEventListener('click', () => this.handleSignUp());

        // Message input + send
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        // Activity tracking (passive)
        ['mousedown', 'mousemove', 'keypress', 'scroll'].forEach(evt => {
            document.addEventListener(evt, () => { this.lastActivity = Date.now(); }, { passive: true });
        });

        // Auth modal close
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideAuthModal();
        });

        // Debug controls
        const debugMenu = document.getElementById('debug-menu');
        if (debugMenu) debugMenu.addEventListener('click', () => this.showDebugModal());

        const debugClose = document.getElementById('debug-close');
        if (debugClose) debugClose.addEventListener('click', () => this.hideDebugModal());

        document.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchDebugTab(tab.dataset.tab));
        });

        const deleteAllBtn = document.getElementById('delete-all-messages');
        if (deleteAllBtn) deleteAllBtn.addEventListener('click', () => this.deleteAllMessages());

        const refreshMessagesBtn = document.getElementById('refresh-messages');
        if (refreshMessagesBtn) refreshMessagesBtn.addEventListener('click', () => this.refreshDebugDisplay());

        const refreshUsersBtn = document.getElementById('refresh-users');
        if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', () => this.refreshDebugUsers());

        const kickBtn = document.getElementById('kick-user');
        if (kickBtn) kickBtn.addEventListener('click', () => this.kickUser());

        const banBtn = document.getElementById('ban-user');
        if (banBtn) banBtn.addEventListener('click', () => this.banUser());

        const clearStorageBtn = document.getElementById('clear-storage');
        if (clearStorageBtn) clearStorageBtn.addEventListener('click', () => this.clearAllData());

        const exportBtn = document.getElementById('export-data');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());

        const resetSessionBtn = document.getElementById('reset-session');
        if (resetSessionBtn) resetSessionBtn.addEventListener('click', () => this.resetSession());

        // Close debug modal clicking outside
        const debugModal = document.getElementById('debug-modal');
        if (debugModal) debugModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideDebugModal();
        });
    }

    /* ---------------------------
       Storage / Loading
       --------------------------- */
    loadFromStorage() {
        try {
            // Load current user from cookie session
            const session = this.loadSession();
            const usernamesData = this.loadUsernamesData();

            if (session && usernamesData.usernames && usernamesData.usernames[session.id]) {
                // Use the canonical user data from storage and update lastSeen if missing
                const storedUser = usernamesData.usernames[session.id];
                storedUser.lastSeen = storedUser.lastSeen || Date.now();
                this.currentUser = {
                    id: session.id,
                    username: storedUser.username || session.username,
                    avatar: storedUser.avatar || session.avatar || '👤',
                    loginTime: session.loginTime || Date.now()
                };
                // Ensure users map has entry
                this.users.set(session.id, storedUser);
            } else {
                // If session is there but user no longer exists, clear session
                if (session && (!usernamesData.usernames || !usernamesData.usernames[session.id])) {
                    this.clearSession();
                }
                this.currentUser = null;
            }

            // Load messages
            const messagesData = localStorage.getItem('xplay_chat_messages');
            if (messagesData) {
                const parsed = JSON.parse(messagesData);
                // parsed is object: channel -> array
                this.messages = new Map(Object.entries(parsed));
            } else {
                this.initializeDefaultMessages();
            }

            // Load usernames (with migration support)
            let loadedUsernamesData = usernamesData;
            const oldUsersData = localStorage.getItem('xplay_chat_users');
            if (oldUsersData && (!loadedUsernamesData.usernames || Object.keys(loadedUsernamesData.usernames).length === 0)) {
                const oldUsers = JSON.parse(oldUsersData);
                loadedUsernamesData = {
                    usernames: oldUsers,
                    metadata: { migrated: true, migratedAt: Date.now(), originalFormat: 'localStorage_users' }
                };
                this.saveUsernamesData(loadedUsernamesData);
                console.log('Migrated user data from old format to new JSON format');
            }

            // Populate this.users map
            this.users = new Map(Object.entries(loadedUsernamesData.usernames || {}));

            // Load login events
            const loginEventsData = localStorage.getItem('xplay_chat_login_events');
            if (loginEventsData) {
                this.loginEvents = new Map(Object.entries(JSON.parse(loginEventsData)));
            } else {
                this.loginEvents = new Map();
            }
        } catch (error) {
            console.error('Error loading chat data:', error);
            this.initializeDefaultMessages();
            this.users = new Map();
            this.loginEvents = new Map();
        }
    }

    loadUsernamesData() {
        try {
            const data = localStorage.getItem('xplay_chat_usernames');
            return data ? JSON.parse(data) : { usernames: {} };
        } catch (error) {
            console.error('Error loading usernames data:', error);
            return { usernames: {} };
        }
    }

    saveUsernamesData(data) {
        try {
            localStorage.setItem('xplay_chat_usernames', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving usernames data:', error);
        }
    }

    initializeDefaultMessages() {
        // only set if empty
        if (!this.messages || this.messages.size === 0) {
            this.messages = new Map([
                ['general', []],
                ['off-topic', []],
                ['random', []],
                ['games', []]
            ]);
        }
    }

    saveToStorage() {
        try {
            if (this.currentUser) this.saveSession(this.currentUser);

            localStorage.setItem('xplay_chat_messages', JSON.stringify(Object.fromEntries(this.messages)));

            const usernamesData = this.loadUsernamesData();
            usernamesData.usernames = Object.fromEntries(this.users);
            this.saveUsernamesData(usernamesData);

            localStorage.setItem('xplay_chat_login_events', JSON.stringify(Object.fromEntries(this.loginEvents)));
        } catch (error) {
            console.error('Error saving chat data:', error);
        }
    }

    startAutoSave(interval = 5000) {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => this.saveToStorage(), interval);
    }

    stopAutoSave() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /* ---------------------------
       Channels & Messages
       --------------------------- */
    switchChannel(channelName) {
        this.currentChannel = channelName;
        document.querySelectorAll('.channel-item').forEach(channel => {
            channel.classList.toggle('active', channel.dataset.channel === channelName);
        });
        const currentChannelEl = document.getElementById('current-channel');
        if (currentChannelEl) currentChannelEl.textContent = channelName;
        this.displayMessages();
    }

    displayMessages() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const messages = this.messages.get(this.currentChannel) || [];
        if (!messages || messages.length === 0) {
            container.innerHTML = `<div class="message-system">
                Welcome to #${this.sanitizeHtml(this.currentChannel)}! Be respectful and have fun! 🎉
            </div>`;
            container.scrollTop = container.scrollHeight;
            return;
        }

        container.innerHTML = messages.map(msg => this.formatMessage(msg)).join('');
        container.scrollTop = container.scrollHeight;
    }

    formatMessage(message) {
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (message.type === 'system') {
            return `<div class="message-system">${this.sanitizeHtml(message.content)}</div>`;
        }

        const author = message.user?.username || 'Unknown';
        const avatar = message.user?.avatar || '👤';

        return `<div class="message">
            <div class="message-avatar">${this.sanitizeHtml(avatar)}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${this.sanitizeHtml(author)}</span>
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-text">${this.sanitizeHtml(message.content)}</div>
            </div>
        </div>`;
    }

    sendMessage() {
        if (!this.currentUser) {
            this.showAuthModal();
            return;
        }

        const input = document.getElementById('message-input');
        if (!input) return;
        const content = input.value.trim();
        if (!content) return;

        const message = {
            id: Date.now() + Math.random(),
            type: 'user',
            user: {
                id: this.currentUser.id,
                username: this.currentUser.username,
                avatar: this.currentUser.avatar || '👤'
            },
            content,
            timestamp: Date.now(),
            channel: this.currentChannel
        };

        if (!this.messages.has(this.currentChannel)) this.messages.set(this.currentChannel, []);
        this.messages.get(this.currentChannel).push(message);
        this.saveToStorage();
        input.value = '';
        this.displayMessages();
        this.updateLastSeen(this.currentUser.id);
    }

    updateLastSeen(userId) {
        if (!userId) return;
        const usernamesData = this.loadUsernamesData();
        const users = usernamesData.usernames || {};

        if (users[userId]) {
            users[userId].lastSeen = Date.now();
            this.users.set(userId, users[userId]);
            usernamesData.usernames = Object.fromEntries(this.users);
            this.saveUsernamesData(usernamesData);
            this.saveToStorage();
        }
    }

    /* ---------------------------
       Auth (sign in / sign up)
       --------------------------- */
    handleSignIn() {
        const username = (document.getElementById('signin-username')?.value || '').trim();
        const password = document.getElementById('signin-password')?.value || '';
        const errorEl = document.getElementById('signin-error');

        if (errorEl) errorEl.textContent = '';

        if (!username || !password) {
            if (errorEl) errorEl.textContent = 'Please enter both username and password';
            return;
        }

        if (username.length < 3) {
            if (errorEl) errorEl.textContent = 'Username must be at least 3 characters';
            return;
        }

        const usernamesData = this.loadUsernamesData();
        const users = usernamesData.usernames || {};
        const userKey = Object.keys(users).find(id => users[id].username === username);

        if (!userKey) {
            if (errorEl) errorEl.textContent = 'Username not found';
            return;
        }

        const user = users[userKey];
        const hashedPassword = this.hashPassword(password);

        if (user.password !== hashedPassword && user.password !== this.oldHashPassword(password)) {
            if (errorEl) errorEl.textContent = 'Invalid password';
            return;
        }

        // Upgrade old hash if necessary
        if (user.password === this.oldHashPassword(password)) {
            user.password = hashedPassword;
            users[userKey] = user;
            usernamesData.usernames = users;
            this.saveUsernamesData(usernamesData);
        }

        // Set currentUser and ensure lastSeen
        user.lastSeen = Date.now();
        this.users.set(userKey, user);

        this.currentUser = {
            id: userKey,
            username: user.username,
            avatar: user.avatar || '👤',
            loginTime: Date.now()
        };

        // Record login event
        this.recordLoginEvent(userKey, user.username, 'login');

        this.saveToStorage();
        this.updateAuthDisplay();
        this.hideAuthModal();
        this.addSystemMessage(`${this.sanitizeHtml(user.username)} joined the chat!`);

        // Update online users and show welcome
        this.updateOnlineUsers();
        setTimeout(() => {
            if (this.currentChannel === 'general') {
                this.addSystemMessage(`Welcome back, ${this.sanitizeHtml(user.username)}! 🎉`);
            }
        }, 800);
    }

    oldHashPassword(password) {
        // Legacy simple hash (kept for backwards compatibility)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    handleSignUp() {
        const username = (document.getElementById('signup-username')?.value || '').trim();
        const password = document.getElementById('signup-password')?.value || '';
        const confirmPassword = document.getElementById('signup-confirm')?.value || '';
        const errorEl = document.getElementById('signup-error');

        if (errorEl) errorEl.textContent = '';

        if (!username || !password || !confirmPassword) {
            if (errorEl) errorEl.textContent = 'Please fill in all fields';
            return;
        }
        if (username.length < 3) {
            if (errorEl) errorEl.textContent = 'Username must be at least 3 characters';
            return;
        }
        if (password.length < 8) {
            if (errorEl) errorEl.textContent = 'Password must be at least 8 characters';
            return;
        }
        if (password !== confirmPassword) {
            if (errorEl) errorEl.textContent = 'Passwords do not match';
            return;
        }

        const usernamesData = this.loadUsernamesData();
        const users = usernamesData.usernames || {};

        if (Object.values(users).some(u => u.username === username)) {
            if (errorEl) errorEl.textContent = 'Username already exists';
            return;
        }

        const userId = 'user_' + Date.now();
        const newUser = {
            id: userId,
            username,
            password: this.hashPassword(password),
            avatar: '👤',
            createdAt: Date.now(),
            lastSeen: Date.now()
        };

        users[userId] = newUser;
        usernamesData.usernames = users;
        this.saveUsernamesData(usernamesData);

        this.users.set(userId, newUser);
        this.currentUser = { id: userId, username, avatar: '👤', loginTime: Date.now() };

        // Record login event
        this.recordLoginEvent(userId, username, 'login');

        this.saveToStorage();
        this.updateAuthDisplay();
        this.hideAuthModal();
        this.addSystemMessage(`${this.sanitizeHtml(username)} joined the chat! Welcome! 🎉`);
    }

    hashPassword(password) {
        // Simple salted hash (not production-grade). For production use a proper KDF and server-side storage.
        let hash = 0;
        const salt = 'xplay_chat_salt_2024';
        const salted = `${password}${salt}`;
        for (let i = 0; i < salted.length; i++) {
            const char = salted.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit
        }
        return Math.abs(hash).toString(36);
    }

    showAuthModal() { document.getElementById('auth-modal')?.classList.add('show'); }
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.remove('show');
        const signinErr = document.getElementById('signin-error');
        const signupErr = document.getElementById('signup-error');
        if (signinErr) signinErr.textContent = '';
        if (signupErr) signupErr.textContent = '';
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.toggle('active', form.id === `${tab}-form`));
    }

    updateAuthDisplay() {
        const userNameEl = document.getElementById('current-user-name');
        const userStatusEl = document.getElementById('current-user-status');
        const userAvatarEl = document.getElementById('user-avatar');
        const authButton = document.getElementById('auth-toggle');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        if (this.currentUser) {
            if (userNameEl) userNameEl.textContent = this.currentUser.username;
            if (userStatusEl) userStatusEl.textContent = 'Online';
            if (userAvatarEl) userAvatarEl.textContent = this.currentUser.avatar || '👤';
            if (authButton) authButton.textContent = 'Sign Out';
            if (messageInput) messageInput.disabled = false;
            if (sendButton) sendButton.disabled = false;

            // Replace handler safely
            if (authButton) {
                const newBtn = authButton.cloneNode(true);
                authButton.parentNode.replaceChild(newBtn, authButton);
                newBtn.addEventListener('click', () => this.signOut());
            }
        } else {
            if (userNameEl) userNameEl.textContent = 'Guest User';
            if (userStatusEl) userStatusEl.textContent = 'Not signed in';
            if (userAvatarEl) userAvatarEl.textContent = '👤';
            if (authButton) authButton.textContent = 'Sign In / Register';
            if (messageInput) messageInput.disabled = true;
            if (sendButton) sendButton.disabled = true;

            if (authButton) {
                const newBtn = authButton.cloneNode(true);
                authButton.parentNode.replaceChild(newBtn, authButton);
                newBtn.addEventListener('click', () => this.showAuthModal());
            }
        }
    }

    signOut() {
        if (this.currentUser) {
            this.recordLoginEvent(this.currentUser.id, this.currentUser.username, 'logout');
            this.addSystemMessage(`${this.sanitizeHtml(this.currentUser.username)} left the chat`);
        }
        this.currentUser = null;
        this.clearSession();
        this.saveToStorage();
        this.updateAuthDisplay();
    }

    recordLoginEvent(userId, username, eventType) {
        if (!userId) return;
        if (!this.loginEvents.has(userId)) this.loginEvents.set(userId, []);
        const event = {
            id: Date.now() + Math.random(),
            username,
            type: eventType,
            timestamp: Date.now(),
            channel: this.currentChannel
        };
        const arr = this.loginEvents.get(userId);
        arr.push(event);
        // keep last 50
        if (arr.length > 50) this.loginEvents.set(userId, arr.slice(-50));
        else this.loginEvents.set(userId, arr);
    }

    addSystemMessage(content) {
        const message = {
            id: Date.now() + Math.random(),
            type: 'system',
            content,
            timestamp: Date.now(),
            channel: this.currentChannel
        };
        if (!this.messages.has(this.currentChannel)) this.messages.set(this.currentChannel, []);
        this.messages.get(this.currentChannel).push(message);
        this.saveToStorage();
        this.displayMessages();
    }

    /* ---------------------------
       Online Users / Debugging
       --------------------------- */
    updateOnlineUsers() {
        const onlineContainer = document.getElementById('online-users');
        const onlineHeader = document.querySelector('.online-header h3');
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        const onlineUsers = [];

        this.users.forEach((userData, userId) => {
            if ((userData.lastSeen || 0) > fiveMinutesAgo) {
                onlineUsers.push({ id: userId, username: userData.username, avatar: userData.avatar });
            }
        });

        if (onlineHeader) onlineHeader.textContent = `ONLINE — ${onlineUsers.length}`;
        if (!onlineContainer) return;

        if (onlineUsers.length === 0) {
            onlineContainer.innerHTML = '<div class="no-online">No users online</div>';
        } else {
            onlineContainer.innerHTML = onlineUsers.map(user => `
                <div class="online-user">
                    <div class="user-avatar">${this.sanitizeHtml(user.avatar || '👤')}</div>
                    <div class="user-details">
                        <div class="user-name">${this.sanitizeHtml(user.username)}</div>
                        <div class="user-status">Online</div>
                    </div>
                </div>
            `).join('');
        }
    }

    sanitizeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showDebugModal() {
        document.getElementById('debug-modal')?.classList.add('show');
        this.refreshDebugDisplay();
        this.refreshDebugUsers();
        this.updateDebugInfo();
        this.refreshLoginHistory();
    }

    hideDebugModal() {
        document.getElementById('debug-modal')?.classList.remove('show');
    }

    switchDebugTab(tab) {
        document.querySelectorAll('.debug-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        document.querySelectorAll('.debug-tab-content').forEach(content => content.classList.toggle('active', content.id === `debug-${tab}`));
    }

    deleteAllMessages() {
        if (!confirm('Are you sure you want to delete ALL messages? This cannot be undone!')) return;
        this.messages.clear();
        // re-init default channels
        this.initializeDefaultMessages();
        this.saveToStorage();
        this.displayMessages();
        this.refreshDebugDisplay();
        this.addSystemMessage('All messages have been deleted by an admin');
    }

    refreshDebugDisplay() {
        const container = document.getElementById('debug-messages-list');
        if (!container) return;
        const messages = this.messages.get(this.currentChannel) || [];
        const recentMessages = messages.slice(-10);
        container.innerHTML = recentMessages.map(msg => `
            <div class="debug-message-item">
                <strong>${this.sanitizeHtml(msg.user?.username || 'system')}:</strong> ${this.sanitizeHtml((msg.content || '').toString().substring(0, 50))}${(msg.content || '').toString().length > 50 ? '...' : ''}
                <div class="debug-message-content">${new Date(msg.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }

    refreshDebugUsers() {
        const container = document.getElementById('debug-users-list');
        const userSelect = document.getElementById('debug-user-select');
        if (!container || !userSelect) return;

        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        userSelect.innerHTML = '<option value="">Select User...</option>';

        const onlineUsers = [];
        this.users.forEach((userData, userId) => {
            if ((userData.lastSeen || 0) > fiveMinutesAgo) {
                onlineUsers.push({ id: userId, username: userData.username, avatar: userData.avatar, lastSeen: userData.lastSeen });
                const option = document.createElement('option');
                option.value = userId;
                option.textContent = userData.username;
                userSelect.appendChild(option);
            }
        });

        container.innerHTML = onlineUsers.map(user => `
            <div class="debug-user-item">
                <strong>${this.sanitizeHtml(user.username)}</strong>
                <div class="debug-message-content">Last seen: ${new Date(user.lastSeen).toLocaleString()}</div>
            </div>
        `).join('');
    }

    kickUser() {
        const userSelect = document.getElementById('debug-user-select');
        if (!userSelect) { alert('Debug user select not found'); return; }
        const userId = userSelect.value;
        if (!userId) { alert('Please select a user to kick'); return; }
        if (userId === this.currentUser?.id) { alert('You cannot kick yourself!'); return; }

        const usernamesData = this.loadUsernamesData();
        const users = usernamesData.usernames || {};
        const user = users[userId];
        if (!user) { alert('User not found'); return; }

        if (!confirm(`Are you sure you want to kick ${user.username}? They will be disconnected.`)) return;

        // For client-only: set lastSeen to 0 so they appear offline
        users[userId].lastSeen = 0;
        usernamesData.usernames = users;
        this.saveUsernamesData(usernamesData);

        this.users.set(userId, users[userId]);
        this.refreshDebugUsers();
        this.updateOnlineUsers();
        this.addSystemMessage(`${this.sanitizeHtml(user.username)} has been kicked by an admin`);
    }

    banUser() {
        const userSelect = document.getElementById('debug-user-select');
        if (!userSelect) { alert('Debug user select not found'); return; }
        const userId = userSelect.value;
        if (!userId) { alert('Please select a user to ban'); return; }
        if (userId === this.currentUser?.id) { alert('You cannot ban yourself!'); return; }

        const usernamesData = this.loadUsernamesData();
        const users = usernamesData.usernames || {};
        const user = users[userId];
        if (!user) { alert('User not found'); return; }

        if (!confirm(`Are you sure you want to BAN ${user.username}? This will permanently delete their account and all their data!`)) return;

        // Delete user account and their messages
        delete users[userId];
        usernamesData.usernames = users;
        this.saveUsernamesData(usernamesData);

        this.messages.forEach((channelMessages, channel) => {
            this.messages.set(channel, channelMessages.filter(msg => msg.user?.id !== userId));
        });

        this.saveToStorage();
        this.displayMessages();
        this.refreshDebugUsers();
        this.updateOnlineUsers();
        this.addSystemMessage(`${this.sanitizeHtml(user.username)} has been banned by an admin`);
    }

    clearAllData() {
        if (!confirm('Are you sure you want to clear ALL chat data? This cannot be undone!')) return;
        this.clearSession();
        localStorage.removeItem('xplay_chat_messages');
        localStorage.removeItem('xplay_chat_usernames');
        localStorage.removeItem('xplay_chat_login_events');

        this.currentUser = null;
        this.messages.clear();
        this.users.clear();
        this.loginEvents.clear();
        this.initializeDefaultMessages();

        this.updateAuthDisplay();
        this.updateOnlineUsers();
        this.displayMessages();
        this.hideDebugModal();

        alert('All data has been cleared. Please refresh the page.');
    }

    exportData() {
        const data = {
            messages: Object.fromEntries(this.messages),
            usernames: Object.fromEntries(this.users),
            loginEvents: Object.fromEntries(this.loginEvents),
            currentUser: this.currentUser,
            exportTime: Date.now()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xplay-chat-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetSession() {
        if (!confirm('Reset your current session? You will stay logged in but activity timers will reset.')) return;
        this.lastActivity = Date.now();
        if (this.currentUser) this.updateLastSeen(this.currentUser.id);
        this.updateDebugInfo();
    }

    updateDebugInfo() {
        const currentUserEl = document.getElementById('debug-current-user');
        const currentChannelEl = document.getElementById('debug-current-channel');
        const totalMessagesEl = document.getElementById('debug-total-messages');
        const totalUsersEl = document.getElementById('debug-total-users');
        const sessionTimeEl = document.getElementById('debug-session-time');

        if (currentUserEl) currentUserEl.textContent = this.currentUser ? this.currentUser.username : 'Not logged in';
        if (currentChannelEl) currentChannelEl.textContent = this.currentChannel;

        let totalMessages = 0;
        this.messages.forEach(channelMessages => { totalMessages += (channelMessages?.length || 0); });
        if (totalMessagesEl) totalMessagesEl.textContent = totalMessages.toString();

        if (totalUsersEl) totalUsersEl.textContent = this.users.size.toString();

        if (sessionTimeEl) {
            if (this.currentUser && this.currentUser.loginTime) {
                const sessionTime = Date.now() - this.currentUser.loginTime;
                const minutes = Math.floor(sessionTime / 60000);
                const seconds = Math.floor((sessionTime % 60000) / 1000);
                sessionTimeEl.textContent = `${minutes}m ${seconds}s`;
            } else {
                sessionTimeEl.textContent = '0m 0s';
            }
        }
    }

    refreshLoginHistory() {
        const container = document.getElementById('debug-login-history');
        if (!container) return;

        const allEvents = [];
        this.loginEvents.forEach((userEvents, userId) => {
            (userEvents || []).forEach(event => {
                allEvents.push({ ...event, userId });
            });
        });

        allEvents.sort((a, b) => b.timestamp - a.timestamp);
        const recentEvents = allEvents.slice(0, 20);

        if (recentEvents.length === 0) {
            container.innerHTML = '<div class="debug-message-content">No login events recorded yet</div>';
            return;
        }

        container.innerHTML = recentEvents.map(event => `
            <div class="debug-login-event ${event.type}">
                <strong>${this.sanitizeHtml(event.username)}</strong> ${event.type === 'login' ? 'logged in' : 'logged out'}
                <div class="debug-login-event-content">${new Date(event.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }
}

/* Initialize chat system when DOM is ready */
document.addEventListener('DOMContentLoaded', () => {
    window.chatSystem = new ChatSystem();
});
