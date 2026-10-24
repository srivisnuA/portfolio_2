export type TravelState = {
  current: number;
  target: number;
  playing: boolean;
  paused: boolean;
  reduced: boolean;
  pointerX: number;
  pointerY: number;
};

export const ARSENAL_STOP = 1;
export const PROJECT_STOPS = [2, 3, 4, 5, 6, 7, 8] as const;
export const WORLD_STOPS = 10;
export const STOP_SPACING = 34;
export const LAST_STOP = WORLD_STOPS - 1;

// Chapter order is independent of the landmark's visual identity.
export function projectIndexForStop(stop: number): number | null {
  const index = PROJECT_STOPS.findIndex(value => value === stop);
  return index < 0 ? null : index;
}

export function stopForProjectIndex(index: number): number {
  return PROJECT_STOPS[index] ?? 0;
}

export function landmarkIndexForStop(stop: number): number {
  if (stop === ARSENAL_STOP) return 8;
  const project = projectIndexForStop(stop);
  return project === null ? stop : project + 1;
}

export function clampTravel(value: number) {
  return Math.max(0, Math.min(LAST_STOP, Number.isFinite(value) ? value : 0));
}

export function advanceTravel(state: TravelState, delta: number) {
  if (state.paused) return state.current;
  // Exponential damping stays stable across frame rates. Keep ordinary slow
  // frames intact so a busy GPU does not turn a short flight into a long wait.
  const dt = Math.min(Math.max(delta, 0), 0.25);
  if (state.playing) {
    state.target = clampTravel(state.target + dt * 0.12);
    if (state.target >= LAST_STOP) state.playing = false;
  }
  state.target = clampTravel(state.target);
  state.current = state.reduced
    ? state.target
    : state.current + (state.target - state.current) * (1 - Math.exp(-3.5 * dt));
  if (Math.abs(state.current - state.target) < 0.0001) state.current = state.target;
  return state.current;
}

export function nearestStop(progress: number) {
  return Math.round(clampTravel(progress));
}

export function stationPosition(index: number): [number, number, number] {
  return [index * STOP_SPACING + 5, Math.sin(index * 1.5) * 0.8, Math.sin(index * 1.1) * 4];
}

export function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let n = Math.imul(value ^ (value >>> 15), 1 | value);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
