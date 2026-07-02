import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Journey() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourney();
  }, []);

  const fetchJourney = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('completed_quests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('completed_at', { ascending: false });

    if (data) setQuests(data);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="text-orange-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-2">
          <span>✦</span> YOUR JOURNEY
        </div>
        <h2 className="font-display font-black text-5xl tracking-tight leading-none mb-6">
          Look how far you've come.
        </h2>
      </div>

      {loading ? (
        <div className="font-bold text-center">Loading...</div>
      ) : quests.length === 0 ? (
        <div className="neo-box p-8 bg-neo-yellow text-center space-y-4">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="font-display font-black text-3xl">Ready for your next adventure?</h3>
          <p className="font-medium text-black/70 max-w-md mx-auto">
            You haven't completed any quests yet. Head back to the dashboard to generate some quests and start your journey!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <div key={quest.id} className="neo-box bg-white flex flex-col hover:-translate-y-1 transition-transform overflow-hidden">
              {quest.image_url && (
                <div className="w-full h-48 border-b-4 border-black bg-gray-100 relative">
                  <img src={quest.image_url} alt="Quest Memory" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-xs uppercase bg-neo-green border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {quest.category}
                  </span>
                  <span className="text-xs font-bold text-black/50">
                    {new Date(quest.completed_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-display font-black text-xl mb-2">{quest.title}</h3>
                <p className="text-sm font-medium flex-1 text-black/80">{quest.description}</p>
                <div className="mt-4 pt-4 border-t-2 border-black/10 font-bold text-sm flex items-center gap-2 text-neo-blue">
                  <span>✦</span> Earned {quest.xp_earned} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
