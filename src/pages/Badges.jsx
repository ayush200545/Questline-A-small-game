import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Shield, Users, Zap, Star } from 'lucide-react';

export default function Badges() {
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: myStats } = await supabase.from('user_stats').select('*').eq('user_id', session.user.id).single();
    if (myStats) setStats(myStats);

    const { data: inv } = await supabase.from('inventory').select('*').eq('user_id', session.user.id);
    if (inv) setInventory(inv);

    const { count } = await supabase.from('friendships').select('*', { count: 'exact' })
      .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
      .eq('status', 'accepted');
      
    if (count !== null) setFriendsCount(count);

    setLoading(false);
  };

  if (loading) return <div className="font-bold text-center mt-20">Loading Trophy Room...</div>;

  // Define badges logic based on real stats safely
  const badges = [
    {
      id: 1, title: 'First Blood', desc: 'Complete your very first quest.',
      icon: <Star size={48} />,
      unlocked: (stats?.quests_completed || 0) >= 1,
      color: 'bg-neo-yellow'
    },
    {
      id: 2, title: 'Weekend Warrior', desc: 'Complete 10 total quests.',
      icon: <Shield size={48} />,
      unlocked: (stats?.quests_completed || 0) >= 10,
      color: 'bg-neo-green'
    },
    {
      id: 3, title: 'Social Butterfly', desc: 'Make 3 friends in the Guild Hall.',
      icon: <Users size={48} />,
      unlocked: friendsCount >= 3,
      color: 'bg-neo-pink'
    },
    {
      id: 4, title: 'Legendary Luck', desc: 'Find a Legendary Loot Box.',
      icon: <Zap size={48} />,
      unlocked: (inventory || []).some(i => i.item_type === 'legendary_lootbox'),
      color: 'bg-orange-400'
    },
    {
      id: 5, title: 'Level 10 Vanguard', desc: 'Reach Level 10.',
      icon: <Trophy size={48} />,
      unlocked: (stats?.level || 1) >= 10,
      color: 'bg-neo-purple'
    },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <div className="text-orange-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-2">
          <span>✦</span> HALL OF FAME
        </div>
        <h2 className="font-display font-black text-5xl tracking-tight leading-none mb-2">
          Trophy Room
        </h2>
        <div className="inline-block bg-black text-white font-bold text-sm px-3 py-1">
          {unlockedCount} / {badges.length} Badges Unlocked
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {badges.map(b => (
          <div key={b.id} className={`neo-box border-4 border-black p-6 flex flex-col items-center text-center transition-all ${b.unlocked ? b.color + ' shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-200 grayscale opacity-50 shadow-none'}`}>
            <div className={`mb-4 ${b.unlocked ? 'text-black' : 'text-gray-500'}`}>
              {b.icon}
            </div>
            <h3 className="font-display font-black text-2xl mb-2 leading-tight">{b.title}</h3>
            <p className="text-sm font-bold text-black/70">{b.desc}</p>
            {!b.unlocked && (
              <div className="mt-4 border-2 border-dashed border-gray-400 px-2 py-1 text-xs font-bold uppercase text-gray-500">
                LOCKED
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
