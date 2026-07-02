<div align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/1000/1000181.png" alt="Questline Logo" width="120" />

  # ⚔️ Questline

  **Turn your real life into a massive multiplayer RPG.**  
  *Questline is an AI-powered social network that gamifies the real world by generating dynamic, location-based quests, enforcing anti-cheat with computer vision, and letting you compete with friends on global leaderboards.*

  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)
  [![Gemini AI](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)](https://deepmind.google/technologies/gemini/)
</div>

---

## 🌟 The Vision

Stop doom-scrolling and start adventuring. **Questline** uses Google's Gemini AI to generate hyper-personalized real-world tasks based on your mood, location, and the amount of free time you have. Whether it's a 10-minute "Common" quest to clean your desk, or a 2-hour "Legendary" quest to explore a new neighborhood, Questline rewards you with XP, loot drops, and bragging rights.

## ✨ Features

### 🧠 The AI Quest Engine
- **Dynamic Generation:** Input your current mood, time limit, and location. The Gemini API dynamically writes custom real-world micro-adventures for you.
- **Rarity System:** Quests are randomly rolled as **Common, Rare, Epic, or Legendary**. Higher rarities drop massive XP and feature glowing neo-brutalist UI effects.

### 🛡️ The AI Anti-Cheat System
- **Mandatory Photo Proof:** You can't just click "I did it." You must upload photo evidence of your completed quest.
- **Computer Vision Judge:** The Gemini Vision model analyzes your photo. If you try to upload a picture of a blank wall to cheat, the AI will reject your claim and award 0 XP!
- **Speed-Run Prevention:** Quests are secretly time-stamped upon generation. If you try to claim a 2-hour quest in 3 minutes, the system intercepts and blocks the exploit.

### 💰 Economy & The Shop
- **Loot Boxes:** Completing Epic and Legendary quests triggers a massive drop animation, depositing a Loot Box into your inventory. Crack them open for a random burst of bonus XP and confetti!
- **Dynamic Themes:** Spend your hard-earned XP to unlock the "Midnight Cyberpunk" theme and instantly reskin the entire application.

### ⚔️ PvP & Social Hub
- **Player Tags:** Every user gets an auto-generated Discord-style ID (e.g., `Adventurer#4921`).
- **1v1 Duels:** Challenge friends to a 48-hour "Race to 1000 XP". A real-time VS widget tracks the competition on your dashboard!
- **Guilds:** Create factions, assign custom emoji emblems, and invite members.
- **Leaderboards:** Filter by Global rankings or Local (City-based) rankings to see who the highest-level adventurer in your town is.
- **Trophy Room:** A dedicated Hall of Fame that reads your database stats to automatically unlock persistent Badges (e.g., "First Blood", "Social Butterfly").

### 🚀 Production & Enterprise Ready
- **PWA Installable:** Visit the site on your phone and install it directly to your Home Screen. It behaves exactly like a native iOS/Android application.
- **Performance Optimized:** Built with React Lazy Loading and Vite Code Splitting. The app boots instantly by only downloading the components you are actively viewing.
- **Crash Protection:** Wrapped in a global React Error Boundary that secretly logs stack traces to a Supabase `error_logs` table.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS (Neo-brutalist aesthetic), Lucide Icons
- **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Storage Buckets, Auth)
- **AI Integration:** Google Generative AI (Gemini 1.5 Pro & Vision)
- **Testing:** Vitest & React Testing Library
- **Deployment:** Vercel

---

## 💻 Local Setup

Want to run Questline locally? Follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/ayush200545/Questline-A-small-game.git
cd Questline-A-small-game
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your API keys:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the Dev Server
```bash
npm run dev
```

---

## 🗄️ Supabase Database Setup

Questline relies heavily on PostgreSQL Row Level Security (RLS). If you are setting up your own Supabase instance, you must run the included SQL migration files in your Supabase SQL Editor in this order:

1. `supabase_schema.sql` (Base tables and Auth triggers)
2. `supabase_schema_guilds.sql` (Guilds architecture)
3. `supabase_schema_ultimate.sql` (Economy, Friendships, and Competitions)
4. `supabase_fix_settings.sql` (RLS patches and Player Tag backfills)
5. `supabase_error_logs.sql` (Enterprise crash logging table)
6. `supabase_schema_admin.sql` / `supabase_grant_admin.sql` (Optional: Admin role assignments)

---

<div align="center">
  <i>"The real world is the best RPG. It just needed a better UI."</i>
</div>
