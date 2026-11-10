/**
 * @file AudioSynth.js
 * @description Sistema de audio híbrido para "THE KING OF AZTLAN":
 * - Reproduce `Tournament_Grand_Finale.mp3` en la Pantalla de Título, Selección de Modo/Personajes y Victoria.
 * - Reproduce `Last_Credit_Standing.mp3` durante todas las peleas (Niveles 1 al 12).
 * - Mantiene un sintetizador Web Audio API para los efectos de sonido arcade (golpes, bloqueos, poderes, K.O., cursores).
 */

class ArcadeAudioSynth {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.musicEnabled = true;
        this.currentTrack = '';
        this.activeAudio = null;
        this.bgmInterval = null;
        this.bgmStep = 0;

        // Reproductores HTML5 Audio para las 2 pistas creadas por el usuario
        this.menuAudio = null;   // Tournament_Grand_Finale.mp3 (Título y Menús)
        this.fightAudio = null;  // Last_Credit_Standing.mp3 (Combates)
        this.mp3Failed = false;

        this._initMp3Tracks();
        this._bindAutoUnlock();
    }

    /**
     * Inicializa los elementos de audio para `Tournament_Grand_Finale.mp3` y `Last_Credit_Standing.mp3`.
     */
    _initMp3Tracks() {
        if (typeof window === 'undefined' || typeof window.Audio === 'undefined') {
            return;
        }
        try {
            this.menuAudio = new window.Audio('Tournament_Grand_Finale.mp3');
            this.menuAudio.loop = true;
            this.menuAudio.preload = 'auto';
            this.menuAudio.volume = 0.65;

            this.fightAudio = new window.Audio('Last_Credit_Standing.mp3');
            this.fightAudio.loop = true;
            this.fightAudio.preload = 'auto';
            this.fightAudio.volume = 0.72;
        } catch (err) {
            this.mp3Failed = true;
        }
    }

    /**
     * Desbloquea automáticamente la reproducción de la pista activa y el AudioContext
     * en la primera interacción del usuario (clic, tecla o botón de mando).
     */
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

    /**
     * Inicializa o reanuda el contexto de Web Audio API para efectos de sonido.
     */
    init() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Cambia o mantiene la música de fondo según la fase del juego:
     * - 'title', 'select', 'victory' -> `Tournament_Grand_Finale.mp3`
     * - 'stage', 'boss_rugal'        -> `Last_Credit_Standing.mp3`
     * @param {string} trackName
     */
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

            // Si está cambiando entre música de menú y música de pelea, pausar la anterior
            if (otherAudio && !otherAudio.paused) {
                otherAudio.pause();
                otherAudio.currentTime = 0;
            }

            this.activeAudio = nextAudio;
            nextAudio.volume = trackName === 'boss_rugal' ? 0.82 : (isFightTrack ? 0.74 : 0.65);

            if (nextAudio.paused) {
                const playPromise = nextAudio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {
                        // Si el navegador aún espera la primera interacción del usuario, _bindAutoUnlock la iniciará
                    });
                }
            }
            return;
        }

        // Respaldo procedural si no hay soporte HTML5 Audio
        if (this.bgmInterval) {
            return;
        }

        this.bgmStep = 0;
        const lead = [329.63, 392, 440, 523.25, 493.88, 440, 392, 329.63];
        const bass = [82.41, 82.41, 164.81, 82.41, 73.42, 73.42, 146.83, 73.42];

        this.bgmInterval = setInterval(() => {
            if (!this.enabled || !this.musicEnabled) return;
            this.init();
            if (!this.ctx || this.ctx.state !== 'running') return;

            const idx = this.bgmStep % lead.length;
            this._playNote(lead[idx], 0.1, 'sawtooth', 0.06);
            this._playNote(bass[idx], 0.1, 'square', 0.07);
            this.bgmStep++;
        }, 120);
    }

    /**
     * Pausa toda la música de fondo (`Tournament_Grand_Finale.mp3` y `Last_Credit_Standing.mp3`).
     */
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

    _playNote(freq, duration, waveType, gainVal) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    /**
     * Reproduce un efecto de sonido procedural de combate o interfaz según su tipo.
     */
    play(type) {
        if (!this.enabled) return;
        this.init();

        // Asegurar que la pista activa (Tournament_Grand_Finale o Last_Credit_Standing) esté sonando
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
                this._playNoiseBurst(0.06, 800, 0.25);
                this._playTone(180, 60, 0.06, 'triangle', 0.3);
                break;
            case 'hit_heavy':
                this._playNoiseBurst(0.14, 500, 0.45);
                this._playTone(140, 35, 0.14, 'sawtooth', 0.45);
                break;
            case 'block':
                this._playTone(620, 920, 0.07, 'square', 0.22);
                break;
            case 'jump':
                this._playTone(160, 420, 0.09, 'sine', 0.18);
                break;
            case 'evade':
                this._playTone(320, 140, 0.11, 'sine', 0.2);
                break;
            case 'special':
                this._playTone(260, 680, 0.18, 'sawtooth', 0.25);
                this._playNoiseBurst(0.12, 1200, 0.2);
                break;
            case 'super':
                this._playTone(220, 880, 0.35, 'sawtooth', 0.35);
                this._playTone(440, 1200, 0.35, 'square', 0.25);
                break;
            case 'max':
                this._playTone(300, 900, 0.25, 'square', 0.3);
                this._playTone(450, 1350, 0.25, 'triangle', 0.25);
                break;
            case 'ko':
                this._playNoiseBurst(0.45, 300, 0.5);
                this._playTone(190, 30, 0.45, 'sawtooth', 0.5);
                break;
            case 'select':
                this._playTone(520, 780, 0.06, 'square', 0.18);
                break;
            case 'coin':
                this._playTone(987.77, 1318.51, 0.18, 'square', 0.28);
                break;
            default:
                break;
        }
    }

    _playTone(startFreq, endFreq, duration, waveType, gainVal) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _playNoiseBurst(duration, filterFreq, gainVal) {
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
        filter.connect(this.ctx.destination);
        noise.start();
    }
}

window.AudioSynth = new ArcadeAudioSynth();
