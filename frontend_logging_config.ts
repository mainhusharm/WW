/**
 * Comprehensive Frontend Logging Configuration
 * Provides detailed logging for React/TypeScript frontend application
 */

interface LogData {
  timestamp: string;
  service: string;
  type: string;
  [key: string]: any;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  context?: Record<string, any>;
}

interface UserAction {
  action: string;
  component: string;
  details: Record<string, any>;
  userId?: string;
  sessionId: string;
}

interface ApiCall {
  method: string;
  url: string;
  status: number;
  responseTime: number;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

interface ComponentLifecycle {
  component: string;
  phase: 'mount' | 'update' | 'unmount';
  props?: Record<string, any>;
  state?: Record<string, any>;
  duration?: number;
}

class FrontendLogger {
  private serviceName: string;
  private logLevel: string;
  private sessionId: string;
  private userId?: string;
  private logs: LogData[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor(serviceName: string = 'frontend', logLevel: string = 'INFO') {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
    this.sessionId = this.generateSessionId();
    this.setupLogging();
    this.setupPerformanceMonitoring();
    this.setupErrorHandling();
    this.setupNetworkMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupLogging(): void {
    // Override console methods to capture all logs
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };

    console.log = (...args) => {
      this.logConsole('log', args);
      originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.logConsole('warn', args);
      originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.logConsole('error', args);
      originalConsole.error(...args);
    };

    console.info = (...args) => {
      this.logConsole('info', args);
      originalConsole.info(...args);
    };

    console.debug = (...args) => {
      this.logConsole('debug', args);
      originalConsole.debug(...args);
    };
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    if (window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (perfData) {
            this.logPerformanceMetric('page_load_time', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            this.logPerformanceMetric('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms');
            this.logPerformanceMetric('first_paint', perfData.responseEnd - perfData.fetchStart, 'ms');
          }
        }, 0);
      });
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.logPerformanceMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, 'MB');
        this.logPerformanceMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, 'MB');
      }, 30000); // Every 30 seconds
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.logPerformanceMetric('long_task', entry.duration, 'ms', {
                name: entry.name,
                startTime: entry.startTime
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported');
      }
    }
  }

  private setupErrorHandling(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: 'Unhandled Promise Rejection',
        reason: event.reason,
        promise: event.promise
      });
    });

    // React Error Boundary integration
    if (typeof window !== 'undefined') {
      (window as any).__REACT_ERROR_BOUNDARY_LOGGER__ = this;
    }
  }

  private setupNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.logUserAction('network_status_change', 'system', { status: 'online' });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.logUserAction('network_status_change', 'system', { status: 'offline' });
    });
  }

  private logConsole(level: string, args: any[]): void {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      type: 'console',
      level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '),
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.logs.push(logData);
    this.sendToBackend(logData);
  }

  public logUserAction(action: string, component: string, details: Record<string, any> = {}): void {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      type: 'user_action',
      action,
      component,
      details,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.logs.push(logData);
    this.sendToBackend(logData);
    console.log(`USER ACTION: ${action} in ${component}`, details);
  }

  public logApiCall(apiCall: ApiCall): void {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      type: 'api_call',
      ...apiCall,
      sessionId: this.sessionId,
      userId: this.userId,
      isOnline: this.isOnline
    };

    this.logs.push(logData);
    this.sendToBackend(logData);
    console.log(`API CALL: ${apiCall.method} ${apiCall.url} | Status: ${apiCall.status} | Time: ${apiCall.responseTime}ms`);
  }

  public logComponentLifecycle(lifecycle: ComponentLifecycle): void {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      type: 'component_lifecycle',
      ...lifecycle,
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.logs.push(logData);
    this.sendToBackend(logData);
    console.log(`COMPONENT: ${lifecycle.component} ${lifecycle.phase}`, lifecycle);
  }

  public logPerformanceMetric(name: string, value: number, unit: string = 'ms', context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      context
    };

    this.performanceMetrics.push(metric);

    const logData: LogData = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      type: 'performance',
      ...metric,
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.logs.push(logData);
    this.sendToBackend(logData);
    console.log(`PERF: ${name}: ${value} ${unit}`, context);
  }

  public logError(error: any, context?: Record<string, any>): void {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      type: 'error',
      error: {
        message: error.message || String(error),
        stack: error.stack,
        name: error.name
      },
      context: context || {},
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.logs.push(logData);
    this.sendToBackend(logData);
    console.error(`ERROR: ${error.message || error}`, error, context);
  }

  public logBusinessLogic(operation: string, details: Record<string, any>, executionTime?: number): void {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      type: 'business_logic',
      operation,
      details,
      executionTime: executionTime ? Math.round(executionTime * 1000) : undefined,
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.logs.push(logData);
    this.sendToBackend(logData);
    console.log(`BUSINESS: ${operation}`, details);
  }

  public logNavigation(from: string, to: string, method: string = 'unknown'): void {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      type: 'navigation',
      from,
      to,
      method,
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.logs.push(logData);
    this.sendToBackend(logData);
    console.log(`NAVIGATION: ${from} → ${to} (${method})`);
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    this.logUserAction('user_identified', 'system', { userId });
  }

  public getLogs(): LogData[] {
    return [...this.logs];
  }

  public getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  public exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      userId: this.userId,
      logs: this.logs,
      performanceMetrics: this.performanceMetrics,
      exportTime: new Date().toISOString()
    }, null, 2);
  }

  private async sendToBackend(logData: LogData): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Send to backend logging endpoint
      await fetch('/api/logs/frontend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      // Silently fail to avoid infinite logging loops
      console.debug('Failed to send log to backend:', error);
    }
  }

  public async flushLogs(): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      await fetch('/api/logs/frontend/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          logs: this.logs
        })
      });
      this.logs = []; // Clear sent logs
    } catch (error) {
      console.error('Failed to flush logs to backend:', error);
    }
  }
}

// React Hook for logging
export const useLogger = (componentName: string) => {
  const logger = new FrontendLogger('react_component');

  const logAction = (action: string, details?: Record<string, any>) => {
    logger.logUserAction(action, componentName, details);
  };

  const logError = (error: any, context?: Record<string, any>) => {
    logger.logError(error, { component: componentName, ...context });
  };

  const logPerformance = (name: string, value: number, unit?: string, context?: Record<string, any>) => {
    logger.logPerformanceMetric(name, value, unit, { component: componentName, ...context });
  };

  return { logAction, logError, logPerformance };
};

// Higher-order component for automatic logging
export const withLogging = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return class LoggedComponent extends React.Component<P> {
    private logger = new FrontendLogger('react_component');
    private mountTime: number = 0;

    componentDidMount() {
      this.mountTime = performance.now();
      this.logger.logComponentLifecycle({
        component: componentName,
        phase: 'mount',
        props: this.props as any
      });
    }

    componentDidUpdate(prevProps: P) {
      this.logger.logComponentLifecycle({
        component: componentName,
        phase: 'update',
        props: this.props as any,
        duration: performance.now() - this.mountTime
      });
    }

    componentWillUnmount() {
      this.logger.logComponentLifecycle({
        component: componentName,
        phase: 'unmount',
        duration: performance.now() - this.mountTime
      });
    }

    render() {
      return React.createElement(WrappedComponent, this.props);
    }
  };
};

// Performance monitoring utilities
export const measurePerformance = async <T>(
  name: string,
  operation: () => Promise<T>,
  logger: FrontendLogger
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const endTime = performance.now();
    logger.logPerformanceMetric(name, endTime - startTime, 'ms');
    return result;
  } catch (error) {
    const endTime = performance.now();
    logger.logError(error, { operation: name, duration: endTime - startTime });
    throw error;
  }
};

// Initialize global logger
export const frontendLogger = new FrontendLogger('frontend_app');

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).frontendLogger = frontendLogger;
}

export default FrontendLogger;
