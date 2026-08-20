import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, errorMsg: error?.message || String(error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Uncaught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6 text-center font-sans">
          <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full border border-pink-100">
            <div className="text-5xl mb-4">💧</div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">HydraLove Notice</h1>
            <p className="text-sm text-slate-600 mb-6">
              HydraLove updated in the background. Tap below to reload fresh! 💕
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('hydralove_last_notified_slot');
                window.location.reload();
              }}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-3 px-6 rounded-2xl shadow-md hover:opacity-95 active:scale-95 transition"
            >
              Reload App 🔄
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
