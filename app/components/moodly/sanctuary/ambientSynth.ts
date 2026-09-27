import type { SceneId } from '../lib/scenes';

/**
 * Generated ambience for each scene, built from filtered noise and a few
 * oscillators, so sound works without any audio files. Used when the scene's
 * recording isn't available.
 */

export interface AmbientVoice {
  /** fade to silence, then release everything */
  stop: (fadeMs: number) => void;
}

function noiseBuffer(ctx: AudioContext, seconds = 4) {
  // Brown-ish noise: soft and low, closer to wind and water than white noise.
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function noiseSource(ctx: AudioContext, buffer: AudioBuffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.start();
  return src;
}

/** A slow sine that swells a gain up and down around `base`. */
function lfo(ctx: AudioContext, target: AudioParam, rate: number, depth: number) {
  const osc = ctx.createOscillator();
  const amount = ctx.createGain();
  osc.frequency.value = rate;
  amount.gain.value = depth;
  osc.connect(amount).connect(target);
  osc.start();
  return osc;
}

/** Filtered noise: wind (lowpass), water (bandpass), waves (lowpass with a slow swell). */
function bed(ctx: AudioContext, out: AudioNode, buffer: AudioBuffer, type: BiquadFilterType, freq: number, level: number, swellRate: number, swellDepth: number) {
  const src = noiseSource(ctx, buffer);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = type === 'bandpass' ? 0.8 : 0.5;
  const gain = ctx.createGain();
  gain.gain.value = level;
  src.connect(filter).connect(gain).connect(out);
  const nodes: AudioScheduledSourceNode[] = [src, lfo(ctx, gain.gain, swellRate, swellDepth), lfo(ctx, filter.frequency, swellRate * 0.7, freq * 0.25)];
  return nodes;
}

/** Crickets: a high tone pulsed quickly, in slow on/off phrases. */
function crickets(ctx: AudioContext, out: AudioNode, freq: number, level: number) {
  const tone = ctx.createOscillator();
  tone.frequency.value = freq;
  const pulse = ctx.createGain();
  pulse.gain.value = 0;
  const phrase = ctx.createGain();
  phrase.gain.value = 0;
  const volume = ctx.createGain();
  volume.gain.value = level;
  tone.connect(pulse).connect(phrase).connect(volume).connect(out);

  const chirp = ctx.createOscillator();
  chirp.type = 'square';
  chirp.frequency.value = 28;
  const chirpDepth = ctx.createGain();
  chirpDepth.gain.value = 0.5;
  chirp.connect(chirpDepth).connect(pulse.gain);
  const offset = ctx.createConstantSource();
  offset.offset.value = 0.5;
  offset.connect(pulse.gain);

  const slow = ctx.createOscillator();
  slow.type = 'square';
  slow.frequency.value = 0.7 + Math.random() * 0.4;
  const slowDepth = ctx.createGain();
  slowDepth.gain.value = 0.5;
  slow.connect(slowDepth).connect(phrase.gain);
  const slowOffset = ctx.createConstantSource();
  slowOffset.offset.value = 0.5;
  slowOffset.connect(phrase.gain);

  const nodes = [tone, chirp, offset, slow, slowOffset];
  nodes.forEach((n) => n.start());
  return nodes;
}

/** Birds: short falling-then-rising whistles at random intervals. */
function birds(ctx: AudioContext, out: AudioNode, level: number, everyMs: [number, number]) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  const sing = () => {
    if (stopped) return;
    const notes = 2 + Math.floor(Math.random() * 4);
    const base = 2200 + Math.random() * 1600;
    let t = ctx.currentTime + 0.05;
    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const len = 0.08 + Math.random() * 0.1;
      osc.frequency.setValueAtTime(base * (1 + Math.random() * 0.25), t);
      osc.frequency.exponentialRampToValueAtTime(base * (0.7 + Math.random() * 0.5), t + len);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(level, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + len + 0.02);
      t += len + 0.04 + Math.random() * 0.08;
    }
    timer = setTimeout(sing, everyMs[0] + Math.random() * (everyMs[1] - everyMs[0]));
  };
  timer = setTimeout(sing, 1500);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

export function startAmbientSynth(ctx: AudioContext, scene: SceneId, volume: number, fadeMs: number): AmbientVoice {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(volume, ctx.currentTime + fadeMs / 1000);
  master.connect(ctx.destination);

  const buffer = noiseBuffer(ctx);
  const sources: AudioScheduledSourceNode[] = [];
  const cleanups: (() => void)[] = [];

  if (scene === 'dawn-lake') {
    sources.push(...bed(ctx, master, buffer, 'lowpass', 500, 0.105, 0.08, 0.03)); // soft air
    sources.push(...bed(ctx, master, buffer, 'bandpass', 900, 0.25, 0.3, 0.12)); // lapping water
    cleanups.push(birds(ctx, master, 0.05, [2500, 7000]));
  } else if (scene === 'day-meadow') {
    sources.push(...bed(ctx, master, buffer, 'lowpass', 800, 0.135, 0.12, 0.075)); // breeze
    cleanups.push(birds(ctx, master, 0.06, [1800, 5000]));
  } else if (scene === 'golden-shore') {
    sources.push(...bed(ctx, master, buffer, 'lowpass', 600, 0.165, 0.09, 0.135)); // slow waves
    sources.push(...bed(ctx, master, buffer, 'highpass', 2500, 0.06, 0.09, 0.05)); // foam hiss
  } else {
    sources.push(...bed(ctx, master, buffer, 'lowpass', 350, 0.12, 0.06, 0.06)); // night wind
    sources.push(...crickets(ctx, master, 4300, 0.018));
    sources.push(...crickets(ctx, master, 4700, 0.012));
  }

  return {
    stop: (ms) => {
      cleanups.forEach((c) => c());
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + ms / 1000);
      setTimeout(() => {
        sources.forEach((s) => {
          try {
            s.stop();
          } catch {
            /* already stopped */
          }
        });
        master.disconnect();
      }, ms + 50);
    },
  };
}
