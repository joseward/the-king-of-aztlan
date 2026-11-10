/**
 * @file InputHandler.js
 * @description Gestor de entrada híbrido (Teclado + Mandos/Gamepads USB/Bluetooth vía HTML5 Gamepad API)
 * y buffer de comandos estilo The King of Fighters 2002 para "THE KING OF AZTLAN".
 * Soporta cruceta (D-Pad), joystick analógico izquierdo, Fightsticks Arcade y controles Xbox / PlayStation / Switch.
 */

const DEFAULT_KEYMAP = {
    1: {
        up: 'KeyW',
        down: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        LP: 'KeyU',      // Puño Débil (A)
        LK: 'KeyI',      // Patada Débil (B)
        HP: 'KeyO',      // Puño Fuerte (C)
        HK: 'KeyP',      // Patada Fuerte (D)
        EVADE: 'KeyJ',   // Macro Evasión (AB)
        MAX: 'KeyK'      // Macro Activación MAX (BC)
    },
    2: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        LP: 'Numpad4',
        LK: 'Numpad5',
        HP: 'Numpad6',
        HK: 'Numpad1',
        EVADE: 'Numpad2',
        MAX: 'Numpad3'
    }
};

// Teclas alternativas para Jugador 2 en teclados sin Numpad
const ALT_P2_KEYMAP = {
    LP: 'KeyF',
    LK: 'KeyG',
    HP: 'KeyH',
    HK: 'KeyV',
    EVADE: 'KeyB',
    MAX: 'KeyN'
};

const ACTION_KEYS = ['up', 'down', 'left', 'right', 'LP', 'LK', 'HP', 'HK', 'EVADE', 'MAX'];

class PlayerInputState {
    constructor(playerIndex) {
        this.playerIndex = playerIndex;

        // Estado combinado final leído por Fighter y GameLoop
        this.held = {
            up: false,
            down: false,
            left: false,
            right: false,
            LP: false,
            LK: false,
            HP: false,
            HK: false,
            EVADE: false,
            MAX: false
        };

        // Estados separados por dispositivo para que el mando, el teclado y el multijugador Online P2P convivan
        this.keyboardHeld = { ...this.held };
        this.gamepadHeld = { ...this.held };
        this.remoteHeld = null;
        this.gamepadConnected = false;
        this.gamepadName = '';

        // Botones de sistema del mando (Start / Select)
        this.startPressed = false;
        this.selectPressed = false;
        this._prevStartHeld = false;
        this._prevSelectHeld = false;

        this.prevHeld = { ...this.held };
        this.pressed = { ...this.held };

        /**
         * Historial de direcciones en notación numpad relativa al lado hacia el que mira el personaje:
         * 7 8 9  (Arriba-Atrás, Arriba, Arriba-Adelante)
         * 4 5 6  (Atrás, Neutral, Adelante)
         * 1 2 3  (Abajo-Atrás, Abajo, Abajo-Adelante)
         * @type {Array<{dir: number, frame: number}>}
         */
        this.dirHistory = [{ dir: 5, frame: 0 }];

        /**
         * Buffer de botones presionados recientemente (permite un margen de 8 frames para lectura de comandos).
         * @type {Array<{button: string, frame: number, consumed: boolean}>}
         */
        this.buttonBuffer = [];
    }

    /**
     * Calcula la dirección en notación numpad (1-9) según hacia dónde mira el personaje.
     * @param {number} facing - 1 (mira a la derecha) o -1 (mira a la izquierda)
     * @returns {number}
     */
    getRelativeDirection(facing = 1) {
        const rawHoriz = (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0);
        const relHoriz = rawHoriz * facing; // +1 = Adelante (6), -1 = Atrás (4)
        const vert = (this.held.up ? 1 : 0) - (this.held.down ? 1 : 0); // +1 = Arriba, -1 = Abajo

        if (vert === -1) {
            if (relHoriz === -1) return 1;
            if (relHoriz === 1) return 3;
            return 2;
        }
        if (vert === 1) {
            if (relHoriz === -1) return 7;
            if (relHoriz === 1) return 9;
            return 8;
        }
        if (relHoriz === -1) return 4;
        if (relHoriz === 1) return 6;
        return 5;
    }

    /**
     * Sincroniza Teclado + Mando (si no está siendo controlado por la IA en este frame)
     * y actualiza el buffer de direcciones y botones a 60 FPS.
     * @param {number} currentFrame
     * @param {number} facing
     * @param {boolean} [isAIControlled=false]
     */
    updateFrame(currentFrame, facing = 1, isAIControlled = false) {
        if (!isAIControlled) {
            if (this.remoteHeld) {
                for (const btn of ACTION_KEYS) {
                    this.held[btn] = Boolean(this.remoteHeld[btn]);
                }
            } else {
                for (const btn of ACTION_KEYS) {
                    this.held[btn] = Boolean(this.keyboardHeld[btn] || this.gamepadHeld[btn]);
                }
            }
        }

        for (const btn of ACTION_KEYS) {
            this.pressed[btn] = this.held[btn] && !this.prevHeld[btn];
            if (this.pressed[btn] && ['LP', 'LK', 'HP', 'HK', 'EVADE', 'MAX'].includes(btn)) {
                this.buttonBuffer.push({ button: btn, frame: currentFrame, consumed: false });
            }
            this.prevHeld[btn] = this.held[btn];
        }

        // Limpiar entradas antiguas del buffer de botones (> 16 frames para combos fluidos estilo KOF 2002)
        this.buttonBuffer = this.buttonBuffer.filter(b => currentFrame - b.frame <= 16);

        const dir = this.getRelativeDirection(facing);
        const lastEntry = this.dirHistory[this.dirHistory.length - 1];
        if (!lastEntry || lastEntry.dir !== dir) {
            this.dirHistory.push({ dir, frame: currentFrame });
            if (this.dirHistory.length > 55) {
                this.dirHistory.shift();
            }
        }
    }

    /**
     * Comprueba si un botón (o combinación AB / BC / CD) fue presionado dentro de la ventana de buffer.
     */
    checkButtonBuffered(type, currentFrame, windowFrames = 11) {
        const recent = this.buttonBuffer.filter(
            b => !b.consumed && (currentFrame - b.frame) <= windowFrames
        );

        const hasBtn = (name) => recent.find(b => b.button === name);

        if (type === 'EVADE') {
            const ev = hasBtn('EVADE');
            const lp = hasBtn('LP');
            const lk = hasBtn('LK');
            if (ev) return { matched: true, strength: 'EX', button: 'EVADE', entries: [ev] };
            if (lp && lk && Math.abs(lp.frame - lk.frame) <= 3) {
                return { matched: true, strength: 'EX', button: 'EVADE', entries: [lp, lk] };
            }
            return { matched: false, strength: '', button: '' };
        }

        if (type === 'MAX') {
            const mx = hasBtn('MAX');
            const lk = hasBtn('LK');
            const hp = hasBtn('HP');
            if (mx) return { matched: true, strength: 'MAX', button: 'MAX', entries: [mx] };
            if (lk && hp && Math.abs(lk.frame - hp.frame) <= 3) {
                return { matched: true, strength: 'MAX', button: 'MAX', entries: [lk, hp] };
            }
            return { matched: false, strength: '', button: '' };
        }

        if (type === 'CD') {
            const hp = hasBtn('HP');
            const hk = hasBtn('HK');
            if (hp && hk && Math.abs(hp.frame - hk.frame) <= 3) {
                return { matched: true, strength: 'HEAVY', button: 'CD', entries: [hp, hk] };
            }
            return { matched: false, strength: '', button: '' };
        }

        if (type === 'PP') {
            const lp = hasBtn('LP');
            const hp = hasBtn('HP');
            if (lp && hp && Math.abs(lp.frame - hp.frame) <= 4) {
                return { matched: true, strength: 'MAX', button: 'PP', entries: [lp, hp] };
            }
            return { matched: false, strength: '', button: '' };
        }

        if (type === 'P') {
            const hp = hasBtn('HP');
            if (hp) return { matched: true, strength: 'HEAVY', button: 'HP', entries: [hp] };
            const lp = hasBtn('LP');
            if (lp) return { matched: true, strength: 'LIGHT', button: 'LP', entries: [lp] };
            return { matched: false, strength: '', button: '' };
        }

        if (type === 'K') {
            const hk = hasBtn('HK');
            if (hk) return { matched: true, strength: 'HEAVY', button: 'HK', entries: [hk] };
            const lk = hasBtn('LK');
            if (lk) return { matched: true, strength: 'LIGHT', button: 'LK', entries: [lk] };
            return { matched: false, strength: '', button: '' };
        }

        const single = hasBtn(type);
        if (single) {
            const isHeavy = type === 'HP' || type === 'HK';
            return {
                matched: true,
                strength: isHeavy ? 'HEAVY' : 'LIGHT',
                button: type,
                entries: [single]
            };
        }

        return { matched: false, strength: '', button: '' };
    }

    consumeEntries(entries) {
        if (!entries) return;
        for (const e of entries) {
            e.consumed = true;
        }
    }

    checkSequence(sequence, currentFrame, maxFrames = 18) {
        let seqIdx = sequence.length - 1;
        for (let i = this.dirHistory.length - 1; i >= 0; i--) {
            const entry = this.dirHistory[i];
            if (currentFrame - entry.frame > maxFrames) {
                break;
            }
            if (entry.dir === sequence[seqIdx]) {
                seqIdx--;
                if (seqIdx < 0) {
                    return true;
                }
            }
        }
        return false;
    }

    checkMotion(motionName, currentFrame) {
        switch (motionName) {
            case 'DOUBLE_QCF':
                return (
                    this.checkSequence([2, 3, 6, 2, 3, 6], currentFrame, 32) ||
                    this.checkSequence([2, 6, 2, 6], currentFrame, 30) ||
                    this.checkSequence([2, 3, 6, 2, 6], currentFrame, 30) ||
                    this.checkSequence([2, 6, 2, 3, 6], currentFrame, 30)
                );
            case 'DOUBLE_QCB':
                return (
                    this.checkSequence([2, 1, 4, 2, 1, 4], currentFrame, 32) ||
                    this.checkSequence([2, 4, 2, 4], currentFrame, 30)
                );
            case 'HCB':
                return (
                    this.checkSequence([6, 3, 2, 1, 4], currentFrame, 26) ||
                    this.checkSequence([6, 2, 4], currentFrame, 24)
                );
            case 'DP':
                return (
                    this.checkSequence([6, 2, 3], currentFrame, 20) ||
                    this.checkSequence([6, 3, 2, 3], currentFrame, 22) ||
                    this.checkSequence([6, 2, 6], currentFrame, 18) ||
                    this.checkSequence([3, 2, 3], currentFrame, 18)
                );
            case 'QCF':
                return (
                    this.checkSequence([2, 3, 6], currentFrame, 20) ||
                    this.checkSequence([2, 6], currentFrame, 16)
                );
            case 'QCB':
                return (
                    this.checkSequence([2, 1, 4], currentFrame, 20) ||
                    this.checkSequence([2, 4], currentFrame, 16)
                );
            case 'DASH_FORWARD':
                return this.checkSequence([6, 5, 6], currentFrame, 15);
            case 'DASH_BACK':
                return this.checkSequence([4, 5, 4], currentFrame, 15);
            default:
                return false;
        }
    }
}

class InputHandler {
    constructor() {
        this.players = {
            1: new PlayerInputState(1),
            2: new PlayerInputState(2)
        };

        // Zona muerta del stick analógico para lectura limpia de diagonales (236, 623, 214)
        this.analogDeadzone = 0.35;

        this._bindKeyboardEvents();
        this._bindGamepadEvents();
    }

    _bindKeyboardEvents() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            this._handleKey(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this._handleKey(e.code, false);
        });
    }

    _bindGamepadEvents() {
        window.addEventListener('gamepadconnected', (e) => {
            if (window.AudioSynth) {
                window.AudioSynth.play('select');
            }
            console.log(`[Gamepad Conectado] Índice ${e.gamepad.index}: ${e.gamepad.id}`);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log(`[Gamepad Desconectado] Índice ${e.gamepad.index}: ${e.gamepad.id}`);
        });
    }

    _handleKey(code, isDown) {
        // Jugador 1
        for (const [action, keyCode] of Object.entries(DEFAULT_KEYMAP[1])) {
            if (code === keyCode) {
                this.players[1].keyboardHeld[action] = isDown;
                this.players[1].held[action] = isDown;
            }
        }
        // Jugador 2 (Numpad o teclas alternativas F/G/H/V/B/N)
        for (const [action, keyCode] of Object.entries(DEFAULT_KEYMAP[2])) {
            if (code === keyCode) {
                this.players[2].keyboardHeld[action] = isDown;
                this.players[2].held[action] = isDown;
            }
        }
        for (const [action, keyCode] of Object.entries(ALT_P2_KEYMAP)) {
            if (code === keyCode) {
                this.players[2].keyboardHeld[action] = isDown;
                this.players[2].held[action] = isDown;
            }
        }
    }

    /**
     * Lee el estado de todos los mandos conectados mediante la API HTML5 Gamepad en cada frame (60 FPS).
     * Mapeo estándar de lucha:
     * - D-Pad o Stick Izquierdo: Direcciones (Arriba, Abajo, Izquierda, Derecha)
     * - X / Cuadrado (Botón 2): LP (Puño Débil)
     * - A / Cruz     (Botón 0): LK (Patada Débil)
     * - Y / Triángulo(Botón 3): HP (Puño Fuerte)
     * - B / Círculo  (Botón 1): HK (Patada Fuerte)
     * - LB / L1 / LT (Botón 4 o 6): EVADE (Rodada Defensiva AB)
     * - RB / R1 / RT (Botón 5 o 7): MAX (Activación Modo MAX BC)
     * - Start (Botón 9): Iniciar / Confirmar
     * - Select (Botón 8): Selección de Equipos
     */
    pollGamepads() {
        if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
            return;
        }

        const rawPads = navigator.getGamepads();
        const activePads = [];
        if (rawPads) {
            for (let i = 0; i < rawPads.length; i++) {
                if (rawPads[i] && rawPads[i].connected) {
                    activePads.push(rawPads[i]);
                }
            }
        }

        for (const playerIdx of [1, 2]) {
            const pState = this.players[playerIdx];
            const pad = activePads[playerIdx - 1];

            if (!pad) {
                pState.gamepadConnected = false;
                pState.gamepadName = '';
                for (const k of ACTION_KEYS) {
                    pState.gamepadHeld[k] = false;
                }
                pState.startPressed = false;
                pState.selectPressed = false;
                continue;
            }

            pState.gamepadConnected = true;
            pState.gamepadName = this._formatGamepadName(pad.id);

            const isBtnPressed = (idx) => {
                const b = pad.buttons[idx];
                if (!b) return false;
                return typeof b === 'object' ? (b.pressed || b.value > 0.4) : b > 0.4;
            };

            const axisX = pad.axes && pad.axes.length > 0 ? pad.axes[0] : 0;
            const axisY = pad.axes && pad.axes.length > 1 ? pad.axes[1] : 0;
            const dz = this.analogDeadzone;

            // Direcciones: D-Pad (12, 13, 14, 15) + Stick Analógico Izquierdo (axes 0, 1)
            pState.gamepadHeld.up = isBtnPressed(12) || axisY < -dz;
            pState.gamepadHeld.down = isBtnPressed(13) || axisY > dz;
            pState.gamepadHeld.left = isBtnPressed(14) || axisX < -dz;
            pState.gamepadHeld.right = isBtnPressed(15) || axisX > dz;

            // 4 Botones de ataque + 2 Macros (Evasión y Modo MAX)
            pState.gamepadHeld.LP = isBtnPressed(2); // X / Cuadrado
            pState.gamepadHeld.LK = isBtnPressed(0); // A / Cruz
            pState.gamepadHeld.HP = isBtnPressed(3); // Y / Triángulo
            pState.gamepadHeld.HK = isBtnPressed(1); // B / Círculo
            pState.gamepadHeld.EVADE = isBtnPressed(4) || isBtnPressed(6); // LB/L1 o LT/L2
            pState.gamepadHeld.MAX = isBtnPressed(5) || isBtnPressed(7);   // RB/R1 o RT/R2

            // Botones Start (9) y Select/Back (8)
            const startHeld = isBtnPressed(9);
            const selectHeld = isBtnPressed(8);
            pState.startPressed = startHeld && !pState._prevStartHeld;
            pState.selectPressed = selectHeld && !pState._prevSelectHeld;
            pState._prevStartHeld = startHeld;
            pState._prevSelectHeld = selectHeld;
        }
    }

    _formatGamepadName(rawId) {
        if (!rawId) return 'Gamepad';
        const clean = rawId.replace(/\s*\([^)]*\)/g, '').trim();
        return clean.length > 22 ? clean.slice(0, 22) + '…' : clean;
    }

    /**
     * Devuelve un resumen legible del estado de los mandos conectados para mostrar en la UI.
     */
    getConnectedGamepadsSummary() {
        const p1 = this.players[1];
        const p2 = this.players[2];
        if (!p1.gamepadConnected && !p2.gamepadConnected) {
            return 'Sin mando detectado (Presiona cualquier botón de tu mando USB/Bluetooth)';
        }
        const parts = [];
        if (p1.gamepadConnected) parts.push(`P1: ${p1.gamepadName}`);
        if (p2.gamepadConnected) parts.push(`P2: ${p2.gamepadName}`);
        return parts.join(' | ');
    }

    /**
     * Obtiene el estado de entrada de un jugador (1 o 2).
     * @param {number} playerIndex
     * @returns {PlayerInputState}
     */
    getPlayer(playerIndex) {
        return this.players[playerIndex];
    }

    /**
     * Reinicia todos los estados retenidos (útil en cambios de round).
     */
    resetAll() {
        for (const p of [1, 2]) {
            const state = this.players[p];
            for (const k of ACTION_KEYS) {
                state.held[k] = false;
                state.keyboardHeld[k] = false;
                state.gamepadHeld[k] = false;
                state.prevHeld[k] = false;
                state.pressed[k] = false;
            }
            state.buttonBuffer = [];
        }
    }
}

window.InputHandler = InputHandler;
window.PlayerInputState = PlayerInputState;
