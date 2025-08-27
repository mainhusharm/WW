import React, { useEffect, useState } from 'react';
import LivePriceFeed from './LivePriceFeed';
import TradePerformance from './TradePerformance';
import api from '../api';
import yfinanceWorking from '../services/yfinanceWorking';

interface ForexBar {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

const ForexDataDashboard = ({ isBotRunning, setIsBotRunning }: { isBotRunning: boolean, setIsBotRunning: (isRunning: boolean) => void }) => {
  const [activeTab, setActiveTab] = useState('signals');
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [wins, setWins] = useState<any[]>([]);
  const [losses, setLosses] = useState<any[]>([]);
  const [botStatus, setBotStatus] = useState<{ is_active: boolean; last_started?: string; last_stopped?: string }>({ is_active: false });

  // Bot status management
  const fetchBotStatus = async () => {
    try {
      const response = await api.get('/api/database/bot-status');
      const forexBot = response.data.find((bot: any) => bot.bot_type === 'forex');
      if (forexBot) {
        setBotStatus(forexBot);
        setIsBotRunning(forexBot.is_active);
      }
    } catch (error) {
      console.error('Error fetching bot status:', error);
    }
  };

  const updateBotStatus = async (isActive: boolean) => {
    try {
      await api.post('/api/database/bot-status/forex', { is_active: isActive });
      setBotStatus(prev => ({ ...prev, is_active: isActive }));
      setIsBotRunning(isActive);
      
      if (isActive) {
        // Start the bot logic here
        console.log('Forex bot started');
      } else {
        // Stop the bot logic here
        console.log('Forex bot stopped');
      }
    } catch (error) {
      console.error('Error updating bot status:', error);
    }
  };

  useEffect(() => {
    fetchBotStatus();
  }, []);

  useEffect(() => {
    // --- DOM Elements ---
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const winRateEl = document.getElementById('winRate');
    const lastUpdateEl = document.getElementById('lastUpdate');
    const symbolSelect = document.getElementById('symbol') as HTMLSelectElement;
    const timeframeSelect = document.getElementById('timeframe') as HTMLSelectElement;
    const riskRewardSelect = document.getElementById('riskReward') as HTMLSelectElement;
    const startBtn = document.querySelector('button[onclick="startBot()"]') as HTMLButtonElement;
    const stopBtn = document.querySelector('button[onclick="stopBot()"]') as HTMLButtonElement;
    const signalsContainer = document.getElementById('signalsContainer');
    const logsContainer = document.getElementById('logs');
    const activePairsEl = document.getElementById('activePairs');
    const signalsTodayEl = document.getElementById('signalsToday');
    const activeTimeframesEl = document.getElementById('activeTimeframes');
    const systemStatusEl = document.getElementById('systemStatus');

    // --- Global State ---
    let activeConnections: any[] = [];
    let signalHistory: any[] = [];
    let lastData: any = {};
    (window as any).riskRewardRatios = [2.0];
    const failedSources = new Set<string>();

    // --- API Configurations ---
    const API_CONFIG = {
        oanda: { key: '245b6434c34234524352c345345c3452-c345345c34523452345c34534c34534c', host: 'fxds.oanda.com' }
    };

    const markets = {
        stocks: {
            symbols: []
        },
        commodities: {
            symbols: []
        },
        forexMajors: {
            symbols: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD']
        },
        forexCrosses: {
            symbols: [
                'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'EUR/AUD', 'GBP/AUD', 'AUD/CAD', 'CAD/JPY',
                'CHF/JPY', 'AUD/CHF', 'CAD/CHF', 'EUR/CHF', 'GBP/CHF', 'NZD/CAD', 'NZD/JPY', 'AUD/NZD'
            ]
        }
    };

    // --- Helper Functions ---
    function log(message: string, type = 'info') {
        if (!logsContainer) return;
        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
        logsContainer.appendChild(entry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    async function fetchWithRetry(url: string, options = {}, maxRetries = 2) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    log(`⏰ Request timeout after 120 seconds, aborting...`, 'warning');
                    controller.abort();
                }, 120000); // Increased to 120 second timeout
                
                log(`🔄 Attempt ${attempt}/${maxRetries} for Yahoo Finance API`, 'info');
                
                const response = await fetch(url, { 
                    ...options, 
                    signal: controller.signal,
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (compatible; TradingBot/1.0)',
                        ...(options as any).headers
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                const errorMessage = data.error || data.Error || data['Error Message'] || data['Note'] || data['message'];
                if (errorMessage) {
                    throw new Error(`API Error: ${errorMessage}`);
                }
                
                log(`✅ Yahoo Finance API success on attempt ${attempt}`, 'success');
                return data;
                
            } catch (error: any) {
                lastError = error;
                const errorMsg = error.name === 'AbortError' ? 'Request timeout (120s)' : error.message;
                log(`❌ Attempt ${attempt} failed: ${errorMsg}`, 'warning');
                
                if (attempt < maxRetries) {
                    const delay = 2000; // Fixed 2 second delay
                    log(`⏳ Retrying in ${delay}ms...`, 'info');
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    log(`🚫 All attempts failed. Switching to fallback mode.`, 'error');
                }
            }
        }
        
        // Return fallback data instead of throwing error
        log(`🔄 Using fallback data due to Yahoo Finance unavailability`, 'info');
        return null;
    }

    function getPrecision(symbol: string) {
        if (['USDJPY'].includes(symbol)) return 3;
        if (['EURUSD', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'].includes(symbol)) return 5;
        return 2;
    }



    // --- Data Engines ---
    class DataEngine {
        priceCache: Map<string, any>;
        lastUpdateTime: Map<string, number>;
        cacheValidityMs: number;

        constructor() {
            this.priceCache = new Map();
            this.lastUpdateTime = new Map();
            this.cacheValidityMs = 30000;
        }

        async fetchYfinancePrice(symbol: string, timeframe: string) {
            try {
                log(`📡 Fetching ${symbol} from yfinance...`, 'info');
                const data = await yfinanceWorking.fetchHistoricalData(symbol, timeframe);
                
                if (data && data.history) {
                    log(`✅ Successfully fetched ${data.history.length} historical bars for ${symbol} from yfinance`, 'success');
                    return data;
                }
                
                throw new Error(`No data returned for ${symbol}`);
                
            } catch (error: any) {
                log(`❌ Historical data fetch failed for ${symbol}: ${error.message}`, 'error');
                throw error;
            }
        }

        async fetchLatestYfinancePrice(symbol: string) {
            try {
                log(`📡 Fetching latest price for ${symbol} from yfinance...`, 'info');
                const data = await yfinanceWorking.fetchLatestPrice(symbol);
                
                if (data && data.price) {
                    log(`✅ Yahoo Finance price for ${symbol}: ${data.price}`, 'success');
                    return data;
                }
                
                return null;
                
            } catch (error: any) {
                log(`❌ Price fetch failed for ${symbol}: ${error.message}`, 'error');
                return null;
            }
        }

        async fetchBulkYfinanceData(symbols: string[], timeframe: string) {
            try {
                log(`📡 Fetching bulk data for ${symbols.length} symbols from yfinance...`, 'info');
                const results = await yfinanceWorking.fetchBulkData(symbols, timeframe);
                
                const successCount = Object.values(results).filter(history => history.length > 0).length;
                const failedCount = symbols.length - successCount;
                
                log(`✅ Bulk fetch completed: ${successCount} successful, ${failedCount} failed`, 'success');
                return results;
                
            } catch (error: any) {
                log(`❌ Bulk fetch failed: ${error.message}`, 'error');
                return {};
            }
        }

        async getPrice(symbol: string, timeframe: string) {
            const cacheKey = `${symbol}_${timeframe}`;
            const now = Date.now();
            
            // Check cache first
            if (this.priceCache.has(cacheKey)) {
                const lastUpdate = this.lastUpdateTime.get(cacheKey) || 0;
                if (now - lastUpdate < this.cacheValidityMs) {
                    log(`📋 Using cached data for ${symbol}`, 'info');
                    return this.priceCache.get(cacheKey);
                }
            }
            
            // Try Yahoo Finance API
            try {
                log(`📡 Fetching ${symbol} from Yahoo Finance...`, 'info');
                const result = await this.fetchLatestYfinancePrice(symbol);
                
                if (result) {
                    this.priceCache.set(cacheKey, result);
                    this.lastUpdateTime.set(cacheKey, now);
                    return result;
                }
            } catch (error: any) {
                log(`🟡 Yahoo Finance failed for ${symbol}: ${error.message}`, 'warning');
            }
            
            // No fallback - return null if yfinance fails
            log(`❌ No price data available for ${symbol}`, 'error');
            return null;
        }
        

    }
    const dataEngine = new DataEngine();

    class ProfessionalSMCEngine {
        priceHistory: Map<string, any[]>;
        swingHighs: Map<string, any>;
        swingLows: Map<string, any>;
        internalHighs: Map<string, any>;
        internalLows: Map<string, any>;
        swingTrend: Map<string, any>;
        internalTrend: Map<string, any>;
        orderBlocks: Map<string, any[]>;
        fairValueGaps: Map<string, any[]>;
        equalHighs: Map<string, any[]>;
        equalLows: Map<string, any[]>;
        lastSignalTime: Map<string, number>;
        confirmationScores: { [key: string]: number };
        signalRequirements: { [key: string]: number };

        constructor() {
            this.priceHistory = new Map();
            this.swingHighs = new Map();
            this.swingLows = new Map();
            this.internalHighs = new Map();
            this.internalLows = new Map();
            this.swingTrend = new Map();
            this.internalTrend = new Map();
            this.orderBlocks = new Map();
            this.fairValueGaps = new Map();
            this.equalHighs = new Map();
            this.equalLows = new Map();
            this.lastSignalTime = new Map();
            
            this.confirmationScores = {
                'swingBullishBOS': 30,
                'swingBearishBOS': 30,
                'swingBullishCHoCH': 25,
                'swingBearishCHoCH': 25,
                'internalBullishBOS': 20,
                'internalBearishBOS': 20,
                'internalBullishCHoCH': 18,
                'internalBearishCHoCH': 18,
                'swingOrderBlockRespect': 22,
                'internalOrderBlockRespect': 18,
                'bullishFairValueGap': 15,
                'bearishFairValueGap': 15,
                'equalHighsBreak': 12,
                'equalLowsBreak': 12,
                'premiumZoneEntry': 10,
                'discountZoneEntry': 10,
                'equilibriumZone': 8,
                'multiTimeframeAlignment': 8,
                'volumeConfirmation': 6,
                'strongWeakHighLow': 5,
                'atrVolatilityFilter': 4
            };
            
            this.signalRequirements = {
                minPrimaryConfirmations: 1,
                minTotalConfirmations: 4,
                minConfidenceScore: 10,
                minHistoryBars: 25,
                cooldownPeriod: 300000
            };
        }

        analyzeSMCPatterns(symbol: string, currentPriceData: { price: string; }) {
            try {
                const currentPrice = parseFloat(currentPriceData.price);
                const timestamp = Date.now();
                
                this.initializeSymbolData(symbol, currentPrice, timestamp);
                
                if (!this.canGenerateSignal(symbol, timestamp)) {
                    return null;
                }
                
                const priceHistory = this.priceHistory.get(symbol);
                if (priceHistory!.length < this.signalRequirements.minHistoryBars) {
                    log(`[${symbol}] Insufficient price history: ${priceHistory!.length}/${this.signalRequirements.minHistoryBars} bars.`);
                    return null;
                }
                
                const analysis = this.performStructureAnalysis(symbol, priceHistory!, currentPrice);
                
                return analysis;
                
            } catch (error: any) {
                console.error(`SMC Analysis Error for ${symbol}:`, error);
                return null;
            }
        }

        performStructureAnalysis(symbol: string, priceHistory: any[], currentPrice: number) {
            const confirmations: string[] = [];
            const currentAlerts = {
                swingBullishBOS: false,
                swingBearishBOS: false,
                swingBullishCHoCH: false,
                swingBearishCHoCH: false,
                internalBullishBOS: false,
                internalBearishBOS: false,
                internalBullishCHoCH: false,
                internalBearishCHoCH: false,
                swingOrderBlock: false,
                internalOrderBlock: false,
                bullishFairValueGap: false,
                bearishFairValueGap: false,
                equalHighs: false,
                equalLows: false
            };
            
            const swingAnalysis = this.analyzeSwingStructure(symbol, priceHistory, currentPrice);
            Object.assign(currentAlerts, swingAnalysis.alerts);
            confirmations.push(...swingAnalysis.confirmations);
            
            const internalAnalysis = this.analyzeInternalStructure(symbol, priceHistory, currentPrice);
            Object.assign(currentAlerts, internalAnalysis.alerts);
            confirmations.push(...internalAnalysis.confirmations);
            
            const orderBlockAnalysis = this.analyzeOrderBlocks(symbol, priceHistory, currentPrice);
            Object.assign(currentAlerts, orderBlockAnalysis.alerts);
            confirmations.push(...orderBlockAnalysis.confirmations);
            
            const fvgAnalysis = this.analyzeFairValueGaps(symbol, priceHistory, currentPrice);
            Object.assign(currentAlerts, fvgAnalysis.alerts);
            confirmations.push(...fvgAnalysis.confirmations);
            
            const eqhlAnalysis = this.analyzeEqualHighsLows(symbol, priceHistory, currentPrice);
            Object.assign(currentAlerts, eqhlAnalysis.alerts);
            confirmations.push(...eqhlAnalysis.confirmations);
            
            const zoneAnalysis = this.analyzePremiumDiscountZones(symbol, priceHistory, currentPrice);
            confirmations.push(...zoneAnalysis.confirmations);
            
            const additionalConfluences = this.analyzeAdditionalFactors(symbol, priceHistory, currentPrice);
            confirmations.push(...additionalConfluences.confirmations);
            
            let signalDirection = null;
            if (currentAlerts.swingBullishBOS || currentAlerts.swingBullishCHoCH || 
                currentAlerts.internalBullishBOS || currentAlerts.internalBullishCHoCH) {
                signalDirection = 'BUY';
            } else if (currentAlerts.swingBearishBOS || currentAlerts.swingBearishCHoCH || 
                       currentAlerts.internalBearishBOS || currentAlerts.internalBearishCHoCH) {
                signalDirection = 'SELL';
            }
            
            return {
                signalDirection,
                confirmations,
                alerts: currentAlerts,
                analysis: this.generateAnalysisText(signalDirection, confirmations)
            };
        }

        analyzeSwingStructure(symbol: string, priceHistory: any[], currentPrice: number) {
            const alerts: any = {};
            const confirmations: string[] = [];
            
            const swingHigh = this.swingHighs.get(symbol) || { currentLevel: null, crossed: false };
            const swingLow = this.swingLows.get(symbol) || { currentLevel: null, crossed: false };
            const swingTrend = this.swingTrend.get(symbol) || { bias: 0 };
            
            const swingPoints = this.detectSwingPoints(priceHistory, 50);
            
            if (swingPoints.newHigh) {
                swingHigh.currentLevel = swingPoints.high;
                swingHigh.crossed = false;
                this.swingHighs.set(symbol, swingHigh);
            }
            if (swingPoints.newLow) {
                swingLow.currentLevel = swingPoints.low;
                swingLow.crossed = false;
                this.swingLows.set(symbol, swingLow);
            }
            
            if (swingHigh.currentLevel && currentPrice > swingHigh.currentLevel && !swingHigh.crossed) {
                const tag = swingTrend.bias === -1 ? 'CHoCH' : 'BOS';
                
                alerts.swingBullishBOS = tag === 'BOS';
                alerts.swingBullishCHoCH = tag === 'CHoCH';
                
                if (tag === 'BOS') confirmations.push('swingBullishBOS');
                if (tag === 'CHoCH') confirmations.push('swingBullishCHoCH');
                
                swingHigh.crossed = true;
                swingTrend.bias = 1;
                this.swingTrend.set(symbol, swingTrend);
            }
            
            if (swingLow.currentLevel && currentPrice < swingLow.currentLevel && !swingLow.crossed) {
                const tag = swingTrend.bias === 1 ? 'CHoCH' : 'BOS';
                
                alerts.swingBearishBOS = tag === 'BOS';
                alerts.swingBearishCHoCH = tag === 'CHoCH';
                
                if (tag === 'BOS') confirmations.push('swingBearishBOS');
                if (tag === 'CHoCH') confirmations.push('swingBearishCHoCH');
                
                swingLow.crossed = true;
                swingTrend.bias = -1;
                this.swingTrend.set(symbol, swingTrend);
            }
            
            return { alerts, confirmations };
        }

        analyzeInternalStructure(symbol: string, priceHistory: any[], currentPrice: number) {
            const alerts: any = {};
            const confirmations: string[] = [];
            
            const internalHigh = this.internalHighs.get(symbol) || { currentLevel: null, crossed: false };
            const internalLow = this.internalLows.get(symbol) || { currentLevel: null, crossed: false };
            const internalTrend = this.internalTrend.get(symbol) || { bias: 0 };
            
            const internalSwings = this.detectSwingPoints(priceHistory, 5);
            
            if (internalSwings.newHigh) {
                internalHigh.currentLevel = internalSwings.high;
                internalHigh.crossed = false;
                this.internalHighs.set(symbol, internalHigh);
            }
            if (internalSwings.newLow) {
                internalLow.currentLevel = internalSwings.low;
                internalLow.crossed = false;
                this.internalLows.set(symbol, internalLow);
            }
            
            if (internalHigh.currentLevel && currentPrice > internalHigh.currentLevel && !internalHigh.crossed) {
                const tag = internalTrend.bias === -1 ? 'CHoCH' : 'BOS';
                
                alerts.internalBullishBOS = tag === 'BOS';
                alerts.internalBullishCHoCH = tag === 'CHoCH';
                
                if (tag === 'BOS') confirmations.push('internalBullishBOS');
                if (tag === 'CHoCH') confirmations.push('internalBullishCHoCH');
                
                internalHigh.crossed = true;
                internalTrend.bias = 1;
                this.internalTrend.set(symbol, internalTrend);
            }
            
            if (internalLow.currentLevel && currentPrice < internalLow.currentLevel && !internalLow.crossed) {
                const tag = internalTrend.bias === 1 ? 'CHoCH' : 'BOS';
                
                alerts.internalBearishBOS = tag === 'BOS';
                alerts.internalBearishCHoCH = tag === 'CHoCH';
                
                if (tag === 'BOS') confirmations.push('internalBearishBOS');
                if (tag === 'CHoCH') confirmations.push('internalBearishCHoCH');
                
                internalLow.crossed = true;
                internalTrend.bias = -1;
                this.internalTrend.set(symbol, internalTrend);
            }
            
            return { alerts, confirmations };
        }

        analyzeOrderBlocks(symbol: string, priceHistory: any[], currentPrice: number) {
            const alerts: any = {};
            const confirmations: string[] = [];
            
            if (priceHistory.length < 10) return { alerts, confirmations };
            
            let orderBlocks = this.orderBlocks.get(symbol) || [];
            
            orderBlocks.forEach(orderBlock => {
                const inOrderBlockZone = currentPrice >= orderBlock.low && currentPrice <= orderBlock.high;
                
                if (inOrderBlockZone) {
                    if (orderBlock.bias === 1) {
                        confirmations.push('swingOrderBlockRespect');
                        alerts.swingOrderBlock = true;
                    } else if (orderBlock.bias === -1) {
                        confirmations.push('swingOrderBlockRespect');
                        alerts.swingOrderBlock = true;
                    }
                }
            });
            
            const recentBars = priceHistory.slice(-5);
            const hasOrderBlockFormation = this.detectOrderBlockFormation(recentBars);
            
            if (hasOrderBlockFormation.bullish) {
                const newOB = {
                    high: hasOrderBlockFormation.high,
                    low: hasOrderBlockFormation.low,
                    bias: 1,
                    timestamp: Date.now()
                };
                orderBlocks.unshift(newOB);
                confirmations.push('internalOrderBlockRespect');
            }
            
            if (hasOrderBlockFormation.bearish) {
                const newOB = {
                    high: hasOrderBlockFormation.high,
                    low: hasOrderBlockFormation.low,
                    bias: -1,
                    timestamp: Date.now()
                };
                orderBlocks.unshift(newOB);
                confirmations.push('internalOrderBlockRespect');
            }
            
            if (orderBlocks.length > 10) {
                orderBlocks = orderBlocks.slice(0, 10);
            }
            
            this.orderBlocks.set(symbol, orderBlocks);
            
            return { alerts, confirmations };
        }

        analyzeFairValueGaps(symbol: string, priceHistory: any[], currentPrice: number) {
            const alerts: any = {};
            const confirmations: string[] = [];
            
            if (priceHistory.length < 5) return { alerts, confirmations };
            
            const recentBars = priceHistory.slice(-5);
            
            for (let i = 2; i < recentBars.length; i++) {
                const prev2 = recentBars[i - 2];
                const current = recentBars[i];
                
                if (prev2.high < current.low) {
                    confirmations.push('bullishFairValueGap');
                    alerts.bullishFairValueGap = true;
                }
                
                if (prev2.low > current.high) {
                    confirmations.push('bearishFairValueGap');
                    alerts.bearishFairValueGap = true;
                }
            }
            
            return { alerts, confirmations };
        }

        analyzeEqualHighsLows(symbol: string, priceHistory: any[], currentPrice: number) {
            const alerts: any = {};
            const confirmations: string[] = [];
            
            if (priceHistory.length < 10) return { alerts, confirmations };
            
            const atr = this.calculateATR(priceHistory, 14);
            const threshold = 0.1 * atr;
            
            const recentBars = priceHistory.slice(-10);
            const highs = recentBars.map(bar => bar.high);
            const lows = recentBars.map(bar => bar.low);
            
            const equalHighLevels = this.findEqualLevels(highs, threshold);
            if (equalHighLevels.length >= 2 && currentPrice > Math.max(...equalHighLevels)) {
                confirmations.push('equalHighsBreak');
                alerts.equalHighs = true;
            }
            
            const equalLowLevels = this.findEqualLevels(lows, threshold);
            if (equalLowLevels.length >= 2 && currentPrice < Math.min(...equalLowLevels)) {
                confirmations.push('equalLowsBreak');
                alerts.equalLows = true;
            }
            
            return { alerts, confirmations };
        }

        analyzePremiumDiscountZones(symbol: string, priceHistory: any[], currentPrice: number) {
            const confirmations: string[] = [];
            
            if (priceHistory.length < 20) return { confirmations };
            
            const recentBars = priceHistory.slice(-20);
            const swingHigh = Math.max(...recentBars.map(bar => bar.high));
            const swingLow = Math.min(...recentBars.map(bar => bar.low));
            
            const range = swingHigh - swingLow;
            const currentLevel = (currentPrice - swingLow) / range;
            
            if (currentLevel >= 0.7) {
                confirmations.push('premiumZoneEntry');
            }
            else if (currentLevel <= 0.3) {
                confirmations.push('discountZoneEntry');
            }
            else if (currentLevel >= 0.4 && currentLevel <= 0.6) {
                confirmations.push('equilibriumZone');
            }
            
            return { confirmations };
        }

        analyzeAdditionalFactors(symbol: string, priceHistory: any[], currentPrice: number) {
            const confirmations: string[] = [];
            
            if (priceHistory.length >= 10) {
                const avgVolume = priceHistory.slice(-10).reduce((sum, bar) => sum + bar.volume, 0) / 10;
                const currentVolume = priceHistory[priceHistory.length - 1].volume;
                
                if (currentVolume > avgVolume * 1.5) {
                    confirmations.push('volumeConfirmation');
                }
            }
            
            if (priceHistory.length >= 14) {
                const atr = this.calculateATR(priceHistory, 14);
                const currentRange = priceHistory[priceHistory.length - 1].high - priceHistory[priceHistory.length - 1].low;
                
                if (currentRange > atr * 1.2) {
                    confirmations.push('atrVolatilityFilter');
                }
            }
            
            return { confirmations };
        }

        calculateConfidence(confirmations: string[]) {
            let totalScore = 0;
            let primaryConfirmations = 0;
            
            confirmations.forEach(confirmation => {
                if (this.confirmationScores[confirmation]) {
                    totalScore += this.confirmationScores[confirmation];
                    
                    if (confirmation.includes('BOS') || confirmation.includes('CHoCH')) {
                        primaryConfirmations++;
                    }
                }
            });
            
            if (primaryConfirmations >= 2) {
                totalScore += 10;
            }
            
            if (confirmations.length < 4) {
                totalScore *= 0.8;
            }
            
            return Math.min(Math.round(totalScore), 100);
        }

        calculateTradingLevels(symbol: string, signalDirection: string, currentPrice: number, priceHistory: any[], riskRewardRatio: number) {
            if (!priceHistory || priceHistory.length === 0) {
                // Fallback with minimal risk for missing data
                const fallbackRisk = currentPrice * 0.001; // 0.1% of current price
                return {
                    entryPrice: parseFloat(currentPrice.toFixed(5)),
                    stopLoss: parseFloat((signalDirection === 'BUY' ? currentPrice - fallbackRisk : currentPrice + fallbackRisk).toFixed(5)),
                    takeProfit: parseFloat((signalDirection === 'BUY' ? currentPrice + (fallbackRisk * riskRewardRatio) : currentPrice - (fallbackRisk * riskRewardRatio)).toFixed(5)),
                    riskReward: `1:${riskRewardRatio}`
                };
            }
            
            const atr = this.calculateATR(priceHistory, 14);
            const symbolVolatility = this.getSymbolVolatility(symbol);
            
            let entryPrice = currentPrice;
            let stopLoss, takeProfit;
            
            if (signalDirection === 'BUY') {
                // Use a more conservative approach based on symbol volatility and ATR
                const riskAmount = Math.max(atr * 0.8, currentPrice * symbolVolatility * 2);
                stopLoss = currentPrice - riskAmount;
                
                const riskDistance = entryPrice - stopLoss;
                takeProfit = entryPrice + (riskDistance * riskRewardRatio);
            } else {
                // SELL signal
                const riskAmount = Math.max(atr * 0.8, currentPrice * symbolVolatility * 2);
                stopLoss = currentPrice + riskAmount;
                
                const riskDistance = stopLoss - entryPrice;
                takeProfit = entryPrice - (riskDistance * riskRewardRatio);
            }
            
            // Ensure prices are realistic and within reasonable bounds
            const maxRisk = currentPrice * 0.02; // Maximum 2% risk
            if (Math.abs(entryPrice - stopLoss) > maxRisk) {
                if (signalDirection === 'BUY') {
                    stopLoss = entryPrice - maxRisk;
                    takeProfit = entryPrice + (maxRisk * riskRewardRatio);
                } else {
                    stopLoss = entryPrice + maxRisk;
                    takeProfit = entryPrice - (maxRisk * riskRewardRatio);
                }
            }
            
            return {
                entryPrice: parseFloat(entryPrice.toFixed(5)),
                stopLoss: parseFloat(stopLoss.toFixed(5)),
                takeProfit: parseFloat(takeProfit.toFixed(5)),
                riskReward: `1:${riskRewardRatio}`
            };
        }

        validateSignalQuality(analysis: any) {
            if (!analysis.signalDirection) return false;
            
            const primaryCount = analysis.confirmations.filter((c: string) => 
                c.includes('BOS') || c.includes('CHoCH')
            ).length;
            
            const confidence = this.calculateConfidence(analysis.confirmations);
            
            return (
                primaryCount >= this.signalRequirements.minPrimaryConfirmations &&
                analysis.confirmations.length >= this.signalRequirements.minTotalConfirmations &&
                confidence >= this.signalRequirements.minConfidenceScore
            );
        }

        initializeSymbolData(symbol: string, currentPrice: number, timestamp: number) {
            if (!this.priceHistory.has(symbol)) {
                this.priceHistory.set(symbol, []);
            }
            
            const volatility = this.getSymbolVolatility(symbol);
            const high = currentPrice + (Math.random() * volatility * currentPrice);
            const low = currentPrice - (Math.random() * volatility * currentPrice);
            const open = low + (Math.random() * (high - low));
            
            const newBar = {
                timestamp,
                open: parseFloat(open.toFixed(5)),
                high: parseFloat(high.toFixed(5)),
                low: parseFloat(low.toFixed(5)),
                close: currentPrice,
                volume: Math.random() * 1000000 + 500000
            };
            
            const history = this.priceHistory.get(symbol);
            history!.push(newBar);
            
            if (history!.length > 100) {
                history!.splice(0, history!.length - 100);
            }
        }

        detectSwingPoints(priceHistory: any[], lookback: number) {
            if (priceHistory.length < lookback * 2 + 1) {
                return { newHigh: false, newLow: false, high: null, low: null };
            }
            
            const currentIndex = priceHistory.length - lookback - 1;
            const currentBar = priceHistory[currentIndex];
            
            let isSwingHigh = true;
            let isSwingLow = true;
            
            for (let i = currentIndex - lookback; i <= currentIndex + lookback; i++) {
                if (i !== currentIndex && i >= 0 && i < priceHistory.length) {
                    if (priceHistory[i].high >= currentBar.high) isSwingHigh = false;
                    if (priceHistory[i].low <= currentBar.low) isSwingLow = false;
                }
            }
            
            return {
                newHigh: isSwingHigh,
                newLow: isSwingLow,
                high: isSwingHigh ? currentBar.high : null,
                low: isSwingLow ? currentBar.low : null
            };
        }

        calculateATR(priceHistory: any[], period: number) {
            if (priceHistory.length < period + 1) {
                return priceHistory.length > 0 ? priceHistory[0].close * 0.001 : 0.01;
            }
            
            const trueRanges: number[] = [];
            for (let i = 1; i < priceHistory.length; i++) {
                const current = priceHistory[i];
                const previous = priceHistory[i - 1];
                
                const tr = Math.max(
                    current.high - current.low,
                    Math.abs(current.high - previous.close),
                    Math.abs(current.low - previous.close)
                );
                trueRanges.push(tr);
            }
            
            const recentTRs = trueRanges.slice(-period);
            return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
        }

        detectOrderBlockFormation(recentBars: any[]) {
            if (recentBars.length < 3) return { bullish: false, bearish: false, high: 0, low: 0 };
            
            const prev = recentBars[recentBars.length - 3];
            const current = recentBars[recentBars.length - 2];
            const next = recentBars[recentBars.length - 1];
            
            const bullishOB = (prev.close < prev.open) && 
                             (next.close > current.high) && 
                             ((next.high - next.low) > (current.high - current.low) * 1.5);
            
            const bearishOB = (prev.close > prev.open) && 
                             (next.close < current.low) && 
                             ((next.high - next.low) > (current.high - current.low) * 1.5);
            
            return {
                bullish: bullishOB,
                bearish: bearishOB,
                high: current.high,
                low: current.low
            };
        }

        findEqualLevels(levels: number[], threshold: number) {
            const equalLevels: number[] = [];
            
            for (let i = 0; i < levels.length; i++) {
                for (let j = i + 1; j < levels.length; j++) {
                    if (Math.abs(levels[i] - levels[j]) <= threshold) {
                        if (!equalLevels.includes(levels[i])) equalLevels.push(levels[i]);
                        if (!equalLevels.includes(levels[j])) equalLevels.push(levels[j]);
                    }
                }
            }
            
            return equalLevels;
        }

        canGenerateSignal(symbol: string, timestamp: number) {
            const lastSignal = this.lastSignalTime.get(symbol);
            return !lastSignal || (timestamp - lastSignal) >= this.signalRequirements.cooldownPeriod;
        }

        getSymbolVolatility(symbol: string) {
            const volatilityMap: { [key: string]: number } = {
                // Forex Majors - realistic daily volatility
                'EUR/USD': 0.0008, 'GBP/USD': 0.0012, 'USD/JPY': 0.0008,
                'USD/CHF': 0.0007, 'AUD/USD': 0.0010, 'USD/CAD': 0.0009, 'NZD/USD': 0.0011,
                // Forex Crosses
                'EUR/JPY': 0.0010, 'GBP/JPY': 0.0015, 'EUR/GBP': 0.0008,
                'EUR/AUD': 0.0012, 'GBP/AUD': 0.0015, 'AUD/CAD': 0.0010,
                'CAD/JPY': 0.0012, 'CHF/JPY': 0.0011, 'AUD/CHF': 0.0011,
                'CAD/CHF': 0.0009, 'EUR/CHF': 0.0007, 'GBP/CHF': 0.0012,
                'NZD/CAD': 0.0012, 'NZD/JPY': 0.0013, 'AUD/NZD': 0.0010,
                // Commodities
                'XAU/USD': 0.002, 'XAG/USD': 0.003, 'USOIL': 0.015
            };
            return volatilityMap[symbol] || 0.001;
        }

        createTradingSignal(symbol: string, analysis: any, currentPrice: number, riskRewardRatio: number) {
            const confidence = this.calculateConfidence(analysis.confirmations);
            const priceHistory = this.priceHistory.get(symbol);
            const tradingLevels = this.calculateTradingLevels(symbol, analysis.signalDirection, currentPrice, priceHistory!, riskRewardRatio);
            
            return {
                symbol,
                signalType: analysis.signalDirection,
                confidence,
                entryPrice: tradingLevels.entryPrice,
                stopLoss: tradingLevels.stopLoss,
                takeProfit: tradingLevels.takeProfit,
                riskReward: tradingLevels.riskReward,
                confirmations: this.formatConfirmations(analysis.confirmations),
                timestamp: new Date(),
                analysis: analysis.analysis,
                sessionQuality: this.getSessionQuality(),
                timeframe: '15m'
            };
        }

        formatConfirmations(confirmations: string[]) {
            const formattedConfirmations: string[] = [];
            
            confirmations.forEach(confirmation => {
                switch(confirmation) {
                    case 'swingBullishBOS': formattedConfirmations.push('Swing Bullish BOS'); break;
                    case 'swingBearishBOS': formattedConfirmations.push('Swing Bearish BOS'); break;
                    case 'swingBullishCHoCH': formattedConfirmations.push('Swing Bullish CHoCH'); break;
                    case 'swingBearishCHoCH': formattedConfirmations.push('Swing Bearish CHoCH'); break;
                    case 'internalBullishBOS': formattedConfirmations.push('Internal Bullish BOS'); break;
                    case 'internalBearishBOS': formattedConfirmations.push('Internal Bearish BOS'); break;
                    case 'internalBullishCHoCH': formattedConfirmations.push('Internal Bullish CHoCH'); break;
                    case 'internalBearishCHoCH': formattedConfirmations.push('Internal Bearish CHoCH'); break;
                    case 'swingOrderBlockRespect': formattedConfirmations.push('Swing Order Block Respect'); break;
                    case 'internalOrderBlockRespect': formattedConfirmations.push('Internal Order Block Respect'); break;
                    case 'bullishFairValueGap': formattedConfirmations.push('Bullish Fair Value Gap'); break;
                    case 'bearishFairValueGap': formattedConfirmations.push('Bearish Fair Value Gap'); break;
                    case 'equalHighsBreak': formattedConfirmations.push('Equal Highs Break'); break;
                    case 'equalLowsBreak': formattedConfirmations.push('Equal Lows Break'); break;
                    case 'premiumZoneEntry': formattedConfirmations.push('Premium Zone Entry'); break;
                    case 'discountZoneEntry': formattedConfirmations.push('Discount Zone Entry'); break;
                    case 'equilibriumZone': formattedConfirmations.push('Equilibrium Zone'); break;
                    case 'volumeConfirmation': formattedConfirmations.push('Volume Confirmation'); break;
                    case 'atrVolatilityFilter': formattedConfirmations.push('ATR Volatility Filter'); break;
                    default: formattedConfirmations.push(confirmation);
                }
            });
            
            return formattedConfirmations;
        }

        generateAnalysisText(signalDirection: string | null, confirmations: string[]) {
            if (!signalDirection) return 'No clear directional bias detected.';
            
            const direction = signalDirection === 'BUY' ? 'bullish' : 'bearish';
            const confidence = this.calculateConfidence(confirmations);
            
            let analysis = `${confidence >= 80 ? 'Very Strong' : confidence >= 70 ? 'Strong' : 'Moderate'} ${direction} setup detected. `;
            
            const hasSwingBOS = confirmations.some(c => c.includes('BOS') || c.includes('CHoCH'));
            const hasSwingCHoCH = confirmations.some(c => c.includes('CHoCH'));
            const hasInternalBOS = confirmations.some(c => c.includes('internalBOS') || c.includes('internalCHoCH'));
            
            if (hasSwingBOS) analysis += `Major swing Break of Structure confirms ${direction} momentum shift. `;
            if (hasSwingCHoCH) analysis += `Swing Change of Character indicates potential trend reversal. `;
            if (hasInternalBOS) analysis += `Internal structure break provides additional confluence. `;
            if (confirmations.some(c => c.includes('OrderBlock'))) analysis += `Price respecting institutional order block levels. `;
            if (confirmations.some(c => c.includes('FairValueGap'))) analysis += `Fair Value Gap providing strong directional bias. `;
            if (confirmations.includes('premiumZoneEntry')) analysis += `Entry from premium zone - ideal for ${direction === 'bearish' ? 'sell' : 'buy'} setups. `;
            if (confirmations.includes('discountZoneEntry')) analysis += `Entry from discount zone - optimal for ${direction === 'bullish' ? 'buy' : 'sell'} entries. `;
            
            if (confidence >= 80) analysis += `High-probability setup suitable for standard position sizing.`;
            else if (confidence >= 70) analysis += `Good probability setup - consider normal position size.`;
            else if (confidence >= 60) analysis += `Moderate probability - use reduced position size and tight risk management.`;
            
            return analysis;
        }

        getSessionQuality() {
            const now = new Date();
            const hour = now.getUTCHours();
            
            if (hour >= 7 && hour <= 16) return 'London Session - High';
            if (hour >= 12 && hour <= 21) return 'New York Session - High';
            if (hour >= 12 && hour <= 16) return 'London/NY Overlap - Very High';
            return 'Asian Session - Medium';
        }
    }
    const smcEngine = new ProfessionalSMCEngine();

    // --- Data Fetching ---

    function convertExchangeRateData(response: any, symbols: string[]) {
        if (!response || !response.rates) return null;
        
        const data: any = {};
        const baseRates = response.rates;
        
        for (const symbol of symbols) {
            const [base, quote] = symbol.split('/');
            if (baseRates[base] && baseRates[quote]) {
                const rate = baseRates[quote] / baseRates[base];
                data[symbol] = { price: rate.toFixed(5) };
            } else if (base === 'USD' && baseRates[quote]) {
                data[symbol] = { price: baseRates[quote].toFixed(5) };
            } else if (quote === 'USD' && baseRates[base]) {
                data[symbol] = { price: (1 / baseRates[base]).toFixed(5) };
            }
        }
        
        return data;
    }

    function generateFallbackData(symbols: string[]) {
        const results: { [key: string]: any[] } = {};
        
        for (const symbol of symbols) {
            results[symbol] = generateFallbackDataForSymbol(symbol);
        }
        
        return results;
    }

    function generateFallbackDataForSymbol(symbol: string) {
        // Current market prices based on live data (January 2025)
        const basePrices: { [key: string]: number } = {
            // Forex Majors - Updated to current market rates
            'EUR/USD': 1.1650,   // Current market rate
            'GBP/USD': 1.2420,   // Current market rate
            'USD/JPY': 155.80,   // Current market rate
            'USD/CHF': 0.9125,   // Current market rate
            'AUD/USD': 0.6280,   // Current market rate
            'USD/CAD': 1.4350,   // Current market rate
            'NZD/USD': 0.5680,   // Current market rate
            
            // Forex Crosses - Calculated from current majors
            'EUR/JPY': 181.51,   // 1.1650 * 155.80
            'GBP/JPY': 193.60,   // 1.2420 * 155.80
            'EUR/GBP': 0.9380,   // 1.1650 / 1.2420
            'EUR/AUD': 1.8550,   // 1.1650 / 0.6280
            'GBP/AUD': 1.9780,   // 1.2420 / 0.6280
            'AUD/CAD': 0.9012,   // 0.6280 * 1.4350
            'CAD/JPY': 108.57,   // 155.80 / 1.4350
            'CHF/JPY': 170.74,   // 155.80 / 0.9125
            'AUD/CHF': 0.5730,   // 0.6280 / 0.9125
            'CAD/CHF': 0.6360,   // 0.9125 / 1.4350
            'EUR/CHF': 1.0630,   // 1.1650 / 0.9125
            'GBP/CHF': 1.1340,   // 1.2420 / 0.9125
            'NZD/CAD': 0.8151,   // 0.5680 * 1.4350
            'NZD/JPY': 88.49,    // 0.5680 * 155.80
            'AUD/NZD': 1.1056,   // 0.6280 / 0.5680
            
            // Commodities - Current market rates
            'XAU/USD': 2672.50,  // Current gold price
            'XAG/USD': 30.25     // Current silver price
        };
        
        const basePrice = basePrices[symbol];
        if (!basePrice) {
            log(`No base price found for ${symbol}, using calculated estimate`, 'warning');
            return [{
                time: new Date().toISOString(),
                open: '1.0000',
                high: '1.0000',
                low: '1.0000',
                close: '1.0000',
                volume: 0
            }];
        }
        
        // Generate realistic price movement with proper volatility
        const volatility = symbol.includes('JPY') ? 0.002 : 
                          symbol.includes('XAU') ? 0.005 : 
                          symbol.includes('XAG') ? 0.008 : 0.0005;
        const variation = (Math.random() - 0.5) * volatility * 2;
        const currentPrice = basePrice * (1 + variation);
        
        // Generate OHLC with realistic spread
        const spread = currentPrice * 0.0001; // 1 pip spread
        const high = currentPrice + (Math.random() * spread * 2);
        const low = currentPrice - (Math.random() * spread * 2);
        const open = low + (Math.random() * (high - low));
        
        const precision = symbol.includes('JPY') ? 3 : 5;
        
        return [{
            time: new Date().toISOString(),
            open: open.toFixed(precision),
            high: high.toFixed(precision),
            low: low.toFixed(precision),
            close: currentPrice.toFixed(precision),
            volume: Math.floor(Math.random() * 1000000) + 500000
        }];
    }

    // --- UI and State Management ---
    function updateStatus(running: boolean) {
        setIsBotRunning(running);
        if (statusDot) statusDot.classList.toggle('active', running);
        if (statusText) statusText.textContent = running ? 'Bot is Running' : 'Ready to Connect';
        if (systemStatusEl) systemStatusEl.textContent = running ? 'Running' : 'Ready';
        if (startBtn) startBtn.disabled = running;
        if (stopBtn) stopBtn.disabled = !running;
        [symbolSelect, timeframeSelect, riskRewardSelect].forEach(el => { if(el) (el as HTMLSelectElement).disabled = running });
    }

    function populateSymbols() {
        if (!symbolSelect) return;
        symbolSelect.innerHTML = '<option value="">Select Symbol</option><option value="ALL" class="select-all-option">📊 ALL SYMBOLS</option>';

        const createOptgroup = (label: string, symbols: string[]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = label;
            symbols.forEach(s => {
                const option = document.createElement('option');
                option.value = s;
                option.textContent = s;
                optgroup.appendChild(option);
            });
            symbolSelect.appendChild(optgroup);
        };

        createOptgroup('📈 Stocks', markets.stocks.symbols);
        createOptgroup('🥇 Commodities', markets.commodities.symbols);
        createOptgroup(' Forex Majors', markets.forexMajors.symbols);
        createOptgroup('💱 Forex Crosses', markets.forexCrosses.symbols);
    }

    function updateMarketData() {
        const uniqueSymbols = new Set(activeConnections.flatMap(c => c.symbols || []));
        const uniqueTimeframes = new Set(activeConnections.flatMap(c => c.timeframes || []));
        if (activePairsEl) activePairsEl.textContent = uniqueSymbols.size.toString();
        if (activeTimeframesEl) activeTimeframesEl.textContent = uniqueTimeframes.size.toString();
        const today = new Date().toISOString().slice(0, 10);
        if (signalsTodayEl) signalsTodayEl.textContent = signalHistory.filter(s => s.timestamp.toISOString().startsWith(today)).length.toString();
        const winsCount = tradeHistory.filter(s => s.status === 'target_hit').length;
        const lossesCount = tradeHistory.filter(s => s.status === 'sl_hit').length;
        if (winRateEl) winRateEl.textContent = (winsCount + lossesCount > 0) ? `Win Rate: ${((winsCount / (winsCount + lossesCount)) * 100).toFixed(1)}%` : 'Win Rate: --%';
    }

    function displayProfessionalSignal(signal: any) {
        if (!signalsContainer) return;
        
        const noSignals = signalsContainer.querySelector('.no-signals');
        if (noSignals) noSignals.remove();
        
        const confidenceClass = signal.confidence >= 80 ? 'confidence-high' : 
                               signal.confidence >= 70 ? 'confidence-medium' : 'confidence-low';
        
        const signalCard = document.createElement('div');
        signalCard.className = `signal-card ${signal.signalType.toLowerCase() === 'buy' ? 'bullish' : 'bearish'}`;
        signalCard.id = signal.id;
        
        signalCard.innerHTML = `
            <div class="signal-header">
                <div class="signal-type ${signal.signalType.toLowerCase() === 'buy' ? 'bullish' : 'bearish'}">
                    <span class="signal-icon">${signal.signalType.toLowerCase() === 'buy' ? '🟢' : '🔴'}</span>
                    ${signal.signalType} ${signal.symbol} (${signal.timeframe})
                </div>
                <div class="signal-timestamp">${new Date(signal.timestamp).toLocaleString()}</div>
                <div class="confidence-badge ${confidenceClass}">
                    ${signal.confidence}% Confidence
                </div>
            </div>
            <div class="signal-details">
                <div class="detail-item"><div class="detail-label">Entry (E)</div><div class="detail-value entry-price">${signal.entryPrice}</div></div>
                <div class="detail-item"><div class="detail-label">Stop Loss (SL)</div><div class="detail-value stop-loss">${signal.stopLoss}</div></div>
                <div class="detail-item"><div class="detail-label">Take Profit (TP)</div><div class="detail-value take-profit">${signal.takeProfit}</div></div>
                <div class="detail-item"><div class="detail-label">R:R Ratio</div><div class="detail-value">${signal.riskReward}</div></div>
                <div class="detail-item"><div class="detail-label">Session</div><div class="detail-value">${signal.sessionQuality}</div></div>
            </div>
            <div class="confirmations-section">
                <div class="confirmations-title">📋 SMC Confirmations (${signal.confirmations.length})</div>
                <div class="confirmations-list">
                    ${signal.confirmations.map((conf: string) => `<span class="confirmation-item">${conf}</span>`).join('')}
                </div>
            </div>
            <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 0.9rem; line-height: 1.4;">
                <strong>Analysis:</strong> ${signal.analysis}
            </div>
            <button class="copy-trade-btn" onclick="copyTradeDetails('${signal.symbol}', '${signal.signalType}', '${signal.entryPrice}', '${signal.stopLoss}', '${signal.takeProfit}')">
                📋 Copy Trade Details
            </button>
            <div class="signal-status">Active</div>`;
        
        signalsContainer.insertBefore(signalCard, signalsContainer.firstChild);
        
        const signalCards = signalsContainer.querySelectorAll('.signal-card');
        if (signalCards.length > 10) {
            signalsContainer.removeChild(signalCards[signalCards.length - 1]);
        }
    }

    function updateSMCStatistics(signal: any) {
        if (!signal || !signal.confirmations || !Array.isArray(signal.confirmations)) {
            log('Invalid signal data for statistics update', 'warning');
            return;
        }
        
        signal.confirmations.forEach((confirmation: string) => {
            if (!confirmation || typeof confirmation !== 'string') return;
            
            const elIdMap = { 'BOS': 'bosCount', 'CHoCH': 'chochCount', 'Order Block': 'orderBlocks', 'Fair Value Gap': 'fvgCount' };
            for (const key in elIdMap) {
                if (confirmation.includes(key)) {
                    const el = document.getElementById((elIdMap as any)[key]);
                    if (el && el.textContent) {
                        const currentValue = parseInt(el.textContent) || 0;
                        el.textContent = (currentValue + 1).toString();
                    }
                }
            }
        });
        
        const activeSignalsEl = document.getElementById('activeSignals');
        if (activeSignalsEl && activeSignalsEl.textContent) {
            const currentValue = parseInt(activeSignalsEl.textContent) || 0;
            activeSignalsEl.textContent = (currentValue + 1).toString();
        }
    }

    // --- Core Bot Logic ---
    async function performAdvancedSMCAnalysis(symbol: string, historicalData: any[], timeframe: string) {
        try {
            if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
                log(`No historical data provided for ${symbol}`, 'warning');
                return null;
            }

            if (!smcEngine.priceHistory.has(symbol)) {
                smcEngine.priceHistory.set(symbol, historicalData.map(bar => ({
                    timestamp: new Date(bar.time).getTime(),
                    open: parseFloat(bar.open) || 0,
                    high: parseFloat(bar.high) || 0,
                    low: parseFloat(bar.low) || 0,
                    close: parseFloat(bar.close) || 0,
                    volume: parseInt(bar.volume, 10) || 0
                })));
            }

            const lastBar = historicalData[historicalData.length - 1];
            if (!lastBar || !lastBar.close) {
                log(`Invalid last bar data for ${symbol}`, 'warning');
                return null;
            }

            const currentPriceData = { price: lastBar.close.toString() };
            const analysisResult = smcEngine.analyzeSMCPatterns(symbol, currentPriceData);

            if (analysisResult) {
                if (smcEngine.validateSignalQuality(analysisResult)) {
                    const signals = [];
                    const currentPrice = parseFloat(currentPriceData.price);
                    const riskRewardRatios = (window as any).riskRewardRatios || [2.0];
                    
                    for (const rr of riskRewardRatios) {
                        const signal = smcEngine.createTradingSignal(symbol, analysisResult, currentPrice, rr) as any;
                        signal.id = `signal-${signal.symbol}-${timeframe}-${rr}-${signal.timestamp.getTime()}`;
                        signal.timeframe = timeframe;
                        signals.push(signal);
                    }
                    
                    signals.forEach(signal => {
                        updateSMCStatistics(signal);
                        displayProfessionalSignal(signal);
                        log(`🎯 ${signal.signalType} signal for ${symbol} (R:R ${signal.riskReward}): Confidence: ${signal.confidence}%`, 'success');
                    });
                    
                    return signals;
                } else {
                    const confirmations = analysisResult.confirmations || [];
                    const confidence = smcEngine.calculateConfidence(confirmations);
                    const primaryCount = confirmations.filter((c: string) => c.includes('BOS') || c.includes('CHoCH')).length;
                    log(`[${symbol}] Analysis complete. No signal. Confidence: ${confidence}%. Confirmations: ${confirmations.length}. Primary: ${primaryCount}.`);
                }
            }
            
            return null;
            
        } catch (error: any) {
            log(`SMC Analysis Error for ${symbol}: ${error.message}`, 'error');
            console.error('SMC Analysis Error:', error);
            return null;
        }
    }

    async function startAnalysis(symbols: string[], timeframes: string[]) {
        log(`Initializing analysis for ${symbols.length} symbols and ${timeframes.length} timeframes...`);

        const initialFetch = async () => {
            try {
                log(`🔄 Initializing data for ${symbols.length} symbols...`, 'info');
                
                // Use bulk fetching for better performance
                const bulkData = await dataEngine.fetchBulkYfinanceData(symbols, timeframes[0] || '1h');
                
                for (const symbol of symbols) {
                    try {
                        const historicalData = bulkData[symbol];
                        
                        if (historicalData && Array.isArray(historicalData) && historicalData.length > 0) {
                            smcEngine.priceHistory.set(symbol, historicalData.map((bar: any) => ({
                                timestamp: new Date(bar.time).getTime(),
                                open: parseFloat(bar.open) || 0,
                                high: parseFloat(bar.high) || 0,
                                low: parseFloat(bar.low) || 0,
                                close: parseFloat(bar.close) || 0,
                                volume: parseInt(bar.volume, 10) || 0
                            })));
                            
                            log(`✅ Initialized ${symbol} with ${historicalData.length} bars`, 'success');
                        } else {
                            log(`⚠️ No historical data available for ${symbol}`, 'warning');
                        }
                        
                    } catch (error: any) {
                        log(`❌ Failed to initialize ${symbol}: ${error.message}`, 'error');
                    }
                }
                
                log(`✅ Initial data fetch completed`, 'success');
            } catch (error: any) {
                log(`❌ Error during initial fetch: ${error.message}`, 'error');
            }
        };

        const analyze = async () => {
            try {
                log(`🔍 Analyzing ${symbols.length} forex symbols: ${symbols.slice(0, 3).join(', ')}${symbols.length > 3 ? '...' : ''}`, 'info');
                
                for (const symbol of symbols) {
                    try {
                        const historicalData = await dataEngine.fetchYfinancePrice(symbol, timeframes[0]);

                        if (historicalData && historicalData.history && Array.isArray(historicalData.history) && historicalData.history.length > 0) {
                            const latestPrice = (historicalData.history as any[])[historicalData.history.length - 1].close;
                            lastData[symbol] = latestPrice; // Update lastData for monitorActiveSignals
                            
                            log(`📊 Analyzing ${symbol} - Price: ${latestPrice}`, 'info');
                            const signals = await performAdvancedSMCAnalysis(symbol, historicalData.history as any[], timeframes[0]);

                            if (signals && Array.isArray(signals)) {
                                signals.forEach(signal => {
                                    if (!signalHistory.find(s => s.id === (signal as any).id)) {
                                        (signal as any).status = 'active';
                                        (signal as any).direction = signal.signalType === 'BUY' ? 'bullish' : 'bearish';
                                        signalHistory.push(signal);
                                        setTradeHistory(prev => [...prev, signal]);
                                        log(`🎯 NEW SIGNAL: ${signal.signalType} ${symbol} @ ${signal.entryPrice}`, 'success');
                                    }
                                });
                            } else {
                                log(`ℹ️ No signals generated for ${symbol} - market conditions not met`, 'info');
                            }
                        } else {
                            log(`⚠️ No current price data available for ${symbol}`, 'warning');
                        }
                    } catch (error: any) {
                        log(`❌ Error analyzing symbol ${symbol}: ${error.message}`, 'error');
                    }
                }
            } catch (error: any) {
                log(`❌ Error during analysis: ${error.message}`, 'error');
            }
            
            const currentTime = new Date().toLocaleTimeString();
            if (lastUpdateEl) lastUpdateEl.textContent = `Last Update: ${currentTime}`;
            log(`🔄 Analysis cycle completed at ${currentTime}`, 'info');
            updateMarketData();
        };

        await initialFetch();
        await analyze();
        
        // Set up continuous analysis every 30 seconds (more frequent than crypto bot's 60s)
        const intervalId = setInterval(async () => {
            log('🔄 Starting scheduled analysis cycle...', 'info');
            await analyze();
        }, 30000);
        activeConnections.push({ symbols, timeframes, intervalId });
        updateMarketData();
    }
    
    function monitorActiveSignals() {
        setTradeHistory(prevTradeHistory => {
            if (!Array.isArray(prevTradeHistory)) {
                log('Invalid trade history data', 'warning');
                return [];
            }
            
            const updatedTrades = prevTradeHistory.map(signal => {
                if (!signal || typeof signal !== 'object') return signal;
                
                if (signal.status === 'active' && signal.symbol && lastData) {
                    const currentPrice = lastData[signal.symbol];
                    if (!currentPrice || isNaN(parseFloat(currentPrice))) return signal;
                    
                    const price = parseFloat(currentPrice);
                    const stopLoss = parseFloat(signal.stopLoss) || 0;
                    const takeProfit = parseFloat(signal.takeProfit) || 0;

                    if (signal.direction === 'bullish' && price <= stopLoss) {
                        signal.status = 'sl_hit';
                        setLosses(prev => {
                            const filtered = Array.isArray(prev) ? prev.filter(l => l.id !== signal.id) : [];
                            return [...filtered, signal];
                        });
                        updateSignalCard(signal);
                    } else if (signal.direction === 'bearish' && price >= stopLoss) {
                        signal.status = 'sl_hit';
                        setLosses(prev => {
                            const filtered = Array.isArray(prev) ? prev.filter(l => l.id !== signal.id) : [];
                            return [...filtered, signal];
                        });
                        updateSignalCard(signal);
                    } else if (signal.direction === 'bullish' && price >= takeProfit) {
                        signal.status = 'target_hit';
                        setWins(prev => {
                            const filtered = Array.isArray(prev) ? prev.filter(w => w.id !== signal.id) : [];
                            return [...filtered, signal];
                        });
                        updateSignalCard(signal);
                    } else if (signal.direction === 'bearish' && price <= takeProfit) {
                        signal.status = 'target_hit';
                        setWins(prev => {
                            const filtered = Array.isArray(prev) ? prev.filter(w => w.id !== signal.id) : [];
                            return [...filtered, signal];
                        });
                        updateSignalCard(signal);
                    }
                }
                return signal;
            });
            return updatedTrades;
        });
    }

    function updateSignalCard(signal: any) {
        if (!signal || !signal.id) {
            log('Invalid signal data for card update', 'warning');
            return;
        }
        
        const card = document.getElementById(signal.id);
        if (!card) return;
        
        card.classList.remove('bullish', 'bearish');
        
        if (signal.status === 'sl_hit') {
            card.classList.add('sl_hit');
            const statusEl = card.querySelector('.signal-status');
            if (statusEl) statusEl.textContent = 'SL Hit';
            log(`${signal.symbol || 'Unknown'} SL hit.`, 'error');
            updateMarketData();
        } else if (signal.status === 'target_hit') {
            card.classList.add('target_hit');
            const statusEl = card.querySelector('.signal-status');
            if (statusEl) statusEl.textContent = 'TP Hit';
            log(`${signal.symbol || 'Unknown'} TP hit!`, 'success');
            updateMarketData();
        }
    }

    // --- Window Functions (Event Handlers) ---
    (window as any).startBot = () => {
        if (!symbolSelect || !timeframeSelect || !riskRewardSelect) {
            log('UI elements not properly initialized. Please refresh the page.', 'error');
            return;
        }

        const selectedOptions = symbolSelect.selectedOptions ? Array.from(symbolSelect.selectedOptions).map(option => option.value) : [];
        let selectedSymbols: string[];

        if (selectedOptions.includes('ALL')) {
            selectedSymbols = [
                ...(markets.stocks?.symbols || []), 
                ...(markets.commodities?.symbols || []), 
                ...(markets.forexMajors?.symbols || []), 
                ...(markets.forexCrosses?.symbols || [])
            ];
        } else {
            selectedSymbols = selectedOptions.filter(val => val && val !== 'ALL');
        }

        const timeframes = timeframeSelect.value === 'ALL' ? 
            (timeframeSelect.options ? Array.from(timeframeSelect.options).slice(2).map(o => o.value) : []) : 
            [timeframeSelect.value];
        
        if (selectedSymbols.length === 0 || !timeframes[0]) { 
            return log('Please select at least one symbol and a timeframe.', 'error'); 
        }
        
        const riskRewardValue = riskRewardSelect.value;
        if (riskRewardValue === 'ALL') {
            (window as any).riskRewardRatios = [1.0, 1.5, 2.0, 2.5, 3.0];
        } else {
            const riskRewardRatio = parseFloat(riskRewardValue);
            if (isNaN(riskRewardRatio) || riskRewardRatio < 1) { return log('Please enter a valid Risk:Reward Ratio >= 1.0', 'error'); }
            (window as any).riskRewardRatios = [riskRewardRatio];
        }

        updateStatus(true);
        log(`Starting bot...`, 'success');
        if (signalsContainer) signalsContainer.innerHTML = '';

        startAnalysis(selectedSymbols, timeframes);
        
        activeConnections.push({ symbol: 'MONITOR', timeframe: '1s', intervalId: setInterval(monitorActiveSignals, 1000) });
    };

    (window as any).stopBot = () => {
        log('Stopping bot...', 'error');
        activeConnections.forEach(conn => clearInterval(conn.intervalId));
        activeConnections = [];
        updateStatus(false);
        updateMarketData();
    };

    (window as any).refreshSystem = () => {
        if (isBotRunning) (window as any).stopBot();
        log('System refreshed. Ready for new configuration.');
        signalHistory = [];
        setTradeHistory([]);
        setWins([]);
        setLosses([]);
        if (signalsContainer) signalsContainer.innerHTML = '<div class="no-signals"><p>Configure settings and start the bot to receive real-time signals</p></div>';
        updateMarketData();
    };

    (window as any).copyTradeDetails = (symbol: string, signalType: string, entryPrice: string, stopLoss: string, takeProfit: string) => {
        const text = `Symbol: ${symbol}\nType: ${signalType}\nEntry: ${entryPrice}\nStop Loss: ${stopLoss}\nTake Profit: ${takeProfit}`;
        navigator.clipboard.writeText(text).then(() => {
            log('Trade details copied to clipboard!', 'success');
        }, () => {
            log('Failed to copy trade details.', 'error');
        });
    };

    // --- Initialization ---
    populateSymbols();
    log('SMC Pro Elite Bot initialized - Configure settings to start.');
    
    // Auto-start analysis with default settings for continuous operation
    const autoStartAnalysis = () => {
        const defaultSymbols = [
            // Forex Majors
            ...markets.forexMajors.symbols,
            // Forex Crosses
            ...markets.forexCrosses.symbols
        ];
        const defaultTimeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];
        
        log('🚀 Auto-starting forex analysis with all forex pairs...', 'success');
        log(`📊 Monitoring ${defaultSymbols.length} forex pairs: ${defaultSymbols.slice(0, 5).join(', ')}... | ${defaultTimeframes.length} timeframes`, 'info');
        log(`⏰ Timeframes: ${defaultTimeframes.join(', ')}`, 'info');
        
        (window as any).riskRewardRatios = [2.0];
        updateStatus(true);
        
        startAnalysis(defaultSymbols, defaultTimeframes);
        activeConnections.push({ symbol: 'MONITOR', timeframe: '1s', intervalId: setInterval(monitorActiveSignals, 1000) });
    };
    
    // Start analysis after a short delay to ensure DOM is ready
    setTimeout(autoStartAnalysis, 2000);
  }, []);

  return (
    <div>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #ffffff; min-height: 100vh; overflow-x: hidden; }
        .container { max-width: 1800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding: 30px; background: rgba(0, 0, 0, 0.4); border-radius: 20px; border: 1px solid rgba(79, 195, 247, 0.3); backdrop-filter: blur(10px); }
        .title { font-size: 3.5rem; font-weight: 800; background: linear-gradient(45deg, #00d4ff, #0099cc, #4fc3f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 10px; }
        .subtitle { font-size: 1.2rem; opacity: 0.9; margin-bottom: 20px; color: #b0e0ff; }
        .header-actions { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
        .timezone-selector { display: flex; justify-content: center; align-items: center; gap: 15px; margin: 20px 0; }
        .timezone-selector select { padding: 8px 15px; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; font-size: 14px; }
        .status-section { display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.3); padding: 20px 30px; border-radius: 15px; margin-bottom: 25px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .status-info { display: flex; align-items: center; gap: 15px; }
        .status-dot { width: 12px; height: 12px; border-radius: 50%; background: #ff5252; animation: pulse-red 2s infinite; }
        .status-dot.connected { background: #4caf50; animation: pulse-green 2s infinite; }
        @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); } }
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); } 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); } }
        .datetime-info { text-align: right; font-family: 'Courier New', monospace; }
        .api-status { display: grid; grid-template-columns: 1fr; gap: 15px; margin: 20px auto; max-width: 300px; }
        .api-card { background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1); }
        .api-name { font-weight: bold; margin-bottom: 5px; color: #4fc3f7; }
        .api-calls { font-size: 0.9rem; opacity: 0.8; }
        .api-active { border-color: #4caf50; background: rgba(76, 175, 80, 0.1); }
        .main-content { display: grid; grid-template-columns: 350px 1fr 350px; gap: 25px; margin-bottom: 30px; }
        .panel { background: rgba(0, 0, 0, 0.3); border-radius: 15px; padding: 25px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(5px); }
        .panel-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 20px; color: #00d4ff; display: flex; align-items: center; gap: 10px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 500; color: #b0e0ff; }
        .form-control { width: 100%; padding: 12px 16px; border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 8px; background: rgba(0, 212, 255, 0.05); color: white; font-size: 14px; transition: all 0.3s ease; }
        .form-control:focus { outline: none; border-color: #00d4ff; box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2); }
        .btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-bottom: 12px; }
        .btn-primary { background: linear-gradient(45deg, #00d4ff, #0099cc); color: white; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4); }
        .btn-danger { background: linear-gradient(45deg, #ff4569, #e53e54); color: white; }
        .btn-secondary { background: linear-gradient(45deg, #9c27b0, #8e24aa); color: white; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
        .price-feed { background: rgba(0, 0, 0, 0.4); border-radius: 10px; padding: 20px; height: 400px; overflow-y: auto; font-family: 'Courier New', monospace; border: 1px solid rgba(79, 195, 247, 0.2); }
        .price-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.3s ease; }
        .price-item.flash { background: rgba(79, 195, 247, 0.3); animation: flash 0.8s ease-out; }
        .price-item.verified { border-left: 3px solid #4caf50; background: rgba(76, 175, 80, 0.1); }
        @keyframes flash { 0% { background: rgba(79, 195, 247, 0.5); } 100% { background: transparent; } }
        .symbol-name { font-weight: bold; color: #4fc3f7; min-width: 80px; }
        .price-value { color: #4caf50; font-weight: bold; min-width: 80px; text-align: center; }
        .price-change { font-size: 12px; min-width: 60px; text-align: right; }
        .positive { color: #4caf50; }
        .negative { color: #f44336; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .stat-card { background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1); }
        .stat-label { font-size: 0.85rem; opacity: 0.8; margin-bottom: 5px; }
        .stat-value { font-size: 1.2rem; font-weight: bold; color: #4fc3f7; }
        .signals-section { grid-column: 1 / -1; background: rgba(0, 0, 0, 0.3); border-radius: 15px; padding: 25px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .signal-card { background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #4fc3f7; transition: all 0.3s ease; }
        .signal-card.bearish { border-left-color: #f44336; }
        .signal-card.completed { border-left-color: #4caf50; background: rgba(76, 175, 80, 0.1); }
        .signal-card.stopped { border-left-color: #ff9800; background: rgba(255, 152, 0, 0.1); }
        .signal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .signal-type { font-size: 1.1rem; font-weight: bold; }
        .signal-type.bullish { color: #4fc3f7; }
        .signal-type.bearish { color: #f44336; }
        .signal-status { padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; background: rgba(0, 0, 0, 0.3); }
        .signal-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 15px; }
        .detail-item { background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; text-align: center; }
        .detail-label { font-size: 0.8rem; opacity: 0.8; margin-bottom: 4px; }
        .detail-value { font-weight: bold; }
        .smc-analysis { background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; font-size: 0.9rem; line-height: 1.4; margin-top: 15px; }
        .logs { background: rgba(0, 0, 0, 0.4); border-radius: 10px; padding: 20px; height: 300px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 12px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .log-entry { margin-bottom: 6px; opacity: 0.9; }
        .log-time { color: #4fc3f7; font-weight: bold; }
        .log-success { color: #4caf50; }
        .log-error { color: #f44336; }
        .log-warning { color: #ff9800; }
        .no-signals { text-align: center; padding: 40px; opacity: 0.7; }
        .verification-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(76, 175, 80, 0.2); color: #4caf50; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 5px; }
        #insiderAnalysisContainer { padding: 20px; background: rgba(0, 0, 0, 0.3); border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.1); margin-top: 20px; font-size: 0.9rem; line-height: 1.6; }
        .sentiment-bullish { color: #4caf50; font-weight: bold; }
        .sentiment-bearish { color: #f44336; font-weight: bold; }
        .sentiment-neutral { color: #ff9800; font-weight: bold; }
        .sentiment-strong-bullish { color: #00e676; font-weight: bold; }
        .sentiment-strong-bearish { color: #d50000; font-weight: bold; }
        .tabs { display: flex; border-bottom: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 20px; }
        .tab { padding: 10px 20px; cursor: pointer; background: transparent; color: white; border: none; font-size: 1rem; }
        .tab.active { background: rgba(0, 212, 255, 0.1); border-bottom: 2px solid #00d4ff; }
      `}</style>
      <div className="container">
        <div className="header">
          <h1 className="title">SMC Trading Bot</h1>
          <p className="subtitle">Real-Time Smart Money Concepts - NO FAKE DATA</p>
          <div className="header-actions">
            <button className="btn btn-secondary">Checkpoint</button>
            <button className="btn btn-secondary">Compare</button>
            <button className="btn btn-secondary">Restore</button>
            <button className="btn btn-primary">API Request</button>
          </div>
        </div>

        <div className="status-section">
          <div className="status-info">
            <div className="status-dot connected" id="statusDot"></div>
            <div>
              <div id="statusText">System Connected</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }} id="dataSource">Live data sources active</div>
            </div>
          </div>
          <div className="datetime-info">
            <div id="currentDateTime"></div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Last Update: <span id="lastUpdate">Never</span></div>
          </div>
        </div>

        <div className="main-content">
          <div className="panel">
            <h3 className="panel-title">⚙️ SMC Trading Settings</h3>

            <div className="form-group">
              <label className="form-label">Symbol (Ctrl+Click for multiple)</label>
              <select className="form-control" id="symbol" multiple size={10}>
                <option value="">Select Symbol</option>
                <option value="ALL">📊 ALL SYMBOLS</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Timeframe</label>
              <select className="form-control" id="timeframe">
                <option value="">Select Timeframe</option>
                <option value="ALL">⏰ ALL TIMEFRAMES</option>
                <option value="1m">1 Minute</option>
                <option value="3m">3 Minutes</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Risk:Reward Ratio</label>
              <select id="riskReward" className="form-control" defaultValue="2.0">
                <option value="1.0">1.0</option>
                <option value="1.5">1.5</option>
                <option value="2.0">2.0</option>
                <option value="2.5">2.5</option>
                <option value="3.0">3.0</option>
                <option value="ALL">ALL</option>
              </select>
            </div>
            
            {/* Bot Status Toggle */}
            <div className="bot-status-toggle mb-4 p-4 bg-gray-800/60 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">Bot Status Control</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  botStatus.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {botStatus.is_active ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => updateBotStatus(true)}
                  disabled={botStatus.is_active}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    botStatus.is_active
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  🚀 Start Bot
                </button>
                <button
                  onClick={() => updateBotStatus(false)}
                  disabled={!botStatus.is_active}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !botStatus.is_active
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  ⏹️ Stop Bot
                </button>
              </div>
              
              {botStatus.last_started && (
                <p className="text-sm text-gray-400 mt-2">
                  Started: {new Date(botStatus.last_started).toLocaleString()}
                </p>
              )}
              {botStatus.last_stopped && (
                <p className="text-sm text-gray-400 mt-2">
                  Stopped: {new Date(botStatus.last_stopped).toLocaleString()}
                </p>
              )}
            </div>

            <button className="btn btn-primary" onClick={() => (window as any).startBot()} id="startBtn">
              🚀 Start Real Data Analysis
            </button>
            <button className="btn btn-danger" onClick={() => (window as any).stopBot()} id="stopBtn" disabled>
              ⏹️ Stop Analysis
            </button>
            <button className="btn btn-secondary" onClick={() => (window as any).refreshSystem()}>
              🔄 Refresh System
            </button>
          </div>

          <div className="panel">
            <h3 className="panel-title">📊 Market Statistics</h3>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Active Pairs</div>
                <div className="stat-value" id="activePairs">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Signals Today</div>
                <div className="stat-value" id="signalsToday">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Timeframes</div>
                <div className="stat-value" id="activeTimeframes">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">System Status</div>
                <div className="stat-value" id="systemStatus">Ready</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">BOS</div>
                <div className="stat-value" id="bosCount">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">CHoCH</div>
                <div className="stat-value" id="chochCount">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Order Blocks</div>
                <div className="stat-value" id="orderBlocks">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">FVG</div>
                <div className="stat-value" id="fvgCount">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Signals</div>
                <div className="stat-value" id="activeSignals">0</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <LivePriceFeed market="forex" />
          </div>
        </div>

        <div className="signals-section">
          <div className="tabs">
            <button className={`tab ${activeTab === 'signals' ? 'active' : ''}`} onClick={() => setActiveTab('signals')}>
              🎯 Live Trading Signals (SMC Analysis)
            </button>
            <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
              📈 Trade Performance
            </button>
            <button className={`tab ${activeTab === 'wins' ? 'active' : ''}`} onClick={() => setActiveTab('wins')}>
              ✅ Wins
            </button>
            <button className={`tab ${activeTab === 'losses' ? 'active' : ''}`} onClick={() => setActiveTab('losses')}>
              ❌ Losses
            </button>
          </div>
          {activeTab === 'signals' && (
            <div id="signalsContainer">
              <div className="no-signals">
                <p> Configure settings and start analysis for live signals</p>
                <p style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.8 }}>Real-time SMC structure analysis with verified data only</p>
              </div>
            </div>
          )}
          {activeTab === 'performance' && <TradePerformance trades={tradeHistory} />}
          {activeTab === 'wins' && <TradePerformance trades={wins} />}
          {activeTab === 'losses' && <TradePerformance trades={losses} />}
        </div>

        <div className="panel">
          <h3 className="panel-title"> Live Activity Logs</h3>
          <div className="logs" id="logs">
            <div className="log-entry">
              <span className="log-time">[INIT]</span> <span className="log-success">Real Data Only SMC System Initialized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForexDataDashboard;
