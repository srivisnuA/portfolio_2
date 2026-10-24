import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceTravel, ARSENAL_STOP, clampTravel, finishJourneyInterruption, interruptJourney, LAST_STOP, landmarkIndexForStop, nearestStop, projectIndexForStop, stationPosition, stopForProjectIndex } from "../lib/world.ts";
import { pointerSound } from "../lib/sound-field.ts";

test("travel is bounded and rejects non-finite input", () => {
  assert.equal(clampTravel(-1), 0);
  assert.equal(clampTravel(100), LAST_STOP);
  assert.equal(clampTravel(NaN), 0);
  assert.equal(nearestStop(2.6), 3);
});

test("damping reaches a destination without overshooting and pauses for field notes", () => {
  const state = { current: 0, target: 3, playing: false, paused: false, reduced: false, pointerX: 0, pointerY: 0 };
  for (let i = 0; i < 180; i++) {
    const before = state.current;
    advanceTravel(state, 1 / 60);
    assert.ok(state.current >= before && state.current <= 3);
  }
  assert.ok(Math.abs(state.current - 3) < .001);
  state.paused = true;
  state.playing = true;
  const frozen = state.current;
  advanceTravel(state, 1);
  assert.equal(state.current, frozen);
});

test("reduced motion jumps directly and playback stops at the final station", () => {
  const state = { current: 0, target: LAST_STOP - .001, playing: true, paused: false, reduced: true, pointerX: 0, pointerY: 0 };
  advanceTravel(state, 1);
  assert.equal(state.current, LAST_STOP);
  assert.equal(state.playing, false);
  assert.equal(stationPosition(1)[0] - stationPosition(0)[0], 34);
});

test("camera damping follows elapsed time even on a slow renderer", () => {
  const initial = { current: 0, target: 8, playing: false, paused: false, reduced: false, pointerX: 0, pointerY: 0 };
  const fast = { ...initial };
  const slow = { ...initial };
  for (let i = 0; i < 60; i++) advanceTravel(fast, 1 / 60);
  for (let i = 0; i < 5; i++) advanceTravel(slow, 1 / 5);
  assert.ok(Math.abs(fast.current - slow.current) < .000001);
});

test("Arsenal is the second island and every project keeps a distinct destination and model", () => {
  assert.equal(ARSENAL_STOP, 1);
  assert.equal(LAST_STOP, 9);
  assert.equal(projectIndexForStop(0), null);
  assert.equal(projectIndexForStop(ARSENAL_STOP), null);
  assert.equal(projectIndexForStop(LAST_STOP), null);
  assert.equal(landmarkIndexForStop(ARSENAL_STOP), 8);
  for (let index = 0; index < 7; index++) {
    const stop = stopForProjectIndex(index);
    assert.equal(stop, index + 2);
    assert.equal(projectIndexForStop(stop), index);
    assert.equal(landmarkIndexForStop(stop), index + 1);
  }
});

test("cursor sound follows position and speed within safe parameter bounds", () => {
  const left = pointerSound(-1, 1, 0);
  const right = pointerSound(1, -1, 1);
  assert.ok(left.pan < 0 && right.pan > 0);
  assert.ok(left.cutoff < right.cutoff && left.frequency < right.frequency);
  assert.equal(left.gain, 0);
  assert.ok(right.gain <= .09);
  for (const value of Object.values(pointerSound(Infinity, NaN, -100))) assert.ok(Number.isFinite(value));
});

test("closing details restores playing without starting a manually paused journey", () => {
  const state = { current: 2, target: 2, playing: true, paused: false, reduced: false, pointerX: 0, pointerY: 0 };
  const pending = { panel: false, curiosity: false, resume: false };
  interruptJourney(state, pending, "panel");
  assert.equal(state.paused, true);
  assert.equal(state.playing, false);
  assert.equal(finishJourneyInterruption(state, pending, "panel"), true);
  assert.equal(state.paused, false);
  assert.equal(finishJourneyInterruption(state, pending, "panel"), true);
  state.playing = false;
  interruptJourney(state, pending, "panel");
  assert.equal(finishJourneyInterruption(state, pending, "panel"), false);
});

test("nested discoveries preserve intent and reduced motion or manual control cancels resuming", () => {
  const state = { current: 1, target: 1, playing: true, paused: false, reduced: false, pointerX: 0, pointerY: 0 };
  const pending = { panel: false, curiosity: false, resume: false };
  interruptJourney(state, pending, "curiosity");
  assert.equal(state.paused, false); // the object can still animate
  interruptJourney(state, pending, "panel");
  assert.equal(finishJourneyInterruption(state, pending, "curiosity"), false);
  assert.equal(finishJourneyInterruption(state, pending, "panel"), true);
  interruptJourney(state, pending, "curiosity");
  pending.resume = false;
  assert.equal(finishJourneyInterruption(state, pending, "curiosity"), false);
  state.playing = true;
  interruptJourney(state, pending, "panel");
  state.reduced = true;
  assert.equal(finishJourneyInterruption(state, pending, "panel"), false);
});
