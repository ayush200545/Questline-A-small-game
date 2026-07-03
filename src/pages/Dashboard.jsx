import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { generateQuests, verifyQuestCompletion } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { Camera, X, Gift } from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [quests, setQuests] = useState([]);
  const [mood, setMood] = useState('Curious');
  const [time, setTime] = useState('30 minutes');
  const [interests, setInterests] = useState('');
  const [location, setLocation] = useState('');

  const [stats, setStats] = useState({
    level: 1, xp: 0, streak: 0, quests_completed: 0, badges_unlocked: 1
  });
  const [user, setUser] = useState(null);

  // Modal State
  const [completingQuest, setCompletingQuest] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Loot Box State
  const [lootDrop, setLootDrop] = useState(null);

  // Duels State
  const [activeDuels, setActiveDuels] = useState([]);
  
  const xpRequired = stats.level * 100;
  const xpProgress = Math.min((stats.xp / xpRequired) * 100, 100);

  useEffect(() => {
    fetchStats();

    // Set up Realtime Subscriptions for Dashboard Live Updates
    const dashboardSubscription = supabase
      .channel('public:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats' }, (payload) => {
        console.log('Realtime user_stats update:', payload);
        fetchStats(); // Refetch stats when user or opponent gets XP
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, (payload) => {
        console.log('Realtime duel update:', payload);
        fetchStats(); // Refetch duels when opponent scores
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dashboardSubscription);
    };
  }, []);

  const fetchStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      if (data) setStats(data);

      // Fetch active duels
      const { data: duels } = await supabase
        .from('competitions')
        .select('*, challenger:challenger_id(display_name), defender:defender_id(display_name)')
        .eq('status', 'active')
        .or(`challenger_id.eq.${session.user.id},defender_id.eq.${session.user.id}`);
      
      if (duels) setActiveDuels(duels);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    const newQuests = await generateQuests(mood, time, interests, location);
    // Stamp each quest with the exact time it was generated for speed-check anti-cheat
    const stampedQuests = newQuests.map(q => ({ ...q, generated_at: Date.now() }));
    setQuests(stampedQuests);
    setLoading(false);
  };

  const triggerComplete = (quest, index) => {
    setCompletingQuest({ quest, index });
    setPhotoFile(null);
  };

  const finalizeCompletion = async () => {
    if (!user || !completingQuest) return;
    
    if (!photoFile) {
      alert("Anti-Cheat: You MUST upload a photo to prove you completed this quest!");
      return;
    }

    setUploading(true);

    const { quest, index } = completingQuest;
    
    // Calculate time taken
    const timeTakenMs = Date.now() - (quest.generated_at || Date.now());
    const timeTakenMins = timeTakenMs / (1000 * 60);

    // Call AI Verification
    const verification = await verifyQuestCompletion(photoFile, quest.description, quest.durationStr, timeTakenMins);

    if (!verification.verified) {
      setUploading(false);
      alert(`❌ QUEST REJECTED ❌\n\nReason: ${verification.reason}\n\nNo XP awarded.`);
      setCompletingQuest(null);
      
      // Remove the quest since they failed it
      const updatedQuests = [...quests];
      updatedQuests.splice(index, 1);
      setQuests(updatedQuests);
      return;
    }

    let imageUrl = null;

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('quest_photos').upload(fileName, photoFile);
      if (!uploadError) {
        const { data } = supabase.storage.from('quest_photos').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    const updatedQuests = [...quests];
    updatedQuests.splice(index, 1);
    setQuests(updatedQuests);
    setCompletingQuest(null);
    setUploading(false);

    confetti({
      particleCount: 150, spread: 80, origin: { y: 0.6 },
      colors: ['#FDF1D5', '#F7D4DA', '#D1EAE0', '#E0D4F0', '#0A66C2']
    });

    await supabase.from('completed_quests').insert([{
      user_id: user.id, title: quest.title, category: quest.category,
      xp_earned: quest.xp, description: quest.description, image_url: imageUrl
    }]);

    let newXp = stats.xp + quest.xp;
    let newLevel = stats.level;
    let leveledUp = false;
    if (newXp >= stats.level * 100) {
      newXp = newXp - (stats.level * 100);
      newLevel += 1;
      leveledUp = true;
    }

    const newStats = { ...stats, xp: newXp, level: newLevel, quests_completed: stats.quests_completed + 1, last_quest_date: new Date().toISOString() };
    setStats(newStats);
    await supabase.from('user_stats').update({ xp: newXp, level: newLevel, quests_completed: stats.quests_completed + 1, last_quest_date: new Date().toISOString() }).eq('user_id', user.id);

    // Loot Drop Logic for Epic/Legendary
    if (quest.rarity === 'Epic' || quest.rarity === 'Legendary') {
      const lootType = quest.rarity === 'Legendary' ? 'legendary_lootbox' : 'epic_lootbox';
      
      const { data: inv } = await supabase.from('inventory').select('*').eq('user_id', user.id).eq('item_type', lootType).single();
      if (inv) {
        await supabase.from('inventory').update({ quantity: inv.quantity + 1 }).eq('id', inv.id);
      } else {
        await supabase.from('inventory').insert([{ user_id: user.id, item_type: lootType, quantity: 1 }]);
      }
      
      setLootDrop(quest.rarity); // Trigger loot modal
    } else if (leveledUp) {
      setTimeout(() => alert(`🎉 LEVEL UP! You are now Level ${newLevel}! 🎉`), 500);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Dashboard Banner Image */}
      <div className="neo-box border-4 border-black w-full h-48 md:h-64 overflow-hidden relative mb-8">
        <img src="/images/dashboard_banner.png" alt="Questline Realm" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      <div>
        <div className="text-orange-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-2">
          <span>✦</span> TODAY'S BOARD
        </div>
        <h2 className="font-display font-black text-5xl tracking-tight leading-none mb-6">
          Hey {stats.display_name || user?.email?.split('@')[0] || 'Adventurer'}. What's the play?
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="LEVEL" value={stats.level} subtitle={`${stats.xp} XP / ${xpRequired}`} bg="bg-neo-yellow" />
        <StatCard title="STREAK" value={stats.streak} subtitle="days in a row" bg="bg-neo-pink" />
        <StatCard title="QUESTS" value={stats.quests_completed} subtitle="completed all-time" bg="bg-neo-green" />
        <StatCard title="BADGES" value={stats.badges_unlocked} subtitle="unlocked" bg="bg-neo-purple" />
      </div>

      <div className="neo-box p-4 flex flex-col gap-2">
        <div className="flex justify-between font-bold text-sm uppercase">
          <span>XP TO LEVEL {stats.level + 1}</span>
          <span>{stats.xp} / {xpRequired}</span>
        </div>
        <div className="h-4 border-2 border-black w-full overflow-hidden bg-white">
          <div className="h-full bg-neo-blue border-r-2 border-black transition-all duration-1000 ease-out" style={{ width: `${xpProgress}%` }}></div>
        </div>
      </div>

      {activeDuels.length > 0 && (
        <div className="neo-box p-6 bg-red-500 text-white border-4 border-black">
          <div className="font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-4">
            <span>⚔️</span> ACTIVE DUELS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDuels.map(duel => {
              const isChallenger = duel.challenger_id === user?.id;
              const opponent = isChallenger ? duel.defender?.display_name : duel.challenger?.display_name;
              const myScore = isChallenger ? duel.challenger_score : duel.defender_score;
              const oppScore = isChallenger ? duel.defender_score : duel.challenger_score;
              return (
                <div key={duel.id} className="bg-white text-black p-4 border-4 border-black font-display font-black flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-center w-1/3">
                    <div className="text-sm font-bold text-gray-500 mb-1">{stats.display_name || 'You'}</div>
                    <div className="text-3xl text-orange-500">{myScore}</div>
                  </div>
                  <div className="text-center text-4xl italic text-red-500 w-1/3">VS</div>
                  <div className="text-center w-1/3">
                    <div className="text-sm font-bold text-gray-500 mb-1">{opponent || 'Opponent'}</div>
                    <div className="text-3xl text-neo-blue">{oppScore}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 neo-box p-6 bg-neo-yellow">
          <div className="text-orange-500 font-bold uppercase text-xs tracking-wider mb-2 border-t-2 border-orange-500 pt-1 inline-block">ADVENTURE GENERATOR</div>
          <h3 className="font-display font-black text-3xl leading-none mb-6">What's the vibe right now?</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-sm uppercase border-t-2 border-black pt-1 mb-2">MOOD</label>
                <select className="neo-input w-full font-bold" value={mood} onChange={(e) => setMood(e.target.value)}>
                  <option>🔎 Curious</option><option>⚡️ Energetic</option><option>😴 Chill</option><option>🎨 Creative</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-sm uppercase border-t-2 border-black pt-1 mb-2">TIME YOU HAVE</label>
                <select className="neo-input w-full font-bold" value={time} onChange={(e) => setTime(e.target.value)}>
                  <option>15 minutes</option><option>30 minutes</option><option>1 hour</option><option>Half day</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-bold text-sm uppercase border-t-2 border-black pt-1 mb-2">INTERESTS</label>
              <input type="text" placeholder="e.g. books, matcha" className="neo-input w-full" value={interests} onChange={(e) => setInterests(e.target.value)} />
            </div>
            <button className="neo-button w-full bg-orange-500 text-white text-lg mt-4 flex items-center justify-center gap-2" onClick={handleGenerate} disabled={loading}>
              <span>⚡</span> {loading ? 'Generating...' : 'Generate Quests'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="text-orange-500 font-bold uppercase text-xs tracking-wider mb-2 border-t-2 border-orange-500 pt-1 inline-block">PENDING QUESTS</div>
          <h3 className="font-display font-black text-3xl leading-none mb-6">{quests.length} adventures waiting</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {quests.map((q, i) => (
              <QuestCard key={i} quest={q} onComplete={() => triggerComplete(q, i)} onRemove={() => { const u = [...quests]; u.splice(i, 1); setQuests(u); }} />
            ))}
            {quests.length === 0 && !loading && (
              <div className="col-span-1 sm:col-span-2 p-12 border-4 border-dashed border-black/20 text-center font-bold text-gray-400">Generate some quests to get started!</div>
            )}
          </div>
        </div>
      </div>

      {completingQuest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="neo-box bg-white p-8 max-w-md w-full relative">
            <button onClick={() => setCompletingQuest(null)} className="absolute top-4 right-4 bg-gray-200 border-2 border-black p-1 hover:bg-gray-300"><X size={20} /></button>
            <h2 className="font-display font-black text-3xl mb-2">Quest Completed!</h2>
            <p className="font-bold text-black/70 mb-6">You're about to earn {completingQuest.quest.xp} XP.</p>
            <div className="mb-6">
              <label className="block font-bold text-sm uppercase border-t-2 border-black pt-1 mb-2 flex items-center gap-2 text-red-600">
                <Camera size={16} /> MANDATORY: Upload Photo Proof
              </label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="neo-input w-full bg-orange-50 cursor-pointer" />
              <p className="text-xs font-bold mt-2 opacity-70">The AI will analyze your photo. If you cheat, you get NO XP!</p>
            </div>
            <button onClick={finalizeCompletion} disabled={uploading} className="neo-button w-full bg-orange-500 text-white text-xl flex justify-center items-center gap-2">
              {uploading ? 'Uploading & Saving...' : 'Claim Reward ✅'}
            </button>
          </div>
        </div>
      )}

      {lootDrop && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in zoom-in duration-500">
          <div className={`neo-box p-8 max-w-md w-full text-center ${lootDrop === 'Legendary' ? 'bg-orange-400' : 'bg-neo-purple'}`}>
            <Gift size={64} className="mx-auto mb-4 text-white animate-bounce" />
            <h2 className="font-display font-black text-5xl mb-2 text-white uppercase tracking-wider">{lootDrop} DROP!</h2>
            <p className="font-bold text-white mb-6">
              You completed a highly difficult quest and earned a {lootDrop} Loot Box! It has been added to your inventory in the Shop.
            </p>
            <button onClick={() => setLootDrop(null)} className="neo-button bg-white text-black text-xl w-full">Awesome!</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, bg }) {
  return (
    <div className={`neo-box p-4 flex flex-col justify-between ${bg}`}>
      <div className="font-bold text-xs sm:text-sm uppercase border-t-2 border-black pt-1 mb-2 sm:mb-4 flex items-center gap-2">
        {title === 'STREAK' && '🔥'}{title === 'QUESTS' && '🏆'}{title === 'BADGES' && '🎖️'}{title === 'LEVEL' && '⭐'}{title}
      </div>
      <div className="font-display font-black text-4xl sm:text-5xl mb-1">{value}</div>
      <div className="text-xs sm:text-sm font-medium text-black/70 mt-auto">{subtitle}</div>
    </div>
  );
}

function QuestCard({ quest, onComplete, onRemove }) {
  const getRarityColor = () => {
    switch(quest.rarity) {
      case 'Legendary': return 'bg-orange-400 border-4 border-yellow-300 text-white';
      case 'Epic': return 'bg-neo-purple text-white';
      case 'Rare': return 'bg-neo-blue text-white';
      default: return 'bg-white text-black';
    }
  };

  return (
    <div className={`neo-box flex flex-col ${getRarityColor()}`}>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            <div className="border-2 border-black bg-white text-black px-2 py-1 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{quest.category}</div>
            {quest.rarity && quest.rarity !== 'Common' && (
              <div className="border-2 border-black bg-black text-white px-2 py-1 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {quest.rarity}
              </div>
            )}
          </div>
          <div className="border-2 border-black bg-white text-black px-2 py-1 font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">✦ +{quest.xp} XP</div>
        </div>
        <h4 className="font-display font-black text-2xl leading-tight mb-3">{quest.title}</h4>
        <p className="text-sm font-medium leading-relaxed mb-4 flex-1">{quest.description}</p>
      </div>
      <div className="p-4 border-t-4 border-black bg-white flex gap-2">
        <button onClick={onComplete} className="neo-button flex-1 bg-orange-500 text-white flex items-center justify-center gap-2 px-2">
          <span>✅</span> <span className="hidden sm:inline">I did it</span>
        </button>
        <button onClick={onRemove} className="neo-button bg-white text-black px-4">✕</button>
      </div>
    </div>
  );
}
