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
      <div className="max-w-6xl mx-auto p-4 md:p-8 pt-32 md:pt-36">
        <Suspense fallback={<div className="font-display font-black text-2xl text-center mt-20">Loading...</div>}>
          <Routes>
            <Route 
              path="/login" 
              element={!session ? <Auth /> : <Navigate to="/" />} 
            />
            <Route 
              path="/reset-password" 
              element={<ResetPassword />} 
            />
            <Route 
              path="/" 
              element={session ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/journey" 
              element={session ? <Journey /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/leaderboard" 
              element={session ? <Leaderboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/settings" 
              element={session ? <Settings /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/friends" 
              element={session ? <Friends /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/shop" 
              element={session ? <Shop /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/guilds" 
              element={session ? <Guilds /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/badges" 
              element={session ? <Badges /> : <Navigate to="/login" />} 
            />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default App;
