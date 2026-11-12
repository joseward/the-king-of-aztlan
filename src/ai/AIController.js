/**
 * @file AIController.js
 * @description Controlador de Inteligencia Artificial reactiva estilo Arcade para el equipo del Jugador 2 (CPU).
 * - Generador pseudoaleatorio determinista con semilla (mulberry32 PRNG) para 0 desincronización y replays.
 * - 4 Niveles de Dificultad auténticos estilo Neo-Geo: FÁCIL, NORMAL, DIFÍCIL y MAESTRO (Omega Rugal).
 * - Modos de Dummy para Modo Práctica (Quieto, Agachado, Saltar, Bloquear Todo, Bloquear tras Primer Golpe).
 * - Bloqueo adaptativo de guardia alta/baja, antiaéreos DP, rodada defensiva a través de proyectiles y combos con cancelación.
 */

function mulberry32(a) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const AIDifficulty = {
    FACIL: 'FACIL',
    NORMAL: 'NORMAL',
    DIFICIL: 'DIFICIL',
    MAESTRO: 'MAESTRO'
};

const DummyMode = {
    QUIETO: 'QUIETO',
    AGACHADO: 'AGACHADO',
    SALTAR: 'SALTAR',
    BLOQUEAR_TODO: 'BLOQUEAR_TODO',
    BLOQUEAR_TRAS_GOLPE: 'BLOQUEAR_TRAS_GOLPE',
    CPU: 'CPU'
};

class AIController {
    constructor() {
        this.enabled = true;
        this.cooldown = 0;
        this.currentIntent = 'NEUTRAL';
        this.intentTimer = 0;

        // Semilla determinista (mulberry32)
        this.seed = 0x5f3759df;
        this.rng = mulberry32(this.seed);

        // Nivel de dificultad arcade
        this.difficulty = AIDifficulty.NORMAL;

        // Configuración para Modo Práctica (null = modo arcade / versus estándar)
        this.dummyMode = null;
    }

    /**
     * Establece una nueva semilla determinista para el PRNG.
     * @param {number} newSeed
     */
    setSeed(newSeed) {
        this.seed = (newSeed >>> 0) || 0x12345678;
        this.rng = mulberry32(this.seed);
    }

    /**
     * Devuelve un número flotante pseudoaleatorio en el rango [0, 1).
     * @returns {number}
     */
    random() {
        return this.rng();
    }

    /**
     * Ajusta la dificultad activa de la CPU.
     * @param {'FACIL'|'NORMAL'|'DIFICIL'|'MAESTRO'} diff
     */
    setDifficulty(diff) {
        if (Object.values(AIDifficulty).includes(diff)) {
            this.difficulty = diff;
        }
    }

    /**
     * Devuelve las tasas probabilísticas de combate para un nivel de dificultad dado.
     * @param {string} diff
     * @returns {{blockRate: number, cancelRate: number, superRate: number, antiAirRate: number, evadeRate: number}}
     */
    getDifficultyRates(diff = this.difficulty) {
        if (diff === AIDifficulty.FACIL) {
            return { blockRate: 0.22, cancelRate: 0.28, superRate: 0.10, antiAirRate: 0.06, evadeRate: 0.04 };
        } else if (diff === AIDifficulty.DIFICIL) {
            return { blockRate: 0.78, cancelRate: 0.85, superRate: 0.60, antiAirRate: 0.65, evadeRate: 0.25 };
        } else if (diff === AIDifficulty.MAESTRO) {
            return { blockRate: 0.94, cancelRate: 0.96, superRate: 0.88, antiAirRate: 0.88, evadeRate: 0.42 };
        }
        return { blockRate: 0.52, cancelRate: 0.65, superRate: 0.35, antiAirRate: 0.30, evadeRate: 0.12 };
    }

    /**
     * Ajusta el comportamiento del maniquí en Modo Práctica.
     * @param {string|null} mode
     */
    setDummyMode(mode) {
        this.dummyMode = mode;
    }

    /**
     * Rota de forma cíclica entre los modos disponibles del maniquí.
     * @returns {string}
     */
    cycleDummyMode() {
        const modes = [
            DummyMode.QUIETO,
            DummyMode.AGACHADO,
            DummyMode.SALTAR,
            DummyMode.BLOQUEAR_TODO,
            DummyMode.BLOQUEAR_TRAS_GOLPE,
            DummyMode.CPU
        ];
        const curIdx = modes.indexOf(this.dummyMode || DummyMode.QUIETO);
        this.dummyMode = modes[(curIdx + 1) % modes.length];
        return this.dummyMode;
    }

    /**
     * Genera entradas simuladas en el PlayerInputState del Jugador 2.
     * @param {PlayerInputState} aiInput
     * @param {Fighter} aiFighter
     * @param {Fighter} humanFighter
     * @param {number} globalFrame
     */
    update(aiInput, aiFighter, humanFighter, globalFrame) {
        if (!this.enabled || !aiFighter || !humanFighter) return;

        // Limpiar botones pulsados del frame previo
        aiInput.held.up = false;
        aiInput.held.down = false;
        aiInput.held.left = false;
        aiInput.held.right = false;
        aiInput.held.LP = false;
        aiInput.held.LK = false;
        aiInput.held.HP = false;
        aiInput.held.HK = false;
        aiInput.held.EVADE = false;
        aiInput.held.MAX = false;

        const dx = humanFighter.x - aiFighter.x;
        const dist = Math.abs(dx);
        const dirToHuman = dx >= 0 ? 1 : -1;

        // ---------------------------------------------------------------------
        // A. RUTINAS DE MODO PRÁCTICA (DUMMY CONFIGURABLE)
        // ---------------------------------------------------------------------
        if (this.dummyMode && this.dummyMode !== DummyMode.CPU) {
            switch (this.dummyMode) {
                case DummyMode.QUIETO:
                    return;

                case DummyMode.AGACHADO:
                    aiInput.held.down = true;
                    return;

                case DummyMode.SALTAR:
                    if (aiFighter.isGrounded()) {
                        aiInput.held.up = true;
                    }
                    return;

                case DummyMode.BLOQUEAR_TODO: {
                    const humanAtk = ['ATTACK', 'SPECIAL', 'SUPER'].includes(humanFighter.state);
                    if (humanAtk) {
                        this._setHorizontal(aiInput, -dirToHuman);
                        aiInput.held.down = humanFighter.currentMove?.hitType === 'LOW';
                    }
                    return;
                }

                case DummyMode.BLOQUEAR_TRAS_GOLPE: {
                    // Bloquea únicamente si ya recibió el primer impacto (para verificar combos reales)
                    if (aiFighter.stunTimer > 0 || aiFighter.comboHitsTaken > 0) {
                        this._setHorizontal(aiInput, -dirToHuman);
                        aiInput.held.down = humanFighter.currentMove?.hitType === 'LOW';
                    }
                    return;
                }
            }
        }

        // ---------------------------------------------------------------------
        // B. PARÁMETROS SEGÚN NIVEL DE DIFICULTAD
        // ---------------------------------------------------------------------
        const isBoss = aiFighter.template?.isBoss || this.difficulty === AIDifficulty.MAESTRO;
        const diff = isBoss ? AIDifficulty.MAESTRO : this.difficulty;

        const { blockRate, cancelRate, superRate, antiAirRate, evadeRate } = this.getDifficultyRates(diff);

        // ---------------------------------------------------------------------
        // 1. CANCELACIONES (Combo Hit-Confirm KOF 2002)
        // ---------------------------------------------------------------------
        if (aiFighter.cancelWindow > 0 && aiFighter.moveHasHit) {
            const roll = this.random();

            // Clímax Oculto MAX2 (Vida <= 35% + 2 Barras o Modo MAX)
            const canMax2 = (aiFighter.hp / aiFighter.maxHp <= 0.35) && (aiFighter.isMaxMode || aiFighter.powerGauge >= 2000);
            if (canMax2 && roll < superRate) {
                this._injectMotion(aiInput, [2, 1, 4, 1, 2, 3, 6], globalFrame);
                aiInput.held.MAX = true;
                aiInput.held.HP = true;
                return;
            }

            // Desesperación Normal / MAX
            if (aiFighter.powerGauge >= 1000 && roll < superRate) {
                this._injectMotion(aiInput, [2, 3, 6, 2, 3, 6], globalFrame);
                aiInput.held.HP = true;
                return;
            }

            // Cancelación Especial / Movimiento Insignia
            if (roll < cancelRate) {
                const subRoll = this.random();
                if (subRoll < 0.34 && aiFighter.moveset.special_SIG) {
                    // 214+P Movimiento Insignia
                    this._injectMotion(aiInput, [2, 1, 4], globalFrame);
                    aiInput.held.HP = true;
                } else if (subRoll < 0.68) {
                    // 214+K Rush
                    this._injectMotion(aiInput, [2, 1, 4], globalFrame);
                    aiInput.held.HK = true;
                } else {
                    // 236+P Proyectil / Onda
                    this._injectMotion(aiInput, [2, 3, 6], globalFrame);
                    aiInput.held.HP = true;
                }
                return;
            }
        }

        // ---------------------------------------------------------------------
        // 2. REACCIÓN DEFENSIVA (Bloqueo adaptativo Alto/Bajo y Rodada)
        // ---------------------------------------------------------------------
        const humanAttacking = ['ATTACK', 'SPECIAL', 'SUPER'].includes(humanFighter.state);
        if (humanAttacking && dist < 175) {
            if (this.random() < blockRate) {
                this._setHorizontal(aiInput, -dirToHuman);
                const isLow = humanFighter.currentMove?.hitType === 'LOW';
                const isOverhead = humanFighter.currentMove?.hitType === 'OVERHEAD' || !humanFighter.isGrounded();
                aiInput.held.down = isLow || (!isOverhead && this.random() < 0.4);
                aiInput.held.up = false;
                return;
            }
        }

        // ---------------------------------------------------------------------
        // 3. REACCIÓN ANTIAÉREA (623+P DP) SI EL RIVAL SALTA
        // ---------------------------------------------------------------------
        if (!humanFighter.isGrounded() && dist < 140 && aiFighter.isGrounded()) {
            if (this.random() < antiAirRate) {
                this._injectMotion(aiInput, [6, 2, 3], globalFrame);
                aiInput.held.HP = true;
                return;
            }
        }

        // ---------------------------------------------------------------------
        // 4. EVASIÓN / RODADA (AB) SI HAY PROYECTIL O PRESIÓN
        // ---------------------------------------------------------------------
        if (dist > 80 && dist < 230 && humanAttacking && this.random() < evadeRate) {
            this._setHorizontal(aiInput, dirToHuman);
            aiInput.held.EVADE = true;
            return;
        }

        // ---------------------------------------------------------------------
        // 5. ACTIVACIÓN MODO MAX (BC)
        // ---------------------------------------------------------------------
        if (!aiFighter.isMaxMode && aiFighter.powerGauge >= 2000 && dist < 185 && this.random() < (diff === AIDifficulty.FACIL ? 0.01 : 0.04)) {
            aiInput.held.MAX = true;
            return;
        }

        // ---------------------------------------------------------------------
        // 6. PLANIFICACIÓN DE INTENCIÓN TÁCTICA
        // ---------------------------------------------------------------------
        this.intentTimer--;
        if (this.intentTimer <= 0) {
            const roll = this.random();
            if (dist > 260) {
                this.currentIntent = roll < 0.55 ? 'APPROACH' : roll < 0.82 ? 'ZONING' : 'WAIT';
                this.intentTimer = 18 + Math.floor(this.random() * 18);
            } else if (dist > 115) {
                this.currentIntent = roll < 0.45 ? 'APPROACH' : roll < 0.75 ? 'POKE' : 'BACK_OFF';
                this.intentTimer = 14 + Math.floor(this.random() * 14);
            } else {
                this.currentIntent = roll < 0.60 ? 'PRESSURE' : roll < 0.82 ? 'SIG_MOVE' : 'BACK_OFF';
                this.intentTimer = 12 + Math.floor(this.random() * 12);
            }
        }

        switch (this.currentIntent) {
            case 'APPROACH':
                this._setHorizontal(aiInput, dirToHuman);
                aiInput.held.down = false;
                if (dist > 140 && dist < 240 && this.random() < 0.06) {
                    aiInput.held.up = true;
                } else {
                    aiInput.held.up = false;
                }
                break;

            case 'ZONING':
                this._setHorizontal(aiInput, 0);
                aiInput.held.up = false;
                aiInput.held.down = false;
                if (this.random() < 0.09) {
                    this._injectMotion(aiInput, [2, 3, 6], globalFrame);
                    aiInput.held.LP = true;
                }
                break;

            case 'POKE':
                this._setHorizontal(aiInput, 0);
                aiInput.held.up = false;
                aiInput.held.down = false;
                if (this.random() < 0.18) {
                    const btns = ['LP', 'LK', 'HP', 'HK'];
                    const chosen = btns[Math.floor(this.random() * btns.length)];
                    aiInput.held[chosen] = true;
                }
                break;

            case 'PRESSURE':
                this._setHorizontal(aiInput, 0);
                aiInput.held.up = false;
                aiInput.held.down = this.random() < 0.38;
                if (this.random() < 0.24) {
                    const btns = ['LP', 'LK', 'HP', 'HK'];
                    const chosen = btns[Math.floor(this.random() * btns.length)];
                    aiInput.held[chosen] = true;
                }
                break;

            case 'SIG_MOVE':
                this._setHorizontal(aiInput, 0);
                aiInput.held.up = false;
                aiInput.held.down = false;
                if (aiFighter.moveset.special_SIG && this.random() < 0.30) {
                    this._injectMotion(aiInput, [2, 1, 4], globalFrame);
                    aiInput.held.HP = true;
                }
                this.currentIntent = 'PRESSURE';
                break;

            case 'BACK_OFF':
                this._setHorizontal(aiInput, -dirToHuman);
                aiInput.held.up = false;
                aiInput.held.down = false;
                break;

            default:
                this._setHorizontal(aiInput, 0);
                aiInput.held.up = false;
                aiInput.held.down = false;
                break;
        }
    }

    _setHorizontal(aiInput, dir) {
        aiInput.held.left = dir === -1;
        aiInput.held.right = dir === 1;
    }

    _injectMotion(aiInput, sequence, globalFrame) {
        let offset = sequence.length;
        for (const dir of sequence) {
            aiInput.dirHistory.push({ dir, frame: globalFrame - offset });
            offset--;
        }
    }
}

window.AIDifficulty = AIDifficulty;
window.DummyMode = DummyMode;
window.AIController = AIController;
