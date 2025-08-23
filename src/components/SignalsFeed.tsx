import React, { useState, useEffect, useMemo } from 'react';
import { Signal, TradeOutcome } from '../trading/types';
import api from '../api';
import { useUser } from '../contexts/UserContext';
import SignalCard from './SignalCard';
import io from 'socket.io-client';


interface SignalsFeedProps {
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
}


const SignalsFeed: React.FC<SignalsFeedProps> = ({ onMarkAsTaken, onAddToJournal, onChatWithNexus }) => {
  const { user } = useUser();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [winningTrades, setWinningTrades] = useState<Signal[]>([]);
  const [losingTrades, setLosingTrades] = useState<Signal[]>([]);
  const [skippedTrades, setSkippedTrades] = useState<Signal[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [manualPnl, setManualPnl] = useState('');
  const [takenSignalIds, setTakenSignalIds] = useState<string[]>([]);
  const [skippedSignalIds, setSkippedSignalIds] = useState<string[]>([]);
  const [dailyLossLimitHit, setDailyLossLimitHit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const signalsPerPage = 20;
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    if (day === 0 || day === 6) {
      setIsWeekend(true);
    }

    const fetchSignals = async () => {
      try {
        const response = await api.get('/signals');
        if (response.data && Array.isArray(response.data)) {
          const sortedSignals = response.data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setSignals(sortedSignals);
        }
      } catch (error) {
        console.error('Error fetching signals:', error);
      }
    };

    fetchSignals();

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

    socket.on('newSignal', (newSignal) => {
      setSignals((prevSignals) => [newSignal, ...prevSignals]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('persistentSignals', JSON.stringify(signals));
  }, [signals]);

  useEffect(() => {
    localStorage.setItem('persistentWinningTrades', JSON.stringify(winningTrades));
  }, [winningTrades]);

  useEffect(() => {
    localStorage.setItem('persistentLosingTrades', JSON.stringify(losingTrades));
  }, [losingTrades]);

  useEffect(() => {
    localStorage.setItem('persistentSkippedTrades', JSON.stringify(skippedTrades));
  }, [skippedTrades]);

  useEffect(() => {
    localStorage.setItem('persistentTakenSignalIds', JSON.stringify(takenSignalIds));
  }, [takenSignalIds]);

  useEffect(() => {
    localStorage.setItem('persistentSkippedSignalIds', JSON.stringify(skippedSignalIds));
  }, [skippedSignalIds]);


  const handleMarkAsTakenClick = (signal: Signal) => {
    setTakenSignalIds(prev => [...prev, signal.id]);
    setSelectedSignal(signal);
    setShowOutcomeModal(true);
  };


  const handleSkipTrade = (signal: Signal) => {
    setSkippedTrades(prev => [...prev, signal]);
    setSkippedSignalIds(prev => [...prev, signal.id]);
  };


  const handleAddToJournalClick = () => {
    if (selectedSignal) {
      onAddToJournal(selectedSignal);
      setShowOutcomeModal(false);
      setSelectedSignal(null);
    }
  };


  const handleChatWithNexusClick = () => {
    if (selectedSignal) {
      // Send signal data to AI Coach
      const signalData = {
        symbol: selectedSignal.pair,
        type: (selectedSignal as any).type?.toUpperCase() || 'BUY',
        entryPrice: (selectedSignal as any).entry || (selectedSignal as any).entryPrice,
        stopLoss: selectedSignal.stopLoss,
        takeProfit: selectedSignal.takeProfit,
        timestamp: selectedSignal.timestamp
      };
      
      // Try to communicate with AI Coach iframe
      const aiCoachFrame = document.querySelector('iframe[title="AI Coach"]') as HTMLIFrameElement;
      if (aiCoachFrame && aiCoachFrame.contentWindow) {
        aiCoachFrame.contentWindow.postMessage({
          type: 'signal',
          signalData: signalData
        }, '*');
      }
      
      // Also try direct function call if available
      if ((window as any).receiveSignalFromTab) {
        (window as any).receiveSignalFromTab(signalData);
      }
      
      onChatWithNexus(selectedSignal);
      setShowOutcomeModal(false);
      setSelectedSignal(null);
    }
  };


  const handleOutcomeSelection = (outcome: TradeOutcome) => {
    if (selectedSignal) {
      if (outcome === 'Target Hit') {
        setWinningTrades(prev => [...prev, selectedSignal]);
      } else if (outcome === 'Stop Loss Hit') {
        const newLosingTrades = [...losingTrades, selectedSignal];
        setLosingTrades(newLosingTrades);
      }
      
      if (outcome === 'Manual Close') {
        const pnl = parseFloat(manualPnl);
        if (!isNaN(pnl)) {
          onMarkAsTaken(selectedSignal, outcome, pnl);
        }
      } else {
        onMarkAsTaken(selectedSignal, outcome);
      }
      
      setSignals(prevSignals => prevSignals.filter(s => s.id !== selectedSignal.id));
    }
    setShowOutcomeModal(false);
    setSelectedSignal(null);
    setManualPnl('');
  };


  const questionnaireData = useMemo(() => {
    if (!user?.tradingData) {
      return {
        accountBalance: 100000,
        riskPercentage: 1,
      };
    }
    return {
      accountBalance: parseFloat(user.tradingData.accountSize) || 100000,
      riskPercentage: parseFloat(user.tradingData.riskPerTrade) || 1,
    };
  }, [user]);


  const renderSignals = (signalsToRender: Signal[], type: 'winning' | 'losing' | 'active' | 'skipped') => {
    let cardClass = '';
    if (type === 'winning') {
      cardClass = 'winning-trade';
    } else if (type === 'losing') {
      cardClass = 'losing-trade';
    } else if (type === 'skipped') {
      cardClass = 'skipped-trade';
    }

    // Implement pagination
    const startIndex = (currentPage - 1) * signalsPerPage;
    const endIndex = startIndex + signalsPerPage;
    const paginatedSignals = signalsToRender.slice(startIndex, endIndex);
    const totalPages = Math.ceil(signalsToRender.length / signalsPerPage);

    const signalCards = paginatedSignals.map(signal => {
      const isTaken = takenSignalIds.includes(signal.id);
      const isSkipped = skippedSignalIds.includes(signal.id);

      return (
        <SignalCard
          key={signal.id}
          signal={signal}
          questionnaireData={questionnaireData}
          isTaken={isTaken}
          isSkipped={isSkipped}
          dailyLossLimitHit={dailyLossLimitHit}
          handleMarkAsTakenClick={handleMarkAsTakenClick}
          handleSkipTrade={handleSkipTrade}
          cardClass={cardClass}
          type={type}
        />
      );
    });

    // Add pagination controls if there are multiple pages
    if (totalPages > 1) {
      const paginationControls = (
        <div className="flex justify-center items-center space-x-4 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-var(--primary-green) text-var(--bg-dark)'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Next
          </button>
        </div>
      );
      
      return (
        <div>
          {signalCards}
          {paginationControls}
        </div>
      );
    }

    return signalCards;
  };


  return (
    <>
      <style>{`
        :root {
            --primary-cyan: #00ffff;
            --primary-green: #00ff88;
            --primary-purple: #8b5cf6;
            --primary-pink: #ec4899;
            --danger-red: #ff4444;
            --warning-yellow: #ffaa00;
            --bg-dark: #0a0a0f;
            --bg-panel: rgba(15, 15, 35, 0.6);
            --border-glow: rgba(0, 255, 136, 0.3);
        }
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--bg-panel);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid var(--border-glow);
        }
        .page-title {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, var(--primary-cyan), var(--primary-green));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .page-subtitle {
            color: rgba(255, 255, 255, 0.6);
            margin-top: 5px;
        }
        .filters-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .tab-btn {
            padding: 12px 24px;
            background: transparent;
            border: 1px solid var(--border-glow);
            color: white;
            border-radius: 12px;
            outline: none;
            cursor: pointer;
            transition: all 0.3s;
        }
        .tab-btn.active {
            background: var(--primary-green);
            color: var(--bg-dark);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }
        .glass-panel {
            background: var(--bg-panel);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-glow);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s;
        }
        .signals-grid {
            display: grid;
            gap: 20px;
        }
        .signal-card {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.8), rgba(30, 30, 50, 0.8));
            border: 1px solid var(--border-glow);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .signal-card:hover {
            transform: translateX(10px);
            box-shadow: 0 5px 30px rgba(0, 255, 136, 0.3);
            border-color: var(--primary-green);
        }
        .winning-trade {
            border-color: var(--primary-green);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }
        .losing-trade {
            border-color: var(--danger-red);
            box-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
        }
        .skipped-trade {
            border-color: #888;
            background: linear-gradient(135deg, rgba(50, 50, 50, 0.8), rgba(70, 70, 70, 0.8));
        }
        .skipped-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 20px;
        }
        .taken-trade {
            opacity: 0.6;
            background: #333;
        }
        .limit-hit {
            pointer-events: none;
            opacity: 0.5;
            position: relative;
        }
        .limit-hit::after {
            content: 'Daily loss limit reached';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
        }
        .signal-footer {
            margin-top: 15px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }
        .signal-description {
            margin-bottom: 5px;
        }
        .signal-status {
            font-size: 12px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
            text-transform: uppercase;
        }
        .signal-status.target-hit {
            background-color: var(--primary-green);
            color: var(--bg-dark);
        }
        .signal-status.sl-hit {
            background-color: var(--danger-red);
            color: white;
        }
        .signal-header {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .signal-pair {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary-cyan);
        }
        .signal-type {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .signal-type.long {
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
            color: var(--primary-green);
            border: 1px solid var(--primary-green);
        }
        .signal-type.short {
            background: linear-gradient(135deg, rgba(255, 68, 68, 0.2), rgba(255, 68, 68, 0.1));
            color: var(--danger-red);
            border: 1px solid var(--danger-red);
        }
        .signal-details {
            display: flex;
            gap: 30px;
            margin-top: 15px;
        }
        .signal-detail {
            display: flex;
            flex-direction: column;
        }
        .detail-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .detail-value {
            font-size: 18px;
            font-weight: 600;
        }
        .detail-value.entry { color: var(--primary-cyan); }
        .detail-value.sl { color: var(--danger-red); }
        .detail-value.tp { color: var(--primary-green); }
        .action-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, var(--primary-green), var(--primary-cyan));
            border: none;
            border-radius: 12px;
            color: var(--bg-dark);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .action-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.4);
        }
      `}</style>
      <div id="signals-page" className="page-content">
        {dailyLossLimitHit && (
          <div className="disclaimer-banner">
            You have hit your daily loss limit. No more trades are allowed today.
          </div>
        )}
        <div className="page-header">
          <div>
            <h1 className="page-title">Trading Signals</h1>
            <p className="page-subtitle">Real-time professional-grade signals with 85-95% accuracy</p>
          </div>
        </div>


        <div className="filters-bar">
          <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Signals</button>
          <button className={`tab-btn ${activeTab === 'winning' ? 'active' : ''}`} onClick={() => setActiveTab('winning')}>Winning Trades</button>
          <button className={`tab-btn ${activeTab === 'losing' ? 'active' : ''}`} onClick={() => setActiveTab('losing')}>Losing Trades</button>
          <button className={`tab-btn ${activeTab === 'skipped' ? 'active' : ''}`} onClick={() => setActiveTab('skipped')}>Skipped Trades</button>
        </div>


        <div className="glass-panel">
          <div className="signals-grid">
            {isWeekend && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">Happy Weekend!</div>
                <div className="text-gray-400">Prop firm accounts don't work on Saturday/Sunday. Please take a rest.</div>
              </div>
            )}
            {activeTab === 'active' && signals.length === 0 && !isWeekend && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">No Active Signals</div>
                <div className="text-gray-400">Signals will appear here when sent by the admin team.</div>
              </div>
            )}
            {activeTab === 'active' && signals.length > 0 && !isWeekend && renderSignals(signals, 'active')}


            {activeTab === 'winning' && winningTrades.length === 0 && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">No Winning Trades</div>
                <div className="text-gray-400">Trades marked as 'Target Hit' will appear here.</div>
              </div>
            )}
            {activeTab === 'winning' && winningTrades.length > 0 && renderSignals(winningTrades, 'winning')}


            {activeTab === 'losing' && losingTrades.length === 0 && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">No Losing Trades</div>
                <div className="text-gray-400">Trades marked as 'Stop Loss Hit' will appear here.</div>
              </div>
            )}
            {activeTab === 'losing' && losingTrades.length > 0 && renderSignals(losingTrades, 'losing')}


            {activeTab === 'skipped' && skippedTrades.length === 0 && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">No Skipped Trades</div>
                <div className="text-gray-400">Trades you've skipped will appear here.</div>
              </div>
            )}
            {activeTab === 'skipped' && skippedTrades.length > 0 && renderSignals(skippedTrades, 'skipped')}
          </div>
        </div>
      </div>


      {showOutcomeModal && selectedSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-lg border border-primary-cyan">
            <h3 className="text-2xl font-bold text-primary-cyan mb-6 text-center">Select Trade Outcome for {selectedSignal.pair}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button onClick={() => handleOutcomeSelection('Target Hit')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Target Hit</button>
              <button onClick={() => handleOutcomeSelection('Stop Loss Hit')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Stop Loss Hit</button>
              <button onClick={() => handleOutcomeSelection('Breakeven')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Breakeven</button>
              <button onClick={handleAddToJournalClick} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Add to Journal</button>
              <button onClick={handleChatWithNexusClick} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 col-span-2">Chat with Nexus Coach</button>
            </div>
            <div className="col-span-2">
              <input
                type="number"
                value={manualPnl}
                onChange={(e) => setManualPnl(e.target.value)}
                placeholder="Enter P&L for manual close"
                className="bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-primary-cyan"
              />
              <button onClick={() => handleOutcomeSelection('Manual Close')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg w-full mt-2 transition-transform transform hover:scale-105">Manual Close</button>
            </div>
            <button onClick={() => setShowOutcomeModal(false)} className="mt-6 text-gray-400 hover:text-white w-full text-center">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};


export default SignalsFeed;
