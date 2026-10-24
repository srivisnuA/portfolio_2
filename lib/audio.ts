import { pointerSound } from "./sound-field";

/**
 * An original, quietly synthesized space ambience. No recordings or network
 * assets are used. Call setEnabled(true) from a click/tap handler only.
 */
export class AmbientAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private panner: StereoPannerNode | null = null;
  private cursorVoice: OscillatorNode | null = null;
  private cursorGain: GainNode | null = null;
  private cursorTimer: ReturnType<typeof setTimeout> | null = null;
  private lastNote = -1;
  private lastNoteTime = -1;
  private nodes: AudioNode[] = [];
  private oscillators: OscillatorNode[] = [];
  private enabled = false;
  private disposed = false;
  private revision = 0;
  private listening = false;
  private static readonly volume = 0.27;

  private readonly handleVisibility = () => {
    // Muting instead of suspending avoids needing another autoplay permission
    // when the tab becomes visible. Visibility alone never creates/resumes audio.
    this.fadeTo(
      this.enabled && !document.hidden ? AmbientAudio.volume : 0,
      document.hidden ? 0.08 : 0.65,
    );
  };

  private fadeTo(value: number, timeConstant = 0.45) {
    if (!this.context || !this.master || this.context.state === "closed") return;
    const now = this.context.currentTime;
    const gain = this.master.gain;
    gain.cancelScheduledValues(now);
    gain.setTargetAtTime(value, now, timeConstant);
  }

  private initialize() {
    if (this.context) return;
    if (typeof window === "undefined") throw new Error("Audio requires a browser.");
    const AudioContextClass = window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is unavailable.");

    const context = new AudioContextClass();
    this.context = context;
    const master = context.createGain();
    master.gain.value = 0;
    this.master = master;

    const filter = context.createBiquadFilter();
    this.filter = filter;
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.Q.value = 0.3;
    const panner = context.createStereoPanner();
    this.panner = panner;
    filter.connect(panner);
    panner.connect(master);
    master.connect(context.destination);
    this.nodes.push(filter, panner, master);

    // A soft tempo echo gives notes space to overlap without harsh retriggers.
    const delay = context.createDelay(1);
    const echo = context.createGain();
    const echoTone = context.createBiquadFilter();
    delay.delayTime.value = .375;
    echo.gain.value = .24;
    echoTone.type = "lowpass";
    echoTone.frequency.value = 1700;
    panner.connect(delay);
    delay.connect(echoTone);
    echoTone.connect(echo);
    echo.connect(master);
    echo.connect(delay);
    this.nodes.push(delay, echo, echoTone);

    const cursor = context.createOscillator();
    const cursorGain = context.createGain();
    cursor.type = "sine";
    cursor.frequency.value = 220;
    cursorGain.gain.value = 0;
    cursor.connect(cursorGain);
    cursorGain.connect(filter);
    cursor.start();
    this.cursorVoice = cursor;
    this.cursorGain = cursorGain;
    this.oscillators.push(cursor);
    this.nodes.push(cursorGain);

    // D minor/add-nine, spread over two octaves. A pair of gently detuned sine
    // waves per note creates slow natural movement without sharp transients.
    const notes = [73.416, 110, 146.832, 164.814, 174.614];
    notes.forEach((frequency, index) => {
      for (const detune of [-1.6, 1.6]) {
        const oscillator = context.createOscillator();
        const voice = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.detune.value = detune;
        voice.gain.value = index === 0 ? 0.035 : 0.022;
        oscillator.connect(voice);
        voice.connect(filter);
        oscillator.start();
        this.oscillators.push(oscillator);
        this.nodes.push(voice);
      }
    });

    const drift = context.createOscillator();
    const driftDepth = context.createGain();
    drift.type = "sine";
    drift.frequency.value = 0.035;
    driftDepth.gain.value = 90;
    drift.connect(driftDepth);
    driftDepth.connect(filter.frequency);
    drift.start();
    this.oscillators.push(drift);
    this.nodes.push(driftDepth);

    document.addEventListener("visibilitychange", this.handleVisibility);
    this.listening = true;
  }

  /** Movement never creates or resumes an audio context. */
  updatePointer(x: number, y: number, speed: number): void {
    const context = this.context;
    if (!this.enabled || this.disposed || !context || context.state !== "running" || document.hidden) return;
    const field = pointerSound(x, y, speed);
    const now = context.currentTime;
    this.panner?.pan.setTargetAtTime(field.pan, now, .16);
    this.filter?.frequency.setTargetAtTime(field.cutoff, now, .22);
    this.cursorVoice?.frequency.setTargetAtTime(field.frequency / 2, now, .2);
    this.cursorGain?.gain.setTargetAtTime(field.gain * .45, now, .15);
    if (speed > .035 && now - this.lastNoteTime > .18 && (field.note !== this.lastNote || now - this.lastNoteTime > .52)) {
      this.playTone(field.frequency, .06 + Math.min(1, speed) * .055, now);
      this.lastNote = field.note;
      this.lastNoteTime = now;
    }
    if (this.cursorTimer) clearTimeout(this.cursorTimer);
    this.cursorTimer = setTimeout(() => {
      if (this.context?.state === "running") this.cursorGain?.gain.setTargetAtTime(0, this.context.currentTime, .42);
    }, 240);
  }

  releasePointer(): void {
    if (!this.context || this.context.state !== "running") return;
    this.cursorGain?.gain.setTargetAtTime(0, this.context.currentTime, .38);
  }

  private playTone(frequency: number, volume: number, start: number) {
    const context = this.context;
    if (!context || !this.filter) return;
    const voice = context.createOscillator();
    const envelope = context.createGain();
    voice.type = "sine";
    voice.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + .035);
    envelope.gain.setTargetAtTime(.0001, start + .07, .32);
    voice.connect(envelope);
    envelope.connect(this.filter);
    this.oscillators.push(voice);
    voice.onended = () => {
      voice.disconnect(); envelope.disconnect();
      const at = this.oscillators.indexOf(voice);
      if (at !== -1) this.oscillators.splice(at, 1);
    };
    voice.start(start);
    voice.stop(start + 1.65);
  }

  /** Returns whether sound is enabled; silence is the safe failure state. */
  async setEnabled(enabled: boolean): Promise<boolean> {
    if (this.disposed) return false;
    const revision = ++this.revision;
    if (!enabled) {
      this.enabled = false;
      this.fadeTo(0, 0.16);
      return false;
    }

    try {
      this.initialize();
      const context = this.context;
      if (!context || context.state === "closed") return false;
      // This method is the only path that can create or resume the context.
      if (context.state !== "running") await context.resume();
      if (this.disposed || revision !== this.revision) return this.enabled;
      this.enabled = context.state === "running";
      this.fadeTo(this.enabled && !document.hidden ? AmbientAudio.volume : 0, 0.65);
      return this.enabled;
    } catch {
      if (revision === this.revision) {
        this.enabled = false;
        this.fadeTo(0, 0.05);
      }
      return false;
    }
  }

  /** A small, soft two-note chime for an explicit project selection. */
  playSelect(variation = 0): void {
    const context = this.context;
    const master = this.master;
    if (!this.enabled || this.disposed || !context || !master ||
        context.state !== "running" || document.hidden) return;

    const scales = [[293.665, 440, 587.33], [349.228, 523.251, 698.456], [391.995, 587.33, 783.991]];
    scales[Math.abs(variation) % scales.length].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = context.currentTime + index * 0.11;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.055, start + 0.025);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.75);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        const at = this.oscillators.indexOf(oscillator);
        if (at !== -1) this.oscillators.splice(at, 1);
      };
      this.oscillators.push(oscillator);
      oscillator.start(start);
      oscillator.stop(start + 0.8);
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.enabled = false;
    ++this.revision;
    if (this.cursorTimer) clearTimeout(this.cursorTimer);
    if (this.listening && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibility);
      this.listening = false;
    }
    if (this.master && this.context?.state !== "closed") {
      this.master.gain.cancelScheduledValues(this.context?.currentTime ?? 0);
      this.master.gain.value = 0;
    }
    for (const oscillator of this.oscillators) {
      oscillator.onended = null;
      try { oscillator.stop(); } catch { /* A completed chime is already stopped. */ }
      oscillator.disconnect();
    }
    this.oscillators = [];
    this.nodes.forEach((node) => node.disconnect());
    this.nodes = [];
    const context = this.context;
    this.context = null;
    this.master = null;
    this.filter = null;
    this.panner = null;
    this.cursorGain = null;
    this.cursorVoice = null;
    if (context && context.state !== "closed") void context.close().catch(() => {});
  }
}
