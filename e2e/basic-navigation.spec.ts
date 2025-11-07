import { test, expect } from '@playwright/test'

test.describe('Basic Browser Navigation', () => {
  test('loads the application', async ({ page }) => {
    await page.goto('/')

    // Check if the page loads successfully
    await expect(page).toHaveTitle(/TaskWizer Web Browser/)

    // Check for key UI elements
    await expect(page.locator('[data-testid="address-bar"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-bar"]')).toBeVisible()
    await expect(page.locator('[data-testid="browser-view"]')).toBeVisible()
  })

  test('can navigate to a website', async ({ page }) => {
    await page.goto('/')

    // Find the address bar and enter a URL
    const addressBar = page.locator('input[placeholder*="Search"]')
    await addressBar.fill('https://example.com')
    await addressBar.press('Enter')

    // Wait for navigation to complete
    await page.waitForTimeout(2000)

    // Check if the URL was updated in the address bar
    await expect(addressBar).toHaveValue('https://example.com')
  })

  test('can perform a search', async ({ page }) => {
    await page.goto('/')

    // Find the address bar and enter a search query
    const addressBar = page.locator('input[placeholder*="Search"]')
    await addressBar.fill('what is react')
    await addressBar.press('Enter')

    // Wait for search results
    await page.waitForTimeout(3000)

    // Check if search was performed (should show Gemini search URL)
    const currentUrl = page.url()
    expect(currentUrl).toContain('gemini://search')
  })

  test('can create and manage tabs', async ({ page }) => {
    await page.goto('/')

    // Find the new tab button
    const newTabButton = page.locator('button[title*="New Tab"], button:has-text("New Tab")')
    await expect(newTabButton).toBeVisible()

    // Create a new tab
    await newTabButton.click()
    await page.waitForTimeout(1000)

    // Check if new tab was created (should show new tab page)
    const addressBar = page.locator('input[placeholder*="Search"]')
    await expect(addressBar).toHaveValue('')
  })

  test('navigation buttons work correctly', async ({ page }) => {
    await page.goto('/')

    // Navigate to a site first
    const addressBar = page.locator('input[placeholder*="Search"]')
    await addressBar.fill('https://example.com')
    await addressBar.press('Enter')
    await page.waitForTimeout(2000)

    // Navigate to another site
    await addressBar.fill('https://google.com')
    await addressBar.press('Enter')
    await page.waitForTimeout(2000)

    // Test back button
    const backButton = page.locator('button[title*="Back"], button:has(svg:has-text("←"))')
    if (await backButton.isEnabled()) {
      await backButton.click()
      await page.waitForTimeout(1000)

      // Check if we went back to example.com
      await expect(addressBar).toHaveValue('https://example.com')
    }

    // Test forward button
    const forwardButton = page.locator('button[title*="Forward"], button:has(svg:has-text("→"))')
    if (await forwardButton.isEnabled()) {
      await forwardButton.click()
      await page.waitForTimeout(1000)

      // Check if we went forward to google.com
      await expect(addressBar).toHaveValue('https://google.com')
    }
  })

  test('keyboard shortcuts work', async ({ page }) => {
    await page.goto('/')

    const addressBar = page.locator('input[placeholder*="Search"]')

    // Test Ctrl+Enter adds .com
    await addressBar.fill('github')
    await addressBar.press('Control+Enter')
    await page.waitForTimeout(2000)

    await expect(addressBar).toHaveValue('https://www.github.com')

    // Test Shift+Enter adds .org
    await addressBar.fill('mozilla')
    await addressBar.press('Shift+Enter')
    await page.waitForTimeout(2000)

    await expect(addressBar).toHaveValue('https://www.mozilla.org')
  })

  test('bookmark functionality', async ({ page }) => {
    await page.goto('/')

    // Navigate to a site
    const addressBar = page.locator('input[placeholder*="Search"]')
    await addressBar.fill('https://example.com')
    await addressBar.press('Enter')
    await page.waitForTimeout(2000)

    // Find bookmark button
    const bookmarkButton = page.locator('button[title*="Bookmark"], button:has(svg:has-text("☆"))')
    await expect(bookmarkButton).toBeVisible()

    // Toggle bookmark
    await bookmarkButton.click()
    await page.waitForTimeout(500)

    // Check if bookmark state changed (button should be filled)
    const filledBookmark = page.locator('button:has(svg:has-text("★"))')
    await expect(filledBookmark).toBeVisible()
  })

  test('responsive design works', async ({ page }) => {
    await page.goto('/')

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('[data-testid="tab-bar"]')).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="address-bar"]')).toBeVisible()
    await expect(page.locator('[data-testid="browser-view"]')).toBeVisible()
  })

  test('error handling works', async ({ page }) => {
    await page.goto('/')

    // Try to navigate to invalid URL
    const addressBar = page.locator('input[placeholder*="Search"]')
    await addressBar.fill('https://nonexistent-domain-for-testing.invalid')
    await addressBar.press('Enter')
    await page.waitForTimeout(3000)

    // Should show error state or fallback
    const browserView = page.locator('[data-testid="browser-view"]')
    await expect(browserView).toBeVisible()

    // Should still have functional UI
    await expect(addressBar).toBeVisible()
    await expect(page.locator('button[title*="New Tab"]')).toBeVisible()
  })
})