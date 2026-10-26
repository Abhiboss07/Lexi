import { chromium } from 'playwright';

async function testBaseDeployment() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const failedRequests = [];
  page.on('response', (res) => {
    if (res.status() >= 400) {
      failedRequests.push({ url: res.url(), status: res.status() });
    }
  });

  console.log('Navigating to http://localhost:4173/Lexi/ ...');
  // First, verify index.html or 404.html serves correctly
  const response = await page.goto('http://localhost:4173/Lexi/', { waitUntil: 'networkidle' }).catch(() => null);

  console.log('Response URL:', page.url());
  console.log('Failed HTTP requests:', failedRequests);

  // Check that the Lexi title is rendered
  const title = await page.title();
  console.log('Document Title:', title);

  // Check that Hero section is present
  const heroHeading = page.locator('#hero-heading');
  const isHeroVisible = await heroHeading.isVisible().catch(() => false);
  console.log('Is Hero Heading Visible:', isHeroVisible);

  // Check an image source to confirm getAssetPath output
  const heroImg = page.locator('img[alt*="Student sitting comfortably"]');
  const heroSrc = await heroImg.getAttribute('src');
  console.log('Hero Image Src:', heroSrc);

  await browser.close();

  if (failedRequests.length > 0) {
    console.warn(`WARNING: Encountered ${failedRequests.length} non-200 responses.`);
  } else {
    console.log('SUCCESS: All network requests succeeded with 200 OK!');
  }
}

testBaseDeployment().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
