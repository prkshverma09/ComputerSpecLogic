import { test, expect } from "@playwright/test"

test.describe("Component Selection - Filter and Sort", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(1000)
  })

  test("should display filter toolbar in selection dialog", async ({ page }) => {
    await page.locator("text=CASE").first().click()
    await page.waitForTimeout(1000)

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    await expect(dialog.getByText(/filters/i)).toBeVisible()
    await expect(dialog.getByRole("button", { name: /brand/i })).toBeVisible()
    await expect(dialog.getByRole("button", { name: /price/i })).toBeVisible()
    await expect(dialog.getByRole("button", { name: /sort/i })).toBeVisible()
  })

  test("should open brand filter popover", async ({ page }) => {
    await page.locator("text=PROCESSOR").first().click()
    await page.waitForTimeout(1000)

    const dialog = page.locator('[role="dialog"]')
    await dialog.getByRole("button", { name: /brand/i }).click()

    await expect(page.getByRole("checkbox").first()).toBeVisible({ timeout: 5000 })
  })

  test("should filter by brand when checkbox is clicked", async ({ page }) => {
    await page.locator("text=PROCESSOR").first().click()
    await page.waitForTimeout(1500)

    const dialog = page.locator('[role="dialog"]')
    
    const initialCount = await dialog.locator('[class*="card"]').count()
    
    await dialog.getByRole("button", { name: /brand/i }).click()
    await page.waitForTimeout(500)

    const firstCheckbox = page.getByRole("checkbox").first()
    await firstCheckbox.click()
    await page.waitForTimeout(1000)

    await page.keyboard.press("Escape")
    await page.waitForTimeout(1000)

    const brandButton = dialog.getByRole("button", { name: /brand/i })
    const badge = brandButton.locator('[class*="badge"]')
    await expect(badge).toBeVisible()
  })

  test("should open price filter popover", async ({ page }) => {
    await page.locator("text=GRAPHICS").first().click()
    await page.waitForTimeout(1000)

    const dialog = page.locator('[role="dialog"]')
    await dialog.getByRole("button", { name: /price/i }).click()

    await expect(page.getByLabel(/min/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel(/max/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /apply/i })).toBeVisible()
  })

  test("should filter by price range", async ({ page }) => {
    await page.locator("text=GRAPHICS").first().click()
    await page.waitForTimeout(1500)

    const dialog = page.locator('[role="dialog"]')
    
    await dialog.getByRole("button", { name: /price/i }).click()
    await page.waitForTimeout(500)

    const minInput = page.getByLabel(/min/i)
    const maxInput = page.getByLabel(/max/i)

    await minInput.fill("100")
    await maxInput.fill("500")
    
    await page.getByRole("button", { name: /apply/i }).click()
    await page.waitForTimeout(1000)

    const priceButton = dialog.getByRole("button", { name: /price/i })
    await expect(priceButton).toContainText(/\$/)
  })

  test("should open sort dropdown", async ({ page }) => {
    await page.locator("text=MOTHERBOARD").first().click()
    await page.waitForTimeout(1000)

    const dialog = page.locator('[role="dialog"]')
    await dialog.getByRole("button", { name: /sort/i }).click()

    await expect(page.getByText("Relevance")).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("Price: Low to High")).toBeVisible()
    await expect(page.getByText("Price: High to Low")).toBeVisible()
  })

  test("should sort by price low to high", async ({ page }) => {
    await page.locator("text=POWER SUPPLY").first().click()
    await page.waitForTimeout(1500)

    const dialog = page.locator('[role="dialog"]')
    
    await dialog.getByRole("button", { name: /sort/i }).click()
    await page.waitForTimeout(500)

    await page.getByText("Price: Low to High").click()
    await page.waitForTimeout(1000)

    const sortButton = dialog.getByRole("button", { name: /sort/i })
    await expect(sortButton).toContainText(/low to high/i)
  })

  test("should show clear button when filters are active", async ({ page }) => {
    await page.locator("text=MEMORY").first().click()
    await page.waitForTimeout(1500)

    const dialog = page.locator('[role="dialog"]')
    
    await dialog.getByRole("button", { name: /brand/i }).click()
    await page.waitForTimeout(500)

    const firstCheckbox = page.getByRole("checkbox").first()
    await firstCheckbox.click()
    await page.waitForTimeout(500)

    await page.keyboard.press("Escape")
    await page.waitForTimeout(500)

    await expect(dialog.getByRole("button", { name: /clear/i })).toBeVisible()
  })

  test("should clear all filters when clear button is clicked", async ({ page }) => {
    await page.locator("text=PROCESSOR").first().click()
    await page.waitForTimeout(1500)

    const dialog = page.locator('[role="dialog"]')
    
    await dialog.getByRole("button", { name: /brand/i }).click()
    await page.waitForTimeout(500)

    const firstCheckbox = page.getByRole("checkbox").first()
    await firstCheckbox.click()
    await page.waitForTimeout(500)

    await page.keyboard.press("Escape")
    await page.waitForTimeout(500)

    const clearButton = dialog.getByRole("button", { name: /clear/i })
    await expect(clearButton).toBeVisible()
    await clearButton.click()
    await page.waitForTimeout(500)

    await expect(clearButton).not.toBeVisible()
  })

  test("should show socket filter for CPU", async ({ page }) => {
    await page.locator("text=PROCESSOR").first().click()
    await page.waitForTimeout(1000)

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog.getByRole("button", { name: /socket/i })).toBeVisible()
  })

  test("should show form factor filter for Motherboard", async ({ page }) => {
    await page.locator("text=MOTHERBOARD").first().click()
    await page.waitForTimeout(1000)

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog.getByRole("button", { name: /form factor/i })).toBeVisible()
  })

  test("should show wattage filter for PSU", async ({ page }) => {
    await page.locator("text=POWER SUPPLY").first().click()
    await page.waitForTimeout(1000)

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog.getByRole("button", { name: /wattage/i })).toBeVisible()
  })
})
