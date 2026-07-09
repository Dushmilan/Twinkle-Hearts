import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // H12: Only log in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  public reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-paper-50 px-4">
          <div className="max-w-md w-full bg-white shadow-paper-md rounded-card p-8 text-center">
            <div className="text-ruby-600 text-5xl mb-4">!</div>
            <h1 className="text-2xl font-display font-semibold text-ink-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-ink-500 mb-4 font-body">
              We're sorry for the inconvenience. Please try again.
            </p>
            {error && import.meta.env.DEV && (
              <details className="text-left mb-4">
                <summary className="cursor-pointer text-sm text-ink-400 hover:text-ink-600">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-paper-100 rounded text-xs text-ruby-600 overflow-auto">
                  {error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.reset}
              className="bg-ruby-700 text-white px-6 py-2 rounded-[10px] hover:bg-ruby-800 transition-colors font-body font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
