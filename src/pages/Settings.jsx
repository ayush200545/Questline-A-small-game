import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, User as UserIcon, Upload, Copy, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [profile, setProfile] = useState({
    display_name: '',
    city: '',
    avatar_url: '',
    player_tag: ''
  });
  
  const [copied, setCopied] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      if (data) {
        setProfile({
          display_name: data.display_name || '',
          city: data.city || '',
          avatar_url: data.avatar_url || '',
          player_tag: data.player_tag || ''
        });
      }
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      // Clear the URL input if they upload a file
      setProfile(prev => ({ ...prev, avatar_url: '' }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    let finalAvatarUrl = profile.avatar_url;

    // Handle Direct File Upload if present
    if (avatarFile && user) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('quest_photos')
        .upload(fileName, avatarFile);
        
      if (!uploadError) {
        const { data } = supabase.storage.from('quest_photos').getPublicUrl(fileName);
        finalAvatarUrl = data.publicUrl;
      } else {
        alert('Failed to upload avatar image.');
      }
    }
    
    const newPlayerTag = profile.player_tag || (profile.display_name || 'Adventurer') + '#' + Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        display_name: profile.display_name,
        city: profile.city,
        avatar_url: finalAvatarUrl,
        player_tag: newPlayerTag
      }, { onConflict: 'user_id' });
      
    if (error) {
      console.error('Update error:', error);
      alert('Failed to save profile. Check console for details.');
      setSaving(false);
      return;
    }
      
    // Update local state to reflect the new URL, tag, and clear file
    setProfile(prev => ({ ...prev, avatar_url: finalAvatarUrl, player_tag: newPlayerTag }));
    setAvatarFile(null);
    setAvatarPreview(null);
      
    setSaving(false);
    
    // Instead of reload, just show the alert. React Router handles the rest.
    // However, Navbar won't update immediately unless we dispatch a global event or reload.
    // Let's use a soft reload by navigating to the same page or just doing location.reload.
    // The user prefers seeing the changes instantly.
    alert('Profile saved successfully!');
    window.location.reload(); 
  };

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const detectedCity = data.address.city || data.address.town || data.address.village || data.address.county || "Unknown Location";
          setProfile(prev => ({ ...prev, city: detectedCity }));
        } catch (e) {
          alert('Failed to detect location automatically.');
        }
      });
    } else {
      alert("Geolocation is not available in your browser.");
    }
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

  if (loading) return <div className="font-bold text-center mt-20">Loading Settings...</div>;

  const currentDisplayAvatar = avatarPreview || profile.avatar_url;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <div className="text-orange-500 font-bold uppercase text-sm tracking-wider flex items-center gap-2 mb-2">
          <span>✦</span> YOUR PROFILE
        </div>
        <h2 className="font-display font-black text-5xl tracking-tight leading-none mb-6">
          Settings
        </h2>
      </div>

      {profile.player_tag && (
        <div className="neo-box p-4 bg-neo-green border-4 border-black flex justify-between items-center cursor-pointer hover:bg-green-400 transition-colors" onClick={copyTag}>
          <div>
            <div className="font-bold text-xs uppercase opacity-80 mb-1">Your Player Tag</div>
            <div className="font-display font-black text-2xl">{profile.player_tag}</div>
          </div>
          <button className="neo-button bg-white px-4 py-2 flex items-center gap-2">
            {copied ? <><CheckCircle size={18} className="text-green-600"/> Copied!</> : <><Copy size={18}/> Copy</>}
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="neo-box p-8 space-y-8">
        
        {/* Avatar Section */}
        <div className="p-4 border-2 border-black bg-orange-50">
          <label className="block font-bold text-sm uppercase mb-4 text-center">Profile Picture</label>
          
          <div className="flex flex-col items-center gap-4">
            {/* Avatar Preview */}
            <div 
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {currentDisplayAvatar ? (
                <img src={currentDisplayAvatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-black object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="w-24 h-24 bg-white rounded-full border-4 border-black flex items-center justify-center transition-transform group-hover:scale-105">
                  <UserIcon size={40} className="text-gray-300" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload color="white" />
              </div>
            </div>

            {/* Hidden File Input */}
            <input 
              type="file" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            <span className="font-bold text-xs uppercase bg-black text-white px-3 py-1">
              Click Image to Upload
            </span>

            <div className="w-full flex items-center gap-2 mt-2">
              <div className="h-px bg-black/20 flex-1"></div>
              <span className="font-bold text-xs text-black/40">OR PASTE URL</span>
              <div className="h-px bg-black/20 flex-1"></div>
            </div>

            <input 
              type="text" 
              placeholder="https://example.com/avatar.png" 
              className="neo-input w-full text-center"
              value={profile.avatar_url}
              onChange={(e) => {
                setProfile({...profile, avatar_url: e.target.value});
                setAvatarFile(null);
                setAvatarPreview(null);
              }}
            />
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block font-bold text-sm uppercase border-t-2 border-black pt-1 mb-2">Display Name</label>
          <input 
            type="text" 
            required
            placeholder="Adventurer Name" 
            className="neo-input w-full"
            value={profile.display_name}
            onChange={(e) => setProfile({...profile, display_name: e.target.value})}
          />
        </div>

        {/* Location Section */}
        <div>
          <label className="block font-bold text-sm uppercase border-t-2 border-black pt-1 mb-2">Your City (For Local Leaderboards)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. New York, London" 
              className="neo-input flex-1"
              value={profile.city}
              onChange={(e) => setProfile({...profile, city: e.target.value})}
            />
            <button 
              type="button"
              onClick={detectLocation}
              className="neo-button bg-neo-green flex items-center gap-2 px-4"
            >
              <MapPin size={16} /> Auto-Detect
            </button>
          </div>
          <p className="text-xs font-bold text-black/50 mt-2">Your city allows you to compete on the local leaderboards!</p>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="neo-button w-full bg-orange-500 text-white mt-4 text-xl py-4"
        >
          {saving ? 'Uploading & Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
