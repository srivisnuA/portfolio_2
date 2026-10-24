export type CuriosityKind = "telescope" | "lantern" | "reactor" | "drone" | "gate" | "scanner" | "satellite" | "garden";
export type Curiosity = {
  id: string;
  stop: number;
  kind: CuriosityKind;
  at: [number, number, number];
  title: string;
  action: string;
  response: string;
};
export type WorldActivity = { id: string; stop: number; started: number; serial: number };

const toys: [CuriosityKind, string, string, string][][] = [
  [["telescope", "Stargazer", "Align the telescope", "A new constellation comes into view."], ["lantern", "First light", "Release a sky lantern", "A little light, off to find its own horizon."]],
  [["reactor", "The idea engine", "Power up the idea engine", "The workshop is awake. Watch its energy bloom."], ["drone", "Workshop companion", "Launch the workshop UFO", "Your tiny co-pilot is taking a victory lap."]],
  [["gate", "Boarding portal", "Open the boarding portal", "Portal open. The next journey is ready to begin."], ["drone", "Fare courier", "Launch the fare courier", "One little courier, one very scenic route."]],
  [["reactor", "Signal processor", "Activate the signal processor", "A spark becomes a stream of possibilities."], ["lantern", "Idea balloon", "Release an idea balloon", "A good idea deserves a little lift."]],
  [["scanner", "Discovery scanner", "Run the discovery scanner", "A gentle sweep through the research lab."], ["garden", "Living data", "Wake the living data garden", "Patterns bloom from a cloud of points."]],
  [["scanner", "Safety beacon", "Sweep the safety beacon", "A clear path through the little roadside station."], ["drone", "Watchful companion", "Launch the inspection UFO", "The station has a new pair of eyes in the sky."]],
  [["garden", "Cluster garden", "Rearrange the cluster garden", "Different little worlds. A pattern connects them."], ["lantern", "Firefly lantern", "Release the firefly lantern", "Follow the fireflies through the data garden."]],
  [["reactor", "Market pulse", "Pulse the market sculpture", "A playful ripple across the historical observatory."], ["telescope", "Long view", "Look through the market telescope", "Step back. Find a different perspective."]],
  [["satellite", "Lunar relay", "Align the lunar satellite", "The moon has a message for the stars."], ["gate", "Lunar jump gate", "Open the lunar jump gate", "A small portal to a rather large universe."]],
  [["satellite", "Hello, universe", "Send a signal to the stars", "Hello, universe. There is more to build."], ["lantern", "Until next time", "Release the farewell lantern", "Every ending leaves a light for the next beginning."]],
];

export const curiosities: Curiosity[] = toys.flatMap((pair, stop) => pair.map(([kind, title, action, response], slot) => ({
  id: `${stop}-${slot}`,
  stop, kind, title, action, response,
  at: slot === 0 ? [-4.8, .25, 3.1] : [3.5, .25, 4.1],
})));
