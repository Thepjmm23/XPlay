class ProxyManager {
    constructor() {
        this.methods = [];
        this.currentMethodIndex = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.timeout = 10000;
        this.loadMethods();
        this.setupEventListeners();
    }

    async loadMethods() {
        try {
            const response = await fetch('./proxy-methods.json');
            const config = await response.json();
            this.methods = config.proxyMethods.filter(method => method.enabled);
            this.maxRetries = config.fallbackSettings.maxRetries;
            this.retryDelay = config.fallbackSettings.retryDelay;
            this.timeout = config.fallbackSettings.timeout;
        } catch (error) {
            console.error('Failed to load proxy methods:', error);
            this.methods = this.getDefaultMethods();
        }
    }

    getDefaultMethods() {
        return [
            { id: 'cors-anywhere', name: 'CORS Anywhere', url: 'https://cors-anywhere.herokuapp.com/', enabled: true },
            { id: 'allorigins', name: 'All Origins', url: 'https://api.allorigins.win/raw?url=', enabled: true },
            { id: 'thingproxy', name: 'ThingProxy', url: 'https://thingproxy.freeboard.io/fetch/', enabled: true }
        ];
    }

    setupEventListeners() {
        const proxyBtn = document.getElementById('proxy-btn');
        const retryBtn = document.getElementById('retry-btn');
        const targetUrlInput = document.getElementById('target-url');
        const methodSelect = document.getElementById('proxy-method');

        proxyBtn.addEventListener('click', () => this.handleProxyRequest());
        retryBtn.addEventListener('click', () => this.handleProxyRequest());

        // Allow Enter key to trigger proxy request
        targetUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleProxyRequest();
            }
        });

        // Update status based on method selection
        methodSelect.addEventListener('change', () => {
            this.updateStatus('Ready');
        });
    }

    async handleProxyRequest() {
        const targetUrl = document.getElementById('target-url').value.trim();
        const selectedMethod = document.getElementById('proxy-method').value;

        if (!targetUrl) {
            this.showError('Please enter a URL to unblock');
            return;
        }

        if (!this.isValidUrl(targetUrl)) {
            this.showError('Please enter a valid URL (including https://)');
            return;
        }

        this.currentMethodIndex = 0;
        this.showLoading();

        if (selectedMethod === 'auto') {
            await this.tryAllMethods(targetUrl);
        } else {
            const method = this.methods.find(m => m.id === selectedMethod);
            if (method) {
                await this.tryMethod(targetUrl, method, 1);
            } else {
                this.showError('Selected proxy method not available');
            }
        }
    }

    async tryAllMethods(targetUrl) {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            document.getElementById('attempt-number').textContent = attempt;
            document.getElementById('max-attempts').textContent = this.maxRetries;

            for (let i = 0; i < this.methods.length; i++) {
                const method = this.methods[i];
                document.getElementById('current-method').textContent = method.name;

                try {
                    const success = await this.tryMethod(targetUrl, method, attempt);
                    if (success) {
                        return; // Success, exit the function
                    }
                } catch (error) {
                    console.error(`Method ${method.name} failed:`, error);
                }

                // Small delay between methods
                await this.delay(500);
            }
        }

        // All methods failed
        this.showError('Unable to access the requested URL with any proxy method. The site may be blocking proxy access.');
    }

    async tryMethod(targetUrl, method, attempt) {
        try {
            let proxyUrl = '';
            let content = '';

            switch (method.id) {
                case 'cors-anywhere':
                    proxyUrl = method.url + targetUrl;
                    content = await this.fetchWithTimeout(proxyUrl);
                    break;

                case 'allorigins':
                    proxyUrl = method.url + encodeURIComponent(targetUrl);
                    content = await this.fetchWithTimeout(proxyUrl);
                    break;

                case 'thingproxy':
                    proxyUrl = method.url + targetUrl;
                    content = await this.fetchWithTimeout(proxyUrl);
                    break;

                case 'proxyium':
                    proxyUrl = method.url + encodeURIComponent(targetUrl);
                    content = await this.fetchWithTimeout(proxyUrl);
                    break;

                case 'bypasscors':
                    proxyUrl = method.url + encodeURIComponent(targetUrl);
                    content = await this.fetchWithTimeout(proxyUrl);
                    break;

                case 'urlreq':
                    proxyUrl = method.url + targetUrl;
                    content = await this.fetchWithTimeout(proxyUrl);
                    break;

                case 'corsproxy':
                    proxyUrl = method.url + targetUrl;
                    content = await this.fetchWithTimeout(proxyUrl);
                    break;

                case 'jsonp':
                    return await this.tryJsonpMethod(targetUrl);

                case 'iframe-direct':
                    return await this.tryIframeMethod(targetUrl);

                case 'websocket-proxy':
                    return await this.tryWebSocketMethod(targetUrl);

                case 'base64-encode':
                    return await this.tryBase64Method(targetUrl);

                case 'data-uri':
                    return await this.tryDataUriMethod(targetUrl);

                default:
                    throw new Error('Unknown proxy method');
            }

            if (content) {
                this.showSuccess(targetUrl, method.name, content);
                return true;
            }

        } catch (error) {
            console.error(`Method ${method.name} failed on attempt ${attempt}:`, error);
            this.updateStatus(`Method ${method.name} failed, trying next...`);
        }

        return false;
    }

    async fetchWithTimeout(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async tryJsonpMethod(targetUrl) {
        return new Promise((resolve) => {
            // Create a temporary script element for JSONP
            const script = document.createElement('script');
            const callbackName = 'jsonp_callback_' + Date.now();

            // Add callback function to window
            window[callbackName] = (data) => {
                this.showSuccess(targetUrl, 'JSONP Method', data);
                cleanup();
                resolve(true);
            };

            // Set up timeout
            const timeoutId = setTimeout(() => {
                cleanup();
                resolve(false);
            }, this.timeout);

            function cleanup() {
                clearTimeout(timeoutId);
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }

            // For demo purposes, we'll simulate success
            setTimeout(() => {
                window[callbackName]('<html><body><h1>Content loaded via JSONP</h1><p>This is a demo of JSONP proxy method.</p></body></html>');
            }, 1000);
        });
    }

    async tryIframeMethod(targetUrl) {
        const iframe = document.getElementById('proxy-iframe');
        iframe.src = targetUrl;

        // Check if iframe loads successfully
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                resolve(false);
            }, this.timeout);

            iframe.onload = () => {
                clearTimeout(timeoutId);
                this.showSuccess(targetUrl, 'Direct Iframe');
                resolve(true);
            };

            iframe.onerror = () => {
                clearTimeout(timeoutId);
                resolve(false);
            };
        });
    }

    async tryWebSocketMethod(targetUrl) {
        return new Promise((resolve) => {
            try {
                const wsUrl = 'wss://echo.websocket.org'; // Demo WebSocket
                const socket = new WebSocket(wsUrl);

                const timeoutId = setTimeout(() => {
                    socket.close();
                    resolve(false);
                }, this.timeout);

                socket.onopen = () => {
                    socket.send(JSON.stringify({ url: targetUrl, action: 'fetch' }));
                };

                socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.content) {
                        clearTimeout(timeoutId);
                        this.showSuccess(targetUrl, 'WebSocket Proxy', data.content);
                        socket.close();
                        resolve(true);
                    }
                };

                socket.onerror = () => {
                    clearTimeout(timeoutId);
                    socket.close();
                    resolve(false);
                };
            } catch (error) {
                resolve(false);
            }
        });
    }

    async tryBase64Method(targetUrl) {
        // For demo purposes, simulate base64 encoding method
        return new Promise((resolve) => {
            setTimeout(() => {
                const encodedUrl = btoa(targetUrl);
                const demoContent = `<html><body><h1>Base64 Proxy Demo</h1><p>URL: ${targetUrl}</p><p>Encoded: ${encodedUrl}</p></body></html>`;
                this.showSuccess(targetUrl, 'Base64 Encoding', demoContent);
                resolve(true);
            }, 1500);
        });
    }

    async tryDataUriMethod(targetUrl) {
        // For demo purposes, simulate data URI method
        return new Promise((resolve) => {
            setTimeout(() => {
                const demoContent = `data:text/html,<html><body><h1>Data URI Proxy Demo</h1><p>Original URL: ${targetUrl}</p><p>This method embeds content as data URI.</p></body></html>`;
                this.showSuccess(targetUrl, 'Data URI Method', `<iframe src="${demoContent}" width="100%" height="400"></iframe>`);
                resolve(true);
            }, 1200);
        });
    }

    showSuccess(targetUrl, methodName, content) {
        this.hideLoading();
        this.updateStatus('Success', 'success');

        document.getElementById('success-method').textContent = methodName;

        const successContainer = document.getElementById('success-container');
        const iframe = document.getElementById('proxy-iframe');

        if (methodName === 'Direct Iframe') {
            iframe.src = targetUrl;
            iframe.style.display = 'block';
        } else if (methodName === 'Data URI Method') {
            // Content is already an iframe for data URI method
            iframe.src = content;
            iframe.style.display = 'block';
        } else {
            // For other methods, display the content directly
            iframe.srcdoc = content;
            iframe.style.display = 'block';
        }

        successContainer.classList.remove('hidden');
        this.scrollToResults();
    }

    showError(message) {
        this.hideLoading();
        this.updateStatus('Error', 'error');

        document.getElementById('error-text').textContent = message;

        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.remove('hidden');

        this.scrollToResults();
    }

    showLoading() {
        this.updateStatus('Loading', 'loading');

        const loadingIndicator = document.getElementById('loading-indicator');
        const errorMessage = document.getElementById('error-message');
        const successContainer = document.getElementById('success-container');

        loadingIndicator.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        successContainer.classList.add('hidden');

        this.scrollToResults();
    }

    hideLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.classList.add('hidden');
    }

    updateStatus(text, type = '') {
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');

        statusText.textContent = text;
        statusIndicator.className = `status-indicator ${type}`;
    }

    scrollToResults() {
        setTimeout(() => {
            const results = document.querySelector('.proxy-results');
            if (results) {
                results.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the proxy manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.proxyManager = new ProxyManager();
});
