import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error Boundary caught an error:', error, errorInfo);
    
    // Check if this is the headers error we're trying to fix
    if (error.message?.includes('Cannot read properties of undefined') && 
        error.message?.includes('headers')) {
      console.error('❌ Headers error caught by Error Boundary - using fallback');
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Check if a custom fallback was provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with futuristic theme
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter">
          <div className="text-center max-w-lg mx-auto px-6">
            {/* Error Icon */}
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full border-2 border-red-400/50 animate-spin"></div>
              <div className="absolute inset-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                System Error Detected
              </span>
            </h1>
            
            <p className="text-gray-300 text-lg mb-6">
              TraderEdge Pro encountered an unexpected error. Our systems are designed to handle this gracefully.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-800/50 border border-red-500/30 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-red-400 font-bold mb-2">Development Error Details:</h3>
                <p className="text-red-300 text-sm font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-red-400 cursor-pointer">Stack Trace</summary>
                    <pre className="text-red-300 text-xs mt-2 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                🔄 Reload Application
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/';
                }}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                🏠 Return to Home
              </button>
              
              <button
                onClick={() => {
                  const errorReport = {
                    error: this.state.error?.message,
                    stack: this.state.error?.stack,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                  };
                  
                  console.log('Error Report:', errorReport);
                  
                  // You could send this to an error reporting service
                  alert('Error report generated in console. Please contact support if the issue persists.');
                }}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                📋 Generate Error Report
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                TraderEdge Pro BETA • Error ID: {Date.now().toString(36)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;