/**
 * @file ErrorBoundary.tsx
 * @description React Error Boundary catching runtime exceptions gracefully.
 * Provides accessible recovery options and prevents application crashes.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[400px] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-rose-50/80 p-6 shadow-lg text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-900">
                Application Rendering Encountered an Issue
              </h2>
              <p className="mt-1 text-xs text-rose-700 leading-relaxed font-medium">
                {this.state.error?.message || 'An unexpected runtime state occurred in this component.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-700 hover:bg-rose-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reload Engine Baseline</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
