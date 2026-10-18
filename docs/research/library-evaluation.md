# Technical Library & Framework Evaluation

## Executive Summary
This document provides an evidence-based technical evaluation of libraries considered for **Lexi**. Every dependency introduced into Lexi must satisfy strict criteria:
1. **Permissive License**: MIT, Apache-2.0, BSD-3-Clause, or ISC (strictly no AGPL or viral copyleft).
2. **Minimal Bundle Footprint**: Optimized tree-shaking, lightweight runtime overhead.
3. **TypeScript First**: First-class type definitions ensuring compile-time correctness.
4. **Capacitor & Mobile Compatibility**: Seamless operation inside Android WebViews and cross-platform browsers.
5. **Zero Vendor Lock-in & Free Forever**: Completely functional without paid third-party subscriptions.

---

## 1. Core Framework & Build Toolchain

| Option | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- |
| **Vite + React 19 / 18 + TypeScript** | Instant HMR, native ES modules, lightweight build, standard in modern frontend, flawless Capacitor bundling. | Client-side hydration only (which is optimal for an offline-first mobile app). | **Selected (Primary Stack)**. The gold standard for reactive, offline-first client applications. |
| **Next.js (App Router / Pages)** | Server-side rendering, integrated API routes. | Requires Node.js server or complex static export (`output: 'export'`), heavier bundle, complicates Capacitor Android builds, poor offline PWA story compared to pure Vite. | **Rejected**. Adds unnecessary server complexity violating our zero-cost client-first requirement. |
| **Astro** | Extremely fast static content. | Sub-optimal for highly dynamic client-side reactive exercise state engines and continuous audio/speech loops. | **Rejected**. |
| **Flutter** | Native Android/iOS performance, single codebase. | Poor web performance compared to DOM, heavy initial bundle, requires Dart rather than TypeScript ecosystem (incompatible with ts-fsrs without porting). | **Rejected** for our web-first requirements. |

---

## 2. UI Component Primitives & Styling

| Library / Tool | Category | License | Bundle Size | Evaluation & Fit for Approved Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Tailwind CSS v3 / v4** | Utility CSS Engine | MIT | ~10KB (purged) | **Selected**. Enables pixel-precise replication of the approved lavender (`#FAFAFE`), deep indigo (`#30335F`), subtle border radii, and layered card surfaces. Zero runtime overhead. |
| **Lucide React** | Icon System | ISC | Tree-shakable (~1.5KB/icon) | **Selected**. Clean, modern, highly consistent stroke width and geometry matching the approved design's icon style. |
| **Radix UI Primitives** (`@radix-ui/react-*`) | Headless Accessible UI | MIT | Modular (1-3KB per primitive) | **Selected**. Provides unstyled, accessible keyboard navigation, ARIA dialogs, popovers, dropdowns, and tabs without overriding our custom visual tokens. |
| **Motion** (`framer-motion`) | Animation & Motion | MIT | ~28KB (tree-shaken) | **Selected**. Essential for the approved reference's fluid card transitions, celebratory daily streak animations, progress rings, and drawer transitions. |
| **Shadcn UI (CLI / copy-paste pattern)** | Component Pattern | MIT | Zero extra dependency overhead | **Selected pattern**. Uses Radix + Tailwind for full ownership of component source code. |
| **Material UI (MUI) / Ant Design** | Full Component Suite | MIT | Heavy (>150KB) | **Rejected**. Imposes opinionated Google Material or Enterprise design systems directly conflicting with the approved custom visual identity. |

---

## 3. Spaced Repetition & Learning Science Engine

| Library | Version | License | Bundle Impact | Key Capabilities | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ts-fsrs`** | `^4.x` | MIT | ~8KB (pure JS, zero deps) | Implements DSR model (Difficulty, Stability, Retrievability). Generates scheduled intervals, calculates next review dates based on user response (`Again`, `Hard`, `Good`, `Easy`), supports custom retention target (default: 0.90). | **Selected**. Industry standard for modern algorithmic spaced repetition. |
| **Custom SM-2** | Custom | Public Domain | ~2KB | Simple multiplier (`EF * 2.5`). | **Rejected as inferior**. Suffers from interval inflation and rigid penalties. |

---

## 4. Local Persistence & State Management

| Tool | Type | License | Characteristics | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Dexie.js** | IndexedDB Wrapper | Apache-2.0 | Indexed queries, compound keys, transactional safety, reactive hooks (`useLiveQuery`), declarative version migrations. | **Selected (Primary Learning Store)**. Stores user history, vocabulary flashcards, FSRS logs, lesson progress, and offline cached assets. |
| **Zustand** | Lightweight State Manager | MIT | ~1.2KB, hooks-based, zero boilerplate, outside-React access, supports `persist` middleware. | **Selected (UI / Active Session State)**. Manages active lesson execution, audio player state, temporary modal states, and active user preferences. |
| **Redux Toolkit** | State Manager | MIT | Heavy (~40KB), extensive boilerplate. | **Rejected**. Grossly excessive for Lexi's architecture. |

---

## 5. Mobile Packaging & Android Toolchain

| Solution | Platform | License | Native Plugin Ecosystem | Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Capacitor v6** (`@capacitor/core`, `@capacitor/android`) | Cross-platform runtime | MIT | Excellent official plugins (Haptics, Status Bar, App, Keyboard, Network) | **Selected**. Allows direct packaging of the Vite production build (`dist/`) into a clean, modern Android Studio project. Does not pollute web development flow. |
| **Cordova** | Hybrid mobile | Apache-2.0 | Outdated | **Rejected**. Deprecated in favor of modern Capacitor. |
| **React Native** | Native Bridge | MIT | High | Requires separate native UI components, completely breaking DOM-based web-first deployment and testing with Playwright. | **Rejected**. |

---

## 6. Testing & Quality Assurance Toolchain

| Tool | Purpose | License | Capabilities |
| :--- | :--- | :--- | :--- |
| **Vitest** | Unit & Integration Testing | MIT | Blazing fast, native Vite configuration, ESM-native, drop-in Jest API compatibility, in-source testing for curriculum schemas and FSRS scheduling math. |
| **React Testing Library** | Component Testing | MIT | User-centric DOM testing, accessibility role verification, keyboard navigation assertions. |
| **Playwright** | End-to-End & Visual Regression | Apache-2.0 | Multi-browser automation (Chromium, Firefox, WebKit, Mobile Viewports), full-page screenshots, pixel-diff comparisons, network interception, automated accessibility scans. |

---

## 7. Package Dependency Summary Matrix

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.475.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.1",
    "ts-fsrs": "^4.4.0",
    "dexie": "^4.0.11",
    "dexie-react-hooks": "^1.1.7",
    "zustand": "^5.0.3",
    "motion": "^12.4.7",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "canvas-confetti": "^1.9.4"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "vite": "^6.1.1",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.8",
    "vitest": "^3.0.6",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@playwright/test": "^1.50.1",
    "@capacitor/core": "^6.2.0",
    "@capacitor/cli": "^6.2.0",
    "@capacitor/android": "^6.2.0"
  }
}
```

Every selected library is **strictly open-source**, commercially unrestricted, zero-cost, active, and tailored for exceptional performance on both mobile screens and web browsers.
