/* Tiny chiptune sound effects using WebAudio (no audio files needed) */
const Sfx = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('froggyfly_muted') === '1'; } catch (e) {}

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, type = 'square', vol = 0.06, slideTo = null, delay = 0) {
    if (muted || !ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }

  return {
    init,
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem('froggyfly_muted', muted ? '1' : '0'); } catch (e) {}
      return muted;
    },
    click() { tone(520, 0.06, 'square', 0.05); },
    flap()  { tone(380, 0.12, 'square', 0.05, 760); },
    score() { tone(660, 0.07, 'square', 0.06); tone(990, 0.12, 'square', 0.06, null, 0.07); },
    star()  { tone(880, 0.07, 'triangle', 0.1); tone(1320, 0.09, 'triangle', 0.1, null, 0.07); tone(1760, 0.14, 'triangle', 0.1, null, 0.14); },
    hit()   { tone(220, 0.25, 'sawtooth', 0.09, 60); },
    over()  { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'square', 0.07, null, i * 0.18)); },
    meet()  { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, null, i * 0.12)); },
    win()   { [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'square', 0.06, null, i * 0.13)); }
  };
})();
