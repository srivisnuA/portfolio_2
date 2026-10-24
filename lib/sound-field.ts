const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));

/** Bounded controls for a quiet, spatial cursor instrument. */
export function pointerSound(x: number, y: number, speed: number) {
  const pan = clamp(x, -1, 1) * .8;
  const height = (1 - clamp(y, -1, 1)) / 2;
  const movement = clamp(speed, 0, 1);
  // D minor pentatonic: every position lands on a note that belongs to the score.
  const notes = [293.665, 349.228, 391.995, 440, 523.251, 587.33, 698.456, 783.991, 880];
  const note = Math.min(notes.length - 1, Math.floor(height * (notes.length - 2) + (clamp(x, -1, 1) + 1)));
  return {
    pan,
    cutoff: 650 + height * 1800 + movement * 550,
    frequency: notes[note],
    note,
    gain: Math.sqrt(movement) * .075,
  };
}
