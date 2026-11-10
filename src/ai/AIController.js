/**
 * @file AIController.js
 * @description Controlador de Inteligencia Artificial reactiva estilo Arcade para el equipo del Jugador 2 (CPU).
 * Ejecuta desplazamientos, saltos cortos/largos, bloqueos defensivos, rodadas, ataques normales y combos con cancelación.
 */

class AIController {
    constructor() {
        this.enabled = true;
        this.cooldown = 0;
        this.currentIntent = 'NEUTRAL';
        this.intentTimer = 0;
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
        aiInput.held.LP = false;
        aiInput.held.LK = false;
        aiInput.held.HP = false;
        aiInput.held.HK = false;
        aiInput.held.EVADE = false;
        aiInput.held.MAX = false;

        const dx = humanFighter.x - aiFighter.x;
        const dist = Math.abs(dx);
        const dirToHuman = dx >= 0 ? 1 : -1;

        // 1. Si el golpe de la IA acaba de conectar, intentar cancelar en Especial o Desesperación
        if (aiFighter.cancelWindow > 0 && aiFighter.moveHasHit) {
            if (aiFighter.powerGauge >= 1000 && Math.random() < 0.35) {
                this._injectMotion(aiInput, [2, 3, 6, 2, 3, 6], globalFrame);
                aiInput.held.HP = true;
                return;
            }
            if (Math.random() < 0.65) {
                const useQcb = Math.random() < 0.45;
                if (useQcb) {
                    this._injectMotion(aiInput, [2, 1, 4], globalFrame);
                    aiInput.held.HK = true;
                } else {
                    this._injectMotion(aiInput, [2, 3, 6], globalFrame);
                    aiInput.held.HP = true;
                }
                return;
            }
        }

        // 2. Reacción defensiva si el jugador humano está atacando cerca
        const humanAttacking = ['ATTACK', 'SPECIAL', 'SUPER'].includes(humanFighter.state);
        if (humanAttacking && dist < 155 && Math.random() < 0.55) {
            // Mantener atrás para bloquear (o atrás-abajo contra ataques bajos)
            this._setHorizontal(aiInput, -dirToHuman);
            aiInput.held.down = humanFighter.currentMove?.hitType === 'LOW';
            aiInput.held.up = false;
            return;
        }

        // 3. Reacción antiaérea (DP+P) si el jugador humano salta encima de la IA
        if (!humanFighter.isGrounded() && dist < 125 && aiFighter.isGrounded() && Math.random() < 0.14) {
            this._injectMotion(aiInput, [6, 2, 3], globalFrame);
            aiInput.held.HP = true;
            return;
        }

        // 4. Actualizar intención táctica cada ciertos frames
        this.intentTimer--;
        if (this.intentTimer <= 0) {
            const roll = Math.random();
            if (dist > 250) {
                this.currentIntent = roll < 0.55 ? 'APPROACH' : roll < 0.8 ? 'ZONING' : 'WAIT';
                this.intentTimer = 22 + Math.floor(Math.random() * 20);
            } else if (dist > 100) {
                this.currentIntent = roll < 0.48 ? 'APPROACH' : roll < 0.75 ? 'POKE' : 'BACK_OFF';
                this.intentTimer = 16 + Math.floor(Math.random() * 16);
            } else {
                this.currentIntent = roll < 0.62 ? 'PRESSURE' : roll < 0.82 ? 'EVADE' : 'BACK_OFF';
                this.intentTimer = 14 + Math.floor(Math.random() * 14);
            }
        }

        // Activar Modo MAX si tiene 2 o más barras y está cerca
        if (!aiFighter.isMaxMode && aiFighter.powerGauge >= 2000 && dist < 170 && Math.random() < 0.03) {
            aiInput.held.MAX = true;
            return;
        }

        switch (this.currentIntent) {
            case 'APPROACH':
                this._setHorizontal(aiInput, dirToHuman);
                aiInput.held.down = false;
                // Ocasionalmente saltar hacia adelante (Salto Corto)
                if (dist > 130 && dist < 220 && Math.random() < 0.04) {
                    aiInput.held.up = true;
                } else {
                    aiInput.held.up = false;
                }
                break;

            case 'ZONING':
                this._setHorizontal(aiInput, 0);
                aiInput.held.up = false;
                aiInput.held.down = false;
                if (Math.random() < 0.08) {
                    this._injectMotion(aiInput, [2, 3, 6], globalFrame);
                    aiInput.held.LP = true;
                }
                break;

            case 'POKE':
                this._setHorizontal(aiInput, 0);
                aiInput.held.up = false;
                aiInput.held.down = false;
                if (Math.random() < 0.16) {
                    const btns = ['LP', 'LK', 'HP', 'HK'];
                    const chosen = btns[Math.floor(Math.random() * btns.length)];
                    aiInput.held[chosen] = true;
                }
                break;

            case 'PRESSURE':
                this._setHorizontal(aiInput, 0);
                aiInput.held.up = false;
                aiInput.held.down = Math.random() < 0.35;
                if (Math.random() < 0.22) {
                    const btns = ['LP', 'LK', 'HP', 'HK'];
                    const chosen = btns[Math.floor(Math.random() * btns.length)];
                    aiInput.held[chosen] = true;
                }
                break;

            case 'EVADE':
                this._setHorizontal(aiInput, dirToHuman);
                aiInput.held.up = false;
                aiInput.held.down = false;
                if (Math.random() < 0.12) {
                    aiInput.held.EVADE = true;
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

window.AIController = AIController;
