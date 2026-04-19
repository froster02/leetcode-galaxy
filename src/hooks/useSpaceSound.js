// Web Audio synthesized sounds — Interstellar organ drone + Hail Mary crystalline arps
// No external files. All sounds procedurally generated.

let ctx = null;
function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

// ── Persistent city ambient (Interstellar organ) ────────────────────────────
// Held references so we can fade out cleanly on unmount
let ambientNodes = null;

export function startCityAmbient() {
    if (ambientNodes) return; // already running
    try {
        const ac = getCtx();

        const master = ac.createGain();
        master.gain.setValueAtTime(0, ac.currentTime);
        master.gain.linearRampToValueAtTime(0.11, ac.currentTime + 4); // slow swell in
        master.connect(ac.destination);

        // Low-pass filter for that muffled pipe-organ warmth
        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 520;
        filter.Q.value = 0.7;
        filter.connect(master);

        // Pipe organ layers: D1 + A1 + D2 + F#2 + A2 (Dmaj open chord)
        const PIPES = [
            { f: 36.71,  t: 'sine',     gain: 1.0  }, // D1 — sub bass
            { f: 55.00,  t: 'sine',     gain: 0.7  }, // A1
            { f: 73.42,  t: 'sine',     gain: 0.55 }, // D2
            { f: 92.50,  t: 'triangle', gain: 0.35 }, // F#2 — maj 3rd colour
            { f: 110.00, t: 'triangle', gain: 0.28 }, // A2
            { f: 146.83, t: 'sine',     gain: 0.18 }, // D3 — upper pipe
        ];

        const oscs = PIPES.map(({ f, t, gain: gv }) => {
            const g = ac.createGain();
            g.gain.value = gv;
            g.connect(filter);
            const o = ac.createOscillator();
            o.type = t;
            o.frequency.value = f;
            // Tiny random detune per pipe for organic beating
            o.detune.value = (Math.random() - 0.5) * 6;
            o.connect(g);
            o.start();
            return o;
        });

        // Slow LFO on filter cutoff — breathes like bellows
        const lfoFilter = ac.createOscillator();
        const lfoFilterGain = ac.createGain();
        lfoFilter.frequency.value = 0.07; // ~1 cycle per 14s
        lfoFilterGain.gain.value = 140;
        lfoFilter.connect(lfoFilterGain);
        lfoFilterGain.connect(filter.frequency);
        lfoFilter.start();

        // Slow volume LFO — gentle swell like a pipe organ sustain pedal
        const lfoVol = ac.createOscillator();
        const lfoVolGain = ac.createGain();
        lfoVol.frequency.value = 0.12;
        lfoVolGain.gain.value = 0.025;
        lfoVol.connect(lfoVolGain);
        lfoVolGain.connect(master.gain);
        lfoVol.start();

        // Long delay echo for cathedral reverb feel (two comb filters)
        [0.38, 0.52].forEach(delayTime => {
            const delay = ac.createDelay(1.0);
            delay.delayTime.value = delayTime;
            const fbGain = ac.createGain();
            fbGain.gain.value = 0.22;
            filter.connect(delay);
            delay.connect(fbGain);
            fbGain.connect(delay);
            delay.connect(master);
        });

        ambientNodes = { master, oscs, lfoFilter, lfoVol, ac };
    } catch (e) { console.warn('ambient', e); }
}

export function stopCityAmbient() {
    if (!ambientNodes) return;
    try {
        const { master, oscs, lfoFilter, lfoVol, ac } = ambientNodes;
        master.gain.setTargetAtTime(0, ac.currentTime, 1.2); // ~4s fade out
        setTimeout(() => {
            oscs.forEach(o => { try { o.stop(); } catch {} });
            try { lfoFilter.stop(); lfoVol.stop(); } catch {}
            ambientNodes = null;
        }, 5000);
    } catch (e) { ambientNodes = null; }
}

function masterGain(ac, vol = 0.18) {
    const g = ac.createGain();
    g.gain.value = vol;
    g.connect(ac.destination);
    return g;
}

function osc(ac, type, freq, dest) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(dest);
    return o;
}

function fadeOut(gainNode, ac, duration) {
    gainNode.gain.setTargetAtTime(0, ac.currentTime, duration * 0.3);
}

// ── Stage 1: Deep Interstellar organ drone (low D + 5th + octave) ──────────
export function playDrone() {
    try {
        const ac = getCtx();
        const master = masterGain(ac, 0.14);

        // Fade in
        master.gain.setValueAtTime(0, ac.currentTime);
        master.gain.linearRampToValueAtTime(0.14, ac.currentTime + 1.2);

        // Pipe organ: D1 + A1 + D2 stacked (Interstellar "Cornfield Chase" root)
        const freqs = [36.71, 55.0, 73.42, 110.0]; // D1, A1, D2, A2
        const oscs = freqs.map(f => {
            const o = osc(ac, 'sine', f, master);
            // Add slight harmonic via triangle overtone
            const ov = osc(ac, 'triangle', f * 2.01, master);
            const ovGain = ac.createGain();
            ovGain.gain.value = 0.08;
            ov.connect(ovGain);
            ovGain.connect(master);
            ov.start();
            o.start();
            return [o, ov];
        }).flat();

        // Slow LFO tremolo
        const lfo = ac.createOscillator();
        const lfoGain = ac.createGain();
        lfo.frequency.value = 0.35;
        lfoGain.gain.value = 0.04;
        lfo.connect(lfoGain);
        lfoGain.connect(master.gain);
        lfo.start();

        // Auto-stop after 4.5s
        setTimeout(() => {
            fadeOut(master, ac, 1.5);
            setTimeout(() => {
                oscs.forEach(o => { try { o.stop(); } catch {} });
                lfo.stop();
            }, 2000);
        }, 4500);

    } catch (e) { console.warn('audio', e); }
}

// ── Stage 2: Rising warp sweep — Hail Mary "jump" ──────────────────────────
export function playWarpSweep() {
    try {
        const ac = getCtx();
        const master = masterGain(ac, 0.16);

        master.gain.setValueAtTime(0, ac.currentTime);
        master.gain.linearRampToValueAtTime(0.16, ac.currentTime + 0.3);

        // Rising sweep 80 Hz → 1200 Hz over 1.8s
        const sweep = ac.createOscillator();
        sweep.type = 'sawtooth';
        const sweepFilter = ac.createBiquadFilter();
        sweepFilter.type = 'lowpass';
        sweepFilter.frequency.value = 400;
        sweepFilter.frequency.linearRampToValueAtTime(3000, ac.currentTime + 1.8);

        sweep.frequency.setValueAtTime(80, ac.currentTime);
        sweep.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 1.8);

        sweep.connect(sweepFilter);
        sweepFilter.connect(master);
        sweep.start();

        // Parallel: crystalline high arp (Hail Mary alien tone sequence)
        const arpNotes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5–E5–G5–C6–E6
        arpNotes.forEach((freq, i) => {
            const g = ac.createGain();
            g.gain.setValueAtTime(0, ac.currentTime + i * 0.22);
            g.gain.linearRampToValueAtTime(0.06, ac.currentTime + i * 0.22 + 0.08);
            g.gain.linearRampToValueAtTime(0, ac.currentTime + i * 0.22 + 0.4);
            g.connect(master);
            const o = ac.createOscillator();
            o.type = 'sine';
            o.frequency.value = freq;
            o.connect(g);
            o.start(ac.currentTime + i * 0.22);
            o.stop(ac.currentTime + i * 0.22 + 0.5);
        });

        setTimeout(() => {
            fadeOut(master, ac, 0.8);
            setTimeout(() => { try { sweep.stop(); } catch {} }, 1200);
        }, 1900);

    } catch (e) { console.warn('audio', e); }
}

// ── Phase 3 reveal: Interstellar arrival chord (Dmaj7 swell) ───────────────
export function playArrivalChord() {
    try {
        const ac = getCtx();
        const master = masterGain(ac, 0.0);

        // Slow swell in
        master.gain.linearRampToValueAtTime(0.18, ac.currentTime + 1.8);

        // Dmaj7: D3, F#3, A3, C#4
        const chordFreqs = [146.83, 185.0, 220.0, 277.18];
        const chordOscs = chordFreqs.map(f => {
            const g = ac.createGain();
            g.gain.value = 0.9;
            const reverb = ac.createConvolver ? null : null; // skip convolver, keep simple
            g.connect(master);
            const o = ac.createOscillator();
            o.type = 'sine';
            o.frequency.value = f;
            // Slight detune per voice for warmth
            o.detune.value = (Math.random() - 0.5) * 8;
            o.connect(g);
            o.start();
            return o;
        });

        // High shimmer overtone (Hail Mary "greeting" feel)
        const shimmer = ac.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.value = 1174.66; // D6
        const shimGain = ac.createGain();
        shimGain.gain.setValueAtTime(0, ac.currentTime);
        shimGain.gain.linearRampToValueAtTime(0.04, ac.currentTime + 2.5);
        shimGain.gain.linearRampToValueAtTime(0, ac.currentTime + 5);
        shimmer.connect(shimGain);
        shimGain.connect(master);
        shimmer.start();

        setTimeout(() => {
            fadeOut(master, ac, 2.5);
            setTimeout(() => {
                chordOscs.forEach(o => { try { o.stop(); } catch {} });
                try { shimmer.stop(); } catch {}
            }, 4000);
        }, 3500);

    } catch (e) { console.warn('audio', e); }
}
