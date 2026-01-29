import { test, expect } from "@playwright/test";

test("debug - capture page state", async ({ page }) => {
  // Navigate to build page
  console.log("Navigating to /build...");
  await page.goto("/build", { waitUntil: "domcontentloaded" });
  
  // Wait a bit for client-side rendering
  await page.waitForTimeout(3000);
  
  // Capture screenshot
  await page.screenshot({ path: "debug-screenshot.png", fullPage: true });
  console.log("Screenshot saved to debug-screenshot.png");
  
  // Get page content
  const content = await page.content();
  console.log("Page HTML length:", content.length);
  
  // Log visible text
  const bodyText = await page.locator("body").textContent();
  console.log("Body text:", bodyText?.substring(0, 500));
  
  // Check for error messages
  const errorText = await page.locator("body").textContent();
  if (errorText?.includes("Error") || errorText?.includes("error")) {
    console.log("Found error in page!");
  }
  
  // Log any console errors
  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("Console error:", msg.text());
    }
  });
  
  // Check if specific elements exist
  const header = await page.locator("header").count();
  const main = await page.locator("main").count();
  const h1 = await page.locator("h1").count();
  
  console.log("Element counts - header:", header, "main:", main, "h1:", h1);
  
  // Try to find any visible text
  const allText = await page.evaluate(() => document.body.innerText);
  console.log("All visible text:", allText.substring(0, 1000));
  
  // Force test to pass so we can see the output
  expect(true).toBe(true);
});
