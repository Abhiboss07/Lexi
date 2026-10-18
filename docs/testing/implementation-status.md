# Lexi — Living Implementation Status & Quality Gates

**Current Phase**: Phase 0 (Research & Audit) / Transitioning to Phase 1 (Design System Specification)  
**Last Updated**: 2026-10-18  
**Overall Project Status**: Visual Reference Corrected & Verified — Authoritative Two-Screen Mockup Established — Phase 0 Documents Synchronized  

---

## 1. Visual Reference Correction Log

| Item | Previous Incorrect State | Verified Authoritative State |
| :--- | :--- | :--- |
| **Reference File** | Mistakenly copied desktop screenshot (`rejected_personal_screenshot.png`) containing personal profile/story mockups. | **Verified two-screen Lexi UI concept** (`Lexi English Learning App Concept.png` → `docs/design/approved_reference.png`). |
| **Dimensions** | 1025 × 769 px | **1222 × 1287 px** (Contains Home 570×1242 px & Explore 570×1242 px). |
| **Left Screen** | John Doe profile / level selector | **Lexi Home Page**: illustrated student & kitten hero, `Lexi ✦` brand, compact flame (`🔥 7`), 5 shortcuts, Café Conversation banner, 2×2 Quick Picks, 4-tab bottom nav. |
| **Right Screen** | Generic story list with forest photo | **Lexi Explore Page**: Continue Your Journey (Unit 3 Grammar, 60% ring), Choose Your Adventure filter pills & scenario cards, Today's Word (`confident`), Popular with Learners. |
| **Preservation** | Overwritten in working tree | **Preserved**: Previous screenshot archived at `docs/design/rejected_personal_screenshot.png`. |

---

## 2. Phase Progress Overview

| Phase | Description | Status | Evidence / Artifacts |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Repository Audit, Open-Source Research & Architecture ADRs | **COMPLETED & CORRECTED** | `docs/research/landscape.md`<br>`docs/research/library-evaluation.md`<br>`docs/research/architecture-decision.md` (ADR-005 updated)<br>`docs/design/approved_reference.png`<br>`docs/design/reference_screen_home.png`<br>`docs/design/reference_screen_explore.png` |
| **Phase 1** | Design System Specification & Asset Manifest | **DOCUMENTED (Awaiting Review)** | `docs/design/reference-analysis.md`<br>`docs/design/design-system.md`<br>`docs/design/asset-manifest.md` |
| **Phase 2** | Home Page Implementation & Visual Verification | **GATED (Do not start without approval)** | Planned: Home Screen implementation, Playwright visual comparison against `reference_screen_home.png` |
| **Phase 3** | Remaining Screens & Learning Engines | **QUEUED** | Planned: Onboarding, Explore/Curriculum, Lesson Engine (10 types), TS-FSRS Vocabulary, AI Tutor, Habits |
| **Phase 4** | MCP & Tooling Integration | **QUEUED** | Planned: Context7, Playwright MCP, Tree-sitter, Chrome DevTools |
| **Phase 5** | Testing & Quality Gates | **QUEUED** | Planned: Vitest unit tests, Playwright e2e tests, a11y audit, lighthouse performance audit |
| **Phase 6** | Free-Tier Deployment & Android Release | **QUEUED** | Planned: Cloudflare Pages + Worker proxy, GitHub Actions CI/CD, Capacitor Android APK |

---

## 3. Requirement Verification Matrix

| Requirement Area | Specification | Planned Strategy | Status |
| :--- | :--- | :--- | :--- |
| **Visual Direction** | Exact replication of two-screen mockup (Home + Explore) | Measured color tokens (`#F6F7FE`, `#232655`, `#646AA4`, `#FF6243`), `rounded-3xl` (28px), custom artwork | Verified in `docs/design/reference-analysis.md` |
| **Theme Rule** | Do NOT reintroduce rejected Wine Red / Light Sand | Enforced via design token linting and strict CSS variables | Active rule |
| **Business Model** | 100% Free-to-use, no ads, no paywalled core lessons | Client-first PWA + local IndexedDB; zero paid subscriptions | Planned |
| **Offline Resilience** | Essential learning usable without internet or when Gemini quota exhausted | Dexie.js local storage + static declarative curriculum + Web Speech API + rule-based fallback tutor | Planned |
| **Spaced Repetition** | Scientifically grounded spaced repetition | `ts-fsrs` (v4+) implementing DSR algorithm | Planned |
| **AI Security** | Never expose Gemini API keys in client bundles or APK | Cloudflare Worker / Serverless rate-limited proxy with server secret | Planned |
| **Mobile Android** | Real Android APK capability | Capacitor v6 Android wrapper over Vite production build | Planned |

---

## 4. Test Suites & Quality Gates

| Gate ID | Quality Gate Description | Target Verification Command | Current Status |
| :--- | :--- | :--- | :--- |
| **GATE-0** | Phase 0 Research Review & Reference Correction | User Review of Corrected Phase 0 Deliverable | **Ready for Review** |
| **GATE-1** | Design System & Token Coherence | `docs/design/design-system.md` review & preview check | Documented — Ready for Review |
| **GATE-2** | Home Page Pixel Fidelity & Responsiveness | Playwright visual screenshot diff vs `reference_screen_home.png` | Queued |
| **GATE-3** | Unit Test Suite (FSRS math, Streak calendar, Lesson scoring) | `pnpm test:unit` (Vitest) | Queued |
| **GATE-4** | End-to-End Workflow Tests | `pnpm test:e2e` (Playwright) | Queued |
| **GATE-5** | Accessibility Audit (WCAG AA, Focus rings, Contrast) | Playwright axe-core / Chrome DevTools a11y | Queued |
| **GATE-6** | Production Build & Android APK Build | `pnpm build && pnpm cap sync android` | Queued |
