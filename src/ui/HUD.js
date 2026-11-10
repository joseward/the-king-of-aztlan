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
        this._drawTopNeoGeoHUD(ctx, fighter1, fighter2, team1, team2, team1Index, team2Index, timerSeconds);

        // 2. Bloque Inferior (Dígito de Stock, Cápsula MÁXIMO, NV-1 y CRÉDITO)
        this._drawBottomNeoGeoPowerHUD(ctx, 1, fighter1);
        this._drawBottomNeoGeoPowerHUD(ctx, 2, fighter2);

        // Etiquetas inferiores arcade (NV-X y botón de Menú en el centro, CRÉDITOS bajo las barras)
        const stLabel = matchState.currentStageNumber ? `NV-${matchState.currentStageNumber}` : 'NV-1';
        this._drawPixelString(ctx, stLabel, this.width * 0.5, this.height - 34, 12, '#ffea00', '#090a14', 'center');

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
    _drawTopNeoGeoHUD(ctx, fighter1, fighter2, team1, team2, team1Index, team2Index, timerSeconds) {
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

        // 2 Dígitos pixelados grandes del Timer (azul claro / lavanda)
        const secStr = String(Math.max(0, Math.ceil(timerSeconds))).padStart(2, '0');
        const digitFill = timerSeconds <= 10 ? '#ff5577' : '#9bb4ff';
        const digitShade = timerSeconds <= 10 ? '#b81d3d' : '#5e78d6';
        window.PixelArtRendererClass.drawArcadeDigit(ctx, secStr[0], cx - 32, 24, 4, digitFill, digitShade, '#080814');
        window.PixelArtRendererClass.drawArcadeDigit(ctx, secStr[1], cx + 4, 24, 4, digitFill, digitShade, '#080814');

        // D. Retratos Pixel-Art en las esquinas superiores con marco blanco biselado
        this._drawCornerPortrait(ctx, fighter1.template, p1PortraitX, portraitY, portraitSize, false);
        this._drawCornerPortrait(ctx, fighter2.template, p2PortraitX, portraitY, portraitSize, true);

        // E. Nombres de los personajes en rosa/magenta pixelado bajo la barra de salud
        this._drawPixelString(ctx, fighter1.name, p1BarX + 12, barY + barH + 18, 16, '#ff4d88', '#14081c', 'left');
        this._drawPixelString(ctx, fighter2.name, p2PortraitX - 12, barY + barH + 18, 16, '#ff4d88', '#14081c', 'right');

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

            ctx.fillStyle = hpRatio < 0.28 ? '#ff5500' : '#52e584';
            ctx.fillRect(innerX + (innerW - hpW), innerY, hpW, innerH);
            ctx.fillStyle = hpRatio < 0.28 ? '#ffaa00' : '#9efcd0';
            ctx.fillRect(innerX + (innerW - hpW), innerY, hpW, 4);
        } else {
            // Jugador 2: Llena desde el reloj central (izquierda)
            ctx.fillStyle = '#d90429';
            ctx.fillRect(innerX, innerY, redW, innerH);

            ctx.fillStyle = hpRatio < 0.28 ? '#ff5500' : '#52e584';
            ctx.fillRect(innerX, innerY, hpW, innerH);
            ctx.fillStyle = hpRatio < 0.28 ? '#ffaa00' : '#9efcd0';
            ctx.fillRect(innerX, innerY, hpW, 4);
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
        this._drawPixelString(ctx, `¡${hits} GOLPES!`, x, 128, 28, '#ffea00', '#14081c', isP1 ? 'left' : 'right');
        this._drawPixelString(ctx, `DAÑO ${damage}`, x, 146, 13, '#ffffff', '#090a14', isP1 ? 'left' : 'right');
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
     * 1. PANTALLA DE ENTRADA CON EL TÍTULO Y ANIMACIÓN ARCADE ("TITLE SCREEN")
     */
    drawTitleScreen(ctx, globalFrame) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        // Fondo nocturno carmesí/azul con relámpagos ocasionales
        const flash = (globalFrame % 180 < 4) || (globalFrame % 180 === 7);
        ctx.fillStyle = flash ? '#4a1c40' : '#090918';
        ctx.fillRect(0, 0, this.width, this.height);

        for (let y = 0; y < this.height; y += 12) {
            ctx.fillStyle = (y / 12) % 2 === 0 ? (flash ? '#682454' : '#12122b') : (flash ? '#4a1c40' : '#090918');
            ctx.fillRect(0, y, this.width, 6);
        }

        const cx = Math.floor(this.width * 0.5);

        // Sombra imponente de OMEGA RUGAL al centro con ojos rojos encendidos
        const rugalPortrait = window.PixelArtRenderer.getPortraitCanvas(window.BOSS_RUGAL_TEMPLATE, 152, false);
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.drawImage(rugalPortrait, cx - 76, 36);
        ctx.restore();

        // Marco emblema arcade superior
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 344, 72, 688, 128);
        ctx.fillStyle = '#181028';
        ctx.fillRect(cx - 338, 78, 676, 116);
        ctx.fillStyle = '#b8001f';
        ctx.fillRect(cx - 332, 84, 664, 104);
        ctx.fillStyle = '#120a20';
        ctx.fillRect(cx - 326, 90, 652, 92);

        this._drawPixelString(ctx, 'MOTOR 2D ESTILO SNK / NEO-GEO MVS', cx, 112, 13, '#70f8a0', '#000000', 'center');
        this._drawPixelString(ctx, 'THE KING OF AZTLAN', cx, 150, 42, '#ffbe0b', '#14081c', 'center');
        this._drawPixelString(ctx, 'TORNEO DE 12 NIVELES  •  JEFE FINAL: OMEGA RUGAL', cx, 174, 14, '#ff4d88', '#000000', 'center');

        // Dos peleadores de complexión humana en pose de guardia frente a frente en la intro
        const demoP1 = new window.Fighter({
            playerIndex: 1,
            template: window.CHARACTER_ROSTER[0],
            x: cx - 190,
            groundY: 438,
            facing: 1
        });
        demoP1.animFrame = globalFrame;

        const demoRugal = new window.Fighter({
            playerIndex: 2,
            template: window.BOSS_RUGAL_TEMPLATE,
            x: cx + 190,
            groundY: 438,
            facing: -1
        });
        demoRugal.animFrame = globalFrame;

        demoP1.draw(ctx, false);
        demoRugal.draw(ctx, false);

        this._drawPixelString(ctx, 'VS', cx, 345, 36, '#ffea00', '#b8001f', 'center');

        // Texto parpadeante en español
        if (Math.floor(globalFrame / 22) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 268, 460, 536, 38);
            ctx.fillStyle = '#181028';
            ctx.fillRect(cx - 264, 464, 528, 30);
            this._drawPixelString(
                ctx,
                'PRESIONA ENTER / START / PUÑO (U) O HAZ CLIC',
                cx,
                485,
                16,
                '#ffea00',
                '#000000',
                'center'
            );
        }

        this._drawPixelString(ctx, 'CRÉDITOS  02', cx, 524, 14, '#7898ff', '#000000', 'center');
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
                desc: 'Elige a tus 3 luchadores y supera los 12 niveles hasta enfrentar a OMEGA RUGAL.'
            },
            {
                title: '2. EQUIPO VS CPU (PELEA LIBRE 3 VS 3)',
                desc: 'Combate directo por equipos 3 contra 3 eligiendo ambos bandos.'
            },
            {
                title: '3. VERSUS 2 JUGADORES LOCAL (1P VS 2P)',
                desc: 'Duelo multijugador local con teclado o 2 mandos USB / Bluetooth.'
            },
            {
                title: '4. DESAFÍO FINAL: NIVEL 12 VS OMEGA RUGAL',
                desc: 'Salta directamente al Nivel 12 para poner a prueba tu equipo contra Rugal.'
            }
        ];

        const boxW = 720;
        const boxH = 74;
        const startY = 122;
        const gap = 18;

        for (let i = 0; i < modes.length; i++) {
            const m = modes[i];
            const bx = cx - boxW * 0.5;
            const by = startY + i * (boxH + gap);
            const selected = i === modeIndex;

            ctx.fillStyle = selected ? '#ffea00' : '#4a5568';
            ctx.fillRect(bx - 4, by - 4, boxW + 8, boxH + 8);
            ctx.fillStyle = selected ? '#261838' : '#14162b';
            ctx.fillRect(bx, by, boxW, boxH);

            this._drawPixelString(
                ctx,
                selected ? `► ${m.title}` : `  ${m.title}`,
                bx + 22,
                by + 30,
                17,
                selected ? '#ffea00' : '#ffffff',
                '#000000',
                'left'
            );
            this._drawPixelString(
                ctx,
                m.desc,
                bx + 42,
                by + 54,
                12,
                selected ? '#70f8a0' : '#94a3b8',
                '#000000',
                'left'
            );
        }

        this._drawPixelString(ctx, 'CONFIRMAR: U / ENTER / START / A-CRUZ   •   ATRÁS: P / ESC / B-CÍRCULO', cx, 508, 13, '#ff4d88', '#000000', 'center');
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
     * - Índices 0..32 (11 Equipos Oficiales x 3 miembros): 11 columnas x 3 filas.
     * - Índices 33..41 (8 Personajes Edit + Omega Rugal): Fila inferior (Fila 3) centrada.
     */
    getCharacterSlotRect(index) {
        const cellW = 76;
        const cellH = 58;
        const gapX = 6;
        const gapY = 6;
        const startX = 32;
        const startY = 88;

        if (index < 33) {
            const col = Math.floor(index / 3);
            const row = index % 3;
            return {
                x: startX + col * (cellW + gapX),
                y: startY + row * (cellH + gapY),
                w: cellW,
                h: cellH
            };
        }

        // Fila 3: 8 Edit Characters + Omega Rugal (9 casillas centradas)
        const editIdx = index - 33;
        const editStartX = 32 + (cellW + gapX);
        return {
            x: editStartX + editIdx * (cellW + gapX),
            y: startY + 3 * (cellH + gapY) + 4,
            w: cellW,
            h: cellH
        };
    }

    /**
     * Devuelve el rectángulo del botón de cabecera de un Equipo Oficial (0..10).
     */
    getOfficialTeamHeaderRect(teamCol) {
        const cellW = 76;
        const gapX = 6;
        const startX = 32;
        return {
            x: startX + teamCol * (cellW + gapX),
            y: 64,
            w: cellW,
            h: 20
        };
    }

    /**
     * Pantalla Pixel-Art de Selección de los 42 Personajes y 11 Equipos Oficiales (3 vs 3) estilo KOF 2002.
     */
    drawTeamSelectScreen(ctx, selectState) {
        const { roster, team1, team2, cursorIndex, p1Cursor, p2Cursor, isOnline, onlineRole, roomCode, gameMode } = selectState;
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);

        ctx.save();
        ctx.fillStyle = '#0c0e22';
        ctx.fillRect(0, 0, this.width, this.height);
        for (let y = 0; y < this.height; y += 8) {
            ctx.fillStyle = (y / 8) % 2 === 0 ? '#131633' : '#0c0e22';
            ctx.fillRect(0, y, this.width, 4);
        }

        const isArcade12 = gameMode === 'ARCADE_12' || gameMode === 'BOSS_RUGAL';
        this._drawPixelString(
            ctx,
            isOnline
                ? `EN LÍNEA 1 VS 1 (SALA: ${roomCode}) — ERES ${onlineRole === 'HOST' ? 'JUGADOR 1 (1P)' : 'JUGADOR 2 (2P)'}`
                : 'THE KING OF AZTLAN — SELECCIÓN DE EQUIPOS (3 VS 3)',
            this.width * 0.5,
            26,
            20,
            isOnline ? '#38b6ff' : '#ffbe0b',
            '#14081c',
            'center'
        );

        let statusMsg = '';
        if (isOnline) {
            const myTeam = onlineRole === 'HOST' ? team1 : team2;
            const otherTeam = onlineRole === 'HOST' ? team2 : team1;
            if (myTeam.length < 3) {
                statusMsg = `ELIGE TUS 3 LUCHADORES (${myTeam.length}/3) — RIVAL: (${otherTeam.length}/3) • P/ESC: QUITAR`;
            } else if (otherTeam.length < 3) {
                statusMsg = `¡TU EQUIPO LISTO (3/3)! ESPERANDO AL RIVAL (${otherTeam.length}/3)...`;
            } else {
                statusMsg = '¡AMBOS EQUIPOS LISTOS! INICIANDO COMBATE EN LÍNEA...';
            }
        } else {
            statusMsg = team1.length < 3
                ? `ELIGE 3 PERSONAJES (${team1.length}/3) • U/CLIC: ELEGIR • P/ESC/B-CÍRCULO: QUITAR O VOLVER A MODOS`
                : (!isArcade12 && team2.length < 3)
                    ? `EQUIPO 2: ELIGE PERSONAJE ${team2.length + 1} DE 3 • P/ESC: QUITAR O VOLVER`
                    : '¡EQUIPO COMPLETO! PRESIONA ENTER / START O HAZ CLIC EN "¡PELEAR!"';
        }
        this._drawPixelString(ctx, statusMsg, this.width * 0.5, 48, 11, '#70f8a0', '#090a14', 'center');

        // 1. Cabeceras de los 11 Equipos Oficiales (Clic para elegir los 3 integrantes del equipo)
        const shortTeamLabels = ['JAPÓN', 'F.FURY', 'A.O.F', 'IKARI', 'PSYCHO', 'MUJERES', 'COREA', 'JEFES 96', 'OROCHI', 'AGENTES', 'NESTS'];
        for (let col = 0; col < 11; col++) {
            const hr = this.getOfficialTeamHeaderRect(col);
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(hr.x, hr.y, hr.w, hr.h);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(hr.x, hr.y, hr.w, 2);
            this._drawPixelString(ctx, shortTeamLabels[col], hr.x + hr.w * 0.5, hr.y + 14, 10, '#ffea00', '#000000', 'center');
        }

        // Etiqueta lateral para la fila de Personajes Edit & Jefe
        this._drawPixelString(ctx, 'EXTRA►', 68, 320, 11, '#ff4d88', '#000000', 'center');

        // 2. Cuadrícula de los 42 Personajes
        for (let i = 0; i < roster.length; i++) {
            const char = roster[i];
            const rect = this.getCharacterSlotRect(i);
            const isP1Cursor = (typeof p1Cursor === 'number' ? p1Cursor : cursorIndex) === i;
            const isP2Cursor = typeof p2Cursor === 'number' && p2Cursor === i;
            const isHovered = isP1Cursor || isP2Cursor;
            const p1Slot = team1.findIndex(c => c.id === char.id);
            const p2Slot = team2.findIndex(c => c.id === char.id);

            ctx.fillStyle = isP1Cursor
                ? '#ffea00'
                : isP2Cursor
                    ? '#ff2a5f'
                    : p1Slot !== -1
                        ? '#52e584'
                        : p2Slot !== -1
                            ? '#ff4d88'
                            : (char.isBoss ? '#dc2626' : '#64748b');
            ctx.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);

            ctx.fillStyle = isHovered ? '#2a2456' : '#151830';
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

            // Mini-retrato pixel-art único del personaje
            const pCanvas = window.PixelArtRenderer.getPortraitCanvas(char, 40, false);
            ctx.drawImage(pCanvas, rect.x + 3, rect.y + 3);

            // Nombre abreviado y orden seleccionado (1P / 2P)
            this._drawPixelString(
                ctx,
                char.name.slice(0, 8),
                rect.x + rect.w * 0.5,
                rect.y + rect.h - 5,
                9,
                isHovered ? '#ffea00' : '#ffffff',
                '#000000',
                'center'
            );

            if (p1Slot !== -1) {
                ctx.fillStyle = '#16a34a';
                ctx.fillRect(rect.x + 45, rect.y + 4, 28, 16);
                this._drawPixelString(ctx, `${p1Slot + 1}º1P`, rect.x + 59, rect.y + 16, 10, '#ffffff', '#000', 'center');
            } else if (p2Slot !== -1) {
                ctx.fillStyle = '#e11d48';
                ctx.fillRect(rect.x + 45, rect.y + 4, 28, 16);
                this._drawPixelString(ctx, `${p2Slot + 1}º2P`, rect.x + 59, rect.y + 16, 10, '#ffffff', '#000', 'center');
            }
        }

        // 3. Paneles Inferiores: Equipo 1 (Izquierda), Ficha de Personaje + Botones (Centro), Equipo 2 (Derecha)
        this._drawCompactTeamPanel(ctx, 1, team1, 24, 360, 276, 166);
        this._drawHoveredCharacterPreview(ctx, roster[cursorIndex] || roster[0], 312, 360, 336, 166);
        this._drawCompactTeamPanel(ctx, 2, team2, 660, 360, 276, 166);

        ctx.restore();
    }

    _drawHoveredCharacterPreview(ctx, char, x, y, w, h) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = '#181432';
        ctx.fillRect(x, y, w, h);

        if (char) {
            this._drawCornerPortrait(ctx, char, x + 12, y + 12, 76, false);
            this._drawPixelString(ctx, char.name, x + 100, y + 26, 16, '#ffea00', '#000', 'left');
            this._drawPixelString(ctx, `${char.teamName} • SALUD:${char.stats.maxHp}`, x + 100, y + 44, 11, '#70f8a0', '#000', 'left');
            this._drawPixelString(ctx, `236+P: ${char.moveset.special_QCF_P.name.slice(0, 24)}`, x + 100, y + 64, 10, '#cbd5e1', '#000', 'left');
            this._drawPixelString(ctx, `623+P: ${char.moveset.special_DP_P.name.slice(0, 24)}`, x + 100, y + 80, 10, '#cbd5e1', '#000', 'left');
            this._drawPixelString(ctx, `SÚPER: ${char.moveset.super_DM.name.slice(0, 24)}`, x + 100, y + 96, 10, '#ff4d88', '#000', 'left');
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
                this._drawPixelString(ctx, `${slot + 1}º`, sx + 40, sy + 88, 11, '#ffea00', '#000', 'center');
                this._drawPixelString(ctx, member.name.slice(0, 8), sx + 40, sy + 106, 10, '#ffffff', '#000', 'center');
            } else {
                this._drawPixelString(ctx, `VACÍO ${slot + 1}`, sx + 40, sy + 64, 11, '#64748b', '#000', 'center');
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
    drawPauseMenuOverlay(ctx, pauseCursor = 0) {
        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        ctx.save();

        ctx.fillStyle = 'rgba(6, 8, 20, 0.82)';
        ctx.fillRect(0, 0, this.width, this.height);

        const cx = Math.floor(this.width * 0.5);
        const modalW = 540;
        const modalH = 340;
        const mx = cx - modalW * 0.5;
        const my = Math.floor((this.height - modalH) * 0.5);

        ctx.fillStyle = '#ffbe0b';
        ctx.fillRect(mx - 4, my - 4, modalW + 8, modalH + 8);
        ctx.fillStyle = '#12152e';
        ctx.fillRect(mx, my, modalW, modalH);

        this._drawPixelString(ctx, 'PAUSA / MENÚ DE NAVEGACIÓN', cx, my + 36, 22, '#ffbe0b', '#000000', 'center');
        this._drawPixelString(ctx, 'USA W/S, FLECHAS O MANDO • U/ENTER/START: ELEGIR', cx, my + 60, 11, '#70f8a0', '#000000', 'center');

        const options = [
            '1. CONTINUAR PELEA',
            '2. CAMBIAR PERSONAJES (SELECCIÓN DE EQUIPOS)',
            '3. CAMBIAR MODO DE PELEA (MENÚ DE MODOS)',
            '4. REINICIAR COMBATE ACTUAL',
            '5. VOLVER A LA PANTALLA DE TÍTULO'
        ];

        const btnW = 472;
        const btnH = 40;
        const startY = my + 82;
        const gap = 10;

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
                bx + 18,
                by + 25,
                14,
                selected ? '#ffea00' : '#ffffff',
                '#000000',
                'left'
            );
        }

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
