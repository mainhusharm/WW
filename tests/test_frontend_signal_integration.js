/**
 * Frontend Integration Tests for Real-time Signal System
 * Tests Socket.IO connection, signal reception, and API integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RealTimeSignalsFeed from '../src/components/RealTimeSignalsFeed';
import realTimeSignalService from '../src/services/realTimeSignalService';
import signalApiService from '../src/services/signalApiService';

// Mock Socket.IO
const mockSocket = {
  connected: false,
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn()
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}));

// Mock API service
vi.mock('../src/services/signalApiService', () => ({
  default: {
    getUserSignals: vi.fn(),
    getRecentSignals: vi.fn(),
    markSignalDelivered: vi.fn(),
    getUserSignalStats: vi.fn()
  }
}));

// Mock UserContext
const mockUser = {
  token: 'test-token',
  id: 'test-user-id',
  username: 'testuser',
  risk_tier: 'medium'
};

vi.mock('../src/contexts/UserContext', () => ({
  useUser: () => ({ user: mockUser })
}));

describe('RealTimeSignalsFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    signalApiService.getUserSignals.mockResolvedValue({
      success: true,
      signals: [
        {
          id: 'signal-1',
          symbol: 'BTCUSD',
          side: 'buy',
          entry_price: 46000,
          stop_loss: 45500,
          take_profit: 48000,
          risk_tier: 'medium',
          payload: { timeframe: '1H', analysis: 'Test signal' },
          created_at: new Date().toISOString(),
          status: 'active'
        }
      ],
      count: 1,
      user_risk_tier: 'medium'
    });

    signalApiService.getUserSignalStats.mockResolvedValue({
      success: true,
      stats: {
        total_signals: 1,
        delivered_signals: 1,
        recent_signals_7d: 1,
        user_risk_tier: 'medium'
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<RealTimeSignalsFeed />);
    
    expect(screen.getByText('Loading signals...')).toBeInTheDocument();
  });

  it('loads and displays signals from API', async () => {
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Signals')).toBeInTheDocument();
    });

    expect(screen.getByText('BTCUSD')).toBeInTheDocument();
    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.getByText('$46000.0000')).toBeInTheDocument();
  });

  it('displays connection status', async () => {
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Signals')).toBeInTheDocument();
    });

    // Should show disconnected initially
    expect(screen.getByText('disconnected')).toBeInTheDocument();
  });

  it('shows signal statistics', async () => {
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Signals')).toBeInTheDocument();
    });

    expect(screen.getByText('1')).toBeInTheDocument(); // Total signals
    expect(screen.getByText('1')).toBeInTheDocument(); // Delivered signals
  });

  it('handles new signals from Socket.IO', async () => {
    const mockOnSignalReceived = vi.fn();
    
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Signals')).toBeInTheDocument();
    });

    // Simulate Socket.IO connection
    mockSocket.connected = true;
    
    // Simulate receiving a new signal
    const newSignal = {
      id: 'signal-2',
      symbol: 'ETHUSD',
      side: 'sell',
      entry_price: 3000,
      stop_loss: 3100,
      take_profit: 2800,
      risk_tier: 'high',
      payload: { timeframe: '4H', analysis: 'New signal' },
      created_at: new Date().toISOString(),
      status: 'active'
    };

    // Trigger the signal:new event
    const signalHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'signal:new'
    )?.[1];
    
    if (signalHandler) {
      signalHandler(newSignal);
    }

    await waitFor(() => {
      expect(screen.getByText('ETHUSD')).toBeInTheDocument();
    });

    expect(screen.getByText('SELL')).toBeInTheDocument();
    expect(screen.getByText('$3000.0000')).toBeInTheDocument();
  });

  it('marks signals as delivered when received via WebSocket', async () => {
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Signals')).toBeInTheDocument();
    });

    // Simulate receiving a new signal
    const newSignal = {
      id: 'signal-3',
      symbol: 'ADAUSD',
      side: 'buy',
      entry_price: 0.5,
      stop_loss: 0.48,
      take_profit: 0.55,
      risk_tier: 'low',
      payload: { timeframe: '1H' },
      created_at: new Date().toISOString(),
      status: 'active'
    };

    const signalHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'signal:new'
    )?.[1];
    
    if (signalHandler) {
      signalHandler(newSignal);
    }

    await waitFor(() => {
      expect(signalApiService.markSignalDelivered).toHaveBeenCalledWith('signal-3');
    });
  });

  it('handles Socket.IO connection errors', async () => {
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Signals')).toBeInTheDocument();
    });

    // Simulate connection error
    const errorHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect_error'
    )?.[1];
    
    if (errorHandler) {
      errorHandler(new Error('Connection failed'));
    }

    await waitFor(() => {
      expect(screen.getByText('disconnected')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    signalApiService.getUserSignals.mockRejectedValue(new Error('API Error'));
    
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load signals. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows empty state when no signals', async () => {
    signalApiService.getUserSignals.mockResolvedValue({
      success: true,
      signals: [],
      count: 0,
      user_risk_tier: 'medium'
    });
    
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('No Signals Available')).toBeInTheDocument();
    });

    expect(screen.getByText('No signals match your risk profile yet. Check back soon!')).toBeInTheDocument();
  });

  it('handles pagination correctly', async () => {
    // Mock multiple signals
    const manySignals = Array.from({ length: 25 }, (_, i) => ({
      id: `signal-${i}`,
      symbol: `SYMBOL${i}`,
      side: 'buy',
      entry_price: 100 + i,
      stop_loss: 95 + i,
      take_profit: 110 + i,
      risk_tier: 'medium',
      payload: { timeframe: '1H' },
      created_at: new Date().toISOString(),
      status: 'active'
    }));

    signalApiService.getUserSignals.mockResolvedValue({
      success: true,
      signals: manySignals,
      count: 25,
      user_risk_tier: 'medium'
    });
    
    render(<RealTimeSignalsFeed />);
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    // Test pagination
    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });
  });

  it('calls callback functions when provided', async () => {
    const mockOnMarkAsTaken = vi.fn();
    const mockOnAddToJournal = vi.fn();
    
    render(
      <RealTimeSignalsFeed 
        onMarkAsTaken={mockOnMarkAsTaken}
        onAddToJournal={mockOnAddToJournal}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Signals')).toBeInTheDocument();
    });

    // Click mark as taken button
    const markTakenButton = screen.getByText('Mark Taken');
    await userEvent.click(markTakenButton);

    expect(mockOnMarkAsTaken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'signal-1',
        symbol: 'BTCUSD'
      })
    );

    // Click add to journal button
    const addToJournalButton = screen.getByText('Add to Journal');
    await userEvent.click(addToJournalButton);

    expect(mockOnAddToJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'signal-1',
        symbol: 'BTCUSD'
      })
    );
  });
});

describe('RealTimeSignalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('connects to Socket.IO with authentication', async () => {
    const mockCallbacks = {
      onConnected: vi.fn(),
      onSignalReceived: vi.fn(),
      onError: vi.fn()
    };

    realTimeSignalService.setCallbacks(mockCallbacks);
    realTimeSignalService.setToken('test-token');

    // Mock successful connection
    mockSocket.connected = true;
    const connectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect'
    )?.[1];
    
    if (connectHandler) {
      connectHandler();
    }

    expect(mockCallbacks.onConnected).toHaveBeenCalled();
  });

  it('handles signal reception', () => {
    const mockCallbacks = {
      onSignalReceived: vi.fn()
    };

    realTimeSignalService.setCallbacks(mockCallbacks);

    const signalData = {
      id: 'test-signal',
      symbol: 'BTCUSD',
      side: 'buy',
      entry_price: 46000,
      stop_loss: 45500,
      take_profit: 48000,
      risk_tier: 'medium',
      payload: { timeframe: '1H' },
      created_at: new Date().toISOString(),
      status: 'active'
    };

    const signalHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'signal:new'
    )?.[1];
    
    if (signalHandler) {
      signalHandler(signalData);
    }

    expect(mockCallbacks.onSignalReceived).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-signal',
        symbol: 'BTCUSD',
        action: 'BUY'
      })
    );
  });

  it('disconnects properly', () => {
    realTimeSignalService.disconnect();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});

describe('SignalApiService', () => {
  it('fetches user signals with filters', async () => {
    const mockResponse = {
      success: true,
      signals: [],
      count: 0,
      user_risk_tier: 'medium',
      filters: { limit: 10, include_delivered: true }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await signalApiService.getUserSignals({ 
      limit: 10, 
      include_delivered: true 
    });

    expect(result).toEqual(mockResponse);
  });

  it('marks signal as delivered', async () => {
    const mockResponse = {
      success: true,
      message: 'Signal marked as delivered'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await signalApiService.markSignalDelivered('signal-123');

    expect(result).toEqual(mockResponse);
  });

  it('handles API errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(signalApiService.getUserSignals()).rejects.toThrow('Network error');
  });
});
