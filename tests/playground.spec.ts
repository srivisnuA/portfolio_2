import { test, expect } from "@playwright/test";

test("the UFO follows the pointer and island objects respond without opening a panel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  await page.mouse.move(940, 480, { steps: 8 });
  await expect(page.locator("html")).toHaveAttribute("data-ufo-cursor", "true");
  await expect(page.locator(".ufo-cursor")).toHaveCSS("opacity", "1");
  await expect.poll(async () => page.locator(".ufo-cursor").evaluate(el => {
    const transform = new DOMMatrix(getComputedStyle(el).transform);
    return Math.hypot(transform.e - 940, transform.f - 480);
  })).toBeLessThan(5);
  const telescope = page.getByRole("button", { name: "Align the telescope", exact: true });
  await telescope.click();
  await expect(page.locator(".curiosity-response")).toContainText("A new constellation");
  await expect(page.locator(".curiosity-progress")).toContainText("01 / 20");
  await telescope.click();
  await expect(page.locator(".curiosity-progress")).toContainText("01 / 20");
  await page.getByRole("button", { name: "Release a sky lantern", exact: true }).click();
  await expect(page.locator(".curiosity-response")).toContainText("First light");
  await expect(page.locator(".curiosity-progress")).toContainText("02 / 20");
  await expect(page.locator(".curiosity-response")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  await page.mouse.move(890, 450);
  await page.screenshot({ path: "test-results/playful-world-desktop.png" });
  await page.getByRole("button", { name: "The atlas", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".ufo-cursor")).toHaveCSS("opacity", "0");
  expect(errors).toEqual([]);
});

test("each island offers two distinct accessible discoveries", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  const chapters = page.getByRole("group", { name: "Journey chapters" }).getByRole("button");
  let found = 0;
  for (let stop = 0; stop < 10; stop++) {
    await chapters.nth(stop).click();
    await expect(page.locator(".chapter-counter b")).toHaveText(String(stop).padStart(2, "0"));
    for (let slot = 0; slot < 2; slot++) {
      const item = page.locator(`[data-curiosity="${stop}-${slot}"]`);
      await expect(item).toBeVisible();
      await item.click();
      await expect(page.locator(".curiosity-progress")).toContainText(String(++found).padStart(2, "0") + " / 20");
      await expect(page.locator(".curiosity-response")).toBeVisible();
      await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
    }
  }
});

test.describe("touch flight and melodic sound", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  test("swiping flies the UFO, plays melodic notes, and still navigates the world", async ({ page }) => {
    await page.addInitScript(() => {
      const audio = window.AudioContext;
      const original = audio.prototype.createOscillator;
      (window as Window & { flightNotes?: OscillatorNode[] }).flightNotes = [];
      audio.prototype.createOscillator = function () {
        const voice = original.call(this);
        (window as Window & { flightNotes?: OscillatorNode[] }).flightNotes!.push(voice);
        return voice;
      };
    });
    await page.goto("/");
    await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
    await page.getByRole("button", { name: "Enable ambient sound", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Mute sound", exact: true })).toHaveAttribute("aria-pressed", "true");
    const before = await page.evaluate(() => (window as Window & { flightNotes?: OscillatorNode[] }).flightNotes!.length);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 365, y: 630, id: 1 }] });
    for (let step = 1; step <= 12; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 365 - step * 28, y: 630 - step * 4, id: 1 }] });
    await expect(page.locator(".ufo-cursor")).toHaveAttribute("data-pointer", "touch");
    await expect(page.locator(".ufo-cursor")).toHaveCSS("opacity", "1");
    await expect.poll(() => page.evaluate(() => (window as Window & { flightNotes?: OscillatorNode[] }).flightNotes!.length)).toBeGreaterThan(before);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.locator(".chapter-counter b")).toHaveText("01");
    await expect(page.getByRole("button", { name: "Launch the workshop UFO", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Launch the workshop UFO", exact: true }).tap();
    await expect(page.locator(".curiosity-response")).toContainText("victory lap");
    await page.screenshot({ path: "test-results/playful-world-mobile.png" });
    await page.getByRole("button", { name: "Mute sound", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Enable ambient sound", exact: true })).toHaveAttribute("aria-pressed", "false");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
