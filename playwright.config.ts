import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const windowsChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  ?? (process.platform === "win32" && existsSync(windowsChrome) ? windowsChrome : undefined);

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 90_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    launchOptions: { executablePath, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
    screenshot: "only-on-failure",
  },
});
