/**
 * @file PixelArtRenderer.js
 * @description Motor de renderizado Pixel-Art estilo Neo-Geo MVS para los 42 personajes de "THE KING OF AZTLAN".
 * Dibuja cada luchador con su complexión física propia (Atlético, Femenino, Musculoso Pesado, Gigante Chang,
 * Ágil Bajo Choi, Maestro Chin, Jefe Omega Rugal), su peinado/sombrero característico (Pilar de Benimaru,
 * Gorra de Terry/Clark, Flequillo de Iori/Shermie, Calvo con Barba de Chang, Fedora y Garras de Choi, Capa de K9999)
 * y su vestimenta icónica (Torso desnudo, Crop-top, Gi de Karate, Kunoichi, Falda/Chaqueta, Militar, Tirantes, Armadura).
 */

class PixelArtRenderer {
    constructor() {
        this.portraitCache = new Map();
    }

    static enforcePixelCrispness(ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
    }

    static drawBitmapMatrix(ctx, rows, palette, startX, startY, pixelSize = 3) {
        const baseX = Math.floor(startX);
        const baseY = Math.floor(startY);

        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                if (ch === '.' || ch === ' ') continue;
                const color = palette[ch];
                if (!color) continue;
                ctx.fillStyle = color;
                ctx.fillRect(
                    baseX + c * pixelSize,
                    baseY + r * pixelSize,
                    pixelSize,
                    pixelSize
                );
            }
        }
    }

    static drawPixelLimb(ctx, x0, y0, x1, y1, thicknessPx, fillColor, shadeColor, outlineColor = '#0d0914', p = 3) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(dist / (p * 0.65)));
        const halfT = Math.max(1, Math.round(thicknessPx / (2 * p)));

        if (outlineColor) {
            ctx.fillStyle = outlineColor;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const gx = Math.round((x0 + dx * t) / p);
                const gy = Math.round((y0 + dy * t) / p);
                ctx.fillRect((gx - halfT - 1) * p, (gy - halfT - 1) * p, (halfT * 2 + 2) * p, (halfT * 2 + 2) * p);
            }
        }

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const gx = Math.round((x0 + dx * t) / p);
            const gy = Math.round((y0 + dy * t) / p);

            ctx.fillStyle = fillColor;
            ctx.fillRect((gx - halfT) * p, (gy - halfT) * p, (halfT * 2) * p, (halfT * 2) * p);

            if (shadeColor && halfT >= 2) {
                ctx.fillStyle = shadeColor;
                ctx.fillRect((gx - halfT) * p, (gy + halfT - 1) * p, (halfT * 2) * p, p);
            }
        }
    }

    static drawPixelBox(ctx, gx, gy, gw, gh, fillColor, shadeColor = null, outlineColor = '#0d0914', p = 3) {
        const rx = Math.round(gx);
        const ry = Math.round(gy);
        const rw = Math.round(gw);
        const rh = Math.round(gh);

        if (outlineColor) {
            ctx.fillStyle = outlineColor;
            ctx.fillRect((rx - 1) * p, (ry - 1) * p, (rw + 2) * p, (rh + 2) * p);
        }
        ctx.fillStyle = fillColor;
        ctx.fillRect(rx * p, ry * p, rw * p, rh * p);

        if (shadeColor && rw >= 3) {
            ctx.fillStyle = shadeColor;
            ctx.fillRect(rx * p, ry * p, Math.max(1, Math.floor(rw * 0.35)) * p, rh * p);
        }
    }

    /**
     * Genera un retrato Pixel-Art único para cada uno de los 42 personajes según su hairStyle, hairColor y vestimenta.
     */
    getPortraitCanvas(template, size = 76, flipX = false) {
        const key = `${template.id}_${size}_${flipX ? 'R' : 'L'}`;
        if (this.portraitCache.has(key)) {
            return this.portraitCache.get(key);
        }

        const off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        const octx = off.getContext('2d');
        PixelArtRenderer.enforcePixelCrispness(octx);

        const p = Math.max(2, Math.floor(size / 19));
        const vis = template.visuals;
        const hs = vis.hairStyle || 'spiky_headband';

        if (flipX) {
            octx.translate(size, 0);
            octx.scale(-1, 1);
        }

        // Fondo degradado en bandas con el color de energía del personaje
        octx.fillStyle = '#120e24';
        octx.fillRect(0, 0, size, size);
        octx.fillStyle = vis.energyColor || '#38bdf8';
        octx.globalAlpha = 0.22;
        octx.fillRect(0, 0, size, p * 4);
        octx.fillRect(0, size - p * 4, size, p * 4);
        octx.globalAlpha = 1.0;

        // Elegir silueta de cabeza/peinado para el retrato 19x19
        let portraitMatrix;
        if (hs === 'tall_pillar') {
            // Benimaru: Torre alta de cabello rubio
            portraitMatrix = [
                '.....HHHHHHHHH.....',
                '.....HHHHHHHHH.....',
                '.....HHHHHHHHH.....',
                '.....HHHHHHHHH.....',
                '....HHHHHHHHHHH....',
                '....SSSSSSSSSSS....',
                '...SSSWESSSWESSS...',
                '...SSSSSSSSSSSSS...',
                '....SSSSNNNSSSS....',
                '....SSSMMMMMSSS....',
                '.....SSSSSSSSS.....',
                '......DDDDDDD......',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCSSSSSSSCCCCC.',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'cap_ponytail') {
            // Terry Bogard / Clark: Gorra con frente blanco y visera
            portraitMatrix = [
                '....CCCCCCCCCCC....',
                '..CCCCBBBBBBBCCCC..',
                '.CCCCBBBBBBBBBCCCC.',
                '.CCCCCCCCCCCCCCCCC.',
                '.BBBBBBBBBBBBBBBBBB',
                '..HHHSSSSSSSSSHHH..',
                '..HHSSWESSSWESSHH..',
                '..HSSSSSSSSSSSSSH..',
                '...SSSSSNNNSSSSS...',
                '....SSSMMMMMSSS....',
                '.....SSSSSSSSS.....',
                '......DDDDDDD......',
                '..CCCCDDDDDDDCCCCC.',
                '.CCCCCCDDDDDCCCCCCC',
                'CCCCCCCCBBBCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'bald_beard') {
            // Chang Koehan: Calvo con gran barba negra
            portraitMatrix = [
                '.....SSSSSSSSS.....',
                '...SSSSSSSSSSSSS...',
                '..SSSSSSSSSSSSSSS..',
                '..SSSWESSSSSWESSS..',
                '..SSSSSSSSSSSSSSS..',
                '..SSSSSSNNNSSSSSS..',
                '..HHHSSSSSSSSSHHH..',
                '..HHHHMMMMMMMHHHH..',
                '..HHHHHHHHHHHHHHH..',
                '...HHHHHHHHHHHHH...',
                '....HHHHHHHHHHH....',
                '.....HHHHHHHHH.....',
                '..CCCCCHHHHHCCCCC..',
                '.CCCCCCCCCCCCCCCCC.',
                'CCCCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'bangs_over_eye') {
            // Iori Yagami / Shermie: Flequillo largo cubriendo parte del rostro
            portraitMatrix = [
                '....HHHHHHHHHHH....',
                '..HHHHHHHHHHHHHHH..',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHHHHHHHHSSSSHH.',
                '.HHHHHHHHHHSSSSSSHH',
                '.HHHHHHHHHHSWESSHH.',
                '.HHHHHHHHHSSSSSSSS.',
                '..HHHHHHHSSSSNSSSS.',
                '...HHHHHSSSSMMSSSS.',
                '....HHHSSSSSSSSS...',
                '......DDDDDDDDD....',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCBBBBCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'fedora_claws' || hs === 'sunglasses_bald') {
            // Choi / Mr. Big: Sombrero o calvo con gafas oscuras
            portraitMatrix = [
                '....HHHHHHHHHHH....',
                '..HHHHHHHHHHHHHHH..',
                'HHHHHHHHHHHHHHHHHHH',
                '....SSSSSSSSSSS....',
                '...SEEEEESEEEEES...',
                '...SEEEEESEEEEES...',
                '...SSSSSSSSSSSSS...',
                '....SSSSNNNSSSS....',
                '....SSSMMMMMSSS....',
                '.....SSSSSSSSS.....',
                '......DDDDDDD......',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else {
            // Estándar estilizado KOF (Kyo, Ryo, Mai, Athena, K', Rugal, etc.)
            portraitMatrix = [
                '....HHHHHHHHHHH....',
                '..HHHHHHHHHHHHHHH..',
                '.HHHHHHHHHHHHHHHHH.',
                '.BBBBBBBBBBBBBBBBB.',
                '.HHHSSSSSSSSSSSHHH.',
                '.HHSSSSSSSSSSSSSHH.',
                '.HSSSWESSSSSWESSSH.',
                '.HSSSSSSSSSSSSSSSH.',
                '..SSSSSSNNNSSSSSS..',
                '..SSSSSSSSSSSSSSS..',
                '...SSSSMMMMMSSSS...',
                '....SSSSSSSSSSS....',
                '.....DDDDDDDDD.....',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCDDDCCCCCCCC'
            ];
        }

        const isRugal = vis.bodyType === 'boss_rugal';
        const palette = {
            H: vis.hairColor || '#1c1526',
            B: vis.secondaryColor || '#ffffff',
            S: vis.skinColor || '#e2a778',
            D: '#8d5b3c',
            W: isRugal ? '#ff0044' : (hs === 'spiky_white' ? '#dc2626' : '#ffffff'),
            E: hs === 'eyepatch_lucha' ? '#000000' : '#0f0c1b',
            N: '#a46942',
            M: '#7a2e2e',
            C: vis.primaryColor || '#1e293b'
        };

        PixelArtRenderer.drawBitmapMatrix(octx, portraitMatrix, palette, 0, p, p);
        this.portraitCache.set(key, off);
        return off;
    }

    static drawArcadeDigit(ctx, digitChar, x, y, pixelSize = 4, fillColor = '#8ea8ff', shadeColor = '#5268c9', outlineColor = '#0a0a18') {
        const maps = {
            '0': ['OOOOOOO', 'OFFFFFO', 'OFFOOFO', 'OFFOOFO', 'OSSOOSO', 'OSSOOSO', 'OSSSSSO', 'OOOOOOO'],
            '1': ['..OOOO.', '.OFFFO.', '..OFFO.', '..OFFO.', '..OSSO.', '..OSSO.', '.OSSSSO', '.OOOOOO'],
            '2': ['OOOOOOO', 'OFFFFFO', 'OOOOOFO', 'OFFFFFO', 'OSSO...', 'OSSO...', 'OSSSSSO', 'OOOOOOO'],
            '3': ['OOOOOOO', 'OFFFFFO', 'OOOOOFO', '.OFFFSO', 'OOOOOSO', 'OSSOOSO', 'OSSSSSO', 'OOOOOOO'],
            '4': ['OOOO.OO', 'OFFO.FO', 'OFFO.FO', 'OFFFFFO', 'OOOOOSO', '....OSO', '....OSO', '....OOO'],
            '5': ['OOOOOOO', 'OFFFFFO', 'OFFOOOO', 'OFFFFFO', 'OOOOOSO', 'OSSOOSO', 'OSSSSSO', 'OOOOOOO'],
            '6': ['OOOOOOO', 'OFFFFFO', 'OFFOOOO', 'OFFFFFO', 'OSSOOSO', 'OSSOOSO', 'OSSSSSO', 'OOOOOOO'],
            '7': ['OOOOOOO', 'OFFFFFO', 'OOOOOFO', '....OFO', '...OSSO', '...OSSO', '...OSSO', '...OOOO'],
            '8': ['OOOOOOO', 'OFFFFFO', 'OFFOOFO', 'OFFFFFO', 'OSSOOSO', 'OSSOOSO', 'OSSSSSO', 'OOOOOOO'],
            '9': ['OOOOOOO', 'OFFFFFO', 'OFFOOFO', 'OFFFFFO', 'OOOOOSO', 'OSSOOSO', 'OSSSSSO', 'OOOOOOO']
        };

        const matrix = maps[String(digitChar)] || maps['0'];
        PixelArtRenderer.drawBitmapMatrix(ctx, matrix, { O: outlineColor, F: fillColor, S: shadeColor }, x, y, pixelSize);
    }

    static drawSpectator(ctx, x, y, animFrame, shirtColor, pantsColor, skinColor, phaseOffset = 0) {
        const p = 3;
        const cheer = Math.floor((animFrame + phaseOffset) / 14) % 2 === 0;
        const armLift = cheer ? -10 : 2;

        ctx.save();
        ctx.translate(Math.round(x / p) * p, Math.round(y / p) * p);

        PixelArtRenderer.drawPixelBox(ctx, -4, -22, 3, 20, pantsColor, '#161925', '#090a12', p);
        PixelArtRenderer.drawPixelBox(ctx, 1, -22, 3, 20, pantsColor, '#161925', '#090a12', p);
        PixelArtRenderer.drawPixelBox(ctx, -5, -38, 10, 16, shirtColor, '#141824', '#090a12', p);
        PixelArtRenderer.drawPixelLimb(ctx, -15, -35 * p, -26, (-38 + armLift) * p, 9, skinColor, '#9e6238', '#090a12', p);
        PixelArtRenderer.drawPixelLimb(ctx, 15, -35 * p, 26, (-38 + armLift) * p, 9, skinColor, '#9e6238', '#090a12', p);
        PixelArtRenderer.drawPixelBox(ctx, -3, -46, 6, 7, skinColor, '#9e6238', '#090a12', p);
        PixelArtRenderer.drawPixelBox(ctx, -3, -48, 6, 3, '#181224', null, '#090a12', p);

        ctx.restore();
    }

    /**
     * Dibuja una estela de corte/impacto curvo Pixel-Art (Slash / Flame / Lightning Arc) estilo KOF 2002.
     */
    static drawSlashArc(ctx, x1, y1, x2, y2, color, coreColor = '#ffffff', p = 3) {
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const curve = Math.sin(t * Math.PI) * 18;
            const px = Math.round((x1 + (x2 - x1) * t + curve) / p) * p;
            const py = Math.round((y1 + (y2 - y1) * t) / p) * p;
            const thick = (i >= 1 && i <= 5) ? p * 3 : p * 2;
            ctx.fillStyle = color;
            ctx.fillRect(px - p, py - p, thick + p * 2, thick + p);
            ctx.fillStyle = coreColor;
            ctx.fillRect(px, py, thick, p);
        }
    }

    /**
     * Renderiza el sprite Pixel-Art en combate con cinemática fluida por fotogramas clave (Startup -> Active -> Recovery),
     * guardia rítmica estilo KOF 2002, estelas elementales y accesorios únicos por personaje.
     */
    static drawFighterPixelArt(ctx, fighter, drawX, drawY, facing, state, pose, isSilhouette = false, silhouetteColor = null) {
        const p = 3;
        // Vibración horizontal durante Hitstun / Blockstun (Hit-Shake estilo Neo-Geo)
        const hitShakeX = (!isSilhouette && fighter.hitShakeTimer > 0)
            ? Math.round(Math.sin(fighter.stateFrame * 2.8) * 5)
            : 0;
        const snapX = Math.round((drawX + hitShakeX) / p) * p;
        const snapY = Math.round(drawY / p) * p;

        const vis = fighter.visuals;
        const bodyType = vis.bodyType || 'athletic';
        const hairStyle = vis.hairStyle || 'spiky_headband';
        const outfit = vis.outfitStyle || 'jacket_pants';
        const isRugal = bodyType === 'boss_rugal';
        const isFemale = bodyType === 'female';
        const isHeavy = bodyType === 'muscular_heavy' || isRugal;
        const isGiant = bodyType === 'giant_round'; // Chang Koehan
        const isShort = bodyType === 'short_claw';  // Choi Bounge
        const isElder = bodyType === 'elder_master'; // Chin Gentsai
        const isYouth = bodyType === 'youth';        // Chris / Kensou

        // Escala vertical/horizontal según la complexión del personaje
        const scaleY = isShort ? 0.76 : isElder ? 0.85 : isYouth ? 0.92 : (isHeavy || isGiant) ? 1.05 : 1.0;
        const scaleX = isGiant ? 1.25 : isHeavy ? 1.12 : isFemale ? 0.94 : 1.0;

        ctx.save();
        ctx.translate(snapX, snapY);
        ctx.scale(facing * scaleX, scaleY);

        const cOutline = '#0d0914';
        const cPrimary = isSilhouette ? silhouetteColor : vis.primaryColor;
        const cPrimaryShade = isSilhouette ? silhouetteColor : (isRugal ? '#4d000f' : '#182038');
        const cSecondary = isSilhouette ? silhouetteColor : vis.secondaryColor;
        const cSkin = isSilhouette ? silhouetteColor : vis.skinColor;
        const cSkinShade = isSilhouette ? silhouetteColor : '#9c5f36';
        const cPants = isSilhouette ? silhouetteColor : (vis.pantsColor || '#1e243b');
        const cPantsShade = isSilhouette ? silhouetteColor : '#111524';
        const cBoots = isSilhouette ? silhouetteColor : '#e2e8f0';
        const cHair = isSilhouette ? silhouetteColor : (vis.hairColor || '#1c1226');
        const cEnergy = vis.energyColor || '#00f5ff';

        if (!isSilhouette && fighter.invulnerableTimer > 0 && fighter.animFrame % 2 === 0) {
            ctx.globalAlpha = 0.6;
        }

        // Aura maligna carmesí permanente para el Jefe Final Omega Rugal
        if (!isSilhouette && isRugal) {
            const pulse = (Math.floor(fighter.animFrame / 3) % 3) * p;
            ctx.fillStyle = 'rgba(255, 0, 68, 0.24)';
            ctx.fillRect(-34 - pulse, -214 - pulse, 68 + pulse * 2, 212 + pulse);
        }

        // A. POSE DERRIBADO (KNOCKDOWN / KO)
        if (state === 'KNOCKDOWN' || state === 'KO') {
            const bounceY = (!fighter.isGrounded() && state === 'KNOCKDOWN') ? -14 : 0;
            PixelArtRenderer.drawPixelLimb(ctx, -10, -18 + bounceY, -68, -10 + bounceY, 15, cPants, cPantsShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, -68, -10 + bounceY, -96, -6 + bounceY, 13, cBoots, cSecondary, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, -10, -18 + bounceY, 42, -24 + bounceY, 22, cPrimary, cPrimaryShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, 32, -22 + bounceY, 18, -4 + bounceY, 11, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, 14, -11 + Math.round(bounceY / p), 8, 7, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, 14, -13 + Math.round(bounceY / p), 9, 3, cHair, null, cOutline, p);
            ctx.restore();
            return;
        }

        // B. POSE RODADA DEFENSIVA (EVADE)
        if (state === 'EVADE') {
            ctx.translate(0, -92);
            ctx.rotate(fighter.stateFrame * 0.44 * fighter.evadeDir);
            PixelArtRenderer.drawPixelBox(ctx, -7, -9, 14, 18, cPrimary, cPrimaryShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, -5, -15, 10, 8, cPants, cPantsShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, -4, 8, 8, 7, cSkin, cSkinShade, cOutline, p);
            ctx.restore();
            return;
        }

        // C. INTERPOLACIÓN DE FASES DE ATAQUE (STARTUP -> ACTIVE -> RECOVERY) PARA EVITAR POSES TIESAS
        const move = fighter.currentMove;
        let atkPhase = 'NONE';
        let extFactor = 0; // -0.5 en preparación (wind-up), 1.0 en impacto activo, 1.0 -> 0.0 en recuperación
        let flurryOsc = 0; // Oscilación rápida en ataques multi-hit (Ráfagas de puños/patadas)

        if (move && (state === 'ATTACK' || state === 'SPECIAL' || state === 'SUPER' || !fighter.isGrounded())) {
            const sf = fighter.stateFrame;
            const st = Math.max(1, move.startup || 4);
            const ac = Math.max(1, move.active || 5);
            const rc = Math.max(1, move.recovery || 8);

            if (sf < st) {
                atkPhase = 'STARTUP';
                extFactor = -0.45 * (sf / st); // Arma el golpe hacia atrás
            } else if (sf < st + ac) {
                atkPhase = 'ACTIVE';
                extFactor = 1.0; // Extensión máxima explosiva
                if ((move.hits || 1) > 1) {
                    flurryOsc = Math.sin(sf * 1.65);
                }
            } else {
                atkPhase = 'RECOVERY';
                const recProgress = Math.min(1, (sf - st - ac) / rc);
                extFactor = Math.max(0, 1.0 - recProgress * 1.15); // Regreso suave a la guardia
            }
        }

        // D. CINEMÁTICA CORPORAL KOF 2002 (Guardia viva con juego de pies, carrera inclinada y retroceso de daño)
        const isCrouch = state === 'CROUCH' || pose.startsWith('CROUCH');
        const isAir = !fighter.isGrounded();
        const isMoving = state === 'WALK' || state === 'RUN';

        // Ritmo de guardia estilo KOF 2002 (rebote vertical de rodillas + balanceo horizontal de hombros/manos)
        const f = fighter.animFrame;
        const stanceBobY = Math.round(Math.sin(f * 0.18) * 4.5);
        const stanceSwayX = Math.round(Math.cos(f * 0.09) * 4.5);
        const guardCycle = Math.sin(f * 0.22);

        const cyclePhase = f * (state === 'RUN' ? 0.42 : 0.24);
        const strideX = isMoving ? Math.sin(cyclePhase) * (state === 'RUN' ? 34 : 22) : stanceSwayX * 0.6;
        const strideLift = isMoving ? Math.max(0, Math.cos(cyclePhase) * (state === 'RUN' ? 18 : 11)) : 0;

        const isPunching =
            pose.includes('PUNCH') ||
            pose === 'CMD_STRIKE' ||
            pose === 'UPPERCUT' ||
            pose === 'BLOWBACK' ||
            pose.includes('SPECIAL') ||
            pose.includes('SUPER');

        const isKicking = pose.includes('KICK') || pose === 'SPECIAL_RUSH';

        // Inclinación dinámica del torso (anticipa hacia atrás en Startup, se lanza al frente en Active)
        let torsoLeanX = stanceSwayX;
        let hitDropY = 0;
        if (state === 'RUN') {
            torsoLeanX = 20;
            hitDropY = 6;
        } else if (state === 'HIT') {
            // Diferenciar impacto alto (cabeza hacia atrás) vs impacto bajo/medio (doblado del estómago)
            torsoLeanX = fighter.lastHitTypeReceived === 'LOW' ? 12 : -16;
            hitDropY = 8;
        } else if (state === 'BLOCK') {
            torsoLeanX = -8;
            hitDropY = 4;
        } else if (isPunching) {
            torsoLeanX = Math.round(extFactor * (pose === 'BLOWBACK' || pose.includes('SUPER') ? 24 : 16));
        } else if (isKicking) {
            torsoLeanX = Math.round(extFactor * (pose === 'KICK_HIGH' ? -10 : 14));
        }

        const lungeDropY = (atkPhase === 'ACTIVE' && (isPunching || isKicking)) ? 6 : 0;
        const pelvisY = (isCrouch ? -78 : isAir ? -118 : -114 + stanceBobY) + hitDropY + lungeDropY;
        const shoulderY = (isCrouch ? -122 : isAir ? -168 : -170 + stanceBobY) + hitDropY + lungeDropY;
        const neckY = shoulderY - 8;
        const headGridY = Math.round((neckY - 24) / p);

        // Polvo de impulso en el suelo al correr o lanzar ataques deslizantes
        if (!isSilhouette && (state === 'RUN' || (atkPhase === 'ACTIVE' && move?.velocityX >= 4))) {
            const dustOffset = (f % 6) * 4;
            ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
            ctx.fillRect(-38 - dustOffset, -10, 12, 8);
            ctx.fillRect(-52 - dustOffset, -16, 8, 8);
        }

        // 1. ELEMENTOS TRASEROS: Capa de K9999, Cabello largo (Mai/Athena/Leona/Kula/Andy), o Cinta de cabeza
        if (!isSilhouette) {
            const waveY = Math.round(Math.sin(f * 0.26) * 7);
            if (hairStyle === 'blue_spiky_cape') {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(torsoLeanX / p) - 12, Math.round(shoulderY / p) + 1, 7, 26, '#dc2626', '#991b1b', cOutline, p);
            } else if (hairStyle === 'long_flowing' || hairStyle === 'cap_ponytail' || hairStyle === 'ponytail_sleek') {
                PixelArtRenderer.drawPixelLimb(
                    ctx,
                    torsoLeanX - 10,
                    neckY - 12,
                    torsoLeanX - 38 - Math.max(0, torsoLeanX * 0.5),
                    neckY + 18 + waveY,
                    11,
                    cHair,
                    cOutline,
                    cOutline,
                    p
                );
            } else if (hairStyle === 'spiky_headband' || hairStyle === 'bald_headband' || hairStyle === 'spiky_bandana') {
                PixelArtRenderer.drawPixelLimb(
                    ctx,
                    torsoLeanX - 10,
                    neckY - 14,
                    torsoLeanX - 40 - Math.max(0, torsoLeanX * 0.4),
                    neckY - 8 + waveY,
                    7,
                    cSecondary,
                    cPrimary,
                    cOutline,
                    p
                );
            }
            if (outfit === 'kunoichi_red') {
                PixelArtRenderer.drawPixelLimb(
                    ctx,
                    -10,
                    pelvisY,
                    -44,
                    pelvisY + 34 + waveY,
                    9,
                    '#dc2626',
                    '#ffffff',
                    cOutline,
                    p
                );
            }
        }

        // 2. BRAZO TRASERO CON MOVIMIENTO RÍTMICO DE GUARDIA Y CONTRAPESO EN ATAQUES
        const backShoulderX = torsoLeanX - 14;
        const rearBobY = Math.round(-guardCycle * 5);
        const backElbowX = isPunching ? backShoulderX - 22 : (state === 'RUN' ? backShoulderX - Math.sin(cyclePhase) * 20 : backShoulderX - 16);
        const backElbowY = shoulderY + 24 + rearBobY;
        const backHandX = isPunching
            ? (flurryOsc < -0.2 ? backShoulderX + 68 : backShoulderX - 10)
            : (state === 'HIT' ? backShoulderX - 26 : backShoulderX + 8 - stanceSwayX * 0.5);
        const backHandY = isPunching && flurryOsc < -0.2
            ? shoulderY + 4
            : shoulderY + 12 + rearBobY;
        const sleeveCol = (outfit === 'bare_chest_pants' || outfit === 'sleeveless_crop' || outfit === 'kunoichi_red' || outfit === 'military_camo')
            ? cSkin
            : cPrimary;
        PixelArtRenderer.drawPixelLimb(ctx, backShoulderX, shoulderY + 4, backElbowX, backElbowY, 12, sleeveCol, cPrimaryShade, cOutline, p);
        PixelArtRenderer.drawPixelLimb(ctx, backElbowX, backElbowY, backHandX, backHandY, 11, cSkin, cSkinShade, cOutline, p);

        // 3. PIERNA TRASERA ARTICULADA (Postura de combate abierta con rodillas flexionadas)
        const legUpperColor = (outfit === 'kunoichi_red' || outfit === 'skirt_jacket') ? cSkin : cPants;
        const legUpperShade = (outfit === 'kunoichi_red' || outfit === 'skirt_jacket') ? cSkinShade : cPantsShade;

        const backHipX = -10;
        const backKneeX = -24 - strideX * 0.5;
        const backKneeY = isCrouch ? -40 : isAir ? -76 : -60 + stanceBobY * 0.5;
        const backFootX = -30 - strideX - (atkPhase === 'ACTIVE' ? 8 : 0);
        const backFootY = isAir ? -28 : -6 - (strideX < 0 ? strideLift : 0);

        PixelArtRenderer.drawPixelLimb(ctx, backHipX, pelvisY, backKneeX, backKneeY, 18, legUpperColor, legUpperShade, cOutline, p);
        PixelArtRenderer.drawPixelLimb(ctx, backKneeX, backKneeY, backFootX, backFootY - 12, 14, cPants, cPantsShade, cOutline, p);
        PixelArtRenderer.drawPixelLimb(ctx, backFootX, backFootY - 18, backFootX + 2, backFootY, 14, cBoots, cSecondary, cOutline, p);
        PixelArtRenderer.drawPixelBox(ctx, Math.round(backFootX / p) - 2, Math.round(backFootY / p) - 2, 7, 2, cBoots, cSecondary, cOutline, p);

        // 4. PIERNA DELANTERA ARTICULADA (Compás marcial vivo o Patada con fases Startup/Active/Recovery)
        const frontHipX = 10;
        if (isKicking && extFactor !== 0) {
            if (extFactor < 0) {
                // FASE STARTUP DE PATADA: Eleva la rodilla recogida antes de soltar el latigazo
                const chamberKneeX = 28;
                const chamberKneeY = pelvisY - 26;
                const chamberFootX = 14;
                const chamberFootY = pelvisY + 12;
                PixelArtRenderer.drawPixelLimb(ctx, frontHipX, pelvisY, chamberKneeX, chamberKneeY, 18, legUpperColor, legUpperShade, cOutline, p);
                PixelArtRenderer.drawPixelLimb(ctx, chamberKneeX, chamberKneeY, chamberFootX, chamberFootY, 15, cBoots, cSecondary, cOutline, p);
            } else {
                // FASE ACTIVE / RECOVERY DE PATADA: Extensión dinámica + estela de corte KOF 2002
                const baseTargetY = (pose === 'KICK_LOW' || pose === 'CROUCH_KICK')
                    ? -22
                    : (pose === 'KICK_HIGH' || pose === 'CMD_KICK')
                        ? -162
                        : -108 + Math.round(flurryOsc * 22);
                const baseTargetX = (pose === 'KICK_LOW' || pose === 'CROUCH_KICK') ? 92 : 98;
                const kickTargetX = Math.round(26 + (baseTargetX - 26) * extFactor);
                const kickTargetY = Math.round(-36 + (baseTargetY + 36) * extFactor);
                const kickKneeX = Math.round((frontHipX + kickTargetX) * 0.48);
                const kickKneeY = Math.round((pelvisY + kickTargetY) * 0.5 - 10);

                PixelArtRenderer.drawPixelLimb(ctx, frontHipX, pelvisY, kickKneeX, kickKneeY, 18, legUpperColor, legUpperShade, cOutline, p);
                PixelArtRenderer.drawPixelLimb(ctx, kickKneeX, kickKneeY, kickTargetX, kickTargetY, 15, cBoots, cSecondary, cOutline, p);

                if (!isSilhouette && atkPhase === 'ACTIVE') {
                    PixelArtRenderer.drawSlashArc(
                        ctx,
                        kickTargetX - 18,
                        kickTargetY - 26,
                        kickTargetX + 12,
                        kickTargetY + 24,
                        cEnergy,
                        '#ffffff',
                        p
                    );
                }
            }
        } else {
            const stepForward = (isPunching && extFactor > 0) ? Math.round(extFactor * 16) : 0;
            const frontKneeX = 26 + strideX * 0.5 + stepForward * 0.6;
            const frontKneeY = isCrouch ? -40 : isAir ? -84 : -60 + stanceBobY * 0.5;
            const frontFootX = 26 + strideX + stepForward;
            const frontFootY = isAir ? -40 : -6 - (strideX > 0 ? strideLift : 0);

            PixelArtRenderer.drawPixelLimb(ctx, frontHipX, pelvisY, frontKneeX, frontKneeY, 18, legUpperColor, legUpperShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, frontKneeX, frontKneeY, frontFootX, frontFootY - 12, 14, cPants, cPantsShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, frontFootX, frontFootY - 20, frontFootX, frontFootY, 15, cBoots, cSecondary, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, Math.round(frontFootX / p) - 2, Math.round(frontFootY / p) - 2, 8, 2, cBoots, cSecondary, cOutline, p);
        }

        // 5. PELVIS, CINTURA, FALDA O FAJA
        const hipGridY = Math.round(pelvisY / p);
        const hipWidth = isGiant ? 18 : isFemale ? 11 : 12;
        PixelArtRenderer.drawPixelBox(ctx, -Math.floor(hipWidth * 0.5), hipGridY - 3, hipWidth, 6, cPrimary && outfit === 'skirt_jacket' ? cPrimary : cPants, cPantsShade, cOutline, p);
        PixelArtRenderer.drawPixelBox(ctx, -Math.floor(hipWidth * 0.5), hipGridY - 5, hipWidth + 1, 2, cSecondary, cPrimary, cOutline, p);

        if (outfit === 'karate_gi' || outfit === 'kunoichi_red') {
            PixelArtRenderer.drawPixelBox(ctx, 1, hipGridY - 3, 3, 8, cSecondary, null, cOutline, p);
        }

        // 6. TORSO SEGÚN EL OUTFIT Y COMPLEXIÓN DEL PERSONAJE
        const waistGridY = Math.round((pelvisY - 24) / p);
        const chestGridY = Math.round(shoulderY / p);
        const chestGridX = Math.round(torsoLeanX / p);
        const torsoH = Math.max(6, waistGridY - chestGridY + 2);

        const waistW = isGiant ? 18 : isFemale ? 9 : 12;
        const chestW = isGiant ? 20 : isHeavy ? 18 : isFemale ? 13 : 16;

        const torsoFill = outfit === 'bare_chest_pants' ? cSkin : cPrimary;
        const torsoShade = outfit === 'bare_chest_pants' ? cSkinShade : cPrimaryShade;

        const absFill = (outfit === 'bare_chest_pants' || outfit === 'sleeveless_crop') ? cSkin : cPrimary;
        PixelArtRenderer.drawPixelBox(ctx, chestGridX - Math.floor(waistW * 0.5), waistGridY, waistW, 6, absFill, cSkinShade, cOutline, p);
        PixelArtRenderer.drawPixelBox(ctx, chestGridX - Math.floor(chestW * 0.5), chestGridY, chestW, torsoH, torsoFill, torsoShade, cOutline, p);

        // Detalles de vestimenta en el torso
        if (!isSilhouette) {
            if (outfit === 'karate_gi') {
                PixelArtRenderer.drawPixelLimb(ctx, (chestGridX - 4) * p, chestGridY * p, (chestGridX + 2) * p, (waistGridY + 2) * p, 6, cSecondary, null, null, p);
            } else if (outfit === 'suspenders_boxer') {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, chestGridY, 2, torsoH + 5, cSecondary, null, null, p);
                PixelArtRenderer.drawPixelBox(ctx, chestGridX + 3, chestGridY, 2, torsoH + 5, cSecondary, null, null, p);
            } else if (outfit === 'armor_boss') {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - Math.floor(chestW * 0.5) - 2, chestGridY - 1, 5, 4, cSecondary, null, cOutline, p);
                PixelArtRenderer.drawPixelBox(ctx, chestGridX + Math.floor(chestW * 0.5) - 3, chestGridY - 1, 5, 4, cSecondary, null, cOutline, p);
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 2, chestGridY + 2, 4, 4, cEnergy, '#ffffff', null, p);
            } else if (outfit === 'military_camo') {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 5, chestGridY + 1, 10, 2, cSecondary, null, null, p);
            } else if (outfit === 'jacket_pants' || outfit === 'skirt_jacket') {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 2, chestGridY + 1, 4, 4, cSkin, cSkinShade, null, p);
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 5, chestGridY, 2, 7, cSecondary, null, null, p);
                PixelArtRenderer.drawPixelBox(ctx, chestGridX + 3, chestGridY, 2, 7, cSecondary, null, null, p);
            }
        }

        // 7. CUELLO, CABEZA Y PEINADO / ACCESORIOS ÚNICOS
        PixelArtRenderer.drawPixelBox(ctx, chestGridX - 2, Math.round(neckY / p), 4, 3, cSkin, cSkinShade, cOutline, p);
        PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY + 2, 7, 6, cSkin, cSkinShade, cOutline, p);

        if (!isSilhouette && hairStyle === 'bald_beard') {
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY + 6, 8, 7, cHair, null, cOutline, p);
        }

        if (hairStyle === 'tall_pillar') {
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY - 7, 7, 9, cHair, '#eab308', cOutline, p);
        } else if (hairStyle === 'cap_ponytail') {
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 1, 8, 3, cPrimary, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX + 1, headGridY - 1, 3, 2, '#ffffff', null, null, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX + 3, headGridY + 1, 5, 1, cPrimary, null, cOutline, p);
        } else if (hairStyle === 'fedora_claws') {
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 2, 8, 3, '#78350f', null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 6, headGridY + 1, 12, 1, '#78350f', null, cOutline, p);
        } else if (hairStyle === 'bald_headband' || hairStyle === 'bald_beard' || hairStyle === 'sunglasses_bald') {
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY, 7, 2, cSkin, cSkinShade, cOutline, p);
            if (hairStyle === 'bald_headband') {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 2, 8, 1, cSecondary, null, null, p);
            }
        } else if (hairStyle === 'bangs_over_eye') {
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 1, 9, 4, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX + 1, headGridY + 2, 4, 4, cHair, null, null, p);
        } else {
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 1, 9, 4, cHair, null, cOutline, p);
            if (hairStyle === 'spiky_headband' || hairStyle === 'spiky_bandana') {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 2, 8, 1, cSecondary, null, null, p);
            }
        }

        if (!isSilhouette) {
            if (hairStyle === 'sunglasses_bald' || hairStyle === 'spiky_white' || hairStyle === 'fedora_claws') {
                ctx.fillStyle = '#090a14';
                ctx.fillRect((chestGridX) * p, (headGridY + 3) * p, 4 * p, 2 * p);
            } else if (hairStyle === 'eyepatch_lucha') {
                ctx.fillStyle = '#090a14';
                ctx.fillRect((chestGridX) * p, (headGridY + 3) * p, 3 * p, 2 * p);
            } else if (hairStyle !== 'bangs_over_eye') {
                ctx.fillStyle = isRugal ? '#ff0044' : '#ffffff';
                ctx.fillRect((chestGridX + 1) * p, (headGridY + 4) * p, 2 * p, p);
                ctx.fillStyle = isRugal ? '#ffea00' : '#090a14';
                ctx.fillRect((chestGridX + 2) * p, (headGridY + 4) * p, p, p);
            }
        }

        // 8. BRAZO DELANTERO CON FASES FLUIDAS (STARTUP -> ACTIVE -> RECOVERY), GUARDIA VIVA Y ESTELAS ELEMENTALES
        const frontShoulderX = torsoLeanX + 10;
        const frontShoulderY = shoulderY + 6;

        if (state === 'BLOCK') {
            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX, frontShoulderY, frontShoulderX + 16, frontShoulderY + 22, 13, sleeveCol, cPrimaryShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX + 16, frontShoulderY + 22, frontShoulderX + 22, frontShoulderY - 14, 12, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, Math.round((frontShoulderX + 25) / p), chestGridY - 2, 2, 15, '#00f5ff', '#ffffff', null, p);
        } else if (isPunching && extFactor !== 0) {
            const maxReachPx = pose.includes('SUPER') ? 96 : (pose.includes('HEAVY') || pose === 'BLOWBACK' || pose === 'CMD_STRIKE') ? 82 : 64;
            const reachNow = extFactor < 0
                ? -18 * Math.abs(extFactor) // En Startup arma el puño hacia atrás
                : Math.round(24 + (maxReachPx - 24) * extFactor);

            const targetHandX = frontShoulderX + reachNow;
            const verticalOffset = pose === 'UPPERCUT'
                ? -56 * Math.max(0, extFactor)
                : (pose === 'CMD_STRIKE' ? -14 : Math.round(flurryOsc * 16));
            const targetHandY = frontShoulderY - 2 + verticalOffset;
            const midElbowX = (frontShoulderX + targetHandX) * 0.5 - (extFactor < 0 ? 12 : 0);
            const midElbowY = (frontShoulderY + targetHandY) * 0.5 + (pose === 'UPPERCUT' ? 16 : 6);

            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX, frontShoulderY, midElbowX, midElbowY, 14, sleeveCol, cPrimaryShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, midElbowX, midElbowY, targetHandX, targetHandY, 13, cSkin, cSkinShade, cOutline, p);

            const gloveCol = (pose.includes('SUPER') || pose.includes('SPECIAL') || pose === 'UPPERCUT' || pose === 'CMD_STRIKE') ? cEnergy : cSecondary;
            PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) - 2, Math.round(targetHandY / p) - 3, 6, 6, gloveCol, '#ffffff', cOutline, p);

            // Garras metálicas de Choi Bounge o Bola de Hierro de Chang
            if (!isSilhouette && isShort) {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 4, Math.round(targetHandY / p) - 2, 7, 1, '#e2e8f0', null, null, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 4, Math.round(targetHandY / p), 7, 1, '#e2e8f0', null, null, p);
            } else if (!isSilhouette && isGiant) {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 2, Math.round(targetHandY / p) - 6, 11, 11, '#475569', '#1e293b', cOutline, p);
            }

            // Estela de corte/flama en fase activa de puños fuertes, comando, especiales y desesperaciones
            if (!isSilhouette && atkPhase === 'ACTIVE') {
                if (pose === 'UPPERCUT') {
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 10, targetHandY + 48, targetHandX + 16, targetHandY - 24, cEnergy, '#ffffff', p);
                } else if (pose.includes('HEAVY') || pose === 'CMD_STRIKE' || pose === 'BLOWBACK' || pose.includes('SPECIAL') || pose.includes('SUPER')) {
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 16, targetHandY - 22, targetHandX + 18, targetHandY + 22, cEnergy, '#ffffff', p);
                }
            }
        } else {
            // Guardia marcial viva en reposo / movimiento (las manos describen un ocho rítmico estilo KOF 2002)
            const leadBobX = state === 'RUN' ? Math.round(Math.sin(cyclePhase) * 18) : Math.round(guardCycle * 6);
            const leadBobY = state === 'RUN' ? Math.round(Math.cos(cyclePhase) * 10) : Math.round(Math.cos(f * 0.22) * 5);
            const elbowX = frontShoulderX + 12 + leadBobX * 0.4;
            const elbowY = frontShoulderY + 26 + leadBobY * 0.5;
            const fistX = (state === 'HIT') ? frontShoulderX - 10 : frontShoulderX + 28 + leadBobX;
            const fistY = (state === 'HIT') ? frontShoulderY + 20 : frontShoulderY + 2 + leadBobY;

            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX, frontShoulderY, elbowX, elbowY, 13, sleeveCol, cPrimaryShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, elbowX, elbowY, fistX, fistY, 12, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, Math.round(fistX / p) - 2, Math.round(fistY / p) - 2, 4, 4, cSecondary, null, cOutline, p);

            if (!isSilhouette && isShort) {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(fistX / p) + 2, Math.round(fistY / p) - 2, 5, 1, '#e2e8f0', null, null, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(fistX / p) + 2, Math.round(fistY / p), 5, 1, '#e2e8f0', null, null, p);
            } else if (!isSilhouette && isGiant) {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(fistX / p) + 2, Math.round(fistY / p), 9, 9, '#475569', '#1e293b', cOutline, p);
            } else if (!isSilhouette && hairStyle === 'sunglasses_bald') {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(fistX / p), Math.round(fistY / p) - 8, 2, 14, '#f8fafc', null, cOutline, p);
            }
        }

        ctx.restore();
    }
}

window.PixelArtRenderer = new PixelArtRenderer();
window.PixelArtRendererClass = PixelArtRenderer;
