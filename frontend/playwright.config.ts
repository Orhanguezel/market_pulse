// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

// Base URL configuration for different environments
const rawBaseURL =
  process.env.PLAYWRIGHT_BASE_URL || 
  process.env.NEXT_PUBLIC_SITE_URL || 
  'http://localhost:3002';

const baseURL = String(rawBaseURL).trim().replace(/\/+$/, '');

export default defineConfig({
  testDir: './tests',
  timeout: 90_000, // Arttırıldı: Cloudinary image loading için
  expect: { 
    timeout: 15_000 // SEO head loading için yeterli süre
  },
  retries: process.env.CI ? 2 : 1,
  fullyParallel: true,
  
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Ensotek için browser settings
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    
    // Test environment variables
    extraHTTPHeaders: {
      'Accept-Language': 'de,tr,en'
    }
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // Ensotek desktop optimization
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: 'firefox-desktop', 
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      }
    }
  ],
  
  // Test reporting
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],
  
  outputDir: './test-results/artifacts',
});
