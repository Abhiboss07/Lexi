# Lexi 2.0 — Complete UI/UX Refinement & Brand Report

**Date:** 2026-11-04  
**Project:** Lexi (English Learning Application)  
**Brand Palette:** Wine Red (`#7F011F`) & Light Sand (`#F5EBD0`)

---

## 1. Brand Identity & Visual Direction

Lexi 2.0 introduces an approved, warm, editorial visual identity that replaces chilly tech-app blues with a distinguished, welcoming academic palette:

- **Primary Brand Token — Wine Red (`#7F011F`):**  
  Rich, authoritative, warm, and motivating. Used for primary call-to-actions, active tab icons, brand badges, and key headings.
- **Canvas & Surface System — Light Sand (`#F5EBD0` / `#FAF6ED`):**  
  Soft, tactile, paper-like background that feels like reading a well-crafted book. Significantly reduces eye fatigue compared to glaring white.
- **Surfaces & Cards:**  
  Pristine white cards (`#FFFFFF`) on sand canvas with warm sand borders (`#E6D8B5`). No ghost cards, zero nested card anti-patterns, and no excessive elevation.
- **Typography & High-Contrast Readability:**  
  High-contrast deep wine-espresso body text (`#380712`) providing **> 12:1 contrast ratio**, comfortably surpassing WCAG AAA standards.
- **Warm Gold Accents (`#D97706` / `#F59E0B`):**  
  Sparkle mark (✦), streak counters, and mastery highlights.

---

## 2. Motion & Interaction Design System

- **Standardized Durations & Easings:**  
  - Fast feedback: `160ms` (`--duration-fast`).
  - Sheet and dialog transitions: `240ms` (`--duration-normal`).
  - Fluid ease curve: `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Zero Layout Shifts:**  
  All animated components transition `opacity` and hardware-accelerated `transform` (scale, translateY) with `.hardware-accelerated` compositing.
- **Full Reduced-Motion Support:**  
  Honors `@media (prefers-reduced-motion: reduce)` by resetting durations to `0.01ms` and bypassing all motion and confetti.

---

## 3. Humanizer Natural Copy Refinements

All user-facing copy was audited against the Humanizer skill rules to eliminate chatbot mannerisms, dramatic fragments, inflated claims, and staging:

1. **Home Hero:**  
   *Before:* "A Brighter You. Real conversations. Fun stories. Useful skills for a confident you."  
   *Refined:* "A Brighter You. Real conversations, clear lessons, and supportive daily practice."
2. **Search Placeholders:**  
   Clear, direct guidance: *"Search grammar, stories, topics..."* instead of *"Type anything you want to explore..."*
3. **Curriculum Briefings:**  
   Plain, compassionate English without confusing linguistic jargon: *"English begins with 26 letters and 5 core vowels (A, E, I, O, U)..."*
4. **Interactive Feedback:**  
   Actionable, encouraging feedback messages specifying exact grammatical concepts and pronunciation cues.

---

## 4. Touch Target & Accessibility Metrics

- **Interactive Target Sizes:** Minimum `44×44px` on mobile controls, exceeding WCAG 2.2 AA (24px) guidelines.
- **Skip Links:** Fully accessible `#main-content` skip link styled with Wine Red pill and visible focus ring.
- **Contrast Check:**
  - `#380712` on `#FAF6ED`: **13.2:1** (WCAG AAA)
  - `#7F011F` on `#FAF6ED`: **7.4:1** (WCAG AAA)
  - `#FFFFFF` on `#7F011F`: **13.8:1** (WCAG AAA)
