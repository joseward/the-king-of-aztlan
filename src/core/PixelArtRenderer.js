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

        // Elegir silueta de cabeza/peinado única para el retrato Neo-Geo 19x19
        let portraitMatrix;
        if (hs === 'tall_pillar') {
            // Benimaru: Torre vertical alta de cabello rubio
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
            // Terry Bogard / Clark: Gorra de camionero con frente blanco y visera
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
        } else if (hs === 'bald_beard' || hs === 'elder_beard') {
            // Chang Koehan / Chin Gentsai: Calvo con gran barba espesa
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
            // Iori Yagami / Shermie: Flequillo largo sobre el ojo y cuello alto
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
        } else if (hs === 'fedora_claws') {
            // Choi Bounge: Sombrero fedora con sombra y ojos rojos luminosos
            portraitMatrix = [
                '....RRRRRRRRRRR....',
                '..RRRRRRRRRRRRRRR..',
                'RRRRRRRRRRRRRRRRRRR',
                '....KKKKKKKKKKK....',
                '...KEEEEKEKEEEEKK...',
                '...KWWEKKKKWWERK...',
                '...KKKKKKKKKKKKK...',
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
        } else if (hs === 'sunglasses_bald') {
            // Mr. Big / Agentes: Calvo con gafas oscuras rectangulares
            portraitMatrix = [
                '.....SSSSSSSSS.....',
                '...SSSSSSSSSSSSS...',
                '..SSSSSSSSSSSSSSS..',
                '..SEEEEEESEEEEES..',
                '..SEEEEEESEEEEES..',
                '..SSSSSSNNNSSSSSS..',
                '...SSSSSNNNSSSSS...',
                '....SSSMMMMMSSS....',
                '....HHHMMMMMHHH....',
                '.....HHHHHHHHH.....',
                '......DDDDDDD......',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'slick_blonde') {
            // Geese Howard / Krauser: Cabello rubio engominado hacia atrás
            portraitMatrix = [
                '....HHHHHHHHHHH....',
                '..HHHHHHHHHHHHHHH..',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHHHHHHHHHHHHHH.',
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
                'CCCCCCCCBBBCCCCCCCC'
            ];
        } else if (hs === 'short_bob') {
            // Vanessa / Angel / May Lee / Blue Mary: Melena corta y femenina
            portraitMatrix = [
                '...HHHHHHHHHHHHH...',
                '..HHHHHHHHHHHHHHH..',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHSSSSSSSSHHHHH.',
                '.HHHSSSSSSSSSSSHHH.',
                '.HHSSWESSSSSWESSHH.',
                '.HHSSSSSSSSSSSSSHH.',
                '..HHSSSSNNNSSSSHH..',
                '..HHSSSSSSSSSSSHH..',
                '...HSSSMMMMMSSSH...',
                '....SSSSSSSSSSS....',
                '.....DDDDDDDDD.....',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCBBBCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'long_flowing') {
            // Mai / Athena / Leona / Kula / Whip: Coleta alta o melena larga
            portraitMatrix = [
                '....HHHHBBBBHHHH...',
                '..HHHHHBBBBBBHHHH..',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHSSSSSSSSHHHHH.',
                '.HHHSSSSSSSSSSSHHH.',
                '.HHSSWESSSSSWESSHH.',
                '.HHSSSSSSSSSSSSSHH.',
                '..HSSSSSNNNSSSSSH..',
                '..HSSSSSSSSSSSSSH..',
                '...SSSSMMMMMSSSS...',
                '....SSSSSSSSSSS....',
                '..H..DDDDDDDDD..H..',
                '.HHCCCDDDDDDDCCCHH.',
                'HHCCCCCDDDDDCCCCCHH',
                'HHCCCCCCCCCCCCCCCC.',
                '..CCCCCCCCCCCCCCC..'
            ];
        } else if (hs === 'spiky_white') {
            // K' (K-Dash): Picos plateados de anime y gafas de sol
            portraitMatrix = [
                '..H..HH..HH..HH..H.',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHSEEEEESEEEEESHH.',
                '.HHSEEEEESEEEEESHH.',
                '.HHSSSSSSSSSSSSSHH.',
                '..SSSSSSNNNSSSSSS..',
                '...SSSSSNNNSSSSS...',
                '....SSSMMMMMSSS....',
                '.....SSSSSSSSS.....',
                '......DDDDDDD......',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCRRRCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'cyborg_pompadour') {
            // Maxima: Pompadour oscuro con implante cibernético metálico
            portraitMatrix = [
                '....HHHHHHHHHHH....',
                '..HHHHHHHHHHHHHHH..',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHHHHHHHHHHHHHH.',
                '.ZZZSSSSSSSSSSSHHH.',
                '.ZZSSSSSSSSSSSSSHH.',
                '.ZSSSWESSSSSWESSSH.',
                '.ZSSSSSSSSSSSSSSSH.',
                '..SSSSSSNNNSSSSSS..',
                '..SSSSSSSSSSSSSSS..',
                '...SSSSMMMMMSSSS...',
                '....SSSSSSSSSSS....',
                '.....DDDDDDDDD.....',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCZZZCCCCCCCC'
            ];
        } else if (hs === 'tori_mask') {
            // Takuma Sakazaki: Máscara Tengu roja de gran nariz
            portraitMatrix = [
                '....HHHHHHHHHHH....',
                '..HHHHHHHHHHHHHHH..',
                '.RRRRRRRRRRRRRRRRR.',
                '.RRRRRRRRRRRRRRRRR.',
                '.RRRSWESSSSSWESRRR.',
                '.RRRSSSSSSSSSSSRRR.',
                '..RRRRRRRRRRRRRRR..',
                '...RRRRRNNNRRRRR...',
                '....RRRNNNNNRRR....',
                '.....RNNNNNNNR.....',
                '....BBBBBBBBBBB....',
                '.....DDDDDDDDD.....',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'mohawk_agent') {
            // Seth: Cresta mohawk rubia sobre piel oscura
            portraitMatrix = [
                '.......HHHHH.......',
                '.......HHHHH.......',
                '.......HHHHH.......',
                '.......HHHHH.......',
                '....SSSSSSSSSSS....',
                '...SSSSSSSSSSSSS...',
                '..SSSSWESSSWESSSS..',
                '..SSSSSSSSSSSSSSS..',
                '...SSSSSNNNSSSSS...',
                '....SSSMMMMMSSS....',
                '.....SSSSSSSSS.....',
                '......DDDDDDD......',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCDDDDDCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'boss_rugal') {
            // Omega Rugal: Cabello plateado peinado, ojo cibernético carmesí radiante
            portraitMatrix = [
                '....HHHHHHHHHHH....',
                '..HHHHHHHHHHHHHHH..',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHSSSSSSSSSSSHHH.',
                '.HHSSSSSSSSSSSSSHH.',
                '.HSSSWESSSSSWWSSH.',
                '.HSSSSSSSSSSWWRSSH.',
                '..SSSSSSNNNSSSSSS..',
                '..SSSSSSSSSSSSSSS..',
                '...SSSSMMMMMSSSS...',
                '....SSSSSSSSSSS....',
                '.....DDDDDDDDD.....',
                '...GGGDDDDDDDGGG...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCRRRCCCCCCCC'
            ];
        } else if (hs === 'blue_spiky_cape') {
            // K9999: Picos azules desordenados y cuello de capa roja
            portraitMatrix = [
                '..H..HH..HH..HH..H.',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHSSSSSSSSSSSHHH.',
                '.HHSSSSSSSSSSSSSHH.',
                '.HSSSWESSSSSWESSSH.',
                '.HSSSSSSSSSSSSSSSH.',
                '..SSSSSSNNNSSSSSS..',
                '..SSSSSSSSSSSSSSS..',
                '...SSSSMMMMMSSSS...',
                '....SSSSSSSSSSS....',
                '.....DDDDDDDDD.....',
                '...RRRDDDDDDDRRR...',
                '.RRRRCCDDDDDCCRRRR.',
                'RRRRCCCCCCCCCCCRRRR',
                'RRRRRRRRRRRRRRRRRRR'
            ];
        } else if (hs === 'eyepatch_lucha') {
            // Ramon: Parche de lucha libre cubriendo el ojo izquierdo
            portraitMatrix = [
                '....HHHHHHHHHHH....',
                '..HHHHHHHHHHHHHHH..',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHSSSSSSSSSSSHHH.',
                '.HHSSSSSSSSSSSSSHH.',
                '.HSSSWESSSSSKKKSSH.',
                '.HSSSSSSSSSSKKKSSH.',
                '..SSSSSSNNNSSSSSS..',
                '..SSSSSSSSSSSSSSS..',
                '...SSSSMMMMMSSSS...',
                '....SSSSSSSSSSS....',
                '.....DDDDDDDDD.....',
                '...CCCDDDDDDDCCC...',
                '.CCCCCCDDDDDCCCCCC.',
                'CCCCCCCCDDDCCCCCCCC',
                'CCCCCCCCCCCCCCCCCCC'
            ];
        } else if (hs === 'spiky_bandana' || hs === 'bald_headband') {
            // Joe Higashi / Ralf / Daimon: Bandana frontal con nudo
            portraitMatrix = [
                '..H..HH..HH..HH..H.',
                '.HHHHHHHHHHHHHHHHH.',
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
        } else {
            // Clásico estilizado (Kyo, Ryo, Andy, Robert, Kim, Yashiro, Shingo, etc.) SIN cinta blanca en la frente
            portraitMatrix = [
                '..H..HH..HH..HH..H.',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHHHHHHHHHHHHHH.',
                '.HHHHSSSSSSSSHHHHH.',
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

        const isRugal = vis.bodyType === 'boss_rugal' || hs === 'boss_rugal';
        const palette = {
            H: vis.hairColor || '#1c1526',
            B: vis.secondaryColor || '#ffffff',
            S: vis.skinColor || '#e2a778',
            D: '#8d5b3c',
            W: isRugal ? '#ff0044' : (hs === 'spiky_white' ? '#dc2626' : '#ffffff'),
            E: hs === 'eyepatch_lucha' ? '#000000' : '#0f0c1b',
            N: '#a46942',
            M: '#7a2e2e',
            C: vis.primaryColor || '#1e293b',
            G: '#ffea00',
            R: '#dc2626',
            K: '#0b0814',
            Z: '#38bdf8'
        };

        PixelArtRenderer.drawBitmapMatrix(octx, portraitMatrix, palette, 0, p, p);
        this.portraitCache.set(key, off);
        return off;
    }

    /**
     * Ilustración de busto grande ("Big Bust Portrait") 1:1 estilo KOF 2002 para la pantalla de selección.
     * Muestra a Kyo, Iori, Terry, Mai, Athena, Benimaru, Chang, Choi, Rugal, etc. con sus rasgos icónicos,
     * peinados detallados, miradas, accesorios y vestimentas sobre el fondo de rejilla naranja (1P) o magenta (2P).
     */
    getKOFBigBustCanvas(template, width = 268, height = 236, isP1 = true) {
        if (!template) return null;
        if (!this.bigBustCache) this.bigBustCache = new Map();
        const key = `${template.id}_${width}_${height}_${isP1 ? 'P1' : 'P2'}`;
        if (this.bigBustCache.has(key)) {
            return this.bigBustCache.get(key);
        }

        const off = document.createElement('canvas');
        off.width = width;
        off.height = height;
        const ctx = off.getContext('2d');
        PixelArtRenderer.enforcePixelCrispness(ctx);

        const id = template.id;
        const vis = template.visuals || {};
        const hs = vis.hairStyle || 'spiky_headband';
        const sc = vis.skinColor || '#f3c6a0';
        const hc = vis.hairColor || '#261812';
        const pc = vis.primaryColor || '#1e293b';
        const isBoss = Boolean(template.isBoss || id === 'rugal');

        // 1. Fondo de rejilla luminosa Neo-Geo KOF 2002 (Naranja para 1P, Magenta para 2P)
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        if (isP1) {
            bgGrad.addColorStop(0, '#f97316');
            bgGrad.addColorStop(0.45, '#dc2626');
            bgGrad.addColorStop(1, '#581c87');
        } else {
            bgGrad.addColorStop(0, '#f472b6');
            bgGrad.addColorStop(0.45, '#be185d');
            bgGrad.addColorStop(1, '#4c0519');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Rejilla geométrica arcade en perspectiva
        ctx.save();
        ctx.strokeStyle = isP1 ? 'rgba(255, 234, 0, 0.28)' : 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < width; gx += 16) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx + 24, height);
            ctx.stroke();
        }
        for (let gy = 0; gy < height; gy += 16) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(width, gy);
            ctx.stroke();
        }
        ctx.restore();

        // 2. Máscara de recorte con bisel estilo KOF 2002
        const notch = 18;
        ctx.save();
        ctx.beginPath();
        if (isP1) {
            // Bisel en esquina inferior derecha para 1P
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, height - notch);
            ctx.lineTo(width - notch, height);
            ctx.lineTo(0, height);
        } else {
            // Bisel en esquina superior derecha para 2P
            ctx.moveTo(0, 0);
            ctx.lineTo(width - notch, 0);
            ctx.lineTo(width, notch);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
        }
        ctx.closePath();
        ctx.clip();

        // Sombra de silueta detrás del busto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(width * 0.52 + 10, height * 0.55 + 10, 80, 95, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Renderizado del Busto (Hombros, Cuello, Mentón, Rostro, Ojos, Cabello, Ropa)
        const cx = width * 0.52;
        const cy = height * 0.54;

        // Base de Hombros y Ropa
        ctx.fillStyle = pc;
        ctx.beginPath();
        ctx.moveTo(cx - 95, height);
        ctx.lineTo(cx - 70, cy + 45);
        ctx.lineTo(cx - 32, cy + 30);
        ctx.lineTo(cx + 32, cy + 30);
        ctx.lineTo(cx + 70, cy + 45);
        ctx.lineTo(cx + 95, height);
        ctx.closePath();
        ctx.fill();

        // Sombra y pliegues en la ropa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.moveTo(cx - 95, height);
        ctx.lineTo(cx - 70, cy + 45);
        ctx.lineTo(cx, cy + 55);
        ctx.lineTo(cx - 30, height);
        ctx.closePath();
        ctx.fill();

        // Cuello anatómico
        ctx.fillStyle = sc;
        ctx.fillRect(cx - 24, cy + 5, 48, 38);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(cx + 4, cy + 5, 20, 38);

        // Accesorios de Cuello / Pecho específicos de KOF
        if (id === 'iori') {
            // Gargantilla de cuero negro con anillo de luna plateada de Iori Yagami
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(cx - 24, cy + 18, 48, 12);
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(cx - 2, cy + 24, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(cx - 2, cy + 24, 4, 0, Math.PI * 2);
            ctx.fill();
            // Camisa blanca desabrochada
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(cx - 36, cy + 34);
            ctx.lineTo(cx - 18, cy + 46);
            ctx.lineTo(cx - 30, height);
            ctx.lineTo(cx - 65, height);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 36, cy + 34);
            ctx.lineTo(cx + 18, cy + 46);
            ctx.lineTo(cx + 30, height);
            ctx.lineTo(cx + 65, height);
            ctx.closePath();
            ctx.fill();
        } else if (id === 'kyo') {
            // Cuello alto de chaqueta blanca con ribetes negros y cremallera de Kyo Kusanagi
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(cx - 28, cy + 22, 56, 16);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(cx - 4, cy + 22, 8, 30);
            ctx.fillRect(cx - 26, cy + 24, 6, 12);
            ctx.fillRect(cx + 20, cy + 24, 6, 12);
        } else if (id === 'terry') {
            // Chaleco vaquero rojo y camiseta blanca de Terry Bogard
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(cx - 16, cy + 26, 32, 40);
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(cx - 36, cy + 30);
            ctx.lineTo(cx - 16, cy + 38);
            ctx.lineTo(cx - 18, height);
            ctx.lineTo(cx - 70, height);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 36, cy + 30);
            ctx.lineTo(cx + 16, cy + 38);
            ctx.lineTo(cx + 18, height);
            ctx.lineTo(cx + 70, height);
            ctx.closePath();
            ctx.fill();
            // Estrella blanca de Terry en el chaleco
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - 42, cy + 62, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (id === 'chang') {
            // Cadena de hierro gruesa de Chang Koehan en el cuello
            ctx.fillStyle = '#94a3b8';
            for (let k = -3; k <= 3; k++) {
                ctx.beginPath();
                ctx.arc(cx + k * 18, cy + 38, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.arc(cx + k * 18, cy + 38, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#94a3b8';
            }
        } else if (isBoss || id === 'rugal') {
            // Hombreras militares de oro de Omega Rugal
            ctx.fillStyle = '#eab308';
            ctx.fillRect(cx - 78, cy + 38, 36, 14);
            ctx.fillRect(cx + 42, cy + 38, 36, 14);
            // Flecos dorados
            ctx.fillStyle = '#fde047';
            for (let f = 0; f < 6; f++) {
                ctx.fillRect(cx - 76 + f * 6, cy + 52, 4, 16);
                ctx.fillRect(cx + 44 + f * 6, cy + 52, 4, 16);
            }
        } else if (id === 'mai') {
            // Túnica roja de Kunoichi de Mai Shiranui
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(cx - 32, cy + 28);
            ctx.lineTo(cx, cy + 52);
            ctx.lineTo(cx + 32, cy + 28);
            ctx.lineTo(cx + 50, height);
            ctx.lineTo(cx - 50, height);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(cx - 2, cy + 44, 4, 30);
        }

        // Rostro y Mentón estilizado Anime Neo-Geo
        ctx.fillStyle = sc;
        ctx.beginPath();
        ctx.moveTo(cx - 42, cy - 25);
        ctx.lineTo(cx - 36, cy + 18);
        ctx.lineTo(cx, cy + 32);
        ctx.lineTo(cx + 36, cy + 18);
        ctx.lineTo(cx + 42, cy - 25);
        ctx.closePath();
        ctx.fill();

        // Sombra lateral del rostro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.beginPath();
        ctx.moveTo(cx + 6, cy - 20);
        ctx.lineTo(cx + 42, cy - 20);
        ctx.lineTo(cx + 36, cy + 18);
        ctx.lineTo(cx, cy + 32);
        ctx.closePath();
        ctx.fill();

        // Ojos y Expresión
        if (id === 'chang') {
            // Ojos grandes y mirada salvaje
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - 18, cy - 6, 8, 0, Math.PI * 2);
            ctx.arc(cx + 18, cy - 6, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#090a14';
            ctx.beginPath();
            ctx.arc(cx - 16, cy - 6, 4, 0, Math.PI * 2);
            ctx.arc(cx + 16, cy - 6, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (id === 'choi') {
            // Gafas redondas con brillo rojo
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(cx - 16, cy - 4, 9, 0, Math.PI * 2);
            ctx.arc(cx + 16, cy - 4, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx - 16, cy - 4, 6, 0, Math.PI * 2);
            ctx.arc(cx + 16, cy - 4, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 18, cy - 7, 4, 3);
            ctx.fillRect(cx + 14, cy - 7, 4, 3);
        } else if (id === 'kdash' || hs === 'sunglasses_bald' || id === 'clark') {
            // Gafas de sol negras estilizadas
            ctx.fillStyle = '#09090b';
            ctx.fillRect(cx - 30, cy - 12, 60, 16);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(cx - 24, cy - 10, 18, 2);
            ctx.fillRect(cx + 6, cy - 10, 18, 2);
        } else if (id === 'iori') {
            // Ojo izquierdo visible con mirada feroz; el derecho cubierto por flequillo
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 24, cy - 8, 14, 8);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(cx - 20, cy - 7, 7, 6);
            ctx.fillStyle = '#090a14';
            ctx.fillRect(cx - 18, cy - 6, 3, 4);
        } else if (isBoss || id === 'rugal') {
            // Ojo derecho normal gris
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 24, cy - 8, 14, 8);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(cx - 20, cy - 7, 6, 6);
            // Ojo izquierdo: CIBERNETICO ROJO BRILLANTE CON DESTELLO
            ctx.fillStyle = '#ff0044';
            ctx.beginPath();
            ctx.arc(cx + 18, cy - 4, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx + 18, cy - 4, 3, 0, Math.PI * 2);
            ctx.fill();
            // Rayos del destello óptico
            ctx.strokeStyle = 'rgba(255, 0, 80, 0.65)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + 6, cy - 4); ctx.lineTo(cx + 30, cy - 4);
            ctx.moveTo(cx + 18, cy - 16); ctx.lineTo(cx + 18, cy + 8);
            ctx.stroke();
        } else if (hs === 'bangs_over_eye' || id === 'shermie') {
            // Ojos ocultos por flequillo
        } else {
            // Ojos estándar estilizados Anime
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 26, cy - 8, 16, 8);
            ctx.fillRect(cx + 10, cy - 8, 16, 8);
            ctx.fillStyle = id === 'terry' ? '#38bdf8' : (id === 'mai' ? '#92400e' : '#1e293b');
            ctx.fillRect(cx - 20, cy - 7, 7, 6);
            ctx.fillRect(cx + 13, cy - 7, 7, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 18, cy - 7, 2, 2);
            ctx.fillRect(cx + 15, cy - 7, 2, 2);
        }

        // Nariz y Boca con expresión
        ctx.fillStyle = '#945236';
        ctx.fillRect(cx - 2, cy + 4, 4, 5); // Nariz
        if (id === 'chang') {
            // Gran barba negra espesa que cubre la boca
            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 24, 38, 26, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (id === 'choi') {
            // Bigote curvo
            ctx.fillStyle = '#451a03';
            ctx.fillRect(cx - 16, cy + 12, 32, 4);
        } else if (isBoss || id === 'rugal') {
            // Bigote elegante de Rugal
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(cx - 18, cy + 11, 36, 5);
        } else {
            // Boca estilizada (sonrisa para Terry/Kyo/Mai, fría para K')
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(cx - 10, cy + 16, 20, 3);
        }

        // 4. Cabello y Tocados icónicos de KOF 2002
        ctx.fillStyle = hc;
        if (id === 'iori') {
            // Mechón rojo larguísimo característico de Iori Yagami que cruza la frente y tapa el ojo derecho
            ctx.beginPath();
            ctx.moveTo(cx - 45, cy - 40);
            ctx.lineTo(cx + 25, cy - 50);
            ctx.lineTo(cx + 42, cy - 10);
            ctx.lineTo(cx + 34, cy + 30);
            ctx.lineTo(cx + 12, cy + 42);
            ctx.lineTo(cx + 2, cy + 20);
            ctx.lineTo(cx - 12, cy - 10);
            ctx.closePath();
            ctx.fill();
            // Puntas de pelo adicionales
            ctx.beginPath();
            ctx.moveTo(cx - 45, cy - 20);
            ctx.lineTo(cx - 52, cy + 5);
            ctx.lineTo(cx - 38, cy);
            ctx.closePath();
            ctx.fill();
        } else if (id === 'kyo') {
            // Cabello castaño peinado al medio con mechones cayendo sobre las sienes de Kyo Kusanagi
            ctx.beginPath();
            ctx.arc(cx, cy - 35, 46, Math.PI, 0);
            ctx.fill();
            // Mechones laterales
            ctx.beginPath();
            ctx.moveTo(cx - 44, cy - 35);
            ctx.lineTo(cx - 48, cy + 5);
            ctx.lineTo(cx - 30, cy - 10);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 44, cy - 35);
            ctx.lineTo(cx + 48, cy + 5);
            ctx.lineTo(cx + 30, cy - 10);
            ctx.closePath();
            ctx.fill();
            // Mechón central
            ctx.beginPath();
            ctx.moveTo(cx - 12, cy - 35);
            ctx.lineTo(cx, cy - 12);
            ctx.lineTo(cx + 12, cy - 35);
            ctx.closePath();
            ctx.fill();
        } else if (id === 'terry') {
            // Gorra de camionero roja de Terry con frente blanco y pelo rubio suelto
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(cx, cy - 32, 48, Math.PI, 0);
            ctx.fill();
            // Frente blanco de la gorra
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 32, cy - 40, 64, 18);
            // Visera azul de la gorra
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(cx - 42, cy - 22, 84, 8);
            // Cabello rubio saliendo a los costados
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - 52, cy - 14, 14, 55);
            ctx.fillRect(cx + 38, cy - 14, 14, 55);
        } else if (hs === 'tall_pillar' || id === 'benimaru') {
            // Torre vertical alta de cabello rubio de Benimaru Nikaido
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(cx - 28, cy - 25);
            ctx.lineTo(cx - 22, 10);
            ctx.lineTo(cx + 22, 10);
            ctx.lineTo(cx + 28, cy - 25);
            ctx.closePath();
            ctx.fill();
            // Pendiente brillante en oreja
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(cx - 44, cy + 8, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (id === 'choi') {
            // Sombrero fedora marrón de Choi Bounge
            ctx.fillStyle = '#78350f';
            ctx.fillRect(cx - 55, cy - 28, 110, 10);
            ctx.fillRect(cx - 36, cy - 54, 72, 28);
            ctx.fillStyle = '#451a03';
            ctx.fillRect(cx - 36, cy - 34, 72, 6);
        } else if (id === 'mai') {
            // Coleta alta castaña de Mai Shiranui
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(cx, cy - 34, 44, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 12, cy - 56, 24, 12);
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy - 56);
            ctx.lineTo(cx + 55, cy - 80);
            ctx.lineTo(cx + 45, cy - 30);
            ctx.closePath();
            ctx.fill();
        } else if (id === 'athena') {
            // Pelo púrpura y estrella dorada de Athena Asamiya
            ctx.fillStyle = '#9333ea';
            ctx.beginPath();
            ctx.arc(cx, cy - 34, 46, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(cx - 48, cy - 25, 14, 55);
            ctx.fillRect(cx + 34, cy - 25, 14, 55);
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(cx - 28, cy - 38, 7, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBoss || id === 'rugal') {
            // Melena plateada hacia atrás de Omega Rugal
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(cx, cy - 32, 48, Math.PI * 0.9, Math.PI * 0.1);
            ctx.fill();
            ctx.fillRect(cx - 52, cy - 28, 16, 45);
            ctx.fillRect(cx + 36, cy - 28, 16, 45);
        } else {
            // Peinado clásico por defecto según hairColor
            ctx.beginPath();
            ctx.arc(cx, cy - 32, 44, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(cx - 44, cy - 30, 10, 35);
            ctx.fillRect(cx + 34, cy - 30, 10, 35);
        }

        ctx.restore(); // Fin de recorte

        // 5. Marco biselado exterior KOF 2002 (3px de borde blanco nítido)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (isP1) {
            ctx.moveTo(1.5, 1.5);
            ctx.lineTo(width - 1.5, 1.5);
            ctx.lineTo(width - 1.5, height - notch - 1.5);
            ctx.lineTo(width - notch - 1.5, height - 1.5);
            ctx.lineTo(1.5, height - 1.5);
        } else {
            ctx.moveTo(1.5, 1.5);
            ctx.lineTo(width - notch - 1.5, 1.5);
            ctx.lineTo(width - 1.5, notch + 1.5);
            ctx.lineTo(width - 1.5, height - 1.5);
            ctx.lineTo(1.5, height - 1.5);
        }
        ctx.closePath();
        ctx.stroke();

        // 6. Placa inferior con Nombre del Personaje y Equipo
        ctx.fillStyle = 'rgba(8, 10, 24, 0.82)';
        ctx.fillRect(4, height - 32, width - (isP1 ? notch + 8 : 8), 26);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, height - 32, width - (isP1 ? notch + 8 : 8), 1);

        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = isP1 ? '#ffea00' : '#ff70a6';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.fillText(template.name.toUpperCase(), 12, height - 14);
        ctx.shadowBlur = 0;

        ctx.font = '9px monospace';
        ctx.fillStyle = '#70f8a0';
        ctx.fillText(template.teamName ? template.teamName.slice(0, 18) : 'AZTLAN 2002', 12, height - 4);

        this.bigBustCache.set(key, off);
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
    static drawSlashArc(ctx, x1, y1, x2, y2, color, coreColor = '#ffffff', p = 3, curvature = 22, thicknessScale = 1.0) {
        const steps = 9;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const bell = Math.sin(t * Math.PI);
            const curve = bell * curvature;
            const px = Math.round((x1 + (x2 - x1) * t + curve) / p) * p;
            const py = Math.round((y1 + (y2 - y1) * t) / p) * p;
            const thick = Math.max(p, Math.round(bell * p * 3.6 * thicknessScale));

            // Halo elemental exterior
            ctx.fillStyle = color;
            ctx.fillRect(px - p, py - p, thick + p * 2, thick + p);

            // Ráfagas de velocidad horizontales en el centro del arco
            if (i % 2 === 1) {
                ctx.fillRect(px - p * 3, py, thick + p * 4, p);
            }

            // Núcleo incandescente blanco
            ctx.fillStyle = coreColor;
            ctx.fillRect(px, py, Math.max(p, thick - p), p);
        }
    }

    /**
     * Dibuja un destello de velocidad e impacto en la punta de los golpes básicos (Jabs, Rectos, Patadas).
     */
    static drawStrikeBurst(ctx, x, y, color, coreColor = '#ffffff', isHeavy = false, p = 3) {
        const gx = Math.round(x / p) * p;
        const gy = Math.round(y / p) * p;
        const span = isHeavy ? p * 5 : p * 3;

        // Líneas de velocidad cinéticas (Speedlines detrás del golpe)
        ctx.fillStyle = color;
        ctx.fillRect(gx - span * 2.2, gy - p, span * 2.4, p * 2);
        ctx.fillRect(gx - span * 1.6, gy - p * 3, span * 1.4, p);
        ctx.fillRect(gx - span * 1.6, gy + p * 3, span * 1.4, p);

        // Cruz de destello en el punto de impacto
        ctx.fillStyle = color;
        ctx.fillRect(gx - span, gy - p, span * 2, p * 2);
        ctx.fillRect(gx - p, gy - span, p * 2, span * 2);

        if (isHeavy) {
            // Destellos diagonales adicionales en golpes fuertes o de combo
            ctx.fillRect(gx - span * 0.7, gy - span * 0.7, p * 2, p * 2);
            ctx.fillRect(gx + span * 0.5, gy - span * 0.7, p * 2, p * 2);
            ctx.fillRect(gx - span * 0.7, gy + span * 0.5, p * 2, p * 2);
            ctx.fillRect(gx + span * 0.5, gy + span * 0.5, p * 2, p * 2);
        }

        // Centro brillante
        ctx.fillStyle = coreColor;
        ctx.fillRect(gx - p, gy - p, p * 3, p * 2);
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
            pose === 'THROW_GRAB' ||
            pose === 'MAX2_CLIMAX' ||
            pose === 'SIG_GRAB' ||
            pose === 'SIG_CHARGE' ||
            pose === 'SIG_COUNTER' ||
            pose === 'SIG_PILLAR' ||
            state === 'VICTORY' ||
            pose.includes('SPECIAL') ||
            pose.includes('SUPER');

        const isKicking = pose.includes('KICK') || pose === 'SPECIAL_RUSH' || pose === 'SIG_SLIDE' || pose === 'SIG_DIVE';
        const charId = fighter.template?.id || '';

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
            if (hairStyle === 'blue_spiky_cape' || charId === 'k9999') {
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
            if (outfit === 'kunoichi_red' || charId === 'mai') {
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

            // Insignia de Estrella Blanca en la espalda de la chaqueta de Terry Bogard
            if (charId === 'terry') {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(torsoLeanX / p) - 2, Math.round(shoulderY / p) + 4, 4, 4, '#ffffff', null, null, p);
            }

            // Insignia de Luna Creciente Blanca y faldas largas del abrigo negro de Iori Yagami
            if (charId === 'iori') {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(torsoLeanX / p) - 2, Math.round(shoulderY / p) + 3, 4, 4, '#ffffff', null, null, p);
                PixelArtRenderer.drawPixelLimb(ctx, torsoLeanX - 6, pelvisY, torsoLeanX - 22, pelvisY + 44 + waveY, 11, '#111827', '#090a14', cOutline, p);
            }

            // Calabaza tradicional de sake colgada en la espalda de Chin Gentsai
            if (charId === 'chin' || vis.accessory === 'sake_gourd') {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(torsoLeanX / p) - 10, Math.round(shoulderY / p) + 4, 7, 10, '#92400e', '#78350f', cOutline, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(torsoLeanX / p) - 9, Math.round(shoulderY / p) + 1, 5, 4, '#b45309', null, cOutline, p);
            }

            // Hombreras de águila imperial dorada con galones para el Jefe Final Omega Rugal
            if (isRugal) {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(torsoLeanX / p) - Math.floor(chestW * 0.5) - 3, Math.round(shoulderY / p) - 2, 6, 4, '#ffea00', '#ffffff', cOutline, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(torsoLeanX / p) + Math.floor(chestW * 0.5) - 3, Math.round(shoulderY / p) - 2, 6, 4, '#ffea00', '#ffffff', cOutline, p);
            }

            // Cadena de hierro gruesa cruzando el pecho de Chang Koehan
            if (charId === 'chang' || isGiant) {
                PixelArtRenderer.drawPixelLimb(ctx, (chestGridX - 6) * p, (chestGridY + 1) * p, (chestGridX + 6) * p, (waistGridY + 4) * p, 6, '#94a3b8', '#334155', cOutline, p);
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
                const isLowKick = pose === 'KICK_LOW' || pose === 'CROUCH_KICK';
                const isHighKick = pose === 'KICK_HIGH' || pose === 'CMD_KICK';
                const isAirKick = pose === 'AIR_KICK';
                const baseTargetY = isLowKick
                    ? -18
                    : isHighKick
                        ? -168
                        : isAirKick
                            ? -86
                            : -112 + Math.round(flurryOsc * 24);
                const baseTargetX = isLowKick ? 98 : isHighKick ? 102 : 96;
                const kickTargetX = Math.round(26 + (baseTargetX - 26) * extFactor);
                const kickTargetY = Math.round(-36 + (baseTargetY + 36) * extFactor);
                const kickKneeX = Math.round((frontHipX + kickTargetX) * 0.48);
                const kickKneeY = Math.round((pelvisY + kickTargetY) * 0.5 - (isHighKick ? 16 : 8));

                const isComboInfused = (fighter.chainStepCount || 0) >= 2 || fighter.isMaxMode || state === 'SPECIAL' || state === 'SUPER';
                const bootGlow = isComboInfused || isHighKick ? cEnergy : cBoots;

                PixelArtRenderer.drawPixelLimb(ctx, frontHipX, pelvisY, kickKneeX, kickKneeY, 18, legUpperColor, legUpperShade, cOutline, p);
                PixelArtRenderer.drawPixelLimb(ctx, kickKneeX, kickKneeY, kickTargetX, kickTargetY, 16, bootGlow, cSecondary, cOutline, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(kickTargetX / p) - 2, Math.round(kickTargetY / p) - 2, 6, 4, bootGlow, '#ffffff', cOutline, p);

                if (!isSilhouette && atkPhase === 'ACTIVE') {
                    const slashCol = isComboInfused || isHighKick ? cEnergy : '#7dd3fc';
                    if (isLowKick) {
                        // Barrida baja rasante con arco horizontal a ras del suelo y chispas
                        PixelArtRenderer.drawSlashArc(ctx, kickTargetX - 36, kickTargetY - 6, kickTargetX + 18, kickTargetY + 6, slashCol, '#ffffff', p, 12, 1.1);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                        ctx.fillRect(kickTargetX - 28, -8, 42, 4);
                    } else if (isHighKick) {
                        // Gran medialuna de corte en patada alta / overhead
                        PixelArtRenderer.drawSlashArc(ctx, kickTargetX - 28, kickTargetY + 42, kickTargetX + 16, kickTargetY - 28, cEnergy, '#ffffff', p, 28, 1.35);
                        PixelArtRenderer.drawSlashArc(ctx, kickTargetX - 18, kickTargetY + 26, kickTargetX + 8, kickTargetY - 16, cSecondary, '#ffffff', p, 18, 0.9);
                    } else {
                        // Patada media / aérea con arco de viento afilado
                        PixelArtRenderer.drawSlashArc(ctx, kickTargetX - 20, kickTargetY - 26, kickTargetX + 14, kickTargetY + 24, slashCol, '#ffffff', p, 20, 1.05);
                    }
                    PixelArtRenderer.drawStrikeBurst(ctx, kickTargetX + 8, kickTargetY, slashCol, '#ffffff', isHighKick || isComboInfused, p);
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

        // 5. PELVIS, CINTURA, FALDA, HEBILLA Y CORREA ROJA DE IORI
        const hipGridY = Math.round(pelvisY / p);
        const hipWidth = isGiant ? 18 : isFemale ? 11 : 12;
        PixelArtRenderer.drawPixelBox(ctx, -Math.floor(hipWidth * 0.5), hipGridY - 3, hipWidth, 6, cPrimary && outfit === 'skirt_jacket' ? cPrimary : cPants, cPantsShade, cOutline, p);
        PixelArtRenderer.drawPixelBox(ctx, -Math.floor(hipWidth * 0.5), hipGridY - 5, hipWidth + 1, 2, cSecondary, cPrimary, cOutline, p);
        // Hebilla metálica central en el cinturón
        if (!isSilhouette) {
            PixelArtRenderer.drawPixelBox(ctx, 0, hipGridY - 5, 3, 2, '#ffea00', '#ffffff', null, p);
            // Correa roja icónica entre las rodillas de Iori Yagami
            if (charId === 'iori' && !isKicking) {
                PixelArtRenderer.drawPixelLimb(ctx, -18, -58, 22, -58, 6, '#dc2626', '#991b1b', cOutline, p);
            }
        }

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

        // Detalles anatómicos y de vestimenta en el torso
        if (!isSilhouette) {
            if (outfit === 'bare_chest_pants') {
                // Definición muscular pectoral y abdominal
                ctx.fillStyle = cSkinShade;
                ctx.fillRect((chestGridX - 4) * p, (chestGridY + 4) * p, 8 * p, p);
                ctx.fillRect((chestGridX) * p, (chestGridY + 1) * p, p, (torsoH + 3) * p);
            } else if (outfit === 'karate_gi') {
                PixelArtRenderer.drawPixelLimb(ctx, (chestGridX - 4) * p, chestGridY * p, (chestGridX + 2) * p, (waistGridY + 2) * p, 6, cSecondary, null, null, p);
            } else if (outfit === 'suspenders_boxer') {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, chestGridY, 2, torsoH + 5, cSecondary, null, null, p);
                PixelArtRenderer.drawPixelBox(ctx, chestGridX + 3, chestGridY, 2, torsoH + 5, cSecondary, null, null, p);
            } else if (outfit === 'armor_boss' || charId === 'maxima') {
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

        // 7. CUELLO, CABEZA, EXPRESIÓN FACIAL Y PEINADO / ACCESORIOS ÚNICOS
        PixelArtRenderer.drawPixelBox(ctx, chestGridX - 2, Math.round(neckY / p), 4, 3, cSkin, cSkinShade, cOutline, p);
        PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY + 2, 7, 6, cSkin, cSkinShade, cOutline, p);

        if (hairStyle === 'tall_pillar') {
            // Benimaru: Torre vertical alta de cabello rubio con chispas electrostáticas
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY - 11, 7, 13, cHair, '#fef08a', cOutline, p);
            if (!isSilhouette && f % 6 < 3) {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 5, headGridY - 8, 2, 2, '#00f5ff', '#ffffff', null, p);
                PixelArtRenderer.drawPixelBox(ctx, chestGridX + 4, headGridY - 4, 2, 2, '#00f5ff', '#ffffff', null, p);
            }
        } else if (hairStyle === 'cap_ponytail') {
            // Terry Bogard / Clark: Gorra con placa blanca frontal, visera y coleta trasera
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 2, 9, 4, cPrimary, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX, headGridY - 2, 4, 2, '#ffffff', null, null, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX + 3, headGridY + 1, 5, 1, '#1e3a8a', null, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, (chestGridX - 4) * p, (headGridY + 1) * p, (chestGridX - 9) * p, (headGridY + 6) * p, 5, cHair, null, cOutline, p);
        } else if (hairStyle === 'fedora_claws') {
            // Choi Bounge: Sombrero fedora marrón con ala ancha que proyecta sombra
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 3, 8, 4, '#78350f', '#451a03', cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 6, headGridY + 1, 13, 2, '#78350f', '#451a03', cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY + 2, 7, 2, '#1c1917', null, null, p);
        } else if (hairStyle === 'bald_beard') {
            // Chang Koehan: Cúpula calva y densa barba negra que baja hasta el pecho
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 1, 9, 3, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 5, 9, 8, cHair, '#090a14', cOutline, p);
        } else if (hairStyle === 'elder_beard') {
            // Chin Gentsai: Calvo con cejas y barba blanca larga de anciano sabio
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY - 1, 7, 3, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 1, 2, 4, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY + 5, 8, 7, cHair, '#cbd5e1', cOutline, p);
        } else if (hairStyle === 'bangs_over_eye') {
            // Iori Yagami / Shermie: Flequillo largo carmesí cayendo sobre el ojo derecho
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 2, 9, 4, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX + 1, headGridY + 1, 4, 6, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 1, 2, 5, cHair, null, cOutline, p);
        } else if (hairStyle === 'slick_blonde') {
            // Geese Howard / Krauser: Cabello rubio engominado hacia atrás
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 2, 9, 4, cHair, '#fef08a', cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 6, headGridY - 1, 3, 3, cHair, null, cOutline, p);
        } else if (hairStyle === 'short_bob') {
            // Vanessa / Angel / May Lee / Blue Mary / Chris: Corte bob moderno
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 2, 9, 4, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 2, 2, 4, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX + 2, headGridY + 2, 2, 3, cHair, null, cOutline, p);
        } else if (hairStyle === 'spiky_white') {
            // K' (K-Dash): Picos plateados de anime y gafas de sol oscuras
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 5, headGridY - 3, 10, 4, cHair, '#e2e8f0', cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 5, 2, 2, cHair, null, null, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX, headGridY - 5, 3, 2, cHair, null, null, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX + 3, headGridY - 4, 2, 2, cHair, null, null, p);
        } else if (hairStyle === 'cyborg_pompadour') {
            // Maxima: Pompadour oscuro con placa metálica cibernética en la sien
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 3, 9, 5, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 2, 2, 3, '#94a3b8', '#ffffff', cOutline, p);
        } else if (hairStyle === 'mohawk_agent') {
            // Seth: Cresta mohawk rubia sobre cabeza afeitada
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY, 7, 2, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 1, headGridY - 5, 3, 7, cHair, '#fef08a', cOutline, p);
        } else if (hairStyle === 'boss_rugal') {
            // Omega Rugal: Cabello plateado peinado con patillas aristocráticas
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 2, 9, 4, cHair, '#f8fafc', cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 6, headGridY - 1, 3, 3, cHair, null, cOutline, p);
        } else if (hairStyle === 'tori_mask') {
            // Takuma: Máscara Tengu roja con gran pico y bigote blanco
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY + 1, 7, 6, '#dc2626', '#991b1b', cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX + 3, headGridY + 3, 4, 2, '#dc2626', '#ffffff', cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 2, headGridY + 6, 6, 2, '#ffffff', null, null, p);
        } else if (hairStyle === 'blue_spiky_cape') {
            // K9999: Picos anime azules desordenados
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 3, 9, 5, cHair, '#60a5fa', cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 2, headGridY - 5, 4, 2, cHair, null, null, p);
        } else if (hairStyle === 'sunglasses_bald') {
            // Mr. Big / Agentes: Calvo con gafas oscuras rectangulares
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY, 7, 2, cSkin, cSkinShade, cOutline, p);
        } else if (hairStyle === 'bald_headband') {
            // Goro Daimon: Calvo con cinta blanca de combate
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 3, headGridY, 7, 2, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 2, 9, 1, cSecondary, null, null, p);
        } else if (hairStyle === 'spiky_bandana') {
            // Joe Higashi / Ralf: Picos con cinta frontal y nudo
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 3, 9, 4, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 1, 9, 2, cSecondary, null, cOutline, p);
        } else {
            // Clásico dinámico (Kyo, Ryo, Andy, Robert, Kim, Yashiro, etc.) con flequillo marcial natural
            PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY - 2, 9, 4, cHair, null, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, chestGridX, headGridY + 2, 3, 2, cHair, null, null, p);
            if (hairStyle === 'spiky_headband') {
                PixelArtRenderer.drawPixelBox(ctx, chestGridX - 4, headGridY + 1, 8, 1, cSecondary, null, null, p);
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
                // Ceja determinada y ojo con pupila
                ctx.fillStyle = cHair;
                ctx.fillRect((chestGridX + 1) * p, (headGridY + 3) * p, 3 * p, p);
                ctx.fillStyle = isRugal ? '#ff0044' : '#ffffff';
                ctx.fillRect((chestGridX + 1) * p, (headGridY + 4) * p, 2 * p, p);
                ctx.fillStyle = (state === 'SUPER' || state === 'VICTORY' || isRugal) ? cEnergy : '#090a14';
                ctx.fillRect((chestGridX + 2) * p, (headGridY + 4) * p, p, p);
            }
            // Boca de grito marcial (Kiai) en ataques fuertes, especiales, desesperaciones o victoria
            if (atkPhase === 'ACTIVE' || state === 'SPECIAL' || state === 'SUPER' || state === 'VICTORY' || state === 'HIT') {
                ctx.fillStyle = '#7f1d1d';
                ctx.fillRect((chestGridX + 1) * p, (headGridY + 6) * p, 2 * p, p);
            }

            // Orbes / Cristales elementales orbitando (Athena, Kula, Benimaru, Shermie, Orochi Team)
            if (charId === 'athena' || charId === 'kula' || charId === 'benimaru' || charId === 'shermie' || charId === 'chris') {
                const orbX = Math.round(Math.cos(f * 0.16) * 34);
                const orbY = -142 + Math.round(Math.sin(f * 0.24) * 24);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(orbX / p), Math.round(orbY / p), 3, 3, cEnergy, '#ffffff', cOutline, p);
            }
        }

        // 8. BRAZO DELANTERO CON FASES FLUIDAS (STARTUP -> ACTIVE -> RECOVERY), VICTORIA, AGARRE Y ARMAS ICÓNICAS
        const frontShoulderX = torsoLeanX + 10;
        const frontShoulderY = shoulderY + 6;

        if (state === 'VICTORY') {
            // Pose triunfal KOF 2002: Brazo alzado al cielo con columna de energía elemental
            const vicHandX = frontShoulderX + 14;
            const vicHandY = frontShoulderY - 68 + Math.round(Math.sin(f * 0.2) * 6);
            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX, frontShoulderY, frontShoulderX + 18, frontShoulderY - 28, 14, sleeveCol, cPrimaryShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX + 18, frontShoulderY - 28, vicHandX, vicHandY, 13, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, Math.round(vicHandX / p) - 2, Math.round(vicHandY / p) - 3, 6, 6, cEnergy, '#ffffff', cOutline, p);
            if (!isSilhouette) {
                PixelArtRenderer.drawStrikeBurst(ctx, vicHandX, vicHandY - 8, cEnergy, '#ffffff', true, p);
            }
        } else if (state === 'BLOCK') {
            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX, frontShoulderY, frontShoulderX + 16, frontShoulderY + 22, 13, sleeveCol, cPrimaryShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX + 16, frontShoulderY + 22, frontShoulderX + 22, frontShoulderY - 14, 12, cSkin, cSkinShade, cOutline, p);
            PixelArtRenderer.drawPixelBox(ctx, Math.round((frontShoulderX + 25) / p), chestGridY - 2, 2, 15, '#00f5ff', '#ffffff', null, p);
        } else if (isPunching && extFactor !== 0) {
            const maxReachPx = pose === 'MAX2_CLIMAX' ? 108 : pose.includes('SUPER') ? 96 : (pose.includes('HEAVY') || pose === 'BLOWBACK' || pose === 'CMD_STRIKE' || pose === 'THROW_GRAB') ? 82 : 64;
            const reachNow = extFactor < 0
                ? -18 * Math.abs(extFactor) // En Startup arma el puño hacia atrás
                : Math.round(24 + (maxReachPx - 24) * extFactor);

            const targetHandX = frontShoulderX + reachNow;
            const verticalOffset = pose === 'UPPERCUT'
                ? -56 * Math.max(0, extFactor)
                : (pose === 'CMD_STRIKE' ? -14 : Math.round(flurryOsc * 18));
            const targetHandY = frontShoulderY - 2 + verticalOffset;
            const midElbowX = (frontShoulderX + targetHandX) * 0.5 - (extFactor < 0 ? 12 : 0);
            const midElbowY = (frontShoulderY + targetHandY) * 0.5 + (pose === 'UPPERCUT' ? 16 : 6);

            PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX, frontShoulderY, midElbowX, midElbowY, 14, sleeveCol, cPrimaryShade, cOutline, p);
            PixelArtRenderer.drawPixelLimb(ctx, midElbowX, midElbowY, targetHandX, targetHandY, 13, cSkin, cSkinShade, cOutline, p);

            const isHeavyPunch = pose.includes('HEAVY') || pose === 'CMD_STRIKE' || pose === 'BLOWBACK' || pose === 'THROW_GRAB' || pose === 'MAX2_CLIMAX' || pose.includes('SPECIAL') || pose.includes('SUPER') || pose === 'UPPERCUT';
            const isComboInfused = (fighter.chainStepCount || 0) >= 2 || fighter.isMaxMode || state === 'SPECIAL' || state === 'SUPER';
            const gloveCol = (isHeavyPunch || isComboInfused) ? cEnergy : cSecondary;
            PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) - 2, Math.round(targetHandY / p) - 3, isHeavyPunch ? 7 : 6, isHeavyPunch ? 7 : 6, gloveCol, '#ffffff', cOutline, p);

            // Armas y efectos propios del personaje en ataque (Garras Choi, Bola Chang, Abanico Mai, Látigo Whip, Brazo K9999)
            if (!isSilhouette && charId === 'k9999' && (isHeavyPunch || atkPhase === 'ACTIVE')) {
                // Brazo biomecánico gigante mutante de carne y cables de K9999
                PixelArtRenderer.drawPixelLimb(ctx, frontShoulderX, frontShoulderY, targetHandX, targetHandY, 22, '#ef4444', '#7f1d1d', cOutline, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p), Math.round(targetHandY / p) - 8, 14, 16, '#dc2626', '#991b1b', cOutline, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 6, Math.round(targetHandY / p) - 6, 8, 12, '#3b82f6', '#1d4ed8', null, p);
            } else if (!isSilhouette && (isShort || charId === 'choi')) {
                // Garras triples de acero de Choi Bounge
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 3, Math.round(targetHandY / p) - 4, 9, 2, '#f8fafc', '#94a3b8', null, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 4, Math.round(targetHandY / p), 11, 2, '#f8fafc', '#94a3b8', null, p);
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 3, Math.round(targetHandY / p) + 4, 9, 2, '#f8fafc', '#94a3b8', null, p);
            } else if (!isSilhouette && isGiant) {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 2, Math.round(targetHandY / p) - 6, 14, 14, '#475569', '#1e293b', cOutline, p);
            } else if (!isSilhouette && charId === 'mai') {
                // Abanico Kachosen desplegado de Mai Shiranui
                PixelArtRenderer.drawPixelBox(ctx, Math.round(targetHandX / p) + 3, Math.round(targetHandY / p) - 6, 7, 11, '#dc2626', '#ffffff', cOutline, p);
            } else if (!isSilhouette && charId === 'whip') {
                // Látigo extendido de Whip
                PixelArtRenderer.drawSlashArc(ctx, targetHandX, targetHandY, targetHandX + 44, targetHandY - 10, '#a855f7', '#1e1b4b', p, 18, 0.8);
            }

            // Estela de corte/flama y destello cinético en fase activa de TODOS los puños
            if (!isSilhouette && atkPhase === 'ACTIVE') {
                const slashCol = pose === 'MAX2_CLIMAX' ? '#ffea00' : ((isHeavyPunch || isComboInfused) ? cEnergy : '#7dd3fc');
                if (pose === 'UPPERCUT') {
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 14, targetHandY + 54, targetHandX + 18, targetHandY - 28, cEnergy, '#ffffff', p, 26, 1.35);
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 6, targetHandY + 34, targetHandX + 10, targetHandY - 14, cSecondary, '#ffffff', p, 16, 0.9);
                } else if (pose === 'MAX2_CLIMAX') {
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 28, targetHandY - 38, targetHandX + 28, targetHandY + 38, '#ffea00', '#ffffff', p, 32, 1.6);
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 18, targetHandY + 34, targetHandX + 24, targetHandY - 34, '#ff0055', '#ffffff', p, 26, 1.3);
                } else if (isHeavyPunch) {
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 20, targetHandY - 26, targetHandX + 20, targetHandY + 26, cEnergy, '#ffffff', p, 24, 1.3);
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 12, targetHandY - 16, targetHandX + 12, targetHandY + 16, cSecondary, '#ffffff', p, 14, 0.85);
                } else {
                    PixelArtRenderer.drawSlashArc(ctx, targetHandX - 14, targetHandY - 16, targetHandX + 14, targetHandY + 16, slashCol, '#ffffff', p, 16, 0.95);
                }
                PixelArtRenderer.drawStrikeBurst(ctx, targetHandX + 10, targetHandY, slashCol, '#ffffff', isHeavyPunch || isComboInfused, p);
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
            } else if (!isSilhouette && charId === 'mai') {
                PixelArtRenderer.drawPixelBox(ctx, Math.round(fistX / p) + 2, Math.round(fistY / p) - 4, 4, 6, '#dc2626', '#ffffff', cOutline, p);
            } else if (!isSilhouette && (charId === 'kyo' || charId === 'iori' || charId === 'kdash') && (f % 8 < 5)) {
                // Flama viva en el puño en guardia para Kyo, Iori y K'
                PixelArtRenderer.drawPixelBox(ctx, Math.round(fistX / p) - 1, Math.round(fistY / p) - 5, 3, 3, cEnergy, '#ffffff', null, p);
            }
        }

        // 9. EFECTOS VISUALES ESPECTACULARES DE MOVIMIENTOS INSIGNIA (214+P)
        if (!isSilhouette && state === 'SPECIAL' && fighter.currentMoveKey === 'special_SIG') {
            const arch = move?.archetype || 'PILLAR';
            if (arch === 'PILLAR' && atkPhase === 'ACTIVE') {
                // Pilar Colosal de Energía Elemental surgiendo desde el suelo (Kyo, Iori, Benimaru, Rugal, etc.)
                const pillarW = 84;
                const pillarH = 340;
                const pillarX = -Math.floor(pillarW * 0.5) + 24;
                ctx.fillStyle = cEnergy;
                ctx.fillRect(pillarX, -pillarH, pillarW, pillarH);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(pillarX + 18, -pillarH, pillarW - 36, pillarH);
                for (let spark = 0; spark < 6; spark++) {
                    const sy = -30 - spark * 45;
                    const sx = pillarX + (spark % 2 === 0 ? -12 : pillarW + 4);
                    PixelArtRenderer.drawPixelBox(ctx, Math.round(sx / p), Math.round(sy / p), 3, 3, cSecondary, '#ffffff', null, p);
                }
            } else if (arch === 'COUNTER' && fighter.isCounterStance) {
                // Barrera de energía hexagonal de parada / contragolpe
                const shieldX = 32;
                const shieldY = -140;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillRect(shieldX, shieldY - 28, 8, 56);
                ctx.fillRect(shieldX + 8, shieldY - 42, 6, 84);
                ctx.fillStyle = cEnergy;
                ctx.fillRect(shieldX + 14, shieldY - 32, 4, 64);
            } else if (arch === 'CHARGE') {
                // Aura sónica de choque blindada alrededor del torso
                ctx.fillStyle = 'rgba(255, 190, 11, 0.75)';
                ctx.fillRect(16, -165, 34, 75);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(38, -150, 18, 48);
            } else if (arch === 'SLIDE') {
                // Polvo denso y chispas a ras de suelo
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(12, -8, 54, 6);
                ctx.fillStyle = cEnergy;
                ctx.fillRect(-22, -6, 32, 4);
            } else if (arch === 'DIVE') {
                // Estela de cometa descendente a 45 grados
                PixelArtRenderer.drawSlashArc(ctx, -24, -140, 48, -40, cEnergy, '#ffffff', p, 28, 1.4);
            }
        }

        ctx.restore();
    }
}

window.PixelArtRenderer = new PixelArtRenderer();
window.PixelArtRendererClass = PixelArtRenderer;
