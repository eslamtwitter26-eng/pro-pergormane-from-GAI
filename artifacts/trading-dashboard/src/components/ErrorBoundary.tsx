import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05070f] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-card/80 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-xs text-muted-foreground bg-black/40 p-3 rounded-lg text-left font-mono overflow-auto max-h-32 text-red-300">
              {this.state.error?.message || "An unexpected error occurred while rendering."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 font-bold text-sm text-white hover:opacity-90 transition-all cursor-pointer"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
