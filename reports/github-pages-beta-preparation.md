# Lexi — GitHub Pages Beta Deployment Preparation Report

**Repository:** `https://github.com/Abhiboss07/Lexi.git`  
**Owner:** `Abhiboss07`  
**Repository Name:** `Lexi`  
**Deployment Branch:** `main`  
**Target URL:** `https://abhiboss07.github.io/Lexi/`  
**Date & Timestamp:** 2026-10-26T22:04:00+05:30  

---

## 1. Executive Summary

Lexi has been configured and verified locally for controlled beta deployment to GitHub Pages via GitHub Actions.
All changes preserve 100% of local development workflows (`base: '/'`), while enabling smooth, automated production deployments with base path `/Lexi/` under GitHub Actions.

Key achievements:
1. **Dynamic Vite Base Path**: Configured `base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Lexi/' : '/')`.
2. **PWA & Service Worker Compatibility**: `public/sw.js` and `src/registerServiceWorker.ts` dynamically adapt to registration scope (`self.registration.scope`), ensuring offline caching and shell fallbacks function accurately at `/Lexi/`.
3. **PWA Web Manifest**: Updated `public/manifest.webmanifest` to use relative URLs (`"start_url": "./"`, `"scope": "./"`), preventing installed PWAs from breaking out of the GitHub Pages repository path.
4. **SPA Deep Link & Direct Reload Support**: Added an automated Vite bundle plugin that duplicates `dist/index.html` to `dist/404.html`. Direct reloads on nested routes on GitHub Pages serve the complete SPA shell without 404 errors.
5. **Asset Resolution Safety**: Added `src/utils/assetPath.ts` (`getAssetPath`) to resolve public asset paths (`/assets/...`, `/favicon.svg`) taking into account the configured deployment base URL.
6. **Automated GitHub Actions Workflow**: Created `.github/workflows/deploy.yml` using official GitHub Pages actions (`upload-pages-artifact@v3`, `deploy-pages@v4`) with least-privilege permissions.

---

## 2. Configuration & Changes Implemented

### A. Vite Configuration (`vite.config.ts`)
```ts
// Generates dist/404.html from dist/index.html to support SPA routing on GitHub Pages
function githubPagesSpaFallback() {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexPath = path.resolve(distDir, 'index.html');
      const fallbackPath = path.resolve(distDir, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, fallbackPath);
      }
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Lexi/' : '/'),
  plugins: [
    react(),
    tailwindcss(),
    githubPagesSpaFallback(),
  ],
  ...
```

### B. Service Worker Scope & Pre-caching (`public/sw.js`)
- Dynamically resolves the base path using `self.registration.scope`:
  ```js
  const getBaseScope = () => {
    try {
      return new URL(self.registration.scope).pathname;
    } catch {
      return '/';
    }
  };
  ```
- Pre-caches `${normalizedBase}`, `${normalizedBase}index.html`, `${normalizedBase}favicon.svg`, and `${normalizedBase}manifest.webmanifest`.
- Falls back to `${normalizedBase}index.html` on offline navigation requests.

### C. Service Worker Registration (`src/registerServiceWorker.ts`)
- Uses `import.meta.env.BASE_URL` to register `${base}sw.js` with `{ scope: base }`.

### D. Web Manifest (`public/manifest.webmanifest`)
- Changed `start_url` and `icons.src` to be path-relative:
  ```json
  "start_url": "./",
  "scope": "./",
  "icons": [
    {
      "src": "favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
  ```

### E. Static Asset Resolution Utility (`src/utils/assetPath.ts`)
- Implemented `getAssetPath(relativePath: string)`:
  Prepends `import.meta.env.BASE_URL` to local asset paths while leaving remote, data, and blob URLs untouched.
- Integrated into `LexiHeader`, `HeroCard`, `PracticeHeroCard`, `ProgressDashboardScreen`, `FeaturedBanner`, and `QuickPicks`.

### F. GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- **Triggers**: Push to `main` branch or manual `workflow_dispatch`.
- **Permissions**: `contents: read`, `pages: write`, `id-token: write`.
- **Concurrency**: `group: "pages"`, `cancel-in-progress: false`.
- **Steps**:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` (Node.js 22, cache `npm`)
  3. `npm ci`
  4. `npx tsc --noEmit`
  5. `npm run test:unit`
  6. `npm run build` with `VITE_BASE_PATH: /Lexi/`
  7. `actions/upload-pages-artifact@v3` (`path: dist`)
  8. `actions/deploy-pages@v4`

---

## 3. Local Verification & Test Results

| Test / Gate | Command | Result | Notes |
|:---|:---|:---:|:---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | **PASS (code 0)** | 0 type errors |
| **Vitest Unit Suite** | `npm run test:unit` | **PASS (code 0)** | **200 / 200 tests passing across 28 files** (including `assetPath.test.ts`) |
| **Standard Build (`base: '/'`)** | `npm run build` | **PASS (code 0)** | Built in 1.82s. `dist/index.html` & `dist/404.html` generated |
| **GitHub Pages Build (`base: '/Lexi/'`)** | `VITE_BASE_PATH=/Lexi/ npm run build` | **PASS (code 0)** | Built in 1.90s. Asset links prefixed with `/Lexi/assets/...` |
| **Base Path Network Verification** | `node scripts/verify_github_pages_base.js` | **PASS (code 0)** | Loaded `http://localhost:4173/Lexi/`. **0 failed network requests**. Hero image, avatar, CSS, and chunks loaded with HTTP 200 |
| **SPA 404 Fallback Verification** | Headless Chrome test of `404.html` | **PASS (code 0)** | Verified direct navigation to `404.html` bootstraps full app with **0 failed requests** |
| **Full Playwright Suite** | `tests/home.spec.ts` + 8 suites | **PASS (code 0)** | **53 / 53 integration tests passing** |
| **Production Dependency Audit** | `npm audit --omit=dev` | **PASS (code 0)** | **0 vulnerabilities** |

---

## 4. GitHub Settings Required Prior to First Push

Before pushing to GitHub, you must configure GitHub Pages in your repository settings:

1. Go to your GitHub repository in your browser:
   `https://github.com/Abhiboss07/Lexi`
2. Click **Settings** (tab at the top right).
3. In the left navigation sidebar under "Code and automation", click **Pages**.
4. Under **Build and deployment**:
   - Change **Source** from *"Deploy from a branch"* to **"GitHub Actions"**.
5. Save the setting.

> [!WARNING]
> **Privacy Notice**: GitHub Pages sites on public repositories (and standard personal GitHub accounts) are publicly accessible to anyone who has the URL. There is no built-in password or token protection on GitHub Pages. Lexi contains zero backend credentials, zero user tracker keys, and stores all user learning data purely in the learner's local browser IndexedDB.

---

## 5. Deployment Step-by-Step Instructions

When you are ready to publish Lexi to GitHub Pages:

### Step 1: Verify Git Status
```bash
git status
```
Verify that all the modified and created files are present.

### Step 2: Stage and Commit the Prepared Changes
```bash
git add .github/workflows/deploy.yml vite.config.ts index.html public/manifest.webmanifest public/sw.js src/registerServiceWorker.ts src/utils/ src/components/ src/App.tsx reports/
git commit -m "feat(deploy): configure GitHub Pages deployment and base path compatibility"
```

### Step 3: Push to GitHub `main` Branch
```bash
git push origin main
```

### Step 4: Monitor the Deployment Action
1. Open `https://github.com/Abhiboss07/Lexi/actions`.
2. Observe the "Deploy Lexi to GitHub Pages" workflow execution.
3. Once completed, your live application will be accessible at:
   **`https://abhiboss07.github.io/Lexi/`**
