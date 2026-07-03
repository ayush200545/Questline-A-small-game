import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';

// Lazy load pages for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Journey = lazy(() => import('./pages/Journey'));
const Auth = lazy(() => import('./pages/Auth'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Friends = lazy(() => import('./pages/Friends'));
const Shop = lazy(() => import('./pages/Shop'));
const Guilds = lazy(() => import('./pages/Guilds'));
const Badges = lazy(() => import('./pages/Badges'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (session) {
        supabase.from('user_stats').select('active_theme').eq('user_id', session.user.id).single().then(({ data }) => {
          if (data && data.active_theme) {
            setTheme(data.active_theme);
          }
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        supabase.from('user_stats').select('active_theme').eq('user_id', session.user.id).single().then(({ data }) => {
          if (data && data.active_theme) {
            setTheme(data.active_theme);
          }
        });
      }
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen bg-orange-50 flex items-center justify-center font-display font-black text-2xl">Loading...</div>;
  }

  return (
    <div className={`min-h-screen font-sans text-black ${theme}`}>
      {session && <Navbar />}
      
      {session ? (
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-32 md:pt-36">
          <Suspense fallback={<div className="font-display font-black text-2xl text-center mt-20">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/guilds" element={<Guilds />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </div>
      ) : (
        <Suspense fallback={<div className="font-display font-black text-2xl text-center mt-20">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Suspense>
      )}
    </div>
  );
}

export default App;
