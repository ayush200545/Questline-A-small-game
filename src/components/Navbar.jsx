import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="fixed top-0 w-full bg-orange-50 border-b-4 border-black z-50 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-black flex items-center justify-center">
          <span className="text-white font-bold text-sm italic">Q</span>
        </div>
        <h1 className="font-display font-black text-2xl uppercase tracking-tighter hidden md:block">Questline</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 font-bold text-xs sm:text-sm">
        <Link 
          to="/" 
          className={`px-3 sm:px-4 py-2 border-2 border-black ${location.pathname === '/' ? 'bg-neo-yellow' : 'bg-white hover:bg-gray-100'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors`}
        >
          Today
        </Link>
        <Link 
          to="/journey" 
          className={`px-3 sm:px-4 py-2 border-2 border-black ${location.pathname === '/journey' ? 'bg-neo-yellow' : 'bg-white hover:bg-gray-100'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors`}
        >
          Journey
        </Link>
        <Link 
          to="/leaderboard" 
          className={`px-3 sm:px-4 py-2 border-2 border-black ${location.pathname === '/leaderboard' ? 'bg-neo-yellow' : 'bg-white hover:bg-gray-100'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors`}
        >
          Leaderboard
        </Link>
        <Link 
          to="/badges" 
          className={`px-3 sm:px-4 py-2 border-2 border-black ${location.pathname === '/badges' ? 'bg-neo-yellow' : 'bg-white hover:bg-gray-100'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hidden lg:block`}
        >
          Trophies
        </Link>
        <Link 
          to="/guilds" 
          className={`px-3 sm:px-4 py-2 border-2 border-black ${location.pathname === '/guilds' ? 'bg-neo-yellow' : 'bg-white hover:bg-gray-100'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hidden md:block`}
        >
          Guilds
        </Link>
        <Link 
          to="/friends" 
          className={`px-3 sm:px-4 py-2 border-2 border-black ${location.pathname === '/friends' ? 'bg-neo-yellow' : 'bg-white hover:bg-gray-100'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hidden md:block`}
        >
          Friends
        </Link>
        <Link 
          to="/shop" 
          className={`px-3 sm:px-4 py-2 border-2 border-black ${location.pathname === '/shop' ? 'bg-neo-yellow' : 'bg-white hover:bg-gray-100'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hidden md:block`}
        >
          Shop
        </Link>
        
        <Link to="/settings" className="px-3 sm:px-4 py-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hidden lg:flex items-center gap-3 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col text-right">
            <span className="font-bold text-xs uppercase leading-none">{profile?.display_name || 'Adventurer'}</span>
            <span className="font-bold text-[10px] text-orange-500 leading-none mt-1">Lvl {profile?.level || 1} • {profile?.xp || 0} XP</span>
          </div>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-8 h-8 rounded-full border-2 border-black object-cover" alt="avatar" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-black flex items-center justify-center">
              <User size={16} color="white" />
            </div>
          )}
        </Link>

        <Link to="/settings" className="lg:hidden px-3 sm:px-4 py-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
           <SettingsIcon size={16} />
        </Link>

        <button 
          onClick={handleLogout}
          className="px-3 sm:px-4 py-2 border-2 border-black bg-black text-white hidden md:flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden px-3 sm:px-4 py-2 border-2 border-black bg-orange-500 text-white flex items-center justify-center"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-orange-50 border-b-4 border-black border-t-4 flex flex-col font-bold p-4 gap-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] z-40">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`p-4 border-2 border-black ${location.pathname === '/' ? 'bg-neo-yellow' : 'bg-white'}`}>Today's Quests</Link>
          <Link to="/journey" onClick={() => setIsMobileMenuOpen(false)} className={`p-4 border-2 border-black ${location.pathname === '/journey' ? 'bg-neo-yellow' : 'bg-white'}`}>Journey</Link>
          <Link to="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className={`p-4 border-2 border-black ${location.pathname === '/leaderboard' ? 'bg-neo-yellow' : 'bg-white'}`}>Leaderboard</Link>
          <Link to="/badges" onClick={() => setIsMobileMenuOpen(false)} className={`p-4 border-2 border-black ${location.pathname === '/badges' ? 'bg-neo-yellow' : 'bg-white'}`}>Trophies</Link>
          <Link to="/guilds" onClick={() => setIsMobileMenuOpen(false)} className={`p-4 border-2 border-black ${location.pathname === '/guilds' ? 'bg-neo-yellow' : 'bg-white'}`}>Guilds</Link>
          <Link to="/friends" onClick={() => setIsMobileMenuOpen(false)} className={`p-4 border-2 border-black ${location.pathname === '/friends' ? 'bg-neo-yellow' : 'bg-white'}`}>Friends</Link>
          <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className={`p-4 border-2 border-black ${location.pathname === '/shop' ? 'bg-neo-yellow' : 'bg-white'}`}>Shop</Link>
          <button onClick={handleLogout} className="p-4 border-2 border-black bg-black text-white flex items-center justify-center gap-2 mt-4">
            <LogOut size={20} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
