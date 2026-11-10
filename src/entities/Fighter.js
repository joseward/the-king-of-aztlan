/**
 * @file Fighter.js
 * @description Clase principal Fighter con Máquina de Estados Finitos (FSM) estilo KOF 2002:
 * IDLE, WALK, RUN, BACKSTEP, JUMP_SQUAT, JUMP, CROUCH, EVADE, ATTACK, SPECIAL, SUPER, HIT, BLOCK, KNOCKDOWN, KO.
 * Incluye sistema de saltos (Corto, Normal, Largo/Hyper Hop), Rodada Defensiva (Evade),
 * Cancelaciones (Normal -> Especial -> Super / Free Cancel en Modo MAX), y renderizador de sprites/wireframes.
 */

const FighterState = {
    IDLE: 'IDLE',
    WALK: 'WALK',
    RUN: 'RUN',
    BACKSTEP: 'BACKSTEP',
    JUMP_SQUAT: 'JUMP_SQUAT',
    JUMP: 'JUMP',
    CROUCH: 'CROUCH',
    EVADE: 'EVADE',
    ATTACK: 'ATTACK',
    SPECIAL: 'SPECIAL',
    SUPER: 'SUPER',
    HIT: 'HIT',
    BLOCK: 'BLOCK',
    KNOCKDOWN: 'KNOCKDOWN',
    KO: 'KO',
    VICTORY: 'VICTORY'
};

class Fighter {
    /**
     * @param {Object} opts
     * @param {number} opts.playerIndex - 1 o 2
     * @param {Object} opts.template - Datos del personaje desde CHARACTER_ROSTER
     * @param {number} opts.x - Posición X inicial en el escenario
     * @param {number} opts.groundY - Altura del suelo
     * @param {number} opts.facing - Orientación inicial (1 = derecha, -1 = izquierda)
     * @param {number} [opts.initialPower=0] - Barra de poder heredada del miembro anterior del equipo (0 a 3000)
     */
    constructor(opts) {
        this.playerIndex = opts.playerIndex;
        this.template = opts.template;
        this.name = opts.template.name;
        this.stats = { ...opts.template.stats };
        this.visuals = { ...opts.template.visuals };
        this.moveset = opts.template.moveset;

        // Posición y física
        this.x = opts.x;
        this.y = opts.groundY;
        this.groundY = opts.groundY;
        this.vx = 0;
        this.vy = 0;
        this.facing = opts.facing || (opts.playerIndex === 1 ? 1 : -1);

        // Salud y Barra de Poder (KOF 2002: hasta 3 Stocks = 3000 puntos)
        this.maxHp = this.stats.maxHp;
        this.hp = this.maxHp;
        this.recoverableRedHp = this.maxHp; // Para animación de drenado suave en HUD
        this.powerGauge = opts.initialPower || 0; // 0 a 3000 (cada 1000 = 1 Stock)
        this.maxPowerGauge = 3000;

        // Modo MAX (BC)
        this.isMaxMode = false;
        this.maxModeTimer = 0;
        this.maxModeMaxDuration = 600; // 10 segundos a 60 FPS

        // Estado FSM y temporizadores de animación
        this.state = FighterState.IDLE;
        this.stateFrame = 0;
        this.animFrame = 0;

        // Datos del salto (Salto Corto, Normal, Largo)
        this.jumpDir = 0; // -1 atrás, 0 vertical, 1 adelante
        this.isLongJump = false;
        this.isShortHop = false;
        this.releasedUpDuringSquat = false;
        this.hadMomentumBeforeJump = false;
        this.quickJumpBufferTimer = 0; // Para detectar tap abajo -> arriba (Super Jump)

        // Datos de combate y cancelación estilo KOF 2002
        this.currentMove = null;
        this.currentMoveKey = '';
        this.moveHasConnected = false; // True si todos los hits del ataque ya conectaron
        this.moveAnyHitConnected = false; // True desde el primer impacto/bloqueo (abre ventana de Cancelación)
        this.moveHasHit = false;
        this.moveHitsLanded = 0;       // Conteo de impactos conectados en movimientos multi-hit
        this.lastHitFrame = -99;       // Frame del último impacto dentro del movimiento actual
        this.chainStepCount = 0;       // Paso actual de cadena de normales (Rapid Chain / Target Combo)
        this.hasSpawnedProjectile = false;
        this.cancelWindow = 0;         // Frames restantes para cancelar en Comando/Especial/Super
        this.lastCancelType = '';      // 'SPECIAL_CANCEL', 'SUPER_CANCEL', 'MAX_CANCEL'
        this.stunTimer = 0;            // Hitstun o Blockstun restante
        this.hitShakeTimer = 0;        // Vibración de impacto estilo Neo-Geo
        this.lastHitTypeReceived = 'HIGH';
        this.invulnerableTimer = 0;    // Frames de invulnerabilidad (Evade, DP, Super, Wakeup)
        this.evadeDir = 1;

        // Contador de combos recibidos por este peleador
        this.comboHitsTaken = 0;
        this.comboDamageTaken = 0;

        // Estelas visuales (para Rodada, Saltos Largos y Modo MAX)
        this.afterimages = [];

        // Cajas de colisión base (Pushbox, Hurtboxes, Hitbox activa) adaptadas a estatura humana (~210px)
        this.pushbox = new window.CollisionBox(-28, -175, 56, 175, window.BoxType.PUSHBOX, 'push');
        this.hurtboxes = [];
        this.activeHitbox = null;
        this._rebuildHurtboxes();
    }

    /**
     * Devuelve el número entero de Stocks de Poder disponibles (0, 1, 2 o 3).
     * @returns {number}
     */
    getPowerStocks() {
        return Math.floor(this.powerGauge / 1000);
    }

    /**
     * Añade energía a la barra de poder (máximo 3000 = 3 stocks).
     * En Modo MAX la ganancia de barra se reduce como en KOF 2002.
     * @param {number} amount
     */
    addPower(amount) {
        const mult = this.isMaxMode ? 0.25 : this.stats.powerGainRate;
        this.powerGauge = Math.min(this.maxPowerGauge, this.powerGauge + amount * mult);
    }

    /**
     * Consume una cantidad de barra de poder si está disponible.
     * @param {number} cost
     * @returns {boolean}
     */
    spendPower(cost) {
        if (this.powerGauge >= cost) {
            this.powerGauge -= cost;
            return true;
        }
        return false;
    }

    /**
     * Comprueba si el peleador está en el suelo.
     * @returns {boolean}
     */
    isGrounded() {
        return this.y >= this.groundY - 0.5;
    }

    /**
     * Comprueba si el peleador es completamente invulnerable a golpes/proyectiles en el frame actual.
     * @returns {boolean}
     */
    isInvulnerable() {
        return (
            this.invulnerableTimer > 0 ||
            this.state === FighterState.KNOCKDOWN ||
            this.state === FighterState.KO
        );
    }

    /**
     * Cambia el estado de la Máquina de Estados Finitos (FSM).
     * @param {string} newState
     */
    setState(newState) {
        this.state = newState;
        this.stateFrame = 0;
        if (![FighterState.ATTACK, FighterState.SPECIAL, FighterState.SUPER].includes(newState)) {
            this.currentMove = null;
            this.currentMoveKey = '';
            this.activeHitbox = null;
            this.cancelWindow = 0;
            this.chainStepCount = 0;
        }
    }

    /**
     * Actualización principal del peleador en cada frame (60 FPS).
     * @param {PlayerInputState} input - Estado de entrada del jugador/IA
     * @param {Fighter} opponent - Peleador rival activo
     * @param {number} globalFrame - Contador global de frames
     * @param {Object} matchCallbacks - Callbacks hacia GameLoop (spawnProjectile, triggerSuperFreeze, addEffect)
     */
    update(input, opponent, globalFrame, matchCallbacks) {
        this.stateFrame++;
        this.animFrame++;

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
        }
        if (this.cancelWindow > 0) {
            this.cancelWindow--;
        }
        if (this.hitShakeTimer > 0) {
            this.hitShakeTimer--;
        }
        if (this.quickJumpBufferTimer > 0) {
            this.quickJumpBufferTimer--;
        }

        // Drenado gradual de barra roja en el HUD
        if (this.recoverableRedHp > this.hp) {
            this.recoverableRedHp = Math.max(this.hp, this.recoverableRedHp - 1.8);
        }

        // Temporizador de Modo MAX
        if (this.isMaxMode) {
            this.maxModeTimer--;
            if (this.animFrame % 4 === 0) {
                this._pushAfterimage(this.visuals.secondaryColor);
            }
            if (this.maxModeTimer <= 0) {
                this.isMaxMode = false;
                this.maxModeTimer = 0;
            }
        }

        // Actualizar estelas visuales (afterimages)
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            this.afterimages[i].alpha -= 0.08;
            if (this.afterimages[i].alpha <= 0) {
                this.afterimages.splice(i, 1);
            }
        }

        // Auto-orientación hacia el rival cuando está en el suelo y en estado libre
        if (
            this.isGrounded() &&
            [FighterState.IDLE, FighterState.WALK, FighterState.CROUCH].includes(this.state)
        ) {
            if (opponent && Math.abs(opponent.x - this.x) > 8) {
                this.facing = opponent.x >= this.x ? 1 : -1;
            }
        }

        const relDir = input ? input.getRelativeDirection(this.facing) : 5;
        if (relDir === 1 || relDir === 2 || relDir === 3) {
            this.quickJumpBufferTimer = 10; // Permite Super Jump (Abajo -> Arriba)
        }

        // Procesar Máquina de Estados Finitos (FSM)
        switch (this.state) {
            case FighterState.IDLE:
            case FighterState.WALK:
            case FighterState.CROUCH:
                this._handleNeutralAndMovementStates(input, opponent, globalFrame, matchCallbacks);
                break;

            case FighterState.RUN:
                this._handleRunState(input, opponent, globalFrame, matchCallbacks);
                break;

            case FighterState.BACKSTEP:
                this._handleBackstepState();
                break;

            case FighterState.JUMP_SQUAT:
                this._handleJumpSquatState(input);
                break;

            case FighterState.JUMP:
                this._handleJumpState(input, opponent, globalFrame, matchCallbacks);
                break;

            case FighterState.EVADE:
                this._handleEvadeState();
                break;

            case FighterState.ATTACK:
            case FighterState.SPECIAL:
            case FighterState.SUPER:
                this._handleCombatMoveState(input, opponent, globalFrame, matchCallbacks);
                break;

            case FighterState.HIT:
                this._handleHitState();
                break;

            case FighterState.BLOCK:
                this._handleBlockState(input);
                break;

            case FighterState.KNOCKDOWN:
                this._handleKnockdownState();
                break;

            case FighterState.KO:
                this._handleKOState();
                break;

            case FighterState.VICTORY:
                this.vx = 0;
                break;
        }

        // Aplicar física horizontal y vertical
        this.x += this.vx;
        this.y += this.vy;

        if (!this.isGrounded()) {
            this.vy += this.stats.gravity;
        }

        // Colisión con el suelo
        if (this.y > this.groundY) {
            this.y = this.groundY;
            this.vy = 0;
        }

        // Reconstruir Hurtboxes y Hitbox según el estado y frame actual
        this._rebuildHurtboxes();
    }

    /**
     * Lógica en estados neutrales en tierra (IDLE, WALK, CROUCH).
     */
    _handleNeutralAndMovementStates(input, opponent, globalFrame, matchCallbacks) {
        if (!input) return;

        // 1. Prioridad de Comandos: Super -> Especial -> Modo MAX -> Evasión -> Ataques Normales
        if (this._tryTriggerActionFromInput(input, opponent, globalFrame, matchCallbacks, false)) {
            return;
        }

        const dir = input.getRelativeDirection(this.facing);

        // 2. Detectar Doble Tap Adelante (66 -> Correr) o Atrás (44 -> Backstep)
        if (dir === 6 && input.checkMotion('DASH_FORWARD', globalFrame)) {
            this.setState(FighterState.RUN);
            return;
        }
        if (dir === 4 && input.checkMotion('DASH_BACK', globalFrame)) {
            this.setState(FighterState.BACKSTEP);
            this.vx = -7.8 * this.facing;
            this.vy = -6.2;
            this.invulnerableTimer = 8;
            window.AudioSynth.play('evade');
            return;
        }

        // 3. Detectar inicio de Salto (Direcciones 7, 8, 9)
        if (dir === 7 || dir === 8 || dir === 9) {
            this._startJumpSquat(dir, this.quickJumpBufferTimer > 0);
            return;
        }

        // 4. Agacharse (Direcciones 1, 2, 3)
        if (dir === 1 || dir === 2 || dir === 3) {
            this.vx = 0;
            if (this.state !== FighterState.CROUCH) {
                this.setState(FighterState.CROUCH);
            }
            return;
        }

        // 5. Caminar Adelante (6) o Atrás (4)
        if (dir === 6) {
            this.vx = this.stats.walkSpeedForward * this.facing;
            if (this.state !== FighterState.WALK) {
                this.setState(FighterState.WALK);
            }
            return;
        }

        if (dir === 4) {
            this.vx = -this.stats.walkSpeedBackward * this.facing;
            if (this.state !== FighterState.WALK) {
                this.setState(FighterState.WALK);
            }
            return;
        }

        // 6. Reposo (Neutral 5)
        this.vx = 0;
        if (this.state !== FighterState.IDLE) {
            this.setState(FighterState.IDLE);
        }
    }

    /**
     * Lógica del estado RUN (Correr manteniendo adelante tras doble tap 66).
     */
    _handleRunState(input, opponent, globalFrame, matchCallbacks) {
        if (!input) {
            this.setState(FighterState.IDLE);
            return;
        }

        if (this.stateFrame % 5 === 0) {
            this._pushAfterimage(this.visuals.primaryColor);
        }

        // Desde carrera se puede atacar, rodar o saltar largo (Hyper Hop / Long Jump)
        if (this._tryTriggerActionFromInput(input, opponent, globalFrame, matchCallbacks, false)) {
            return;
        }

        const dir = input.getRelativeDirection(this.facing);
        if (dir === 8 || dir === 9) {
            // Salto desde carrera = Salto Largo / Hyper Hop
            this._startJumpSquat(9, true);
            return;
        }

        if (dir === 6) {
            this.vx = this.stats.runSpeed * this.facing;
        } else {
            this.vx = 0;
            this.setState(FighterState.IDLE);
        }
    }

    /**
     * Lógica del estado BACKSTEP (Salto evasivo corto hacia atrás).
     */
    _handleBackstepState() {
        if (this.stateFrame % 4 === 0) {
            this._pushAfterimage('#88aaff');
        }
        if (this.stateFrame > 2 && this.isGrounded()) {
            this.vx = 0;
            this.setState(FighterState.IDLE);
        }
    }

    /**
     * Inicia los 4 frames de preparación de salto (JUMP_SQUAT) que distinguen:
     * - Salto Corto (Short Hop): Si el jugador suelta Arriba antes del frame 4.
     * - Salto Normal: Si mantiene Arriba.
     * - Salto Largo (Hyper Hop / Long Jump): Si venía corriendo o hizo Abajo->Arriba.
     */
    _startJumpSquat(dir, hasMomentum) {
        this.setState(FighterState.JUMP_SQUAT);
        this.jumpDir = dir === 9 ? 1 : dir === 7 ? -1 : 0;
        this.hadMomentumBeforeJump = Boolean(hasMomentum);
        this.releasedUpDuringSquat = false;
        this.vx = 0;
    }

    /**
     * Evalúa los 4 frames de JUMP_SQUAT para determinar el tipo exacto de salto KOF 2002.
     */
    _handleJumpSquatState(input) {
        if (input && !input.held.up) {
            this.releasedUpDuringSquat = true;
        }

        // Al cumplirse 4 frames de Jump Squat, despega del suelo
        if (this.stateFrame >= 4) {
            this.isShortHop = this.releasedUpDuringSquat;
            this.isLongJump = this.hadMomentumBeforeJump && this.jumpDir !== 0;

            // Velocidad vertical: Salto Corto vs Salto Normal/Largo
            this.vy = this.isShortHop
                ? this.stats.shortHopVelocity
                : this.stats.jumpVelocity;

            // Velocidad horizontal: Salto Largo (Running Jump) tiene +42% de impulso horizontal
            const baseHorizSpeed = this.stats.walkSpeedForward * 1.18;
            const longJumpMultiplier = this.isLongJump ? 1.45 : 1.0;
            this.vx = this.jumpDir * baseHorizSpeed * longJumpMultiplier * this.facing;

            this.y -= 2; // Despegar del suelo
            this.setState(FighterState.JUMP);
            window.AudioSynth.play('jump');
        }
    }

    /**
     * Lógica en el aire (JUMP): Permite ataques aéreos y estelas en Salto Largo.
     */
    _handleJumpState(input, opponent, globalFrame, matchCallbacks) {
        if (this.isLongJump && this.stateFrame % 4 === 0) {
            this._pushAfterimage(this.visuals.secondaryColor);
        }

        // Permitir ataque aéreo si aún no atacó en este salto
        if (input && !this.currentMove) {
            this._tryTriggerAirAttack(input, globalFrame);
        }

        // Actualizar ataque aéreo si hay uno activo
        if (this.currentMove) {
            const totalFrames = this.currentMove.startup + this.currentMove.active + this.currentMove.recovery;
            if (this.stateFrame >= totalFrames) {
                this.currentMove = null;
                this.currentMoveKey = '';
                this.activeHitbox = null;
            }
        }

        // Aterrizaje al tocar el suelo
        if (this.stateFrame > 1 && this.isGrounded()) {
            this.vx = 0;
            this.vy = 0;
            this.currentMove = null;
            this.currentMoveKey = '';
            this.activeHitbox = null;
            this.setState(FighterState.IDLE);
        }
    }

    /**
     * Lógica de Rodada Defensiva / Evasión (EVADE - Adelante/Atrás + AB).
     */
    _handleEvadeState() {
        const totalFrames = 24;
        // Invulnerabilidad durante los primeros 18 frames, vulnerable en los últimos 6 frames de recuperación
        if (this.stateFrame <= 18) {
            this.vx = 6.8 * this.evadeDir * this.facing;
            if (this.stateFrame % 3 === 0) {
                this._pushAfterimage('#ffffff');
            }
        } else {
            this.vx = 0;
        }

        if (this.stateFrame >= totalFrames) {
            this.vx = 0;
            this.setState(FighterState.IDLE);
        }
    }

    /**
     * Lógica de ejecución de ataques (Normales, Comando, Especiales y Desesperaciones) y ventana de Cancelación.
     */
    _handleCombatMoveState(input, opponent, globalFrame, matchCallbacks) {
        const move = this.currentMove;
        if (!move) {
            this.setState(FighterState.IDLE);
            return;
        }

        // Estelas dinámicas para Especiales, Desesperaciones y Combos Encadenados (como en KOF 2002)
        if ((this.state === FighterState.SPECIAL || this.state === FighterState.SUPER) && this.stateFrame % 3 === 0) {
            this._pushAfterimage(this.state === FighterState.SUPER ? this.visuals.energyColor : this.visuals.secondaryColor);
        } else if (this.state === FighterState.ATTACK && this.chainStepCount >= 2 && this.stateFrame === 2) {
            this._pushAfterimage(this.visuals.energyColor);
        }

        // 1. Verificar si el jugador intenta CANCELAR el movimiento actual tras haber conectado al menos 1 golpe
        if ((this.cancelWindow > 0 || this.moveAnyHitConnected) && input) {
            if (this._tryTriggerActionFromInput(input, opponent, globalFrame, matchCallbacks, true)) {
                return;
            }
        }

        // 2. Impulso horizontal/vertical propio del movimiento durante startup/active
        if (this.stateFrame === move.startup) {
            if (move.velocityX) {
                this.vx = move.velocityX * this.facing;
            }
            if (move.velocityY) {
                this.vy = move.velocityY;
                this.y -= 2;
            }
            // Si es un proyectil de 1 impacto (ej. 236+P), lanzarlo al inicio de la fase activa
            if (move.spawnsProjectile && (move.hits || 1) <= 1 && !this.hasSpawnedProjectile && matchCallbacks?.spawnProjectile) {
                this.hasSpawnedProjectile = true;
                matchCallbacks.spawnProjectile({
                    ownerIndex: this.playerIndex,
                    x: this.x + 62 * this.facing,
                    y: this.y - 146,
                    facing: this.facing,
                    ...move.spawnsProjectile
                });
            }
        }

        // Si es una Desesperación multi-hit (DM / SDM), lanzar la gran onda de energía como remate final de la ráfaga
        const projSpawnFrame = move.startup + Math.max(1, move.active - 3);
        if (move.spawnsProjectile && (move.hits || 1) > 1 && this.stateFrame === projSpawnFrame && !this.hasSpawnedProjectile && matchCallbacks?.spawnProjectile) {
            this.hasSpawnedProjectile = true;
            matchCallbacks.spawnProjectile({
                ownerIndex: this.playerIndex,
                x: this.x + 68 * this.facing,
                y: this.y - 146,
                facing: this.facing,
                ...move.spawnsProjectile
            });
        }

        // Mantener avance en movimientos multi-hit (Especial Rush / Super) durante su ventana activa
        if (move.hits > 1 && this.stateFrame > move.startup && this.stateFrame < move.startup + move.active) {
            if (move.velocityX && !move.velocityY) {
                this.vx = move.velocityX * 0.65 * this.facing;
            }
        }

        // Frenar gradualmente el deslizamiento en fase de recuperación
        if (this.stateFrame > move.startup + move.active && this.isGrounded()) {
            this.vx *= 0.72;
            if (Math.abs(this.vx) < 0.2) this.vx = 0;
        }

        // 3. Finalizar movimiento al completar startup + active + recovery
        const totalFrames = move.startup + move.active + move.recovery;
        if (this.stateFrame >= totalFrames && this.isGrounded()) {
            this.vx = 0;
            this.setState(FighterState.IDLE);
        }
    }

    /**
     * Evalúa la jerarquía de comandos KOF 2002 (tanto desde estado neutral como desde una Cancelación práctica).
     * Jerarquía:
     * 1. Desesperación MAX (SDM: 236236 + LP+HP o atajo práctico 236 + LP+HP / MAX)
     * 2. Desesperación Normal (DM: 236236 + P/K o atajo práctico 236 + HP+HK)
     * 3. Activación de Modo MAX (Botón MAX / BC)
     * 4. Movimientos Especiales (DP 623+P/K -> QCF 236+P -> QCB 214+K/P)
     * 5. Movimientos de Comando KOF 2002 (Adelante + LP [6A] / Adelante + LK [6B])
     * 6. Combos en Cadena Prácticos (Rapid Chain: Débil -> Débil -> Fuerte -> Comando -> Especial)
     * 7. Evasión / Rodada (AB) y Blowback (CD) [desde neutral]
     * 8. Ataques Normales de Cerca / Lejos / Agachado [desde neutral]
     */
    _tryTriggerActionFromInput(input, opponent, globalFrame, matchCallbacks, isCanceling) {
        const currentMove = this.currentMove;
        const canCancelToCommand = !isCanceling || Boolean(currentMove?.cancelableIntoCommand);
        const canCancelToSpecial = !isCanceling || Boolean(currentMove?.cancelableIntoSpecial);
        const canCancelToSuper = !isCanceling || Boolean(currentMove?.cancelableIntoSuper);
        const canMaxFreeCancel = isCanceling && this.isMaxMode && Boolean(currentMove?.maxCancelable);

        // ---------------------------------------------------------------------
        // A. DESESPERACIONES (SUPER SPECIAL MOVES: 236236+P/K o Atajo Práctico 236+PP / 236+CD)
        // ---------------------------------------------------------------------
        const hasSuperMotion = input.checkMotion('DOUBLE_QCF', globalFrame) || input.checkMotion('DOUBLE_QCB', globalFrame);
        const hasQcfMotion = input.checkMotion('QCF', globalFrame);

        if (canCancelToSuper && (hasSuperMotion || hasQcfMotion)) {
            const ppCheck = input.checkButtonBuffered('PP', globalFrame);
            const cdCheck = input.checkButtonBuffered('CD', globalFrame);
            const maxBtnCheck = input.checkButtonBuffered('MAX', globalFrame);

            // 1. Verificar SDM (236236 + LP+HP / MAX, o atajo rápido 236 + LP+HP)
            if (ppCheck.matched || (hasSuperMotion && maxBtnCheck.matched)) {
                const sdmCost = this.isMaxMode ? 1000 : 2000;
                if (this.powerGauge >= sdmCost) {
                    this.spendPower(sdmCost);
                    this.isMaxMode = false;
                    this.maxModeTimer = 0;
                    input.consumeEntries(ppCheck.matched ? ppCheck.entries : maxBtnCheck.entries);
                    this._startMove('super_SDM', FighterState.SUPER, isCanceling ? '¡CANCELACIÓN SÚPER MAX!' : '¡DESESPERACIÓN MAX!');
                    if (matchCallbacks?.triggerSuperFreeze) {
                        matchCallbacks.triggerSuperFreeze(this, true);
                    }
                    window.AudioSynth.play('super');
                    return true;
                }
            }

            // 2. Verificar DM Normal (236236 + P/K, o atajo rápido 236 + HP+HK)
            const pCheck = input.checkButtonBuffered('P', globalFrame);
            const kCheck = input.checkButtonBuffered('K', globalFrame);
            if ((hasSuperMotion && (pCheck.matched || kCheck.matched)) || (hasQcfMotion && cdCheck.matched)) {
                const dmCost = this.isMaxMode ? 500 : 1000;
                if (this.powerGauge >= dmCost) {
                    this.spendPower(dmCost);
                    const usedEntries = cdCheck.matched ? cdCheck.entries : (pCheck.matched ? pCheck.entries : kCheck.entries);
                    input.consumeEntries(usedEntries);
                    const label = isCanceling && this.state === FighterState.SPECIAL
                        ? '¡SÚPER CANCELACIÓN!'
                        : '¡ATAQUE DE DESESPERACIÓN!';
                    this._startMove('super_DM', FighterState.SUPER, label);
                    if (matchCallbacks?.triggerSuperFreeze) {
                        matchCallbacks.triggerSuperFreeze(this, false);
                    }
                    window.AudioSynth.play('super');
                    return true;
                }
            }
        }

        // ---------------------------------------------------------------------
        // B. ACTIVACIÓN DE MODO MAX (Botón MAX / BC - Requiere 1 Stock = 1000)
        // ---------------------------------------------------------------------
        const maxActCheck = input.checkButtonBuffered('MAX', globalFrame);
        if (maxActCheck.matched && !this.isMaxMode && this.powerGauge >= 1000 && canCancelToSpecial) {
            this.spendPower(1000);
            this.isMaxMode = true;
            this.maxModeTimer = this.maxModeMaxDuration;
            input.consumeEntries(maxActCheck.entries);
            this.lastCancelType = isCanceling ? '¡CANCELACIÓN MAX!' : '¡MODO MAX!';
            window.AudioSynth.play('max');
            if (matchCallbacks?.addBannerEffect) {
                matchCallbacks.addBannerEffect(this.playerIndex, this.lastCancelType, '#ffea00');
            }
            if (isCanceling) {
                // Quick MAX Cancel (BC Cancel KOF 2002): el personaje corre hacia adelante listo para seguir el combo
                this.vx = 7.5 * this.facing;
                this.setState(FighterState.RUN);
            }
            return true;
        }

        // ---------------------------------------------------------------------
        // C. MOVIMIENTOS ESPECIALES (DP 623+P/K, QCF 236+P, QCB 214+K/P)
        // ---------------------------------------------------------------------
        if (canCancelToSpecial || canMaxFreeCancel) {
            // 1. Dragon Punch / Antiaéreo (623 + P o K)
            if (input.checkMotion('DP', globalFrame)) {
                const pBtn = input.checkButtonBuffered('P', globalFrame);
                const kBtn = input.checkButtonBuffered('K', globalFrame);
                const btnMatch = pBtn.matched ? pBtn : kBtn;
                if (btnMatch.matched && (!canMaxFreeCancel || this.currentMoveKey !== 'special_DP_P')) {
                    input.consumeEntries(btnMatch.entries);
                    this._applyMaxFreeCancelCost(canMaxFreeCancel, matchCallbacks);
                    this._startMove('special_DP_P', FighterState.SPECIAL, isCanceling ? '¡CANCELACIÓN ESPECIAL!' : '');
                    window.AudioSynth.play('special');
                    return true;
                }
            }

            // 2. Quarter Circle Forward (236 + P)
            if (input.checkMotion('QCF', globalFrame)) {
                const pBtn = input.checkButtonBuffered('P', globalFrame);
                if (pBtn.matched && (!canMaxFreeCancel || this.currentMoveKey !== 'special_QCF_P')) {
                    input.consumeEntries(pBtn.entries);
                    this._applyMaxFreeCancelCost(canMaxFreeCancel, matchCallbacks);
                    this._startMove('special_QCF_P', FighterState.SPECIAL, isCanceling ? '¡CANCELACIÓN ESPECIAL!' : '');
                    window.AudioSynth.play('special');
                    return true;
                }
            }

            // 3. Quarter Circle Back / Rush (214 + K o P, o 236 + K)
            if (input.checkMotion('QCB', globalFrame) || input.checkMotion('HCB', globalFrame) || input.checkMotion('QCF', globalFrame)) {
                const kBtn = input.checkButtonBuffered('K', globalFrame);
                const pBtn = input.checkMotion('QCB', globalFrame) ? input.checkButtonBuffered('P', globalFrame) : { matched: false };
                const btnMatch = kBtn.matched ? kBtn : pBtn;
                if (btnMatch.matched && (!canMaxFreeCancel || this.currentMoveKey !== 'special_QCB_K')) {
                    input.consumeEntries(btnMatch.entries);
                    this._applyMaxFreeCancelCost(canMaxFreeCancel, matchCallbacks);
                    this._startMove('special_QCB_K', FighterState.SPECIAL, isCanceling ? '¡CANCELACIÓN ESPECIAL!' : '');
                    window.AudioSynth.play('special');
                    return true;
                }
            }
        }

        // ---------------------------------------------------------------------
        // D. MOVIMIENTOS DE COMANDO KOF 2002 (6+LP y 6+LK) Y COMBOS EN CADENA PRÁCTICOS
        // ---------------------------------------------------------------------
        const relDir = input.getRelativeDirection(this.facing);
        const isHoldingForward = relDir === 6 || relDir === 3;
        const isCrouching = relDir === 1 || relDir === 2 || relDir === 3;
        const distToOpponent = opponent ? Math.abs(opponent.x - this.x) : 999;
        const isClose = distToOpponent < 112;

        // 1. Cancelación o ejecución de Golpe de Comando (Adelante + LP [6A] o Adelante + LK [6B])
        if (isHoldingForward && canCancelToCommand && this.currentMoveKey !== 'cmd_6LP' && this.currentMoveKey !== 'cmd_6LK') {
            const lpCheck = input.checkButtonBuffered('LP', globalFrame);
            if (lpCheck.matched) {
                input.consumeEntries(lpCheck.entries);
                this._startMove('cmd_6LP', FighterState.ATTACK, isCanceling ? '¡PUENTE DE COMANDO!' : '');
                return true;
            }
            const lkCheck = input.checkButtonBuffered('LK', globalFrame);
            if (lkCheck.matched) {
                input.consumeEntries(lkCheck.entries);
                this._startMove('cmd_6LK', FighterState.ATTACK, isCanceling ? '¡PUENTE DE COMANDO!' : '');
                return true;
            }
        }

        // 2. Si estamos dentro de un ataque buscando cancelación (Rapid Chain / Target Combo práctico KOF 2002):
        if (isCanceling) {
            // a) Desde ataque Débil (LP / LK) -> permite encadenar hasta 2 golpes ligeros y el 3ro sube a Fuerte con avance (Step-In)
            if (currentMove?.chainableIntoLight && this.chainStepCount < 3) {
                for (const lightBtn of ['LP', 'LK']) {
                    const check = input.checkButtonBuffered(lightBtn, globalFrame);
                    if (check.matched) {
                        input.consumeEntries(check.entries);
                        this.chainStepCount++;
                        if (this.chainStepCount >= 3) {
                            const autoHeavy = lightBtn === 'LP' ? (isCrouching ? 'crouch_HP' : 'close_HP') : 'close_HK';
                            this._startMove(autoHeavy, FighterState.ATTACK, '¡COMBO EN CADENA!');
                            this.vx = 4.4 * this.facing;
                            this._pushAfterimage(this.visuals.energyColor);
                        } else {
                            // Segundo eslabón alterna postura (ej. Jab -> Patada Media o Jab Rápido) con avance
                            const nextMove = isCrouching
                                ? `crouch_${lightBtn}`
                                : (this.currentMoveKey === 'close_LP' && lightBtn === 'LP' ? 'far_LK' : `close_${lightBtn}`);
                            this._startMove(nextMove, FighterState.ATTACK, '¡RÁFAGA RÁPIDA!');
                            this.vx = 3.8 * this.facing;
                        }
                        return true;
                    }
                }
            }

            if (currentMove?.chainableIntoHeavy) {
                for (const heavyBtn of ['HP', 'HK']) {
                    const check = input.checkButtonBuffered(heavyBtn, globalFrame);
                    if (check.matched) {
                        input.consumeEntries(check.entries);
                        this.chainStepCount = 3;
                        const prefix = isCrouching ? 'crouch' : 'close';
                        this._startMove(`${prefix}_${heavyBtn}`, FighterState.ATTACK, '¡COMBO EN CADENA!');
                        this.vx = 4.6 * this.facing;
                        this._pushAfterimage(this.visuals.energyColor);
                        return true;
                    }
                }
            }

            // b) Desde cualquier Golpe Fuerte (close_HP, close_HK, far_HP, far_HK, crouch_HP) -> encadena en Puente de Comando (cmd_6LP / cmd_6LK)
            if (
                this.currentMoveKey === 'close_HP' ||
                this.currentMoveKey === 'close_HK' ||
                this.currentMoveKey === 'far_HP' ||
                this.currentMoveKey === 'far_HK' ||
                this.currentMoveKey === 'crouch_HP'
            ) {
                for (const btn of ['HP', 'HK', 'LP', 'LK']) {
                    const check = input.checkButtonBuffered(btn, globalFrame);
                    if (check.matched) {
                        input.consumeEntries(check.entries);
                        this.chainStepCount = 4;
                        const cmdMove = (btn === 'LK' || btn === 'HK') ? 'cmd_6LK' : 'cmd_6LP';
                        this._startMove(cmdMove, FighterState.ATTACK, '¡PUENTE DE COMANDO!');
                        this.vx = 5.4 * this.facing;
                        this._pushAfterimage(this.visuals.energyColor);
                        return true;
                    }
                }
            }

            // c) Desde un Movimiento de Comando (cmd_6LP / cmd_6LK) -> encadena en Especial según el botón presionado
            if (this.currentMoveKey === 'cmd_6LP' || this.currentMoveKey === 'cmd_6LK') {
                for (const btn of ['HP', 'HK', 'LP', 'LK']) {
                    const check = input.checkButtonBuffered(btn, globalFrame);
                    if (check.matched) {
                        input.consumeEntries(check.entries);
                        this.chainStepCount = 5;
                        const autoSpec = (btn === 'HK' || btn === 'LK')
                            ? 'special_QCB_K'
                            : (btn === 'HP' ? 'special_DP_P' : 'special_QCF_P');
                        this._startMove(autoSpec, FighterState.SPECIAL, '¡CANCELACIÓN ESPECIAL!');
                        this._pushAfterimage(this.visuals.energyColor);
                        window.AudioSynth.play('special');
                        return true;
                    }
                }
            }

            return false;
        }

        // ---------------------------------------------------------------------
        // E. EVASIÓN / RODADA DEFENSIVA (Adelante/Atrás + Botón EVADE / AB)
        // ---------------------------------------------------------------------
        const evadeCheck = input.checkButtonBuffered('EVADE', globalFrame);
        if (evadeCheck.matched) {
            input.consumeEntries(evadeCheck.entries);
            this.evadeDir = (relDir === 4 || relDir === 1 || relDir === 7) ? -1 : 1;
            this.invulnerableTimer = 18;
            this.setState(FighterState.EVADE);
            window.AudioSynth.play('evade');
            return true;
        }

        // ---------------------------------------------------------------------
        // F. GOLPE DE EMPUJE BLOWBACK (CD: HP + HK simultáneos)
        // ---------------------------------------------------------------------
        const cdCheck = input.checkButtonBuffered('CD', globalFrame);
        if (cdCheck.matched) {
            input.consumeEntries(cdCheck.entries);
            this._startMove('blowback_CD', FighterState.ATTACK, '');
            return true;
        }

        // ---------------------------------------------------------------------
        // G. ATAQUES NORMALES (Agachado vs Cerca vs Lejos)
        // ---------------------------------------------------------------------
        for (const btn of ['HP', 'HK', 'LP', 'LK']) {
            const check = input.checkButtonBuffered(btn, globalFrame);
            if (check.matched) {
                input.consumeEntries(check.entries);
                const prefix = isCrouching ? 'crouch' : (isClose ? 'close' : 'far');
                const moveKey = `${prefix}_${btn}`;
                this.chainStepCount = (btn === 'LP' || btn === 'LK') ? 1 : 0;
                this._startMove(moveKey, FighterState.ATTACK, '');
                return true;
            }
        }

        return false;
    }

    /**
     * Evalúa ataques normales en el aire durante un salto.
     */
    _tryTriggerAirAttack(input, globalFrame) {
        for (const btn of ['HP', 'HK', 'LP', 'LK']) {
            const check = input.checkButtonBuffered(btn, globalFrame);
            if (check.matched) {
                input.consumeEntries(check.entries);
                const moveKey = `jump_${btn}`;
                this.currentMoveKey = moveKey;
                this.currentMove = this.moveset[moveKey];
                this.stateFrame = 0;
                this.moveHasConnected = false;
                this.moveAnyHitConnected = false;
                this.moveHasHit = false;
                this.moveHitsLanded = 0;
                this.lastHitFrame = -99;
                return true;
            }
        }
        return false;
    }

    /**
     * Descuenta tiempo de Modo MAX al realizar un Free Cancel de Especial a Especial.
     */
    _applyMaxFreeCancelCost(isMaxFreeCancel, matchCallbacks) {
        if (isMaxFreeCancel && this.isMaxMode) {
            this.maxModeTimer = Math.max(0, this.maxModeTimer - 110);
            this.lastCancelType = '¡CANCELACIÓN LIBRE!';
            if (matchCallbacks?.addBannerEffect) {
                matchCallbacks.addBannerEffect(this.playerIndex, '¡CANCELACIÓN LIBRE!', '#00ffc3');
            }
        }
    }

    /**
     * Inicia un ataque del moveset del personaje.
     * @param {string} moveKey
     * @param {string} targetState - FighterState.ATTACK | FighterState.SPECIAL | FighterState.SUPER
     * @param {string} cancelBanner
     */
    _startMove(moveKey, targetState, cancelBanner = '') {
        const move = this.moveset[moveKey];
        if (!move) return;

        const preserveChain = this.chainStepCount;
        this.setState(targetState);
        this.chainStepCount = preserveChain;
        this.currentMoveKey = moveKey;
        this.currentMove = move;
        this.moveHasConnected = false;
        this.moveAnyHitConnected = false;
        this.moveHasHit = false;
        this.moveHitsLanded = 0;
        this.lastHitFrame = -99;
        this.hasSpawnedProjectile = false;
        this.cancelWindow = 0;
        this.vx = 0;

        if (move.invulnerableStartup) {
            this.invulnerableTimer = move.invulnerableStartup;
        }
        if (cancelBanner) {
            this.lastCancelType = cancelBanner;
        }
    }

    /**
     * Comprueba si el peleador está manteniendo la dirección de bloqueo adecuada contra el tipo de ataque.
     * @param {'HIGH'|'MID'|'LOW'|'OVERHEAD'} hitType
     * @param {PlayerInputState} input
     * @returns {boolean}
     */
    canBlockAttack(hitType, input) {
        if (!input) return false;
        // Solo se puede bloquear en estados neutrales o si ya estaba en Blockstun
        const blockableStates = [
            FighterState.IDLE,
            FighterState.WALK,
            FighterState.CROUCH,
            FighterState.BLOCK
        ];
        if (!blockableStates.includes(this.state) || !this.isGrounded()) {
            return false;
        }

        const dir = input.getRelativeDirection(this.facing);
        const holdingStandBlock = dir === 4;
        const holdingCrouchBlock = dir === 1;

        if (!holdingStandBlock && !holdingCrouchBlock) {
            return false;
        }

        if (hitType === 'LOW') {
            return holdingCrouchBlock; // Ataques bajos exigen bloquear agachado (1)
        }
        if (hitType === 'OVERHEAD') {
            return holdingStandBlock;  // Ataques aéreos exigen bloquear de pie (4)
        }
        // Ataques HIGH y MID pueden bloquearse tanto de pie (4) como agachado (1)
        return true;
    }

    /**
     * Aplica un impacto o bloqueo sobre este peleador (con física de Juggle y Multi-Hit estilo KOF 2002).
     * @param {Object} attackInfo
     * @param {boolean} isBlocked
     * @param {number} attackerFacing
     */
    receiveAttack(attackInfo, isBlocked, attackerFacing) {
        this.hitShakeTimer = isBlocked ? 5 : 8;
        this.lastHitTypeReceived = attackInfo.hitType || 'HIGH';

        if (isBlocked) {
            const chip = attackInfo.chipDamage || 0;
            this.hp = Math.max(1, this.hp - chip);
            this.stunTimer = attackInfo.blockstun || 12;
            this.vx = (attackInfo.pushback || 4) * 0.75 * attackerFacing;
            this.setState(FighterState.BLOCK);
            this.addPower(22);
            window.AudioSynth.play('block');
            return;
        }

        // Impacto limpio
        const rawDamage = attackInfo.damage || 50;
        // Escalamiento suave de daño en combos largos estilo KOF 2002
        const scaling = Math.max(0.45, 1 - this.comboHitsTaken * 0.05);
        const finalDamage = Math.max(4, Math.round((rawDamage * scaling) / this.stats.defense));

        this.hp = Math.max(0, this.hp - finalDamage);
        this.comboHitsTaken++;
        this.comboDamageTaken += finalDamage;
        this.addPower(35);

        if (this.hp <= 0) {
            this.vx = 6.5 * attackerFacing;
            this.vy = -9.5;
            this.y -= 2;
            this.setState(FighterState.KO);
            window.AudioSynth.play('ko');
            return;
        }

        const isFinalHit = attackInfo.isFinalHit !== false;

        // Si el golpe no es el último de un multi-hit, mantener al rival frente al atacante o en Juggle corto
        if (!isFinalHit) {
            this.stunTimer = Math.max(18, attackInfo.hitstun || 20);
            this.vx = (attackInfo.pushback || 2.5) * 0.55 * attackerFacing;
            if (!this.isGrounded() || attackInfo.pose === 'UPPERCUT') {
                this.vy = -5.2;
                this.y = Math.min(this.y, this.groundY - 6);
            }
            this.setState(FighterState.HIT);
            window.AudioSynth.play(rawDamage >= 65 ? 'hit_heavy' : 'hit_light');
            return;
        }

        if (attackInfo.causesKnockdown) {
            this.vx = 5.4 * attackerFacing;
            this.vy = -8.8;
            this.y -= 2;
            // En KOF 2002, si el ataque tiene propiedad Juggle, permanece vulnerable en el aire hasta tocar el suelo
            if (attackInfo.juggleHit) {
                this.stunTimer = 28;
                this.setState(FighterState.HIT);
            } else {
                this.setState(FighterState.KNOCKDOWN);
            }
            window.AudioSynth.play('hit_heavy');
        } else if (!this.isGrounded()) {
            // Air Juggle hit: mantiene al rival flotando ligeramente para conectar el resto del combo
            this.vx = 3.2 * attackerFacing;
            this.vy = -6.4;
            this.stunTimer = 22;
            this.setState(FighterState.HIT);
            window.AudioSynth.play('hit_heavy');
        } else {
            this.stunTimer = attackInfo.hitstun || 17;
            this.vx = (attackInfo.pushback || 3.5) * attackerFacing;
            this.setState(FighterState.HIT);
            window.AudioSynth.play(rawDamage >= 70 ? 'hit_heavy' : 'hit_light');
        }
    }

    /**
     * Notifica al atacante que un impacto de su ataque conectó, abriendo una amplia ventana de Cancelación KOF 2002.
     */
    notifyAttackConnected(wasBlocked) {
        const totalHits = this.currentMove?.hits || 1;
        this.moveHitsLanded++;
        this.lastHitFrame = this.stateFrame;
        this.moveAnyHitConnected = true;
        this.moveHasHit = !wasBlocked;

        if (this.moveHitsLanded >= totalHits) {
            this.moveHasConnected = true;
        }

        // Ventana amplia de 22 frames para cancelar cómodamente en Comando, Especial, MAX o Super
        this.cancelWindow = 22;
        if (this.currentMove?.meterGain) {
            this.addPower(wasBlocked ? this.currentMove.meterGain * 0.5 : this.currentMove.meterGain);
        }
    }

    _handleHitState() {
        this.vx *= 0.82;
        this.stunTimer--;
        // Si cayó de un Juggle aéreo y tocó el suelo con stun agotado, pasa a derribo breve o se recupera
        if (this.isGrounded() && this.stunTimer <= 0) {
            this.vx = 0;
            this.comboHitsTaken = 0;
            this.comboDamageTaken = 0;
            this.setState(FighterState.IDLE);
        }
    }

    _handleBlockState(input) {
        this.vx *= 0.82;
        this.stunTimer--;
        if (this.stunTimer <= 0) {
            this.vx = 0;
            const dir = input ? input.getRelativeDirection(this.facing) : 5;
            if (dir === 1 || dir === 2 || dir === 3) {
                this.setState(FighterState.CROUCH);
            } else {
                this.setState(FighterState.IDLE);
            }
        }
    }

    _handleKnockdownState() {
        if (this.isGrounded()) {
            this.vx *= 0.75;
            if (this.stateFrame >= 36) {
                this.vx = 0;
                this.comboHitsTaken = 0;
                this.comboDamageTaken = 0;
                this.invulnerableTimer = 10; // Invulnerabilidad al levantarse (Wake-up)
                this.setState(FighterState.IDLE);
            }
        }
    }

    _handleKOState() {
        if (this.isGrounded()) {
            this.vx *= 0.78;
            if (Math.abs(this.vx) < 0.2) this.vx = 0;
        }
    }

    /**
     * Reconstruye las Hurtboxes (cabeza, torso, piernas) y la Hitbox activa (incluyendo pulsos multi-hit).
     */
    _rebuildHurtboxes() {
        this.hurtboxes = [];
        this.activeHitbox = null;

        // Sin hurtboxes si es invulnerable (Rodada, Startup de DP/Super, Derribo en suelo, KO)
        if (this.isInvulnerable()) {
            return;
        }

        if (this.state === FighterState.CROUCH || (this.state === FighterState.ATTACK && this.currentMoveKey.startsWith('crouch'))) {
            this.hurtboxes.push(
                new window.CollisionBox(-18, -148, 36, 28, window.BoxType.HURTBOX, 'head'),
                new window.CollisionBox(-28, -120, 56, 120, window.BoxType.HURTBOX, 'body')
            );
        } else if (!this.isGrounded()) {
            this.hurtboxes.push(
                new window.CollisionBox(-20, -198, 40, 32, window.BoxType.HURTBOX, 'head'),
                new window.CollisionBox(-28, -170, 56, 134, window.BoxType.HURTBOX, 'body')
            );
        } else {
            this.hurtboxes.push(
                new window.CollisionBox(-18, -208, 36, 28, window.BoxType.HURTBOX, 'head'),
                new window.CollisionBox(-28, -180, 56, 74, window.BoxType.HURTBOX, 'body'),
                new window.CollisionBox(-28, -106, 56, 106, window.BoxType.HURTBOX, 'legs')
            );
        }

        // Activar Hitbox durante los frames activos (soportando tanto golpes de 1 impacto como multi-hit)
        if (this.currentMove && this.currentMove.hitbox && !this.moveHasConnected) {
            const start = this.currentMove.startup;
            const end = start + this.currentMove.active;
            const totalHits = this.currentMove.hits || 1;
            const hitInterval = totalHits > 1 ? Math.max(2, Math.floor(this.currentMove.active / totalHits)) : 1;
            const readyForNextHit = this.moveHitsLanded === 0 || (this.stateFrame - this.lastHitFrame) >= hitInterval;

            if (this.stateFrame >= start && this.stateFrame < end && readyForNextHit) {
                const hb = this.currentMove.hitbox;
                this.activeHitbox = new window.CollisionBox(
                    hb.offsetX,
                    hb.offsetY,
                    hb.width,
                    hb.height,
                    window.BoxType.HITBOX,
                    'attack'
                );
            }
        }
    }

    _pushAfterimage(color) {
        this.afterimages.push({
            x: this.x,
            y: this.y,
            facing: this.facing,
            state: this.state,
            pose: this.currentMove?.pose || '',
            color: color || this.visuals.primaryColor,
            alpha: 0.48
        });
    }

    /**
     * Renderiza al peleador en el Canvas en estilo Pixel-Art (incluyendo sombra anillada, aura MAX, estelas y wireframes opcionales).
     * @param {CanvasRenderingContext2D} ctx
     * @param {boolean} showBoxes - Si es true, dibuja Pushbox, Hurtboxes y Hitbox activas
     */
    draw(ctx, showBoxes = false) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);

        // 1. Sombra pixelada con anillo luminoso en el suelo (estilo clásico Neo-Geo de la captura)
        ctx.save();
        const shadowW = Math.round(Math.max(18, 42 * (1 - (this.groundY - this.y) / 280)) / 4) * 4;
        ctx.fillStyle = 'rgba(8, 12, 24, 0.55)';
        ctx.fillRect(Math.round(this.x) - shadowW, this.groundY - 4, shadowW * 2, 8);
        if (this.state === FighterState.KNOCKDOWN || this.state === FighterState.KO || this.isMaxMode) {
            ctx.fillStyle = '#fff3b0';
            ctx.fillRect(Math.round(this.x) - shadowW - 4, this.groundY - 2, shadowW * 2 + 8, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(this.x) - shadowW + 8, this.groundY - 4, (shadowW - 8) * 2, 8);
        }
        ctx.restore();

        // 2. Estelas Pixel-Art (Afterimages de Rodada, Salto Largo o Modo MAX)
        for (const img of this.afterimages) {
            ctx.save();
            ctx.globalAlpha = img.alpha;
            window.PixelArtRendererClass.drawFighterPixelArt(
                ctx,
                this,
                img.x,
                img.y,
                img.facing,
                img.state,
                img.pose,
                true,
                img.color
            );
            ctx.restore();
        }

        // 3. Aura Pixelada de Modo MAX (212px de alto para estatura humana)
        if (this.isMaxMode) {
            ctx.save();
            const p = 3;
            const flicker = (Math.floor(this.animFrame / 2) % 3) * p;
            ctx.fillStyle = 'rgba(255, 214, 10, 0.28)';
            ctx.fillRect(Math.round(this.x) - 38 - flicker, Math.round(this.y) - 212 - flicker, 76 + flicker * 2, 210 + flicker);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillRect(Math.round(this.x) - 26, Math.round(this.y) - 198 - flicker, 52, 8);
            ctx.restore();
        }

        // 4. Sprite Pixel-Art articulado por bloques
        const currentPose = this.currentMove?.pose || '';
        window.PixelArtRendererClass.drawFighterPixelArt(
            ctx,
            this,
            this.x,
            this.y,
            this.facing,
            this.state,
            currentPose,
            false,
            null
        );

        // 5. Wireframes de Cajas de Colisión (Pushbox, Hurtboxes, Hitbox)
        if (showBoxes) {
            this.pushbox.drawDebug(ctx, this.x, this.y, this.facing);
            for (const hb of this.hurtboxes) {
                hb.drawDebug(ctx, this.x, this.y, this.facing);
            }
            if (this.activeHitbox) {
                this.activeHitbox.drawDebug(ctx, this.x, this.y, this.facing);
            }
        }
    }

    /**
     * Renderizador de sprites vectoriales / rectángulos articulados por fotograma clave.
     */
    _drawProceduralSprite(ctx, x, y, facing, state, pose, isSilhouette, silhouetteColor) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(facing, 1);

        const primary = isSilhouette ? silhouetteColor : this.visuals.primaryColor;
        const secondary = isSilhouette ? silhouetteColor : this.visuals.secondaryColor;
        const skin = isSilhouette ? silhouetteColor : this.visuals.skinColor;
        const energy = this.visuals.energyColor;

        // Parpadeo translúcido cuando tiene invulnerabilidad activa (Evade / Wakeup)
        if (!isSilhouette && this.invulnerableTimer > 0 && this.animFrame % 2 === 0) {
            ctx.globalAlpha = 0.65;
        }

        // Si está derribado o KO, rotar cuerpo en el suelo
        if (state === FighterState.KNOCKDOWN || state === FighterState.KO) {
            ctx.translate(0, -16);
            ctx.rotate(-Math.PI * 0.46);
        }

        // Si está rodando (EVADE), girar sobre su centro
        if (state === FighterState.EVADE) {
            ctx.translate(0, -48);
            ctx.rotate(this.stateFrame * 0.45 * this.evadeDir);
            ctx.translate(0, 48);
        }

        const isCrouch = state === FighterState.CROUCH || pose.startsWith('CROUCH');
        const breath = Math.sin(this.animFrame * 0.14) * 2.5;
        const walkCycle = state === FighterState.WALK || state === FighterState.RUN
            ? Math.sin(this.animFrame * (state === FighterState.RUN ? 0.45 : 0.25)) * 12
            : 0;

        const torsoHeight = isCrouch ? 38 : 50;
        const torsoY = isCrouch ? -68 : -100 + breath;
        const headY = torsoY - 26;

        // Pierna trasera y delantera
        ctx.fillStyle = '#1e222d';
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 2;

        if (isCrouch) {
            this._drawLimbRect(ctx, -20, -32, 22, 30);
            this._drawLimbRect(ctx, 4, -32, 24, 30);
        } else {
            this._drawLimbRect(ctx, -18 - walkCycle * 0.5, -48, 16, 46);
            // Si está pateando, extender pierna delantera
            if (pose.includes('KICK')) {
                const kickY = pose === 'KICK_LOW' ? -34 : pose === 'KICK_HIGH' ? -96 : -68;
                ctx.fillStyle = primary;
                this._drawLimbRect(ctx, 10, kickY, 58, 16);
                // Efecto de corte de viento en la patada
                if (!isSilhouette) {
                    ctx.fillStyle = energy;
                    ctx.fillRect(54, kickY - 2, 18, 20);
                }
            } else {
                this._drawLimbRect(ctx, 4 + walkCycle * 0.5, -48, 16, 46);
            }
        }

        // Torso / Túnica de combate Aztlán
        ctx.fillStyle = primary;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        this._drawLimbRect(ctx, -22, torsoY, 44, torsoHeight);

        // Faja / Cinturón ceremonial
        ctx.fillStyle = secondary;
        ctx.fillRect(-23, torsoY + torsoHeight - 10, 46, 8);

        // Cabeza
        ctx.fillStyle = skin;
        this._drawLimbRect(ctx, -14, headY, 28, 24);

        // Cinta / Tocado de cabeza según el personaje
        if (!isSilhouette) {
            ctx.fillStyle = secondary;
            ctx.fillRect(-15, headY + 3, 30, 6);
            // Plumas / Penacho dinámico al viento
            ctx.beginPath();
            ctx.moveTo(-14, headY + 5);
            ctx.lineTo(-34 - Math.abs(this.vx) * 2, headY - 8 + breath);
            ctx.lineTo(-26, headY + 11);
            ctx.closePath();
            ctx.fill();

            // Ojos determinados mirando al frente
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(4, headY + 9, 7, 4);
        }

        // Brazos y ataques de puño / especiales
        const isPunching =
            pose.includes('PUNCH') ||
            pose === 'UPPERCUT' ||
            pose === 'BLOWBACK' ||
            pose.includes('SPECIAL') ||
            pose.includes('SUPER');

        if (state === FighterState.BLOCK) {
            // Guardia cruzada al frente
            ctx.fillStyle = skin;
            this._drawLimbRect(ctx, 8, torsoY + 2, 16, 32);
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(24, torsoY + 18, 26, -Math.PI * 0.4, Math.PI * 0.4);
            ctx.stroke();
        } else if (isPunching) {
            const reach = pose.includes('SUPER') ? 74 : pose.includes('HEAVY') || pose === 'BLOWBACK' ? 62 : 48;
            const armY = pose === 'UPPERCUT' ? torsoY - 26 : torsoY + 8;
            ctx.fillStyle = skin;
            this._drawLimbRect(ctx, 10, armY, reach, 15);

            // Guantelete / Energía en el puño
            ctx.fillStyle = pose.includes('SUPER') || pose.includes('SPECIAL') ? energy : secondary;
            this._drawLimbRect(ctx, 10 + reach - 14, armY - 3, 18, 21);
        } else {
            // Guardia de combate neutral
            ctx.fillStyle = skin;
            this._drawLimbRect(ctx, -10, torsoY + 8, 16, 26);
            this._drawLimbRect(ctx, 12, torsoY + 6, 16, 24);
        }

        ctx.restore();
    }

    _drawLimbRect(ctx, x, y, w, h) {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    }
}

window.FighterState = FighterState;
window.Fighter = Fighter;
