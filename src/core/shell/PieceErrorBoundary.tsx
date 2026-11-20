import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  pieceId: string;
  pieceName?: string;
  fallbackBehavior?: 'silent_hide' | 'skeleton' | 'error_notice';
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * COCA Per-Tile Crash Shield (Circuit Breaker)
 * Sandboxes rendering exceptions so a failure in one tile never affects other tiles or the store.
 */
export class PieceErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'خطای رندر قطعه' };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`[COCA Piece Crash Shield] Failure trapped in piece '${this.props.pieceId}':`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallbackBehavior === 'silent_hide') {
        return null;
      }

      return (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-900">سرویس {this.props.pieceName || this.props.pieceId} موقتاً ایزوله شد</p>
              <p className="text-amber-700 text-[11px]">سایر عملکردهای فروشگاه بدون وقفه فعال هستند.</p>
            </div>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            تلاش مجدد
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

