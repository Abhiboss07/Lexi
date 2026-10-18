# Landscape Analysis: Open-Source Language-Learning Ecosystem

## Executive Summary
This document provides a comprehensive audit and competitive landscape analysis of existing open-source language-learning applications, spaced-repetition engines, lexical datasets, CEFR curricula, and speech technologies. The goal is to determine which components can be safely adapted or integrated into **Lexi** under permissive licenses, and which must be custom-developed to satisfy our strict product requirements: **100% free, ad-free, offline-capable, and visually faithful to the approved lavender/indigo design system**.

---

## 1. Open-Source Language-Learning Applications

| Project | Primary Stack | License | Maintenance Status (2025/2026) | Reusable Components | Integration Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LibreLingo** | Python / Elm / Web | AGPL-3.0 | Low / Semi-active | Exercise format schemas (YAML-based challenge types) | **Do not import code directly** (AGPL-3.0 viral copyleft constraint). Conceptually adapt lesson data structure schemas. |
| **KotobaWeb** (Kotoba) | Node.js / TypeScript / React | MIT | Active | Flashcard review UX, dictionary indexing pipelines | **High reuse potential for algorithms & UX flows**; custom React UI required to match Lexi's design. |
| **OpenLingo / Duolingo-Clones** (Various community projects) | React / Next.js / Tailwind | MIT / Apache 2.0 | Mostly abandoned prototypes | Sound effect patterns, heart/streak UI hooks | **Reference only**. Most are superficial clones with rigid, repetitive cards and mock backends. |
| **Anki (Anki-Android / AnkiMobile)** | Rust / Python / Kotlin / Web | AGPL-3.0 / GPL-3.0 | Highly Active | Scheduling logic, card templates | **Do not copy code** (GPL/AGPL). The underlying scheduling algorithm is superseded by FSRS. |
| **FreshCards / Mochi-like OSS** | TypeScript / Electron / Web | MIT | Moderate | Markdown card parsing, media attachment management | **Inspirational only**. Lexi requires structured multi-modal exercises rather than simple dual-sided flashcards. |

### Key Findings & Licensing Safeguards
1. **AGPL-3.0 Contamination Risk**: Projects like LibreLingo and Anki Core are AGPL-3.0. To keep Lexi clean, modular, and freely distributable (including Android APK builds via Capacitor), **no AGPL-3.0 code will be incorporated into the repository**.
2. **Pedagogical Shortcomings of Clones**: Most web clones on GitHub merely present multiple-choice questions without authentic communicative language teaching (CLT) or task-based learning. Lexi will implement 10 rich exercise types anchored in communicative competency.

---

## 2. Spaced Repetition Systems (SRS)

| Library / Algorithm | Language / Ecosystem | License | Maintenance & Adoption | Technical Evaluation |
| :--- | :--- | :--- | :--- | :--- |
| **ts-fsrs** (`open-spaced-repetition`) | TypeScript (pure JS/TS) | **MIT** | **Highly Active** (v4.x+ widely adopted in modern spaced repetition apps) | **Winner**. Implements the Free Spaced Repetition Scheduler algorithm. Mathematically models memory stability and retrievability based on the DSR (Difficulty, Stability, Retrievability) model. Zero external dependencies. |
| **SuperMemo-2 (SM-2)** implementations | JavaScript / TypeScript | Public Domain / MIT | Legacy baseline | Outdated heuristic model (1987). Struggles with overdue reviews and does not adapt accurately to individual forgetting curves. |
| **Ebisu** | Python / JS | Apache 2.0 | Infrequent updates | Bayesian updating of half-life. Statistically elegant but lacks the community validation, mobile benchmarks, and tuning ecosystem of FSRS. |

### Spaced Repetition Recommendation
**Adopt `ts-fsrs`**.
- It is fully typed, zero-dependency, and runs identically in Node, browser IndexedDB, and Capacitor WebViews.
- Allows fine-grained learner rating: `Again (1)`, `Hard (2)`, `Good (3)`, `Easy (4)`.
- Provides deterministic scheduling calculations completely client-side without network requests.

---

## 3. CEFR-Aligned English Lexical & Curricular Datasets

To ensure Lexi does not rely on hallucinatory or unverified AI output for its core curriculum, static, verified linguistic datasets must form the foundational bedrock:

### 3.1 CEFR English Profile (Council of Europe / Cambridge Alignment)
- **A1 (Beginner - 500-800 words)**: Basic greetings, personal information, immediate environment, basic daily routines, simple requests.
- **A2 (Elementary - 1,000-1,500 words)**: Common everyday expressions, family, shopping, local geography, employment, routine tasks.
- **B1 (Intermediate - 2,000-2,500 words)**: Travel situations, personal interests, work explanations, narrative descriptions of experiences and events.
- **B2 (Upper-Intermediate - 3,500-4,500 words)**: Complex texts, technical discussions, fluent spontaneous interaction, nuanced viewpoints.
- **C1 (Advanced - 6,000-8,000 words)**: Implicit meaning, flexible language use for social, academic, and professional purposes.

### 3.2 Reusable Open Linguistic Sources
1. **WordNet 3.0 / Open English WordNet**:
   - License: WordNet 3.0 License (BSD-style permissive).
   - Use: Accurate synsets, part-of-speech definitions, hypernyms/hyponyms for contextual hint generation.
2. **Tatoeba Project**:
   - License: Creative Commons Attribution 2.0 France (CC-BY 2.0 FR).
   - Content: Hundreds of thousands of human-verified English example sentences with natural phrasing and multi-lingual translations.
3. **Wiktionary / Kaikki English Lexical Dumps**:
   - License: CC BY-SA 3.0 / GFDL.
   - Use: Phonetic IPA transcriptions, syllabification, inflections, and audio pronunciations.
4. **Curated Lexi Core Curriculum (JSON-Schema defined)**:
   - To ensure high pedagogical quality and avoid license conflicts with CC BY-SA databases in client code, Lexi will maintain an internal, declarative curriculum pack in `src/data/curriculum/` categorized by CEFR level, theme, grammar focus, and story missions.

---

## 4. Speech Recognition and Text-to-Speech (TTS)

| Technology | Platform Support | Cost | Privacy & Offline Capability | Quality & Latency | Recommendation for Lexi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Web Speech API (`SpeechSynthesis`)** | Standard modern browsers (Chrome, Edge, Safari, Android WebView) | Free ($0) | Runs locally on device / OS engine; works offline on Android/Desktop | Low latency (<50ms). Natural system voices available (Google US English, Samantha, etc.) | **Primary TTS engine** for word & sentence audio playback. Zero cloud dependency. |
| **Web Speech API (`webkitSpeechRecognition`)** | Chromium, Android WebView, Safari 14.1+ | Free ($0) | Requires OS audio access; Android uses Google Voice Services | Immediate streaming transcription; suitable for matching expected target sentences. | **Primary STT engine** for Listen-and-Repeat and Speaking exercises. |
| **Fallback Audio Sprites (Pre-recorded)** | Universal web/mobile | Free ($0) | 100% offline; bundled or lazily cached via Cache API | Studio quality pronunciation for phonemes and core vocabulary | **Secondary audio asset layer** for phonetic clarity when device synthesizers lack high quality. |
| **Whisper (Client Wasm / Transformers.js)** | Modern browsers (WebGPU/WASM) | Free ($0) | 100% offline, privacy-first | Heavy bundle (~40MB-150MB model download), high CPU/RAM on low-end mobile | Not recommended for initial mobile bundle; reserved as an optional experimental module for high-end devices. |

---

## 5. Offline Storage & Synchronization Solutions

| Technology | Platform | License | Storage Limits | Indexing & Reactivity | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dexie.js (IndexedDB wrapper)** | Web / Mobile WebView | **Apache 2.0** | Hundreds of MBs / GBs (depends on disk quota) | Rich compound indexing, async/await, live reactive queries (`useLiveQuery`), version migrations | **Recommended Winner**. Mature, reliable, handles complex learner histories and FSRS card state. |
| **Raw IndexedDB (`idb`)** | Web / Mobile WebView | ISC | Same as browser quota | Lightweight (~1KB), but requires manual index and query management | Good for minimal needs, but Dexie provides battle-tested schema management for learning apps. |
| **LocalStorage** | Web / Mobile | Built-in | ~5MB max | Synchronous, string-only, blocking main thread, unindexed | **Rejected** for learning logs; only permissible for tiny non-critical flags (e.g. theme preference). |
| **PouchDB / CouchDB** | Web / Mobile | Apache 2.0 | High | Built-in CouchDB sync | Overly complex for client-first architecture without a paid CouchDB server infrastructure. |

---

## 6. Synthesis and Comparative Recommendations

1. **Adopt `ts-fsrs`** for personalized spaced repetition and daily review scheduling.
2. **Adopt `Dexie.js`** for local-first IndexedDB persistence of user profiles, streaks, vocabulary items, card reviews, and completed lesson nodes.
3. **Use Web Speech API** for zero-cost, privacy-friendly, low-latency audio playback and speech recognition, supplemented by deterministic fuzzy string matching (Levenshtein distance) for honest speaking assessment.
4. **Implement a strictly structured, declarative curriculum engine** (JSON schema) supporting 10 distinct interactive exercise types with explicit answer validation rules.
