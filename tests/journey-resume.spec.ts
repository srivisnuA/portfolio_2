import { test, expect, type Page } from "@playwright/test";

const play = (page: Page) => page.getByRole("button", { name: "Play cinematic journey", exact: true });
const pause = (page: Page) => page.getByRole("button", { name: "Pause cinematic journey", exact: true });

async function expectContinuing(page: Page) {
  await expect(pause(page)).toBeVisible();
  const before = await page.locator(".track-completed").getAttribute("style");
  await expect.poll(() => page.locator(".track-completed").getAttribute("style")).not.toBe(before);
}

test("project details resume the journey through Close, Return to landmark, Escape and browser Back", async ({ page }) => {
  await page.goto("/?project=facefare");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await expect(play(page)).toBeVisible();
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  await play(page).click();
  for (const method of ["close", "return", "escape", "back"]) {
    await page.getByRole("group", { name: "Journey chapters" }).getByRole("button", { name: "FaceFare", exact: true }).click();
    await expect(page.locator(".world-caption h1")).toHaveText("FaceFare");
    // The cinematic caption moves continuously during playback; click its
    // current position without waiting for the camera to become stationary.
    await page.getByRole("button", { name: "EXPLORE THIS PROJECT", exact: true }).click({ force: true });
    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    const frozen = await page.locator(".track-completed").getAttribute("style");
    await panel.getByRole("heading", { name: "FaceFare", exact: true }).hover();
    expect(await page.locator(".track-completed").getAttribute("style")).toBe(frozen);
    if (method === "close") await panel.getByRole("button", { name: "Close panel", exact: true }).click();
    else if (method === "return") await panel.getByRole("button", { name: "Return to landmark", exact: true }).click();
    else if (method === "escape") await page.keyboard.press("Escape");
    else await page.goBack();
    await expect(panel).toHaveCount(0);
    await expectContinuing(page);
  }
});

test("a playing journey resumes after nested atlas details and choosing an atlas destination", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  await play(page).click();
  await page.getByRole("button", { name: "The atlas", exact: true }).click();
  await page.getByRole("button", { name: "Read about the Arsenal", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".arsenal-skills > span")).toHaveCount(33);
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await expectContinuing(page);
  await page.getByRole("button", { name: "The atlas", exact: true }).click();
  await page.getByRole("button", { name: "The Arsenal Tech stack · Tools · Platforms", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectContinuing(page);
});

test("discoveries resume on dismissal or automatic close and respect a manually paused journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  await play(page).click();
  await page.getByRole("button", { name: "Align the telescope", exact: true }).click({ force: true });
  await expect(play(page)).toBeVisible();
  await page.getByRole("button", { name: "Dismiss discovery", exact: true }).click();
  await expectContinuing(page);
  await page.getByRole("button", { name: "Release a sky lantern", exact: true }).click({ force: true });
  await expect(play(page)).toBeVisible();
  await expect(page.locator(".curiosity-response")).toHaveCount(0, { timeout: 8000 });
  await expectContinuing(page);
  await pause(page).click();
  await page.getByRole("button", { name: "Align the telescope", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".curiosity-response")).toHaveCount(0);
  await expect(play(page)).toBeVisible();
});

test("top navigation follows the current island and keeps Signal Station visible on phones", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  const nav = page.getByRole("navigation", { name: "World navigation" });
  expect(await nav.getByRole("button").allTextContents()).toEqual(["The atlas", "Arsenal", "Signal Station", "The explorer"]);
  await nav.getByRole("button", { name: "Arsenal", exact: true }).click();
  await expect(nav.getByRole("button", { name: "Arsenal", exact: true })).toHaveAttribute("aria-current", "location");
  await expect(page.locator(".world-header")).toHaveAttribute("data-location", "arsenal");
  await expect.poll(async () => (await page.locator("[data-island-stops]").getAttribute("data-island-stops"))?.split(",")).toContain("1");
  await page.mouse.move(1160, 480);
  await page.screenshot({ path: "test-results/journey-navigation-desktop.png" });
  await nav.getByRole("button", { name: "Arsenal", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".arsenal-skills > span")).toHaveCount(33);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  const signal = nav.getByRole("button", { name: "Signal Station", exact: true });
  await expect(signal).toBeVisible();
  await signal.click();
  await expect(signal).toHaveAttribute("aria-current", "location");
  await expect(nav.getByRole("button", { name: "Arsenal", exact: true })).not.toHaveAttribute("aria-current", "location");
  await expect(page.locator(".world-header")).toHaveAttribute("data-location", "signal");
  const navBox = await nav.boundingBox();
  const brandBox = await page.locator(".world-brand").boundingBox();
  expect(navBox!.y).toBeGreaterThan(brandBox!.y + brandBox!.height);
  expect(navBox!.x + navBox!.width).toBeLessThanOrEqual(390);
  await expect.poll(async () => (await page.locator("[data-island-stops]").getAttribute("data-island-stops"))?.split(",")).toContain("9");
  await page.mouse.move(350, 540);
  await page.screenshot({ path: "test-results/journey-navigation-mobile.png" });
  await signal.click();
  await expect(page.getByRole("dialog").getByRole("link", { name: /srivisnu824@gmail.com/ })).toBeVisible();
});
