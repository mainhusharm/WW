/**
 * Real-time Signal Processing Worker for ForexData Bot Integration
 * This worker processes signals from your ForexData bot and assigns milestone metadata
 */

import { Signal } from '../trading/types';
import { signalScoringService, SignalMeta } from '../services/signalScoringService';
import { signalMetaApi } from '../api/signalMetaApi';

interface SignalProcessorConfig {
  batchSize: number;
  processingInterval: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

class SignalProcessor {
  private config: SignalProcessorConfig;
  private processingQueue: Signal[] = [];
  private isProcessing: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<SignalProcessorConfig> = {}) {
    this.config = {
      batchSize: 10,
      processingInterval: 5000, // 5 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      ...config
    };
  }

  /**
   * Start the signal processor
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Signal processor is already running');
      return;
    }

    console.log('Starting signal processor...');
    this.intervalId = setInterval(() => {
      this.processQueuedSignals();
    }, this.config.processingInterval);

    // Also process immediately
    this.processQueuedSignals();
  }

  /**
   * Stop the signal processor
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Signal processor stopped');
    }
  }

  /**
   * Add signal to processing queue
   */
  queueSignal(signal: Signal): void {
    this.processingQueue.push(signal);
    console.log(`Signal ${signal.id} queued for processing. Queue size: ${this.processingQueue.length}`);
  }

  /**
   * Add multiple signals to processing queue
   */
  queueSignals(signals: Signal[]): void {
    this.processingQueue.push(...signals);
    console.log(`${signals.length} signals queued for processing. Queue size: ${this.processingQueue.length}`);
  }

  /**
   * Process signals from the queue
   */
  private async processQueuedSignals(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get batch of signals to process
      const batch = this.processingQueue.splice(0, this.config.batchSize);
      console.log(`Processing batch of ${batch.length} signals...`);

      // Process signals in parallel
      const processingPromises = batch.map(signal => this.processSignal(signal));
      const results = await Promise.allSettled(processingPromises);

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Batch processing complete: ${successful} successful, ${failed} failed`);

      // Handle failed signals
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to process signal ${batch[index].id}:`, result.reason);
          // Optionally re-queue failed signals for retry
          this.handleFailedSignal(batch[index]);
        }
      });

    } catch (error) {
      console.error('Error processing signal batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single signal
   */
  private async processSignal(signal: Signal): Promise<SignalMeta> {
    try {
      console.log(`Processing signal ${signal.id} (${signal.pair})...`);

      // Score the signal using the scoring service
      const signalMeta = await signalScoringService.scoreSignal(signal);

      // Save metadata to database via API
      await this.saveSignalMeta(signalMeta);

      console.log(`Signal ${signal.id} processed successfully - assigned to ${signalMeta.assigned_milestone}`);
      return signalMeta;

    } catch (error) {
      console.error(`Error processing signal ${signal.id}:`, error);
      throw error;
    }
  }

  /**
   * Save signal metadata to database
   */
  private async saveSignalMeta(signalMeta: SignalMeta): Promise<void> {
    try {
      // In a real implementation, you would save to your database
      // For now, we'll use the API service
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/signals/${signalMeta.signal_id}/meta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signalMeta),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`Metadata saved for signal ${signalMeta.signal_id}`);
    } catch (error) {
      console.error(`Error saving metadata for signal ${signalMeta.signal_id}:`, error);
      throw error;
    }
  }

  /**
   * Handle failed signal processing
   */
  private handleFailedSignal(signal: Signal): void {
    // Implement retry logic or dead letter queue
    console.log(`Handling failed signal ${signal.id} - implementing retry logic...`);
    
    // For now, just log the failure
    // In production, you might want to:
    // 1. Add to a retry queue with exponential backoff
    // 2. Send to a dead letter queue after max retries
    // 3. Alert monitoring systems
  }

  /**
   * Get current queue status
   */
  getStatus(): {
    queueSize: number;
    isProcessing: boolean;
    isRunning: boolean;
  } {
    return {
      queueSize: this.processingQueue.length,
      isProcessing: this.isProcessing,
      isRunning: this.intervalId !== null
    };
  }

  /**
   * Process signals from ForexData bot webhook
   */
  async processWebhookSignals(signals: Signal[]): Promise<void> {
    console.log(`Received ${signals.length} signals from ForexData bot webhook`);
    
    // Add to queue for processing
    this.queueSignals(signals);

    // If not running, start processing immediately
    if (!this.intervalId) {
      await this.processQueuedSignals();
    }
  }

  /**
   * Reprocess existing signals (for calibration or updates)
   */
  async reprocessSignals(signalIds: string[]): Promise<void> {
    try {
      console.log(`Reprocessing ${signalIds.length} existing signals...`);

      for (const signalId of signalIds) {
        try {
          // Trigger reprocessing via API
          await signalMetaApi.triggerSignalScoring(signalId);
          console.log(`Triggered reprocessing for signal ${signalId}`);
        } catch (error) {
          console.error(`Failed to trigger reprocessing for signal ${signalId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error reprocessing signals:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const signalProcessor = new SignalProcessor();

// Auto-start the processor
signalProcessor.start();

export default signalProcessor;
