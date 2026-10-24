export type RenderQuality = "compact" | "full";

/** Choose the initial GPU budget before any WebGL resources are created. */
export function initialRenderQuality(): RenderQuality {
  if (typeof window === "undefined") return "compact";
  const device = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const narrow = window.innerWidth < 760;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const limitedMemory = typeof device.deviceMemory === "number" && device.deviceMemory <= 4;
  const limitedCpu = device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4;
  const slowConnection = device.connection?.saveData || /(^2g$|slow-2g)/.test(device.connection?.effectiveType ?? "");
  return narrow || touch || limitedMemory || limitedCpu || slowConnection ? "compact" : "full";
}

export function islandWindow(center: number, lastStop: number): number[] {
  return [center - 1, center, center + 1].filter(index => index >= 0 && index <= lastStop);
}
