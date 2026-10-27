/**
 * Kozminski Escape: Polowanie na ECTS
 * js/audio.js - Moduł syntezy dźwięków (Web Audio API)
 * Akademia Leona Koźmińskiego w Warszawie
 */

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resumeContext() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Dźwięk zebrania punktu ECTS (melodyjny brzęk zaliczenia)
   */
  playCollectEcts() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

    osc2.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.15); // E6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  /**
   * Dźwięk wypicia kawy (odnowienie staminy)
   */
  playDrinkCoffee() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.08);
    osc.frequency.linearRampToValueAtTime(880, now + 0.16);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Dźwięk aury Lwa Koźmińskiego (nietykalność)
   */
  playLionRoar() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.45);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Dźwięk uderzenia artylerii akademickiej (gwizd pocisku + potężny wybuch i basowy huk)
   */
  playArtilleryStrike() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // 1. Gwizd pocisku spadającego z góry (whistle / descending pitch)
    const whistleOsc = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    whistleOsc.type = 'sawtooth';
    whistleOsc.frequency.setValueAtTime(1400, now);
    whistleOsc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

    whistleGain.gain.setValueAtTime(0.09, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.22, now + 0.32);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    whistleOsc.connect(whistleGain);
    whistleGain.connect(ctx.destination);
    whistleOsc.start(now);
    whistleOsc.stop(now + 0.36);

    // 2. Eksplozja basowa (deep impact boom)
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'triangle';
    boomOsc.frequency.setValueAtTime(200, now + 0.35);
    boomOsc.frequency.exponentialRampToValueAtTime(32, now + 0.95);

    boomGain.gain.setValueAtTime(0.35, now + 0.35);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    boomOsc.connect(boomGain);
    boomGain.connect(ctx.destination);
    boomOsc.start(now + 0.35);
    boomOsc.stop(now + 1.05);

    // 3. Chrupiący szum uderzenia
    const noiseOsc = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    noiseOsc.type = 'square';
    noiseOsc.frequency.setValueAtTime(90, now + 0.35);
    noiseOsc.frequency.linearRampToValueAtTime(20, now + 0.7);

    noiseGain.gain.setValueAtTime(0.18, now + 0.35);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    noiseOsc.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseOsc.start(now + 0.35);
    noiseOsc.stop(now + 0.8);
  }

  /**
   * Dźwięk okrzyku profesora / alarmu egzaminacyjnego
   */
  playProfessorAlert() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(185, now + 0.08);
    osc.frequency.setValueAtTime(246, now + 0.16);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Fanfara zwycięstwa - Zaliczony Semestr
   */
  playVictory() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C4, E4, G4, C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const noteTime = now + idx * 0.1;
      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  }

  /**
   * Dźwięk porażki - Kampania Wrześniowa
   */
  playGameOver() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const notes = [311.13, 293.66, 277.18, 261.63, 196.0]; // Eb4, D4, Db4, C4, G3

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const noteTime = now + idx * 0.18;
      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }
}

// Globalna instancja dostępna dla gry
window.soundManager = new SoundManager();
