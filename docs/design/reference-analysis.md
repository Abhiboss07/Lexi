# Approved Visual Reference Analysis

## Document Status: VERIFIED & AUTHORITATIVE
**Source Image**: [`docs/design/approved_reference.png`](file:///home/abhiboss/Projects/Lexi/docs/design/approved_reference.png)  
**Original Generated File**: [`docs/design/Lexi English Learning App Concept.png`](file:///home/abhiboss/Projects/Lexi/docs/design/Lexi%20English%20Learning%20App%20Concept.png)  
**Image Dimensions**: 1222 × 1287 pixels (RGB, non-interlaced PNG)  
**Screen Crops**:
- Home Screen: [`docs/design/reference_screen_home.png`](file:///home/abhiboss/Projects/Lexi/docs/design/reference_screen_home.png) (570 × 1242 px)
- Explore Screen: [`docs/design/reference_screen_explore.png`](file:///home/abhiboss/Projects/Lexi/docs/design/reference_screen_explore.png) (570 × 1242 px)
- Rejected Previous Image: [`docs/design/rejected_personal_screenshot.png`](file:///home/abhiboss/Projects/Lexi/docs/design/rejected_personal_screenshot.png) (Personal desktop screenshot previously mistakenly used, now preserved and superseded)

---

## 1. Visual Composition & Screen Hierarchy

The approved reference displays two side-by-side screens for the Lexi mobile application on a pale lavender staging canvas (`#E7EAFD`):

```
+------------------------------------------+------------------------------------------+
|            LEFT SCREEN: HOME             |           RIGHT SCREEN: EXPLORE          |
+------------------------------------------+------------------------------------------+
| [Status Bar: 9:41, Cellular, WiFi, Bat]  | [Status Bar: 9:41, Cellular, WiFi, Bat]  |
|                                          |                                          |
| Lexi ✦             (Search) [🔥 7] (Avt) | Continue Your Journey           See All >|
| Your English Companion                   | [ Aa ] UNIT 3 • GRAMMAR           (60%)  |
|                                          |        Present vs Past                   |
| A BRIGHTER YOU                           |        [ Continue -> ]                   |
| Learn English    [ 3D Character Art:     |                                          |
| Your Way           Girl reading "Lexi"   | Choose Your Adventure                    |
| Real conversations book, cat sleeping,   | [All*] [Daily Life] [Travel] [Career]    |
| Fun stories...     morning light]        |                                          |
| [ Start Learning -> ]                    | [Airport Card] [Shopping Card] [Job Card]|
| (•) - - - (Carousel Indicators)          |                                          |
|                                          | Today's Word ↻                See More > |
| [💬]    [📖]     [💡]     [📝]     [🎧]  | confident [adjective]       [Celebrating|
| Convo  Stories  Vocab   Grammar  Listen  | /ˈkɒnfɪdənt/ 🔊              Girl with  |
|                                          | "She felt confident..." [🔖]  Glasses]   |
| FEATURED FOR YOU                         |                                          |
| Café Conversation      [ Warm Cafe Scene | Popular with Learners          See All > |
| Learn how to order...    with latte art  | [Cozy Desk]   [Signpost]    [Friends]    |
| (⏱ 5-8 min) (📊 Beginner) and board ] ->|                                          |
|                                          |                                          |
| Quick Picks                      See All |                                          |
| [🎧 Let's Talk]    [📖 Short Stories]    |                                          |
| [Aa Word of Day]   [🎙️ Listen & Repeat]  |                                          |
|                                          |                                          |
| [🏠 Home*]  [🧭 Explore] [🎙️ Prac] [📊 Pro]| [🏠 Home]  [🧭 Explore*] [🎙️ Prac] [📊 Pro]|
+------------------------------------------+------------------------------------------+
```

---

## 2. Left Screen: Home Page Anatomical Breakdown

### 2.1 App Header
- **Branding**: `Lexi` wordmark in Bold Deep Indigo (`#222149`, ~24px equivalent), followed by a 4-point violet sparkle (`✦`).
- **Sub-Brand Slogan**: `Your English Companion` in medium slate (`#7D82A8`, ~12px).
- **Utility Actions**:
  - Search: Circular soft surface (`#FFFFFF` or `#F0F2FC`, 36px diameter) with dark indigo magnifying glass icon.
  - Streak Indicator: Integrated pill with orange flame icon (`#FF6243`), space, and bold count `7` (`#30335F`).
  - User Avatar: 36px circular avatar with subtle 1px border.

### 2.2 Hero Section ("A Brighter You")
- **Layout**: Asymmetric split with editorial typography on the left and character illustration on the right.
- **Eyebrow**: `A BRIGHTER YOU` — uppercase, letter-spaced (`tracking-wider`), ~11px, lavender indigo (`#7D82A8`).
- **Main Headline**:
  - Line 1: `Learn English` in high-contrast Deep Indigo (`#222149`, ~30px, font-weight: 700).
  - Line 2: `Your Way` highlighted in soft lavender-periwinkle (`#646AA4` / `#5E649E`, font-weight: 700).
- **Body Copy**: `Real conversations. Fun stories. Useful skills. A more confident you.` (~13px, color `#6B7094`, line-height 1.4).
- **Primary CTA**: `Start Learning →` pill button:
  - Fill: Deep Indigo (`#232655` / `#30335F`).
  - Text: White (`#FFFFFF`, ~14px, semibold).
  - Shape: Full pill radius (`rounded-full`, 9999px), generous tap padding (12px vertical, 20px horizontal).
- **Carousel Pagination**: 4 pill indicators below the CTA.
  - Active dot: Expanded indigo pill (`18px × 5px`, `#646AA4`).
  - Inactive dots: Muted circles/pills (`5px × 5px`, `#E2E4F8`).
- **Hero Artwork**: High-quality 3D anime aesthetic illustration of a young woman sitting comfortably in oversized lounge clothes, reading a book titled *Lexi*, with a sleeping ginger-and-white cat curled up in the foreground, bathed in warm sunlit interior ambient lighting.

### 2.3 Category Learning Shortcuts
- **Row Structure**: 5 evenly spaced shortcuts in a horizontal flex layout.
- **Shortcuts**:
  1. **Conversation**: Speech bubble icon with three dots (`#3B3D6B`).
  2. **Stories**: Open book icon (`#3B3D6B`).
  3. **Vocabulary**: Lightbulb icon (`#E5A93C` warm yellow/amber accent).
  4. **Grammar**: Document/checklist icon (`#3B3D6B`).
  5. **Listening**: Headphones icon (`#3B3D6B`).
- **Card Styling**: Rounded square surfaces (`rounded-2xl`, ~52px × 52px), crisp white surface (`#FFFFFF`), subtle soft lavender shadow (`rgba(48, 51, 95, 0.05)`).
- **Labels**: Centered underneath each icon, ~11px, medium weight, `#30335F`.

### 2.4 Featured Learning Banner ("Café Conversation")
- **Card Background**: Deep midnight navy gradient (`#1B1E48` to `#2A2D5C`), rounded-3xl (`28px`).
- **Badge**: `FEATURED FOR YOU` — small uppercase pill label (~10px, letter-spaced, `#A8ABDA`).
- **Title**: `Café Conversation` (White `#FFFFFF`, ~20px, bold).
- **Description**: `Learn how to order food, ask questions and have a casual chat in a café.` (`#D2D5F2`, ~12px).
- **Metadata Pills**:
  - Duration: `⏱ 5-8 min` (translucent dark pill with border).
  - Level: `📊 Beginner` (translucent dark pill with border).
- **Action CTA**: Circular white/lavender button (`#FFFFFF`) with dark indigo right arrow (`#232655`), positioned at the bottom right.
- **Banner Imagery**: Warm, atmospheric café table scene with latte art in a white ceramic cup, wooden table, and chalkboard sign reading *"Good Food Good English"*.

### 2.5 Quick Picks Grid
- **Section Header**: `Quick Picks` (left, bold, ~18px, `#222149`) with `See All` link (right, ~13px, `#5E649E`).
- **Grid Layout**: 2 columns × 2 rows with 12px gap.
- **Cards**:
  1. **Let's Talk**: Avatar of young man with headphones, label `Let's Talk`, subtitle `Practice with AI`, circular arrow button.
  2. **Short Stories**: Illustrated open hardcover book, label `Short Stories`, subtitle `Learn with fun`, circular arrow button.
  3. **Word of the Day**: Notebook with "Aa" monogram, label `Word of the Day`, subtitle `Expand vocabulary`, circular arrow button.
  4. **Listen & Repeat**: Vintage studio microphone, label `Listen & Repeat`, subtitle `Improve your speaking`, circular arrow button.
- **Card Styling**: White surface (`#FFFFFF`), rounded-2xl (`20px`), subtle border (`#ECEEFE`), internal padding 12px.

### 2.6 Bottom Navigation Bar
- **Dimensions**: Fixed bottom bar with safe-area padding (~64px height).
- **Surface**: Ultra-clean white/pale lavender (`#FFFFFF` with subtle top divider `#ECEEFE`).
- **Tabs**:
  - **Home**: Solid filled home icon, bold dark indigo label (Active).
  - **Explore**: Outlined compass icon, muted slate label.
  - **Practice**: Outlined microphone icon, muted slate label.
  - **Progress**: Outlined bar chart icon, muted slate label.

---

## 3. Right Screen: Explore Page Anatomical Breakdown

### 3.1 Continue Your Journey (Curriculum Progress Card)
- **Section Header**: `Continue Your Journey` + `See All →`.
- **Card Layout**:
  - Left: Illustrated dictionary / "Aa" grammar book nestled on a pale lavender soft container.
  - Center:
    - Eyebrow: `UNIT 3 • GRAMMAR` (`#7D82A8`, ~11px).
    - Lesson Title: `Present vs Past` (`#222149`, ~17px, bold).
    - Subtitle: `Understand and use tenses in real situations.` (`#6B7094`, ~12px).
    - CTA: `Continue →` (solid dark indigo pill, white text).
  - Right: Circular Progress Ring (60% filled in dark indigo `#232655`, light track `#E2E4F8`, bold `60%` centered text).

### 3.2 Choose Your Adventure (Category Filter & Scenario Cards)
- **Section Header**: `Choose Your Adventure` (`#222149`, ~18px).
- **Filter Pills**: Horizontal scrolling pill bar:
  - `All` (Active: solid dark indigo `#232655`, white text).
  - `Daily Life` (Inactive: pale lavender `#EFF1FE`, muted text `#4A4E7A`).
  - `Travel` (Inactive).
  - `Career` (Inactive).
  - `Fun` (Inactive).
- **Adventure Scenario Cards** (Horizontal scroll):
  1. **At the Airport**: Commercial airliner taking off over pastel clouds, pink badge with plane icon, title `At the Airport`, subtitle `Navigate, ask, and handle travel situations.`, circular arrow button.
  2. **Shopping Day**: Stylish orange shopping bags and monstera plant, blue badge with plane/tag icon, title `Shopping Day`, subtitle `Learn useful phrases while shopping.`, circular arrow button.
  3. **Job Interview**: Professional young man in navy suit and blue tie in modern office, title `Job Interview`, subtitle `Build confidence for real interviews.`, circular arrow button.

### 3.3 Today's Word (Vocabulary Card with Spaced Repetition Hooks)
- **Section Header**: `Today's Word ↻` + `See More →`.
- **Card Background**: Soft lavender surface (`#F4F4FD`), rounded-3xl (`24px`).
- **Content Hierarchy**:
  - Word: `confident` (`#222149`, ~24px, bold).
  - Part of Speech: `adjective` (soft periwinkle pill `#E2E0FE`, text `#4E5388`).
  - IPA & Pronunciation: `/ˈkɒnfɪdənt/` + audio speaker icon `🔊`.
  - Definition: `feeling sure about your abilities or yourself.` (`#505479`, ~13px).
  - Context Sentence Box: `"She felt confident before the interview."` in a warm cream container (`#FEF7ED`) with bookmark ribbon icon (`#232655`).
  - Illustration: Cheerful character art of a girl with round glasses and purple hoodie celebrating with raised fists and golden sparkle stars (`✦`).

### 3.4 Popular with Learners
- **Section Header**: `Popular with Learners` + `See All →`.
- **Carousel Thumbnails**:
  1. Nighttime bedroom study desk with lamp, books, and starry window.
  2. Scenic mountain trail crossroads signpost under soft clouds.
  3. Group of three diverse smiling friends outdoors.

---

## 4. Measured Proportions & Spacing Scale

Based on calibrated measurements of the approved mockup screens:
- **Horizontal Screen Padding**: `20px` (or `16px` on ultra-narrow 360px viewports).
- **Section Spacing**: `24px` vertical margins between sections.
- **Card Padding**:
  - Large Hero Card: `24px`
  - Featured Café Card: `20px`
  - Quick Picks Cards: `14px`
  - Today's Word Card: `20px`
- **Border Radii**:
  - Large Cards (Hero, Cafe, Today's Word): `24px` to `28px` (`rounded-3xl`)
  - Medium Cards (Quick Picks, Adventure Cards): `18px` to `20px` (`rounded-2xl`)
  - Buttons & Filter Pills: `9999px` (`rounded-full`)
  - Shortcut Square Cards: `16px` (`rounded-2xl`)
