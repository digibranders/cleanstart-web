import { expect, test } from '@playwright/test';
import path from 'node:path';

test('verify CMS login succeeds after the serverFunction fix', async ({ page }) => {
  // 1. Go to login page
  console.log('Navigating to /admin/login...');
  await page.goto('/admin/login');
  
  // Verify login page loaded
  await expect(page.locator('input[name="email"]')).toBeVisible();
  
  // 2. Fill login details
  console.log('Filling credentials...');
  await page.fill('input[name="email"]', 'admin@cleanstart.com');
  await page.fill('input[name="password"]', 'Admin@123');
  
  // 3. Submit
  console.log('Submitting login form...');
  await page.click('button[type="submit"]');
  
  // 4. Wait for successful navigation / dashboard loading
  console.log('Waiting for admin dashboard...');
  // The admin page should load successfully, checking for URL or standard dashboard element
  await page.waitForURL('**/admin');
  
  // Wait for the dashboard shell/content to be visible and ensure no 500 error screen is shown
  await expect(page.locator('.dashboard')).toBeVisible({ timeout: 15000 });
  
  console.log('Login succeeded! Taking screenshot...');
  
  // 5. Take screenshot and save it to the conversation artifacts directory
  const screenshotPath = '/Users/a12345/.gemini/antigravity-ide/brain/22a21575-ef65-4290-8210-c806c69af1a6/login_success.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);
});
