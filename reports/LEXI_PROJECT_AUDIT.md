# Lexi 2.0 — Complete Technical & Product Audit Report

**Date:** 2026-11-04  
**Project:** Lexi (Free, Offline-First English Learning PWA)  
**Repository:** `/home/abhiboss/Projects/Lexi`  
**Version:** 2.0 Pre-Upgrade Baseline

---

## 1. Verified Baseline Status

Before undertaking any changes, the active repository was audited across all test suites, compilers, and production bundles:

- **Unit Test Suite (Vitest v3.2.7):** 28 test files, 201/201 tests passing (`100%`).
- **Type Safety (`tsc --noEmit`):** 0 errors, clean compile.
- **Production Build (Vite v6.4.4):** Succeeded in 1.74s.
  - Entry bundle: `dist/assets/index-BTOrtJx0.js` — 285.03 kB (80.12 kB gzip).
  - Main style: `dist/assets/index-C0KSdjCx.css` — 97.57 kB (16.86 kB gzip).
  - Code-split modal chunks: 26 distinct lazy-loaded chunks (5 kB – 96 kB).
- **End-to-End Suite (Playwright Chromium):** 34 test specifications verified.
- **Curriculum Dataset Stats:** 6 levels (A1–B2 active), 9 active units, 25 active lessons, 77 activities.

---

## 2. Technical & Architectural Audit

### 2.1 Technology Stack
- **Framework:** React 19.0.0 with functional components and modern hooks.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` 4.0.8).
- **Database:** Dexie.js v4.0.11 with IndexedDB persistence, transactions, and backup/restore.
- **Memory & Spaced Repetition:** `ts-fsrs` v4.4.0 (Free Spaced Repetition Scheduler).
- **Audio / Speech:** Native Web Speech API (`SpeechSynthesis`) with graceful fallback.
- **PWA & Offline:** Custom Service Worker (`public/sw.js`) with cache-first static asset strategy and offline indicator.

### 2.2 Product Surfaces & Feature Modules
1. **Home:** Daily streak, Hero card, Word of the Day, Daily Practice carousel, Quick Picks, Continue Journey.
2. **Explore:** CEFR level roadmap (A1–C2), Adventure stories, search modal, category filtering.
3. **Practice:** Practice Studios (Vocabulary, Grammar, Pronunciation, Listening, Story, Interview), Conversation Coach, Rapid Quizzes.
4. **Progress:** Skill mastery bars, CEFR assessment tracker, streak milestones, mistake pattern diagnostics, backup/restore.
5. **Lesson Player:** Multi-activity progression (Multiple Choice, Dialogue, Fill Blank, Sentence Order, Pronunciation, Listening).

---

## 3. Deep-Dive Root Cause Analysis

### 3.1 Animation Jitter & Perceived Latency
1. **Layout Property Transitions:** Certain containers and accordion items transition `height`, `padding`, or `margin` rather than `transform` and `opacity`. This triggers layout recalculations and browser repaints at 60fps on mobile devices.
2. **Uncoordinated Modal Entrances:** Modals combine `animate-in fade-in zoom-in-95` without standardized duration or easing tokens, causing micro-stutters during sheet presentation.
3. **Missing Hardware Acceleration (`transform: translateZ(0)`):** Complex modal backdrops and fixed bottom navigation lack `will-change: transform` or isolated compositing layers, causing compositing recalculations when the page scrolls.

### 3.2 Mobile Keyboard & Input Deficiencies
1. **Mobile Browser Auto-Zoom (Font Size < 16px):**
   - In `SearchModal.tsx`, input font size is `text-[15px]`.
   - In `ConversationCoachModal.tsx`, input font size is `text-[13px]`.
   - In `ExploreScreen.tsx` search, font size is `text-[13.5px]`.
   - In `ActivityViews.tsx`, textarea is `text-[13.5px]`.
   - **Impact:** On iOS Safari and Android Chrome, focusing any input with font size < 16px triggers an automatic zoom/pan, throwing the layout off-center and cutting off input boundaries.
2. **Modal Viewport Inflexibility (`h-[94vh]` vs `visualViewport`):**
   - Modals use fixed viewport units (`h-[94vh]`, `max-h-[860px]`).
   - When the mobile virtual keyboard opens, the visual viewport contracts by 280–350px. The modal container does not adjust, pushing bottom action bars and typing inputs completely beneath the keyboard.
3. **Fixed BottomNav Obstruction:**
   - `<BottomNav>` is `fixed bottom-0 z-40`. When inputs on non-modal pages (such as Explore or Practice search bars) receive focus, the bottom nav remains anchored, obscuring the field and active keyboard view.
4. **Focus Stealing in Modal Focus Trap:**
   - `useModalFocusTrap` had an unconditional `setTimeout` that focused the first interactive element (often the close button or cancel action), fighting the user's touch focus when clicking directly into input fields.

### 3.3 Beginner Learning Progression (A1) Gaps
1. **Lack of Phonetic & Sound Orientation:**
   - Current Lesson 1 (`a1-u1-l1-hello`) jumps straight into contextual questions like *"You enter a shop at 10:30 in the morning. What is the greeting?"*.
   - Absolute beginners (A0/A1) who have zero prior English knowledge require a foundational on-ramp: English Alphabet & Vowel Sounds, Core Phonetics, Numbers 1–10, and Subject Pronouns ("I am", "You are").
2. **Missing Lesson Orientation & Structure:**
   - The lesson player immediately renders activity questions without an upfront **Concept Briefing**:
     1. Stated Learning Objective
     2. Grammar / Vocabulary Rule Summary
     3. Natural Examples with Audio Pronunciation
     4. Interactive Practice
     5. Real-life Application
     6. Encouraging Feedback

---

## 4. Remediation Plan

1. **Brand System Tokens (Phase 2):**  
   Introduce Wine Red (`#7F011F`) and Light Sand (`#F5EBD0`) as core semantic tokens with full WCAG AAA contrast and warm, premium tactile feel.
2. **Motion Engineering (Phase 3):**  
   Standardize timing (150ms/250ms), exponential ease-out, hardware-accelerated transforms, and robust `prefers-reduced-motion` overrides.
3. **Mobile Keyboard Repair (Phase 4):**  
   Apply `min-text-[16px]` to all mobile inputs, integrate dynamic `visualViewport` listener for modal heights, add `scrollIntoView({ behavior: 'smooth', block: 'center' })` on focus, and auto-dismiss/hide bottom navigation during active typing.
4. **Beginner Architecture (Phase 5):**  
   Add a foundational "Alphabet, Sounds & First Words" beginner unit in A1, and enhance `LessonPlayer` with a dedicated **Lesson Briefing Step** before interactive activities begin.
5. **UI/UX Polish & Humanizer Copy (Phase 6):**  
   Refine typography, remove nested card containers, eliminate AI cliches, and warm all student-facing copy.
