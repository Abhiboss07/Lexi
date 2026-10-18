# Architecture Decision Records (ADRs)

## Document Status: APPROVED / BASELINE
**Project**: Lexi — Premium English-Learning Application  
**Architectural Scope**: Complete System Architecture (Client, Data, Learning Engine, AI Integration, Mobile, Hosting)

---

## Index of Architectural Decisions

- **ADR-001**: Web-First Architecture (Vite + React + TypeScript + Capacitor v6)
- **ADR-002**: Local-First Persistence via Dexie.js (IndexedDB)
- **ADR-003**: Spaced Repetition Scheduling via `ts-fsrs` (Free Spaced Repetition Scheduler)
- **ADR-004**: Protected Gemini Provider Abstraction & Serverless Proxy
- **ADR-005**: Visual Fidelity & Design Token System (Lavender `#FAFAFE` & Indigo `#30335F`)
- **ADR-006**: Declarative Multi-Modal Curriculum Engine & Deterministic Validation
- **ADR-007**: Speech Recognition and Audio Synthesis Pipeline
- **ADR-008**: Free-Tier Hosting, Serverless Proxy, and CI/CD Automation

---

## ADR-001: Web-First Architecture (Vite + React + TypeScript + Capacitor v6)

### Context
Lexi must run as a fast, accessible web application on both mobile and desktop browsers, while also packaging cleanly into an Android application (APK) without rewriting UI or business logic.

### Decision
We select **Vite + React 19 + TypeScript** as the core web application, packaged for Android using **Capacitor v6**.

### Rationale
1. **Unified Codebase**: 100% of the UI components, learning state, audio pipelines, and FSRS scheduling run identically in the browser DOM and the Android WebView.
2. **Speed & Ergonomics**: Vite provides sub-second HMR and optimized Rollup tree-shaking, resulting in minimal production bundles (<250KB gzipped core).
3. **Android Native Capabilities**: Capacitor gives clean access to Android native features (haptic feedback on exercise completion, native audio control, immersive status bar) without React Native's native-bridge build overhead.
4. **Offline Resilience**: Standard Service Workers (PWA) cache all static web assets, while Capacitor bundles all assets locally inside the APK (`android/app/src/main/assets/public`), ensuring instant offline startup.

### Consequences
- **Positive**: Single test suite with Vitest and Playwright verifies both web and mobile flows.
- **Negative**: Native Android UI components are not used directly, but modern web CSS and GPU-accelerated motion deliver indistinguishable 60fps performance on mobile.

---

## ADR-002: Local-First Persistence via Dexie.js (IndexedDB)

### Context
Learners frequently study during transit or in areas with intermittent connectivity. Learning progress, daily streaks, vocabulary ratings, and completed stories must never be lost when offline. Furthermore, mandatory cloud accounts or paywalled databases violate our product requirements.

### Decision
We adopt **Dexie.js (IndexedDB)** as the authoritative local persistence layer for all user progress, vocabulary decks, FSRS card states, and habit history.

### Database Schema Definition
```typescript
interface LexiDatabase {
  users: Dexie.Table<UserProfile, string>;          // Active profile, streak data, CEFR level, daily goal
  curriculumProgress: Dexie.Table<LessonProgress, string>; // Completed lessons, scores, checkpoints
  vocabularyCards: Dexie.Table<FSRSCardRecord, string>;   // Saved words, FSRS stability, difficulty, due date
  reviewLogs: Dexie.Table<FSRSReviewLog, string>;        // Historical review ratings (Again, Hard, Good, Easy)
  storyProgress: Dexie.Table<StorySession, string>;      // Reading progress, comprehension answers
  customStories: Dexie.Table<UserStoryUpload, string>;   // User-uploaded stories for conversational practice
}
```

### Rationale
1. **High Storage Limits**: IndexedDB supports hundreds of megabytes of structured data, accommodating thousands of vocabulary terms, audio bookmarks, and lesson records without LocalStorage's 5MB limit.
2. **Reactive UI Binding**: `dexie-react-hooks` (`useLiveQuery`) allows React components to automatically re-render when cards are reviewed or streaks are updated.
3. **No Cloud Dependency**: The entire app functions completely without internet or backend servers.

### Consequences
- **Positive**: Zero operational database hosting costs; 100% data privacy for learners.
- **Negative**: Multi-device cloud sync requires an explicit export/import JSON workflow or optional end-to-end encrypted backup in future releases.

---

## ADR-003: Spaced Repetition Scheduling via `ts-fsrs`

### Context
Effective vocabulary retention requires mathematically sound spaced repetition. Traditional Leitner boxes or SuperMemo-2 (SM-2) algorithms are brittle, over-penalize lapses, and produce inefficient review intervals.

### Decision
We integrate **`ts-fsrs` (v4+)**, implementing the DSR (Difficulty, Stability, Retrievability) Free Spaced Repetition Scheduler.

### Rationale
1. **Scientifically Proven**: FSRS demonstrates significantly lower error rates in predicting recall probability compared to SM-2.
2. **Pure TypeScript Engine**: `ts-fsrs` is a zero-dependency, pure math library licensed under MIT that calculates next review intervals and stability factors in microseconds.
3. **Learner Agency**: Provides four intuitive response grades:
   - `Again (Rating 1)`: Complete memory lapse (resets stability, schedules immediate review).
   - `Hard (Rating 2)`: Successful recall with significant hesitation.
   - `Good (Rating 3)`: Normal, confident recall (standard interval growth).
   - `Easy (Rating 4)`: Effortless recall (accelerated interval growth).

---

## ADR-004: Protected Gemini Provider Abstraction & Serverless Proxy

### Context
Lexi features an interactive AI conversation tutor, story Q&A, and personalized feedback. However:
1. Gemini API keys must **NEVER** be embedded in client-side bundles or distributed Android APKs.
2. Quota exhaustion (`429 RESOURCE_EXHAUSTED`) or network failure must **NEVER** break the core curriculum.
3. Content and grammar exercises must rely on verified curriculum data, not unverified AI output.

### Architecture Topology
```
[ Lexi Client App (Web / Android) ]
        |
        | 1. Request Conversational Turn / Explanation
        v
[ Cloudflare Worker / Serverless Proxy ]
  - Rate Limiter (Token Bucket per IP / Session)
  - Schema & Prompt Sanitizer
  - Server-Side Secret: GEMINI_API_KEY
        |
        | 2. Authenticated API Call (gemini-2.5-flash / gemini-1.5-flash)
        v
[ Google AI Studio (Gemini API) ]
```

### Fallback & Graceful Degradation Protocol
```typescript
interface AIProvider {
  chat(messages: ChatMessage[], options: ChatOptions): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

class ResilientAIEngine implements AIProvider {
  async chat(messages: ChatMessage[], options: ChatOptions): Promise<AIResponse> {
    try {
      const response = await this.serverlessProxy.request(messages, options);
      return { status: 'success', content: response.text, source: 'ai' };
    } catch (error) {
      // Fallback: Deterministic Rule-Based Response Engine
      return this.localDeterministicTutor.generateContextualFallback(messages, options);
    }
  }
}
```

### Rationale
- **Zero Secret Exposure**: The API key is stored in the serverless provider environment (e.g. Cloudflare Worker Secret).
- **Free Quota Management**: Requests are batched, inputs are bounded, and responses are capped to reasonable token lengths (e.g. max 200 tokens for chat turns).
- **Curriculum Integrity**: Grammar rule explanations and multiple-choice evaluation are performed deterministically against static curriculum definitions; Gemini is invoked strictly for open-ended conversation practice and contextual clarifications.

---

## ADR-005: Visual Fidelity & Design Token System (Lavender `#F6F7FE`, Deep Indigo `#232655`, Periwinkle `#646AA4`)

### Context
The authoritative visual reference is the custom two-screen Lexi UI concept (`docs/design/approved_reference.png`, 1222×1287px):
- **Staging Canvas**: Pale Lavender tint (`#E7EAFD`)
- **App Screen Background**: Pale Lavender-White (`#F6F7FE`)
- **Card Surfaces**: Pure White (`#FFFFFF`) and Lavender Tint (`#F0F2FD`)
- **Primary Brand Indigo**: Deep Indigo (`#232655`, hover `#181A3C`) for primary CTAs ("Start Learning →", "Continue →") and active bottom navigation
- **Accent Periwinkle**: Soft Periwinkle (`#646AA4`) for "Your Way" highlight, active carousel pill, and brand sparkle
- **Streak Flame**: Vibrant Coral-Orange (`#FF6243`) with amber glow
- **Controlled Radii**: Cards (`24px-28px` / `rounded-3xl`), buttons (`rounded-full`), shortcut tiles (`16px` / `rounded-xl`)
- **Atmospheric Artwork**: High-quality 3D anime character art (student reading with kitten; celebrating girl with glasses) and rich café photography
- **Strict Theme Guard**: The previously rejected Wine Red (`#7F011F`) and Light Sand (`#F5EBD0`) themes remain strictly excluded.

### Decision
We codify the verified reference palette into centralized CSS design tokens in Tailwind and CSS custom properties:

```css
:root {
  /* Canvas & Surfaces */
  --color-canvas-staging: #E7EAFD;
  --color-canvas-screen: #F6F7FE;
  --color-surface-white: #FFFFFF;
  --color-surface-lavender: #F0F2FD;
  --color-surface-subtle: #EFF1FE;
  --color-surface-quote: #FEF7ED;
  --color-border-subtle: #ECEEFE;
  --color-border-medium: #E0E3F8;

  /* Brand Accents */
  --color-brand-indigo: #232655;
  --color-brand-indigo-dark: #1B1E48;
  --color-brand-indigo-hover: #181A3C;
  --color-accent-periwinkle: #646AA4;
  --color-accent-pill-lavender: #E2E0FE;
  --color-accent-streak-flame: #FF6243;
  --color-accent-gold: #F5A623;

  /* Text & Typography */
  --color-text-primary: #222149;
  --color-text-secondary: #6B7094;
  --color-text-tertiary: #8E93B8;
  --color-text-inverse: #FFFFFF;

  /* Semantic Feedback */
  --color-success: #10B981;
  --color-success-surface: #ECFDF5;
  --color-error: #EF4444;
  --color-error-surface: #FEF2F2;

  /* Controlled Radii */
  --radius-card: 24px;
  --radius-card-sm: 18px;
  --radius-button: 16px;
  --radius-pill: 9999px;

  /* Subtle Layered Shadows */
  --shadow-card: 0 4px 20px -2px rgba(48, 51, 95, 0.05), 0 2px 6px -1px rgba(48, 51, 95, 0.03);
  --shadow-card-hover: 0 12px 28px -4px rgba(48, 51, 95, 0.08), 0 4px 10px -2px rgba(48, 51, 95, 0.04);
}
```

---

## ADR-006: Declarative Multi-Modal Curriculum Engine & Deterministic Validation

### Context
Lexi cannot be a shallow quiz application. Language learning requires diverse, pedagogically grounded exercise types that test listening, reading, syntactic construction, and active recall.

### Decision
We implement a typed, declarative Lesson Engine supporting **10 distinct exercise types**:
1. **Multiple Choice**: Contextual sentence completion with grammatical distractors.
2. **Word Ordering**: Reconstructing scrambled English sentences according to valid syntactic rules.
3. **Fill-in-the-Blank**: Cloze tests with grammar/spelling cues.
4. **Sentence Construction**: Assembling communicative responses using word tiles.
5. **Listening Comprehension**: Audio playback followed by auditory discrimination questions.
6. **Reading Comprehension**: Illustrated short text followed by inferential questions.
7. **Grammar Correction**: Identifying and editing incorrect verb tenses or prepositions.
8. **Vocabulary Recall**: Target word prompt with phonetic IPA hints.
9. **Listen-and-Repeat**: Speech shadowing with phonetic comparison.
10. **Writing / Free Response**: Short paragraph synthesis with deterministic grammar checks and optional AI polish.

---

## ADR-007: Speech Recognition and Audio Synthesis Pipeline

### Context
Pronunciation practice and listening skills are essential for fluency, but paid speech APIs (e.g. Google Cloud Speech, ElevenLabs) would breach our 100% free, zero-cost operational model.

### Decision
1. **Text-to-Speech (TTS)**: Utilize browser-native `window.speechSynthesis` configured with US/UK English voices (`en-US`, `en-GB`).
2. **Speech Recognition (STT)**: Utilize `webkitSpeechRecognition` / `SpeechRecognition` API.
3. **Fuzzy Scoring Algorithm**: Implement Levenshtein Distance and normalized token matching to assess transcript similarity (0-100% confidence score).
4. **Honest Feedback Principle**: We will explicitly state pronunciation match accuracy based on transcript alignment, avoiding misleading claims of "phoneme-level acoustic scoring" when running on standard browser STT.

---

## ADR-008: Free-Tier Hosting, Serverless Proxy, and CI/CD Automation

### Context
The application must be deployable to production at $0 ongoing cost, with automated CI/CD and verifiable build artifacts.

### Decision
1. **Static Frontend Web Hosting**: Deploy production web assets to **Cloudflare Pages** (or **GitHub Pages**). Both provide unlimited bandwidth and global CDN distribution on their free tiers.
2. **AI Proxy**: Deploy the lightweight rate-limited Gemini proxy as a **Cloudflare Worker** (100,000 free requests/day) or **Vercel Edge Function**.
3. **CI/CD**: Automate type checking, unit tests (Vitest), e2e tests (Playwright), and web bundle builds using **GitHub Actions**.
4. **Android APK Generation**: Automate Android debug/release APK compilation via GitHub Actions using the `gradle-build-action` and Android SDK toolchain.
