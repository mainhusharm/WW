// Frontend Webhook Receiver for Real-time Signals
// This should be integrated into your frontend application

class SignalWebhookReceiver {
    constructor() {
        this.signals = [];
        this.isConnected = false;
        this.backendUrl = 'https://backend-ox9b.onrender.com';
        this.frontendUrl = 'https://frontend-zwwl.onrender.com';
    }

    // Connect to the signal system
    async connect() {
        try {
            const response = await fetch(`${this.backendUrl}/api/signals/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    frontend_url: this.frontendUrl
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Connected to real-time signals:', result);
                this.isConnected = true;
                this.updateConnectionStatus('Connected');
                return true;
            } else {
                console.error('❌ Failed to connect:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Connection error:', error);
            return false;
        }
    }

    // Disconnect from the signal system
    async disconnect() {
        try {
            const response = await fetch(`${this.backendUrl}/api/signals/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    frontend_url: this.frontendUrl
                })
            });

            if (response.ok) {
                console.log('✅ Disconnected from real-time signals');
                this.isConnected = false;
                this.updateConnectionStatus('Disconnected');
            }
        } catch (error) {
            console.error('❌ Disconnect error:', error);
        }
    }

    // Update the connection status in the UI
    updateConnectionStatus(status) {
        // Update the status indicator in your dashboard
        const statusElement = document.querySelector('.signal-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `signal-status ${status.toLowerCase()}`;
        }

        // Update the main status
        const mainStatus = document.querySelector('.real-time-signals-status');
        if (mainStatus) {
            mainStatus.textContent = status;
        }
    }

    // Handle incoming webhook signals
    handleWebhookSignal(signalData) {
        console.log('🔔 Received signal:', signalData);
        
        // Add signal to the list
        this.signals.unshift(signalData);
        
        // Keep only last 50 signals
        if (this.signals.length > 50) {
            this.signals = this.signals.slice(0, 50);
        }

        // Update the UI
        this.updateSignalDisplay();
        this.updateSignalStats();
    }

    // Update the signal display in the UI
    updateSignalDisplay() {
        const signalContainer = document.querySelector('.signals-container');
        if (!signalContainer) return;

        if (this.signals.length === 0) {
            signalContainer.innerHTML = `
                <div class="no-signals">
                    <div class="signal-icon">📡</div>
                    <h3>No Signals Available</h3>
                    <p>Connect to receive real-time signals</p>
                </div>
            `;
            return;
        }

        const signalsHTML = this.signals.map(signal => `
            <div class="signal-card">
                <div class="signal-header">
                    <span class="signal-pair">${signal.pair}</span>
                    <span class="signal-direction ${signal.direction.toLowerCase()}">${signal.direction}</span>
                    <span class="signal-confidence">${signal.confidence}%</span>
                </div>
                <div class="signal-details">
                    <div class="signal-price">
                        <span>Entry: ${signal.entry_price}</span>
                        <span>SL: ${signal.stop_loss}</span>
                        <span>TP: ${signal.take_profit}</span>
                    </div>
                    <div class="signal-analysis">${signal.analysis}</div>
                    <div class="signal-concepts">
                        ${signal.ict_concepts.map(concept => `<span class="concept-tag">${concept}</span>`).join('')}
                    </div>
                    <div class="signal-meta">
                        <span class="signal-time">${new Date(signal.created_at).toLocaleTimeString()}</span>
                        <span class="signal-source">${signal.source}</span>
                    </div>
                </div>
            </div>
        `).join('');

        signalContainer.innerHTML = signalsHTML;
    }

    // Update signal statistics
    updateSignalStats() {
        const totalSignals = this.signals.length;
        const activeSignals = this.signals.filter(s => s.status === 'active').length;
        const recentSignals = this.signals.filter(s => {
            const signalTime = new Date(s.created_at);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return signalTime > weekAgo;
        }).length;

        // Update the stats cards
        this.updateStatCard('.total-signals', totalSignals);
        this.updateStatCard('.delivered-signals', activeSignals);
        this.updateStatCard('.recent-signals', recentSignals);
    }

    // Update individual stat card
    updateStatCard(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    // Fetch existing signals from backend
    async fetchExistingSignals() {
        try {
            const response = await fetch(`${this.backendUrl}/api/signals`);
            if (response.ok) {
                const data = await response.json();
                this.signals = data.signals || [];
                this.updateSignalDisplay();
                this.updateSignalStats();
                console.log(`📊 Loaded ${this.signals.length} existing signals`);
            }
        } catch (error) {
            console.error('❌ Error fetching signals:', error);
        }
    }

    // Initialize the signal system
    async init() {
        console.log('🚀 Initializing Signal Webhook Receiver');
        
        // Fetch existing signals first
        await this.fetchExistingSignals();
        
        // Connect to real-time signals
        await this.connect();
        
        // Set up periodic refresh
        setInterval(() => {
            if (this.isConnected) {
                this.fetchExistingSignals();
            }
        }, 30000); // Refresh every 30 seconds
        
        console.log('✅ Signal system initialized');
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const signalReceiver = new SignalWebhookReceiver();
    signalReceiver.init();
    
    // Make it globally available
    window.signalReceiver = signalReceiver;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignalWebhookReceiver;
}
