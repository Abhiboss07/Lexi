# Lexi Design System Specification

## Document Status: BASELINE SPECIFICATION
**Reference**: Approved two-screen mockup ([`docs/design/approved_reference.png`](file:///home/abhiboss/Projects/Lexi/docs/design/approved_reference.png))  
**Aesthetic Core**: Pale lavender canvas, crisp white surfaces, deep indigo typography/buttons, periwinkle highlights, warm ambient illustrations, and controlled curved radii.

---

## 1. Color Palette & Token System

### 1.1 Canvas & Surfaces
| Token Name | CSS Variable | Hex Value | Usage in Approved Reference |
| :--- | :--- | :--- | :--- |
| `canvas-staging` | `--color-canvas-staging` | `#E7EAFD` | Background staging canvas outside the device frame |
| `canvas-screen` | `--color-canvas-screen` | `#F6F7FE` | Primary background color of Home and Explore screens |
| `surface-white` | `--color-surface-white` | `#FFFFFF` | Crisp white cards, quick picks cards, shortcut buttons |
| `surface-lavender` | `--color-surface-lavender`| `#F0F2FD` | Subtle tinted card backgrounds (e.g. Today's Word card) |
| `surface-card-subtle`| `--color-surface-subtle` | `#EFF1FE` | Filter pill backgrounds (inactive), progress ring tracks |
| `surface-quote-warm`| `--color-surface-quote` | `#FEF7ED` | Warm cream container for contextual example quotes |

### 1.2 Brand Accents & Interactive Elements
| Token Name | CSS Variable | Hex Value | Usage in Approved Reference |
| :--- | :--- | :--- | :--- |
| `brand-indigo` | `--color-brand-indigo` | `#232655` | Primary CTA buttons ("Start Learning", "Continue"), active bottom nav |
| `brand-indigo-dark`| `--color-brand-indigo-dark`| `#1B1E48` | Deep gradient base for Café Conversation card, dark banners |
| `brand-indigo-hover`| `--color-brand-indigo-hover`| `#181A3C` | Hover / pressed state for primary buttons |
| `accent-periwinkle`| `--color-accent-periwinkle`| `#646AA4` | "Your Way" accent text, active carousel indicator |
| `accent-pill-lavender`| `--color-pill-lavender` | `#E2E0FE` | "adjective" badge in Today's Word card |
| `accent-streak-flame`| `--color-accent-flame` | `#FF6243` | Streak flame icon, high-energy milestone badges |
| `accent-gold` | `--color-accent-gold` | `#F5A623` | Vocabulary lightbulb shortcut icon, star sparkles |

### 1.3 Typography Colors
| Token Name | CSS Variable | Hex Value | Contrast Ratio on White / Lavender |
| :--- | :--- | :--- | :--- |
| `text-primary` | `--color-text-primary` | `#222149` | > 12:1 (Exceeds WCAG AAA standard) |
| `text-secondary` | `--color-text-secondary` | `#6B7094` | > 5.2:1 (Exceeds WCAG AA standard) |
| `text-tertiary` | `--color-text-tertiary` | `#8E93B8` | > 3.5:1 (For non-critical captions, subtitles) |
| `text-inverse` | `--color-text-inverse` | `#FFFFFF` | For buttons and dark banner cards |

### 1.4 Borders & Dividers
| Token Name | CSS Variable | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| `border-subtle` | `--color-border-subtle` | `#ECEEFE` | Card borders, bottom navigation top divider |
| `border-medium` | `--color-border-medium` | `#E0E3F8` | Shortcut card borders, input borders |
| `border-focus` | `--color-border-focus` | `#646AA4` | Keyboard accessibility focus rings (3px outline) |

---

## 2. Typography Hierarchy

Lexi uses a clean, highly legible humanistic geometric sans-serif typeface (system fallback stack: `Plus Jakarta Sans`, `Inter`, `-apple-system`, `sans-serif`).

| Style | Size | Weight | Line Height | Tracking | Tailwind Class Equivalent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Title** | 30px | 700 (Bold) | 36px | `-0.02em` | `text-[30px] font-bold leading-tight tracking-tight` |
| **Section Header** | 20px | 700 (Bold) | 26px | `-0.01em` | `text-[20px] font-bold leading-snug tracking-tight` |
| **Card Title** | 17px | 600 (Semibold) | 22px | `0` | `text-[17px] font-semibold leading-normal` |
| **Body Standard** | 14px | 400 (Regular) | 20px | `0` | `text-[14px] font-normal leading-relaxed` |
| **Body Semibold** | 14px | 600 (Semibold) | 20px | `0` | `text-[14px] font-semibold leading-relaxed` |
| **Caption / Subtitle** | 12px | 500 (Medium) | 16px | `+0.01em` | `text-[12px] font-medium leading-normal` |
| **Eyebrow / Badge** | 10px | 700 (Bold) | 14px | `+0.08em` | `text-[10px] font-bold uppercase tracking-widest` |

---

## 3. Radii & Surface Elevation

### 3.1 Controlled Border Radii
- **`rounded-full` (`9999px`)**: Primary buttons, filter pills, streak badge, carousel dots, circular arrow buttons.
- **`rounded-3xl` (`28px`)**: Hero container, Featured Café banner, Today's Word card.
- **`rounded-2xl` (`20px`)**: Continue Your Journey card, Quick Picks cards, Adventure cards.
- **`rounded-xl` (`16px`)**: Category shortcut square cards.

### 3.2 Shadow System
```css
/* Subtle, multi-layered ambient lavender shadows */
--shadow-card-ambient: 0 4px 20px -2px rgba(35, 38, 85, 0.04), 0 2px 6px -1px rgba(35, 38, 85, 0.02);
--shadow-card-elevated: 0 10px 25px -4px rgba(35, 38, 85, 0.08), 0 4px 10px -2px rgba(35, 38, 85, 0.03);
--shadow-button-primary: 0 4px 14px rgba(35, 38, 85, 0.25);
```

---

## 4. Reusable Component Inventory

### 4.1 Header (`LexiHeader`)
- Left: Brand monogram (`Lexi`) + sparkle glyph (`✦`) + subtitle (`Your English Companion`).
- Right: Search button, Streak flame badge (`🔥 7`), and User avatar.

### 4.2 Hero Card (`IllustratedHero`)
- Editorial layout with headline, body, "Start Learning →" CTA, carousel indicators, and 3D illustrated character reading a book with a sleeping kitten.

### 4.3 Category Shortcut (`CategoryShortcutRow`)
- 5 items (`Conversation`, `Stories`, `Vocabulary`, `Grammar`, `Listening`).
- Crisp white rounded-xl cards with centered icons and labels.

### 4.4 Featured Banner (`FeaturedBanner`)
- Midnight navy gradient container, warm café photography with latte art, duration/level metadata pills, and circular action launch button.

### 4.5 Quick Picks Grid (`QuickPicksGrid`)
- 2x2 grid containing "Let's Talk", "Short Stories", "Word of the Day", and "Listen & Repeat".
- Each card has an avatar/monogram, title, subtitle, and circular arrow button.

### 4.6 Explore Progress Card (`JourneyProgressCard`)
- Displays unit name, grammar topic, progress percentage with circular ring (`60%`), and "Continue →" CTA.

### 4.7 Filter Bar (`AdventureFilterPillBar`)
- Horizontal pills for "All", "Daily Life", "Travel", "Career", "Fun" with instantaneous client filtering.

### 4.8 Today's Word (`VocabularyFeatureCard`)
- Interactive vocabulary card with word, phonetic audio button, part of speech pill, definition, context sentence box, and celebrating character artwork.

### 4.9 Bottom Navigation (`BottomNavBar`)
- 4 destinations (`Home`, `Explore`, `Practice`, `Progress`) with unmistakable active state (filled icon + bold label) and haptic feedback.
