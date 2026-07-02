import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the recovery link
        setMessage('Please enter your new password below.');
      }
    });
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-black flex items-center justify-center border-4 border-black rotate-3">
            <Lock size={32} color="white" />
          </div>
        </div>
        
        <h2 className="font-display font-black text-3xl mb-6 text-center uppercase tracking-tighter">Reset Password</h2>
        
        {message && (
          <div className="mb-6 p-3 bg-neo-yellow border-2 border-black font-bold text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block font-bold text-sm mb-2 uppercase tracking-tight">New Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-black bg-white focus:bg-orange-50 outline-none font-bold placeholder-gray-400 transition-colors"
              placeholder="Enter new password..."
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-black py-4 border-2 border-black hover:bg-orange-600 transition-colors uppercase tracking-widest text-lg disabled:opacity-50 mt-6"
          >
            {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
}
