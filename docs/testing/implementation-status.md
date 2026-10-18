# Lexi — Living Implementation Status & Quality Gates

**Current Phase**: Phase 0 (Research & Audit)  
**Last Updated**: 2026-10-18  
**Overall Project Status**: Phase 0 Complete — Awaiting Approval for Phase 1 Design System & Prototyping  

---

## 1. Phase Progress Overview

| Phase | Description | Status | Evidence / Artifacts |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Repository Audit, Open-Source Research & Architecture ADRs | **COMPLETED (Pending Review)** | `docs/research/landscape.md`<br>`docs/research/library-evaluation.md`<br>`docs/research/architecture-decision.md`<br>`docs/design/approved_reference.png` |
| **Phase 1** | Design System, Visual Reference Analysis & Asset Manifest | **QUEUED (Awaiting Gate 0)** | Target: `docs/design/reference-analysis.md`<br>`docs/design/design-system.md`<br>`docs/design/asset-manifest.md` |
| **Phase 2** | Home Page Implementation & Visual Verification | **QUEUED** | Target: Home Screen implementation, Playwright visual comparison against approved reference |
| **Phase 3** | Remaining Screens & Learning Engines | **QUEUED** | Target: Onboarding, Explore/Curriculum, Lesson Engine (10 types), TS-FSRS Vocabulary, AI Tutor, Habits |
| **Phase 4** | MCP & Tooling Integration | **QUEUED** | Target: Context7, Playwright MCP, Tree-sitter, Chrome DevTools |
| **Phase 5** | Testing & Quality Gates | **QUEUED** | Target: Vitest unit tests, Playwright e2e tests, a11y audit, lighthouse performance audit |
| **Phase 6** | Free-First Deployment & Android Release | **QUEUED** | Target: Cloudflare Pages + Worker proxy, GitHub Actions CI/CD, Capacitor Android APK |

---

## 2. Requirement Verification Matrix

| Requirement Area | Specification | Planned Strategy | Status |
| :--- | :--- | :--- | :--- |
| **Business Model** | 100% Free-to-use, no ads, no paywalled core lessons | Client-first PWA + local IndexedDB; zero paid subscriptions | Planned |
| **Visual Fidelity** | Exact replication of lavender (`#FAFAFE`), deep indigo (`#30335F`), rounded cards, custom character art | Custom Tailwind tokens, CSS variables, SVG & WebP vector assets matching reference | Planned |
| **Theme Rule** | Do NOT reintroduce rejected Wine Red / Light Sand | Enforced via design token linting and strict CSS variables | Active rule |
| **Offline Resilience** | Essential learning usable without internet or when Gemini quota exhausted | Dexie.js local storage + static declarative curriculum + Web Speech API + rule-based fallback tutor | Planned |
| **Spaced Repetition** | Scientifically grounded spaced repetition | `ts-fsrs` (v4+) implementing DSR algorithm | Planned |
| **AI Security** | Never expose Gemini API keys in client bundles or APK | Cloudflare Worker / Serverless rate-limited proxy with server secret | Planned |
| **Mobile Android** | Real Android APK capability | Capacitor v6 Android wrapper over Vite production build | Planned |

---

## 3. Test Suites & Quality Gates

| Gate ID | Quality Gate Description | Target Verification Command | Current Status |
| :--- | :--- | :--- | :--- |
| **GATE-0** | Phase 0 Research Review & Approval | User Review of Phase 0 Deliverable | **In Review** |
| **GATE-1** | Design System & Token Coherence | `docs/design/design-system.md` review & prototype check | Queued |
| **GATE-2** | Home Page Pixel Fidelity & Responsiveness | Playwright visual screenshot diff vs `approved_reference.png` | Queued |
| **GATE-3** | Unit Test Suite (FSRS math, Streak calendar, Lesson scoring) | `pnpm test:unit` (Vitest) | Queued |
| **GATE-4** | End-to-End Workflow Tests | `pnpm test:e2e` (Playwright) | Queued |
| **GATE-5** | Accessibility Audit (WCAG AA, Focus rings, Contrast) | Playwright axe-core / Chrome DevTools a11y | Queued |
| **GATE-6** | Production Build & Android APK Build | `pnpm build && pnpm cap sync android` | Queued |

---

## 4. Blockers & Outstanding Decisions

- **Blocker 0.1**: User approval of Phase 0 research findings and architectural decisions before initiating Phase 1.
- **Decision 0.2**: Confirm serverless proxy platform preference: Cloudflare Pages Functions / Workers vs Vercel Serverless (Recommended: Cloudflare Pages for unified static hosting + worker proxy under 100,000 free req/day).
