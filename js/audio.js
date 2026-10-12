/**
 * audio.js - Web Audio API Procedural Sound Generator
 * Generates retro arcade sounds synthetically without needing external audio files.
 * Fully compatible offline and works across modern browsers.
 */

class SoundController {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.initialized = false;
    }

    /**
     * Initializes the AudioContext on first user interaction to comply with browser autoplay policies.
     */
    init() {
        if (this.initialized && this.ctx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        } catch (e) {
            console.warn("Web Audio API not supported:", e);
        }
    }

    /**
     * Resumes AudioContext if suspended.
     */
    ensureContext() {
        if (!this.ctx) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Toggles mute state.
     * @returns {boolean} current mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * Sets mute state explicitly.
     * @param {boolean} muted 
     */
    setMuted(muted) {
        this.isMuted = Boolean(muted);
    }

    /**
     * Procedural Sound: Whack / Bonk (Standard Mole)
     * Combines an oscillator thump with a cartoon pitch drop.
     */
    playWhack() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Punch oscillator (impact)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);

        // Cute squeak overtone
        const squeak = this.ctx.createOscillator();
        const squeakGain = this.ctx.createGain();
        squeak.type = 'sine';
        squeak.frequency.setValueAtTime(650, now);
        squeak.frequency.linearRampToValueAtTime(980, now + 0.08);

        squeakGain.gain.setValueAtTime(0.2, now);
        squeakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        squeak.connect(squeakGain);
        squeakGain.connect(this.ctx.destination);

        squeak.start(now);
        squeak.stop(now + 0.1);
    }

    /**
     * Procedural Sound: Golden Mole Whack (Bonus Sparkle)
     * High pitched shiny coin chime.
     */
    playGoldenWhack() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const notes = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.04;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.25);
        });
    }

    /**
     * Procedural Sound: Bomb / Hazard Mole Whack
     * Low buzz explosion.
     */
    playBombWhack() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * Procedural Sound: Mole Pop Up
     * Soft rising boing.
     */
    playPop() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * Procedural Sound: Miss / Empty Hole Click
     * Dull air swish / wood thud.
     */
    playMiss() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * Procedural Sound: Combo Multiplier Achieved
     */
    playCombo(comboCount) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const baseFreq = Math.min(300 + comboCount * 60, 900);
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Procedural Sound: Timer Warning Tick
     */
    playTick() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Procedural Sound: UI Button Click
     */
    playClick() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    /**
     * Procedural Sound: Game Over Fanfare
     */
    playGameOver(isNewHighScore = false) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const melody = isNewHighScore
            ? [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (Celebratory fanfare)
            : [440, 392, 349.23, 293.66];        // A4, G4, F4, D4 (Descending classic game over)

        melody.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.14;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = isNewHighScore ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.3);
        });
    }
}

// Export instance to window
window.soundController = new SoundController();
