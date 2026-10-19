# Lexi Asset Manifest

## Document Status: VERIFIED & INDEPENDENT (STEP 2 REVISED)
**Design Reference**: [`docs/design/approved_reference.png`](file:///home/abhiboss/Projects/Lexi/docs/design/approved_reference.png) (Used strictly as visual inspiration for composition, style, and palette)  
**Strict Prohibition**: No screenshot crops, masks, or extracted fragments are used in production assets.

---

## 1. Production Visual Artwork (Independently Created)

| Filename | Purpose & Placement | Format | Dimensions | Generation Method & Provenance | Usage Terms / License | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `public/assets/hero-student-cat.png` | **Home**: Hero section character artwork | PNG (RGBA) | 1536 × 1024 px | Sourced directly from user's high-resolution 3D artwork [`docs/design/Cosy Reading Nook with Sleeping Kitten.png`](file:///home/abhiboss/Projects/Lexi/docs/design/Cosy%20Reading%20Nook%20with%20Sleeping%20Kitten.png). Features complete 3D scene (student reading open book, sleeping kitten, chunky knit blanket, lavender cushions, and potted monstera) with clean native alpha transparency. Preserved as standalone processed asset at `public/assets/hero-student-cat-transparent.png`. | Provided by user for Lexi application; standalone 3D rendering. | **Verified OK** (1536×1024 RGBA, zero rectangular background, intact light materials) |
| `public/assets/cafe-conversation.png` | **Home**: Featured Café banner background scene | PNG (RGB) | 1376 × 768 px | Generated via Antigravity `image-generator` subagent (3D editorial illustration of two people conversing in a sunny cafe over latte art). | Generated in-session via Google Antigravity tooling; terms subject to Google AI Studio Terms of Service. | **Verified OK** (Opens cleanly, wide 16:9 ratio, no text/speech bubbles) |
| `public/assets/quick-talk.svg` | **Home**: Quick Pick "Let's Talk" card | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG with custom gradients, headphones, and speech bubble. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/quick-stories.svg` | **Home**: Quick Pick "Short Stories" card | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG of open hardcover book with layered pages, ribbon, and sparkle. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/quick-vocabulary.svg` | **Home**: Quick Pick "Word of the Day" card | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG of notebook with "Aa" monogram, leaf, and pencil. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/quick-listening.svg` | **Home**: Quick Pick "Listen & Repeat" card | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG of vintage studio condenser microphone with broadcast soundwaves. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/default-avatar.svg` | **Home**: User Profile avatar in header | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG of friendly learner avatar with lavender circular glow. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/practice-hero-character.png` | **Practice**: Hero section 3D character illustration | PNG (RGB) | 1024 × 1024 px | Generated via Antigravity `image-generator` subagent (3D editorial digital illustration of focused learner with lavender over-ear headphones, tablet, notebook, and steaming mug at study desk). | Generated in-session via Google Antigravity tooling; terms subject to Google AI Studio Terms of Service. | **Verified OK** (1024×1024, clean composition, zero text/UI elements, distinct from Home hero) |
| `public/assets/progress-hero-character-transparent.png` | **Progress**: Hero section 3D character illustration | PNG (RGBA) | 1024 × 1024 px | Generated 3D editorial digital illustration of smiling learner with tablet, notebook, star mark, and desk succulent, with clean full alpha transparency (zero rectangular border, seamless background blending). | Generated in-session via Google Antigravity tooling; terms subject to Google AI Studio Terms of Service. | **Verified OK** (1024×1024 RGBA, true alpha channel, zero rectangular artifacts) |
| `public/favicon.svg` | **App**: Browser Favicon | SVG (Vector) | 48 × 48 viewBox | Handcrafted vector SVG matching Lexi brand dialogue loop and golden sparkle ✦. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, crisp at all favicon sizes) |
| `public/assets/lexi-symbol.svg` | **Brand**: Standalone symbol mark | SVG (Vector) | 48 × 48 viewBox | Handcrafted standalone vector SVG of dialogue-loop "L" with 4-point sparkle ✦ in deep indigo `#232655` and accent `#FF6243`. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/lexi-logo.svg` | **Brand**: Full logo with wordmark | SVG (Vector) | 160 × 48 viewBox | Handcrafted vector SVG combining dialogue loop symbol with refined "Lexi" wordmark. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |

---

## 2. Brand Components & UI Widgets

- `src/components/common/LexiLogo.tsx`: Scalable SVG component with `symbol`, `full`, and `splash` variants matching Lexi brand guidelines.
- `src/components/common/SplashScreen.tsx`: Opening animation component featuring dialogue-loop bloom, subtle fade-in, and automatic `prefers-reduced-motion` bypass (80ms).
- `src/components/notifications/NotificationToast.tsx`: Compact, accessible contextual notification toast with category badges, direct routing action buttons, and dismiss controls.

## 2. Iconography Inventory (Lucide Icons)

All standard UI control icons are rendered as scalable inline SVG components from `lucide-react` (ISC License):
- **Header**: `Search` (Search dialog), `Sparkles` (`✦` brand mark), `Flame` (Streak counter)
- **Shortcuts**: `MessageSquare` (Conversation), `BookOpen` (Stories), `Lightbulb` (Vocabulary), `FileText` (Grammar), `Headphones` (Listening)
- **Café Banner**: `Clock` (Duration: 5-8 min), `BarChart2` (Difficulty: Beginner), `ArrowRight` (Launch action)
- **Navigation**: `Home` (Active), `Compass` (Explore), `Mic` (Practice), `BarChart3` (Progress)

---

## 3. Reference-Only Mockup Preservation

The following files in `docs/design/` are strictly preserved as static design references for visual regression tests and must **NEVER** be sliced or imported into application code:
- `docs/design/approved_reference.png` (Authoritative two-screen design mockup)
- `docs/design/reference_screen_home.png` (Home screen visual comparison target)
- `docs/design/reference_screen_explore.png` (Explore screen visual comparison target)
- `docs/design/rejected_personal_screenshot.png` (Archived previous screenshot)
