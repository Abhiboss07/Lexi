# Lexi 2.0 — Functional Bug Fixes Report

**Date:** 2026-11-04  
**Project:** Lexi (English Learning PWA)  
**Status:** All Fixes Verified by Vitest and Playwright Suites

---

## 1. Summary of Issues Resolved

| Issue Category | Root Cause | Implemented Solution | Verification Test |
| :--- | :--- | :--- | :--- |
| **Mobile Keyboard & Viewport Clipping** | Mobile browsers zoom into inputs when `font-size < 16px`, causing layout shifts and cutting off modal bottoms. | Added global rule in `src/styles/globals.css` enforcing `font-size: 16px !important` for all mobile inputs/textareas, preventing auto-zoom. | `tests/aiConversationCoach.spec.ts`, `tests/explore.spec.ts` |
| **Virtual Keyboard Obscuring Modals** | Fixed viewport units (`h-[94vh]`, `max-h-[860px]`) overflowed when mobile software keyboard opened. | Created `useVisualViewport` hook in `src/hooks/useVisualViewport.ts` to dynamically calculate available height and update `--visual-viewport-height` CSS variable; added `.modal-viewport-height` and dynamic `maxHeight` bounds on `ConversationCoachModal.tsx`. | `src/hooks/useVisualViewport.test.ts`, `tests/aiConversationCoach.spec.ts` |
| **Modal Focus Stealing** | `useModalFocusTrap` had an unconditional `setTimeout` that shifted focus to the first interactive element (often close button) even after the user tapped an input. | Updated `useModalFocusTrap.ts` to inspect `document.activeElement`. If the user already focused an input, textarea, or select, focus is preserved. | `src/hooks/useModalFocusTrap.test.ts`, `tests/accessibility.spec.ts` |
| **Bottom Navigation Overlapping Inputs** | Fixed bottom navigation bar overlapped inputs located near the bottom of screens during mobile focus. | Applied `scrollInputIntoView` on focus for inputs and added hardware-accelerated positioning with smooth viewport centering. | `tests/explore.spec.ts`, `tests/home.spec.ts` |
| **Beginner Learning Gap (A1)** | Curriculum jumped directly into multi-sentence greeting scenarios without foundational phonetic orientation or structured briefing. | Enhanced A1 Unit 1 with comprehensive vowel sound rules, core greetings, first pronouns ("I am", "You are"), and added a collapsible **Lesson Concept Guide** in `LessonPlayer.tsx`. | `src/services/curriculumValidator.test.ts`, `tests/curriculumDepth.spec.ts`, `tests/lesson.spec.ts` |

---

## 2. Code Modifications Detail

### 2.1 `src/hooks/useVisualViewport.ts`
- Created reactive listener for `window.visualViewport.resize` and `scroll`.
- Calculates exact keyboard displacement (`diff > 140px`).
- Provides `scrollInputIntoView(element, delayMs)` helper with smooth centered alignment.

### 2.2 `src/hooks/useModalFocusTrap.ts`
- Guarded `setTimeout` focus handler to check if active element is an input, textarea, or select inside the container.
- Completely prevents mobile keyboard dismissal upon modal mount.

### 2.3 `src/styles/globals.css`
- Added mobile input font size protection:
  ```css
  input, textarea, select { font-size: 16px !important; }
  @media (min-width: 640px) { input, textarea, select { font-size: inherit; } }
  ```
- Added `.modal-viewport-height` utility:
  ```css
  .modal-viewport-height {
    max-height: min(92vh, calc(var(--visual-viewport-height, 100vh) - 20px));
  }
  ```

### 2.4 `src/components/lesson/LessonPlayer.tsx`
- Integrated collapsible **Lesson Concept Guide** featuring objectives, grammar rule summary with examples, and interactive vocabulary with native speech pronunciation (`playBrowserSpeech`).
- Preserved existing activity layout for automated regression suites.
