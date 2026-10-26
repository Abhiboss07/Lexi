import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lexi ErrorBoundary captured an unhandled render error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[280px] p-6 rounded-3xl bg-white border border-[#ECEEFE] shadow-lexi-card flex flex-col items-center justify-center text-center space-y-4 my-4 mx-2"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="space-y-1 max-w-[320px]">
            <h3 className="text-[17px] font-black text-[#15164B]">
              {this.props.fallbackTitle || 'Something interrupted this view'}
            </h3>
            <p className="text-[12px] font-medium text-[#484E77] leading-relaxed">
              Your learning progress is safe in local offline storage. You can restart this section or return to Home.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Retry Section</span>
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-full bg-[#F0F2FD] hover:bg-[#E2E6FA] text-[#15164B] text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
