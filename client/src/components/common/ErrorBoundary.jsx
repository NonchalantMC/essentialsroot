import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-serif text-2xl text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            We encountered an unexpected error. Please refresh the page or contact support.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            className="btn-sage px-6 py-3"
          >
            Back to Home
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-6 text-xs text-left text-red-500 bg-red-50 p-4 rounded-xl max-w-2xl overflow-auto">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
