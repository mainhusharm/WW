import React from 'react';
import { Signal } from '../trading/types';

interface SignalCardProps {
  signal: Signal;
  questionnaireData: {
    accountBalance: number;
    riskPercentage: number;
  };
  isTaken: boolean;
  isSkipped: boolean;
  dailyLossLimitHit: boolean;
  handleMarkAsTakenClick: (signal: Signal) => void;
  handleSkipTrade: (signal: Signal) => void;
  cardClass: string;
  type: 'winning' | 'losing' | 'active' | 'skipped';
}

const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  questionnaireData,
  isTaken,
  isSkipped,
  dailyLossLimitHit,
  handleMarkAsTakenClick,
  handleSkipTrade,
  cardClass,
  type,
}) => {
  const { accountBalance, riskPercentage } = questionnaireData;
  const riskAmount = accountBalance * (riskPercentage / 100);
  const positionSize = signal.stopLoss ? riskAmount / (signal.entryPrice - signal.stopLoss) : 0;

  return (
    <div className={`signal-card ${cardClass} ${isTaken ? 'taken-trade' : ''} ${dailyLossLimitHit ? 'limit-hit' : ''}`}>
      <div>
        <div className="signal-header">
          <div className="signal-pair">{signal.pair}</div>
          <div className={`signal-type ${signal.direction.toLowerCase()}`}>{signal.direction}</div>
        </div>
        <div className="signal-details">
          <div className="signal-detail">
            <div className="detail-label">Entry Price</div>
            <div className="detail-value entry">{signal.entryPrice}</div>
          </div>
          <div className="signal-detail">
            <div className="detail-label">Stop Loss</div>
            <div className="detail-value sl">{signal.stopLoss || 'N/A'}</div>
          </div>
          <div className="signal-detail">
            <div className="detail-label">Take Profit</div>
            <div className="detail-value tp">{signal.takeProfit || 'N/A'}</div>
          </div>
        </div>
        <div className="signal-footer">
          <div className="signal-description">
            Calculated Position Size: <strong>{Math.abs(positionSize).toFixed(2)} lots</strong>
          </div>
          <div className="signal-description">
            Risk for this trade: <strong>${riskAmount.toFixed(2)}</strong>
          </div>
        </div>
      </div>
      {type === 'active' && !isTaken && !isSkipped && (
        <div className="flex flex-col space-y-2">
          <button onClick={() => handleMarkAsTakenClick(signal)} className="action-btn">
            Mark as Taken
          </button>
          <button onClick={() => handleSkipTrade(signal)} className="text-gray-400 hover:text-white text-sm">
            Skip Trade
          </button>
        </div>
      )}
      {isTaken && <div className="text-green-400 font-bold">Trade Taken</div>}
      {isSkipped && <div className="text-yellow-400 font-bold">Trade Skipped</div>}
    </div>
  );
};

export default SignalCard;
