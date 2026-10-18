# Lexi Asset Manifest

## Document Status: BASELINE MANIFEST
**Source Reference**: [`docs/design/approved_reference.png`](file:///home/abhiboss/Projects/Lexi/docs/design/approved_reference.png)

This manifest catalogues all visual assets, illustrations, photography, and icons required by the approved Lexi interface, their specifications, current availability status, and reproduction strategy.

---

## 1. Character & Scene Illustrations

| Asset Key | Screen & Usage | Dimensions | Visual Subject | Status | Production / Acquisition Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hero-student-cat` | **Home**: Hero section | ~400 × 380 px | 3D anime style young woman reading book labeled "Lexi", sleeping kitten in foreground, sunlit morning room | **To Recreate** | Generate cohesive high-res vector/WebP artwork matching the approved style, color palette, and character proportions. |
| `banner-cafe-scene`| **Home**: Featured Café Conversation | ~420 × 260 px | Warm interior café table with latte art cappuccino and chalkboard "Good Food Good English" | **To Recreate** | High-quality royalty-free photography (Unsplash/Pexels license) or custom composite matching exact warm lighting and coffee cup composition. |
| `avatar-talk-boy` | **Home**: Quick Pick "Let's Talk" | ~64 × 64 px | Stylized anime young man wearing blue over-ear headphones | **To Recreate** | SVG vector avatar or WebP asset matching the reference boy avatar. |
| `icon-open-book` | **Home**: Quick Pick "Short Stories" | ~64 × 64 px | Illustrated open hardcover reading book with bookmark ribbon | **To Recreate** | Clean SVG vector illustration with soft lavender drop-shadow. |
| `icon-notebook-aa` | **Home**: Quick Pick "Word of the Day" | ~64 × 64 px | Soft peach/lavender notebook with bold "Aa" typography and leaf accent | **To Recreate** | Clean SVG vector illustration. |
| `icon-vintage-mic` | **Home**: Quick Pick "Listen & Repeat" | ~64 × 64 px | Metallic vintage broadcasting microphone on lavender surface | **To Recreate** | Clean SVG vector illustration. |
| `explore-journey-book`| **Explore**: Continue Journey Progress | ~72 × 72 px | Soft ivory grammar book with "Aa" on lavender rounded cushion | **To Recreate** | Clean SVG vector illustration. |
| `adventure-airport`| **Explore**: "At the Airport" Card | ~160 × 120 px | Commercial passenger jet ascending into pastel clouds + pink plane badge | **To Recreate** | Optimized WebP scene + SVG circular badge. |
| `adventure-shopping`| **Explore**: "Shopping Day" Card | ~160 × 120 px | Chic orange shopping bags with potted indoor monstera leaf + blue tag badge | **To Recreate** | Optimized WebP scene + SVG circular badge. |
| `adventure-job` | **Explore**: "Job Interview" Card | ~160 × 120 px | Confident young man in navy suit and tie in bright professional setting | **To Recreate** | Stylized 3D avatar WebP asset. |
| `character-confident-girl`| **Explore**: "Today's Word" Card | ~160 × 180 px | Joyful girl with round red glasses, purple sweater, celebrating with raised fists and gold sparkle stars | **To Recreate** | High-fidelity character artwork matching exact reference expression and pose. |
| `scene-cozy-night` | **Explore**: Popular "Night Study" | ~120 × 90 px | Desk with warm lamp, books, headphones, looking out to starry night sky | **To Recreate** | Optimized WebP landscape thumbnail. |
| `scene-crossroads` | **Explore**: Popular "Trail Walk" | ~120 × 90 px | Scenic alpine trail wooden signpost pointing towards mountains | **To Recreate** | Optimized WebP landscape thumbnail. |
| `scene-friends` | **Explore**: Popular "Social Chat" | ~120 × 90 px | Three friendly diverse young adults laughing and interacting | **To Recreate** | Optimized WebP landscape thumbnail. |

---

## 2. Iconography Inventory (Lucide + Custom SVG)

| Icon Identifier | Element in Mockup | Source | Format | Color Specification |
| :--- | :--- | :--- | :--- | :--- |
| `sparkle-brand` | Beside "Lexi" wordmark | Custom SVG | SVG vector | `--color-accent-periwinkle` (`#646AA4`) |
| `icon-search` | Header Search button | Lucide `Search` | SVG | Deep Indigo (`#232655`) |
| `icon-streak-flame`| Header Streak counter | Custom SVG | SVG vector | Flame gradient (`#FF6243` to `#FF8A65`) |
| `shortcut-conversation`| Shortcut #1 | Lucide `MessageSquareMore` | SVG | Deep Indigo (`#3B3D6B`) on White |
| `shortcut-stories` | Shortcut #2 | Lucide `BookOpen` | SVG | Deep Indigo (`#3B3D6B`) on White |
| `shortcut-vocabulary`| Shortcut #3 | Lucide `Lightbulb` | SVG | Accent Gold (`#F5A623`) on White |
| `shortcut-grammar` | Shortcut #4 | Lucide `FileText` | SVG | Deep Indigo (`#3B3D6B`) on White |
| `shortcut-listening` | Shortcut #5 | Lucide `Headphones` | SVG | Deep Indigo (`#3B3D6B`) on White |
| `icon-clock` | Café banner duration | Lucide `Clock` | SVG | Translucent white (`rgba(255,255,255,0.7)`) |
| `icon-bar-chart` | Café banner difficulty | Lucide `BarChart2` | SVG | Translucent white (`rgba(255,255,255,0.7)`) |
| `icon-speaker` | Today's Word audio | Lucide `Volume2` | SVG | Deep Indigo (`#232655`) |
| `icon-bookmark` | Example quote ribbon | Lucide `Bookmark` | SVG | Deep Indigo (`#232655`) |
| `nav-home` | Bottom navigation Home | Lucide `Home` | SVG (Solid/Outline) | Active: `#232655` / Inactive: `#8E93B8` |
| `nav-explore` | Bottom navigation Explore | Lucide `Compass` | SVG (Solid/Outline) | Active: `#232655` / Inactive: `#8E93B8` |
| `nav-practice` | Bottom navigation Practice | Lucide `Mic` | SVG (Solid/Outline) | Active: `#232655` / Inactive: `#8E93B8` |
| `nav-progress` | Bottom navigation Progress| Lucide `BarChart3` | SVG (Solid/Outline) | Active: `#232655` / Inactive: `#8E93B8` |

---

## 3. Typography & Web Fonts

- **Primary Font**: `Plus Jakarta Sans` (Google Fonts, SIL Open Font License 1.1).
- **Fallback Stack**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
- **Weights Used**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold).
- **Licensing Compliance**: SIL OFL 1.1 permits commercial and personal use with zero royalties.
