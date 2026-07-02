import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Plus, Users, Crown } from 'lucide-react';

export default function Guilds() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [myGuild, setMyGuild] = useState(null);
  const [allGuilds, setAllGuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Guild Form State
  const [showCreate, setShowCreate] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildTag, setGuildTag] = useState('');
  const [guildDesc, setGuildDesc] = useState('');

  useEffect(() => {
    fetchGuilds();
  }, []);

  const fetchGuilds = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);

    const { data: myStats } = await supabase.from('user_stats').select('*').eq('user_id', session.user.id).single();
    if (myStats) setStats(myStats);

    // Fetch user's current guild
    const { data: membership } = await supabase
      .from('guild_members')
      .select('guild_id, role')
      .eq('user_id', session.user.id)
      .single();

    if (membership) {
      const { data: guildData } = await supabase
        .from('guilds')
        .select('*, members:guild_members(count)')
        .eq('id', membership.guild_id)
        .single();
      
      setMyGuild({ ...guildData, myRole: membership.role });
    }

    // Fetch all top guilds
    const { data: guilds } = await supabase
      .from('guilds')
      .select('*, members:guild_members(count)')
      .order('total_xp', { ascending: false })
      .limit(20);

    if (guilds) setAllGuilds(guilds);
    setLoading(false);
  };

  const handleCreateGuild = async (e) => {
    e.preventDefault();
    if (stats.xp < 1000) {
      alert("You need 1000 XP to found a Guild!");
      return;
    }

    const { data: newGuild, error } = await supabase.from('guilds').insert([{
      name: guildName,
      tag: guildTag.toUpperCase(),
      description: guildDesc,
      leader_id: user.id,
      total_xp: stats.xp // Start with leader's XP
    }]).select().single();

    if (error) {
      alert("Failed to create guild. Name or Tag might already be taken.");
      return;
    }

    // Add leader to members
    await supabase.from('guild_members').insert([{
      guild_id: newGuild.id,
      user_id: user.id,
      role: 'leader'
    }]);

    // Deduct 1000 XP cost
    await supabase.from('user_stats').update({ xp: stats.xp - 1000 }).eq('user_id', user.id);

    alert("Guild founded successfully!");
    setShowCreate(false);
    fetchGuilds();
  };

  const handleJoin = async (guildId) => {
    if (myGuild) {
      alert("You must leave your current guild first!");
      return;
    }

    await supabase.from('guild_members').insert([{
      guild_id: guildId,
      user_id: user.id,
      role: 'member'
    }]);

    // Add user's XP to guild total
    const guild = allGuilds.find(g => g.id === guildId);
    await supabase.from('guilds').update({ total_xp: guild.total_xp + stats.xp }).eq('id', guildId);

    alert("Joined Guild!");
    fetchGuilds();
  };

  const handleLeave = async () => {
    const confirm = window.confirm("Are you sure you want to leave your guild?");
    if (!confirm) return;

    await supabase.from('guild_members').delete().eq('guild_id', myGuild.id).eq('user_id', user.id);
    
    // Deduct user's XP from guild
    await supabase.from('guilds').update({ total_xp: myGuild.total_xp - stats.xp }).eq('id', myGuild.id);
    
    alert("You have left the guild.");
    setMyGuild(null);
    fetchGuilds();
  };

  if (loading) return <div className="font-bold text-center mt-20">Loading Guilds...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-orange-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-2">
            <span>✦</span> FACTIONS
          </div>
          <h2 className="font-display font-black text-5xl tracking-tight leading-none">
            Adventurer Guilds
          </h2>
        </div>
        
        {!myGuild && !showCreate && (
          <button 
            onClick={() => setShowCreate(true)}
            className="neo-button bg-neo-blue text-white flex items-center gap-2"
          >
            <Plus size={20} /> Found a Guild (1000 XP)
          </button>
        )}
      </div>

      {showCreate && (
        <div className="neo-box p-6 bg-neo-yellow">
          <h3 className="font-display font-black text-3xl mb-4">Found a New Guild</h3>
          <form onSubmit={handleCreateGuild} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-sm uppercase mb-1">Guild Name</label>
                <input required type="text" maxLength={30} className="neo-input w-full" value={guildName} onChange={e => setGuildName(e.target.value)} />
              </div>
              <div>
                <label className="block font-bold text-sm uppercase mb-1">Guild Tag (3-4 chars)</label>
                <input required type="text" maxLength={4} className="neo-input w-full uppercase" value={guildTag} onChange={e => setGuildTag(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block font-bold text-sm uppercase mb-1">Description</label>
              <textarea required maxLength={100} className="neo-input w-full" value={guildDesc} onChange={e => setGuildDesc(e.target.value)} />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="neo-button flex-1 bg-black text-white">Create Guild (-1000 XP)</button>
              <button type="button" onClick={() => setShowCreate(false)} className="neo-button flex-1 bg-white">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {myGuild && (
        <div className="neo-box p-6 bg-neo-purple text-white border-4 border-black">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Crown size={20} className="text-neo-yellow" /> YOUR GUILD
              </div>
              <h3 className="font-display font-black text-5xl mb-2">[{myGuild.tag}] {myGuild.name}</h3>
              <p className="font-medium text-white/80">{myGuild.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-neo-yellow">{myGuild.total_xp} XP</div>
              <div className="font-bold text-sm opacity-80 mt-1 flex items-center justify-end gap-1">
                <Users size={14} /> {myGuild.members[0].count} Members
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 border-t-4 border-black/20 pt-6">
            <button className="neo-button bg-white text-black flex items-center gap-2">
              <Shield size={16} /> View Members
            </button>
            {myGuild.myRole !== 'leader' && (
              <button onClick={handleLeave} className="neo-button bg-red-500 text-white">
                Leave Guild
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display font-black text-3xl mb-6">Top Guilds Leaderboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allGuilds.map((g, i) => (
            <div key={g.id} className="neo-box bg-white p-4 flex items-center justify-between border-4 border-black hover:bg-orange-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-gray-400 w-8 text-center">#{i + 1}</div>
                <div>
                  <div className="font-bold text-xl leading-tight">[{g.tag}] {g.name}</div>
                  <div className="text-xs font-bold text-black/50 flex items-center gap-1 mt-1">
                    <Users size={12} /> {g.members[0].count} Members
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-black text-neo-blue text-xl">{g.total_xp} XP</div>
                {!myGuild && (
                  <button onClick={() => handleJoin(g.id)} className="text-xs font-bold uppercase bg-neo-green border-2 border-black px-2 py-1 mt-1 hover:bg-green-400">
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
          {allGuilds.length === 0 && (
            <div className="col-span-2 text-center font-bold text-gray-400 py-12 border-4 border-dashed border-gray-200">
              No guilds exist yet! Be the first to found one.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
