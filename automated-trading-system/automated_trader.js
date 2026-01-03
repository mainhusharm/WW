const express = require('express');
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class AutomatedTradingSystem {
    constructor() {
        this.config = null;
        this.activeTrades = new Map();
        this.dailyStats = {
            trades: 0,
            profit: 0,
            loss: 0,
            startBalance: 0
        };
        this.isRunning = false;
        this.forexDataServiceUrl = process.env.FOREX_DATA_SERVICE_URL || 'http://localhost:5009';
        this.tradingBotUrl = process.env.TRADING_BOT_URL || 'http://localhost:3005';
    }

    async initialize() {
        try {
            await this.loadConfig();
            this.setupScheduler();
            this.setupExpressServer();
            console.log('🤖 Automated Trading System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize trading system:', error);
        }
    }

    async loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
            this.dailyStats.startBalance = this.config.risk_management.account_balance;
            console.log('✅ Configuration loaded successfully');
        } catch (error) {
            throw new Error(`Failed to load config: ${error.message}`);
        }
    }

    setupScheduler() {
        const intervalMinutes = this.config.schedule.analysis_interval_minutes;
        const cronExpression = `*/${intervalMinutes} * * * *`;
        
        // Schedule automated analysis
        cron.schedule(cronExpression, async () => {
            if (this.isRunning) {
                console.log(`🔄 Running scheduled analysis at ${new Date().toISOString()}`);
                await this.runAutomatedAnalysis();
            }
        });

        // Daily reset at midnight UTC
        cron.schedule('0 0 * * *', () => {
            this.resetDailyStats();
        });

        console.log(`📅 Scheduler set up: Analysis every ${intervalMinutes} minutes`);
    }

    async runAutomatedAnalysis() {
        try {
            // Check daily loss limit
            if (this.checkDailyLossLimit()) {
                console.log('⚠️ Daily loss limit reached. Stopping trading for today.');
                return;
            }

            // Analyze forex pairs
            for (const pair of this.config.trading_pairs.forex) {
                if (pair.enabled) {
                    await this.analyzePair(pair, 'forex');
                }
            }

            // Analyze crypto pairs
            for (const pair of this.config.trading_pairs.crypto) {
                if (pair.enabled) {
                    await this.analyzePair(pair, 'crypto');
                }
            }

        } catch (error) {
            console.error('❌ Error in automated analysis:', error);
        }
    }

    async analyzePair(pairConfig, market) {
        try {
            // Check if we already have a trade for this pair
            if (this.activeTrades.has(pairConfig.symbol)) {
                console.log(`⏭️ Skipping ${pairConfig.symbol} - already have active trade`);
                return;
            }

            // Check max concurrent trades limit
            if (this.activeTrades.size >= this.config.risk_management.max_concurrent_trades) {
                console.log('⚠️ Max concurrent trades limit reached');
                return;
            }

            for (const timeframe of pairConfig.timeframes) {
                console.log(`🔍 Analyzing ${pairConfig.symbol} on ${timeframe}`);
                
                // Call trading bot analysis
                const analysisResult = await this.callTradingBot(pairConfig.symbol, timeframe);
                
                if (analysisResult && analysisResult.signalType !== 'NEUTRAL') {
                    console.log(`📊 Signal found for ${pairConfig.symbol}: ${analysisResult.signalType}`);
                    
                    // Execute trade if signal is strong enough
                    if (analysisResult.confidence >= 70) {
                        await this.executeTrade(pairConfig, analysisResult, timeframe);
                    }
                }
                
                // Small delay between timeframe analyses
                await this.sleep(2000);
            }
        } catch (error) {
            console.error(`❌ Error analyzing ${pairConfig.symbol}:`, error);
        }
    }

    async callTradingBot(symbol, timeframe) {
        try {
            const response = await axios.post(`${this.tradingBotUrl}/api/analyze-symbol`, {
                symbol,
                timeframe
            }, {
                timeout: 30000
            });
            
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to call trading bot for ${symbol}:`, error.message);
            return null;
        }
    }

    async executeTrade(pairConfig, signal, timeframe) {
        try {
            const tradeId = `${pairConfig.symbol}_${Date.now()}`;
            const positionSize = this.calculatePositionSize(pairConfig.risk_reward.risk_percent);
            
            const trade = {
                id: tradeId,
                symbol: pairConfig.symbol,
                direction: signal.signalType,
                entryPrice: signal.entryPrice,
                stopLoss: signal.stopLoss,
                takeProfit: signal.takeProfit,
                positionSize,
                timestamp: new Date().toISOString(),
                timeframe,
                confidence: signal.confidence,
                status: 'ACTIVE'
            };

            // Store active trade
            this.activeTrades.set(pairConfig.symbol, trade);
            
            // Log trade execution
            console.log(`🚀 Trade executed:`, {
                symbol: trade.symbol,
                direction: trade.direction,
                entry: trade.entryPrice,
                sl: trade.stopLoss,
                tp: trade.takeProfit,
                size: trade.positionSize
            });

            // Send notifications
            await this.sendTradeNotification(trade);
            
            // Start monitoring this trade
            this.monitorTrade(trade);
            
            this.dailyStats.trades++;
            
        } catch (error) {
            console.error('❌ Failed to execute trade:', error);
        }
    }

    calculatePositionSize(riskPercent) {
        const accountBalance = this.config.risk_management.account_balance;
        const riskAmount = (accountBalance * riskPercent) / 100;
        
        // This is simplified - in real trading, you'd calculate based on stop loss distance
        return riskAmount;
    }

    monitorTrade(trade) {
        // Set up monitoring interval for this trade
        const monitorInterval = setInterval(async () => {
            try {
                const currentPrice = await this.getCurrentPrice(trade.symbol);
                
                if (currentPrice) {
                    const shouldClose = this.shouldCloseTrade(trade, currentPrice);
                    
                    if (shouldClose.close) {
                        await this.closeTrade(trade, shouldClose.reason, currentPrice);
                        clearInterval(monitorInterval);
                    }
                }
            } catch (error) {
                console.error(`❌ Error monitoring trade ${trade.id}:`, error);
            }
        }, 60000); // Check every minute
    }

    async getCurrentPrice(symbol) {
        try {
            const response = await axios.get(`${this.forexDataServiceUrl}/api/forex-price?pair=${symbol}`);
            return response.data.price;
        } catch (error) {
            console.error(`❌ Failed to get current price for ${symbol}:`, error.message);
            return null;
        }
    }

    shouldCloseTrade(trade, currentPrice) {
        const direction = trade.direction;
        
        if (direction === 'BUY') {
            if (currentPrice <= trade.stopLoss) {
                return { close: true, reason: 'STOP_LOSS' };
            }
            if (currentPrice >= trade.takeProfit) {
                return { close: true, reason: 'TAKE_PROFIT' };
            }
        } else if (direction === 'SELL') {
            if (currentPrice >= trade.stopLoss) {
                return { close: true, reason: 'STOP_LOSS' };
            }
            if (currentPrice <= trade.takeProfit) {
                return { close: true, reason: 'TAKE_PROFIT' };
            }
        }
        
        return { close: false };
    }

    async closeTrade(trade, reason, exitPrice) {
        try {
            trade.exitPrice = exitPrice;
            trade.closeReason = reason;
            trade.status = 'CLOSED';
            trade.closeTime = new Date().toISOString();
            
            // Calculate P&L
            const pnl = this.calculatePnL(trade);
            trade.pnl = pnl;
            
            // Update daily stats
            if (pnl > 0) {
                this.dailyStats.profit += pnl;
            } else {
                this.dailyStats.loss += Math.abs(pnl);
            }
            
            // Remove from active trades
            this.activeTrades.delete(trade.symbol);
            
            console.log(`🔚 Trade closed:`, {
                symbol: trade.symbol,
                reason,
                pnl: pnl.toFixed(2),
                duration: this.getTradeDuration(trade)
            });
            
            // Send close notification
            await this.sendTradeCloseNotification(trade);
            
        } catch (error) {
            console.error('❌ Failed to close trade:', error);
        }
    }

    calculatePnL(trade) {
        const direction = trade.direction;
        const entryPrice = trade.entryPrice;
        const exitPrice = trade.exitPrice;
        const positionSize = trade.positionSize;
        
        if (direction === 'BUY') {
            return (exitPrice - entryPrice) * positionSize;
        } else {
            return (entryPrice - exitPrice) * positionSize;
        }
    }

    getTradeuration(trade) {
        const start = new Date(trade.timestamp);
        const end = new Date(trade.closeTime);
        const duration = Math.round((end - start) / (1000 * 60)); // minutes
        return `${duration} minutes`;
    }

    checkDailyLossLimit() {
        const dailyLossLimit = (this.dailyStats.startBalance * this.config.risk_management.daily_loss_limit_percent) / 100;
        return this.dailyStats.loss >= dailyLossLimit;
    }

    resetDailyStats() {
        this.dailyStats = {
            trades: 0,
            profit: 0,
            loss: 0,
            startBalance: this.config.risk_management.account_balance
        };
        console.log('📊 Daily stats reset');
    }

    async sendTradeNotification(trade) {
        const message = `🚀 NEW TRADE EXECUTED
Symbol: ${trade.symbol}
Direction: ${trade.direction}
Entry: ${trade.entryPrice}
Stop Loss: ${trade.stopLoss}
Take Profit: ${trade.takeProfit}
Confidence: ${trade.confidence}%`;

        await this.sendNotification(message);
    }

    async sendTradeCloseNotification(trade) {
        const pnlEmoji = trade.pnl > 0 ? '💰' : '📉';
        const message = `${pnlEmoji} TRADE CLOSED
Symbol: ${trade.symbol}
Reason: ${trade.closeReason}
P&L: ${trade.pnl.toFixed(2)}
Duration: ${this.getTradeuration(trade)}`;

        await this.sendNotification(message);
    }

    async sendNotification(message) {
        // Implement your notification method here
        console.log('📱 Notification:', message);
        
        // Add webhook, email, or Telegram notifications as needed
        if (this.config.notifications.webhook_url) {
            try {
                await axios.post(this.config.notifications.webhook_url, { message });
            } catch (error) {
                console.error('❌ Failed to send webhook notification:', error);
            }
        }
    }

    setupExpressServer() {
        const app = express();
        app.use(express.json());

        // Status endpoint
        app.get('/status', (req, res) => {
            res.json({
                isRunning: this.isRunning,
                activeTrades: Array.from(this.activeTrades.values()),
                dailyStats: this.dailyStats,
                config: {
                    pairs: this.config.trading_pairs,
                    schedule: this.config.schedule
                }
            });
        });

        // Start/Stop endpoints
        app.post('/start', (req, res) => {
            this.isRunning = true;
            res.json({ message: 'Automated trading started', status: 'running' });
        });

        app.post('/stop', (req, res) => {
            this.isRunning = false;
            res.json({ message: 'Automated trading stopped', status: 'stopped' });
        });

        // Update config endpoint
        app.post('/config', async (req, res) => {
            try {
                this.config = { ...this.config, ...req.body };
                await fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(this.config, null, 2));
                res.json({ message: 'Configuration updated successfully' });
            } catch (error) {
                res.status(500).json({ error: 'Failed to update configuration' });
            }
        });

        const port = process.env.PORT || 3006;
        app.listen(port, '0.0.0.0', () => {
            console.log(`🌐 Automated Trading System API running on port ${port}`);
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize and start the system
const tradingSystem = new AutomatedTradingSystem();
tradingSystem.initialize();

module.exports = AutomatedTradingSystem;
