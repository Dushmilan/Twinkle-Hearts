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
        <div className="min-h-screen flex items-center justify-center bg-greeting-charcoal-500 px-4">
          <div className="max-w-md w-full bg-greeting-charcoal-400 shadow-lg rounded-xl p-8 text-center">
            <div className="text-greeting-berry-400 text-5xl mb-4">!</div>
            <h1 className="text-2xl font-display font-semibold text-gray-100 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-400 mb-4 font-body">
              We're sorry for the inconvenience. Please try again.
            </p>
            {error && import.meta.env.DEV && (
              <details className="text-left mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-greeting-charcoal-500 rounded text-xs text-greeting-berry-400 overflow-auto">
                  {error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.reset}
              className="bg-greeting-berry-600 text-white px-6 py-2 rounded-full hover:bg-greeting-berry-700 transition-colors font-body font-semibold"
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
