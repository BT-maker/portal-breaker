class AudioManager {
  private ctx: AudioContext | null = null;
  private masterVolume: number = 0.5;
  private sfxVolume: number = 0.5;
  private musicVolume: number = 0.5;
  private bgMusicOscillators: OscillatorNode[] = [];
  private bgMusicGain: GainNode | null = null;
  private isPlayingBgMusic: boolean = false;
  private bgMusicInterval: number | null = null;

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
    this.sfxVolume = vol;
    this.musicVolume = vol;
    if (this.bgMusicGain) {
      this.bgMusicGain.gain.setValueAtTime(this.musicVolume * 0.15, this.ctx!.currentTime);
    }
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgMusicGain) {
      this.bgMusicGain.gain.setValueAtTime(vol * 0.15, this.ctx!.currentTime);
    }
  }

  setSFXVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, volMultiplier: number = 1) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.sfxVolume * volMultiplier, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Retro Atari style hit sound - short square wave beep
  playHit() {
    this.createOscillator('square', 800, 0.05, 0.25);
  }

  // Retro Atari style brick destroy - descending square wave
  playBrickDestroy() {
    this.createOscillator('square', 400, 0.08, 0.3);
    setTimeout(() => this.createOscillator('square', 200, 0.08, 0.3), 30);
  }

  // Retro Atari style power-up - ascending square wave sweep
  playPortal() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, this.ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Retro Atari style level complete - ascending arpeggio
  playLevelComplete() {
    if (!this.ctx) return;
    // C major arpeggio: C, E, G, C (octave higher)
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
      setTimeout(() => this.createOscillator('square', freq, 0.15, 0.35), i * 100);
    });
  }

  // Retro Atari style game over - descending tones
  playGameOver() {
    if (!this.ctx) return;
    [400, 300, 200, 100].forEach((freq, i) => {
      setTimeout(() => this.createOscillator('square', freq, 0.2, 0.4), i * 150);
    });
  }

  // Start background music - retro atari chiptune loop
  startBackgroundMusic() {
    if (!this.ctx || this.isPlayingBgMusic) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlayingBgMusic = true;
    this.bgMusicGain = this.ctx.createGain();
    this.bgMusicGain.gain.setValueAtTime(this.musicVolume * 0.15, this.ctx.currentTime);
    this.bgMusicGain.connect(this.ctx.destination);

    // Retro atari style chiptune melody
    // Simple 8-bit style loop with bass and melody
    let loopStartTime = this.ctx.currentTime;
    const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'square') => {
      if (!this.ctx || !this.bgMusicGain) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const noteStart = loopStartTime + startTime;
      const noteEnd = noteStart + duration;
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, noteStart);
      
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.3, noteStart + 0.01);
      gain.gain.linearRampToValueAtTime(0.3, noteEnd - 0.05);
      gain.gain.linearRampToValueAtTime(0, noteEnd);
      
      osc.connect(gain);
      gain.connect(this.bgMusicGain);
      
      osc.start(noteStart);
      osc.stop(noteEnd);
    };

    // Melody pattern - retro atari style
    const melody = [
      { freq: 523.25, time: 0, dur: 0.2 },    // C5
      { freq: 659.25, time: 0.2, dur: 0.2 },  // E5
      { freq: 783.99, time: 0.4, dur: 0.2 }, // G5
      { freq: 523.25, time: 0.6, dur: 0.2 }, // C5
      { freq: 659.25, time: 0.8, dur: 0.2 }, // E5
      { freq: 783.99, time: 1.0, dur: 0.4 }, // G5
      { freq: 659.25, time: 1.4, dur: 0.2 }, // E5
      { freq: 523.25, time: 1.6, dur: 0.4 }, // C5
    ];

    // Bass pattern
    const bass = [
      { freq: 130.81, time: 0, dur: 0.4 },    // C3
      { freq: 164.81, time: 0.4, dur: 0.4 }, // E3
      { freq: 196.00, time: 0.8, dur: 0.4 }, // G3
      { freq: 130.81, time: 1.2, dur: 0.8 }, // C3
    ];

    const playLoop = () => {
      if (!this.isPlayingBgMusic || !this.ctx || !this.bgMusicGain) return;
      
      loopStartTime = this.ctx.currentTime;
      
      // Play bass line
      bass.forEach(note => {
        playNote(note.freq, note.time, note.dur, 'square');
      });
      
      // Play melody
      melody.forEach(note => {
        playNote(note.freq, note.time, note.dur, 'square');
      });
      
      // Schedule next loop (2 seconds total)
      this.bgMusicInterval = window.setTimeout(playLoop, 2000);
    };

    playLoop();
  }

  // Stop background music
  stopBackgroundMusic() {
    this.isPlayingBgMusic = false;
    if (this.bgMusicInterval !== null) {
      clearTimeout(this.bgMusicInterval);
      this.bgMusicInterval = null;
    }
    if (this.bgMusicGain) {
      this.bgMusicGain.disconnect();
      this.bgMusicGain = null;
    }
    this.bgMusicOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    this.bgMusicOscillators = [];
  }
}

export const audioManager = new AudioManager();
