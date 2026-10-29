import { expect, test, type Page } from "@playwright/test";

// Collects uncaught errors in the page, for example a syntax error in the bundle.
function trackPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  return errors;
}

test("index.html has no placeholders that the build did not replace", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).not.toMatch(/%VITE_[A-Z_]+%/);
  expect(html).not.toContain("%PUBLIC_URL%");
});

test("the landing page renders, with no errors and with the fonts", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/");
  await expect(page.locator("#root")).not.toBeEmpty();

  const loadedFonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((font) => font.status === "loaded").map((font) => font.family.replace(/"/g, ""));
  });
  expect(loadedFonts).toContain("IBM Plex Sans");

  expect(errors).toEqual([]);
});

test("a direct load of a client-side route renders the app", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/dataset-playground");
  await expect(page.getByText("Dataset Playground").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("old hash URLs redirect to clean paths", async ({ page }) => {
  const address = "0xd61dAdFb716Aa65aA29E7CF6E15Ed833a403dcd6";

  await page.goto(`/#/lookup/${address}`);
  await expect(page).toHaveURL(`/address/${address}`);

  await page.goto("/#dataset-playground");
  await expect(page).toHaveURL("/dataset-playground");
});
