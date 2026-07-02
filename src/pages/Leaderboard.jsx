import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from 'lucide-react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'local'
  const [userCity, setUserCity] = useState(null);

  useEffect(() => {
    fetchUserDataAndLeaders();
  }, [activeTab]);

  const fetchUserDataAndLeaders = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    let currentCity = null;

    if (session) {
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('city')
        .eq('user_id', session.user.id)
        .single();
      
      if (userStats?.city) {
        currentCity = userStats.city;
        setUserCity(currentCity);
      }
    }

    let query = supabase
      .from('user_stats')
      .select('*')
      .order('level', { ascending: false })
      .order('xp', { ascending: false })
      .limit(50);

    // If local tab is active and user has a city, filter by city
    if (activeTab === 'local' && currentCity) {
      query = query.eq('city', currentCity);
    }

    const { data } = await query;
    if (data) setLeaders(data);
    
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="text-orange-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-2">
          <span>✦</span> RANKINGS
        </div>
        <h2 className="font-display font-black text-5xl tracking-tight leading-none mb-6">
          Hall of Heroes
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button 
          onClick={() => setActiveTab('global')}
          className={`neo-button flex-1 ${activeTab === 'global' ? 'bg-orange-500 text-white' : 'bg-white text-black'}`}
        >
          🌍 Global
        </button>
        <button 
          onClick={() => setActiveTab('local')}
          className={`neo-button flex-1 ${activeTab === 'local' ? 'bg-neo-blue text-white' : 'bg-white text-black'}`}
        >
          📍 Local {userCity ? `(${userCity})` : ''}
        </button>
      </div>

      {activeTab === 'local' && !userCity && (
        <div className="neo-box p-4 bg-neo-yellow text-center font-bold text-sm">
          You haven't set a city yet! Go to Settings to automatically detect your location and compete locally.
        </div>
      )}

      <div className="neo-box bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 font-bold text-center">Loading rankings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-neo-yellow border-b-4 border-black font-display text-lg">
                  <th className="p-4 border-r-4 border-black w-16 text-center">#</th>
                  <th className="p-4 border-r-4 border-black">Adventurer</th>
                  <th className="p-4 border-r-4 border-black text-center w-24">Level</th>
                  <th className="p-4 text-right w-32">Total XP</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader, i) => (
                  <tr key={leader.user_id} className="border-b-2 border-black/20 hover:bg-orange-50 transition-colors">
                    <td className="p-4 border-r-4 border-black text-center font-bold text-xl">{i + 1}</td>
                    <td className="p-4 border-r-4 border-black">
                      <div className="flex items-center gap-3">
                        {leader.avatar_url ? (
                          <img src={leader.avatar_url} className="w-8 h-8 rounded-full border-2 border-black object-cover" alt="avatar" />
                        ) : (
                          <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-black flex items-center justify-center">
                            <User size={16} color="white" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-lg leading-tight">
                            {leader.display_name || `Player_${leader.user_id.substring(0, 5)}`}
                          </div>
                          {leader.city && <div className="text-xs font-bold text-black/50">📍 {leader.city}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r-4 border-black text-center font-display font-black text-2xl text-orange-500">
                      {leader.level}
                    </td>
                    <td className="p-4 text-right font-bold text-black/70">
                      {leader.xp + (leader.level * 100)} XP
                    </td>
                  </tr>
                ))}
                {leaders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center font-bold text-gray-500">
                      No adventurers found in this region yet. Be the first!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
