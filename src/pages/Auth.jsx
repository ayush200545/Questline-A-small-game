import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Registration successful! Please check your email to verify your account.');
      }
    } catch (err) {
      console.error("Auth error:", err);
      let errorMsg = "An unexpected error occurred.";
      if (typeof err === 'string') errorMsg = err;
      else if (err.message) errorMsg = err.message;
      else if (err.error_description) errorMsg = err.error_description;
      else if (err.error) errorMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      else errorMsg = JSON.stringify(err);
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      console.error("Forgot password error:", error);
      let errorMsg = "Failed to send reset email.";
      if (typeof error === 'string') errorMsg = error;
      else if (error.message) errorMsg = error.message;
      else errorMsg = JSON.stringify(error);
      
      setError(errorMsg);
    } else {
      setMessage('Password reset link sent to your email!');
    }
    setLoading(false);
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url('/images/auth_bg.png')` }}
    >
      {/* Dark overlay to make the brutalist box pop and blend edges */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="neo-box p-8 bg-neo-yellow w-full max-w-md animate-in zoom-in duration-500 relative z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-orange-500 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl italic">Q</span>
          </div>
          <h2 className="font-display font-black text-4xl">
            {isLogin ? 'Welcome Back' : 'Join Questline'}
          </h2>
          <p className="font-medium text-black/70 mt-2">
            {isLogin ? 'Ready for your next adventure?' : 'Start your gamified life journey.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 border-2 border-black font-bold text-sm text-red-600 break-words">
            {typeof error === 'object' ? JSON.stringify(error) : error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-3 bg-neo-yellow border-2 border-black font-bold text-sm text-black">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block font-bold text-sm uppercase mb-1">Email</label>
            <input
              type="email"
              required
              className="neo-input w-full font-bold"
              placeholder="adventurer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-bold text-sm uppercase mb-1">Password</label>
            <input
              type="password"
              required
              className="neo-input w-full font-bold"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white font-black py-4 border-2 border-black hover:bg-orange-600 transition-colors uppercase tracking-widest text-lg disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none"
            >
              {loading ? 'Processing...' : (isLogin ? 'Enter Realm' : 'Create Character')}
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-col gap-4 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            className="font-bold text-sm hover:underline uppercase"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>

          {isLogin && (
            <button 
              onClick={handleForgotPassword}
              className="font-bold text-sm text-gray-500 hover:text-black hover:underline uppercase"
            >
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
