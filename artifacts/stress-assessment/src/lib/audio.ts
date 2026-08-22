export class AmbientAudio {
  private ctx: AudioContext | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private isPlaying = false;

  public init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create brown noise buffer
    const bufferSize = this.ctx.sampleRate * 5; // 5 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for volume drop
    }

    this.noise = this.ctx.createBufferSource();
    this.noise.buffer = buffer;
    this.noise.loop = true;

    // Deep, muffled low-pass filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 150; 
    
    // Subtle LFO on the filter frequency to make it "breathe"
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05; // very slow, 20s cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    lfo.start();

    // Main volume control
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0; // start silent

    this.noise.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    
    this.noise.start();
  }

  public toggle() {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.gain) return false;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = !this.isPlaying;
    
    // Smooth fade in/out
    this.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    if (this.isPlaying) {
      this.gain.gain.setValueAtTime(this.gain.gain.value, this.ctx.currentTime);
      this.gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 2.0); // 2s fade in
    } else {
      this.gain.gain.setValueAtTime(this.gain.gain.value, this.ctx.currentTime);
      this.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0); // 1s fade out
    }
    
    return this.isPlaying;
  }
}

// Singleton instance
export const ambientAudio = new AmbientAudio();
