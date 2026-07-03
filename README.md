# ⚔️ Questline: Real-Life Micro-Adventures

![Questline Banner](/public/images/dashboard_banner.png)

> **Questline** is a massively multiplayer, AI-powered web application that gamifies real life. Level up, complete dynamic AI-generated quests in the real world, duel your friends, and unlock premium aesthetic themes in an immersive neo-brutalist world.

---

## 🌟 Core Features

- **🤖 AI-Generated Quests (Gemini AI)**: Acts as a dynamic "Dungeon Master". The AI engine generates highly personalized, actionable real-life quests (e.g., "Take a photo of a brutalist building in your city") based on your current location and mood.
- **⚡ Real-Time Multiplayer (WebSockets)**: Powered by Supabase Realtime. XP gains, Leaderboard rank shifts, and 1v1 Duels update dynamically across all connected clients instantly without a page refresh.
- **🏆 Economy & Progression**: Complete quests to earn XP. Level up your character, earn Achievement Badges, and climb the global leaderboards.
- **🛒 Virtual Shop & Cosmetics**: Spend your hard-earned XP on "Streak Freezes", "XP Boosters", and global unlockable CSS Themes (like the Midnight Cyberpunk theme) that instantly reskin the entire application.
- **🏰 Guilds & Social Graph**: Form group-based factions with custom leaders, rosters, and a fully functional friendship request system.
- **🎨 Custom Neo-Brutalist Design**: A strict, custom-built design system utilizing high-contrast flat vectors, heavy black box-shadows, and an interactive blueprint graph-paper background.

---

## 🛠️ Technology Stack

### Frontend
- **React 19**
- **Vite**
- **Tailwind CSS (v4)**
- **Lucide React** (Icons)

### Backend & Infrastructure
- **Supabase** (PostgreSQL Database, Authentication, Edge Storage, Realtime)
- **Google Gemini API** (Generative AI)
- **Resend** (Custom SMTP Email Delivery)
- **Vercel** (Hosting & CI/CD Pipeline)

---

## 🏗️ Architecture & Security

This project utilizes a highly relational PostgreSQL schema with advanced security measures:

- **Row Level Security (RLS)**: Strict data isolation policies ensuring users can only mutate their own data.
- **Automated Database Triggers**: Complex PostgreSQL functions (e.g., `handle_new_user()`) automatically fire on Auth events to generate randomized `player_tags` and insert foundational records.
- **Cloud Storage Integration**: Secure Supabase Storage buckets configured to handle custom avatar uploads and photo evidence of quest completions.
- **Role-Based Access Control (RBAC)**: Internal God-Mode Admin system allowing designated users to bypass standard RLS constraints for moderation.

---

## 🚀 Running Locally

To run this project locally, you will need Node.js and a Supabase account.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ayush200545/Questline-A-small-game.git
   cd Questline-A-small-game
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📜 License
This project is open-source and available under the MIT License.
