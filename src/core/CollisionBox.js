/**
 * @file CollisionBox.js
 * @description Sistema de cajas de colisión 2D (AABB) para juegos de pelea estilo KOF 2002.
 * Separa explícitamente:
 * - PUSHBOX (Amarillo/Blanco): Caja física de empuje entre personajes para evitar solapamiento.
 * - HURTBOX (Azul/Verde): Cajas vulnerables donde el personaje puede recibir daño (cabeza, torso, piernas).
 * - HITBOX (Rojo/Naranja): Cajas de ataque activas en frames específicos de una animación.
 */

const BoxType = {
    PUSHBOX: 'PUSHBOX',
    HURTBOX: 'HURTBOX',
    HITBOX: 'HITBOX'
};

class CollisionBox {
    /**
     * @param {number} offsetX - Desplazamiento X relativo al pivote de los pies del peleador (mirando a la derecha)
     * @param {number} offsetY - Desplazamiento Y relativo al suelo (valores negativos suben hacia la cabeza)
     * @param {number} width - Ancho de la caja en píxeles
     * @param {number} height - Alto de la caja en píxeles
     * @param {string} type - Tipo de caja (BoxType.PUSHBOX | BoxType.HURTBOX | BoxType.HITBOX)
     * @param {string} [tag='body'] - Etiqueta opcional ('head', 'body', 'legs', 'projectile')
     */
    constructor(offsetX, offsetY, width, height, type = BoxType.HURTBOX, tag = 'body') {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.width = width;
        this.height = height;
        this.type = type;
        this.tag = tag;
    }

    /**
     * Calcula el rectángulo en coordenadas del mundo (Canvas) según la posición y dirección del peleador.
     * @param {number} anchorX - Posición X del pivote central del personaje
     * @param {number} anchorY - Posición Y de los pies del personaje
     * @param {number} facing - Dirección a la que mira (1 = derecha, -1 = izquierda)
     * @returns {{x: number, y: number, width: number, height: number, type: string, tag: string}}
     */
    getWorldRect(anchorX, anchorY, facing = 1) {
        const worldX = facing === 1
            ? anchorX + this.offsetX
            : anchorX - this.offsetX - this.width;
        const worldY = anchorY + this.offsetY;

        return {
            x: worldX,
            y: worldY,
            width: this.width,
            height: this.height,
            type: this.type,
            tag: this.tag
        };
    }

    /**
     * Comprueba intersección AABB (Axis-Aligned Bounding Box) entre dos rectángulos de mundo.
     * @param {{x:number, y:number, width:number, height:number}} rectA
     * @param {{x:number, y:number, width:number, height:number}} rectB
     * @returns {boolean}
     */
    static intersects(rectA, rectB) {
        return (
            rectA.x < rectB.x + rectB.width &&
            rectA.x + rectA.width > rectB.x &&
            rectA.y < rectB.y + rectB.height &&
            rectA.y + rectA.height > rectB.y
        );
    }

    /**
     * Devuelve el punto central de intersección entre dos cajas (útil para generar chispas de impacto / hitsparks).
     * @param {{x:number, y:number, width:number, height:number}} rectA
     * @param {{x:number, y:number, width:number, height:number}} rectB
     * @returns {{x: number, y: number}}
     */
    static getIntersectionCenter(rectA, rectB) {
        const left = Math.max(rectA.x, rectB.x);
        const right = Math.min(rectA.x + rectA.width, rectB.x + rectB.width);
        const top = Math.max(rectA.y, rectB.y);
        const bottom = Math.min(rectA.y + rectA.height, rectB.y + rectB.height);

        return {
            x: left + (right - left) * 0.5,
            y: top + (bottom - top) * 0.5
        };
    }

    /**
     * Renderiza el wireframe y relleno semitransparente de la caja para depuración técnica.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} anchorX
     * @param {number} anchorY
     * @param {number} facing
     */
    drawDebug(ctx, anchorX, anchorY, facing = 1) {
        const rect = this.getWorldRect(anchorX, anchorY, facing);
        ctx.save();
        ctx.lineWidth = 1.8;

        if (this.type === BoxType.HITBOX) {
            ctx.fillStyle = 'rgba(255, 45, 45, 0.34)';
            ctx.strokeStyle = '#ff2d2d';
        } else if (this.type === BoxType.HURTBOX) {
            ctx.fillStyle = 'rgba(0, 210, 255, 0.22)';
            ctx.strokeStyle = '#00d2ff';
        } else {
            ctx.fillStyle = 'rgba(255, 230, 0, 0.16)';
            ctx.strokeStyle = '#ffe600';
        }

        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
    }
}

window.BoxType = BoxType;
window.CollisionBox = CollisionBox;
