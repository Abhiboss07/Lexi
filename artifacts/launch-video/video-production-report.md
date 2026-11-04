# Lexi 2.0 — Launch Video Production Report

**Date:** 2026-11-04  
**Project:** Lexi (English Learning PWA)  
**Tools Employed:** HyperFrames Engine (v0.9.10), GSAP 3.14.2, Brag / Brag Slim, Headless Chrome  
**Runtimes & Formats Delivered:**
1. **16:9 Landscape (1920×1080 @ 30fps):** `artifacts/launch-video/lexi-launch-16x9/`
2. **9:16 Vertical (1080×1920 @ 30fps):** `artifacts/launch-video/lexi-launch-9x16/`

---

## 1. Video Architecture & Technical Validation

Both video compositions were built deterministically using HyperFrames and GSAP timelines in accordance with the official HyperFrames contract.

### 1.1 Quality & Inspection Audit
Executed `npx hyperframes check` on both compositions with the following automated verification results:
- **Runtime Errors:** `0`
- **Layout Issues:** `0 across all sample points`
- **Motion Errors:** `0`
- **Contrast Check:** `100% text elements pass WCAG AA standards (> 4.5:1 / > 7:1)`
- **Keyframe Continuity:** First frame presents initial brand presence (no blank flash), smooth 3D mock rotations with zero layout stutter.

---

## 2. Keyframe Snapshots & Visual Proof

High-resolution snapshot frames were rendered across key timeline beats and stored for immediate visual inspection:

### 16:9 Landscape Snapshots (`artifacts/launch-video/snapshots-16x9/`)
- `frame-00-at-1.5s.png`: Scene 1 — Brand Hook & Wine Red / Light Sand Lexi Wordmark with Gold Sparkle.
- `frame-01-at-7s.png`: Scene 2 — Live Home & Practice 3D UI Mockups with CEFR Pathway Tag.
- `frame-02-at-13s.png`: Scene 3 — AI Conversation Coach dialogue card with live Progress Screen.
- `frame-03-at-18.5s.png`: Scene 4 — Final Outro with "100% Free", "Offline-First", "Zero Ads", and pulsing CTA.
- `contact-sheet.jpg`: Consolidated multi-frame review grid.

### 9:16 Vertical Snapshots (`artifacts/launch-video/snapshots-9x16/`)
- `frame-00-at-1.5s.png`: Vertical Hook & Animated Lexi Tile.
- `frame-01-at-7s.png`: Full-screen Mobile Device Frame showing Lexi Home.
- `frame-02-at-13s.png`: Mobile Device Frame showing Practice & Speaking Studio.
- `frame-03-at-18.5s.png`: Vertical Call to Action with stacked feature badges and Wine Red CTA button.
- `contact-sheet.jpg`: Vertical review grid for mobile platforms.

---

## 3. Launch Marketing & Distribution Copy (Humanizer-Refined)

### 3.1 Product Hunt / Hacker News Launch Copy
> **Title:** Lexi 2.0 — Free, offline-first English learning with real conversations  
> **Tagline:** No ads. No streaks anxiety. Learn English through real dialogue and adaptive practice.  
> **Body:**  
> Most language apps lock you into gamified drills and intrusive popups. Lexi was built differently.  
> It is 100% free, runs completely offline using local IndexedDB storage, and focuses on practical communication from Day 1.  
> With Lexi 2.0, we introduced a warm editorial design system in Wine Red and Light Sand, fixed mobile keyboard interactions, and created a gentle on-ramp for absolute beginners with phonetic sound guides.  
> Try it now in your browser or install it as a lightweight PWA.

### 3.2 Social Media / Short-Form Video Copy (X, LinkedIn, TikTok, Reels)
> **Hook:** "Language apps forgot what language is for: talking to real people."  
> **Audio Voiceover Prompt:**  
> *(0.0s – 4.5s)* "Most language apps feel like video games designed to sell you gems. Lexi is built for learning."  
> *(4.5s – 10.5s)* "From basic sounds to fluent discussions, every lesson is rooted in real daily conversations."  
> *(10.5s – 16.0s)* "Practice speaking anytime with an encouraging AI coach that gives instant, constructive feedback."  
> *(16.0s – 20.0s)* "100% free. No ads. Works offline anywhere. Meet Lexi, your English companion."
