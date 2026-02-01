import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
        
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ 
            hasError: false, 
            error: null, 
            errorInfo: null 
        });
        
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                if (typeof this.props.fallback === 'function') {
                    return this.props.fallback({
                        error: this.state.error,
                        errorInfo: this.state.errorInfo,
                        reset: this.handleReset,
                    });
                }
                return this.props.fallback;
            }

            return (
                <div className="min-h-[200px] flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-red-600 dark:text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Algo deu errado
                        </h2>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Ocorreu um erro inesperado. Por favor, tente novamente.
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-4 text-left">
                                <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    Detalhes do erro
                                </summary>
                                <pre className="mt-2 p-3 text-xs bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-40 text-red-600 dark:text-red-400">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        
                        <button
                            onClick={this.handleReset}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export function withErrorBoundary(Component, fallback) {
    return function WithErrorBoundaryWrapper(props) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

export default ErrorBoundary;
