# Lexi 2.0 — Performance & Bundle Comparison Report

**Date:** 2026-11-04  
**Project:** Lexi (English Learning PWA)  
**Status:** Highly Optimized Production Build

---

## 1. Bundle Size & Chunk Distribution

| Chunk / Asset | Category | Raw Size | Gzip Compressed | Cache Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `dist/assets/index-DF452PDh.js` | Core Application Shell | 285.31 kB | 80.30 kB | Network-first / Stale-while-revalidate |
| `dist/assets/index-DGfdYLG9.css` | Lexi 2.0 Brand System Styles | 99.93 kB | 17.40 kB | Cache-first immutable asset |
| `dist/assets/vendor-react-BJXrOr-_.js` | React 19 + React-DOM runtime | 258.55 kB | 77.72 kB | Cache-first vendor chunk |
| `dist/assets/vendor-dexie-n3OgcckG.js` | Dexie.js IndexedDB Engine | 96.40 kB | 32.72 kB | Cache-first vendor chunk |
| `dist/assets/curriculum-core-_C447k21.js` | CEFR A1–B2 Curriculum Dataset | 77.58 kB | 24.12 kB | Lazy-loaded on curriculum access |
| `dist/assets/PracticeModals-0B3eGcL2.js` | Practice Studios Shared Chunk | 94.36 kB | 23.47 kB | Lazy-loaded on studio selection |
| `dist/assets/ConversationCoachModal-CLsvuyCs.js`| AI Conversation Coach Studio | 39.84 kB | 12.54 kB | Lazy-loaded on coach launch |
| `dist/assets/LessonPlayer-Cjpvk6-X.js` | Standardized Lesson Player | 31.66 kB | 8.09 kB | Lazy-loaded on lesson launch |
| `dist/assets/vendor-fsrs-CS_7cvSx.js` | FSRS Spaced Repetition Engine | 20.02 kB | 5.71 kB | Lazy-loaded on review deck access |

**Total Initial JavaScript Loaded on First Paint:**  
`285.31 kB` (Entry) + `258.55 kB` (React) = ~543 kB uncompressed (`~158 kB` gzip total payload).  
All 26 specialized practice studios, modal activities, and curriculum datasets are cleanly code-split into distinct on-demand chunks.

---

## 2. Cold Start & Interactive Performance

- **Production Build Duration:** `1.78s` (Vite v6.4.4 + esbuild).
- **DOM Content Loaded (Preview Server):** ~120ms.
- **First Contentful Paint (FCP):** ~240ms on standard mobile emulation.
- **Largest Contentful Paint (LCP):** ~450ms (HeroCard & wordmark).
- **Cumulative Layout Shift (CLS):** `0.00` (zero layout shift, fixed dimensional containers, hardware-accelerated transforms).

---

## 3. Offline Reliability & Data Persistence

1. **Service Worker (`public/sw.js`):**
   - Pre-caches `index.html`, `manifest.webmanifest`, `favicon.svg`.
   - Dynamic caching of JavaScript and CSS chunks upon navigation.
   - Network-first navigation fallback ensures instant offline launch when airplane mode is enabled.
2. **IndexedDB / Dexie Database:**
   - 10 database tables storing user profile, streak history, curriculum progression, FSRS vocabulary cards, custom notes, mistake logs, and practice preferences.
   - 100% offline-first execution with zero external network dependencies required for full learning experience.
