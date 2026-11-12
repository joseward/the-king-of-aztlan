/**
 * @file HUD.js
 * @description Interfaz de Usuario (HUD) Pixel-Art estilo Neo-Geo MVS para "THE KING OF AZTLAN".
 * Replica fielmente el diseño arcade clásico:
 * - Retratos pixelados en las esquinas superiores con marco blanco biselado.
 * - Marcadores "WIN:00" y puntuación dinámica en fuente pixelada roja/naranja.
 * - Barras de vida verde menta sobre fondo azul oscuro conectadas a la caja central del Timer.
 * - Dígitos gigantes pixelados azules en el reloj central con hilera de puntos naranjas superiores.
 * - Nombres de los peleadores en magenta pixelado + estado de los 3 miembros del equipo.
 * - Barra inferior de Power Stock con dígito gigante lateral, cápsula "MAXIMUM", "ST-1" y "CREDIT 02".
 */

class HUD {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.banners = [];
        this.p1Score = 19200;
        this.p2Score = 14500;
        this.p1Wins = 0;
        this.p2Wins = 0;
    }

    addBanner(playerIndex, text, color = '#ffea00') {
        if (!text) return;
        this.banners.push({
            playerIndex,
            text,
            color,
            timer: 55,
            maxTimer: 55
        });
    }

    /**
     * Renderiza el HUD de combate Pixel-Art estilo Neo-Geo.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} matchState
     */
    drawCombatHUD(ctx, matchState) {
        const {
            fighter1,
            fighter2,
            team1,
            team2,
            team1Index,
            team2Index,
            timerSeconds,
            roundNumber,
            announcement
        } = matchState;

        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        // 1. Bloque Superior (Retratos de esquina, Barras de Salud y Caja Central de Timer)
        this._drawTopNeoGeoHUD(ctx, fighter1, fighter2, team1, team2, team1Index, team2Index, timerSeconds, matchState.currentStageNumber);

        // 2. Bloque Inferior (Dígito de Stock, Cápsula MÁXIMO, NV-1 y CRÉDITO)
        this._drawBottomNeoGeoPowerHUD(ctx, 1, fighter1);
        this._drawBottomNeoGeoPowerHUD(ctx, 2, fighter2);

        // Etiquetas inferiores arcade (NIVEL X DE 12 y botón de Menú en el centro, CRÉDITOS bajo las barras)
        const stLabel = matchState.currentStageNumber ? `NIVEL ${matchState.currentStageNumber} DE 12` : 'NIVEL 1 DE 12';
        this._drawPixelString(ctx, stLabel, this.width * 0.5, this.height - 35, 12, '#ffea00', '#090a14', 'center');

        // Botón interactivo de Menú / Pausa en la parte central inferior del combate
        const menuBtnX = this.width * 0.5 - 76;
        const menuBtnY = this.height - 26;
        const menuBtnW = 152;
        const menuBtnH = 22;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(menuBtnX - 1, menuBtnY - 1, menuBtnW + 2, menuBtnH + 2);
        ctx.fillStyle = '#181432';
        ctx.fillRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH);
        this._drawPixelString(ctx, '☰ MENÚ (ESC/START)', this.width * 0.5, menuBtnY + 15, 11, '#70f8a0', '#000000', 'center');

        this._drawPixelString(ctx, 'CRÉDITOS 02', 142, this.height - 4, 12, '#7898ff', '#090a14', 'left');
        this._drawPixelString(ctx, 'CRÉDITOS 02', this.width - 142, this.height - 4, 12, '#7898ff', '#090a14', 'right');

        // 3. Contadores de Combo y Banners de Cancelación
        this._drawComboAndBanners(ctx, fighter1, fighter2);

        // 4. Anuncios Centrales ("ROUND X", "FIGHT!", "K.O.!", "YOU WIN")
        if (announcement && announcement.text) {
            this._drawCenterAnnouncement(ctx, announcement);
        }

        ctx.restore();
    }

    /**
     * Dibuja toda la estructura superior unificada estilo captura de referencia Neo-Geo.
     */
    _drawTopNeoGeoHUD(ctx, fighter1, fighter2, team1, team2, team1Index, team2Index, timerSeconds, stageNumber = 1) {
        const cx = Math.floor(this.width * 0.5);
        const timerBoxW = 84;
        const timerLeft = cx - timerBoxW * 0.5;
        const timerRight = cx + timerBoxW * 0.5;

        const portraitSize = 76;
        const p1PortraitX = 8;
        const p2PortraitX = this.width - 8 - portraitSize;
        const portraitY = 8;

        // Barras de vida conectadas entre el retrato y el reloj central
        const barY = 30;
        const barH = 22;
        const p1BarX = p1PortraitX + portraitSize;
        const p1BarW = timerLeft - p1BarX;
        const p2BarX = timerRight;
        const p2BarW = p2PortraitX - timerRight;

        // A. Textos superiores "VICT:00" y Puntuación "19200" en rojo/coral con borde negro
        const winStrP1 = `VICT:${String(this.p1Wins).padStart(2, '0')}`;
        const scoreStrP1 = String(this.p1Score + fighter2.comboDamageTaken * 10).padStart(5, '0');
        this._drawPixelString(ctx, winStrP1, p1BarX + 10, barY - 6, 15, '#ff7555', '#120814', 'left');
        this._drawPixelString(ctx, scoreStrP1, timerLeft - 12, barY - 6, 16, '#ff7555', '#120814', 'right');

        const winStrP2 = `VICT:${String(this.p2Wins).padStart(2, '0')}`;
        const scoreStrP2 = String(this.p2Score + fighter1.comboDamageTaken * 10).padStart(5, '0');
        this._drawPixelString(ctx, scoreStrP2, timerRight + 12, barY - 6, 16, '#ff7555', '#120814', 'left');
        this._drawPixelString(ctx, winStrP2, p2PortraitX - 10, barY - 6, 15, '#ff7555', '#120814', 'right');

        // B. Barras de Salud Jugador 1 y Jugador 2
        this._drawSingleHealthBar(ctx, p1BarX, barY, p1BarW, barH, fighter1, true);
        this._drawSingleHealthBar(ctx, p2BarX, barY, p2BarW, barH, fighter2, false);

        // C. Caja Central del Reloj (Con marco blanco pixelado y puntos naranjas arriba)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(timerLeft - 4, 4, timerBoxW + 8, 72);
        ctx.fillStyle = '#141428';
        ctx.fillRect(timerLeft, 4, timerBoxW, 64);

        // 6 Puntos naranjas luminosos sobre el reloj (idénticos a la referencia)
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ff9e00' : '#ffea00';
            ctx.fillRect(cx - 18 + i * 6, 11, 4, 4);
        }

        // 2 Dígitos pixelados grandes del Timer (o símbolo de infinito en Modo Práctica)
        if (timerSeconds >= 900) {
            this._drawPixelString(ctx, '∞', cx, 52, 34, '#9bb4ff', '#080814', 'center');
        } else {
            const secStr = String(Math.max(0, Math.ceil(timerSeconds))).padStart(2, '0');
            const digitFill = timerSeconds <= 10 ? '#ff5577' : '#9bb4ff';
            const digitShade = timerSeconds <= 10 ? '#b81d3d' : '#5e78d6';
            window.PixelArtRendererClass.drawArcadeDigit(ctx, secStr[0], cx - 32, 24, 4, digitFill, digitShade, '#080814');
            window.PixelArtRendererClass.drawArcadeDigit(ctx, secStr[1], cx + 4, 24, 4, digitFill, digitShade, '#080814');
        }

        // Placa Central de Nivel Arcade Neo-Geo debajo del timer
        const badgeW = 96;
        const badgeH = 18;
        const badgeX = cx - badgeW * 0.5;
        const badgeY = 70;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(badgeX - 1, badgeY - 1, badgeW + 2, badgeH + 2);
        ctx.fillStyle = stageNumber === 12 ? '#590a18' : '#14182e';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        const stageBadgeText = stageNumber === 12 ? 'JEFE FINAL' : `NIVEL ${stageNumber}/12`;
        this._drawPixelString(ctx, stageBadgeText, cx, badgeY + 13, 11, stageNumber === 12 ? '#ff4d88' : '#ffea00', '#000000', 'center');

        // D. Retratos Pixel-Art en las esquinas superiores con marco blanco biselado
        this._drawCornerPortrait(ctx, fighter1.template, p1PortraitX, portraitY, portraitSize, false);
        this._drawCornerPortrait(ctx, fighter2.template, p2PortraitX, portraitY, portraitSize, true);

        // E. Nombres de los personajes e indicador de orden de equipo 3v3
        const p1NameStr = `${fighter1.name} (1P · ${team1Index + 1}/3)`;
        const p2RoleTag = team2Index === 2 ? '★ LÍDER' : `OPONENTE ${team2Index + 1}/3`;
        const p2NameStr = `${fighter2.name} (${p2RoleTag})`;
        this._drawPixelString(ctx, p1NameStr, p1BarX + 12, barY + barH + 18, 15, '#ff4d88', '#14081c', 'left');
        this._drawPixelString(ctx, p2NameStr, p2PortraitX - 12, barY + barH + 18, 15, team2Index === 2 ? '#ffbe0b' : '#ff4d88', '#14081c', 'right');

        // F. Mini-indicadores de orden de equipo 3v3 (1ST, 2ND, 3RD)
        this._drawTeamOrderPips(ctx, team1, team1Index, fighter1.hp <= 0, timerLeft - 118, barY + barH + 6);
        this._drawTeamOrderPips(ctx, team2, team2Index, fighter2.hp <= 0, timerRight + 10, barY + barH + 6);
    }

    _drawSingleHealthBar(ctx, x, y, w, h, fighter, isP1) {
        // Marco blanco exterior de 4px
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, w, h);

        // Marco negro intermedio de 2px
        ctx.fillStyle = '#090a14';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Fondo azul oscuro/púrpura de barra vacía (como en la imagen de referencia)
        const innerX = x + 4;
        const innerY = y + 4;
        const innerW = w - 8;
        const innerH = h - 8;
        ctx.fillStyle = '#28284e';
        ctx.fillRect(innerX, innerY, innerW, innerH);
        ctx.fillStyle = '#181834';
        ctx.fillRect(innerX, innerY + innerH * 0.5, innerW, innerH * 0.5);

        const redRatio = Math.max(0, fighter.recoverableRedHp / fighter.maxHp);
        const hpRatio = Math.max(0, fighter.hp / fighter.maxHp);
        const redW = Math.floor((innerW * redRatio) / 4) * 4;
        const hpW = Math.floor((innerW * hpRatio) / 4) * 4;

        if (isP1) {
            // Jugador 1: Llena hacia el reloj central (derecha)
            ctx.fillStyle = '#d90429';
            ctx.fillRect(innerX + (innerW - redW), innerY, redW, innerH);

            ctx.fillStyle = hpRatio <= 0.35 ? '#ff2a55' : '#52e584';
            ctx.fillRect(innerX + (innerW - hpW), innerY, hpW, innerH);
            ctx.fillStyle = hpRatio <= 0.35 ? '#ffea00' : '#9efcd0';
            ctx.fillRect(innerX + (innerW - hpW), innerY, hpW, 4);
        } else {
            // Jugador 2: Llena desde el reloj central (izquierda)
            ctx.fillStyle = '#d90429';
            ctx.fillRect(innerX, innerY, redW, innerH);

            ctx.fillStyle = hpRatio <= 0.35 ? '#ff2a55' : '#52e584';
            ctx.fillRect(innerX, innerY, hpW, innerH);
            ctx.fillStyle = hpRatio <= 0.35 ? '#ffea00' : '#9efcd0';
            ctx.fillRect(innerX, innerY, hpW, 4);
        }

        // Sub-barra de Medidor de Guardia (Guard Gauge KOF 2002) debajo de la barra de salud
        const guardRatio = Math.max(0, (fighter.guardGauge ?? 100) / (fighter.maxGuardGauge || 100));
        const guardBarW = Math.floor(innerW * 0.42);
        const guardFillW = Math.floor(guardBarW * guardRatio);
        const guardX = isP1 ? (x + w - guardBarW - 4) : (x + 4);
        const guardY = y - 7;
        ctx.fillStyle = '#090a14';
        ctx.fillRect(guardX - 1, guardY - 1, guardBarW + 2, 5);
        ctx.fillStyle = guardRatio < 0.3 ? '#ff0055' : '#00f5ff';
        if (isP1) {
            ctx.fillRect(guardX + (guardBarW - guardFillW), guardY, guardFillW, 3);
        } else {
            ctx.fillRect(guardX, guardY, guardFillW, 3);
        }

        // Indicador luminoso "¡MAX2 LISTO!" cuando está en salud crítica y tiene Modo MAX o 2+ Stocks
        if (fighter.isCriticalHealth && fighter.isCriticalHealth() && (fighter.isMaxMode || fighter.powerGauge >= 2000)) {
            const badgeX = isP1 ? x + 8 : x + w - 8;
            this._drawPixelString(ctx, '¡¡CLÍMAX MAX2 LISTO!!', badgeX, y + h + 32, 11, '#ffea00', '#b8001f', isP1 ? 'left' : 'right');
        }
    }

    _drawCornerPortrait(ctx, template, x, y, size, flipX) {
        // Marco exterior blanco grueso estilo Neo-Geo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 3, y - 3, size + 6, size + 6);
        ctx.fillStyle = '#090a14';
        ctx.fillRect(x, y, size, size);

        const portraitCanvas = window.PixelArtRenderer.getPortraitCanvas(template, size, flipX);
        ctx.drawImage(portraitCanvas, x, y);
    }

    _drawTeamOrderPips(ctx, team, activeIdx, currentDead, startX, startY) {
        for (let i = 0; i < team.length; i++) {
            const member = team[i];
            const px = startX + i * 36;
            const isDead = i < activeIdx || (i === activeIdx && currentDead);
            const isCurrent = i === activeIdx;

            ctx.fillStyle = isCurrent ? '#ffffff' : '#64748b';
            ctx.fillRect(px, startY, 32, 16);
            ctx.fillStyle = isDead ? '#2b1118' : member.visuals.primaryColor;
            ctx.fillRect(px + 2, startY + 2, 28, 12);

            const label = isDead ? 'KO' : member.name.slice(0, 3);
            this._drawPixelString(
                ctx,
                label,
                px + 16,
                startY + 12,
                10,
                isDead ? '#ff4d6d' : '#ffffff',
                '#000000',
                'center'
            );
        }
    }

    /**
     * Dibuja la Barra de Poder inferior con el dígito gigante de Stock a la esquina y la cápsula "MAXIMUM".
     */
    _drawBottomNeoGeoPowerHUD(ctx, playerIndex, fighter) {
        const isP1 = playerIndex === 1;
        const stocks = fighter.getPowerStocks();
        const subRatio = stocks >= 3 ? 1 : (fighter.powerGauge % 1000) / 1000;

        const digitY = this.height - 56;
        const digitX = isP1 ? 22 : this.width - 54;

        // 1. Dígito gigante de Stock (0, 1, 2, 3) en azul/blanco con contorno
        window.PixelArtRendererClass.drawArcadeDigit(
            ctx,
            stocks,
            digitX,
            digitY,
            4,
            stocks >= 1 ? '#6488ff' : '#4a5568',
            '#2b3d99',
            '#ffffff'
        );

        // 2. Cápsula horizontal de Power Gauge con borde blanco grueso
        const barW = 216;
        const barH = 20;
        const barY = this.height - 36;
        const barX = isP1 ? 64 : this.width - 64 - barW;

        // Marco blanco redondeado en bloques pixelados
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barX - 4, barY + 2, barW + 8, barH - 4);
        ctx.fillRect(barX, barY - 2, barW, barH + 4);

        // Interior negro de la cápsula
        ctx.fillStyle = '#090a14';
        ctx.fillRect(barX, barY + 2, barW, barH - 4);

        // Relleno naranja/dorado pixelado (si está en Modo MAX muestra el temporizador restante)
        const activeRatio = fighter.isMaxMode
            ? fighter.maxModeTimer / fighter.maxModeMaxDuration
            : (stocks >= 1 ? 1 : subRatio);

        const fillW = Math.floor(((barW - 8) * activeRatio) / 4) * 4;
        if (fillW > 0) {
            ctx.fillStyle = fighter.isMaxMode ? '#ffea00' : stocks >= 1 ? '#ff9500' : '#00d2ff';
            if (isP1) {
                ctx.fillRect(barX + 4, barY + 4, fillW, barH - 8);
                ctx.fillStyle = '#fff3b0';
                ctx.fillRect(barX + 4, barY + 4, fillW, 4);
            } else {
                ctx.fillRect(barX + barW - 4 - fillW, barY + 4, fillW, barH - 8);
                ctx.fillStyle = '#fff3b0';
                ctx.fillRect(barX + barW - 4 - fillW, barY + 4, fillW, 4);
            }
        }

        // Si ya tiene al menos 1 Stock pero también está cargando el siguiente, mostrar barra secundaria arriba
        if (!fighter.isMaxMode && stocks >= 1 && stocks < 3) {
            const nextW = Math.floor(((barW - 8) * subRatio) / 4) * 4;
            ctx.fillStyle = '#00ffc3';
            if (isP1) {
                ctx.fillRect(barX + 4, barY + barH - 6, nextW, 3);
            } else {
                ctx.fillRect(barX + barW - 4 - nextW, barY + barH - 6, nextW, 3);
            }
        }

        // 3. Texto "MÁXIMO" superpuesto cuando tiene Stock listo o Modo MAX activo
        if (stocks >= 1 || fighter.isMaxMode) {
            const label = fighter.isMaxMode ? 'MODO MAX' : 'MÁXIMO';
            this._drawPixelString(
                ctx,
                label,
                barX + barW * 0.5,
                barY + 15,
                14,
                '#fff8d6',
                '#5c2b00',
                'center'
            );
        }
    }

    _drawComboAndBanners(ctx, fighter1, fighter2) {
        if (fighter2.comboHitsTaken >= 2) {
            this._drawComboCallout(ctx, 1, fighter2.comboHitsTaken, fighter2.comboDamageTaken);
        }
        if (fighter1.comboHitsTaken >= 2) {
            this._drawComboCallout(ctx, 2, fighter1.comboHitsTaken, fighter1.comboDamageTaken);
        }

        for (let i = this.banners.length - 1; i >= 0; i--) {
            const b = this.banners[i];
            b.timer--;
            const isP1 = b.playerIndex === 1;
            const x = isP1 ? 26 : this.width - 26;
            const y = 168 - Math.floor((b.maxTimer - b.timer) * 0.35);

            this._drawPixelString(ctx, b.text, x, y, 18, b.color, '#090a14', isP1 ? 'left' : 'right');
            if (b.timer <= 0) {
                this.banners.splice(i, 1);
            }
        }
    }

    _drawComboCallout(ctx, attackerIndex, hits, damage) {
        const isP1 = attackerIndex === 1;
        const x = isP1 ? 26 : this.width - 26;
        const align = isP1 ? 'left' : 'right';
        const boxW = 228;
        const boxX = isP1 ? 18 : this.width - 18 - boxW;

        // Placa de combo estilo KOF 2002 con borde energético según longitud del combo
        const rankColor = hits >= 8 ? '#ff0055' : hits >= 5 ? '#ff7b00' : hits >= 3 ? '#00f5ff' : '#ffea00';
        const rankTitle = hits >= 8
            ? '¡¡COMBO SUPREMO AZTLÁN!!'
            : hits >= 5
                ? '¡DESTRUCCIÓN KOF!'
                : hits >= 3
                    ? '¡COMBO EN CADENA!'
                    : '¡RÁFAGA RÁPIDA!';

        ctx.fillStyle = 'rgba(10, 10, 26, 0.82)';
        ctx.fillRect(boxX, 94, boxW, 66);
        ctx.fillStyle = rankColor;
        ctx.fillRect(boxX, 94, boxW, 3);
        ctx.fillRect(boxX, 157, boxW, 3);
        ctx.fillRect(isP1 ? boxX : boxX + boxW - 5, 94, 5, 66);

        this._drawPixelString(ctx, `¡${hits} GOLPES!`, x, 122, 28, '#ffea00', '#14081c', align);
        this._drawPixelString(ctx, rankTitle, x, 139, 12, rankColor, '#090a14', align);
        this._drawPixelString(ctx, `DAÑO TOTAL: ${damage}`, x, 154, 12, '#ffffff', '#090a14', align);
    }

    _drawCenterAnnouncement(ctx, announcement) {
        const cx = this.width * 0.5;
        const cy = Math.floor(this.height * 0.44);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, cy - 46, this.width, 4);
        ctx.fillRect(0, cy + 36, this.width, 4);
        ctx.fillStyle = 'rgba(12, 12, 28, 0.84)';
        ctx.fillRect(0, cy - 42, this.width, 78);

        this._drawPixelString(ctx, announcement.text, cx, cy + 4, 38, announcement.color || '#ffea00', '#090a14', 'center');
        if (announcement.subtext) {
            this._drawPixelString(ctx, announcement.subtext, cx, cy + 28, 15, '#8effc1', '#090a14', 'center');
        }
    }

    /**
     * 1. PANTALLA DE INTRO CINEMÁTICA ESTILO KOF 2002 ("CHALLENGE TO ULTIMATE BATTLE")
     * Ciclo animado de 720 frames (12s a 60 FPS) dividido en 4 escenas llenas de acción:
     * - Escena 1 (0..169): Presentación Neo-Geo / Desfile de alta velocidad de los 11 Equipos Oficiales 3 vs 3.
     * - Escena 2 (170..359): Duelos de Rivales (Kyo vs Iori, Terry vs Ryo, K' vs Kula) ejecutando combos reales con estelas y chispas.
     * - Escena 3 (360..489): Tormenta carmesí y aparición del Jefe Final OMEGA RUGAL.
     * - Escena 4 (490..719): Impacto del emblema "THE KING OF AZTLAN" con combate de exhibición en vivo.
     */
    drawTitleScreen(ctx, globalFrame) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        const cx = Math.floor(this.width * 0.5);
        const cycle = globalFrame % 720;
        const roster = window.CHARACTER_ROSTER || [];
        const teams = window.OFFICIAL_TEAMS || [];

        // Cortes de flash blanco entre escenas (estilo apertura arcade KOF 2002)
        const isSceneCut =
            cycle < 5 ||
            (cycle >= 170 && cycle < 175) ||
            (cycle >= 360 && cycle < 365) ||
            (cycle >= 490 && cycle < 496);

        // Fondo dinámico con líneas de velocidad (Speedlines) y horizonte cibernético Neo-Geo
        ctx.fillStyle = isSceneCut ? '#ffffff' : '#080816';
        ctx.fillRect(0, 0, this.width, this.height);

        // Bandas horizontales de velocidad estilo KOF 2002
        for (let y = 0; y < this.height; y += 12) {
            const stripeShift = Math.floor((globalFrame * 6 + y * 3) % 160);
            ctx.fillStyle = (y / 12) % 2 === 0 ? '#10122a' : '#0a0b1c';
            ctx.fillRect(0, y, this.width, 6);
            if (y % 36 === 0) {
                ctx.fillStyle = cycle >= 360 && cycle < 490 ? 'rgba(255, 0, 68, 0.22)' : 'rgba(0, 245, 255, 0.14)';
                ctx.fillRect((stripeShift * 7) % this.width, y, 140, 3);
            }
        }

        // =====================================================================
        // ESCENA 1 (0..169): DESFILE DE EQUIPOS OFICIALES 3 VS 3 A ALTA VELOCIDAD
        // =====================================================================
        if (cycle < 170) {
            const teamIdx = Math.floor(cycle / 16) % Math.max(1, teams.length);
            const localT = (cycle % 16) / 16;
            const slideX = Math.round((1 - localT) * 90);
            const baseCharIdx = teamIdx * 3;
            const m1 = roster[baseCharIdx] || roster[0];
            const m2 = roster[baseCharIdx + 1] || roster[0];
            const m3 = roster[baseCharIdx + 2] || roster[0];
            const teamColor = m1?.visuals?.energyColor || '#00f5ff';

            // Franja diagonal/horizontal de energía del equipo activo
            ctx.fillStyle = teamColor;
            ctx.globalAlpha = 0.22;
            ctx.fillRect(0, 148, this.width, 196);
            ctx.globalAlpha = 1.0;
            ctx.fillRect(0, 146, this.width, 4);
            ctx.fillRect(0, 344, this.width, 4);

            this._drawPixelString(ctx, 'SNK / NEO-GEO MVS  •  PRESENTACIÓN OFICIAL 3 VS 3', cx, 42, 14, '#00f5ff', '#000000', 'center');
            this._drawPixelString(ctx, '¡¡EL DESAFÍO DEFINITIVO EN AZTLÁN!!', cx, 76, 28, '#ffea00', '#14081c', 'center');
            this._drawPixelString(
                ctx,
                `EQUIPO ${teamIdx + 1}/11: ${teams[teamIdx] ? teams[teamIdx].name : 'EQUIPO JAPÓN'}`,
                cx,
                122,
                24,
                teamColor,
                '#000000',
                'center'
            );

            // 3 Retratos grandes + 3 Luchadores en acción del equipo actual
            const slotsX = [cx - 260 - slideX, cx, cx + 260 + slideX];
            const members = [m1, m2, m3];
            const poses = ['PUNCH_HEAVY', 'CMD_STRIKE', 'KICK_HIGH'];
            for (let i = 0; i < 3; i++) {
                const mem = members[i];
                if (!mem) continue;
                const sx = slotsX[i];

                // Retrato de fondo iluminado
                const port = window.PixelArtRenderer.getPortraitCanvas(mem, 116, i === 2);
                ctx.fillStyle = teamColor;
                ctx.fillRect(sx - 62, 162, 124, 124);
                ctx.drawImage(port, sx - 58, 166);

                // Luchador en pose de ataque con estela elemental
                const fDemo = new window.Fighter({
                    playerIndex: i === 2 ? 2 : 1,
                    template: mem,
                    x: sx,
                    groundY: 422,
                    facing: i === 2 ? -1 : 1
                });
                fDemo.state = 'ATTACK';
                fDemo.currentMove = { startup: 2, active: 20, recovery: 4, pose: poses[i], hits: 2 };
                fDemo.stateFrame = 5 + (globalFrame % 6);
                fDemo.chainStepCount = 3;
                fDemo.animFrame = globalFrame;
                fDemo.draw(ctx, false);

                this._drawPixelString(ctx, mem.name.toUpperCase(), sx, 444, 15, '#ffffff', '#000000', 'center');
            }
        }
        // =====================================================================
        // ESCENA 2 (170..359): DUELO DE RIVALES KOF 2002 (COMBOS Y CHOQUES EN VIVO)
        // =====================================================================
        else if (cycle < 360) {
            const subFrame = cycle - 170;
            // Rotar entre 3 duelos icónicos: Kyo vs Iori, Terry vs Ryo, K' vs Kula
            const rivalPairs = [
                { p1Idx: 0, p2Idx: 33, title: 'DUELO DE FLAMAS ANCESTRALES: KYO VS IORI' },
                { p1Idx: 3, p2Idx: 6, title: 'CHOQUE DE LEYENDAS: TERRY BOGARD VS RYO SAKAZAKI' },
                { p1Idx: 30, p2Idx: 34, title: 'FUEGO CONTRA HIELO NESTS: K\' DASH VS KULA DIAMOND' }
            ];
            const pair = rivalPairs[Math.floor(globalFrame / 720) % rivalPairs.length];
            const t1 = roster[pair.p1Idx] || roster[0];
            const t2 = roster[pair.p2Idx] || roster[1] || roster[0];

            // Pantalla dividida superior con retratos enfrentados estilo VS Screen KOF 2002
            ctx.fillStyle = t1.visuals.energyColor || '#ff5500';
            ctx.globalAlpha = 0.25;
            ctx.fillRect(0, 56, cx, 118);
            ctx.fillStyle = t2.visuals.energyColor || '#a855f7';
            ctx.fillRect(cx, 56, cx, 118);
            ctx.globalAlpha = 1.0;

            const p1Port = window.PixelArtRenderer.getPortraitCanvas(t1, 104, false);
            const p2Port = window.PixelArtRenderer.getPortraitCanvas(t2, 104, true);
            ctx.drawImage(p1Port, 48, 62);
            ctx.drawImage(p2Port, this.width - 152, 62);

            this._drawPixelString(ctx, pair.title, cx, 38, 18, '#ffea00', '#000000', 'center');
            this._drawPixelString(ctx, t1.name.toUpperCase(), 168, 112, 24, '#ffffff', '#000000', 'left');
            this._drawPixelString(ctx, t2.name.toUpperCase(), this.width - 168, 112, 24, '#ffffff', '#000000', 'right');
            this._drawPixelString(ctx, 'VS', cx, 126, 36, '#ff0055', '#ffffff', 'center');

            // Piso del escenario de duelo
            ctx.fillStyle = '#1c3e4b';
            ctx.fillRect(0, 418, this.width, 40);
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(0, 418, this.width, 3);

            // Coreografía de combo en tiempo real entre los dos rivales
            const rushProgress = Math.min(1, subFrame / 36);
            const p1X = Math.round((cx - 240) + rushProgress * 172);
            const p2X = Math.round((cx + 240) - rushProgress * 172);

            const comboPoses = ['PUNCH_CLOSE_LIGHT', 'KICK_MID', 'PUNCH_HEAVY', 'CMD_STRIKE', 'UPPERCUT', 'KICK_HIGH'];
            const stepIdx = Math.floor(subFrame / 14) % comboPoses.length;
            const currentPose = subFrame < 36 ? '' : comboPoses[stepIdx];

            const f1 = new window.Fighter({ playerIndex: 1, template: t1, x: p1X, groundY: 422, facing: 1 });
            const f2 = new window.Fighter({ playerIndex: 2, template: t2, x: p2X, groundY: 422, facing: -1 });
            f1.animFrame = globalFrame;
            f2.animFrame = globalFrame;

            if (subFrame < 36) {
                f1.state = 'RUN';
                f2.state = 'RUN';
            } else {
                const p1Attacking = Math.floor(subFrame / 28) % 2 === 0;
                f1.state = p1Attacking ? 'SPECIAL' : 'HIT';
                f2.state = p1Attacking ? 'HIT' : 'SPECIAL';
                f1.isMaxMode = true;
                f2.isMaxMode = true;
                f1.chainStepCount = 4;
                f2.chainStepCount = 4;
                const activeMove = { startup: 1, active: 20, recovery: 2, pose: currentPose, hits: 3 };
                f1.currentMove = p1Attacking ? activeMove : null;
                f2.currentMove = !p1Attacking ? activeMove : null;
                f1.stateFrame = 4 + (subFrame % 10);
                f2.stateFrame = 4 + (subFrame % 10);
                f1.hitShakeTimer = p1Attacking ? 0 : 4;
                f2.hitShakeTimer = p1Attacking ? 4 : 0;
            }

            f1.draw(ctx, false);
            f2.draw(ctx, false);

            // Explosión de chispas en el centro cuando chocan sus golpes
            if (subFrame >= 36) {
                const sparkColor = (Math.floor(subFrame / 6) % 2 === 0) ? t1.visuals.energyColor : t2.visuals.energyColor;
                const sy = 300 - (stepIdx % 3) * 28;
                window.PixelArtRendererClass.drawStrikeBurst(ctx, cx, sy, sparkColor || '#ffbe0b', '#ffffff', true, 4);
                const fakeHits = Math.min(12, 2 + Math.floor((subFrame - 36) / 11));
                this._drawComboCallout(ctx, 1, fakeHits, fakeHits * 46);
            }
        }
        // =====================================================================
        // ESCENA 3 (360..489): ALERTA DEL JEFE FINAL — OMEGA RUGAL
        // =====================================================================
        else if (cycle < 490) {
            const subFrame = cycle - 360;
            const lightning = (subFrame % 24 < 4) || (subFrame % 24 === 7);

            ctx.fillStyle = lightning ? '#5a0b24' : '#16040c';
            ctx.fillRect(0, 0, this.width, this.height);

            // Columnas de energía oscura Kaiser / Genocide Cutter
            for (let i = 0; i < 6; i++) {
                const px = 90 + i * 156;
                const h = 160 + Math.round(Math.sin(globalFrame * 0.25 + i) * 70);
                ctx.fillStyle = 'rgba(255, 0, 68, 0.25)';
                ctx.fillRect(px - 18, 430 - h, 36, h);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.fillRect(px - 4, 430 - h, 8, h);
            }

            const rugalPort = window.PixelArtRenderer.getPortraitCanvas(window.BOSS_RUGAL_TEMPLATE, 180, false);
            ctx.save();
            ctx.globalAlpha = 0.48;
            ctx.drawImage(rugalPort, cx - 90, 54);
            ctx.restore();

            // Destello láser en el ojo biónico de Rugal
            const eyeGlow = 12 + (subFrame % 12) * 3;
            ctx.fillStyle = '#ff0044';
            ctx.fillRect(cx - eyeGlow, 128, eyeGlow * 2, 4);
            ctx.fillRect(cx - 2, 128 - eyeGlow * 0.6, 4, eyeGlow * 1.2);

            this._drawPixelString(ctx, '¡¡ADVERTENCIA: NIVEL 12 — JEFE FINAL!!', cx, 46, 22, '#ff0055', '#000000', 'center');
            this._drawPixelString(ctx, 'OMEGA RUGAL', cx, 92, 44, '#ffffff', '#b8001f', 'center');
            this._drawPixelString(ctx, 'EL EMPERADOR DEL ALTAR CARMESÍ DE AZTLÁN', cx, 120, 15, '#ffbe0b', '#000000', 'center');

            const rugalDemo = new window.Fighter({
                playerIndex: 2,
                template: window.BOSS_RUGAL_TEMPLATE,
                x: cx,
                groundY: 432,
                facing: 1
            });
            rugalDemo.state = 'SUPER';
            rugalDemo.isMaxMode = true;
            rugalDemo.chainStepCount = 5;
            rugalDemo.currentMove = {
                startup: 1,
                active: 25,
                recovery: 4,
                pose: (Math.floor(subFrame / 18) % 2 === 0) ? 'KICK_HIGH' : 'UPPERCUT',
                hits: 4
            };
            rugalDemo.stateFrame = 5 + (subFrame % 10);
            rugalDemo.animFrame = globalFrame;
            rugalDemo.draw(ctx, false);
        }
        // =====================================================================
        // ESCENA 4 (490..719): GRAN LOGO "THE KING OF AZTLAN" + DEMO EN VIVO
        // =====================================================================
        else {
            const subFrame = cycle - 490;
            const rugalPortrait = window.PixelArtRenderer.getPortraitCanvas(window.BOSS_RUGAL_TEMPLATE, 148, false);
            ctx.save();
            ctx.globalAlpha = 0.34;
            ctx.drawImage(rugalPortrait, cx - 74, 24);
            ctx.restore();

            // Retratos laterales de héroes estilo póster KOF 2002
            const kyoPort = window.PixelArtRenderer.getPortraitCanvas(roster[0], 96, false);
            const ioriPort = window.PixelArtRenderer.getPortraitCanvas(roster[33] || roster[1], 96, true);
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.drawImage(kyoPort, 28, 66);
            ctx.drawImage(ioriPort, this.width - 124, 66);
            ctx.restore();

            // Emblema principal Neo-Geo / KOF 2002 con caída de impacto
            const dropOffset = subFrame < 12 ? Math.round((12 - subFrame) * -10) : 0;
            const logoY = 54 + dropOffset;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 352, logoY, 704, 126);
            ctx.fillStyle = '#181028';
            ctx.fillRect(cx - 346, logoY + 6, 692, 114);
            ctx.fillStyle = '#b8001f';
            ctx.fillRect(cx - 340, logoY + 12, 680, 102);
            ctx.fillStyle = '#120a20';
            ctx.fillRect(cx - 334, logoY + 18, 668, 90);

            this._drawPixelString(ctx, 'CHALLENGE TO ULTIMATE BATTLE  •  EDICIÓN KOF 2002', cx, logoY + 38, 13, '#00f5ff', '#000000', 'center');
            this._drawPixelString(ctx, 'THE KING OF AZTLAN', cx, logoY + 78, 44, '#ffbe0b', '#14081c', 'center');
            this._drawPixelString(ctx, '42 LUCHADORES  •  11 EQUIPOS 3 VS 3  •  12 NIVELES ARCADE', cx, logoY + 100, 13, '#70f8a0', '#000000', 'center');

            // Combate coreografiado debajo del logo
            const phasePose = ['PUNCH_CLOSE_LIGHT', 'KICK_LOW', 'PUNCH_HEAVY', 'CMD_STRIKE', 'UPPERCUT', 'KICK_HIGH'][Math.floor(subFrame / 14) % 6];
            const demoP1 = new window.Fighter({
                playerIndex: 1,
                template: roster[0],
                x: cx - 74,
                groundY: 438,
                facing: 1
            });
            demoP1.state = 'ATTACK';
            demoP1.isMaxMode = true;
            demoP1.chainStepCount = 3;
            demoP1.currentMove = { startup: 1, active: 18, recovery: 3, pose: phasePose, hits: 2 };
            demoP1.stateFrame = 4 + (subFrame % 8);
            demoP1.animFrame = globalFrame;

            const demoP2 = new window.Fighter({
                playerIndex: 2,
                template: roster[33] || window.BOSS_RUGAL_TEMPLATE,
                x: cx + 74,
                groundY: 438,
                facing: -1
            });
            demoP2.state = (subFrame % 28 < 14) ? 'BLOCK' : 'HIT';
            demoP2.hitShakeTimer = (subFrame % 28 < 14) ? 0 : 4;
            demoP2.animFrame = globalFrame;

            demoP1.draw(ctx, false);
            demoP2.draw(ctx, false);

            window.PixelArtRendererClass.drawStrikeBurst(ctx, cx, 312, '#ffbe0b', '#ffffff', true, 4);
        }

        // Cartel inferior permanente para entrar al juego en cualquier momento de la intro
        if (Math.floor(globalFrame / 20) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 278, 458, 556, 38);
            ctx.fillStyle = '#181028';
            ctx.fillRect(cx - 274, 462, 548, 30);
            this._drawPixelString(
                ctx,
                'PRESIONA ENTER / START / PUÑO (U) O HAZ CLIC',
                cx,
                483,
                16,
                '#ffea00',
                '#000000',
                'center'
            );
        }

        // Indicador de escena de la intro + créditos
        const sceneNum = cycle < 170 ? 1 : cycle < 360 ? 2 : cycle < 490 ? 3 : 4;
        this._drawPixelString(ctx, `INTRO KOF 2002 [ESCENA ${sceneNum}/4]   •   CRÉDITOS 02`, cx, 524, 13, '#7898ff', '#000000', 'center');
        ctx.restore();
    }

    /**
     * 2. PANTALLA DE SELECCIÓN DE MODO DE JUEGO ("MODE SELECT")
     */
    drawModeSelectScreen(ctx, modeIndex, globalFrame) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        ctx.fillStyle = '#0e1024';
        ctx.fillRect(0, 0, this.width, this.height);
        for (let y = 0; y < this.height; y += 8) {
            ctx.fillStyle = (y / 8) % 2 === 0 ? '#151836' : '#0e1024';
            ctx.fillRect(0, y, this.width, 4);
        }

        // Botón superior izquierdo para volver a la pantalla de título
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(26, 22, 184, 34);
        ctx.fillStyle = '#261838';
        ctx.fillRect(28, 24, 180, 30);
        this._drawPixelString(ctx, '◄ INICIO (ESC / P)', 118, 44, 12, '#ffea00', '#000000', 'center');

        const cx = Math.floor(this.width * 0.5);
        this._drawPixelString(ctx, 'THE KING OF AZTLAN — MODOS DE PELEA', cx, 54, 25, '#ffbe0b', '#090a14', 'center');
        this._drawPixelString(ctx, 'USA W/S, FLECHAS O MANDO PARA MOVERTE • U/ENTER/START: ELEGIR • P/ESC/B: VOLVER', cx, 84, 12, '#70f8a0', '#090a14', 'center');

        const modes = [
            {
                title: '1. TORNEO ARCADE (12 NIVELES — JEFE FINAL: RUGAL)',
                desc: 'Supera los 12 niveles hasta enfrentar a OMEGA RUGAL.',
                badge: '12 ETAPAS',
                accent: '#ffbe0b',
                iconIdx: 0
            },
            {
                title: '2. EQUIPO VS CPU (PELEA LIBRE 3 VS 3)',
                desc: 'Combate directo por equipos 3 contra 3 eligiendo ambos bandos.',
                badge: '3 VS 3 IA',
                accent: '#00f5ff',
                iconIdx: 3
            },
            {
                title: '3. VERSUS 2 JUGADORES LOCAL (1P VS 2P)',
                desc: 'Duelo multijugador local con teclado o 2 mandos USB / Bluetooth.',
                badge: 'LOCAL 2P',
                accent: '#52e584',
                iconIdx: 33
            },
            {
                title: '4. DESAFÍO FINAL: NIVEL 12 VS OMEGA RUGAL',
                desc: 'Salta directamente al Nivel 12 para poner a prueba tu equipo.',
                badge: 'JEFE FINAL',
                accent: '#ff0055',
                iconIdx: 41
            },
            {
                title: '5. MODO PRÁCTICA (DUMMY, INPUTS Y FRAME DATA)',
                desc: 'Entrenamiento libre con maniquí configurable y datos de combate.',
                badge: 'PRÁCTICA',
                accent: '#a855f7',
                iconIdx: 12
            },
            {
                title: '6. CONFIGURAR CONTROLES (TECLADO Y MANDOS)',
                desc: 'Reasigna teclas y botones para Jugador 1 y Jugador 2 con guardado.',
                badge: 'CONTROLES',
                accent: '#38bdf8',
                iconIdx: 30
            }
        ];

        const boxW = 720;
        const boxH = 54;
        const startY = 106;
        const gap = 10;
        const roster = window.CHARACTER_ROSTER || [];

        for (let i = 0; i < modes.length; i++) {
            const m = modes[i];
            const bx = cx - boxW * 0.5;
            const by = startY + i * (boxH + gap);
            const selected = i === modeIndex;

            ctx.fillStyle = selected ? m.accent : '#4a5568';
            ctx.fillRect(bx - 3, by - 3, boxW + 6, boxH + 6);
            ctx.fillStyle = selected ? '#221638' : '#14162b';
            ctx.fillRect(bx, by, boxW, boxH);

            ctx.fillStyle = selected ? m.accent : '#334155';
            ctx.fillRect(bx, by, 8, boxH);

            const modeChar = roster[m.iconIdx] || roster[0];
            if (modeChar) {
                const pCanv = window.PixelArtRenderer.getPortraitCanvas(modeChar, 44, false);
                ctx.drawImage(pCanv, bx + 14, by + 5);
            }

            ctx.fillStyle = selected ? m.accent : '#1e293b';
            ctx.fillRect(bx + boxW - 110, by + 16, 96, 22);
            this._drawPixelString(ctx, m.badge, bx + boxW - 62, by + 31, 10, selected ? '#090a14' : '#94a3b8', null, 'center');

            this._drawPixelString(
                ctx,
                selected ? `► ${m.title}` : `  ${m.title}`,
                bx + 70,
                by + 24,
                14,
                selected ? '#ffea00' : '#ffffff',
                '#000000',
                'left'
            );
            this._drawPixelString(
                ctx,
                m.desc,
                bx + 80,
                by + 42,
                10,
                selected ? '#70f8a0' : '#94a3b8',
                '#000000',
                'left'
            );
        }

        this._drawPixelString(ctx, 'CONFIRMAR: U / ENTER / START / A-CRUZ   •   ATRÁS: P / ESC / B-CÍRCULO', cx, 514, 12, '#ff4d88', '#000000', 'center');
        ctx.restore();
    }

    /**
     * 3. PANTALLA DE ESCALERA DE LOS 12 NIVELES ANTES DE CADA PELEA ("STAGE LADDER 1-12")
     */
    drawStageLadderScreen(ctx, ladderData) {
        const { stageNumber, stageConfig, team1, team2 } = ladderData;
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        const isBoss = stageNumber === 12;
        ctx.fillStyle = isBoss ? '#240812' : '#0d1024';
        ctx.fillRect(0, 0, this.width, this.height);

        const cx = Math.floor(this.width * 0.5);
        this._drawPixelString(
            ctx,
            isBoss ? '¡NIVEL FINAL 12 / 12 — ALERTA: SE ACERCA EL JEFE FINAL!' : `TORNEO ARCADE — NIVEL ${stageNumber} DE 12`,
            cx,
            44,
            23,
            isBoss ? '#ff0044' : '#ffbe0b',
            '#000000',
            'center'
        );
        this._drawPixelString(ctx, stageConfig.name, cx, 72, 16, '#70f8a0', '#000000', 'center');

        // Escalera visual de los 12 Niveles (1 al 12)
        const stepW = 64;
        const stepH = 42;
        const gap = 10;
        const totalW = 12 * stepW + 11 * gap;
        const startX = Math.floor((this.width - totalW) * 0.5);
        const barY = 105;

        for (let s = 1; s <= 12; s++) {
            const sx = startX + (s - 1) * (stepW + gap);
            const isCleared = s < stageNumber;
            const isCurrent = s === stageNumber;
            const isRugalStage = s === 12;

            ctx.fillStyle = isCurrent ? '#ffea00' : isCleared ? '#52e584' : isRugalStage ? '#ff0044' : '#4a5568';
            ctx.fillRect(sx - 2, barY - 2, stepW + 4, stepH + 4);
            ctx.fillStyle = isCurrent ? '#381e42' : isCleared ? '#123026' : '#14162b';
            ctx.fillRect(sx, barY, stepW, stepH);

            this._drawPixelString(
                ctx,
                isRugalStage ? 'JEFE' : `NV-${s}`,
                sx + stepW * 0.5,
                barY + 18,
                11,
                isCurrent ? '#ffea00' : '#ffffff',
                '#000000',
                'center'
            );
            this._drawPixelString(
                ctx,
                isCleared ? 'GANÓ' : isCurrent ? 'HOY' : isRugalStage ? 'RUGAL' : '---',
                sx + stepW * 0.5,
                barY + 34,
                10,
                isCleared ? '#70f8a0' : isRugalStage ? '#ff4d88' : '#94a3b8',
                '#000000',
                'center'
            );
        }

        // Retratos de ambos equipos enfrentándose
        this._drawTeamSlotsPanel(ctx, 1, team1, 56, 210);
        this._drawTeamSlotsPanel(ctx, 2, team2, this.width - 56 - 380, 210);
        this._drawPixelString(ctx, 'VS', cx, 276, 34, '#ffea00', '#b8001f', 'center');

        if (isBoss) {
            this._drawPixelString(
                ctx,
                'OMEGA RUGAL: "¡NINGÚN MORTAL SOBREVIVIRÁ A MI PODER OMEGA!"',
                cx,
                405,
                15,
                '#ff4d88',
                '#000000',
                'center'
            );
        } else {
            this._drawPixelString(
                ctx,
                `PREPARANDO COMBATE DE NIVEL ${stageNumber}... ¡PRESIONA U / START O ESPERA!`,
                cx,
                405,
                15,
                '#ffffff',
                '#000000',
                'center'
            );
        }

        this._drawPixelString(
            ctx,
            'PRESIONA ESC / SELECT PARA VOLVER AL MENÚ DE MODOS DE PELEA',
            cx,
            485,
            13,
            '#70f8a0',
            '#000000',
            'center'
        );

        ctx.restore();
    }

    /**
     * Devuelve la posición (x, y, w, h) de cada uno de los 42 personajes en la cuadrícula KOF 2002:
     * - 9 columnas x 5 filas estilo auténtico KOF 2002.
     * - Fila 0: Índices 0..8 (Japón, Fatal Fury, Art of Fighting)
     * - Fila 1: Índices 9..17 (Ikari, Psycho Soldier, Mujeres Luchadoras)
     * - Fila 2: Índices 18..20 (Corea: Kim, Chang, Choi) | CRONÓMETRO CENTRAL (Cols 3, 4, 5) | Índices 21..23 (Jefes '96: Geese, Krauser, Mr. Big)
     * - Fila 3: Índices 24..32 (Orochi '97, Agentes 2000, NESTS 2001)
     * - Fila 4: Índices 33..41 (Iori, Kula, K9999, Angel, Shingo, Blue Mary, Lin, Jhun, Omega Rugal)
     */
    getCharacterSlotRect(index) {
        const slotW = 58;
        const slotH = 92;
        const gapX = 6;
        const gapY = 8;
        const startX = 368;
        const startY = 24;

        let row = 0;
        let col = 0;
        if (index < 18) {
            row = Math.floor(index / 9);
            col = index % 9;
        } else if (index <= 20) {
            row = 2;
            col = index - 18;
        } else if (index <= 23) {
            row = 2;
            col = (index - 21) + 6;
        } else if (index <= 32) {
            row = 3;
            col = index - 24;
        } else {
            row = 4;
            col = index - 33;
        }

        return {
            x: startX + col * (slotW + gapX),
            y: startY + row * (slotH + gapY),
            w: slotW,
            h: slotH
        };
    }

    /**
     * Devuelve el rectángulo del recuadro central del cronómetro digital KOF 2002.
     */
    getTimerRect() {
        const slotW = 58;
        const gapX = 6;
        const startX = 368;
        const startY = 24;
        return {
            x: startX + 3 * (slotW + gapX),
            y: startY + 2 * (92 + 8),
            w: 3 * slotW + 2 * gapX, // 186
            h: 92
        };
    }

    getOfficialTeamHeaderRect(teamCol) {
        return { x: -999, y: -999, w: 0, h: 0 };
    }

    /**
     * Pantalla 1:1 de Selección de Personajes estilo The King of Fighters 2002 Neo-Geo MVS:
     * - Izquierda: Panel 1P con ilustración de busto grande (fondo naranja) y 3 casillas verticales de equipo [1][2][3].
     *              Panel 2P con ilustración de busto grande (fondo magenta) y 3 casillas verticales de equipo [1][2][3].
     * - Derecha:   Cuadrícula de 9 columnas x 5 filas con los 42 personajes y cronómetro digital central (21.12).
     * - Cursores:  Cursor azul con insignia "1" para 1P, y cursor rojo con insignia "2" para 2P.
     */
    drawTeamSelectScreen(ctx, selectState) {
        const { roster, team1, team2, cursorIndex, p1Cursor, p2Cursor, isOnline, onlineRole, roomCode, gameMode, selectTimer } = selectState;
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);

        ctx.save();

        // 1. Fondo Azul Neo-Geo con rejilla isométrica perspectiva
        ctx.fillStyle = '#070f36';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        // Líneas diagonales de perspectiva arcade
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        for (let d = -this.height; d < this.width; d += 64) {
            ctx.beginPath();
            ctx.moveTo(d, 0);
            ctx.lineTo(d + this.height * 0.75, this.height);
            ctx.stroke();
        }
        ctx.restore();

        // 2. PANEL IZQUIERDO: 1P (Superior) y 2P (Inferior)
        const p1ActiveIdx = typeof p1Cursor === 'number' ? p1Cursor : cursorIndex;
        const p1Fighter = roster[p1ActiveIdx] || roster[0];

        let p2ActiveIdx = typeof p2Cursor === 'number' ? p2Cursor : 33; // Iori por defecto como en KOF 2002
        if (team2 && team2.length > 0 && typeof p2Cursor !== 'number') {
            const lastPicked = team2[team2.length - 1];
            p2ActiveIdx = roster.findIndex(c => c.id === lastPicked.id);
            if (p2ActiveIdx === -1) p2ActiveIdx = 33;
        }
        const p2Fighter = roster[p2ActiveIdx] || roster[33] || roster[3];

        // 2A. Recuadro Busto Grande 1P (Top: x: 24, y: 24, w: 268, h: 236)
        const p1BustCanvas = window.PixelArtRenderer.getKOFBigBustCanvas(p1Fighter, 268, 236, true);
        if (p1BustCanvas) {
            ctx.drawImage(p1BustCanvas, 24, 24);
        }

        // Casillas verticales de orden de equipo 1P [1], [2], [3] (x: 298, w: 56)
        this._drawVerticalTeamSlots(ctx, 1, team1, 298, 24, 56, 72, 10);

        // 2B. Recuadro Busto Grande 2P (Bottom: x: 24, y: 278, w: 268, h: 236)
        const p2BustCanvas = window.PixelArtRenderer.getKOFBigBustCanvas(p2Fighter, 268, 236, false);
        if (p2BustCanvas) {
            ctx.drawImage(p2BustCanvas, 24, 278);
        }

        // Casillas verticales de orden de equipo 2P [1], [2], [3] (x: 298, w: 56)
        this._drawVerticalTeamSlots(ctx, 2, team2, 298, 278, 56, 72, 10);

        // 3. CUADRÍCULA DE 42 PERSONAJES (Derecha: 9 columnas x 5 filas)
        const activeP1 = typeof p1Cursor === 'number' ? p1Cursor : cursorIndex;
        const activeP2 = typeof p2Cursor === 'number' ? p2Cursor : null;

        for (let i = 0; i < roster.length; i++) {
            const char = roster[i];
            const rect = this.getCharacterSlotRect(i);
            const isP1 = activeP1 === i;
            const isP2 = activeP2 === i;

            const p1Slot = team1.findIndex(c => c.id === char.id);
            const p2Slot = team2.findIndex(c => c.id === char.id);

            // Borde base blanco/metálico estilo KOF 2002
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
            ctx.fillStyle = '#0b0d1e';
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

            // Retrato pixel-art del personaje
            const pCanv = window.PixelArtRenderer.getPortraitCanvas(char, 54, false);
            ctx.drawImage(pCanv, rect.x + 2, rect.y + 4);

            // Tira inferior con el nombre del personaje
            ctx.fillStyle = '#080a18';
            ctx.fillRect(rect.x + 1, rect.y + rect.h - 18, rect.w - 2, 17);
            ctx.fillStyle = isP1 ? '#ffea00' : (isP2 ? '#ff70a6' : '#ffffff');
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(char.name.slice(0, 7), rect.x + rect.w * 0.5, rect.y + rect.h - 6);

            // Insignias de selección en el equipo
            if (p1Slot !== -1) {
                ctx.fillStyle = '#16a34a';
                ctx.fillRect(rect.x + 2, rect.y + 2, 24, 14);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px monospace';
                ctx.fillText(`1P·${p1Slot + 1}`, rect.x + 14, rect.y + 12);
            }
            if (p2Slot !== -1) {
                ctx.fillStyle = '#e11d48';
                ctx.fillRect(rect.x + rect.w - 26, rect.y + 2, 24, 14);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px monospace';
                ctx.fillText(`2P·${p2Slot + 1}`, rect.x + rect.w - 14, rect.y + 12);
            }

            // CURSORES KOF 2002
            // Cursor 1P: Marco azul brillante con insignia "1" en esquina inferior izquierda
            if (isP1) {
                const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.01);
                ctx.strokeStyle = `rgba(0, 240, 255, ${pulse})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);

                // Insignia azul "1" en la esquina inferior izquierda
                ctx.fillStyle = '#2563eb';
                ctx.fillRect(rect.x - 6, rect.y + rect.h - 18, 18, 18);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(rect.x - 6, rect.y + rect.h - 18, 18, 18);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('1', rect.x + 3, rect.y + rect.h - 4);
            }

            // Cursor 2P: Marco rojo brillante con insignia "2" en esquina superior derecha
            if (isP2) {
                const pulse2 = 0.8 + 0.2 * Math.cos(Date.now() * 0.01);
                ctx.strokeStyle = `rgba(255, 0, 85, ${pulse2})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);

                // Insignia roja "2" en la esquina superior derecha
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(rect.x + rect.w - 12, rect.y - 6, 18, 18);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(rect.x + rect.w - 12, rect.y - 6, 18, 18);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('2', rect.x + rect.w - 3, rect.y + 8);
            }
        }

        // 4. CRONÓMETRO DIGITAL CENTRAL KOF 2002 (Cols 3, 4, 5 en Fila 2)
        const tRect = this.getTimerRect();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tRect.x - 3, tRect.y - 3, tRect.w + 6, tRect.h + 6);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(tRect.x - 1, tRect.y - 1, tRect.w + 2, tRect.h + 2);
        ctx.fillStyle = '#050505';
        ctx.fillRect(tRect.x, tRect.y, tRect.w, tRect.h);

        // Tiempo en segundos y centésimas (como "21.12" de la captura de KOF 2002)
        const tVal = typeof selectTimer === 'number' ? Math.max(0, selectTimer) : 21.12;
        const sInt = Math.floor(tVal);
        const cVal = Math.floor((tVal % 1) * 100);
        const sStr = String(sInt).padStart(2, '0');
        const cStr = String(cVal).padStart(2, '0');

        const dX = tRect.x + 12;
        const dY = tRect.y + 14;

        // Dígitos grandes de segundos
        window.PixelArtRendererClass.drawArcadeDigit(ctx, sStr[0], dX, dY, 5, '#fbbf24', '#d97706', '#140c02');
        window.PixelArtRendererClass.drawArcadeDigit(ctx, sStr[1], dX + 42, dY, 5, '#fbbf24', '#d97706', '#140c02');

        // Punto decimal "."
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(dX + 84, dY + 32, 7, 7);

        // Dígitos medianos de centésimas
        window.PixelArtRendererClass.drawArcadeDigit(ctx, cStr[0], dX + 98, dY + 8, 4, '#fbbf24', '#d97706', '#140c02');
        window.PixelArtRendererClass.drawArcadeDigit(ctx, cStr[1], dX + 132, dY + 8, 4, '#fbbf24', '#d97706', '#140c02');

        // Etiqueta TIME abajo de los dígitos
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('TIME', tRect.x + tRect.w * 0.5, tRect.y + tRect.h - 8);

        // 5. BANNER INFERIOR DE INSTRUCCIONES EN ESPAÑOL
        this._drawPixelString(
            ctx,
            isOnline
                ? `ONLINE P2P • SALA: ${roomCode} • 1P: ${team1.length}/3  VS  2P: ${team2.length}/3`
                : (team1.length < 3
                    ? `ELIGE TUS 3 LUCHADORES (${team1.length}/3) • FLECHAS/WASD: MOVER • U/ENTER: ELEGIR • P/ESC: QUITAR`
                    : '¡EQUIPO LISTO! PRESIONA START / ENTER O HAZ CLIC EN EL CRONÓMETRO PARA INICIAR'),
            this.width * 0.5,
            this.height - 10,
            11,
            '#70f8a0',
            '#090a14',
            'center'
        );

        ctx.restore();
    }

    /**
     * Dibuja las 3 casillas verticales de selección de integrantes [1], [2], [3] de KOF 2002.
     */
    _drawVerticalTeamSlots(ctx, playerNum, team, startX, startY, slotW, slotH, gapY) {
        for (let i = 0; i < 3; i++) {
            const sy = startY + i * (slotH + gapY);
            const member = team[i];

            // Borde blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(startX - 2, sy - 2, slotW + 4, slotH + 4);
            ctx.fillStyle = '#0f142c';
            ctx.fillRect(startX, sy, slotW, slotH);

            // Insignia roja [1], [2], [3] en la esquina superior izquierda
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(startX, sy, 18, 16);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(i + 1), startX + 9, sy + 12);

            if (member) {
                // Retrato del miembro seleccionado
                const pCanv = window.PixelArtRenderer.getPortraitCanvas(member, 48, false);
                ctx.drawImage(pCanv, startX + (slotW - 48) * 0.5, sy + 14);

                // Nombre en miniatura
                ctx.fillStyle = '#ffea00';
                ctx.font = 'bold 9px monospace';
                ctx.fillText(member.name.slice(0, 6), startX + slotW * 0.5, sy + slotH - 4);
            } else {
                // Casilla vacía
                ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
                ctx.fillRect(startX + 6, sy + 22, slotW - 12, 36);
                ctx.fillStyle = '#64748b';
                ctx.font = '9px monospace';
                ctx.fillText('LIBRE', startX + slotW * 0.5, sy + 44);
            }
        }
    }

    _drawHoveredCharacterPreview(ctx, char, x, y, w, h) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = '#181432';
        ctx.fillRect(x, y, w, h);

        if (char) {
            this._drawCornerPortrait(ctx, char, x + 12, y + 12, 76, false);
            this._drawPixelString(ctx, char.name, x + 100, y + 24, 15, '#ffea00', '#000', 'left');
            this._drawPixelString(ctx, `${char.teamName} • SALUD:${char.stats.maxHp}`, x + 100, y + 40, 10, '#70f8a0', '#000', 'left');

            // Barras de estadísticas (ATQ, DEF, VEL)
            const atkPct = Math.min(1, (char.stats.attackPower || 1) / 1.35);
            const defPct = Math.min(1, (char.stats.defense || 1) / 1.3);
            const spdPct = Math.min(1, (char.stats.runSpeed || 7.5) / 10.5);
            const drawStatBar = (label, bx, by, pct, col) => {
                this._drawPixelString(ctx, label, bx, by + 7, 9, '#94a3b8', '#000', 'left');
                ctx.fillStyle = '#090a14';
                ctx.fillRect(bx + 26, by, 38, 7);
                ctx.fillStyle = col;
                ctx.fillRect(bx + 27, by + 1, Math.round(36 * pct), 5);
            };
            drawStatBar('ATQ', x + 100, y + 46, atkPct, '#ff5500');
            drawStatBar('DEF', x + 172, y + 46, defPct, '#00f5ff');
            drawStatBar('VEL', x + 244, y + 46, spdPct, '#52e584');

            this._drawPixelString(ctx, `236+P: ${char.moveset.special_QCF_P.name.slice(0, 24)}`, x + 100, y + 68, 10, '#cbd5e1', '#000', 'left');
            this._drawPixelString(ctx, `623+P: ${char.moveset.special_DP_P.name.slice(0, 24)}`, x + 100, y + 83, 10, '#cbd5e1', '#000', 'left');
            this._drawPixelString(ctx, `MAX2: ${(char.moveset.super_MAX2 || char.moveset.super_SDM).name.slice(0, 25)}`, x + 100, y + 98, 10, '#ff4d88', '#000', 'left');
        }

        // 3 Botones inferiores: "¡PELEAR!" (x+8..x+140), "LIMPIAR" (x+148..x+232), "◄ MODOS" (x+240..x+328)
        const btnStartX = x + 8;
        const btnStartY = y + 114;
        const btnStartW = 132;
        const btnStartH = 40;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(btnStartX - 2, btnStartY - 2, btnStartW + 4, btnStartH + 4);
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(btnStartX, btnStartY, btnStartW, btnStartH);
        this._drawPixelString(ctx, '¡PELEAR!', btnStartX + btnStartW * 0.5, btnStartY + 25, 13, '#ffffff', '#000', 'center');

        const btnClearX = x + 148;
        const btnClearY = y + 114;
        const btnClearW = 84;
        const btnClearH = 40;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(btnClearX - 2, btnClearY - 2, btnClearW + 4, btnClearH + 4);
        ctx.fillStyle = '#334155';
        ctx.fillRect(btnClearX, btnClearY, btnClearW, btnClearH);
        this._drawPixelString(ctx, 'LIMPIAR', btnClearX + btnClearW * 0.5, btnClearY + 25, 11, '#ffea00', '#000', 'center');

        const btnBackX = x + 240;
        const btnBackY = y + 114;
        const btnBackW = 88;
        const btnBackH = 40;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(btnBackX - 2, btnBackY - 2, btnBackW + 4, btnBackH + 4);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(btnBackX, btnBackY, btnBackW, btnBackH);
        this._drawPixelString(ctx, '◄ MODOS', btnBackX + btnBackW * 0.5, btnBackY + 25, 11, '#70f8a0', '#000', 'center');
    }

    _drawCompactTeamPanel(ctx, playerIndex, team, x, y, w, h) {
        const isP1 = playerIndex === 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = '#14162e';
        ctx.fillRect(x, y, w, h);

        this._drawPixelString(
            ctx,
            isP1 ? 'EQUIPO 1P (ELIGE 3)' : 'EQUIPO 2P / RIVAL',
            x + 12,
            y + 20,
            13,
            isP1 ? '#52e584' : '#ff4d88',
            '#000',
            'left'
        );

        const roleLabels = ['1º LÍDER', '2º MEDIO', '3º ANCLA'];
        for (let slot = 0; slot < 3; slot++) {
            const sx = x + 10 + slot * 88;
            const sy = y + 32;
            const member = team[slot];

            ctx.fillStyle = member ? '#ffbe0b' : '#475569';
            ctx.fillRect(sx - 2, sy - 2, 84, 122);
            ctx.fillStyle = '#0b0d1c';
            ctx.fillRect(sx, sy, 80, 118);

            if (member) {
                const pCanv = window.PixelArtRenderer.getPortraitCanvas(member, 64, !isP1);
                ctx.drawImage(pCanv, sx + 8, sy + 8);
                this._drawPixelString(ctx, roleLabels[slot], sx + 40, sy + 88, 10, '#ffea00', '#000', 'center');
                this._drawPixelString(ctx, member.name.slice(0, 8), sx + 40, sy + 106, 10, '#ffffff', '#000', 'center');
            } else {
                this._drawPixelString(ctx, roleLabels[slot], sx + 40, sy + 52, 10, '#94a3b8', '#000', 'center');
                this._drawPixelString(ctx, 'LIBRE', sx + 40, sy + 72, 11, '#64748b', '#000', 'center');
            }
        }
    }

    _drawTeamSlotsPanel(ctx, playerIndex, team, x, y) {
        const w = 380;
        const h = 118;
        const isP1 = playerIndex === 1;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
        ctx.fillStyle = '#181834';
        ctx.fillRect(x, y, w, h);

        this._drawPixelString(
            ctx,
            isP1 ? 'ORDEN EQUIPO 1P (1º / 2º / 3º)' : 'ORDEN EQUIPO 2P (1º / 2º / 3º)',
            x + 14,
            y + 22,
            13,
            isP1 ? '#70f8a0' : '#ff4d88',
            '#090a14',
            'left'
        );

        for (let slot = 0; slot < 3; slot++) {
            const sx = x + 16 + slot * 118;
            const sy = y + 34;
            const member = team[slot];

            ctx.fillStyle = member ? '#ffbe0b' : '#4a5568';
            ctx.fillRect(sx - 2, sy - 2, 112, 74);
            ctx.fillStyle = '#0e0e20';
            ctx.fillRect(sx, sy, 108, 70);

            if (member) {
                const pCanv = window.PixelArtRenderer.getPortraitCanvas(member, 48, false);
                ctx.drawImage(pCanv, sx + 6, sy + 11);
                this._drawPixelString(ctx, `${slot + 1}º`, sx + 60, sy + 28, 12, '#ffbe0b', '#000', 'left');
                this._drawPixelString(ctx, member.name.slice(0, 6), sx + 58, sy + 48, 11, '#ffffff', '#000', 'left');
            } else {
                this._drawPixelString(ctx, `VACÍO ${slot + 1}`, sx + 54, sy + 40, 12, '#64748b', '#000', 'center');
            }
        }
    }

    /**
     * Dibuja el Menú de Pausa y Navegación durante el combate (controlado con Teclado, Mando o Clic).
     */
    drawPauseMenuOverlay(ctx, pauseCursor = 0, gameMode = 'ARCADE_12', dummyMode = 'QUIETO') {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        ctx.fillStyle = 'rgba(6, 8, 20, 0.86)';
        ctx.fillRect(0, 0, this.width, this.height);

        const cx = Math.floor(this.width * 0.5);
        const modalW = 580;
        const isPractice = gameMode === 'PRACTICE';
        const modalH = isPractice ? 400 : 360;
        const mx = cx - modalW * 0.5;
        const my = Math.floor((this.height - modalH) * 0.5);

        ctx.fillStyle = '#ffbe0b';
        ctx.fillRect(mx - 4, my - 4, modalW + 8, modalH + 8);
        ctx.fillStyle = '#12152e';
        ctx.fillRect(mx, my, modalW, modalH);

        this._drawPixelString(ctx, isPractice ? 'PAUSA — MODO PRÁCTICA' : 'PAUSA / MENÚ DE NAVEGACIÓN', cx, my + 34, 22, '#ffbe0b', '#000000', 'center');
        this._drawPixelString(ctx, 'USA W/S, FLECHAS O MANDO • U/ENTER/START: SELECCIONAR', cx, my + 56, 11, '#70f8a0', '#000000', 'center');

        const options = isPractice ? [
            '1. CONTINUAR ENTRENAMIENTO',
            `2. COMPORTAMIENTO MANIQUÍ: [ ${dummyMode} ]`,
            '3. CONFIGURAR CONTROLES (TECLADO / MANDO)',
            '4. CAMBIAR PERSONAJES',
            '5. SALIR AL MENÚ DE MODOS',
            '6. VOLVER AL MENÚ DE INICIO'
        ] : [
            '1. CONTINUAR PELEA',
            '2. CONFIGURAR CONTROLES (TECLADO / MANDO)',
            '3. CAMBIAR PERSONAJES (SELECCIÓN DE EQUIPOS)',
            '4. CAMBIAR MODO DE PELEA (MENÚ DE MODOS)',
            '5. REINICIAR COMBATE ACTUAL',
            '6. VOLVER A LA PANTALLA DE TÍTULO'
        ];

        const btnW = 512;
        const btnH = 36;
        const startY = my + 76;
        const gap = 8;

        for (let i = 0; i < options.length; i++) {
            const bx = cx - btnW * 0.5;
            const by = startY + i * (btnH + gap);
            const selected = i === pauseCursor;

            ctx.fillStyle = selected ? '#ffea00' : '#475569';
            ctx.fillRect(bx - 2, by - 2, btnW + 4, btnH + 4);
            ctx.fillStyle = selected ? '#2a183c' : '#181e38';
            ctx.fillRect(bx, by, btnW, btnH);

            this._drawPixelString(
                ctx,
                selected ? `► ${options[i]}` : `  ${options[i]}`,
                bx + 16,
                by + 23,
                13,
                selected ? '#ffea00' : '#ffffff',
                '#000000',
                'left'
            );
        }

        ctx.restore();
    }

    /**
     * Dibuja la capa informativa del Modo Práctica (Dummy, Datos de Combo, Ventaja y Visualizador de Inputs).
     */
    drawPracticeOverlay(ctx, p1Input, p2Input, fighter1, fighter2, dummyMode = 'QUIETO') {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        // 1. Panel de Datos de Combate (Centro Superior)
        const cx = Math.floor(this.width * 0.5);
        ctx.fillStyle = 'rgba(10, 14, 28, 0.78)';
        ctx.fillRect(cx - 210, 68, 420, 52);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 210, 68, 420, 52);

        this._drawPixelString(ctx, `MANIQUÍ: [ ${dummyMode} ]`, cx, 83, 11, '#c084fc', '#000000', 'center');

        const comboHits = fighter2 ? (fighter2.comboHitsTaken || 0) : 0;
        const comboDmg = fighter2 ? Math.round(fighter2.damageTakenInCombo || 0) : 0;
        const stunTimer = fighter2 ? fighter2.stunTimer : 0;
        const guardPct = fighter2 ? Math.round((fighter2.guardGauge / fighter2.maxGuardGauge) * 100) : 100;

        const statText = `COMBO: ${comboHits} GOLPES  •  DAÑO: ${comboDmg}  •  STUN: ${stunTimer}f  •  GUARDIA: ${guardPct}%`;
        this._drawPixelString(ctx, statText, cx, 102, 10, comboHits > 1 ? '#ffea00' : '#94a3b8', '#000000', 'center');

        this._drawPixelString(ctx, `ESTADO P1: ${fighter1 ? fighter1.state : 'IDLE'}  •  P2: ${fighter2 ? fighter2.state : 'IDLE'}`, cx, 114, 8, '#38bdf8', '#000000', 'center');

        // 2. Visualizador de Inputs en Tiempo Real para Jugador 1 (Esquina Inferior Izquierda)
        const drawInputDisplay = (input, startX, startY, label, color) => {
            if (!input) return;
            ctx.fillStyle = 'rgba(6, 8, 20, 0.75)';
            ctx.fillRect(startX, startY, 180, 48);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(startX, startY, 180, 48);

            this._drawPixelString(ctx, label, startX + 8, startY + 14, 9, color, '#000000', 'left');

            let dirStr = '•';
            if (input.held.up && input.held.left) dirStr = '↖';
            else if (input.held.up && input.held.right) dirStr = '↗';
            else if (input.held.down && input.held.left) dirStr = '↙';
            else if (input.held.down && input.held.right) dirStr = '↘';
            else if (input.held.up) dirStr = '↑';
            else if (input.held.down) dirStr = '↓';
            else if (input.held.left) dirStr = '←';
            else if (input.held.right) dirStr = '→';

            this._drawPixelString(ctx, `DIR: ${dirStr}`, startX + 8, startY + 36, 16, '#ffea00', '#000000', 'left');

            const btnLabels = [
                { id: 'LP', text: 'LP', on: input.held.LP },
                { id: 'HP', text: 'HP', on: input.held.HP },
                { id: 'LK', text: 'LK', on: input.held.LK },
                { id: 'HK', text: 'HK', on: input.held.HK },
                { id: 'EV', text: 'ROD', on: input.held.roll },
                { id: 'MAX', text: 'MAX', on: input.held.max }
            ];

            let bx = startX + 68;
            for (const b of btnLabels) {
                ctx.fillStyle = b.on ? color : '#1e293b';
                ctx.fillRect(bx, startY + 22, 16, 16);
                this._drawPixelString(ctx, b.text[0], bx + 8, startY + 34, 9, b.on ? '#000000' : '#64748b', null, 'center');
                bx += 18;
            }
        };

        drawInputDisplay(p1Input, 20, this.height - 84, 'INPUTS JUGADOR 1', '#00ffc3');
        drawInputDisplay(p2Input, this.width - 200, this.height - 84, 'INPUTS MANIQUÍ / P2', '#ff0055');

        // 3. Barra de atajos rápidos inferior
        ctx.fillStyle = 'rgba(6, 8, 20, 0.85)';
        ctx.fillRect(cx - 240, this.height - 24, 480, 20);
        this._drawPixelString(ctx, 'SELECT / NUM 0: REINICIAR POSICIONES   •   START / ESC: MENÚ DE PRÁCTICA', cx, this.height - 10, 10, '#38bdf8', '#000000', 'center');

        ctx.restore();
    }

    /**
     * Dibuja la pantalla de Configuración de Controles interactiva.
     */
    drawControlsConfigScreen(ctx, inputHandler, pIndex = 1, selectedActionIdx = 0, waitingForKey = false) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        // Fondo degradado Neo-Geo
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#0a0d1a');
        grad.addColorStop(0.5, '#12182b');
        grad.addColorStop(1, '#080a14');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        for (let y = 0; y < this.height; y += 4) {
            ctx.fillRect(0, y, this.width, 2);
        }

        const cx = Math.floor(this.width * 0.5);
        this._drawPixelString(ctx, 'THE KING OF AZTLAN — CONFIGURACIÓN DE CONTROLES', cx, 42, 20, '#38bdf8', '#000000', 'center');

        // Pestañas de Jugador 1 / Jugador 2
        const tabW = 280;
        const tabY = 58;
        const p1Active = pIndex === 1;

        ctx.fillStyle = p1Active ? '#38bdf8' : '#1e293b';
        ctx.fillRect(cx - tabW - 10, tabY, tabW, 28);
        this._drawPixelString(ctx, '◄ [1] JUGADOR 1 (TECLADO / MANDO 1) ►', cx - tabW * 0.5 - 10, tabY + 19, 11, p1Active ? '#090a14' : '#94a3b8', null, 'center');

        ctx.fillStyle = !p1Active ? '#ff0055' : '#1e293b';
        ctx.fillRect(cx + 10, tabY, tabW, 28);
        this._drawPixelString(ctx, '◄ [2] JUGADOR 2 (TECLADO / MANDO 2) ►', cx + tabW * 0.5 + 10, tabY + 19, 11, !p1Active ? '#ffffff' : '#94a3b8', null, 'center');

        // Lista de acciones
        const actionKeys = [
            { id: 'up', label: 'Arriba / Salto' },
            { id: 'down', label: 'Abajo / Agacharse' },
            { id: 'left', label: 'Izquierda (Retroceder / Guardia)' },
            { id: 'right', label: 'Derecha (Avanzar)' },
            { id: 'lp', label: 'Puño Débil (LP)' },
            { id: 'hp', label: 'Puño Fuerte (HP)' },
            { id: 'lk', label: 'Patada Débil (LK)' },
            { id: 'hk', label: 'Patada Fuerte (HK)' },
            { id: 'roll', label: 'Evasión / Rodada (LP + LK)' },
            { id: 'max', label: 'Modo MAX / Activación (HP + LK)' }
        ];

        const listW = 720;
        const rowH = 26;
        const startY = 96;

        for (let i = 0; i < actionKeys.length; i++) {
            const item = actionKeys[i];
            const ry = startY + i * (rowH + 3);
            const isSel = i === selectedActionIdx;

            ctx.fillStyle = isSel ? '#1e2942' : '#0f172a';
            ctx.fillRect(cx - listW * 0.5, ry, listW, rowH);
            ctx.strokeStyle = isSel ? '#38bdf8' : '#334155';
            ctx.lineWidth = isSel ? 2 : 1;
            ctx.strokeRect(cx - listW * 0.5, ry, listW, rowH);

            this._drawPixelString(ctx, isSel ? `► ${item.label}` : `  ${item.label}`, cx - listW * 0.5 + 14, ry + 18, 12, isSel ? '#ffea00' : '#e2e8f0', '#000000', 'left');

            let keyDisplay = inputHandler ? inputHandler.getKeyDisplayName(pIndex, item.id) : '';
            if (isSel && waitingForKey) {
                keyDisplay = '>> PRESIONA UNA TECLA O BOTÓN <<';
            }

            this._drawPixelString(ctx, keyDisplay, cx + listW * 0.5 - 14, ry + 18, 12, (isSel && waitingForKey) ? '#00ffc3' : (isSel ? '#38bdf8' : '#94a3b8'), '#000000', 'right');
        }

        // Opciones inferiores (Restablecer y Salir)
        const optRestablecerSel = selectedActionIdx === 10;
        const optSalirSel = selectedActionIdx === 11;
        const btnY = startY + actionKeys.length * (rowH + 3) + 8;

        ctx.fillStyle = optRestablecerSel ? '#ffbe0b' : '#1e293b';
        ctx.fillRect(cx - 320, btnY, 300, 32);
        this._drawPixelString(ctx, optRestablecerSel ? '► RESTABLECER DEFECTO' : '  RESTABLECER DEFECTO', cx - 170, btnY + 21, 11, optRestablecerSel ? '#090a14' : '#e2e8f0', null, 'center');

        ctx.fillStyle = optSalirSel ? '#00ffc3' : '#1e293b';
        ctx.fillRect(cx + 20, btnY, 300, 32);
        this._drawPixelString(ctx, optSalirSel ? '► GUARDAR Y VOLVER' : '  GUARDAR Y VOLVER', cx + 170, btnY + 21, 11, optSalirSel ? '#090a14' : '#e2e8f0', null, 'center');

        // Footer instructivo
        this._drawPixelString(ctx, 'ARRIBA/ABAJO: SELECCIONAR • ENTER/U/A: ASIGNAR • TAB/1/2: CAMBIAR JUGADOR • R: RESTABLECER • ESC: SALIR', cx, 516, 11, '#ff4d88', '#000000', 'center');

        ctx.restore();
    }

    /**
     * Dibuja la pantalla cinematográfica de victoria de equipo (Ending Screen tras derrotar a Omega Rugal).
     */
    drawTeamEndingScreen(ctx, team1 = [], globalFrame = 0) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#070a14');
        grad.addColorStop(0.5, '#181226');
        grad.addColorStop(1, '#05070e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let y = 0; y < this.height; y += 4) {
            ctx.fillRect(0, y, this.width, 2);
        }

        const cx = Math.floor(this.width * 0.5);

        // Título con brillo
        const glow = Math.sin(globalFrame * 0.08) * 0.2 + 0.8;
        this._drawPixelString(ctx, '¡¡ CAMPEONES SUPREMOS DEL TORNEO DE AZTLÁN !!', cx, 54, 22, `rgba(255, 190, 11, ${glow})`, '#000000', 'center');
        this._drawPixelString(ctx, 'EL ALTAR SAGRADO HA SIDO LIBERADO • EL TIRANO OMEGA RUGAL HA CAÍDO', cx, 78, 12, '#70f8a0', '#000000', 'center');

        // Retratos de los 3 héroes del equipo vencedor
        const roster = window.CHARACTER_ROSTER || [];
        const portSize = 96;
        const totalW = 3 * portSize + 2 * 48;
        const startX = cx - totalW * 0.5;

        for (let i = 0; i < 3; i++) {
            const member = team1[i] || roster[i];
            const px = startX + i * (portSize + 48);
            const py = 112;

            ctx.fillStyle = '#ffbe0b';
            ctx.fillRect(px - 4, py - 4, portSize + 8, portSize + 8);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px, py, portSize, portSize);

            if (member) {
                const pCanv = window.PixelArtRenderer.getPortraitCanvas(member, portSize, false);
                ctx.drawImage(pCanv, px, py);
            }

            this._drawPixelString(ctx, member ? member.name.toUpperCase() : `HÉROE ${i + 1}`, px + portSize * 0.5, py + portSize + 22, 11, '#ffea00', '#000000', 'center');
            this._drawPixelString(ctx, member ? (member.title || 'GUERRERO') : 'CAMPEÓN', px + portSize * 0.5, py + portSize + 36, 9, '#94a3b8', '#000000', 'center');
        }

        // Epílogo narrativo
        const narrativeBoxW = 760;
        const narrativeBoxH = 110;
        const nbX = cx - narrativeBoxW * 0.5;
        const nbY = 282;

        ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
        ctx.fillRect(nbX, nbY, narrativeBoxW, narrativeBoxH);
        ctx.strokeStyle = '#ffbe0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(nbX, nbY, narrativeBoxW, narrativeBoxH);

        const lines = [
            'Con el colapso del Altar de Obsidiana, la oscura ambición de Omega Rugal ha sido destruida.',
            'La llama cósmica de Quetzalcóatl vuelve a arder con honor sobre la gran pirámide de Aztlán.',
            'Los tres guerreros han escrito sus nombres en la eternidad del calendario solar.',
            '¡El reino de Aztlán reconoce a sus más grandes leyendas marciales!'
        ];

        for (let l = 0; l < lines.length; l++) {
            this._drawPixelString(ctx, lines[l], cx, nbY + 28 + l * 20, 11, '#f8fafc', '#000000', 'center');
        }

        // Prompt parpadeante para avanzar a los créditos
        if (Math.floor(globalFrame / 30) % 2 === 0) {
            this._drawPixelString(ctx, '► PRESIONA CUALQUIER BOTÓN PARA VER LOS CRÉDITOS ◄', cx, 432, 13, '#00ffc3', '#000000', 'center');
        }

        this._drawPixelString(ctx, 'U / ENTER / START / A: CONTINUAR   •   ESC: SALIR AL MENÚ', cx, 492, 11, '#ff4d88', '#000000', 'center');

        ctx.restore();
    }

    /**
     * Dibuja los Créditos Finales con desplazamiento suave (Ending Credits Arcade).
     */
    drawCreditsScreen(ctx, globalFrame = 0, scrollY = 0) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        ctx.fillStyle = '#04060d';
        ctx.fillRect(0, 0, this.width, this.height);

        // Estrellas parpadeantes de fondo
        for (let i = 0; i < 40; i++) {
            const sx = (i * 97) % this.width;
            const sy = (i * 61) % this.height;
            const bright = Math.sin(globalFrame * 0.05 + i) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${bright * 0.6})`;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        for (let y = 0; y < this.height; y += 4) {
            ctx.fillRect(0, y, this.width, 2);
        }

        const cx = Math.floor(this.width * 0.5);

        const credits = [
            { text: 'THE KING OF AZTLAN', size: 24, color: '#ffbe0b', space: 32 },
            { text: 'TORNEO DE ARTES MARCIALES 3 VS 3', size: 12, color: '#00ffc3', space: 48 },

            { text: 'DIRECCIÓN Y PRODUCCIÓN GENERAL', size: 11, color: '#94a3b8', space: 18 },
            { text: 'JOSEWARD & EQUIPO AZTLÁN', size: 15, color: '#ffffff', space: 40 },

            { text: 'MOTOR DE COMBATE A 60 FPS', size: 11, color: '#94a3b8', space: 18 },
            { text: 'HTML5 CANVAS FIXED-TIMESTEP ENGINE', size: 14, color: '#38bdf8', space: 40 },

            { text: 'SISTEMA DE LUCHADORES Y ROSTER', size: 11, color: '#94a3b8', space: 18 },
            { text: '42 PERSONAJES CON MOVIMIENTOS FIRMA Y MAX2', size: 14, color: '#f59e0b', space: 40 },

            { text: 'ESCENARIOS MESOAMERICANOS', size: 11, color: '#94a3b8', space: 18 },
            { text: 'TEOTIHUACÁN • XOCHIMILCO • POPOCATÉPETL • CENOTE SELVA MAYA', size: 12, color: '#10b981', space: 40 },

            { text: 'SÍNTESIS DE AUDIO RETRO WEBAUDIO', size: 11, color: '#94a3b8', space: 18 },
            { text: 'SINTETIZADOR DE CHIPTUNES Y SFX NEO-GEO', size: 14, color: '#a855f7', space: 40 },

            { text: 'CÓDIGO DE RED DETERMINISTA', size: 11, color: '#94a3b8', space: 18 },
            { text: 'PEER-TO-PEER CON BUFFER DE RETARDO DE 2 FRAMES', size: 13, color: '#06b6d4', space: 40 },

            { text: 'INSPIRADO EN LAS GLORIAS DE LA ERA ARCADE', size: 11, color: '#94a3b8', space: 18 },
            { text: 'SNK NEO-GEO MVS & THE KING OF FIGHTERS 2002', size: 14, color: '#ff0055', space: 48 },

            { text: '¡GRACIAS POR JUGAR!', size: 20, color: '#ffea00', space: 24 },
            { text: 'THANK YOU FOR PLAYING!', size: 13, color: '#00ffc3', space: 60 },
            { text: 'FIN', size: 22, color: '#ffbe0b', space: 40 }
        ];

        let curY = this.height - scrollY;

        for (const item of credits) {
            if (curY > -40 && curY < this.height + 40) {
                this._drawPixelString(ctx, item.text, cx, Math.floor(curY), item.size, item.color, '#000000', 'center');
            }
            curY += item.space;
        }

        // Barra inferior fija
        ctx.fillStyle = 'rgba(5, 7, 14, 0.9)';
        ctx.fillRect(0, this.height - 32, this.width, 32);
        this._drawPixelString(ctx, 'PRESIONA START / ESC / ENTER PARA VOLVER AL MENÚ PRINCIPAL', cx, this.height - 12, 11, '#ff4d88', '#000000', 'center');

        ctx.restore();
    }

    /**
     * Dibuja texto con sombra dura en píxeles y contorno retro arcade.
     */
    _drawPixelString(ctx, text, x, y, fontSize, fillColor, shadowColor, align = 'left') {
        ctx.save();
        ctx.font = `900 ${fontSize}px "Courier New", monospace`;
        ctx.textAlign = align;
        const rx = Math.round(x);
        const ry = Math.round(y);

        // Sombra pixelada dura de 2px en las 4 direcciones
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, rx - 2, ry);
        ctx.fillText(text, rx + 2, ry);
        ctx.fillText(text, rx, ry - 2);
        ctx.fillText(text, rx, ry + 2);
        ctx.fillText(text, rx + 2, ry + 2);

        ctx.fillStyle = fillColor;
        ctx.fillText(text, rx, ry);
        ctx.restore();
    }
}

window.HUD = HUD;
