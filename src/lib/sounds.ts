/** Lightweight Kahoot-style sounds via Web Audio (no asset files). */

class SoundEngine {
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.12,
    when = 0
  ) {
    const ctx = this.ensure();
    if (!ctx) return;

    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  scoreTick() {
    this.tone(920 + Math.random() * 80, 0.04, "square", 0.06);
  }

  countdownBeep() {
    this.tone(440, 0.12, "triangle", 0.15);
  }

  countdownGo() {
    this.tone(660, 0.08, "square", 0.12);
    this.tone(880, 0.15, "square", 0.1, 0.08);
  }

  leaderboardIntro() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, "sine", 0.1, i * 0.07));
  }

  rowReveal() {
    this.tone(600, 0.06, "triangle", 0.08);
  }

  fanfare() {
    const notes = [523, 659, 784, 988, 1175, 988, 1175, 1319];
    notes.forEach((f, i) => this.tone(f, 0.18, "sine", 0.11, i * 0.1));
    this.tone(1568, 0.4, "sine", 0.14, 0.85);
  }

  winnerCheer() {
    for (let i = 0; i < 6; i++) {
      this.tone(400 + i * 120, 0.08, "square", 0.05, i * 0.05);
    }
  }
}

export const sounds = new SoundEngine();
