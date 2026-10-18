# Lexi — Acceptance Criteria & Quality Gates

## Phase 2: Home Page Acceptance Criteria

### 1. Visual Fidelity & Branding (Home Screen)
- [ ] **Header Branding**: Displays `Lexi` in deep indigo (`#222149`, bold) followed by the violet brand sparkle `✦` (`#646AA4`).
- [ ] **Subtitle**: Displays `Your English Companion` in medium slate (`#7D82A8`).
- [ ] **Utility Controls**:
  - Search button: Circular accessible control with magnifying glass icon. Opens a quick search overlay.
  - Streak badge: Compact flame icon in coral-orange (`#FF6243`) with persisted streak count (default: 7).
  - Profile Avatar: Clean 36px circular avatar with subtle border and fallback monogram/photo.
- [ ] **Illustrated Hero**:
  - Eyebrow: `A BRIGHTER YOU` in letter-spaced uppercase (`#7D82A8`).
  - Headline: Line 1 `Learn English` in deep indigo (`#222149`), Line 2 `Your Way` highlighted in soft periwinkle (`#646AA4`).
  - Subtitle: `Real conversations. Fun stories. Useful skills. A more confident you.`
  - CTA Button: `Start Learning →` pill button in solid deep indigo (`#232655`) with white text and smooth hover scale.
  - Carousel Indicators: 4 dots with active expanded periwinkle pill (`#646AA4`) and inactive muted dots (`#E2E4F8`).
  - Hero Artwork: High-fidelity illustration of student reading book labeled "Lexi" with sleeping kitten.
- [ ] **Category Shortcuts (5 items)**:
  - Displays `Conversation`, `Stories`, `Vocabulary`, `Grammar`, `Listening`.
  - Crisp white rounded cards (`#FFFFFF`, `rounded-2xl`) with consistent icon styling (`#3B3D6B`, yellow lightbulb for Vocab).
  - Tap target ≥ 48px with accessible labels.
- [ ] **Featured Learning Banner ("Café Conversation")**:
  - Deep midnight navy gradient container (`rounded-3xl` / `28px`).
  - Eyebrow badge: `FEATURED FOR YOU`.
  - Title: `Café Conversation` with descriptive text.
  - Metadata badges: `⏱ 5-8 min` and `📊 Beginner`.
  - Circular launch button with right arrow `→`.
  - Authentic café imagery with warm latte art and chalkboard motif.
- [ ] **Quick Picks (2×2 Grid)**:
  - 4 cards: `Let's Talk` (Practice with AI), `Short Stories` (Learn with fun), `Word of the Day` (Expand vocabulary), `Listen & Repeat` (Improve your speaking).
  - Each card features custom artwork/avatar, title, subtitle, and circular arrow launch button.
- [ ] **Bottom Navigation (4 Destinations)**:
  - Displays `Home`, `Explore`, `Practice`, `Progress`.
  - `Home` is clearly marked active with solid icon and bold text.
  - Safe-area inset handling for mobile screens.

### 2. Functional & Interaction Criteria
- [ ] `Start Learning →` opens a functional lesson modal / activity sheet.
- [ ] Every shortcut (`Conversation`, `Stories`, etc.) triggers a functional modal or route view with honest status.
- [ ] Featured Café Conversation card opens an interactive café conversation dialogue session.
- [ ] Quick Picks cards trigger their respective modal flows.
- [ ] Streak data is loaded from Dexie.js local storage and increments on completed daily study.
- [ ] Bottom navigation tabs switch views or preview destinations cleanly without crashing.

### 3. Responsiveness, Accessibility & Performance
- [ ] Viewport fluid scaling from 360px mobile width to tablet/desktop.
- [ ] WCAG AA text contrast ratio (> 4.5:1 for body, > 7:1 for headings).
- [ ] Full keyboard navigation support (Tab focus rings clearly visible).
- [ ] Zero uncaught console errors or warnings.
- [ ] Playwright screenshot comparison against `docs/design/reference_screen_home.png`.
