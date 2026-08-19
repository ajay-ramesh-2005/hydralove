# HydraLove 💧🌸 • Kawaii Personal Hydration Reminder PWA

**HydraLove** is a private, mobile-first Progressive Web App (PWA) designed for **two people**. It turns daily water tracking into a cute, warm, and satisfying experience with a tiny animated drop companion living inside a dynamic living garden and pond!

---

## ✨ Features

- **Kawaii Living Garden & Pond**:
  - Center stage features a tiny, blob-shaped water-drop character that reacts to your hydration level.
  - **Dynamic Progression**:
    - **0% (Sleepy)**: Quiet pond, sleeping drop companion.
    - **25% (Waking Up)**: Water level rises, flowers bloom, floating bubbles, fluttering butterfly.
    - **50% (Happy)**: Fuller pond, blooming tulips & daisies, cute orange koi fish swimming in water.
    - **75% (Garden Comes Alive)**: Flowering cherry blossom tree, multiple butterflies & fish, floating sparkles.
    - **100%+ (Full Celebration)**: Full blooming paradise, floating hearts, celebration banner, confetti fanfare!
- **9 Character Emotion States**:
  - Sleepy 💤, Tired 🥺, Waking Up 💧, Better 🌸, Happy 🌼, Excited 🌿, Almost There 🚀, Super Happy 🎉, Proud 👑.
- **Cute Water Addition Animation**:
  - Tapping `+100 ml`, `+250 ml`, `+500 ml` or `Custom` drops a water droplet into the pond, creating cute ripples, rising water level, floating bubbles, and companion reactions!
- **Hydration Goal Calculation**:
  - Reusable algorithm based on body weight in kg (0-20kg = 1.0L, >20-40kg = 2.0L, >40-50kg = 2.5L, >50-60kg = 3.0L, ..., >100kg = 5.0L + 0.5L / 10kg).
- **Offline-First Architecture**:
  - Full PWA support with IndexedDB storage (`idb`).
  - Automatic background sync when internet connection returns.
  - Automatic midnight reset based on local timezone date.
- **Hidden 15-Tap Admin Dashboard**:
  - Tap the tiny heart icon in the top header **15 times within 5 seconds** to unlock the hidden Admin Dashboard!
  - 2-User overview cards with mini live character previews.
  - Drink entries timeline & historical statistics (Today, Yesterday, Last 7 days, Last 30 days).
  - Custom Web Push Notification sender with cute presets.
- **Together Celebration**:
  - Triggers a special dual celebration modal when both users hit 100% hydration on the same day!
- **Cute Synthesized Audio**:
  - Web Audio API synthesized water pops, tap clicks, milestone chimes, and celebration fanfares.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Local Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production

```bash
npm run build
```

---

## 🗄️ Database & Web Push Setup (Supabase)

For multi-device synchronization and push notifications:

1. Create a project in [Supabase](https://supabase.com).
2. Execute the provided SQL script in `supabase/schema.sql`.
3. Set your environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
   ```
4. Deploy the Supabase Edge Function in `supabase/functions/send-push/index.ts`.

---

## 📱 PWA Home Screen Installation

### iPhone (Safari)
1. Open HydraLove in Safari.
2. Tap the **Share** button.
3. Select **Add to Home Screen**.

### Android (Chrome)
1. Open HydraLove in Chrome.
2. Tap the 3 dots menu (**⋮**).
3. Select **Install app** or **Add to Home Screen**.
