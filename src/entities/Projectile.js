/**
 * @file Projectile.js
 * @description Entidad de proyectil de energía (Ondas QCF+P y Proyectiles de Desesperación)
 * con su propia Hitbox activa y detección de choque entre proyectiles.
 */

class Projectile {
    /**
     * @param {Object} opts
     * @param {number} opts.ownerIndex - Índice del jugador dueño (1 o 2)
     * @param {number} opts.x - Posición X inicial
     * @param {number} opts.y - Posición Y inicial
     * @param {number} opts.facing - Dirección (1 o -1)
     * @param {number} opts.speed - Velocidad horizontal por frame
     * @param {number} opts.width - Ancho del proyectil
     * @param {number} opts.height - Alto del proyectil
     * @param {number} opts.damage - Daño en impacto
     * @param {number} opts.chipDamage - Daño en bloqueo
     * @param {string} opts.color - Color principal
     * @param {string} opts.secondaryColor - Color secundario
     * @param {boolean} [opts.isSuper=false] - Si es un proyectil de Desesperación (atraviesa proyectiles normales)
     */
    constructor(opts) {
        this.ownerIndex = opts.ownerIndex;
        this.x = opts.x;
        this.y = opts.y;
        this.facing = opts.facing;
        this.speed = opts.speed || 8.5;
        this.width = opts.width || 44;
        this.height = opts.height || 36;
        this.damage = opts.damage || 75;
        this.chipDamage = opts.chipDamage || 14;
        this.color = opts.color || '#00ffc3';
        this.secondaryColor = opts.secondaryColor || '#ffffff';
        this.isSuper = Boolean(opts.isSuper);
        this.active = true;
        this.frame = 0;

        this.collisionBox = new window.CollisionBox(
            -this.width * 0.5,
            -this.height * 0.5,
            this.width,
            this.height,
            window.BoxType.HITBOX,
            'projectile'
        );
    }

    update(stageWidth) {
        this.x += this.speed * this.facing;
        this.frame++;

        if (this.x < -120 || this.x > stageWidth + 120) {
            this.active = false;
        }
    }

    getWorldHitbox() {
        return this.collisionBox.getWorldRect(this.x, this.y, 1);
    }

    draw(ctx, showHitboxes = false) {
        if (!this.active) return;

        window.PixelArtRendererClass.enforcePixelCrispness(ctx);
        const p = 4;
        const snapX = Math.round(this.x / p) * p;
        const snapY = Math.round(this.y / p) * p;

        ctx.save();
        ctx.translate(snapX, snapY);
        ctx.scale(this.facing, 1);

        const waveMatrix = this.isSuper
            ? [
                '....GGGGGGGG....',
                '..GGCCCCCCCCGG..',
                '.GCCWWWWWWWWCCG.',
                'GCCWWWWWWWWWWCCG',
                'CCWWWWWWWWWWWWCC',
                'GCCWWWWWWWWWWCCG',
                '.GCCWWWWWWWWCCG.',
                '..GGCCCCCCCCGG..',
                '....GGGGGGGG....'
            ]
            : [
                '..GGGGGG..',
                '.GCCCCCCGG',
                'GCCWWWWCCG',
                'CCWWWWWWCC',
                'GCCWWWWCCG',
                '.GCCCCCCGG',
                '..GGGGGG..'
            ];

        const cellSize = this.isSuper ? 6 : 4;
        window.PixelArtRendererClass.drawBitmapMatrix(
            ctx,
            waveMatrix,
            {
                G: this.secondaryColor,
                C: this.color,
                W: '#ffffff'
            },
            -waveMatrix[0].length * cellSize * 0.5,
            -waveMatrix.length * cellSize * 0.5,
            cellSize
        );

        ctx.restore();

        if (showHitboxes) {
            this.collisionBox.drawDebug(ctx, this.x, this.y, 1);
        }
    }
}

window.Projectile = Projectile;
