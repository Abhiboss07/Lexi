# Lexi Asset Manifest

## Document Status: VERIFIED & INDEPENDENT (STEP 2 REVISED)
**Design Reference**: [`docs/design/approved_reference.png`](file:///home/abhiboss/Projects/Lexi/docs/design/approved_reference.png) (Used strictly as visual inspiration for composition, style, and palette)  
**Strict Prohibition**: No screenshot crops, masks, or extracted fragments are used in production assets.

---

## 1. Production Visual Artwork (Independently Created)

| Filename | Purpose & Placement | Format | Dimensions | Generation Method & Provenance | Usage Terms / License | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `public/assets/hero-student-cat.png` | **Home**: Hero section character artwork | PNG (RGB) | 1200 × 896 px | Generated via Antigravity `image-generator` subagent (3D editorial illustration of student reading on lavender cushion with kitten). | Generated in-session via Google Antigravity tooling; terms subject to Google AI Studio Terms of Service. | **Verified OK** (Opens cleanly, no text, no UI fragments) |
| `public/assets/cafe-conversation.png` | **Home**: Featured Café banner background scene | PNG (RGB) | 1376 × 768 px | Generated via Antigravity `image-generator` subagent (3D editorial illustration of two people conversing in a sunny cafe over latte art). | Generated in-session via Google Antigravity tooling; terms subject to Google AI Studio Terms of Service. | **Verified OK** (Opens cleanly, wide 16:9 ratio, no text/speech bubbles) |
| `public/assets/quick-talk.svg` | **Home**: Quick Pick "Let's Talk" card | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG with custom gradients, headphones, and speech bubble. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/quick-stories.svg` | **Home**: Quick Pick "Short Stories" card | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG of open hardcover book with layered pages, ribbon, and sparkle. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/quick-vocabulary.svg` | **Home**: Quick Pick "Word of the Day" card | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG of notebook with "Aa" monogram, leaf, and pencil. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/quick-listening.svg` | **Home**: Quick Pick "Listen & Repeat" card | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG of vintage studio condenser microphone with broadcast soundwaves. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |
| `public/assets/default-avatar.svg` | **Home**: User Profile avatar in header | SVG (Vector) | 80 × 80 viewBox (Scalable) | Handcrafted standalone vector SVG of friendly learner avatar with lavender circular glow. | MIT / Project-owned original vector code. | **Verified OK** (Valid XML, self-contained) |

---

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
