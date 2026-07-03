import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Zap, Shield, Sparkles, Gift } from 'lucide-react';

export default function Shop() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [openingLoot, setOpeningLoot] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);

    const { data: myStats } = await supabase.from('user_stats').select('*').eq('user_id', session.user.id).single();
    if (myStats) setStats(myStats);

    const { data: myInv } = await supabase.from('inventory').select('*').eq('user_id', session.user.id);
    if (myInv) setInventory(myInv);

    setLoading(false);
  };

  const buyItem = async (itemType, cost) => {
    if (stats.xp < cost) {
      alert("Not enough XP!");
      return;
    }

    const confirm = window.confirm(`Spend ${cost} XP to buy this item?`);
    if (!confirm) return;

    // Deduct XP
    const newXp = stats.xp - cost;
    await supabase.from('user_stats').update({ xp: newXp }).eq('user_id', user.id);
    
    // Add to inventory
    // Check if item exists to increment, else insert
    const existingItem = inventory.find(i => i.item_type === itemType);
    if (existingItem) {
      await supabase.from('inventory').update({ quantity: existingItem.quantity + 1 }).eq('id', existingItem.id);
    } else {
      await supabase.from('inventory').insert([{ user_id: user.id, item_type: itemType, quantity: 1 }]);
    }

    alert('Purchase successful!');
    fetchData(); // Refresh UI
  };

  const equipTheme = async (themeName) => {
    await supabase.from('user_stats').update({ active_theme: themeName }).eq('user_id', user.id);
    alert('Theme equipped! The page will now reload.');
    window.location.reload();
  };

  const openLootBox = async (item) => {
    if (!item.item_type.includes('lootbox')) return;
    
    // Deduct loot box
    if (item.quantity > 1) {
      await supabase.from('inventory').update({ quantity: item.quantity - 1 }).eq('id', item.id);
    } else {
      await supabase.from('inventory').delete().eq('id', item.id);
    }

    const isLegendary = item.item_type === 'legendary_lootbox';
    const rewardXp = isLegendary ? Math.floor(Math.random() * 500) + 500 : Math.floor(Math.random() * 200) + 100;

    // Grant XP
    await supabase.from('user_stats').update({ xp: stats.xp + rewardXp }).eq('user_id', user.id);
    
    confetti({
      particleCount: 150, spread: 100, origin: { y: 0.5 },
      colors: isLegendary ? ['#F59E0B', '#FDE68A'] : ['#8B5CF6', '#C4B5FD']
    });

    setOpeningLoot(`You opened a ${isLegendary ? 'Legendary' : 'Epic'} Loot Box and found ${rewardXp} XP!`);
    fetchData();
  };

  if (loading) return <div className="font-bold text-center mt-20">Loading Shop...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <div className="text-orange-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-2">
          <span>✦</span> THE BAZAAR
        </div>
        <h2 className="font-display font-black text-5xl tracking-tight leading-none mb-6">
          Cosmetics & Perks
        </h2>
      </div>

      <div className="neo-box p-4 bg-black text-white flex justify-between items-center">
        <div className="font-bold uppercase flex items-center gap-2">
          <ShoppingBag size={20} /> Your Wallet
        </div>
        <div className="font-display font-black text-3xl text-neo-yellow">
          {stats?.xp} XP
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Item 1 */}
        <div className="neo-box flex flex-col bg-white border-4 border-black">
          <div className="bg-neo-pink h-32 flex items-center justify-center border-b-4 border-black overflow-hidden relative">
            <img src="/images/xp_booster.png" alt="XP Booster" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply" />
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-display font-black text-2xl mb-2">XP Booster</h3>
            <p className="text-sm font-bold text-black/70 mb-4 flex-1">
              Gain 2x XP from all quests generated in the next 24 hours. Level up faster!
            </p>
            <button 
              onClick={() => buyItem('xp_booster', 500)}
              className="neo-button w-full bg-black text-white"
            >
              Buy for 500 XP
            </button>
          </div>
        </div>

        {/* Item 2 */}
        <div className="neo-box flex flex-col bg-white border-4 border-black">
          <div className="bg-neo-blue h-32 flex items-center justify-center border-b-4 border-black overflow-hidden relative">
            <img src="/images/streak_freeze.png" alt="Streak Freeze" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply" />
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-display font-black text-2xl mb-2">Streak Freeze</h3>
            <p className="text-sm font-bold text-black/70 mb-4 flex-1">
              Missed a day? Automatically protect your streak from resetting once.
            </p>
            <button 
              onClick={() => buyItem('streak_freeze', 300)}
              className="neo-button w-full bg-black text-white"
            >
              Buy for 300 XP
            </button>
          </div>
        </div>

        {/* Item 3 */}
        <div className="neo-box flex flex-col bg-white border-4 border-black">
          <div className="bg-neo-purple h-32 flex items-center justify-center border-b-4 border-black overflow-hidden relative">
            <img src="/images/theme_cyberpunk.png" alt="Cyberpunk Theme" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply" />
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-display font-black text-2xl mb-2">Cyberpunk Theme</h3>
            <p className="text-sm font-bold text-black/70 mb-4 flex-1">
              Unlock a gorgeous Midnight Cyberpunk color scheme for your entire dashboard.
            </p>
            <button 
              onClick={() => buyItem('theme_cyberpunk', 1500)}
              className="neo-button w-full bg-black text-white"
            >
              Buy for 1500 XP
            </button>
          </div>
        </div>

      </div>

      <div className="mt-12">
        <h3 className="font-bold uppercase border-b-4 border-black pb-2 mb-6">Your Inventory</h3>
        {inventory.length === 0 ? (
          <div className="text-center font-bold text-gray-400 py-8 border-4 border-dashed border-gray-200">
            Your inventory is empty. Buy something from the shop!
          </div>
        ) : (
          <div className="flex gap-4 flex-wrap">
            {inventory.map(item => {
              const isLootBox = item.item_type.includes('lootbox');
              const isTheme = item.item_type.includes('theme_');
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => {
                    if (isLootBox) openLootBox(item);
                    if (isTheme) equipTheme(item.item_type.replace('_', '-'));
                  }}
                  className={`neo-box p-4 bg-white border-4 border-black font-bold text-sm flex items-center gap-2 ${isLootBox || isTheme ? 'cursor-pointer hover:bg-orange-100' : ''}`}
                >
                  <span className="bg-black text-white px-2 py-1">{item.quantity}x</span>
                  {item.item_type.replace('_', ' ').toUpperCase()}
                  {isLootBox && <Gift size={16} className="text-orange-500 ml-2" />}
                  {isTheme && <span className="ml-2 text-xs text-blue-500 font-bold">(Click to Equip)</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {openingLoot && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in zoom-in duration-500">
          <div className="neo-box p-8 max-w-md w-full text-center bg-white border-8 border-black">
            <Gift size={64} className="mx-auto mb-4 text-orange-500 animate-bounce" />
            <h2 className="font-display font-black text-4xl mb-4 text-black uppercase">EPIC LOOT!</h2>
            <p className="font-bold text-black/80 mb-8 text-xl">
              {openingLoot}
            </p>
            <button onClick={() => setOpeningLoot(null)} className="neo-button bg-black text-white text-xl w-full">Claim Reward</button>
          </div>
        </div>
      )}
    </div>
  );
}
