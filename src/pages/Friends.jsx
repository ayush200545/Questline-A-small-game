import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, Users, Check, X, Swords, Copy, CheckCircle } from 'lucide-react';

export default function Friends() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchTag, setSearchTag] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    setUser(session.user);

    // Get current user profile (generate tag if null for old accounts)
    let { data: myStats } = await supabase.from('user_stats').select('*').eq('user_id', session.user.id).single();
    if (myStats && !myStats.player_tag) {
      const newTag = `${myStats.display_name || 'User'}#${Math.floor(1000 + Math.random() * 9000)}`;
      await supabase.from('user_stats').update({ player_tag: newTag }).eq('user_id', session.user.id);
      myStats.player_tag = newTag;
    }
    setProfile(myStats);

    // Fetch friendships where user is involved
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

    if (friendships) {
      const acceptedIds = [];
      const pendingReqs = [];

      friendships.forEach(f => {
        if (f.status === 'accepted') {
          acceptedIds.push(f.user_id === session.user.id ? f.friend_id : f.user_id);
        } else if (f.status === 'pending' && f.friend_id === session.user.id) {
          // It's a request TO me
          pendingReqs.push(f.user_id);
        }
      });

      // Fetch profiles for accepted friends
      if (acceptedIds.length > 0) {
        const { data: friendProfiles } = await supabase.from('user_stats').select('*').in('user_id', acceptedIds);
        setFriends(friendProfiles || []);
      }
      
      // Fetch profiles for pending requests
      if (pendingReqs.length > 0) {
        const { data: reqProfiles } = await supabase.from('user_stats').select('*').in('user_id', pendingReqs);
        setRequests(reqProfiles || []);
      }
    }
    
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTag) return;
    const { data } = await supabase.from('user_stats').select('*').eq('player_tag', searchTag).single();
    setSearchResult(data || 'not_found');
  };

  const sendRequest = async (friendId) => {
    await supabase.from('friendships').insert([{ user_id: user.id, friend_id: friendId, status: 'pending' }]);
    alert('Friend request sent!');
    setSearchResult(null);
  };

  const respondToRequest = async (friendId, accept) => {
    if (accept) {
      await supabase.from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', friendId)
        .eq('friend_id', user.id);
    } else {
      await supabase.from('friendships')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id);
    }
    fetchFriendsData();
  };

  const challengeDuel = async (friendId) => {
    await supabase.from('competitions').insert([{
      challenger_id: user.id,
      defender_id: friendId,
      type: 'race_to_1000_xp',
      status: 'active'
    }]);
    alert('Duel initiated! Check your dashboard.');
  };

  const copyTag = () => {
    if (profile?.player_tag) {
      const fallbackCopy = () => {
        const el = document.createElement('textarea');
        el.value = profile.player_tag;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(profile.player_tag).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    }
  };

  if (loading) return <div className="font-bold text-center mt-20">Loading Social Network...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <div className="text-orange-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-2">
          <span>✦</span> THE GUILD HALL
        </div>
        <h2 className="font-display font-black text-5xl tracking-tight leading-none mb-4">
          Friends & Rivals
        </h2>
        
        <div 
          onClick={copyTag}
          className="inline-flex items-center gap-3 bg-black text-white px-4 py-2 cursor-pointer hover:bg-gray-800 transition-colors border-2 border-transparent hover:border-neo-yellow"
        >
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Your Player Tag</div>
            <div className="font-bold text-lg">{profile?.player_tag}</div>
          </div>
          {copied ? <CheckCircle size={20} className="text-neo-green"/> : <Copy size={20} className="text-gray-400"/>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Search & Requests */}
        <div className="md:col-span-1 space-y-8">
          
          <div className="neo-box p-4 bg-neo-yellow">
            <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
              <Search size={16} /> Add Friend
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="User#1234" 
                className="neo-input flex-1 text-sm"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
              />
              <button type="submit" className="neo-button bg-black text-white px-3">Go</button>
            </form>
            
            {searchResult === 'not_found' && (
              <div className="text-sm font-bold text-red-600">Player not found.</div>
            )}
            
            {searchResult && searchResult !== 'not_found' && (
              <div className="bg-white border-2 border-black p-3 flex justify-between items-center">
                <div className="font-bold text-sm">{searchResult.display_name}</div>
                <button 
                  onClick={() => sendRequest(searchResult.user_id)}
                  className="bg-neo-green border-2 border-black px-2 py-1 flex items-center justify-center hover:bg-green-400"
                >
                  <UserPlus size={16} />
                </button>
              </div>
            )}
          </div>

          {requests.length > 0 && (
            <div className="neo-box p-4 bg-neo-pink">
              <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-4">Incoming Requests</h3>
              <div className="space-y-2">
                {requests.map(req => (
                  <div key={req.user_id} className="bg-white border-2 border-black p-3 flex justify-between items-center">
                    <div className="font-bold text-sm">{req.display_name}</div>
                    <div className="flex gap-1">
                      <button onClick={() => respondToRequest(req.user_id, true)} className="bg-neo-green border-2 border-black p-1"><Check size={14}/></button>
                      <button onClick={() => respondToRequest(req.user_id, false)} className="bg-red-400 border-2 border-black p-1 text-white"><X size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Friend List */}
        <div className="md:col-span-2 neo-box p-6 bg-white">
          <h3 className="font-display font-black text-2xl mb-6 flex items-center gap-2">
            <Users size={24} /> Your Adventuring Party
          </h3>
          
          {friends.length === 0 ? (
            <div className="text-center font-bold text-gray-400 py-12 border-4 border-dashed border-gray-200">
              No friends yet! Search a player tag to add someone.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.map(f => (
                <div key={f.user_id} className="border-4 border-black p-4 flex flex-col justify-between group hover:bg-orange-50 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    {f.avatar_url ? (
                      <img src={f.avatar_url} className="w-12 h-12 rounded-full border-2 border-black object-cover" alt="avatar" />
                    ) : (
                      <div className="w-12 h-12 bg-orange-500 rounded-full border-2 border-black flex items-center justify-center">
                        <Users size={20} color="white" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-lg leading-tight">{f.display_name}</div>
                      <div className="text-xs font-bold text-black/50">Level {f.level} • {f.xp} XP</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => challengeDuel(f.user_id)}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-red-500 group-hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Swords size={16} /> Challenge to 1v1 Duel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
