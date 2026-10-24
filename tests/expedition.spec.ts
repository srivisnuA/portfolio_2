import { test, expect, type Page } from "@playwright/test";

async function waitForDestination(page: Page, chapter: number) {
  await expect(page.locator(".chapter-counter b")).toHaveText(String(chapter).padStart(2, "0"));
  await expect.poll(async () => Number(await page.locator(".world-caption").evaluate(el => (el as HTMLElement).style.opacity))).toBeGreaterThan(.95);
}

test("the world renders and wheel, chapter, drag, and playback move the camera without document scrolling", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  await page.screenshot({ path: "test-results/atlas-arrival.png" });
  await page.getByRole("button", { name: "BEGIN THE EXPEDITION", exact: true }).click();
  await waitForDestination(page, 1);
  await expect(page.locator(".world-caption h1")).toHaveText(/The\s*Arsenal\./);
  await page.screenshot({ path: "test-results/atlas-arsenal.png" });
  expect(await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))).toEqual({ x: 0, y: 0 });

  await page.mouse.move(850, 450);
  for (let i = 0; i < 7; i++) await page.mouse.wheel(0, 180);
  await waitForDestination(page, 2);
  await expect(page.locator(".world-caption h1")).toHaveText("FaceFare");
  await page.getByRole("button", { name: "ChestXpert", exact: true }).click();
  await waitForDestination(page, 4);
  await page.mouse.move(1100, 620);
  await page.mouse.down();
  await page.mouse.move(430, 620, { steps: 12 });
  await page.mouse.up();
  await waitForDestination(page, 5);
  await page.screenshot({ path: "test-results/atlas-midjourney.png" });
  await page.getByRole("button", { name: "Play cinematic journey" }).click();
  await expect(page.getByRole("button", { name: "Pause cinematic journey" })).toBeVisible();
  const before = await page.locator(".world-coordinates").textContent();
  await expect.poll(() => page.locator(".world-coordinates").textContent()).not.toBe(before);
  await page.getByRole("button", { name: "Pause cinematic journey" }).click();
  await page.keyboard.press("Home");
  await waitForDestination(page, 0);
  await page.keyboard.press("ArrowRight");
  await waitForDestination(page, 1);
  expect(errors).toEqual([]);
});

test("project field notes pause the world and support Escape, browser Back, and direct URLs", async ({ page }) => {
  await page.goto("/?project=facefare");
  const panel = page.getByRole("dialog");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "FaceFare", exact: true })).toBeVisible();
  await expect(panel.getByRole("link", { name: /Source code/ })).toHaveAttribute("href", "https://github.com/srivisnuA/FaceFare");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(page).not.toHaveURL(/project=/);
  await waitForDestination(page, 2);
  await expect(page.locator(".world-caption h1")).toHaveText("FaceFare");
  await page.getByRole("button", { name: "The atlas", exact: true }).click();
  await page.getByRole("button", { name: "Read about SalesPilot AI", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "SalesPilot AI", exact: true })).toBeVisible();
  const frozen = await page.locator(".world-coordinates").textContent();
  await page.getByRole("dialog").hover();
  await page.mouse.wheel(0, 600);
  expect(await page.locator(".world-coordinates").textContent()).toBe(frozen);
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mobile navigation, reduced motion, downloads, and contact remain usable", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".expedition")).toHaveClass(/reduced-motion/);
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  await page.screenshot({ path: "test-results/atlas-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Contact", exact: true }).click();
  await waitForDestination(page, 9);
  await page.getByRole("button", { name: "LET’S FIND OUT", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("link", { name: /srivisnu824@gmail.com/ })).toHaveAttribute("href", "mailto:srivisnu824@gmail.com");
  await page.screenshot({ path: "test-results/atlas-contact-mobile.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "The atlas", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Historical Stock Analysis & Prediction Data Analytics / Predictive Modeling", exact: true }).click();
  await waitForDestination(page, 7);
  for (const resume of ["software-engineering", "ai-ml", "data-analytics"]) {
    const response = await request.get("/resumes/" + resume + ".pdf");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  }
});

test("every destination renders, Arsenal includes the original stack, and text is readable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
  const names = ["Arrival", "Arsenal", "FaceFare", "SalesPilot AI", "ChestXpert", "Refueling Safety & Fraud Detection", "Customer Behavior & Segmentation", "Historical Stock Analysis & Prediction", "ISRO OHRC Image Enhancement", "Contact"];
  const chapters = page.getByRole("group", { name: "Journey chapters" });
  for (const [index, name] of names.entries()) {
    await chapters.getByRole("button", { name, exact: true }).click();
    await waitForDestination(page, index);
    await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready");
    await expect.poll(async () => (await page.locator("[data-island-stops]").getAttribute("data-island-stops"))?.split(",")).toContain(String(index));
    await expect(page.locator(".world-canvas canvas")).toBeVisible();
    await expect(page.locator(".world-caption h1")).not.toBeEmpty();
    if ([1, 3, 4, 7, 8].includes(index)) await page.screenshot({ path: "test-results/island-" + index + ".png" });
  }
  await chapters.getByRole("button", { name: "Arsenal", exact: true }).click();
  await waitForDestination(page, 1);
  await page.getByRole("button", { name: "EXPLORE MY TECH STACK", exact: true }).click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("heading", { name: "Software Engineering", exact: true })).toBeVisible();
  for (const item of ["Python", "Unix Shell Scripting", "Power BI", "Scikit-learn", "PostgreSQL", "VS Code"]) await expect(panel.locator(".arsenal-skills")).toContainText([item]);
  expect(await panel.locator(".arsenal-skills > span").count()).toBe(33);
  await page.screenshot({ path: "test-results/arsenal-panel.png" });
  await page.keyboard.press("Escape");
  for (const selector of [".caption-lede", ".world-header nav button", ".world-cta span"]) {
    const size = await page.locator(selector).first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(12);
  }
  expect(errors).toEqual([]);
});

test("sound stays optional and pans with cursor position after activation", async ({ page }) => {
  await page.addInitScript(() => {
    const context = window.AudioContext;
    const createPanner = context.prototype.createStereoPanner;
    context.prototype.createStereoPanner = function () {
      const panner = createPanner.call(this);
      (window as Window & { cursorPanner?: StereoPannerNode }).cursorPanner = panner;
      return panner;
    };
  });
  await page.goto("/");
  await page.mouse.move(200, 400);
  expect(await page.evaluate(() => !!(window as Window & { cursorPanner?: StereoPannerNode }).cursorPanner)).toBe(false);
  await page.getByRole("button", { name: "Enable ambient sound", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mute sound", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(120, 400, { steps: 4 });
  await expect.poll(() => page.evaluate(() => (window as Window & { cursorPanner?: StereoPannerNode }).cursorPanner?.pan.value ?? 0)).toBeLessThan(-.3);
  await page.mouse.move(1300, 300, { steps: 8 });
  await expect.poll(() => page.evaluate(() => (window as Window & { cursorPanner?: StereoPannerNode }).cursorPanner?.pan.value ?? 0)).toBeGreaterThan(.3);
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enable ambient sound", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("without WebGL the atlas and project content remain accessible", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).includes("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "fallback");
  await page.getByRole("group", { name: "Journey chapters" }).getByRole("button", { name: "Arsenal", exact: true }).click();
  await waitForDestination(page, 1);
  await page.getByRole("button", { name: "EXPLORE MY TECH STACK", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".arsenal-skills > span")).toHaveCount(33);
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.getByRole("button", { name: "The atlas", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Choose your/ })).toBeVisible();
  await page.getByRole("button", { name: "Read about Customer Behavior & Segmentation", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Customer Behavior & Segmentation", exact: true })).toBeVisible();
});

test.describe("phone startup and touch interaction", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  });

  test("the portfolio is usable while secondary scene scripts are still downloading", async ({ page }) => {
    const initialScripts = new Set<string>();
    const delayedScripts: string[] = [];
    let releaseScripts = () => {};
    let released = false;
    const sceneDownload = new Promise<void>(resolve => { releaseScripts = resolve; });
    await page.route("**/*", async route => {
      const request = route.request();
      if (request.resourceType() === "document") {
        const response = await route.fetch();
        const html = await response.text();
        for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) initialScripts.add(new URL(match[1], request.url()).href);
        await route.fulfill({ response, body: html });
        return;
      }
      if (request.resourceType() === "script" && !initialScripts.has(request.url()) && !released) {
        delayedScripts.push(request.url());
        await sceneDownload;
      }
      await route.continue();
    });

    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".world-caption h1")).toContainText("Curiosity,");
      await expect.poll(() => delayedScripts.length).toBeGreaterThan(0);
      await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "loading");
      await expect(page.locator(".world-poster")).toBeVisible();
      await page.getByRole("button", { name: "BEGIN THE EXPEDITION", exact: true }).tap();
      await waitForDestination(page, 1);
      await page.getByRole("button", { name: "EXPLORE MY TECH STACK", exact: true }).tap();
      await expect(page.getByRole("dialog").locator(".arsenal-skills > span")).toHaveCount(33);
      await page.getByRole("button", { name: "Close panel", exact: true }).tap();
      await page.screenshot({ path: "test-results/mobile-before-3d.png" });
      await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "loading");
    } finally {
      released = true;
      releaseScripts();
    }
    await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready", { timeout: 25_000 });
    await waitForDestination(page, 1);
    await expect(page.locator(".world-caption h1")).toHaveText(/The\s*Arsenal\./);
  });

  test("full-motion 3D starts on a constrained phone profile and accepts real touch swipes", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 80,
      downloadThroughput: 1_500_000 / 8,
      uploadThroughput: 750_000 / 8,
      connectionType: "cellular4g",
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const started = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".world-caption h1")).toContainText("Curiosity,");
    const readableAfterMs = Date.now() - started;
    await expect(page.locator(".world-canvas")).toHaveAttribute("data-state", "ready", { timeout: 25_000 });
    const readyAfterMs = Date.now() - started;
    const metrics = { readableAfterMs, readyAfterMs, cpuSlowdown: 4, networkMbps: 1.5 };
    await test.info().attach("mobile-startup", { body: JSON.stringify(metrics), contentType: "application/json" });
    console.info("Constrained phone startup:", JSON.stringify(metrics));
    expect(readyAfterMs).toBeLessThan(25_000);
    await expect(page.locator(".expedition")).not.toHaveClass(/reduced-motion/);
    const renderer = page.locator(".world-canvas [data-render-quality]");
    await expect(renderer).toHaveAttribute("data-render-quality", "compact");
    expect(Number(await renderer.getAttribute("data-mounted-islands"))).toBeGreaterThan(0);
    expect(Number(await renderer.getAttribute("data-mounted-islands"))).toBeLessThanOrEqual(3);
    const dimensions = await page.locator(".world-canvas canvas").evaluate(el => ({
      bufferWidth: (el as HTMLCanvasElement).width,
      screenWidth: window.innerWidth,
      deviceRatio: window.devicePixelRatio,
    }));
    expect(dimensions.deviceRatio).toBe(2);
    expect(dimensions.bufferWidth).toBeLessThanOrEqual(dimensions.screenWidth + 1);
    await page.getByRole("button", { name: "BEGIN THE EXPEDITION", exact: true }).tap();
    await waitForDestination(page, 1);
    await page.screenshot({ path: "test-results/mobile-arsenal-full-motion.png" });

    // Native touch input verifies the real pointer path, rather than dispatching synthetic DOM events.
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 370, y: 620, id: 1 }] });
    for (let step = 1; step <= 10; step++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 370 - step * 35, y: 620, id: 1 }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await waitForDestination(page, 2);
    await expect(page.locator(".world-caption h1")).toHaveText("FaceFare");
    await expect.poll(async () => (await renderer.getAttribute("data-island-stops"))?.split(",")).toContain("2");
    expect(Number(await renderer.getAttribute("data-mounted-islands"))).toBeLessThanOrEqual(3);
    expect(await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))).toEqual({ x: 0, y: 0 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("button", { name: "EXPLORE THIS PROJECT", exact: true }).tap();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "FaceFare", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
