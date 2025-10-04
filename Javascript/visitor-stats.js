// Visitor Statistics Component - Inline Display
class VisitorStats {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createInlineStats());
        } else {
            this.createInlineStats();
        }
    }

    createInlineStats() {
        try {
            // Create the inline stats container
            const statsContainer = document.createElement('div');
            statsContainer.id = 'visitor-stats-container';
            statsContainer.className = 'visitor-stats-container';
            statsContainer.innerHTML = `
                <div class="stats-header">
                    <h3>📊 Live Visitor Statistics</h3>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-info">
                            <div class="stat-label">Currently Online</div>
                            <div class="stat-value" id="online-count">1</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-info">
                            <div class="stat-label">Peak Today</div>
                            <div class="stat-value" id="peak-count">1</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🌍</div>
                        <div class="stat-info">
                            <div class="stat-label">Total Visits</div>
                            <div class="stat-value" id="total-count">1</div>
                        </div>
                    </div>
                </div>
            `;

            // Add to main content area
            const main = document.querySelector('main');
            if (main) {
                main.appendChild(statsContainer);
            }

            // Add CSS styles
            this.addInlineStyles();
            
            // Initialize stats
            this.initializeStats();
            
        } catch (error) {
            console.error('Error creating visitor stats:', error);
        }
    }

    addInlineStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .visitor-stats-container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                padding: 25px;
                margin: 30px auto;
                max-width: 600px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }

            .stats-header h3 {
                color: #00ff88;
                margin-bottom: 20px;
                font-size: 1.5em;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }

            .stat-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0, 255, 136, 0.2);
            }

            .stat-icon {
                font-size: 24px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 255, 136, 0.1);
                border-radius: 50%;
            }

            .stat-info {
                flex: 1;
                text-align: left;
            }

            .stat-label {
                color: #ccc;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }

            .stat-value {
                color: #00ff88;
                font-size: 20px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    initializeStats() {
        // Update stats immediately
        this.updateStats();
        
        // Start auto-refresh
        this.startAutoRefresh();
    }

    updateStats() {
        try {
            // Get visitor ID
            let visitorId = localStorage.getItem('xplay_visitor_id');
            if (!visitorId) {
                visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('xplay_visitor_id', visitorId);
            }
            
            // Get or create global stats
            let globalStats = localStorage.getItem('xplay_global_stats');
            if (!globalStats) {
                globalStats = {
                    online: 1,
                    peak: 1,
                    total: 1
                };
                localStorage.setItem('xplay_global_stats', JSON.stringify(globalStats));
            } else {
                globalStats = JSON.parse(globalStats);
            }
            
            // Update stats
            globalStats.online = Math.max(1, globalStats.online);
            globalStats.total = Math.max(1, globalStats.total);
            
            // Update display
            this.updateStatsDisplay(globalStats);
            
            // Save back to localStorage
            localStorage.setItem('xplay_global_stats', JSON.stringify(globalStats));
            
        } catch (error) {
            console.error('Error updating stats:', error);
            this.updateStatsDisplay({ online: 1, peak: 1, total: 1 });
        }
    }

    updateStatsDisplay(data) {
        const onlineEl = document.getElementById('online-count');
        const peakEl = document.getElementById('peak-count');
        const totalEl = document.getElementById('total-count');
        
        if (onlineEl) onlineEl.textContent = data.online || 1;
        if (peakEl) peakEl.textContent = data.peak || 1;
        if (totalEl) totalEl.textContent = (data.total || 1).toLocaleString();
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.updateStats();
        }, 15000); // Refresh every 15 seconds
    }
}

// Initialize when script loads
new VisitorStats();
