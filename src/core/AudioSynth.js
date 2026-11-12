/**
 * @file AudioSynth.js
 * @description Sistema de audio híbrido contundente para "THE KING OF AZTLAN":
 * - Reproduce `Tournament_Grand_Finale.mp3` en la Pantalla de Título, Selección de Modo/Personajes y Victoria.
 * - Reproduce `Last_Credit_Standing.mp3` durante todas las peleas (Niveles 1 al 12).
 * - Sintetizador Web Audio API de alta fidelidad con capas de subgraves, transientes de ruido blanco y tonos FM
 *   para golpes contundentes (Ligeros, Fuertes, Counter-Hit, Guard Crush, Agarres, Desesperaciones MAX2, Paradas y Menús).
 * - Control de volumen maestro, SFX y Música con persistencia automática en localStorage (`aztlan_audio_settings`).
 */

class ArcadeAudioSynth {
    constructor() {
        this.ctx = null;
        this.masterGainNode = null;
        this.sfxGainNode = null;
        this.enabled = true;
        this.musicEnabled = true;
        this.currentTrack = '';
        this.activeAudio = null;
        this.bgmInterval = null;
        this.bgmStep = 0;

        // Volúmenes (0.0 a 1.0)
        this.masterVolume = 1.0;
        this.sfxVolume = 1.0;
        this.musicVolume = 1.0;

        // Reproductores HTML5 Audio para las pistas del usuario
        this.menuAudio = null;   // Tournament_Grand_Finale.mp3
        this.fightAudio = null;  // Last_Credit_Standing.mp3
        this.mp3Failed = false;

        this._loadSettings();
        this._initMp3Tracks();
        this._bindAutoUnlock();
    }

    _loadSettings() {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            const raw = window.localStorage.getItem('aztlan_audio_settings');
            if (raw) {
                const s = JSON.parse(raw);
                if (typeof s.master === 'number') this.masterVolume = Math.max(0, Math.min(1, s.master));
                if (typeof s.sfx === 'number') this.sfxVolume = Math.max(0, Math.min(1, s.sfx));
                if (typeof s.music === 'number') this.musicVolume = Math.max(0, Math.min(1, s.music));
                if (typeof s.enabled === 'boolean') this.enabled = s.enabled;
                if (typeof s.musicEnabled === 'boolean') this.musicEnabled = s.musicEnabled;
            }
        } catch (e) {}
    }

    saveSettings() {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            window.localStorage.setItem('aztlan_audio_settings', JSON.stringify({
                master: this.masterVolume,
                sfx: this.sfxVolume,
                music: this.musicVolume,
                enabled: this.enabled,
                musicEnabled: this.musicEnabled
            }));
        } catch (e) {}
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        this._updateGainNodes();
        this._updateMp3Volumes();
        this.saveSettings();
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        this._updateGainNodes();
        this.saveSettings();
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
        this._updateMp3Volumes();
        this.saveSettings();
    }

    _updateGainNodes() {
        if (this.ctx && this.masterGainNode && this.sfxGainNode) {
            const now = this.ctx.currentTime;
            this.masterGainNode.gain.setValueAtTime(this.enabled ? this.masterVolume : 0, now);
            this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, now);
        }
    }

    _updateMp3Volumes() {
        const factor = (this.enabled && this.musicEnabled) ? (this.masterVolume * this.musicVolume) : 0;
        if (this.menuAudio) this.menuAudio.volume = Math.max(0, Math.min(1, 0.65 * factor));
        if (this.fightAudio) this.fightAudio.volume = Math.max(0, Math.min(1, 0.74 * factor));
    }

    _initMp3Tracks() {
        if (typeof window === 'undefined' || typeof window.Audio === 'undefined') {
            return;
        }
        try {
            this.menuAudio = new window.Audio('Tournament_Grand_Finale.mp3');
            this.menuAudio.loop = true;
            this.menuAudio.preload = 'auto';

            this.fightAudio = new window.Audio('Last_Credit_Standing.mp3');
            this.fightAudio.loop = true;
            this.fightAudio.preload = 'auto';

            this._updateMp3Volumes();
        } catch (err) {
            this.mp3Failed = true;
        }
    }

    _bindAutoUnlock() {
        if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
            return;
        }
        const unlock = () => {
            if (!this.enabled || !this.musicEnabled) return;
            this.init();
            const targetAudio = this.activeAudio || this.menuAudio;
            if (targetAudio && !this.mp3Failed && targetAudio.paused) {
                const p = targetAudio.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {});
                }
            }
        };
        window.addEventListener('click', unlock, { passive: true });
        window.addEventListener('keydown', unlock, { passive: true });
        window.addEventListener('gamepadconnected', unlock, { passive: true });
    }

    init() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.masterGainNode = this.ctx.createGain();
                this.sfxGainNode = this.ctx.createGain();

                this.sfxGainNode.connect(this.masterGainNode);
                this.masterGainNode.connect(this.ctx.destination);
                this._updateGainNodes();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playBGM(trackName = 'title') {
        if (!this.enabled || !this.musicEnabled) {
            this.stopBGM();
            return;
        }

        this.currentTrack = trackName;
        const isFightTrack = trackName === 'stage' || trackName === 'boss_rugal';

        if (!this.mp3Failed && this.menuAudio && this.fightAudio) {
            const nextAudio = isFightTrack ? this.fightAudio : this.menuAudio;
            const otherAudio = isFightTrack ? this.menuAudio : this.fightAudio;

            if (otherAudio && !otherAudio.paused) {
                otherAudio.pause();
                otherAudio.currentTime = 0;
            }

            this.activeAudio = nextAudio;
            this._updateMp3Volumes();

            if (nextAudio.paused) {
                const playPromise = nextAudio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            }
            return;
        }

        if (this.bgmInterval) return;

        this.bgmStep = 0;
        const lead = [329.63, 392, 440, 523.25, 493.88, 440, 392, 329.63];
        const bass = [82.41, 82.41, 164.81, 82.41, 73.42, 73.42, 146.83, 73.42];

        this.bgmInterval = setInterval(() => {
            if (!this.enabled || !this.musicEnabled) return;
            this.init();
            if (!this.ctx || this.ctx.state !== 'running') return;

            const idx = this.bgmStep % lead.length;
            this._playTone(lead[idx], lead[idx] * 0.98, 0.1, 'sawtooth', 0.06);
            this._playTone(bass[idx], bass[idx] * 0.98, 0.1, 'square', 0.07);
            this.bgmStep++;
        }, 120);
    }

    stopBGM() {
        if (this.menuAudio && !this.menuAudio.paused) {
            this.menuAudio.pause();
        }
        if (this.fightAudio && !this.fightAudio.paused) {
            this.fightAudio.pause();
        }
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.currentTrack = '';
    }

    /**
     * Reproduce un efecto de sonido arcade con cuerpo sonoro y transientes.
     * @param {string} type
     */
    play(type) {
        if (!this.enabled) return;
        this.init();

        const targetAudio = this.activeAudio || this.menuAudio;
        if (this.musicEnabled && targetAudio && !this.mp3Failed && targetAudio.paused) {
            const p = targetAudio.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {});
            }
        }

        if (!this.ctx) return;

        switch (type) {
            case 'hit_light':
                this._playNoiseBurst(0.06, 900, 0.28);
                this._playTone(190, 75, 0.06, 'triangle', 0.32);
                break;

            case 'hit_heavy':
                // Golpe fuerte con golpe en el pecho (sub-bass transient)
                this._playNoiseBurst(0.16, 450, 0.55);
                this._playTone(160, 32, 0.18, 'sawtooth', 0.55);
                this._playSubBoom(65, 25, 0.22, 0.45);
                break;

            case 'counter_hit':
                // Crujido penetrante con impacto pesado
                this._playNoiseBurst(0.20, 1400, 0.65);
                this._playTone(380, 45, 0.22, 'sawtooth', 0.60);
                this._playTone(120, 28, 0.25, 'triangle', 0.50);
                this._playSubBoom(85, 20, 0.28, 0.60);
                break;

            case 'guard_crush':
                // Rotura de guardia: cristal metálico rompiéndose + resonancia
                this._playTone(1420, 220, 0.32, 'square', 0.45);
                this._playNoiseBurst(0.35, 1800, 0.55);
                this._playSubBoom(70, 22, 0.35, 0.65);
                break;

            case 'throw':
                // Proyección: silbido de rotación y azote contra el piso
                this._playTone(280, 80, 0.14, 'sine', 0.35);
                this._playNoiseBurst(0.22, 380, 0.60);
                this._playSubBoom(55, 18, 0.30, 0.55);
                break;

            case 'block':
                this._playTone(680, 980, 0.07, 'square', 0.24);
                this._playNoiseBurst(0.04, 1600, 0.18);
                break;

            case 'parry':
                // Parada Third Strike: choque metálico agudo impecable
                this._playTone(1280, 1850, 0.12, 'square', 0.40);
                this._playTone(950, 1420, 0.14, 'triangle', 0.35);
                this._playNoiseBurst(0.06, 2400, 0.25);
                break;

            case 'guard_cancel':
                this._playTone(850, 1200, 0.15, 'sawtooth', 0.35);
                this._playTone(320, 120, 0.18, 'square', 0.30);
                break;

            case 'jump':
                this._playTone(160, 440, 0.09, 'sine', 0.18);
                break;

            case 'evade':
                this._playTone(340, 130, 0.11, 'sine', 0.22);
                break;

            case 'slide':
                this._playNoiseBurst(0.18, 650, 0.32);
                this._playTone(140, 60, 0.15, 'triangle', 0.22);
                break;

            case 'teleport':
                this._playTone(440, 1280, 0.16, 'sine', 0.35);
                this._playTone(880, 220, 0.18, 'triangle', 0.28);
                break;

            case 'special':
                this._playTone(280, 720, 0.18, 'sawtooth', 0.28);
                this._playNoiseBurst(0.14, 1100, 0.24);
                break;

            case 'super':
                this._playTone(220, 920, 0.35, 'sawtooth', 0.38);
                this._playTone(440, 1320, 0.35, 'square', 0.30);
                this._playSubBoom(80, 25, 0.35, 0.45);
                break;

            case 'max':
                this._playTone(320, 960, 0.26, 'square', 0.32);
                this._playTone(480, 1420, 0.26, 'triangle', 0.28);
                this._playSubBoom(75, 20, 0.30, 0.40);
                break;

            case 'max2':
                // Clímax Oculto HSDM: estruendo cósmico descomunal
                this._playTone(180, 1600, 0.45, 'sawtooth', 0.50);
                this._playTone(600, 120, 0.50, 'square', 0.45);
                this._playNoiseBurst(0.55, 600, 0.65);
                this._playSubBoom(50, 16, 0.65, 0.75);
                break;

            case 'ko':
                this._playNoiseBurst(0.55, 320, 0.60);
                this._playTone(210, 25, 0.55, 'sawtooth', 0.55);
                this._playSubBoom(45, 14, 0.65, 0.65);
                break;

            case 'cursor_move':
            case 'select':
            case 'menu_move':
                // Crisp Neo-Geo select blip: sharp square wave click with immediate attack & decay
                this._playTone(940, 1380, 0.032, 'square', 0.22);
                break;

            case 'choose_char':
            case 'menu_confirm':
                // Contundente bloqueo/confirmación de personaje estilo arcade
                this._playTone(560, 960, 0.09, 'square', 0.28);
                this._playTone(280, 560, 0.12, 'sawtooth', 0.24);
                break;

            case 'menu_back':
                this._playTone(420, 210, 0.09, 'sawtooth', 0.22);
                break;

            case 'coin':
                this._playTone(987.77, 1318.51, 0.18, 'square', 0.28);
                break;

            default:
                break;
        }
    }

    _playTone(startFreq, endFreq, duration, waveType, gainVal) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGainNode || this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _playSubBoom(startFreq, endFreq, duration, gainVal) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(Math.max(16, endFreq), this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGainNode || this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _playNoiseBurst(duration, filterFreq, gainVal) {
        if (!this.ctx) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGainNode || this.ctx.destination);
        noise.start();
    }
}

window.ArcadeAudioSynth = ArcadeAudioSynth;
window.AudioSynth = new ArcadeAudioSynth();
