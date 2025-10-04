class ErrorHandler {
    constructor() {
        this.errorDefinitions = {};
        this.currentError = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isRetrying = false;
        this.retryTimer = null;
        this.checkInterval = null;

        // Game loading tracking
        this.gameLoadStartTime = null;
        this.gameLoadTimeout = 15000; // 15 seconds for game loading
        this.gameLoadAttempts = 0;
        this.maxGameLoadAttempts = 1; // Only show error once per game
        this.gameCurrentlyLoading = false;

        this.init();
    }

    async init() {
        await this.loadErrorDefinitions();
        this.setupEventListeners();
        this.startMonitoring();
    }

    async loadErrorDefinitions() {
        try {
            const response = await fetch('./Data/error-definitions.json');
            const data = await response.json();
            this.errorDefinitions = data.errorDefinitions;
            this.maxRetries = data.detectionSettings.maxRetries;
        } catch (error) {
            console.error('Failed to load error definitions:', error);
            this.errorDefinitions = this.getDefaultErrorDefinitions();
        }
    }

    getDefaultErrorDefinitions() {
        return {
            'server-offline': {
                title: 'Server Offline',
                message: 'The server is currently unavailable.',
                icon: '🔌',
                severity: 'high'
            },
            'no-internet': {
                title: 'No Internet Connection',
                message: 'Unable to connect to the internet.',
                icon: '📡',
                severity: 'high'
            }
        };
    }

    setupEventListeners() {
        // Retry button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-retry' || e.target.closest('#btn-retry')) {
                this.handleRetry();
            }
        });

        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-close' || e.target.closest('#btn-close')) {
                this.hideError();
            }
        });

        // Alternative action button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-alt' || e.target.closest('#btn-alt')) {
                this.handleAlternativeAction();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentError) {
                this.hideError();
            }
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (this.currentError && e.target.id === 'error-overlay') {
                this.hideError();
            }
        });
    }

    startMonitoring() {
        // Check for errors every 5 seconds
        this.checkInterval = setInterval(() => {
            this.detectErrors();
        }, 5000);

        // Also check immediately
        this.detectErrors();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async detectErrors() {
        const errors = await this.checkForErrors();

        if (errors.length > 0) {
            // Show the highest priority error
            const highestPriorityError = this.getHighestPriorityError(errors);
            if (highestPriorityError && highestPriorityError !== this.currentError) {
                this.showError(highestPriorityError);
            }
        } else if (this.currentError && !this.isRetrying) {
            // No errors detected, hide current error if not retrying
            this.hideError();
            // Reset game loading tracking when errors are cleared
            this.resetGameLoadTracking();
        }
    }

    resetGameLoadTracking() {
        this.gameCurrentlyLoading = false;
        this.gameLoadAttempts = 0;
    }

    async checkForErrors() {
        const errors = [];

        // Check internet connectivity
        if (!(await this.isOnline())) {
            errors.push('no-internet');
        }

        // Check server connectivity
        if (await this.isServerOffline()) {
            errors.push('server-offline');
        }

        // Check for blocked content
        if (await this.isContentBlocked()) {
            errors.push('blocked-content');
        }

        // Check for browser compatibility issues
        if (this.hasBrowserCompatibilityIssues()) {
            errors.push('browser-compatibility');
        }

        // Check for game loading issues
        if (await this.areGamesNotLoading()) {
            errors.push('games-not-loading');
        }

        // Check for server errors (5xx responses)
        if (await this.hasServerErrors()) {
            errors.push('server-error');
        }

        return errors;
    }

    async isOnline() {
        try {
            // Try to fetch a small image or use navigator.onLine
            if (!navigator.onLine) return false;

            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async isServerOffline() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(window.location.origin, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            return !response.ok;
        } catch (error) {
            return true;
        }
    }

    async isContentBlocked() {
        // Check if we're getting access denied or forbidden responses
        try {
            const response = await fetch(window.location.href, {
                method: 'GET',
                cache: 'no-cache'
            });

            return response.status === 403 || response.status === 401;
        } catch (error) {
            return false;
        }
    }

    hasBrowserCompatibilityIssues() {
        // Check for common compatibility issues
        const userAgent = navigator.userAgent.toLowerCase();

        // Check for very old browsers
        if (userAgent.includes('msie') && !userAgent.includes('trident')) {
            return true; // Old IE
        }

        // Check for missing features
        if (!window.WebGLRenderingContext && !window.fetch) {
            return true; // Very outdated browser
        }

        return false;
    }

    async areGamesNotLoading() {
        const gameFrame = document.getElementById('game-frame');

        if (!gameFrame || !gameFrame.src) {
            return false; // No game to load
        }

        // Check if we should start tracking a new game load
        if (!this.gameCurrentlyLoading && gameFrame.src) {
            this.startGameLoadTracking();
        }

        // If we're currently tracking a game load
        if (this.gameCurrentlyLoading) {
            const timeElapsed = Date.now() - this.gameLoadStartTime;

            // Check if game has actually loaded successfully
            if (this.hasGameLoaded(gameFrame)) {
                this.gameCurrentlyLoading = false;
                return false; // Game loaded successfully
            }

            // Check if game has failed to load
            if (this.hasGameFailed(gameFrame) || timeElapsed > this.gameLoadTimeout) {
                this.gameCurrentlyLoading = false;
                this.gameLoadAttempts++;

                // Only show error if we haven't exceeded max attempts
                if (this.gameLoadAttempts <= this.maxGameLoadAttempts) {
                    return true; // Show error once
                }
            }

            // Still loading, don't show error yet
            return false;
        }

        return false;
    }

    startGameLoadTracking() {
        this.gameCurrentlyLoading = true;
        this.gameLoadStartTime = Date.now();
        this.gameLoadAttempts = 0;
    }

    hasGameLoaded(gameFrame) {
        // Check if iframe has loaded content
        try {
            // If iframe has contentWindow and document, it's likely loaded
            if (gameFrame.contentWindow && gameFrame.contentWindow.document) {
                const doc = gameFrame.contentWindow.document;
                // Check if document has actual content (not just empty body)
                return doc.body && doc.body.innerHTML.trim() !== '' && doc.body.innerHTML !== '<pre></pre>';
            }
        } catch (e) {
            // Cross-origin restrictions might prevent access, but if we get here, it's likely loaded
            return gameFrame.contentWindow !== null;
        }

        return false;
    }

    hasGameFailed(gameFrame) {
        // Check for actual error indicators in the iframe
        try {
            if (gameFrame.contentWindow && gameFrame.contentWindow.document) {
                const doc = gameFrame.contentWindow.document;
                const textContent = doc.body ? doc.body.textContent.toLowerCase() : '';

                const errorTexts = ['error', 'failed', 'unable to load', 'connection failed', 'network error', 'forbidden', 'not found'];
                if (errorTexts.some(errorText => textContent.includes(errorText))) {
                    return true;
                }

                // Check for error status codes in the URL or content
                if (textContent.includes('404') || textContent.includes('500') || textContent.includes('403')) {
                    return true;
                }
            }
        } catch (e) {
            // If we can't access the content, assume it's not an error
        }

        return false;
    }

    async hasServerErrors() {
        try {
            const response = await fetch(window.location.href, {
                method: 'GET',
                cache: 'no-cache'
            });

            return response.status >= 500;
        } catch (error) {
            return false;
        }
    }

    getHighestPriorityError(errors) {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        let highestPriority = null;
        let highestPriorityLevel = 0;

        for (const errorId of errors) {
            const error = this.errorDefinitions[errorId];
            if (error && priorityOrder[error.severity] > highestPriorityLevel) {
                highestPriority = errorId;
                highestPriorityLevel = priorityOrder[error.severity];
            }
        }

        return highestPriority;
    }

    showError(errorId) {
        const error = this.errorDefinitions[errorId];
        if (!error) return;

        this.currentError = errorId;
        this.retryCount = 0;

        // Update modal content
        document.getElementById('error-icon').textContent = error.icon;
        document.getElementById('error-title').textContent = error.title;
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-id').textContent = errorId;

        // Update suggestions
        const suggestionsList = document.getElementById('error-suggestions');
        suggestionsList.innerHTML = '';
        if (error.suggestions) {
            for (const suggestion of error.suggestions) {
                const li = document.createElement('li');
                li.textContent = suggestion;
                suggestionsList.appendChild(li);
            }
        }

        // Update action buttons
        const retryBtn = document.getElementById('btn-retry');
        const altBtn = document.getElementById('btn-alt');

        if (error.retryable) {
            retryBtn.style.display = 'inline-block';
            retryBtn.textContent = 'Try Again';
        } else {
            retryBtn.style.display = 'none';
        }

        // Set alternative button text based on error type
        switch (errorId) {
            case 'no-internet':
                altBtn.textContent = 'Check Connection';
                break;
            case 'browser-compatibility':
                altBtn.textContent = 'Update Browser';
                break;
            case 'blocked-content':
                altBtn.textContent = 'Try Proxy';
                break;
            default:
                altBtn.textContent = 'Get Help';
        }

        // Set severity class
        const modal = document.getElementById('error-modal');
        modal.className = 'error-modal';
        if (error.severity === 'high') {
            modal.classList.add('severity-high');
        } else if (error.severity === 'medium') {
            modal.classList.add('severity-medium');
        } else {
            modal.classList.add('severity-low');
        }

        // Show overlay
        document.getElementById('error-overlay').style.display = 'flex';

        // Start auto-retry if applicable
        if (error.retryable && error.retryDelay > 0) {
            this.startAutoRetry(error.retryDelay);
        }
    }

    hideError() {
        this.currentError = null;
        this.stopAutoRetry();
        document.getElementById('error-overlay').style.display = 'none';
        // Reset game loading tracking when errors are hidden
        this.resetGameLoadTracking();
    }

    handleRetry() {
        if (this.isRetrying) return;

        const error = this.errorDefinitions[this.currentError];
        if (!error || !error.retryable) return;

        this.retryCount++;
        this.isRetrying = true;

        const retryBtn = document.getElementById('btn-retry');
        retryBtn.classList.add('loading');
        retryBtn.disabled = true;

        // Simulate retry delay
        setTimeout(() => {
            this.isRetrying = false;
            retryBtn.classList.remove('loading');
            retryBtn.disabled = false;

            // Check for errors again
            this.detectErrors();

            // If error still exists and we haven't exceeded max retries, show countdown
            if (this.currentError && this.retryCount < this.maxRetries && error.retryDelay > 0) {
                this.showRetryCountdown(error.retryDelay);
            }
        }, 2000);
    }

    handleAlternativeAction() {
        switch (this.currentError) {
            case 'no-internet':
                // Try to open network settings or diagnostic page
                window.open('https://www.google.com', '_blank');
                break;
            case 'browser-compatibility':
                // Suggest browser update
                window.open('https://www.google.com/chrome/', '_blank');
                break;
            case 'blocked-content':
                // Redirect to proxy page
                window.location.href = './Proxy/proxy.html';
                break;
            default:
                // General help
                alert('For help with this issue, please contact support or try refreshing the page.');
        }
    }

    startAutoRetry(delay) {
        this.stopAutoRetry();

        let countdown = delay / 1000;

        const countdownInterval = setInterval(() => {
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                if (this.currentError) {
                    this.handleRetry();
                }
                return;
            }

            this.showRetryCountdown(countdown);
            countdown--;
        }, 1000);
    }

    stopAutoRetry() {
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
        this.hideRetryCountdown();
    }

    showRetryCountdown(seconds) {
        const countdownElement = document.getElementById('retry-countdown');
        countdownElement.textContent = `Auto-retry in ${seconds}s`;
        countdownElement.style.display = 'inline-block';
    }

    hideRetryCountdown() {
        const countdownElement = document.getElementById('retry-countdown');
        countdownElement.style.display = 'none';
    }

    // Public method to manually trigger error display
    triggerError(errorId) {
        if (this.errorDefinitions[errorId]) {
            this.showError(errorId);
        }
    }

    // Public method to manually clear errors
    clearErrors() {
        this.hideError();
    }
}

// Initialize error handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.errorHandler = new ErrorHandler();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
