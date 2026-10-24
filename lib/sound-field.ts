const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));

/** Bounded controls for a quiet, spatial cursor instrument. */
export function pointerSound(x: number, y: number, speed: number) {
  const pan = clamp(x, -1, 1) * .8;
  const height = (1 - clamp(y, -1, 1)) / 2;
  const movement = clamp(speed, 0, 1);
  const notes = [146.832, 174.614, 220, 261.626, 293.665];
  return {
    pan,
    cutoff: 400 + height * 1400 + movement * 350,
    frequency: notes[Math.min(notes.length - 1, Math.floor(height * notes.length))],
    gain: movement * .09,
  };
}
