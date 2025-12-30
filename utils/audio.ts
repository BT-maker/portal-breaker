class AudioManager {
  private ctx: AudioContext | null = null;
  private masterVolume: number = 0.5;

  constructor() {
    try {
      // Initialize on user interaction usually, but we set up the object
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    } catch (e) {
      console.error("Audio API not supported");
    }
  }

  setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, volMultiplier: number = 1) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.masterVolume * volMultiplier, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playHit() {
    this.createOscillator('square', 440, 0.1, 0.3);
  }

  playBrickDestroy() {
    this.createOscillator('sawtooth', 220, 0.2, 0.4);
    setTimeout(() => this.createOscillator('square', 110, 0.1, 0.4), 50);
  }

  playPortal() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.5, this.ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playLevelComplete() {
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.createOscillator('triangle', freq, 0.3, 0.4), i * 150);
    });
  }

  playGameOver() {
    if (!this.ctx) return;
     [300, 250, 200, 150].forEach((freq, i) => {
      setTimeout(() => this.createOscillator('sawtooth', freq, 0.4, 0.5), i * 200);
    });
  }
}

export const audioManager = new AudioManager();
