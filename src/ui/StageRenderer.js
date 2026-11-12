/**
 * @file StageRenderer.js
 * @description Renderizador de los 7 Escenarios Animados Pixel-Art Neo-Geo para "THE KING OF AZTLAN".
 * Rota dinámicamente según el nivel de combate (1 al 12):
 * 1. Plaza Nocturna de Aztlán (Niveles 1 y 7)
 * 2. Atardecer en Teotihuacán (Niveles 2 y 8)
 * 3. Canales de Xochimilco (Niveles 3 y 9)
 * 4. Mercado Callejero Nocturno (Niveles 4 y 10)
 * 5. Cenote Sagrado en la Selva Maya (Niveles 5 y 11)
 * 6. Falda Ardiente del Volcán Popocatépetl (Nivel 6)
 * 7. Altar de Obsidiana de Omega Rugal (Nivel 12 - Jefe Final)
 */

class StageRenderer {
    static getStageInfo(stageNumber) {
        const num = Math.max(1, Math.min(12, stageNumber || 1));
        if (num === 12) {
            return { id: 'altar_rugal', name: 'NIVEL 12: ALTAR DE OBSIDIANA (OMEGA RUGAL)', isBoss: true };
        }
        const cycle = ((num - 1) % 6) + 1;
        switch (cycle) {
            case 1: return { id: 'aztlan_night', name: `NIVEL ${num}: PLAZA NOCTURNA DE AZTLÁN` };
            case 2: return { id: 'teotihuacan', name: `NIVEL ${num}: ATARDECER EN TEOTIHUACÁN` };
            case 3: return { id: 'xochimilco', name: `NIVEL ${num}: CANALES DE XOCHIMILCO` };
            case 4: return { id: 'mercado', name: `NIVEL ${num}: MERCADO CALLEJERO NOCTURNO` };
            case 5: return { id: 'cenote', name: `NIVEL ${num}: CENOTE SAGRADO DE LA SELVA` };
            case 6: return { id: 'volcan', name: `NIVEL ${num}: FALDA DEL POPOCATÉPETL` };
            default: return { id: 'aztlan_night', name: `NIVEL ${num}: PLAZA NOCTURNA DE AZTLÁN` };
        }
    }

    /**
     * Dibuja el escenario correspondiente al nivel actual con todas sus capas de parallax y animaciones.
     */
    static drawStage(ctx, stageNumber, globalFrame, width = 960, height = 540, groundY = 485) {
        if (window.PixelArtRendererClass) {
            window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        }
        const info = StageRenderer.getStageInfo(stageNumber);

        switch (info.id) {
            case 'altar_rugal':
                StageRenderer._drawAltarRugal(ctx, globalFrame, width, height, groundY);
                break;
            case 'teotihuacan':
                StageRenderer._drawTeotihuacan(ctx, globalFrame, width, height, groundY);
                break;
            case 'xochimilco':
                StageRenderer._drawXochimilco(ctx, globalFrame, width, height, groundY);
                break;
            case 'mercado':
                StageRenderer._drawMercado(ctx, globalFrame, width, height, groundY);
                break;
            case 'cenote':
                StageRenderer._drawCenote(ctx, globalFrame, width, height, groundY);
                break;
            case 'volcan':
                StageRenderer._drawVolcan(ctx, globalFrame, width, height, groundY);
                break;
            case 'aztlan_night':
            default:
                StageRenderer._drawAztlanNight(ctx, globalFrame, width, height, groundY);
                break;
        }
    }

    // =========================================================================
    // 1. PLAZA NOCTURNA DE AZTLÁN
    // =========================================================================
    static _drawAztlanNight(ctx, gf, w, h, groundY) {
        const horizonY = groundY - 120;
        const skyBands = ['#242854', '#2e3468', '#3a427c', '#485294', '#5862a8', '#444c88'];
        const bandH = Math.ceil(horizonY / skyBands.length);
        for (let i = 0; i < skyBands.length; i++) {
            ctx.fillStyle = skyBands[i];
            ctx.fillRect(0, i * bandH, w, bandH);
        }

        // Nubes pixeladas horizontales
        ctx.fillStyle = '#6874b8';
        ctx.fillRect(140, 96, 220, 12);
        ctx.fillRect(172, 88, 148, 8);
        ctx.fillRect(520, 116, 260, 12);
        ctx.fillRect(560, 108, 180, 8);

        // Gran Torre de Aztlán con ventanas verde esmeralda encendidas
        const towerX = 28;
        const towerY = 12;
        const towerW = 112;
        const towerH = horizonY - towerY;
        ctx.fillStyle = '#182438';
        ctx.fillRect(towerX, towerY, towerW, towerH);
        ctx.fillStyle = '#243850';
        ctx.fillRect(towerX + 4, towerY, 12, towerH);

        for (let wy = towerY + 12; wy < horizonY - 16; wy += 12) {
            for (let wx = towerX + 12; wx < towerX + towerW - 12; wx += 16) {
                if ((wx + wy) % 24 !== 0) {
                    ctx.fillStyle = (wx * wy) % 7 === 0 ? '#9efcd0' : '#38b080';
                    ctx.fillRect(wx, wy, 8, 4);
                }
            }
        }

        // Templos y rascacielos en el horizonte
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
            for (let wy = by + 12; wy < horizonY - 20; wy += 16) {
                for (let wx = b.x + 8; wx < b.x + b.w - 16; wx += 16) {
                    ctx.fillStyle = (wx + wy) % 32 === 0 ? '#ffbe0b' : '#202030';
                    ctx.fillRect(wx, wy, 8, 4);
                }
            }
        }

        // Puente iluminado al fondo con farolas
        ctx.fillStyle = '#28243c';
        ctx.fillRect(0, horizonY - 28, w, 28);
        for (let lx = 24; lx < w; lx += 64) {
            ctx.fillStyle = '#ff9e00';
            ctx.fillRect(lx, horizonY - 36, 8, 8);
            ctx.fillStyle = '#ffea00';
            ctx.fillRect(lx + 2, horizonY - 34, 4, 4);
        }

        // Cuerdas diagonales con banderines ceremoniales ondeando
        const flagColors = ['#ffbe0b', '#00d68f', '#ffffff', '#ff3366', '#38b6ff', '#ff7b00'];
        const wave = Math.floor(gf / 10) % 2 === 0 ? 0 : 4;
        for (let i = 0; i < 6; i++) {
            const fx1 = 310 + i * 78;
            const fy1 = 44 + i * 48;
            ctx.fillStyle = '#181828';
            ctx.fillRect(fx1 - 12, fy1 - 8, 16, 4);
            ctx.fillStyle = flagColors[i % flagColors.length];
            ctx.fillRect(fx1, fy1, 24, 16 + wave);

            const fx2 = 540 + i * 74;
            const fy2 = 36 + i * 44;
            ctx.fillStyle = flagColors[(i + 2) % flagColors.length];
            ctx.fillRect(fx2, fy2, 24, 16 - wave);
        }

        // Espectadores animados detrás del barandal
        StageRenderer._drawCrowd(ctx, gf, groundY);

        // Barandal y suelo
        StageRenderer._drawRailAndFloor(ctx, w, groundY, '#7c2d12', '#9a3412', '#ffbe0b', '#201824');
    }

    // =========================================================================
    // 2. ATARDECER EN TEOTIHUACÁN (PIRÁMIDES DEL SOL Y LA LUNA)
    // =========================================================================
    static _drawTeotihuacan(ctx, gf, w, h, groundY) {
        const horizonY = groundY - 120;
        // Degradado crepuscular púrpura, naranja y oro
        const skyBands = ['#3b0764', '#581c87', '#7c2d12', '#c2410c', '#ea580c', '#f59e0b', '#fef08a'];
        const bandH = Math.ceil(horizonY / skyBands.length);
        for (let i = 0; i < skyBands.length; i++) {
            ctx.fillStyle = skyBands[i];
            ctx.fillRect(0, i * bandH, w, bandH);
        }

        // Gran Sol dorado poniente detrás de la pirámide central
        const sunPulse = Math.sin(gf * 0.05) * 4;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx.fillRect(w * 0.5 - 70 - sunPulse, horizonY - 140 - sunPulse, 140 + sunPulse * 2, 140 + sunPulse * 2);
        ctx.fillStyle = '#ffedd5';
        ctx.fillRect(w * 0.5 - 50, horizonY - 120, 100, 100);

        // Silueta escalonada de la Pirámide del Sol (centro-izquierda)
        StageRenderer._drawSteppedPyramid(ctx, 160, horizonY, 260, 150, '#431407', '#78350f');

        // Silueta escalonada de la Pirámide de la Luna (derecha)
        StageRenderer._drawSteppedPyramid(ctx, 580, horizonY, 220, 120, '#451a03', '#713f12');

        // Braseros aztecas con fuego vivo animado sobre pilares de piedra
        const fireOsc = Math.sin(gf * 0.25) * 4;
        const brazierXs = [110, 310, 650, 850];
        for (const bx of brazierXs) {
            // Pilar de cantera
            ctx.fillStyle = '#292524';
            ctx.fillRect(bx - 12, horizonY - 32, 24, 32);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(bx - 18, horizonY - 42, 36, 10);

            // Llamas encendidas (oro, naranja, rojo)
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(bx - 14, horizonY - 62 + fireOsc, 28, 22);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(bx - 10, horizonY - 68 + fireOsc, 20, 20);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(bx - 6, horizonY - 72 + fireOsc, 12, 14);
        }

        StageRenderer._drawCrowd(ctx, gf, groundY);
        StageRenderer._drawRailAndFloor(ctx, w, groundY, '#78350f', '#9a3412', '#facc15', '#292524');
    }

    // =========================================================================
    // 3. CANALES DE XOCHIMILCO (AGUA ANIMADA Y TRAJINERAS FLORIDAS)
    // =========================================================================
    static _drawXochimilco(ctx, gf, w, h, groundY) {
        const horizonY = groundY - 120;
        const skyBands = ['#0c4a6e', '#0369a1', '#0284c7', '#38bdf8', '#7dd3fc'];
        const bandH = Math.ceil(horizonY / skyBands.length);
        for (let i = 0; i < skyBands.length; i++) {
            ctx.fillStyle = skyBands[i];
            ctx.fillRect(0, i * bandH, w, bandH);
        }

        // Sauces llorones a los costados
        ctx.fillStyle = '#14532d';
        ctx.fillRect(0, 40, 90, horizonY - 40);
        ctx.fillRect(w - 90, 40, 90, horizonY - 40);
        ctx.fillStyle = '#166534';
        ctx.fillRect(10, 60, 70, horizonY - 60);
        ctx.fillRect(w - 80, 60, 70, horizonY - 60);

        // Agua de los canales con reflejos ondulantes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, horizonY - 50, w, 50);
        for (let y = horizonY - 45; y < horizonY; y += 8) {
            const shift = Math.floor(Math.sin((gf + y * 4) * 0.12) * 8);
            ctx.fillStyle = y % 16 === 0 ? '#0284c7' : '#0369a1';
            ctx.fillRect(120 + shift, y, 720, 4);
        }

        // Trajinera tradicional meciéndose sobre el agua al fondo
        const boatBobY = Math.round(Math.sin(gf * 0.08) * 3);
        const boatX = 380;
        const boatY = horizonY - 48 + boatBobY;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(boatX, boatY, 190, 24);
        // Arco floral festivo
        const flowerCols = ['#ec4899', '#facc15', '#f97316', '#22c55e', '#a855f7'];
        for (let fx = boatX + 15; fx < boatX + 175; fx += 14) {
            ctx.fillStyle = flowerCols[(fx / 14) % flowerCols.length];
            ctx.fillRect(fx, boatY - 16, 12, 16);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(fx + 3, boatY - 12, 6, 6);
        }

        StageRenderer._drawCrowd(ctx, gf, groundY);
        StageRenderer._drawRailAndFloor(ctx, w, groundY, '#166534', '#15803d', '#facc15', '#14532d');
    }

    // =========================================================================
    // 4. MERCADO CALLEJERO NOCTURNO (BOMBILLAS, VAPOR Y CARPAS A RAYAS)
    // =========================================================================
    static _drawMercado(ctx, gf, w, h, groundY) {
        const horizonY = groundY - 120;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, horizonY);

        // Guirnaldas de bombillas de colores parpadeantes
        const bulbCols = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#e879f9', '#f97316'];
        for (let lx = 30; lx < w - 30; lx += 45) {
            const bulbY = 55 + Math.round(Math.sin(lx * 0.04) * 14);
            ctx.fillStyle = '#334155';
            ctx.fillRect(lx - 2, bulbY - 6, 4, 6);
            ctx.fillStyle = bulbCols[(Math.floor(lx / 45) + Math.floor(gf / 15)) % bulbCols.length];
            ctx.fillRect(lx - 6, bulbY, 12, 12);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(lx - 2, bulbY + 2, 4, 4);
        }

        // Carpas de lona a rayas en los puestos
        const stalls = [
            { x: 40, w: 180, c1: '#dc2626', c2: '#ffffff' },
            { x: 260, w: 200, c1: '#16a34a', c2: '#ffffff' },
            { x: 500, w: 190, c1: '#ea580c', c2: '#facc15' },
            { x: 730, w: 190, c1: '#2563eb', c2: '#ffffff' }
        ];
        for (const s of stalls) {
            const roofY = horizonY - 95;
            for (let rx = s.x; rx < s.x + s.w; rx += 20) {
                ctx.fillStyle = ((rx - s.x) / 20) % 2 === 0 ? s.c1 : s.c2;
                ctx.fillRect(rx, roofY, 20, 26);
            }
            // Mostrador de madera
            ctx.fillStyle = '#451a03';
            ctx.fillRect(s.x, roofY + 26, s.w, 48);
            // Cazuelas de cobre humeantes con vapor ascendente animado
            const steamY = roofY + 12 - (gf % 24);
            ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
            ctx.fillRect(s.x + 30, steamY, 14, 18);
            ctx.fillRect(s.x + 110, steamY + 6, 16, 20);
        }

        StageRenderer._drawCrowd(ctx, gf, groundY);
        StageRenderer._drawRailAndFloor(ctx, w, groundY, '#78350f', '#9a3412', '#facc15', '#1c1917');
    }

    // =========================================================================
    // 5. CENOTE SAGRADO DE LA SELVA MAYA (ESTALACTITAS Y AGUA TURQUESA)
    // =========================================================================
    static _drawCenote(ctx, gf, w, h, groundY) {
        const horizonY = groundY - 120;
        // Bóveda de caverna rocosa
        ctx.fillStyle = '#022c22';
        ctx.fillRect(0, 0, w, horizonY);

        // Rayos de sol penetrando a través de la abertura superior
        ctx.fillStyle = 'rgba(45, 212, 191, 0.18)';
        ctx.beginPath();
        ctx.moveTo(w * 0.5 - 60, 0);
        ctx.lineTo(w * 0.5 + 60, 0);
        ctx.lineTo(w * 0.75, horizonY);
        ctx.lineTo(w * 0.25, horizonY);
        ctx.fill();

        // Estalactitas y lianas colgantes desde el techo
        ctx.fillStyle = '#064e3b';
        const stalactites = [
            { x: 80, w: 32, h: 85 },
            { x: 210, w: 24, h: 65 },
            { x: 380, w: 38, h: 105 },
            { x: 620, w: 28, h: 75 },
            { x: 790, w: 34, h: 95 }
        ];
        for (const st of stalactites) {
            ctx.fillRect(st.x, 0, st.w, st.h);
            ctx.fillStyle = '#047857';
            ctx.fillRect(st.x + 4, 0, st.w - 8, st.h - 12);
        }

        // Cascada de agua cristalina animada al centro
        const waterShift = (gf * 3) % 20;
        ctx.fillStyle = '#0d9488';
        ctx.fillRect(w * 0.5 - 28, 40, 56, horizonY - 40);
        ctx.fillStyle = '#99f6e4';
        for (let y = 40 + waterShift; y < horizonY; y += 20) {
            ctx.fillRect(w * 0.5 - 18, y, 36, 6);
        }

        StageRenderer._drawCrowd(ctx, gf, groundY);
        StageRenderer._drawRailAndFloor(ctx, w, groundY, '#064e3b', '#047857', '#2dd4bf', '#022c22');
    }

    // =========================================================================
    // 6. FALDA DEL VOLCÁN POPOCATÉPETL (FUMAROLA, LAVA Y CENIZA FLOTANTE)
    // =========================================================================
    static _drawVolcan(ctx, gf, w, h, groundY) {
        const horizonY = groundY - 120;
        // Cielo nocturno enrojecido por magma
        const skyBands = ['#18080c', '#330814', '#550f24', '#771832', '#992240', '#66152a'];
        const bandH = Math.ceil(horizonY / skyBands.length);
        for (let i = 0; i < skyBands.length; i++) {
            ctx.fillStyle = skyBands[i];
            ctx.fillRect(0, i * bandH, w, bandH);
        }

        // Silueta del Volcán Popocatépetl con glaciar nevado en la cima
        const vx = w * 0.5;
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(vx - 240, horizonY);
        ctx.lineTo(vx, horizonY - 170);
        ctx.lineTo(vx + 240, horizonY);
        ctx.fill();

        // Nieve del cráter
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(vx - 40, horizonY - 142);
        ctx.lineTo(vx, horizonY - 170);
        ctx.lineTo(vx + 40, horizonY - 142);
        ctx.fill();

        // Gran columna de fumarola humeante roja animada ascendiendo al cielo
        const smokeOsc = Math.sin(gf * 0.1) * 8;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.fillRect(vx - 28 + smokeOsc, horizonY - 240, 56, 75);
        ctx.fillStyle = 'rgba(251, 146, 60, 0.55)';
        ctx.fillRect(vx - 16 - smokeOsc, horizonY - 210, 32, 55);

        // Ceniza volcánica brillante flotando en el aire
        for (let c = 0; c < 18; c++) {
            const cx = (c * 54 + gf * 2) % w;
            const cy = (c * 31 + gf) % horizonY;
            ctx.fillStyle = c % 2 === 0 ? '#ffedd5' : '#ea580c';
            ctx.fillRect(cx, cy, 3, 3);
        }

        StageRenderer._drawCrowd(ctx, gf, groundY);
        StageRenderer._drawRailAndFloor(ctx, w, groundY, '#7f1d1d', '#991b1b', '#f97316', '#1c1917');
    }

    // =========================================================================
    // 7. ALTAR DE OBSIDIANA DE OMEGA RUGAL (NIVEL 12 - JEFE FINAL)
    // =========================================================================
    static _drawAltarRugal(ctx, gf, w, h, groundY) {
        const horizonY = groundY - 120;
        // Cielo apocalíptico carmesí profundo y sombras de eclipse
        const skyBands = ['#180309', '#280510', '#3d0818', '#580d24', '#70102e', '#450a1c'];
        const bandH = Math.ceil(horizonY / skyBands.length);
        for (let i = 0; i < skyBands.length; i++) {
            ctx.fillStyle = skyBands[i];
            ctx.fillRect(0, i * bandH, w, bandH);
        }

        // Gran Luna Negra de Eclipse en el cenit con fulgor carmesí palpitante
        const moonPulse = Math.sin(gf * 0.1) * 6;
        ctx.fillStyle = '#ff0044';
        ctx.fillRect(w * 0.5 - 64 - moonPulse, 32 - moonPulse, 128 + moonPulse * 2, 128 + moonPulse * 2);
        ctx.fillStyle = '#090a14';
        ctx.fillRect(w * 0.5 - 56, 40, 112, 112);

        // Columnas titánicas de obsidiana con runas cibernéticas púrpuras palpitando
        const colXs = [70, 220, w - 220, w - 70];
        const runeGlow = Math.sin(gf * 0.15) > 0 ? '#a855f7' : '#ff0055';
        for (const cx of colXs) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(cx - 24, 0, 48, horizonY);
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(cx - 16, 0, 32, horizonY);
            // Núcleos y runas de plasma púrpura
            for (let ry = 30; ry < horizonY - 30; ry += 36) {
                ctx.fillStyle = runeGlow;
                ctx.fillRect(cx - 4, ry, 8, 16);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cx - 2, ry + 4, 4, 8);
            }
        }

        // Trono cibernético colosal de Rugal en el fondo central
        ctx.fillStyle = '#0f0f18';
        ctx.fillRect(w * 0.5 - 90, horizonY - 150, 180, 150);
        ctx.fillStyle = '#b8001f';
        ctx.fillRect(w * 0.5 - 70, horizonY - 140, 140, 140);
        // Emblema "R" dorado de Rugal
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(w * 0.5 - 24, horizonY - 120, 14, 52);
        ctx.fillRect(w * 0.5 - 10, horizonY - 120, 32, 14);
        ctx.fillRect(w * 0.5 + 10, horizonY - 106, 14, 20);
        ctx.fillRect(w * 0.5 - 10, horizonY - 86, 30, 12);
        ctx.fillRect(w * 0.5 + 8, horizonY - 74, 16, 26);

        // Estatuas de campeones derrotados bañadas en oro líquido a los costados
        ctx.fillStyle = '#eab308';
        ctx.fillRect(340, horizonY - 88, 22, 88);
        ctx.fillRect(598, horizonY - 88, 22, 88);

        // Suelo de metal oscuro con rejillas incandescentes
        StageRenderer._drawRailAndFloor(ctx, w, groundY, '#450a1c', '#70102e', '#ff0055', '#090a14');
    }

    // =========================================================================
    // UTILIDADES COMUNES: PIRÁMIDES, PÚBLICO Y BARANDAL/SUELO
    // =========================================================================
    static _drawSteppedPyramid(ctx, x, baseY, width, height, bodyColor, trimColor) {
        const steps = 5;
        const stepH = height / steps;
        for (let s = 0; s < steps; s++) {
            const frac = s / steps;
            const w = width * (1 - frac * 0.7);
            const sy = baseY - (s + 1) * stepH;
            const sx = x - w * 0.5;

            ctx.fillStyle = bodyColor;
            ctx.fillRect(sx, sy, w, stepH + 1);

            // Moldura superior del escalón
            ctx.fillStyle = trimColor;
            ctx.fillRect(sx, sy, w, 3);
        }
        // Templo / Altar en la cúspide
        const topW = width * 0.22;
        const topH = stepH * 1.2;
        const topY = baseY - height - topH;
        ctx.fillStyle = trimColor;
        ctx.fillRect(x - topW * 0.5, topY, topW, topH);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x - topW * 0.2, topY + topH * 0.3, topW * 0.4, topH * 0.7);
    }

    static _drawCrowd(ctx, gf, groundY) {
        if (!window.PixelArtRendererClass) return;
        window.PixelArtRendererClass.drawSpectator(ctx, 224, groundY - 12, gf, '#181824', '#2b3248', '#d99b66', 0);
        window.PixelArtRendererClass.drawSpectator(ctx, 326, groundY - 8, gf, '#162848', '#d99b66', '#c68652', 7);
        window.PixelArtRendererClass.drawSpectator(ctx, 616, groundY - 14, gf, '#203864', '#8d99ae', '#c68652', 4);
        window.PixelArtRendererClass.drawSpectator(ctx, 684, groundY - 4, gf, '#7f8c8d', '#2b2d42', '#d99b66', 11);
    }

    static _drawRailAndFloor(ctx, w, groundY, railWood, railShade, railLight, floorDark) {
        const railTopY = groundY - 96;

        // Barandal frontal de madera / metal
        ctx.fillStyle = railWood;
        ctx.fillRect(0, railTopY, w, 8);
        ctx.fillRect(0, groundY - 12, w, 8);
        ctx.fillStyle = railLight;
        ctx.fillRect(0, railTopY + 2, w, 4);

        for (let rx = 8; rx < w; rx += 32) {
            ctx.fillStyle = railShade;
            ctx.fillRect(rx, railTopY + 8, 8, 76);
            ctx.fillStyle = railLight;
            ctx.fillRect(rx + 2, railTopY + 12, 4, 68);
        }

        // Suelo principal de combate estilo arcade
        ctx.fillStyle = floorDark;
        ctx.fillRect(0, groundY - 4, w, 540 - (groundY - 4));
        ctx.fillStyle = railLight;
        ctx.fillRect(0, groundY - 4, w, 4);
        ctx.fillStyle = railWood;
        ctx.fillRect(0, groundY, w, 6);
    }
}

window.StageRenderer = StageRenderer;
