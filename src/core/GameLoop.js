/**
 * @file GameLoop.js
 * @description Motor principal de bucle de juego a 60 FPS fijos (Fixed Timestep) para "The King of Aztlán".
 * Coordina la Selección de Equipos 3 vs 3, el cambio fluido de peleadores al caer en K.O.,
 * la detección de colisiones (Pushboxes, Hurtboxes, Hitboxes y Proyectiles), Hitstop, Super Freeze y Escenario.
 */

const GamePhase = {
    TITLE_SCREEN: 'TITLE_SCREEN',
    MODE_SELECT: 'MODE_SELECT',
    TEAM_SELECT: 'TEAM_SELECT',
    STAGE_LADDER: 'STAGE_LADDER',
    ROUND_INTRO: 'ROUND_INTRO',
    FIGHTING: 'FIGHTING',
    KO_TRANSITION: 'KO_TRANSITION',
    MATCH_OVER: 'MATCH_OVER'
};

class GameLoop {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.groundY = this.height - 68;

        this.inputHandler = new window.InputHandler();
        this.aiController = new window.AIController();
        this.hud = new window.HUD(this.width, this.height);

        // Opciones de depuración y entrenamiento
        this.showCollisionBoxes = false;
        this.infinitePowerMode = false;

        // Control de tiempo fijo a 60 FPS
        this.targetFPS = 60;
        this.frameDuration = 1000 / this.targetFPS;
        this.accumulator = 0;
        this.lastTimestamp = 0;
        this.globalFrame = 0;
        this.fpsDisplay = 60;
        this._fpsCounter = 0;
        this._fpsTimer = 0;

        // Estado de flujo Arcade: Inicia en la Pantalla de Título (TITLE_SCREEN)
        this.phase = GamePhase.TITLE_SCREEN;
        this.gameMode = 'ARCADE_12'; // 'ARCADE_12' | 'FREE_3V3' | 'VERSUS_2P' | 'BOSS_RUGAL'
        this.modeCursor = 0;
        this.currentStageNumber = 1; // Nivel actual del 1 al 12 (Nivel 12 = Omega Rugal)

        this.roster = window.CHARACTER_ROSTER;
        this.team1 = [];
        this.team2 = [];
        this.selectCursor = 0;
        this.selectCursorP2 = 3;
        this.isPaused = false;
        this.pauseCursor = 0;

        // Estado del combate 3 vs 3
        this.team1Index = 0;
        this.team2Index = 0;
        this.fighter1 = null;
        this.fighter2 = null;
        this.projectiles = [];
        this.sparks = [];

        this.roundNumber = 1;
        this.timerSeconds = 60;
        this.phaseTimer = 0;
        this.hitstopTimer = 0;
        this.superFreezeTimer = 0;
        this.superFreezeActor = null;
        this.superFreezeIsMax = false;
        this.screenShakeTimer = 0;
        this.announcement = { text: '', subtext: '', color: '#ffbe0b' };

        // Gestor de Multijugador Online P2P por Código de Sala
        this.networkManager = window.NetworkManager ? new window.NetworkManager(this) : null;

        this._bindCanvasMouseEvents();
        this._bindMenuKeyboardShortcuts();
    }

    /**
     * Inicia el bucle principal con requestAnimationFrame.
     */
    start() {
        this.lastTimestamp = performance.now();
        window.AudioSynth.playBGM('title');
        const loop = (now) => {
            const delta = Math.min(100, now - this.lastTimestamp);
            this.lastTimestamp = now;
            this.accumulator += delta;

            this._fpsCounter++;
            this._fpsTimer += delta;
            if (this._fpsTimer >= 1000) {
                this.fpsDisplay = this._fpsCounter;
                this._fpsCounter = 0;
                this._fpsTimer -= 1000;
            }

            while (this.accumulator >= this.frameDuration) {
                this.updateFixedStep();
                this.accumulator -= this.frameDuration;
            }

            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    /**
     * Regresa a la Pantalla de Título con música de intro.
     */
    openTitleScreen() {
        this.phase = GamePhase.TITLE_SCREEN;
        this.inputHandler.resetAll();
        window.AudioSynth.playBGM('title');
    }

    /**
     * Abre la pantalla de Selección de Modo de Juego.
     */
    openModeSelect() {
        this.phase = GamePhase.MODE_SELECT;
        this.modeCursor = 0;
        this.inputHandler.resetAll();
        window.AudioSynth.play('coin');
        window.AudioSynth.playBGM('select');
    }

    /**
     * Reinicia y abre la pantalla de Selección de Equipos (3 personajes).
     */
    openTeamSelect() {
        this.phase = GamePhase.TEAM_SELECT;
        this.team1 = [];
        this.team2 = [];
        this.selectCursor = 0;
        this.selectCursorP2 = 3;
        this.inputHandler.resetAll();
        window.AudioSynth.playBGM('select');
    }

    /**
     * Arranca el combate 3v3 en línea sincronizando exactamente los mismos equipos en Host y Guest.
     */
    _startOnlineMatchFromNetwork(team1Ids, team2Ids, stageNumber = 1) {
        const resolveTeam = (ids) =>
            (ids || [])
                .map(id => id === 'rugal' ? window.BOSS_RUGAL_TEMPLATE : this.roster.find(r => r.id === id))
                .filter(Boolean);

        const resolvedT1 = resolveTeam(team1Ids);
        const resolvedT2 = resolveTeam(team2Ids);
        if (resolvedT1.length > 0) this.team1 = resolvedT1;
        if (resolvedT2.length > 0) this.team2 = resolvedT2;
        this.currentStageNumber = stageNumber || 1;
        this.gameMode = 'VERSUS_2P';
        this.aiController.enabled = false;
        window.AudioSynth.play('super');
        this.startMatch3v3();
    }

    /**
     * Construye el equipo enemigo para un nivel específico (1 a 12) del Modo Arcade.
     * En el Nivel 12, el Jefe Final es OMEGA RUGAL.
     */
    _buildEnemyTeamForStage(stageNum) {
        const stages = window.ARCADE_12_STAGES || [];
        const cfg = stages[Math.max(0, Math.min(stages.length - 1, stageNum - 1))];
        if (!cfg) {
            return [this.roster[3], this.roster[4], window.BOSS_RUGAL_TEMPLATE];
        }
        return cfg.teamIds.map(id => {
            if (id === 'rugal') return window.BOSS_RUGAL_TEMPLATE;
            return this.roster.find(r => r.id === id) || this.roster[0];
        });
    }

    /**
     * Inicia un nivel específico (1 a 12) mostrando primero la Escalera de Torneo.
     */
    startArcadeStage(stageNum) {
        this.currentStageNumber = Math.max(1, Math.min(12, stageNum));
        while (this.team1.length < 3) {
            const candidate = this.roster.find(r => !this.team1.includes(r)) || this.roster[0];
            this.team1.push(candidate);
        }

        if (this.gameMode === 'ARCADE_12' || this.gameMode === 'BOSS_RUGAL') {
            this.team2 = this._buildEnemyTeamForStage(this.currentStageNumber);
        } else {
            while (this.team2.length < 3) {
                const reversed = [...this.roster].reverse();
                const candidate = reversed.find(r => !this.team2.includes(r)) || this.roster[1];
                this.team2.push(candidate);
            }
        }

        this.phase = GamePhase.STAGE_LADDER;
        this.phaseTimer = 135; // ~2.25 segundos mostrando el mapa de los 12 niveles
        window.AudioSynth.play('select');
    }

    /**
     * Inicia una partida completa 3 vs 3 con los equipos actuales (o autocompleta si faltan miembros).
     */
    startMatch3v3() {
        while (this.team1.length < 3) {
            const candidate = this.roster.find(r => !this.team1.includes(r)) || this.roster[0];
            this.team1.push(candidate);
        }
        if (this.gameMode === 'ARCADE_12' || this.gameMode === 'BOSS_RUGAL') {
            this.team2 = this._buildEnemyTeamForStage(this.currentStageNumber);
        } else {
            while (this.team2.length < 3) {
                const reversed = [...this.roster].reverse();
                const candidate = reversed.find(r => !this.team2.includes(r)) || this.roster[1];
                this.team2.push(candidate);
            }
        }

        this.team1Index = 0;
        this.team2Index = 0;
        this.roundNumber = 1;
        this.projectiles = [];
        this.sparks = [];

        this.fighter1 = new window.Fighter({
            playerIndex: 1,
            template: this.team1[0],
            x: this.width * 0.28,
            groundY: this.groundY,
            facing: 1,
            initialPower: 1000
        });

        this.fighter2 = new window.Fighter({
            playerIndex: 2,
            template: this.team2[0],
            x: this.width * 0.72,
            groundY: this.groundY,
            facing: -1,
            initialPower: this.currentStageNumber === 12 ? 3000 : 1000
        });

        // Música especial para el Nivel 12 (Omega Rugal) o música de pelea estándar
        window.AudioSynth.playBGM(this.currentStageNumber === 12 ? 'boss_rugal' : 'stage');

        const stagePrefix = (this.gameMode === 'ARCADE_12' || this.gameMode === 'BOSS_RUGAL')
            ? `NIVEL ${this.currentStageNumber}/12`
            : `ASALTO ${this.roundNumber}`;

        this._beginRoundIntro(stagePrefix, `${this.fighter1.name} VS ${this.fighter2.name}`);
    }

    _beginRoundIntro(title, subtitle) {
        this.phase = GamePhase.ROUND_INTRO;
        this.phaseTimer = 95;
        this.timerSeconds = 60;
        this.projectiles = [];
        this.announcement = {
            text: title,
            subtext: subtitle,
            color: this.currentStageNumber === 12 ? '#ff0044' : '#ffbe0b'
        };
    }

    _executePauseOption(idx) {
        window.AudioSynth.play('select');
        this.isPaused = false;
        if (idx === 0) {
            return;
        }
        if (idx === 1) {
            this.openTeamSelect();
        } else if (idx === 2) {
            this.openModeSelect();
        } else if (idx === 3) {
            this.startMatch3v3();
        } else if (idx === 4) {
            this.openTitleScreen();
        }
    }

    _updatePauseMenu(p1Input, p2Input) {
        p1Input.updateFrame(this.globalFrame, 1, false);
        p2Input.updateFrame(this.globalFrame, 1, false);

        if (p1Input.pressed.up || p2Input.pressed.up) {
            this.pauseCursor = (this.pauseCursor - 1 + 5) % 5;
            window.AudioSynth.play('select');
        }
        if (p1Input.pressed.down || p2Input.pressed.down) {
            this.pauseCursor = (this.pauseCursor + 1) % 5;
            window.AudioSynth.play('select');
        }
        if (p1Input.pressed.HK || p2Input.pressed.HK) {
            this.isPaused = false;
            window.AudioSynth.play('select');
            return;
        }
        if (
            p1Input.pressed.LP ||
            p1Input.pressed.LK ||
            p1Input.pressed.HP ||
            p2Input.pressed.LP ||
            p2Input.pressed.LK ||
            p2Input.pressed.HP ||
            p1Input.startPressed ||
            p2Input.startPressed
        ) {
            this._executePauseOption(this.pauseCursor);
        }
    }

    /**
     * Paso lógico determinista de 1 frame (1/60 s).
     */
    updateFixedStep() {
        this.globalFrame++;

        // 1. Leer mandos/controles USB/Bluetooth conectados a 60 FPS (HTML5 Gamepad API)
        this.inputHandler.pollGamepads();

        // 2. Sincronizar sala Online P2P si hay partida en línea activa
        if (this.networkManager && this.networkManager.isOnline) {
            this.networkManager.syncFrame();
        }

        const p1Input = this.inputHandler.getPlayer(1);
        const p2Input = this.inputHandler.getPlayer(2);

        // Si el Menú de Pausa/Navegación está abierto, procesarlo con los mismos controles
        if (this.isPaused) {
            this._updatePauseMenu(p1Input, p2Input);
            return;
        }

        // Atajos desde el mando: SELECT o START durante combate abre el Menú de Navegación
        if (p1Input.selectPressed || p2Input.selectPressed) {
            if (this.phase === GamePhase.MODE_SELECT) {
                this.openTitleScreen();
            } else if (this.phase === GamePhase.TEAM_SELECT) {
                this.openModeSelect();
            } else if (this.phase !== GamePhase.TITLE_SCREEN) {
                this.isPaused = true;
                this.pauseCursor = 0;
                window.AudioSynth.play('select');
            }
            return;
        }

        if (this.phase === GamePhase.TITLE_SCREEN) {
            this._updateTitleScreen();
            return;
        }

        if (this.phase === GamePhase.MODE_SELECT) {
            this._updateModeSelect();
            return;
        }

        if (this.phase === GamePhase.TEAM_SELECT) {
            this._updateTeamSelect();
            return;
        }

        if (this.phase === GamePhase.STAGE_LADDER) {
            this.phaseTimer--;
            p1Input.updateFrame(this.globalFrame, 1, false);
            if (p1Input.pressed.HK) {
                this.openModeSelect();
                return;
            }
            if (this.phaseTimer <= 0 || p1Input.pressed.LP || p1Input.pressed.HP || p1Input.startPressed) {
                this.startMatch3v3();
            }
            return;
        }

        // Durante el combate activo, presionar START en el mando abre el Menú de Pausa y Navegación
        if ((p1Input.startPressed || p2Input.startPressed) && this.phase === GamePhase.FIGHTING) {
            this.isPaused = true;
            this.pauseCursor = 0;
            window.AudioSynth.play('select');
            return;
        }

        // Modo de entrenamiento: Barra de poder infinita (3 Stocks permanentes)
        if (this.infinitePowerMode && this.fighter1 && this.fighter2) {
            this.fighter1.powerGauge = 3000;
            this.fighter2.powerGauge = 3000;
        }

        if (this.screenShakeTimer > 0) {
            this.screenShakeTimer--;
        }

        // Actualizar chispas de impacto (Hitsparks) incluso durante Hitstop para máxima fluidez visual
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            this.sparks[i].frame++;
            if (this.sparks[i].frame >= this.sparks[i].maxFrames) {
                this.sparks.splice(i, 1);
            }
        }

        // IMPORTANTE (Estilo KOF 2002): Registrar siempre el buffer de direcciones y botones
        // incluso durante Hitstop y Super Freeze para que ninguna cancelación se pierda.
        if (this.phase === GamePhase.FIGHTING && this.aiController.enabled && this.hitstopTimer <= 0 && this.superFreezeTimer <= 0) {
            this.aiController.update(p2Input, this.fighter2, this.fighter1, this.globalFrame);
        }

        p1Input.updateFrame(this.globalFrame, this.fighter1 ? this.fighter1.facing : 1, false);
        p2Input.updateFrame(this.globalFrame, this.fighter2 ? this.fighter2.facing : -1, this.aiController.enabled);

        // Destello dramático de Desesperación (Super Freeze)
        if (this.superFreezeTimer > 0) {
            this.superFreezeTimer--;
            return;
        }

        // Congelamiento breve de impacto (Hitstop)
        if (this.hitstopTimer > 0) {
            this.hitstopTimer--;
            return;
        }

        if (this.phase === GamePhase.ROUND_INTRO) {
            this.phaseTimer--;
            if (this.phaseTimer > 45) {
                this.fighter1.state = window.FighterState.VICTORY;
                this.fighter2.state = window.FighterState.VICTORY;
            } else if (this.phaseTimer === 45) {
                this.fighter1.setState(window.FighterState.IDLE);
                this.fighter2.setState(window.FighterState.IDLE);
            }
            if (this.phaseTimer === 35) {
                this.announcement = {
                    text: '¡A PELEAR!',
                    subtext: this.currentStageNumber === 12 ? 'JEFE FINAL: OMEGA RUGAL' : `NIVEL ${this.currentStageNumber} DE 12`,
                    color: '#00ffc3'
                };
            }
            if (this.phaseTimer <= 0) {
                this.announcement = { text: '', subtext: '', color: '' };
                this.phase = GamePhase.FIGHTING;
            }
            this.fighter1.update(null, this.fighter2, this.globalFrame, null);
            this.fighter2.update(null, this.fighter1, this.globalFrame, null);
            return;
        }

        if (this.phase === GamePhase.FIGHTING) {
            this._updateFightingPhase(p1Input, p2Input);
            if (this.networkManager && this.networkManager.isOnline) {
                this.networkManager.syncPostFrame();
            }
            return;
        }

        if (this.phase === GamePhase.KO_TRANSITION) {
            this.fighter1.update(null, this.fighter2, this.globalFrame, null);
            this.fighter2.update(null, this.fighter1, this.globalFrame, null);
            this.phaseTimer--;
            if (this.phaseTimer <= 0) {
                this._advanceTeamElimination();
            }
            if (this.networkManager && this.networkManager.isOnline) {
                this.networkManager.syncPostFrame();
            }
            return;
        }

        if (this.phase === GamePhase.MATCH_OVER) {
            this.fighter1.update(null, this.fighter2, this.globalFrame, null);
            this.fighter2.update(null, this.fighter1, this.globalFrame, null);
            if (p1Input.pressed.HK || p2Input.pressed.HK) {
                this.openModeSelect();
                return;
            }
            if (p1Input.pressed.LP || p1Input.pressed.HP || p2Input.pressed.LP || p2Input.pressed.HP || p1Input.startPressed || p2Input.startPressed) {
                if (this.networkManager && this.networkManager.isOnline) {
                    this.networkManager.sendMatchStart();
                } else if (this.gameMode === 'ARCADE_12' && this.currentStageNumber >= 12 && this.team2Index >= 3) {
                    this.openTitleScreen();
                } else {
                    this.startArcadeStage(this.currentStageNumber);
                }
            }
        }
    }

    /**
     * Lógica de un frame de combate activo.
     */
    _updateFightingPhase(p1Input, p2Input) {
        // Reloj regresivo (1 segundo cada 60 frames)
        this.timerSeconds = Math.max(0, this.timerSeconds - 1 / 60);

        const callbacks = {
            spawnProjectile: (projOpts) => {
                this.projectiles.push(new window.Projectile(projOpts));
            },
            triggerSuperFreeze: (actor, isMax) => {
                this.superFreezeTimer = isMax ? 28 : 20;
                this.superFreezeActor = actor;
                this.superFreezeIsMax = isMax;
                this.screenShakeTimer = 14;
                this.hud.addBanner(
                    actor.playerIndex,
                    isMax ? '¡¡DESESPERACIÓN MAX!!' : '¡ATAQUE SÚPER ESPECIAL!',
                    isMax ? '#ff0055' : '#ffbe0b'
                );
            },
            addBannerEffect: (playerIndex, text, color) => {
                this.hud.addBanner(playerIndex, text, color);
            }
        };

        this.fighter1.update(p1Input, this.fighter2, this.globalFrame, callbacks);
        this.fighter2.update(p2Input, this.fighter1, this.globalFrame, callbacks);

        // Resolver empuje físico entre personajes (Pushbox) y límites del escenario
        this._resolvePushboxesAndStageBounds();

        // Actualizar proyectiles y choques entre proyectiles
        this._updateProjectiles(p1Input, p2Input);

        // Resolver impactos de ataques cuerpo a cuerpo (Hitbox vs Hurtboxes)
        this._checkMeleeHit(this.fighter1, this.fighter2, p2Input);
        this._checkMeleeHit(this.fighter2, this.fighter1, p1Input);

        // Verificar condición de K.O. o Time Over
        if (this.fighter1.hp <= 0 || this.fighter2.hp <= 0 || this.timerSeconds <= 0) {
            this._triggerKOTransition();
        }
    }

    /**
     * Evita que ambos peleadores se solapen en tierra (excepto durante Rodada / EVADE) y respeta bordes del escenario.
     */
    _resolvePushboxesAndStageBounds() {
        const minX = 44;
        const maxX = this.width - 44;

        const bothSolid =
            this.fighter1.state !== window.FighterState.EVADE &&
            this.fighter2.state !== window.FighterState.EVADE;

        if (bothSolid) {
            const box1 = this.fighter1.pushbox.getWorldRect(this.fighter1.x, this.fighter1.y, this.fighter1.facing);
            const box2 = this.fighter2.pushbox.getWorldRect(this.fighter2.x, this.fighter2.y, this.fighter2.facing);

            if (window.CollisionBox.intersects(box1, box2)) {
                const overlapX = Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x);
                if (overlapX > 0) {
                    const push = overlapX * 0.5 + 0.5;
                    if (this.fighter1.x <= this.fighter2.x) {
                        this.fighter1.x -= push;
                        this.fighter2.x += push;
                    } else {
                        this.fighter1.x += push;
                        this.fighter2.x -= push;
                    }
                }
            }
        }

        this.fighter1.x = Math.max(minX, Math.min(maxX, this.fighter1.x));
        this.fighter2.x = Math.max(minX, Math.min(maxX, this.fighter2.x));
    }

    /**
     * Comprueba si la Hitbox activa del atacante intersecta alguna Hurtbox del defensor.
     */
    _checkMeleeHit(attacker, defender, defenderInput) {
        if (!attacker.activeHitbox || attacker.moveHasConnected || defender.isInvulnerable()) {
            return;
        }

        const atkRect = attacker.activeHitbox.getWorldRect(attacker.x, attacker.y, attacker.facing);

        for (const hurtbox of defender.hurtboxes) {
            const defRect = hurtbox.getWorldRect(defender.x, defender.y, defender.facing);
            if (window.CollisionBox.intersects(atkRect, defRect)) {
                const move = attacker.currentMove;
                const isBlocked = defender.canBlockAttack(move.hitType, defenderInput);
                const totalHits = move.hits || 1;
                const isFinalHit = (attacker.moveHitsLanded + 1) >= totalHits;

                // Bonificación de daño por personaje y Modo MAX (+15%)
                const maxBoost = attacker.isMaxMode ? 1.15 : 1.0;
                const scaledDamage = Math.round(move.damage * attacker.stats.attackPower * maxBoost);

                defender.receiveAttack(
                    {
                        ...move,
                        damage: scaledDamage,
                        isFinalHit
                    },
                    isBlocked,
                    attacker.facing
                );

                attacker.notifyAttackConnected(isBlocked);

                if (attacker.lastCancelType) {
                    this.hud.addBanner(attacker.playerIndex, attacker.lastCancelType, '#00ffc3');
                    attacker.lastCancelType = '';
                }
                if (defender.lastCancelType === '¡¡GUARDIA ROTA!!') {
                    this.hud.addBanner(defender.playerIndex, '¡¡GUARDIA ROTA!!', '#ff0055');
                    defender.lastCancelType = '';
                    this.screenShakeTimer = 10;
                }
                if (!isBlocked && defender.lastCounterHitTimer === 45) {
                    this.hud.addBanner(attacker.playerIndex, '¡¡CONTRAATAQUE!!', '#ff3366');
                    this.screenShakeTimer = 9;
                }

                // Retroceso en esquina (Corner Pushback): si el defensor está en la esquina, el atacante retrocede
                if (defender.x <= 52 || defender.x >= this.width - 52) {
                    attacker.x -= (move.pushback || 3.5) * 0.9 * attacker.facing;
                }

                // Hitstop ágil estilo KOF 2002 (menor en golpes intermedios de multi-hit para máxima fluidez)
                const impactPoint = window.CollisionBox.getIntersectionCenter(atkRect, defRect);
                const isHeavyOrSpecial = scaledDamage >= 70 || attacker.state === window.FighterState.SPECIAL || attacker.state === window.FighterState.SUPER;
                this._spawnSpark(
                    impactPoint.x,
                    impactPoint.y,
                    isBlocked ? 'BLOCK' : (isHeavyOrSpecial ? 'HEAVY' : 'LIGHT'),
                    attacker.visuals?.energyColor || '#ffbe0b'
                );

                if (!isFinalHit) {
                    this.hitstopTimer = isBlocked ? 2 : 3;
                } else {
                    this.hitstopTimer = isBlocked ? 4 : (scaledDamage >= 95 ? 8 : 5);
                }

                if (!isBlocked && (scaledDamage >= 75 || attacker.state === window.FighterState.SUPER)) {
                    this.screenShakeTimer = isFinalHit ? 8 : 4;
                }
                break;
            }
        }
    }

    /**
     * Actualiza proyectiles activos, choques entre proyectiles e impactos contra personajes.
     */
    _updateProjectiles(p1Input, p2Input) {
        for (const proj of this.projectiles) {
            proj.update(this.width);
        }

        // Choque entre proyectiles de distintos jugadores
        for (let i = 0; i < this.projectiles.length; i++) {
            const pA = this.projectiles[i];
            if (!pA.active) continue;
            for (let j = i + 1; j < this.projectiles.length; j++) {
                const pB = this.projectiles[j];
                if (!pB.active || pA.ownerIndex === pB.ownerIndex) continue;

                if (window.CollisionBox.intersects(pA.getWorldHitbox(), pB.getWorldHitbox())) {
                    this._spawnSpark((pA.x + pB.x) * 0.5, (pA.y + pB.y) * 0.5, 'HEAVY');
                    if (pA.isSuper && !pB.isSuper) {
                        pB.active = false;
                    } else if (pB.isSuper && !pA.isSuper) {
                        pA.active = false;
                    } else {
                        pA.active = false;
                        pB.active = false;
                    }
                }
            }
        }

        // Impacto de proyectiles contra el peleador rival
        for (const proj of this.projectiles) {
            if (!proj.active) continue;
            const defender = proj.ownerIndex === 1 ? this.fighter2 : this.fighter1;
            const attacker = proj.ownerIndex === 1 ? this.fighter1 : this.fighter2;
            const defInput = proj.ownerIndex === 1 ? p2Input : p1Input;

            if (defender.isInvulnerable()) continue;

            const projRect = proj.getWorldHitbox();
            for (const hb of defender.hurtboxes) {
                const defRect = hb.getWorldRect(defender.x, defender.y, defender.facing);
                if (window.CollisionBox.intersects(projRect, defRect)) {
                    const isBlocked = defender.canBlockAttack('MID', defInput);
                    defender.receiveAttack(
                        {
                            damage: proj.damage,
                            chipDamage: proj.chipDamage,
                            hitstun: 18,
                            blockstun: 14,
                            pushback: 7.5,
                            causesKnockdown: proj.isSuper
                        },
                        isBlocked,
                        proj.facing
                    );
                    attacker.addPower(isBlocked ? 20 : 45);
                    this._spawnSpark(proj.x, proj.y, isBlocked ? 'BLOCK' : 'HEAVY');
                    this.hitstopTimer = isBlocked ? 4 : 7;
                    proj.active = false;
                    break;
                }
            }
        }

        this.projectiles = this.projectiles.filter(p => p.active);
    }

    /**
     * Inicia la secuencia de K.O. o fin de tiempo.
     */
    _triggerKOTransition() {
        this.phase = GamePhase.KO_TRANSITION;
        this.phaseTimer = 115;
        this.projectiles = [];

        if (this.timerSeconds <= 0 && this.fighter1.hp > 0 && this.fighter2.hp > 0) {
            if (this.fighter1.hp >= this.fighter2.hp) {
                this.fighter2.hp = 0;
                this.fighter2.setState(window.FighterState.KO);
                this.fighter1.setState(window.FighterState.VICTORY);
            } else {
                this.fighter1.hp = 0;
                this.fighter1.setState(window.FighterState.KO);
                this.fighter2.setState(window.FighterState.VICTORY);
            }
            this.announcement = { text: '¡TIEMPO AGOTADO!', subtext: '', color: '#ff3366' };
        } else {
            if (this.fighter1.hp > 0 && this.fighter2.hp <= 0) {
                this.fighter1.setState(window.FighterState.VICTORY);
            } else if (this.fighter2.hp > 0 && this.fighter1.hp <= 0) {
                this.fighter2.setState(window.FighterState.VICTORY);
            }
            this.announcement = { text: '¡¡K.O.!!', subtext: '', color: '#ff3366' };
        }
    }

    /**
     * Sistema de Eliminación por Equipos 3 vs 3 (Estilo KOF 2002):
     * El ganador permanece en el escenario conservando su vida restante (+ pequeña recuperación de 12% HP)
     * y su Barra de Poder, mientras entra el siguiente miembro del equipo derrotado.
     */
    _advanceTeamElimination() {
        const p1Dead = this.fighter1.hp <= 0;
        const p2Dead = this.fighter2.hp <= 0;

        if (p1Dead) {
            this.team1Index++;
            this.hud.p2Wins++;
            this.hud.p2Score += 5000;
        }
        if (p2Dead) {
            this.team2Index++;
            this.hud.p1Wins++;
            this.hud.p1Score += 5000;
        }

        // Verificar si algún equipo perdió a sus 3 integrantes
        if (this.team1Index >= 3 || this.team2Index >= 3) {
            const p1Won = this.team2Index >= 3;

            // Si estamos en el Torneo Arcade de 12 Niveles y ganó el Jugador 1
            if (p1Won && this.gameMode === 'ARCADE_12' && this.currentStageNumber < 12) {
                this.currentStageNumber++;
                this.startArcadeStage(this.currentStageNumber);
                return;
            }

            this.phase = GamePhase.MATCH_OVER;
            if (p1Won) {
                this.fighter1.setState(window.FighterState.VICTORY);
                window.AudioSynth.playBGM('victory');
            } else {
                this.fighter2.setState(window.FighterState.VICTORY);
            }

            if (p1Won && (this.gameMode === 'ARCADE_12' || this.gameMode === 'BOSS_RUGAL') && this.currentStageNumber >= 12) {
                this.announcement = {
                    text: '¡¡OMEGA RUGAL DERROTADO!!',
                    subtext: '¡CAMPEÓN DE AZTLAN! (U/START: JUGAR DE NUEVO • P/ESC: MODOS)',
                    color: '#ffea00'
                };
            } else {
                this.announcement = {
                    text: p1Won ? `¡NIVEL ${this.currentStageNumber} SUPERADO! ¡GANASTE!` : 'DERROTA — ¿CONTINUAR?',
                    subtext: 'U/START: REINTENTAR  •  P/ESC/SELECT: VOLVER AL MENÚ DE MODOS',
                    color: p1Won ? '#00ffc3' : '#ff3366'
                };
            }
            return;
        }

        this.roundNumber++;

        // Si el Jugador 1 cayó, entra su siguiente miembro heredando la Barra de Poder
        if (p1Dead) {
            const carriedPower = Math.min(3000, this.fighter1.powerGauge + 500);
            this.fighter1 = new window.Fighter({
                playerIndex: 1,
                template: this.team1[this.team1Index],
                x: this.width * 0.26,
                groundY: this.groundY,
                facing: 1,
                initialPower: carriedPower
            });
            // El ganador (P2) recupera una pequeña fracción de salud estilo KOF y vuelve a su posición
            this.fighter2.hp = Math.min(this.fighter2.maxHp, Math.round(this.fighter2.hp + this.fighter2.maxHp * 0.12));
            this.fighter2.recoverableRedHp = this.fighter2.hp;
            this.fighter2.x = this.width * 0.74;
            this.fighter2.y = this.groundY;
            this.fighter2.setState(window.FighterState.IDLE);
        }

        // Si el Jugador 2 cayó, entra su siguiente miembro heredando la Barra de Poder
        if (p2Dead) {
            const carriedPower = Math.min(3000, this.fighter2.powerGauge + 500);
            this.fighter2 = new window.Fighter({
                playerIndex: 2,
                template: this.team2[this.team2Index],
                x: this.width * 0.74,
                groundY: this.groundY,
                facing: -1,
                initialPower: this.team2[this.team2Index].isBoss ? 3000 : carriedPower
            });
            this.fighter1.hp = Math.min(this.fighter1.maxHp, Math.round(this.fighter1.hp + this.fighter1.maxHp * 0.12));
            this.fighter1.recoverableRedHp = this.fighter1.hp;
            this.fighter1.x = this.width * 0.26;
            this.fighter1.y = this.groundY;
            this.fighter1.setState(window.FighterState.IDLE);
        }

        this._beginRoundIntro(
            this.fighter2.template.isBoss ? '¡ALERTA: ENTRA OMEGA RUGAL!' : '¡SIGUIENTE RETADOR!',
            `${this.fighter1.name} (${this.team1Index + 1}/3)  VS  ${this.fighter2.name} (${this.team2Index + 1}/3)`
        );
    }

    /**
     * Lógica de la Pantalla de Título ("TITLE_SCREEN").
     */
    _updateTitleScreen() {
        const p1 = this.inputHandler.getPlayer(1);
        const p2 = this.inputHandler.getPlayer(2);
        p1.updateFrame(this.globalFrame, 1, false);
        p2.updateFrame(this.globalFrame, 1, false);

        if (
            p1.startPressed ||
            p2.startPressed ||
            p1.pressed.LP ||
            p1.pressed.LK ||
            p1.pressed.HP ||
            p1.pressed.HK
        ) {
            this.openModeSelect();
        }
    }

    /**
     * Lógica de Selección de Modo ("MODE_SELECT").
     */
    _updateModeSelect() {
        const p1 = this.inputHandler.getPlayer(1);
        const p2 = this.inputHandler.getPlayer(2);
        p1.updateFrame(this.globalFrame, 1, false);
        p2.updateFrame(this.globalFrame, 1, false);

        // Botón Atrás (P / HK en teclado o B / Círculo en mando) regresa a la Pantalla de Título
        if (p1.pressed.HK || p2.pressed.HK) {
            window.AudioSynth.play('select');
            this.openTitleScreen();
            return;
        }

        if (p1.pressed.up || p2.pressed.up) {
            this.modeCursor = (this.modeCursor - 1 + 4) % 4;
            window.AudioSynth.play('select');
        }
        if (p1.pressed.down || p2.pressed.down) {
            this.modeCursor = (this.modeCursor + 1) % 4;
            window.AudioSynth.play('select');
        }

        if (
            p1.startPressed ||
            p2.startPressed ||
            p1.pressed.LP ||
            p1.pressed.LK ||
            p1.pressed.HP
        ) {
            this._confirmModeSelection(this.modeCursor);
        }
    }

    _confirmModeSelection(modeIdx) {
        this.modeCursor = modeIdx;
        if (modeIdx === 0) {
            this.gameMode = 'ARCADE_12';
            this.currentStageNumber = 1;
            this.aiController.enabled = true;
        } else if (modeIdx === 1) {
            this.gameMode = 'FREE_3V3';
            this.currentStageNumber = 1;
            this.aiController.enabled = true;
        } else if (modeIdx === 2) {
            this.gameMode = 'VERSUS_2P';
            this.currentStageNumber = 1;
            this.aiController.enabled = false;
        } else {
            this.gameMode = 'BOSS_RUGAL';
            this.currentStageNumber = 12;
            this.aiController.enabled = true;
        }
        window.AudioSynth.play('super');
        this.openTeamSelect();
    }

    /**
     * Calcula el nuevo índice de cursor al moverse en la cuadrícula de 42 personajes.
     */
    _moveGridCursor(cur, dir) {
        if (dir === 'left') {
            if (cur < 33) {
                const col = Math.floor(cur / 3);
                const row = cur % 3;
                return ((col - 1 + 11) % 11) * 3 + row;
            }
            return 33 + (((cur - 33) - 1 + 9) % 9);
        }
        if (dir === 'right') {
            if (cur < 33) {
                const col = Math.floor(cur / 3);
                const row = cur % 3;
                return ((col + 1) % 11) * 3 + row;
            }
            return 33 + (((cur - 33) + 1) % 9);
        }
        if (dir === 'up') {
            if (cur < 33) {
                const col = Math.floor(cur / 3);
                const row = cur % 3;
                return row > 0 ? col * 3 + (row - 1) : 33 + Math.min(8, col);
            }
            return (cur - 33) * 3 + 2;
        }
        if (dir === 'down') {
            if (cur < 33) {
                const col = Math.floor(cur / 3);
                const row = cur % 3;
                return row < 2 ? col * 3 + (row + 1) : 33 + Math.min(8, col);
            }
            return (cur - 33) * 3;
        }
        return cur;
    }

    /**
     * Quita el último personaje seleccionado o regresa a Modos de Pelea si el equipo está vacío.
     */
    _handleTeamSelectBack() {
        window.AudioSynth.play('select');
        const isOnline = Boolean(this.networkManager && this.networkManager.isOnline);
        if (isOnline) {
            if (this.networkManager.role === 'HOST') {
                if (this.team1.length > 0) {
                    this.team1.pop();
                    this.networkManager.sendTeamUpdate();
                }
            } else {
                if (this.team2.length > 0) {
                    this.team2.pop();
                    this.networkManager.sendTeamUpdate();
                }
            }
            return;
        }

        if (this.team2.length > 0 && this.gameMode !== 'ARCADE_12' && this.gameMode !== 'BOSS_RUGAL') {
            this.team2.pop();
        } else if (this.team1.length > 0) {
            this.team1.pop();
        } else {
            this.openModeSelect();
        }
    }

    /**
     * Navegación 2D por teclado y mando (Gamepad) en la pantalla de Selección de Equipos (42 personajes).
     */
    _updateTeamSelect() {
        const p1 = this.inputHandler.getPlayer(1);
        const p2 = this.inputHandler.getPlayer(2);
        p1.updateFrame(this.globalFrame, 1, false);
        p2.updateFrame(this.globalFrame, 1, false);

        const isOnline = Boolean(this.networkManager && this.networkManager.isOnline);

        if (p1.startPressed || p2.startPressed) {
            window.AudioSynth.play('super');
            if (isOnline) {
                this.networkManager.sendMatchStart();
            } else {
                this.startArcadeStage(this.currentStageNumber);
            }
            return;
        }

        // Botón Atrás (P / HK en teclado o B / Círculo en mando): quita último personaje o regresa a Modos
        if (p1.pressed.HK || p2.pressed.HK) {
            this._handleTeamSelectBack();
            return;
        }

        if (isOnline) {
            // En modo Online P2P, cada jugador mueve su propio cursor (HOST = P1, GUEST = P2)
            const isHost = this.networkManager.role === 'HOST';
            const localInput = isHost ? p1 : p2;
            let cur = isHost ? this.selectCursor : this.selectCursorP2;
            let moved = false;

            if (localInput.pressed.left) { cur = this._moveGridCursor(cur, 'left'); moved = true; }
            if (localInput.pressed.right) { cur = this._moveGridCursor(cur, 'right'); moved = true; }
            if (localInput.pressed.up) { cur = this._moveGridCursor(cur, 'up'); moved = true; }
            if (localInput.pressed.down) { cur = this._moveGridCursor(cur, 'down'); moved = true; }

            if (moved) {
                if (isHost) this.selectCursor = cur;
                else this.selectCursorP2 = cur;
                window.AudioSynth.play('select');
            }

            if (localInput.pressed.LP || localInput.pressed.LK || localInput.pressed.HP) {
                this._selectCharacterAtCursor(cur);
            }
            return;
        }

        // Navegación local (1P / 2P en la misma PC)
        let moved = false;
        if (p1.pressed.left || p2.pressed.left) {
            this.selectCursor = this._moveGridCursor(this.selectCursor, 'left');
            moved = true;
        }
        if (p1.pressed.right || p2.pressed.right) {
            this.selectCursor = this._moveGridCursor(this.selectCursor, 'right');
            moved = true;
        }
        if (p1.pressed.up || p2.pressed.up) {
            this.selectCursor = this._moveGridCursor(this.selectCursor, 'up');
            moved = true;
        }
        if (p1.pressed.down || p2.pressed.down) {
            this.selectCursor = this._moveGridCursor(this.selectCursor, 'down');
            moved = true;
        }
        if (moved) {
            window.AudioSynth.play('select');
        }

        if (p1.pressed.LP || p1.pressed.LK || p1.pressed.HP || p2.pressed.LP || p2.pressed.LK || p2.pressed.HP) {
            this._selectCharacterAtCursor(this.selectCursor);
        }
    }

    /**
     * Selecciona los 3 integrantes de un Equipo Oficial KOF al hacer clic en su insignia de columna.
     */
    _selectOfficialTeam(teamCol) {
        const baseIdx = teamCol * 3;
        const members = [this.roster[baseIdx], this.roster[baseIdx + 1], this.roster[baseIdx + 2]].filter(Boolean);
        if (members.length < 3) return;

        const isOnline = Boolean(this.networkManager && this.networkManager.isOnline);
        window.AudioSynth.play('super');

        if (isOnline) {
            if (this.networkManager.role === 'HOST') {
                this.team1 = [...members];
                this.selectCursor = baseIdx;
                this.networkManager.sendTeamUpdate();
                if (this.team1.length === 3 && this.team2.length === 3) {
                    this.networkManager.sendMatchStart();
                }
            } else {
                this.team2 = [...members];
                this.selectCursorP2 = baseIdx;
                this.networkManager.sendTeamUpdate();
                if (this.team1.length === 3 && this.team2.length === 3) {
                    this.networkManager.sendMatchStart();
                }
            }
            return;
        }

        const isArcade12 = this.gameMode === 'ARCADE_12' || this.gameMode === 'BOSS_RUGAL';

        if (this.team1.length < 3) {
            this.team1 = [...members];
            this.selectCursor = baseIdx;
            if (isArcade12) {
                this.startArcadeStage(this.currentStageNumber);
            }
        } else if (!isArcade12 && this.team2.length < 3) {
            this.team2 = [...members];
            this.selectCursor = baseIdx;
            this.startArcadeStage(this.currentStageNumber);
        } else {
            this.team1 = [...members];
            this.selectCursor = baseIdx;
        }
    }

    _selectCharacterAtCursor(index) {
        const chosen = this.roster[index];
        if (!chosen) return;

        const isOnline = Boolean(this.networkManager && this.networkManager.isOnline);
        window.AudioSynth.play('select');

        if (isOnline) {
            if (this.networkManager.role === 'HOST') {
                this.selectCursor = index;
                if (this.team1.length < 3 && !this.team1.some(c => c.id === chosen.id)) {
                    this.team1.push(chosen);
                    this.networkManager.sendTeamUpdate();
                    if (this.team1.length === 3 && this.team2.length === 3) {
                        window.AudioSynth.play('super');
                        this.networkManager.sendMatchStart();
                    }
                }
            } else {
                this.selectCursorP2 = index;
                if (this.team2.length < 3 && !this.team2.some(c => c.id === chosen.id)) {
                    this.team2.push(chosen);
                    this.networkManager.sendTeamUpdate();
                    if (this.team1.length === 3 && this.team2.length === 3) {
                        window.AudioSynth.play('super');
                        this.networkManager.sendMatchStart();
                    }
                }
            }
            return;
        }

        const isArcade12 = this.gameMode === 'ARCADE_12' || this.gameMode === 'BOSS_RUGAL';

        if (this.team1.length < 3) {
            if (!this.team1.some(c => c.id === chosen.id)) {
                this.team1.push(chosen);
                // En Modo Arcade de 12 niveles, al elegir el 3er personaje inicia de inmediato el Nivel 1 (o 12)
                if (isArcade12 && this.team1.length === 3) {
                    window.AudioSynth.play('super');
                    this.startArcadeStage(this.currentStageNumber);
                }
            }
        } else if (!isArcade12 && this.team2.length < 3) {
            if (!this.team2.some(c => c.id === chosen.id)) {
                this.team2.push(chosen);
                if (this.team2.length === 3) {
                    window.AudioSynth.play('super');
                    this.startArcadeStage(this.currentStageNumber);
                }
            }
        } else {
            this.startArcadeStage(this.currentStageNumber);
        }
    }

    _bindMenuKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Al presionar cualquier tecla por primera vez en la pantalla de título, iniciar la música
            if (this.phase === GamePhase.TITLE_SCREEN && window.AudioSynth.currentTrack !== 'title') {
                window.AudioSynth.playBGM('title');
            }

            // Teclas Escape o Backspace para regresar o abrir el Menú de Navegación
            if (e.code === 'Escape' || e.code === 'Backspace') {
                e.preventDefault();
                if (this.isPaused) {
                    this.isPaused = false;
                    window.AudioSynth.play('select');
                    return;
                }
                if (this.phase === GamePhase.MODE_SELECT) {
                    this.openTitleScreen();
                } else if (this.phase === GamePhase.TEAM_SELECT) {
                    if (e.code === 'Escape') {
                        this.openModeSelect();
                    } else {
                        this._handleTeamSelectBack();
                    }
                } else if (this.phase !== GamePhase.TITLE_SCREEN) {
                    this.isPaused = true;
                    this.pauseCursor = 0;
                    window.AudioSynth.play('select');
                }
                return;
            }

            if (e.code === 'Enter' || e.code === 'Space') {
                if (this.isPaused) {
                    this._executePauseOption(this.pauseCursor);
                    return;
                }
                if (this.phase === GamePhase.TITLE_SCREEN) {
                    this.openModeSelect();
                } else if (this.phase === GamePhase.MODE_SELECT) {
                    this._confirmModeSelection(this.modeCursor);
                } else if (this.phase === GamePhase.TEAM_SELECT) {
                    if (this.networkManager && this.networkManager.isOnline) {
                        this.networkManager.sendMatchStart();
                    } else {
                        this.startArcadeStage(this.currentStageNumber);
                    }
                } else if (this.phase === GamePhase.STAGE_LADDER) {
                    this.startMatch3v3();
                }
            }
        });
    }

    _bindCanvasMouseEvents() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            // Si el Menú de Pausa / Navegación está abierto, permitir clic en cualquiera de sus 5 opciones
            if (this.isPaused) {
                const cx = this.width * 0.5;
                const modalH = 340;
                const modalTop = Math.floor((this.height - modalH) * 0.5);
                const btnW = 472;
                const btnH = 40;
                const startY = modalTop + 82;
                const gap = 10;
                for (let i = 0; i < 5; i++) {
                    const bx = cx - btnW * 0.5;
                    const by = startY + i * (btnH + gap);
                    if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
                        this._executePauseOption(i);
                        return;
                    }
                }
                return;
            }

            if (this.phase === GamePhase.TITLE_SCREEN) {
                this.openModeSelect();
                return;
            }

            if (this.phase === GamePhase.MODE_SELECT) {
                // Clic en botón superior izquierdo "◄ INICIO (ESC / P)"
                if (mx >= 26 && mx <= 212 && my >= 22 && my <= 58) {
                    window.AudioSynth.play('select');
                    this.openTitleScreen();
                    return;
                }

                const cx = this.width * 0.5;
                const boxW = 720;
                const boxH = 74;
                const startY = 122;
                const gap = 18;
                for (let i = 0; i < 4; i++) {
                    const bx = cx - boxW * 0.5;
                    const by = startY + i * (boxH + gap);
                    if (mx >= bx && mx <= bx + boxW && my >= by && my <= by + boxH) {
                        this._confirmModeSelection(i);
                        return;
                    }
                }
                return;
            }

            if (this.phase === GamePhase.STAGE_LADDER) {
                this.startMatch3v3();
                return;
            }

            // En cualquier fase de combate, clic en el botón inferior central "☰ MENÚ (ESC/START)" abre el menú de navegación
            if (
                (this.phase === GamePhase.FIGHTING || this.phase === GamePhase.ROUND_INTRO || this.phase === GamePhase.KO_TRANSITION || this.phase === GamePhase.MATCH_OVER) &&
                mx >= this.width * 0.5 - 78 &&
                mx <= this.width * 0.5 + 78 &&
                my >= this.height - 28 &&
                my <= this.height
            ) {
                this.isPaused = true;
                this.pauseCursor = 0;
                window.AudioSynth.play('select');
                return;
            }

            if (this.phase === GamePhase.MATCH_OVER) {
                if (this.networkManager && this.networkManager.isOnline) {
                    this.networkManager.sendMatchStart();
                    return;
                }
                if (this.gameMode === 'ARCADE_12' && this.currentStageNumber >= 12 && this.team2Index >= 3) {
                    this.openTitleScreen();
                } else {
                    this.startArcadeStage(this.currentStageNumber);
                }
                return;
            }

            if (this.phase !== GamePhase.TEAM_SELECT) return;

            // 1. Verificar clic en cualquiera de las 11 insignias de Equipos Oficiales (selecciona el equipo completo de 3)
            for (let col = 0; col < 11; col++) {
                const hdr = this.hud.getOfficialTeamHeaderRect(col);
                if (mx >= hdr.x && mx <= hdr.x + hdr.w && my >= hdr.y && my <= hdr.y + hdr.h) {
                    this._selectOfficialTeam(col);
                    return;
                }
            }

            // 2. Verificar clic en las 42 celdas del roster de personajes
            for (let i = 0; i < this.roster.length; i++) {
                const slot = this.hud.getCharacterSlotRect(i);
                if (mx >= slot.x && mx <= slot.x + slot.w && my >= slot.y && my <= slot.y + slot.h) {
                    if (this.networkManager && this.networkManager.isOnline && this.networkManager.role === 'GUEST') {
                        this.selectCursorP2 = i;
                    } else {
                        this.selectCursor = i;
                    }
                    this._selectCharacterAtCursor(i);
                    return;
                }
            }

            // 3. Verificar clic en el botón "¡PELEAR!" (x: 320..452, y: 474..514)
            if (mx >= 320 && mx <= 452 && my >= 474 && my <= 514) {
                window.AudioSynth.play('super');
                if (this.networkManager && this.networkManager.isOnline) {
                    this.networkManager.sendMatchStart();
                } else {
                    this.startArcadeStage(this.currentStageNumber);
                }
                return;
            }

            // 4. Verificar clic en el botón "LIMPIAR" (x: 460..544, y: 474..514)
            if (mx >= 460 && mx <= 544 && my >= 474 && my <= 514) {
                window.AudioSynth.play('select');
                if (this.networkManager && this.networkManager.isOnline) {
                    if (this.networkManager.role === 'HOST') {
                        this.team1 = [];
                    } else {
                        this.team2 = [];
                    }
                    this.networkManager.sendClearTeam();
                } else {
                    this.team1 = [];
                    this.team2 = [];
                }
                return;
            }

            // 5. Verificar clic en el botón "◄ MODOS" (x: 552..640, y: 474..514)
            if (mx >= 552 && mx <= 640 && my >= 474 && my <= 514) {
                window.AudioSynth.play('select');
                this.openModeSelect();
                return;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.phase !== GamePhase.TEAM_SELECT) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            for (let i = 0; i < this.roster.length; i++) {
                const slot = this.hud.getCharacterSlotRect(i);
                if (mx >= slot.x && mx <= slot.x + slot.w && my >= slot.y && my <= slot.y + slot.h) {
                    if (this.networkManager && this.networkManager.isOnline && this.networkManager.role === 'GUEST') {
                        this.selectCursorP2 = i;
                    } else {
                        this.selectCursor = i;
                    }
                    return;
                }
            }
        });
    }

    _spawnSpark(x, y, type, color = '#ffbe0b') {
        this.sparks.push({
            x,
            y,
            type,
            color,
            frame: 0,
            maxFrames: type === 'HEAVY' ? 14 : 10
        });
    }

    /**
     * Renderizado principal a 60 FPS en el Canvas.
     */
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (this.phase === GamePhase.TITLE_SCREEN) {
            this.hud.drawTitleScreen(ctx, this.globalFrame);
            return;
        }

        if (this.phase === GamePhase.MODE_SELECT) {
            this.hud.drawModeSelectScreen(ctx, this.modeCursor, this.globalFrame);
            return;
        }

        if (this.phase === GamePhase.TEAM_SELECT) {
            const isOnline = Boolean(this.networkManager && this.networkManager.isOnline);
            const activePreviewIdx = (isOnline && this.networkManager.role === 'GUEST')
                ? this.selectCursorP2
                : this.selectCursor;
            this.hud.drawTeamSelectScreen(ctx, {
                roster: this.roster,
                team1: this.team1,
                team2: this.team2,
                cursorIndex: activePreviewIdx,
                p1Cursor: this.selectCursor,
                p2Cursor: isOnline ? this.selectCursorP2 : null,
                isOnline,
                onlineRole: isOnline ? this.networkManager.role : null,
                roomCode: isOnline ? this.networkManager.roomCode : '',
                gameMode: this.gameMode
            });
            return;
        }

        if (this.phase === GamePhase.STAGE_LADDER) {
            const stages = window.ARCADE_12_STAGES || [];
            const stageCfg = stages[Math.max(0, Math.min(stages.length - 1, this.currentStageNumber - 1))] || {
                name: `NIVEL ${this.currentStageNumber}`
            };
            this.hud.drawStageLadderScreen(ctx, {
                stageNumber: this.currentStageNumber,
                stageConfig: stageCfg,
                team1: this.team1,
                team2: this.team2
            });
            if (this.isPaused) {
                this.hud.drawPauseMenuOverlay(ctx, this.pauseCursor);
            }
            return;
        }

        ctx.save();

        // Sacudida de cámara (Screen Shake) en golpes pesados o Desesperaciones
        if (this.screenShakeTimer > 0) {
            const dx = (Math.random() - 0.5) * 8;
            const dy = (Math.random() - 0.5) * 8;
            ctx.translate(dx, dy);
        }

        // 1. Escenario del Templo de Aztlán (o Altar Carmesí de Omega Rugal en el Nivel 12)
        this._drawAztlanStage(ctx);

        // 2. Oscurecimiento dramático si hay Super Freeze activo
        if (this.superFreezeTimer > 0 && this.superFreezeActor) {
            ctx.fillStyle = 'rgba(4, 6, 18, 0.76)';
            ctx.fillRect(0, 0, this.width, this.height);

            const ax = this.superFreezeActor.x;
            const ay = this.superFreezeActor.y - 115;
            const radius = (30 - this.superFreezeTimer) * 9;
            ctx.strokeStyle = this.superFreezeIsMax ? '#ff0055' : '#00ffc3';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(ax, ay, Math.max(10, radius), 0, Math.PI * 2);
            ctx.stroke();
        }

        // 3. Peleadores Activos
        if (this.fighter1 && this.fighter2) {
            this.fighter1.draw(ctx, this.showCollisionBoxes);
            this.fighter2.draw(ctx, this.showCollisionBoxes);
        }

        // 4. Proyectiles
        for (const proj of this.projectiles) {
            proj.draw(ctx, this.showCollisionBoxes);
        }

        // 5. Chispas de Impacto / Bloqueo (Hitsparks)
        this._drawSparks(ctx);

        ctx.restore();

        // 6. Interfaz de Usuario Superior e Inferior (HUD KOF 2002)
        if (this.fighter1 && this.fighter2) {
            this.hud.drawCombatHUD(ctx, {
                fighter1: this.fighter1,
                fighter2: this.fighter2,
                team1: this.team1,
                team2: this.team2,
                team1Index: this.team1Index,
                team2Index: this.team2Index,
                timerSeconds: this.timerSeconds,
                roundNumber: this.roundNumber,
                currentStageNumber: this.currentStageNumber,
                announcement: this.announcement
            });
        }

        // 7. Menú de Pausa y Navegación superpuesto si está activo
        if (this.isPaused) {
            this.hud.drawPauseMenuOverlay(ctx, this.pauseCursor);
        }
    }

    /**
     * Renderiza el escenario Pixel-Art de "THE KING OF AZTLAN" inspirado en la estética Neo-Geo:
     * Cielo nocturno azulado (o carmesí oscuro en el Nivel 12 de Omega Rugal), torre iluminada,
     * banderines ceremoniales diagonales, barandal encendido con espectadores animados y piso de jade húmedo.
     */
    _drawAztlanStage(ctx) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        const p = 4; // Tamaño de bloque pixel-art (4x4 px)
        const horizonY = this.groundY - 120;
        const isBossStage = this.currentStageNumber === 12;

        // 1. Cielo nocturno en bandas de píxeles (Carmesí Imperial en el Nivel 12 de Omega Rugal)
        const skyBands = isBossStage
            ? ['#240610', '#380a18', '#4d0f22', '#64142c', '#7a1b38', '#4d0f22']
            : ['#242854', '#2e3468', '#3a427c', '#485294', '#5862a8', '#444c88'];
        const bandH = Math.ceil(horizonY / skyBands.length / p) * p;
        for (let i = 0; i < skyBands.length; i++) {
            ctx.fillStyle = skyBands[i];
            ctx.fillRect(0, i * bandH, this.width, bandH);
        }

        // Nubes pixeladas horizontales
        ctx.fillStyle = '#6874b8';
        ctx.fillRect(140, 96, 220, 12);
        ctx.fillRect(172, 88, 148, 8);
        ctx.fillRect(520, 116, 260, 12);
        ctx.fillRect(560, 108, 180, 8);

        // 2. Gran Torre de Aztlán a la izquierda con ventanas verde esmeralda encendidas (como el rascacielos de la referencia)
        const towerX = 28;
        const towerY = 12;
        const towerW = 112;
        const towerH = horizonY - towerY;
        ctx.fillStyle = '#182438';
        ctx.fillRect(towerX, towerY, towerW, towerH);
        ctx.fillStyle = '#243850';
        ctx.fillRect(towerX + 4, towerY, 12, towerH);

        // Ventanas pixeladas iluminadas de la torre
        for (let wy = towerY + 12; wy < horizonY - 16; wy += 12) {
            for (let wx = towerX + 12; wx < towerX + towerW - 12; wx += 16) {
                if ((wx + wy) % 24 !== 0) {
                    ctx.fillStyle = (wx * wy) % 7 === 0 ? '#9efcd0' : '#38b080';
                    ctx.fillRect(wx, wy, 8, 4);
                }
            }
        }

        // 3. Templos y edificios escalonados en el horizonte
        const buildings = [
            { x: 380, w: 76, h: 112, c: '#383852' },
            { x: 464, w: 92, h: 124, c: '#444460' },
            { x: 564, w: 84, h: 104, c: '#34344c' },
            { x: 656, w: 108, h: 120, c: '#444460' },
            { x: 772, w: 128, h: 108, c: '#383852' }
        ];
        for (const b of buildings) {
            const by = horizonY - b.h;
            ctx.fillStyle = b.c;
            ctx.fillRect(b.x, by, b.w, b.h);
            ctx.fillStyle = '#242438';
            ctx.fillRect(b.x + b.w - 12, by, 12, b.h);
            // Ventanas ámbar
            for (let wy = by + 12; wy < horizonY - 20; wy += 16) {
                for (let wx = b.x + 8; wx < b.x + b.w - 16; wx += 16) {
                    ctx.fillStyle = (wx + wy) % 32 === 0 ? '#ffbe0b' : '#202030';
                    ctx.fillRect(wx, wy, 8, 4);
                }
            }
        }

        // Puente iluminado al fondo con farolas naranjas
        ctx.fillStyle = '#28243c';
        ctx.fillRect(0, horizonY - 28, this.width, 28);
        for (let lx = 24; lx < this.width; lx += 64) {
            ctx.fillStyle = '#ff9e00';
            ctx.fillRect(lx, horizonY - 36, 8, 8);
            ctx.fillStyle = '#ffea00';
            ctx.fillRect(lx + 2, horizonY - 34, 4, 4);
        }

        // 4. Cuerdas diagonales con banderines ceremoniales ondeando en el cielo
        const flagColors = ['#ffbe0b', '#00d68f', '#ffffff', '#ff3366', '#38b6ff', '#ff7b00'];
        const wave = Math.floor(this.globalFrame / 10) % 2 === 0 ? 0 : 4;
        for (let i = 0; i < 6; i++) {
            const fx1 = 310 + i * 78;
            const fy1 = 44 + i * 48;
            ctx.fillStyle = '#181828';
            ctx.fillRect(fx1 - 12, fy1 - 8, 16, 4);
            ctx.fillStyle = flagColors[i % flagColors.length];
            ctx.fillRect(fx1, fy1, 24, 16 + wave);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(fx1 + 8, fy1 + 4, 8, 8);

            const fx2 = 540 + i * 74;
            const fy2 = 36 + i * 44;
            ctx.fillStyle = flagColors[(i + 2) % flagColors.length];
            ctx.fillRect(fx2, fy2, 24, 16 - wave);
        }

        // 5. Espectadores Pixel-Art animados detrás del barandal (animando la pelea)
        const railTopY = this.groundY - 96;
        window.PixelArtRendererClass.drawSpectator(ctx, 224, this.groundY - 12, this.globalFrame, '#181824', '#2b3248', '#d99b66', 0);
        window.PixelArtRendererClass.drawSpectator(ctx, 326, this.groundY - 8, this.globalFrame, '#162848', '#d99b66', '#c68652', 7);
        window.PixelArtRendererClass.drawSpectator(ctx, 616, this.groundY - 14, this.globalFrame, '#203864', '#8d99ae', '#c68652', 4);
        window.PixelArtRendererClass.drawSpectator(ctx, 684, this.groundY - 4, this.globalFrame, '#7f8c8d', '#2b2d42', '#d99b66', 11);

        // 6. Barandal iluminado con luces naranjas/doradas (idéntico al muelle/terraza de la imagen)
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(0, railTopY, this.width, 8);
        ctx.fillRect(0, this.groundY - 12, this.width, 8);
        ctx.fillStyle = '#ffbe0b';
        ctx.fillRect(0, railTopY + 2, this.width, 4);

        for (let rx = 8; rx < this.width; rx += 32) {
            ctx.fillStyle = '#9a3412';
            ctx.fillRect(rx, railTopY + 8, 8, 76);
            ctx.fillStyle = '#ff9e00';
            ctx.fillRect(rx + 2, railTopY + 12, 4, 68);
            // Eslabones decorativos entre postes
            ctx.fillStyle = '#64748b';
            ctx.fillRect(rx + 12, railTopY + 20, 12, 44);
            ctx.fillStyle = '#1e2436';
            ctx.fillRect(rx + 15, railTopY + 26, 6, 32);
        }

        // 7. Piso de piedra de jade húmedo con reflejos pixelados
        const floorH = this.height - this.groundY;
        ctx.fillStyle = '#20545c';
        ctx.fillRect(0, this.groundY, this.width, floorH);

        // Bandas horizontales de reflejo pixelado en el suelo
        for (let fy = this.groundY + 4; fy < this.height; fy += 8) {
            ctx.fillStyle = ((fy - this.groundY) / 8) % 2 === 0 ? '#2c6c74' : '#184048';
            ctx.fillRect(0, fy, this.width, 4);
        }

        // Brillos naranjas reflejados del barandal sobre el suelo húmedo
        for (let rx = 20; rx < this.width; rx += 64) {
            ctx.fillStyle = 'rgba(255, 180, 0, 0.25)';
            ctx.fillRect(rx, this.groundY + 4, 24, 8);
        }

        // 8. Ruedas de piedra / braseros apilados con cuerda en la esquina derecha (como los neumáticos/cuerda de la captura)
        const propX = this.width - 230;
        const propY = this.groundY - 56;
        for (let tier = 0; tier < 3; tier++) {
            const ty = propY + tier * 20;
            const tx = propX + (tier % 2 === 0 ? 0 : 8);
            ctx.fillStyle = '#5c1810';
            ctx.fillRect(tx, ty, 108, 20);
            ctx.fillStyle = '#8c2818';
            ctx.fillRect(tx + 4, ty + 4, 100, 12);
            ctx.fillStyle = '#b83c20';
            for (let gx = tx + 10; gx < tx + 98; gx += 12) {
                ctx.fillRect(gx, ty + 4, 6, 12);
            }
        }
        // Cuerda gris pixelada en el suelo
        ctx.fillStyle = '#64748b';
        ctx.fillRect(propX - 32, this.groundY + 12, 88, 6);
        ctx.fillRect(propX + 48, this.groundY + 18, 64, 6);
    }

    _drawSparks(ctx) {
        const p = 4;
        for (const s of this.sparks) {
            const snapX = Math.round(s.x / p) * p;
            const snapY = Math.round(s.y / p) * p;
            const step = s.frame;

            if (s.type === 'BLOCK') {
                // Escudo de guardia KOF 2002: destello octagonal azul cian + cruz blanca
                const r = (step + 2) * p;
                ctx.fillStyle = '#00f5ff';
                ctx.fillRect(snapX - r * 1.3, snapY - p, r * 2.6, p * 2);
                ctx.fillRect(snapX - p, snapY - r * 1.3, p * 2, r * 2.6);
                ctx.fillStyle = 'rgba(0, 229, 255, 0.55)';
                ctx.fillRect(snapX - r, snapY - r, r * 2, r * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(snapX - r * 0.5, snapY - r * 0.5, r, r);
            } else {
                // Explosión de impacto KOF 2002 con anillo de onda expansiva, rayos diagonales, cruz luminosa y chispas elementales
                const isHeavy = s.type === 'HEAVY';
                const spread = (step + 1) * (isHeavy ? 6.5 : 4.5);
                const mainColor = s.color || (isHeavy ? '#ff5500' : '#ffbe0b');

                // Anillo de onda de choque pixelado exterior
                const ringR = Math.round(spread * 1.45);
                ctx.fillStyle = mainColor;
                ctx.fillRect(snapX - ringR, snapY - ringR, ringR * 2, p);
                ctx.fillRect(snapX - ringR, snapY + ringR - p, ringR * 2, p);
                ctx.fillRect(snapX - ringR, snapY - ringR, p, ringR * 2);
                ctx.fillRect(snapX + ringR - p, snapY - ringR, p, ringR * 2);

                // Halo central elemental
                ctx.fillStyle = mainColor;
                ctx.fillRect(snapX - spread, snapY - spread, spread * 2, spread * 2);

                // Rayos en cruz (Horizontal y Vertical extendidos)
                ctx.fillStyle = '#ffea00';
                ctx.fillRect(snapX - spread * 2.1, snapY - p, spread * 4.2, p * 2);
                ctx.fillRect(snapX - p, snapY - spread * 2.1, p * 2, spread * 4.2);

                // Fragmentos diagonales de energía y chispas voladoras (Slash Shards)
                const diag = Math.round(spread * 1.35);
                ctx.fillStyle = mainColor;
                ctx.fillRect(snapX + diag, snapY - diag, p * 2, p * 2);
                ctx.fillRect(snapX - diag - p * 2, snapY + diag, p * 2, p * 2);
                ctx.fillRect(snapX + diag, snapY + diag, p * 2, p * 2);
                ctx.fillRect(snapX - diag - p * 2, snapY - diag, p * 2, p * 2);

                // Chispas secundarias dispersándose
                const sparkDist = Math.round(spread * 1.85);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(snapX + sparkDist, snapY - p * 3, p, p);
                ctx.fillRect(snapX - sparkDist, snapY + p * 3, p, p);
                ctx.fillRect(snapX + p * 3, snapY - sparkDist, p, p);
                ctx.fillRect(snapX - p * 3, snapY + sparkDist, p, p);

                // Núcleo incandescente blanco
                ctx.fillRect(snapX - spread * 0.6, snapY - spread * 0.6, spread * 1.2, spread * 1.2);
            }
        }
    }
}

window.GamePhase = GamePhase;
window.GameLoop = GameLoop;
