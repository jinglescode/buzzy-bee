/**
 * SoundManager - Synthesized audio for Buzzy Bee game
 *
 * All sounds are generated via Web Audio API oscillators and noise buffers.
 * No external audio files are loaded. AudioContext is created lazily and
 * must be unlocked by a user gesture (click/tap) via init().
 */

export class SoundManager {
  private ctx: AudioContext | null = null;
  private initialized: boolean = false;

  // Reusable noise buffer (1 second of white noise at sample rate)
  private noiseBuffer: AudioBuffer | null = null;

  /**
   * Must be called from a user gesture (click/tap) to unlock AudioContext.
   * Safe to call multiple times; only initializes once.
   */
  init(): void {
    if (this.initialized && this.ctx) {
      // If context was suspended (e.g. tab backgrounded), resume it
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();

      // Resume immediately in case the browser suspended it
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Pre-generate a white noise buffer (1 second)
      this.noiseBuffer = this.createNoiseBuffer(this.ctx.sampleRate);
      this.initialized = true;
    } catch {
      console.warn('SoundManager: Web Audio API not available');
    }
  }

  // ---------------------------------------------------------------------------
  // Flap - very short white noise burst (~50ms)
  // ---------------------------------------------------------------------------

  playFlap(): void {
    if (!this.ctx || !this.initialized || !this.noiseBuffer) return;
    this.ensureResumed();

    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    source.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);
    source.stop(now + 0.05);
  }

  // ---------------------------------------------------------------------------
  // Score chime - sine wave sweep 800 -> 1200 Hz over 0.1s
  // ---------------------------------------------------------------------------

  playChime(): void {
    if (!this.ctx || !this.initialized) return;
    this.ensureResumed();

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.1);

    const gain = this.ctx.createGain();
    // Attack: instant on
    gain.gain.setValueAtTime(0.4, now);
    // Sustain for 0.05s then release over 0.05s
    gain.gain.setValueAtTime(0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // ---------------------------------------------------------------------------
  // Death bonk - noise burst with lowpass filter sweep, ~0.2s
  // ---------------------------------------------------------------------------

  playBonk(): void {
    if (!this.ctx || !this.initialized || !this.noiseBuffer) return;
    this.ensureResumed();

    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    // Lowpass filter sweeping from 400 Hz down to 100 Hz
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    filter.Q.setValueAtTime(1, now);

    // Gain envelope: 0.2s decay
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);
    source.stop(now + 0.25);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {
        // Ignore close errors
      });
      this.ctx = null;
    }

    this.noiseBuffer = null;
    this.initialized = false;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Generates a 1-second AudioBuffer filled with white noise.
   */
  private createNoiseBuffer(sampleRate: number): AudioBuffer {
    const buffer = this.ctx!.createBuffer(1, sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleRate; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Ensures the AudioContext is in 'running' state.
   * Some browsers suspend contexts that weren't created during a user gesture.
   */
  private ensureResumed(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}
