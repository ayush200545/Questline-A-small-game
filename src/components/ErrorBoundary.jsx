import { Component } from 'react';
import { supabase } from '../lib/supabase';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  async componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const { data } = await supabase.from('error_logs').insert({
        user_id: userId,
        message: error.message,
        stack: error.stack,
        component_stack: errorInfo.componentStack
      }).select().single();

      if (data) {
        this.setState({ errorId: data.id });
      }
    } catch (e) {
      console.error("Failed to log error to Supabase", e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-orange-50 p-8 flex items-center justify-center font-sans text-black">
          <div className="max-w-md w-full bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <h1 className="font-display font-black text-3xl mb-4 text-red-500 uppercase tracking-tighter">System Crash</h1>
            <p className="font-bold mb-4">A critical error occurred. Don't worry, we have logged it.</p>
            {this.state.errorId && (
              <p className="text-sm font-bold bg-gray-100 p-2 border-2 border-black mb-4">
                Error ID: {this.state.errorId}
              </p>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white font-bold py-3 border-2 border-black hover:bg-gray-800 transition-colors uppercase"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
