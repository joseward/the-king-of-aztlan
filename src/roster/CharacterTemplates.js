/**
 * @file CharacterTemplates.js
 * @description Base de datos completa de los 42 personajes y Equipos Oficiales (3 vs 3) de "THE KING OF AZTLAN"
 * inspirados en The King of Fighters 2002:
 * - 11 Equipos Oficiales (Japan, Fatal Fury, Art of Fighting, Ikari, Psycho Soldier, Women Fighters,
 *   Korea, '96 Boss, '97 Special/Orochi, 2000 Agents, 2001 NESTS)
 * - 8 Personajes Edit / Sueltos (Iori, Kula, K9999, Angel, Shingo, Blue Mary, Lin/Rin, Jhun Hoon)
 * - Jefe Final del Nivel 12: OMEGA RUGAL
 * Cada personaje posee diseño visual único (complexión, peinado, vestimenta, accesorios y colores de energía).
 */

function buildCharacterMoveset(customConfig = {}) {
    const pColor = customConfig.energyColor || '#00f0ff';
    const sColor = customConfig.secondaryColor || '#ffae00';

    return {
        close_LP: {
            name: 'Cerca Puño Débil (A)',
            category: 'NORMAL',
            isLight: true,
            startup: 3,
            active: 4,
            recovery: 6,
            damage: 34,
            hitstun: 17,
            blockstun: 11,
            pushback: 1.8,
            velocityX: 2.2,
            meterGain: 45,
            hitType: 'HIGH',
            pose: 'PUNCH_CLOSE_LIGHT',
            chainableIntoLight: true,
            chainableIntoHeavy: true,
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 16, offsetY: -174, width: 70, height: 32 }
        },
        close_LK: {
            name: 'Cerca Patada Baja (B)',
            category: 'NORMAL',
            isLight: true,
            startup: 3,
            active: 4,
            recovery: 6,
            damage: 38,
            hitstun: 17,
            blockstun: 11,
            pushback: 1.9,
            velocityX: 2.4,
            meterGain: 45,
            hitType: 'LOW',
            pose: 'KICK_LOW',
            chainableIntoLight: true,
            chainableIntoHeavy: true,
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 14, offsetY: -42, width: 76, height: 34 }
        },
        close_HP: {
            name: 'Cerca Puño Fuerte (C)',
            category: 'NORMAL',
            startup: 5,
            active: 6,
            recovery: 11,
            damage: 78,
            hitstun: 23,
            blockstun: 16,
            pushback: 2.8,
            velocityX: 3.6,
            meterGain: 80,
            hitType: 'HIGH',
            pose: 'PUNCH_HEAVY',
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 14, offsetY: -180, width: 82, height: 44 }
        },
        close_HK: {
            name: 'Cerca Patada Fuerte (D)',
            category: 'NORMAL',
            startup: 5,
            active: 6,
            recovery: 12,
            damage: 86,
            hitstun: 24,
            blockstun: 16,
            pushback: 3.0,
            velocityX: 3.8,
            meterGain: 85,
            hitType: 'HIGH',
            pose: 'KICK_HIGH',
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 16, offsetY: -174, width: 88, height: 48 }
        },

        far_LP: {
            name: 'Lejos Jab Rápido (A)',
            category: 'NORMAL',
            isLight: true,
            startup: 4,
            active: 4,
            recovery: 7,
            damage: 34,
            hitstun: 17,
            blockstun: 11,
            pushback: 2.2,
            velocityX: 2.6,
            meterGain: 40,
            hitType: 'HIGH',
            pose: 'PUNCH_FAR_LIGHT',
            chainableIntoLight: true,
            chainableIntoHeavy: true,
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 20, offsetY: -172, width: 82, height: 32 }
        },
        far_LK: {
            name: 'Lejos Patada Media (B)',
            category: 'NORMAL',
            isLight: true,
            startup: 4,
            active: 5,
            recovery: 7,
            damage: 42,
            hitstun: 18,
            blockstun: 12,
            pushback: 2.4,
            velocityX: 3.0,
            meterGain: 45,
            hitType: 'MID',
            pose: 'KICK_MID',
            chainableIntoLight: true,
            chainableIntoHeavy: true,
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 18, offsetY: -118, width: 90, height: 36 }
        },
        far_HP: {
            name: 'Lejos Recto Fuerte (C)',
            category: 'NORMAL',
            startup: 7,
            active: 6,
            recovery: 13,
            damage: 84,
            hitstun: 21,
            blockstun: 15,
            pushback: 4.5,
            meterGain: 80,
            hitType: 'MID',
            pose: 'PUNCH_HEAVY',
            velocityX: 4.4,
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 20, offsetY: -174, width: 92, height: 38 }
        },
        far_HK: {
            name: 'Lejos Patada Giratoria (D)',
            category: 'NORMAL',
            startup: 8,
            active: 6,
            recovery: 14,
            damage: 90,
            hitstun: 22,
            blockstun: 15,
            pushback: 5.0,
            meterGain: 85,
            hitType: 'HIGH',
            pose: 'KICK_HIGH',
            velocityX: 4.8,
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 20, offsetY: -170, width: 96, height: 42 }
        },

        crouch_LP: {
            name: 'Agachado Puño Débil (2A)',
            category: 'NORMAL',
            isLight: true,
            startup: 3,
            active: 4,
            recovery: 6,
            damage: 30,
            hitstun: 15,
            blockstun: 10,
            pushback: 2.0,
            meterGain: 38,
            hitType: 'MID',
            pose: 'CROUCH_PUNCH',
            chainableIntoLight: true,
            chainableIntoHeavy: true,
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 16, offsetY: -122, width: 70, height: 28 }
        },
        crouch_LK: {
            name: 'Agachado Patada Baja (2B)',
            category: 'NORMAL',
            isLight: true,
            startup: 3,
            active: 4,
            recovery: 6,
            damage: 32,
            hitstun: 15,
            blockstun: 10,
            pushback: 2.2,
            meterGain: 40,
            hitType: 'LOW',
            pose: 'CROUCH_KICK',
            chainableIntoLight: true,
            chainableIntoHeavy: true,
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 16, offsetY: -34, width: 78, height: 28 }
        },
        crouch_HP: {
            name: 'Agachado Gancho Antiaéreo (2C)',
            category: 'NORMAL',
            startup: 5,
            active: 6,
            recovery: 12,
            damage: 80,
            hitstun: 22,
            blockstun: 15,
            pushback: 3.5,
            velocityX: 2.2,
            meterGain: 78,
            hitType: 'MID',
            pose: 'UPPERCUT',
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 14, offsetY: -208, width: 68, height: 100 }
        },
        crouch_HK: {
            name: 'Barrida Baja (2D Sweep)',
            category: 'NORMAL',
            startup: 6,
            active: 5,
            recovery: 15,
            damage: 84,
            hitstun: 24,
            blockstun: 16,
            pushback: 5.5,
            velocityX: 3.5,
            meterGain: 80,
            hitType: 'LOW',
            causesKnockdown: true,
            pose: 'CROUCH_KICK',
            cancelableIntoCommand: true,
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 16, offsetY: -36, width: 96, height: 32 }
        },

        // MOVIMIENTOS DE COMANDO KOF 2002 (Puentes esenciales para Combos: Normal -> 6+A / 6+B -> Especial -> Super)
        cmd_6LP: {
            name: 'Golpe de Comando (6+A)',
            command: 'Adelante + LP',
            category: 'COMMAND_NORMAL',
            startup: 5,
            active: 8,
            recovery: 11,
            hits: 2,
            damage: 34,
            hitstun: 21,
            blockstun: 15,
            pushback: 2.8,
            velocityX: 5.8,
            meterGain: 55,
            hitType: 'MID',
            pose: 'CMD_STRIKE',
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            maxCancelable: true,
            hitbox: { offsetX: 18, offsetY: -176, width: 84, height: 48 }
        },
        cmd_6LK: {
            name: 'Patada de Comando (6+B)',
            command: 'Adelante + LK',
            category: 'COMMAND_NORMAL',
            startup: 6,
            active: 7,
            recovery: 11,
            damage: 62,
            hitstun: 21,
            blockstun: 15,
            pushback: 3.0,
            velocityX: 6.2,
            meterGain: 65,
            hitType: 'OVERHEAD',
            pose: 'CMD_KICK',
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            maxCancelable: true,
            hitbox: { offsetX: 20, offsetY: -162, width: 88, height: 54 }
        },

        jump_LP: {
            name: 'Aéreo Puño Débil',
            category: 'NORMAL',
            startup: 4,
            active: 9,
            recovery: 5,
            damage: 42,
            hitstun: 17,
            blockstun: 12,
            pushback: 3.0,
            meterGain: 45,
            hitType: 'OVERHEAD',
            pose: 'AIR_PUNCH',
            hitbox: { offsetX: 12, offsetY: -152, width: 66, height: 44 }
        },
        jump_LK: {
            name: 'Aéreo Rodillazo Cross-up',
            category: 'NORMAL',
            startup: 4,
            active: 10,
            recovery: 5,
            damage: 45,
            hitstun: 18,
            blockstun: 13,
            pushback: 3.0,
            meterGain: 45,
            hitType: 'OVERHEAD',
            pose: 'AIR_KICK',
            hitbox: { offsetX: -18, offsetY: -132, width: 82, height: 48 }
        },
        jump_HP: {
            name: 'Aéreo Puño Fuerte',
            category: 'NORMAL',
            startup: 5,
            active: 8,
            recovery: 6,
            damage: 80,
            hitstun: 21,
            blockstun: 15,
            pushback: 3.8,
            meterGain: 75,
            hitType: 'OVERHEAD',
            pose: 'AIR_PUNCH',
            hitbox: { offsetX: 14, offsetY: -152, width: 78, height: 52 }
        },
        jump_HK: {
            name: 'Aéreo Patada Descendente',
            category: 'NORMAL',
            startup: 5,
            active: 9,
            recovery: 6,
            damage: 86,
            hitstun: 22,
            blockstun: 16,
            pushback: 4.0,
            meterGain: 80,
            hitType: 'OVERHEAD',
            pose: 'AIR_KICK',
            hitbox: { offsetX: 14, offsetY: -140, width: 88, height: 54 }
        },

        blowback_CD: {
            name: 'Golpe de Empuje (CD)',
            category: 'NORMAL',
            startup: 9,
            active: 7,
            recovery: 15,
            damage: 105,
            hitstun: 26,
            blockstun: 18,
            pushback: 11.0,
            meterGain: 100,
            hitType: 'MID',
            causesKnockdown: true,
            juggleHit: true,
            velocityX: 6.4,
            pose: 'BLOWBACK',
            cancelableIntoSpecial: true,
            cancelableIntoSuper: true,
            hitbox: { offsetX: 18, offsetY: -172, width: 96, height: 54 }
        },

        throw_grab: {
            name: 'Proyección Imbloqueable (Agarre)',
            command: 'Cerca: Adelante/Atrás + HP o HK',
            category: 'THROW',
            unblockable: true,
            startup: 3,
            active: 6,
            recovery: 14,
            damage: 115,
            hitstun: 30,
            blockstun: 0,
            pushback: 8.5,
            meterGain: 90,
            hitType: 'UNBLOCKABLE',
            causesKnockdown: true,
            velocityX: 3.5,
            pose: 'THROW_GRAB',
            hitbox: { offsetX: 8, offsetY: -182, width: 78, height: 110 }
        },

        special_QCF_P: {
            name: customConfig.qcfName || 'Wave Attack (236+P)',
            command: '236 + LP/HP',
            category: 'SPECIAL',
            motion: 'QCF',
            buttonType: 'P',
            startup: 6,
            active: 7,
            recovery: 15,
            damage: 78,
            chipDamage: 15,
            hitstun: 22,
            blockstun: 15,
            pushback: 4.5,
            velocityX: 3.2,
            meterGain: 110,
            hitType: 'MID',
            juggleHit: true,
            pose: 'SPECIAL_PROJECTILE',
            spawnsProjectile: {
                speed: customConfig.projectileSpeed || 9.5,
                color: pColor,
                secondaryColor: sColor,
                width: 48,
                height: 40,
                damage: 78,
                chipDamage: 15
            },
            cancelableIntoSuper: true,
            maxCancelable: true,
            hitbox: { offsetX: 20, offsetY: -174, width: 78, height: 52 }
        },

        special_DP_P: {
            name: customConfig.dpName || 'Rising Anti-Air (623+P)',
            command: '623 + LP/HP',
            category: 'SPECIAL',
            motion: 'DP',
            buttonType: 'P',
            startup: 3,
            active: 14,
            recovery: 18,
            hits: 3,
            damage: 42,
            chipDamage: 8,
            hitstun: 24,
            blockstun: 16,
            pushback: 3.2,
            meterGain: 45,
            hitType: 'MID',
            causesKnockdown: true,
            juggleHit: true,
            invulnerableStartup: 8,
            velocityX: 5.2,
            velocityY: -11.2,
            pose: 'UPPERCUT',
            cancelableIntoSuper: true,
            maxCancelable: true,
            hitbox: { offsetX: 14, offsetY: -222, width: 76, height: 132 }
        },

        special_QCB_K: {
            name: customConfig.qcbName || 'Rush Assault (214+K)',
            command: '214 + LK/HK',
            category: 'SPECIAL',
            motion: 'QCB',
            buttonType: 'K',
            startup: 5,
            active: 15,
            recovery: 14,
            hits: 3,
            damage: 38,
            chipDamage: 7,
            hitstun: 22,
            blockstun: 15,
            pushback: 3.0,
            meterGain: 42,
            hitType: 'MID',
            causesKnockdown: true,
            juggleHit: true,
            velocityX: 9.2,
            pose: 'SPECIAL_RUSH',
            cancelableIntoSuper: true,
            maxCancelable: true,
            hitbox: { offsetX: 16, offsetY: -168, width: 92, height: 74 }
        },

        special_SIG: {
            name: customConfig.sigName || 'Ataque Insignia (214+P)',
            command: '214 + LP/HP (Abajo-Atrás + Puño)',
            category: 'SPECIAL',
            motion: 'QCB',
            buttonType: 'P',
            archetype: customConfig.sigArchetype || 'PILLAR',
            startup: customConfig.sigStartup !== undefined ? customConfig.sigStartup : 4,
            active: customConfig.sigActive !== undefined ? customConfig.sigActive : 12,
            recovery: customConfig.sigRecovery !== undefined ? customConfig.sigRecovery : 16,
            hits: customConfig.sigHits !== undefined ? customConfig.sigHits : 1,
            damage: customConfig.sigDamage !== undefined ? customConfig.sigDamage : 85,
            chipDamage: customConfig.sigChipDamage !== undefined ? customConfig.sigChipDamage : 16,
            hitstun: customConfig.sigHitstun !== undefined ? customConfig.sigHitstun : 26,
            blockstun: customConfig.sigBlockstun !== undefined ? customConfig.sigBlockstun : 16,
            pushback: customConfig.sigPushback !== undefined ? customConfig.sigPushback : 3.8,
            meterGain: 90,
            hitType: customConfig.sigHitType || (customConfig.sigArchetype === 'SLIDE' ? 'LOW' : 'MID'),
            causesKnockdown: customConfig.sigKnockdown !== undefined ? customConfig.sigKnockdown : true,
            juggleHit: true,
            unblockable: customConfig.sigArchetype === 'GRAB',
            invulnerableStartup: customConfig.sigArchetype === 'TELEPORT' ? 22 : (customConfig.sigArchetype === 'COUNTER' ? 20 : 0),
            hasArmor: customConfig.sigArchetype === 'CHARGE',
            velocityX: customConfig.sigVelocityX !== undefined ? customConfig.sigVelocityX : (
                customConfig.sigArchetype === 'CHARGE' ? 10.5 :
                customConfig.sigArchetype === 'SLIDE' ? 8.5 : 0
            ),
            velocityY: customConfig.sigVelocityY !== undefined ? customConfig.sigVelocityY : 0,
            pose: customConfig.sigPose || (
                customConfig.sigArchetype === 'GRAB' ? 'SIG_GRAB' :
                customConfig.sigArchetype === 'TELEPORT' ? 'SIG_TELEPORT' :
                customConfig.sigArchetype === 'CHARGE' ? 'SIG_CHARGE' :
                customConfig.sigArchetype === 'COUNTER' ? 'SIG_COUNTER' :
                customConfig.sigArchetype === 'SLIDE' ? 'SIG_SLIDE' :
                customConfig.sigArchetype === 'DIVE' ? 'SIG_DIVE' : 'SIG_PILLAR'
            ),
            cancelableIntoSuper: true,
            maxCancelable: true,
            hitbox: customConfig.sigHitbox || (
                customConfig.sigArchetype === 'PILLAR' ? { offsetX: -16, offsetY: -240, width: 120, height: 240 } :
                customConfig.sigArchetype === 'SLIDE' ? { offsetX: 18, offsetY: -52, width: 94, height: 48 } :
                customConfig.sigArchetype === 'GRAB' ? { offsetX: 10, offsetY: -160, width: 72, height: 110 } :
                { offsetX: 18, offsetY: -180, width: 88, height: 96 }
            )
        },

        super_DM: {
            name: customConfig.dmName || 'Desperation Move (236236+P)',
            command: '236236 + P o K (1 Stock)',
            category: 'SUPER',
            isMaxSuper: false,
            powerCost: 1000,
            startup: 4,
            active: 22,
            recovery: 20,
            hits: 5,
            damage: 54,
            chipDamage: 10,
            hitstun: 30,
            blockstun: 20,
            pushback: 3.5,
            meterGain: 0,
            hitType: 'MID',
            causesKnockdown: true,
            juggleHit: true,
            invulnerableStartup: 14,
            velocityX: 11.2,
            pose: 'SUPER_ATTACK',
            spawnsProjectile: {
                speed: 13.0,
                color: sColor,
                secondaryColor: pColor,
                width: 96,
                height: 88,
                damage: 140,
                chipDamage: 28,
                isSuper: true
            },
            hitbox: { offsetX: 18, offsetY: -192, width: 124, height: 124 }
        },

        super_SDM: {
            name: customConfig.sdmName || 'MAX Desperation Move',
            command: '236236 + LP+HP (Modo MAX o 2 Stocks)',
            category: 'SUPER',
            isMaxSuper: true,
            powerCost: 2000,
            startup: 3,
            active: 28,
            recovery: 22,
            hits: 8,
            damage: 52,
            chipDamage: 10,
            hitstun: 36,
            blockstun: 24,
            pushback: 3.2,
            meterGain: 0,
            hitType: 'MID',
            causesKnockdown: true,
            juggleHit: true,
            invulnerableStartup: 20,
            velocityX: 13.5,
            pose: 'MAX_SUPER_ATTACK',
            spawnsProjectile: {
                speed: 15.2,
                color: '#ffffff',
                secondaryColor: pColor,
                width: 138,
                height: 122,
                damage: 210,
                chipDamage: 45,
                isSuper: true
            },
            hitbox: { offsetX: 20, offsetY: -198, width: 148, height: 138 }
        },

        super_MAX2: {
            name: customConfig.hsdmName || `Clímax Oculto MAX2: ${customConfig.sdmName || 'Juicio de Aztlán'}`,
            command: 'Vida ≤ 35% + Modo MAX: 236+MAX o 236236+HP+HK',
            category: 'SUPER',
            isMaxSuper: true,
            isHiddenMax2: true,
            powerCost: 2000,
            startup: 2,
            active: 34,
            recovery: 22,
            hits: 12,
            damage: 48,
            chipDamage: 12,
            hitstun: 42,
            blockstun: 26,
            pushback: 2.8,
            meterGain: 0,
            hitType: 'MID',
            causesKnockdown: true,
            juggleHit: true,
            invulnerableStartup: 28,
            velocityX: 15.0,
            pose: 'MAX2_CLIMAX',
            spawnsProjectile: {
                speed: 17.5,
                color: '#ffea00',
                secondaryColor: '#ff0055',
                width: 168,
                height: 152,
                damage: 260,
                chipDamage: 55,
                isSuper: true
            },
            hitbox: { offsetX: 20, offsetY: -206, width: 168, height: 156 }
        }
    };
}

/**
 * Helper para crear un personaje con estadísticas y diseño visual único.
 */
function createFighterTemplate(cfg) {
    const baseSpeed = cfg.speed || 4.6;
    return {
        id: cfg.id,
        name: cfg.name,
        teamId: cfg.teamId,
        teamName: cfg.teamName,
        title: cfg.title,
        archetype: cfg.archetype || 'All-Rounder',
        isBoss: Boolean(cfg.isBoss),
        stats: {
            maxHp: cfg.hp || 1000,
            walkSpeedForward: baseSpeed,
            walkSpeedBackward: +(baseSpeed * 0.8).toFixed(2),
            runSpeed: +(baseSpeed * 1.9).toFixed(2),
            jumpVelocity: cfg.jumpVel || -14.8,
            shortHopVelocity: cfg.hopVel || -10.8,
            gravity: cfg.gravity || 0.73,
            attackPower: cfg.atk || 1.0,
            defense: cfg.def || 1.0,
            powerGainRate: cfg.meter || 1.05
        },
        visuals: {
            bodyType: cfg.bodyType || 'athletic',         // 'athletic' | 'slender_tall' | 'female' | 'muscular_heavy' | 'giant_round' | 'short_claw' | 'youth' | 'elder_master' | 'boss_rugal'
            hairStyle: cfg.hairStyle || 'spiky_headband', // 'spiky_headband' | 'tall_pillar' | 'bald_headband' | 'cap_ponytail' | 'long_flowing' | 'spiky_bandana' | 'ponytail_sleek' | 'bangs_over_eye' | 'sunglasses_bald' | 'slick_blonde' | 'eyepatch_lucha' | 'mohawk_agent' | 'short_bob' | 'spiky_white' | 'cyborg_pompadour' | 'blue_spiky_cape' | 'bald_beard' | 'fedora_claws' | 'boss_rugal'
            hairColor: cfg.hairColor || '#261812',
            outfitStyle: cfg.outfitStyle || 'jacket_pants', // 'jacket_pants' | 'sleeveless_crop' | 'bare_chest_pants' | 'karate_gi' | 'military_camo' | 'kunoichi_red' | 'skirt_jacket' | 'suspenders_boxer' | 'armor_boss'
            primaryColor: cfg.primaryColor || '#1e293b',
            secondaryColor: cfg.secondaryColor || '#f8fafc',
            pantsColor: cfg.pantsColor || '#1e243b',
            skinColor: cfg.skinColor || '#e2a778',
            energyColor: cfg.energyColor || '#ff6b00',
            accessory: cfg.accessory || 'none',
            headgear: cfg.isBoss ? 'boss_rugal' : (cfg.hairStyle || 'standard')
        },
        moveset: buildCharacterMoveset({
            energyColor: cfg.energyColor || '#ff6b00',
            secondaryColor: cfg.secondaryColor || '#ffea00',
            projectileSpeed: cfg.projSpeed || 9.0,
            qcfName: cfg.qcfName || 'Special Wave (236+P)',
            dpName: cfg.dpName || 'Rising Dragon (623+P)',
            qcbName: cfg.qcbName || 'Rush Combination (214+K)',
            dmName: cfg.dmName || 'Desperation Overdrive (236236+P)',
            sdmName: cfg.sdmName || 'MAX Climax Finish (236236+PP)',
            sigName: cfg.sigName || 'Ataque Insignia (214+P)',
            sigArchetype: cfg.sigArchetype || 'PILLAR',
            sigStartup: cfg.sigStartup,
            sigActive: cfg.sigActive,
            sigRecovery: cfg.sigRecovery,
            sigHits: cfg.sigHits,
            sigDamage: cfg.sigDamage,
            sigChipDamage: cfg.sigChipDamage,
            sigHitstun: cfg.sigHitstun,
            sigBlockstun: cfg.sigBlockstun,
            sigPushback: cfg.sigPushback,
            sigHitType: cfg.sigHitType,
            sigKnockdown: cfg.sigKnockdown,
            sigVelocityX: cfg.sigVelocityX,
            sigVelocityY: cfg.sigVelocityY,
            sigPose: cfg.sigPose,
            sigHitbox: cfg.sigHitbox
        })
    };
}

/**
 * CATÁLOGO OFICIAL DE 41 PERSONAJES SELECCIONABLES (11 EQUIPOS 3v3 + 8 EDIT)
 */
const CHARACTER_ROSTER = [
    // =========================================================================
    // 1. TEAM JAPAN (Kyo Kusanagi, Benimaru Nikaido, Goro Daimon)
    // =========================================================================
    createFighterTemplate({
        id: 'kyo', name: 'KYO KUSANAGI', teamId: 'japan', teamName: 'TEAM JAPAN', title: 'Heredero de la Llama',
        hp: 1000, speed: 4.7, atk: 1.04,
        bodyType: 'athletic', hairStyle: 'spiky_headband', hairColor: '#3b2219', outfitStyle: 'jacket_pants',
        primaryColor: '#1a1f36', secondaryColor: '#ffffff', pantsColor: '#161b2e', skinColor: '#e2a778', energyColor: '#ff5500',
        qcfName: '108 Shiki: Yami Barai', dpName: '100 Shiki: Oniyaki', qcbName: 'Aragami / Dokugami Rekka', dmName: 'Ura 108 Shiki: Orochinagi',
        sigArchetype: 'PILLAR', sigName: '115 Shiki: Pilar Carmesí (214+P)'
    }),
    createFighterTemplate({
        id: 'benimaru', name: 'BENIMARU', teamId: 'japan', teamName: 'TEAM JAPAN', title: 'Shooting Star Relámpago',
        hp: 960, speed: 5.2, atk: 0.98,
        bodyType: 'slender_tall', hairStyle: 'tall_pillar', hairColor: '#ffea00', outfitStyle: 'sleeveless_crop',
        primaryColor: '#111118', secondaryColor: '#a855f7', pantsColor: '#3b82f6', skinColor: '#ecc096', energyColor: '#00f5ff',
        qcfName: 'Raijinken Eléctrico', dpName: 'Super Inazuma Kick', qcbName: 'Shinku Katategoma', dmName: 'Raikouken Tormenta',
        sigArchetype: 'PILLAR', sigName: 'Descarga Electrostática Raijin (214+P)'
    }),
    createFighterTemplate({
        id: 'daimon', name: 'GORO DAIMON', teamId: 'japan', teamName: 'TEAM JAPAN', title: 'Maestro Judo Colosal',
        hp: 1140, speed: 3.7, atk: 1.16, def: 1.12,
        bodyType: 'muscular_heavy', hairStyle: 'bald_headband', hairColor: '#1a1a1a', outfitStyle: 'bare_chest_pants',
        primaryColor: '#f8fafc', secondaryColor: '#dc2626', pantsColor: '#f1f5f9', skinColor: '#d49464', energyColor: '#eab308',
        qcfName: 'Jiraishin Terremoto', dpName: 'Zujou Barai Antiaéreo', qcbName: 'Chou Oosoto Gari', dmName: 'Jigoku Gokuraku Otoshi',
        sigArchetype: 'GRAB', sigName: 'Tenchi Gaeshi Colosal (214+P)'
    }),

    // =========================================================================
    // 2. TEAM FATAL FURY (Terry Bogard, Andy Bogard, Joe Higashi)
    // =========================================================================
    createFighterTemplate({
        id: 'terry', name: 'TERRY BOGARD', teamId: 'fatalfury', teamName: 'TEAM FATAL FURY', title: 'Lobo Solitario Legendario',
        hp: 1020, speed: 4.6, atk: 1.06,
        bodyType: 'athletic', hairStyle: 'cap_ponytail', hairColor: '#facc15', outfitStyle: 'jacket_pants',
        primaryColor: '#dc2626', secondaryColor: '#ffffff', pantsColor: '#2563eb', skinColor: '#e2a778', energyColor: '#ff9500',
        qcfName: 'Power Wave', dpName: 'Rising Tackle', qcbName: 'Burn Knuckle / Crack Shoot', dmName: 'Power Geyser / Buster Wolf',
        sigArchetype: 'CHARGE', sigName: 'Power Charge Acorazado (214+P)'
    }),
    createFighterTemplate({
        id: 'andy', name: 'ANDY BOGARD', teamId: 'fatalfury', teamName: 'TEAM FATAL FURY', title: 'Maestro Shiranui',
        hp: 980, speed: 5.0, atk: 1.0,
        bodyType: 'athletic', hairStyle: 'long_flowing', hairColor: '#fde047', outfitStyle: 'karate_gi',
        primaryColor: '#f8fafc', secondaryColor: '#dc2626', pantsColor: '#f8fafc', skinColor: '#e5b085', energyColor: '#38bdf8',
        qcfName: 'Hishouken', dpName: 'Shoryudan', qcbName: 'Zaneiken Supersónico', dmName: 'Chou Reppa Dan',
        sigArchetype: 'DIVE', sigName: 'Picada Aérea Shiranui (214+P)'
    }),
    createFighterTemplate({
        id: 'joe', name: 'JOE HIGASHI', teamId: 'fatalfury', teamName: 'TEAM FATAL FURY', title: 'Campeón Muay Thai',
        hp: 1000, speed: 4.9, atk: 1.02,
        bodyType: 'athletic', hairStyle: 'spiky_bandana', hairColor: '#1e1b18', outfitStyle: 'bare_chest_pants',
        primaryColor: '#f97316', secondaryColor: '#dc2626', pantsColor: '#f97316', skinColor: '#d08b5b', energyColor: '#22d3ee',
        qcfName: 'Hurricane Upper', dpName: 'Tiger Kick', qcbName: 'Slash Kick', dmName: 'Screw Upper Ciclón',
        sigArchetype: 'SLIDE', sigName: 'Barrida Ouka Kyaku (214+P)'
    }),

    // =========================================================================
    // 3. TEAM ART OF FIGHTING (Ryo Sakazaki, Robert Garcia, Takuma Sakazaki)
    // =========================================================================
    createFighterTemplate({
        id: 'ryo', name: 'RYO SAKAZAKI', teamId: 'aof', teamName: 'TEAM ART OF FIGHTING', title: 'El Dragón Invencible',
        hp: 1030, speed: 4.5, atk: 1.08,
        bodyType: 'athletic', hairStyle: 'spiky_headband', hairColor: '#facc15', outfitStyle: 'karate_gi',
        primaryColor: '#f97316', secondaryColor: '#111827', pantsColor: '#f97316', skinColor: '#e2a778', energyColor: '#38bdf8',
        qcfName: 'Ko-Ou Ken', dpName: 'Kohou Uppercut', qcbName: 'Hien Shippu Kyaku', dmName: 'Haoh Shoukou Ken / Ryuko Ranbu',
        sigArchetype: 'CHARGE', sigName: 'Embestida Kohou Acorazada (214+P)'
    }),
    createFighterTemplate({
        id: 'robert', name: 'ROBERT GARCIA', teamId: 'aof', teamName: 'TEAM ART OF FIGHTING', title: 'El Tigre Más Fuerte',
        hp: 1000, speed: 4.8, atk: 1.04,
        bodyType: 'athletic', hairStyle: 'ponytail_sleek', hairColor: '#291d16', outfitStyle: 'jacket_pants',
        primaryColor: '#1d4ed8', secondaryColor: '#ffffff', pantsColor: '#f8fafc', skinColor: '#e2a778', energyColor: '#fbbf24',
        qcfName: 'Ryuugeki Ken', dpName: 'Ryuuga Antiaéreo', qcbName: 'Hien Ryuujin Kyaku', dmName: 'Haoh Shoukou Ken',
        sigArchetype: 'DIVE', sigName: 'Hien Ryuujin Picada (214+P)'
    }),
    createFighterTemplate({
        id: 'takuma', name: 'TAKUMA SAKAZAKI', teamId: 'aof', teamName: 'TEAM ART OF FIGHTING', title: 'Gran Maestro Kyokugen',
        hp: 1080, speed: 4.1, atk: 1.14, def: 1.06,
        bodyType: 'muscular_heavy', hairStyle: 'tori_mask', hairColor: '#94a3b8', outfitStyle: 'bare_chest_pants',
        primaryColor: '#f8fafc', secondaryColor: '#111827', pantsColor: '#f8fafc', skinColor: '#c9885b', energyColor: '#f59e0b',
        qcfName: 'Haoh Shikou Ken', dpName: 'Mouko Burai Gan', qcbName: 'Hien Shippu Kyaku', dmName: 'Shin Kishin Geki',
        sigArchetype: 'COUNTER', sigName: 'Parada Kishin no Kamae (214+P)'
    }),

    // =========================================================================
    // 4. TEAM IKARI WARRIORS (Leona Heidern, Ralf Jones, Clark Still)
    // =========================================================================
    createFighterTemplate({
        id: 'leona', name: 'LEONA HEIDERN', teamId: 'ikari', teamName: 'TEAM IKARI WARRIORS', title: 'Soldado Silenciosa',
        hp: 970, speed: 5.3, atk: 1.02,
        bodyType: 'female', hairStyle: 'long_flowing', hairColor: '#2563eb', outfitStyle: 'military_camo',
        primaryColor: '#1e3a2f', secondaryColor: '#f59e0b', pantsColor: '#2e4c3e', skinColor: '#ecc096', energyColor: '#38bdf8',
        qcfName: 'Baltic Launcher', dpName: 'Moon Slasher', qcbName: 'Grand Saber', dmName: 'V-Slasher / Rebel Spark',
        sigArchetype: 'SLIDE', sigName: 'Deslizamiento Cuchilla X (214+P)'
    }),
    createFighterTemplate({
        id: 'ralf', name: 'RALF JONES', teamId: 'ikari', teamName: 'TEAM IKARI WARRIORS', title: 'Coronel de Un Solo Golpe',
        hp: 1100, speed: 4.2, atk: 1.16, def: 1.08,
        bodyType: 'muscular_heavy', hairStyle: 'spiky_bandana', hairColor: '#271c15', outfitStyle: 'military_camo',
        primaryColor: '#365314', secondaryColor: '#dc2626', pantsColor: '#1e3a2f', skinColor: '#d99b66', energyColor: '#ef4444',
        qcfName: 'Vulcan Punch Explosivo', dpName: 'Ralf Kick', qcbName: 'Gatling Attack', dmName: 'Galactica Phantom!!',
        sigArchetype: 'CHARGE', sigName: 'Carga Blindada Ralf (214+P)'
    }),
    createFighterTemplate({
        id: 'clark', name: 'CLARK STILL', teamId: 'ikari', teamName: 'TEAM IKARI WARRIORS', title: 'Especialista en Agarres',
        hp: 1100, speed: 4.1, atk: 1.14, def: 1.08,
        bodyType: 'muscular_heavy', hairStyle: 'cap_ponytail', hairColor: '#facc15', outfitStyle: 'military_camo',
        primaryColor: '#1e3a8a', secondaryColor: '#94a3b8', pantsColor: '#1e293b', skinColor: '#d99b66', energyColor: '#60a5fa',
        qcfName: 'Napalm Stretch', dpName: 'Frankensteiner', qcbName: 'Super Argentine Backbreaker', dmName: 'Ultra Argentine Backbreaker',
        sigArchetype: 'GRAB', sigName: 'Frankensteiner Quebradora (214+P)'
    }),

    // =========================================================================
    // 5. TEAM PSYCHO SOLDIER (Athena Asamiya, Sie Kensou, Chin Gentsai)
    // =========================================================================
    createFighterTemplate({
        id: 'athena', name: 'ATHENA ASAMIYA', teamId: 'psycho', teamName: 'TEAM PSYCHO SOLDIER', title: 'Idol con Poder Psíquico',
        hp: 940, speed: 5.1, atk: 0.96,
        bodyType: 'female', hairStyle: 'long_flowing', hairColor: '#9333ea', outfitStyle: 'skirt_jacket',
        primaryColor: '#ec4899', secondaryColor: '#f8fafc', pantsColor: '#db2777', skinColor: '#f3c6a0', energyColor: '#e879f9',
        qcfName: 'Psycho Ball!', dpName: 'Psycho Sword!', qcbName: 'Phoenix Arrow / Reflector', dmName: 'Shining Crystal Bit!',
        sigArchetype: 'TELEPORT', sigName: 'Teletransportación Psíquica (214+P)'
    }),
    createFighterTemplate({
        id: 'kensou', name: 'SIE KENSOU', teamId: 'psycho', teamName: 'TEAM PSYCHO SOLDIER', title: 'Joven Dragón Psíquico',
        hp: 980, speed: 4.8, atk: 1.0,
        bodyType: 'youth', hairStyle: 'spiky_headband', hairColor: '#291d16', outfitStyle: 'jacket_pants',
        primaryColor: '#2563eb', secondaryColor: '#facc15', pantsColor: '#1d4ed8', skinColor: '#e5b085', energyColor: '#38bdf8',
        qcfName: 'Choukyuudan', dpName: 'Ryuu Gakusai', qcbName: 'Ryuurentai', dmName: 'Shinryuu Tenbu Kyaku',
        sigArchetype: 'TELEPORT', sigName: 'Desvanecimiento Dragón (214+P)'
    }),
    createFighterTemplate({
        id: 'chin', name: 'CHIN GENTSAI', teamId: 'psycho', teamName: 'TEAM PSYCHO SOLDIER', title: 'Maestro del Puño Borracho',
        hp: 980, speed: 4.3, atk: 1.04,
        bodyType: 'elder_master', hairStyle: 'tori_mask', hairColor: '#e2e8f0', outfitStyle: 'karate_gi',
        primaryColor: '#166534', secondaryColor: '#fef08a', pantsColor: '#14532d', skinColor: '#d49464', energyColor: '#f97316',
        qcfName: 'KiryuuRaisen (Fuego)', dpName: 'Kaiten Teki', qcbName: 'Suikan Kanou', dmName: 'Gou Ran Enpou',
        sigArchetype: 'COUNTER', sigName: 'Postura del Maestro Ebrio (214+P)'
    }),

    // =========================================================================
    // 6. TEAM WOMEN FIGHTERS (Mai Shiranui, Yuri Sakazaki, May Lee)
    // =========================================================================
    createFighterTemplate({
        id: 'mai', name: 'MAI SHIRANUI', teamId: 'women', teamName: 'TEAM WOMEN FIGHTERS', title: 'Kunoichi de la Llama',
        hp: 950, speed: 5.3, atk: 1.0,
        bodyType: 'female', hairStyle: 'long_flowing', hairColor: '#451a03', outfitStyle: 'kunoichi_red',
        primaryColor: '#dc2626', secondaryColor: '#ffffff', pantsColor: '#dc2626', skinColor: '#f3c6a0', energyColor: '#ff4500',
        qcfName: 'Kachousen (Abanico)', dpName: 'Ryuuenbu', qcbName: 'Hissatsu Shinobibachi', dmName: 'Chou Hissatsu Shinobibachi',
        sigArchetype: 'DIVE', sigName: 'Vuelo de Mariposa Kunoichi (214+P)'
    }),
    createFighterTemplate({
        id: 'yuri', name: 'YURI SAKAZAKI', teamId: 'women', teamName: 'TEAM WOMEN FIGHTERS', title: 'Chica Prodigio Kyokugen',
        hp: 940, speed: 5.1, atk: 0.98,
        bodyType: 'female', hairStyle: 'spiky_headband', hairColor: '#3b2219', outfitStyle: 'karate_gi',
        primaryColor: '#f8fafc', secondaryColor: '#ec4899', pantsColor: '#2563eb', skinColor: '#f3c6a0', energyColor: '#f472b6',
        qcfName: 'Ko-Ou Ken', dpName: 'Yuri Chou Upper', qcbName: 'Raiou Ken', dmName: 'Haoh Raiou Ken / Hien Houou Kyaku',
        sigArchetype: 'SLIDE', sigName: 'Barrida Baja Yuri Dash (214+P)'
    }),
    createFighterTemplate({
        id: 'maylee', name: 'MAY LEE', teamId: 'women', teamName: 'TEAM WOMEN FIGHTERS', title: 'Heroína del Taekwondo',
        hp: 960, speed: 5.4, atk: 0.98,
        bodyType: 'female', hairStyle: 'short_bob', hairColor: '#1e1b18', outfitStyle: 'skirt_jacket',
        primaryColor: '#7e22ce', secondaryColor: '#facc15', pantsColor: '#f8fafc', skinColor: '#f3c6a0', energyColor: '#38bdf8',
        qcfName: 'Hero Mode Slash', dpName: 'Tsubame Rokuren', qcbName: 'Lightning Needle', dmName: 'Disposition Frog!',
        sigArchetype: 'COUNTER', sigName: 'Contraataque de la Heroína (214+P)'
    }),

    // =========================================================================
    // 7. TEAM KOREA (Kim Kaphwan, Chang Koehan, Choi Bounge)
    // =========================================================================
    createFighterTemplate({
        id: 'kim', name: 'KIM KAPHWAN', teamId: 'korea', teamName: 'TEAM KOREA', title: 'Justicia del Taekwondo',
        hp: 1020, speed: 4.9, atk: 1.04,
        bodyType: 'athletic', hairStyle: 'ponytail_sleek', hairColor: '#18181b', outfitStyle: 'karate_gi',
        primaryColor: '#f8fafc', secondaryColor: '#2563eb', pantsColor: '#f8fafc', skinColor: '#e2a778', energyColor: '#60a5fa',
        qcfName: 'Hangetsuzan', dpName: 'Hishou Kyaku', qcbName: 'Hienzan Antiaéreo', dmName: 'Houou Kyaku!!',
        sigArchetype: 'DIVE', sigName: 'Hishou Kyaku Pisada Aérea (214+P)'
    }),
    createFighterTemplate({
        id: 'chang', name: 'CHANG KOEHAN', teamId: 'korea', teamName: 'TEAM KOREA', title: 'Demolición con Bola de Hierro',
        hp: 1180, speed: 3.4, atk: 1.20, def: 1.15,
        bodyType: 'giant_round', hairStyle: 'bald_beard', hairColor: '#18181b', outfitStyle: 'bare_chest_pants',
        primaryColor: '#f8fafc', secondaryColor: '#475569', pantsColor: '#f1f5f9', skinColor: '#d49464', energyColor: '#94a3b8',
        qcfName: 'Tekkyuu Dai Kaiten', dpName: 'Tekkyuu Funsaigeki', qcbName: 'Dai Hakai Nage', dmName: 'Tekkyuu Dai Bousou',
        sigArchetype: 'CHARGE', sigName: 'Carga de Bola de Hierro (214+P)'
    }),
    createFighterTemplate({
        id: 'choi', name: 'CHOI BOUNGE', teamId: 'korea', teamName: 'TEAM KOREA', title: 'Velocidad y Garras de Acero',
        hp: 910, speed: 5.8, atk: 0.94,
        bodyType: 'short_claw', hairStyle: 'fedora_claws', hairColor: '#78350f', outfitStyle: 'suspenders_boxer',
        primaryColor: '#dc2626', secondaryColor: '#e2e8f0', pantsColor: '#1e3a8a', skinColor: '#e5b085', energyColor: '#38bdf8',
        qcfName: 'Tatsumaki Shippuuzan', dpName: 'Hishou Kuuretsuzan', qcbName: 'Senpuu Hien Sashi', dmName: 'Shin! Chouzetsu Tatsumaki',
        sigArchetype: 'SLIDE', sigName: 'Taladro Rasante Choi (214+P)'
    }),

    // =========================================================================
    // 8. TEAM '96 BOSS (Geese Howard, Wolfgang Krauser, Mr. Big)
    // =========================================================================
    createFighterTemplate({
        id: 'geese', name: 'GEESE HOWARD', teamId: 'boss96', teamName: "TEAM '96 BOSS", title: 'Emperador de South Town',
        hp: 1100, speed: 4.5, atk: 1.15, def: 1.08,
        bodyType: 'muscular_heavy', hairStyle: 'slick_blonde', hairColor: '#facc15', outfitStyle: 'karate_gi',
        primaryColor: '#f8fafc', secondaryColor: '#dc2626', pantsColor: '#dc2626', skinColor: '#e2a778', energyColor: '#a855f7',
        qcfName: 'Double Reppuken!', dpName: 'Atemi Nage Counter', qcbName: 'Jaeiken Rush', dmName: 'Raging Storm / Deadly Rave!',
        sigArchetype: 'COUNTER', sigName: 'Atemi Nage Contragolpe (214+P)'
    }),
    createFighterTemplate({
        id: 'krauser', name: 'W. KRAUSER', teamId: 'boss96', teamName: "TEAM '96 BOSS", title: 'Emperador de la Oscuridad',
        hp: 1140, speed: 4.2, atk: 1.18, def: 1.10,
        bodyType: 'muscular_heavy', hairStyle: 'slick_blonde', hairColor: '#eab308', outfitStyle: 'armor_boss',
        primaryColor: '#b91c1c', secondaryColor: '#facc15', pantsColor: '#1e1b4b', skinColor: '#d99b66', energyColor: '#f59e0b',
        qcfName: 'Blitz Ball (High/Low)', dpName: 'Leg Tomahawk', qcbName: 'Kaiser Suplex', dmName: 'Kaiser Wave / Gigantic Cyclone',
        sigArchetype: 'CHARGE', sigName: 'Duelo Kaiser Acorazado (214+P)'
    }),
    createFighterTemplate({
        id: 'mrbig', name: 'MR. BIG', teamId: 'boss96', teamName: "TEAM '96 BOSS", title: 'Jefe Maestro de Bastones',
        hp: 1050, speed: 4.7, atk: 1.08,
        bodyType: 'athletic', hairStyle: 'sunglasses_bald', hairColor: '#18181b', outfitStyle: 'jacket_pants',
        primaryColor: '#7e22ce', secondaryColor: '#f8fafc', pantsColor: '#f8fafc', skinColor: '#c9885b', energyColor: '#38bdf8',
        qcfName: 'Ground Blaster', dpName: 'Cross Diving', qcbName: 'California Romance', dmName: 'Blaster Wave!',
        sigArchetype: 'PILLAR', sigName: 'Descarga Eléctrica Bastón (214+P)'
    }),

    // =========================================================================
    // 9. TEAM '97 SPECIAL / OROCHI (Yashiro Nanakase, Shermie, Chris)
    // =========================================================================
    createFighterTemplate({
        id: 'yashiro', name: 'YASHIRO', teamId: 'orochi97', teamName: "TEAM '97 SPECIAL", title: 'Tierra Seca de Orochi',
        hp: 1080, speed: 4.6, atk: 1.12, def: 1.06,
        bodyType: 'muscular_heavy', hairStyle: 'spiky_headband', hairColor: '#e2e8f0', outfitStyle: 'jacket_pants',
        primaryColor: '#991b1b', secondaryColor: '#ffffff', pantsColor: '#111827', skinColor: '#d49464', energyColor: '#f97316',
        qcfName: 'Upper Duel', dpName: 'Jet Counter', qcbName: 'Missile Might Bash', dmName: 'Final Impact / Million Bash',
        sigArchetype: 'CHARGE', sigName: 'Golpe Sísmico Acorazado (214+P)'
    }),
    createFighterTemplate({
        id: 'shermie', name: 'SHERMIE', teamId: 'orochi97', teamName: "TEAM '97 SPECIAL", title: 'Relámpago Rugiente de Orochi',
        hp: 980, speed: 4.8, atk: 1.06,
        bodyType: 'female', hairStyle: 'bangs_over_eye', hairColor: '#be123c', outfitStyle: 'skirt_jacket',
        primaryColor: '#f472b6', secondaryColor: '#9333ea', pantsColor: '#f472b6', skinColor: '#f3c6a0', energyColor: '#e879f9',
        qcfName: 'Shermie Spiral', dpName: 'Axle Spin Kick', qcbName: 'Shermie Whip', dmName: 'Shermie Flash / Carnival',
        sigArchetype: 'GRAB', sigName: 'Shermie Spiral Quebradora (214+P)'
    }),
    createFighterTemplate({
        id: 'chris', name: 'CHRIS', teamId: 'orochi97', teamName: "TEAM '97 SPECIAL", title: 'Llama del Destino de Orochi',
        hp: 940, speed: 5.5, atk: 1.0,
        bodyType: 'youth', hairStyle: 'short_bob', hairColor: '#78350f', outfitStyle: 'jacket_pants',
        primaryColor: '#1d4ed8', secondaryColor: '#f8fafc', pantsColor: '#f1f5f9', skinColor: '#f3c6a0', energyColor: '#a855f7',
        qcfName: 'Shooting Dancer Thrust', dpName: 'Glider Stomp', qcbName: 'Hunting Air', dmName: 'Chain Slide Touch / Twister',
        sigArchetype: 'TELEPORT', sigName: 'Desplazamiento Espectral (214+P)'
    }),

    // =========================================================================
    // 10. TEAM 2000 AGENTS (Vanessa, Ramon, Seth)
    // =========================================================================
    createFighterTemplate({
        id: 'vanessa', name: 'VANESSA', teamId: 'agents2000', teamName: 'TEAM 2000 AGENTS', title: 'Boxeadora Relámpago',
        hp: 960, speed: 5.6, atk: 1.02,
        bodyType: 'female', hairStyle: 'short_bob', hairColor: '#dc2626', outfitStyle: 'suspenders_boxer',
        primaryColor: '#f8fafc', secondaryColor: '#dc2626', pantsColor: '#1e293b', skinColor: '#f3c6a0', energyColor: '#fbbf24',
        qcfName: 'Machine Gun Puncher', dpName: 'Parry Puncher Upper', qcbName: 'Puncher Vision Sway', dmName: 'Champion Puncher / Crazy Puncher',
        sigArchetype: 'CHARGE', sigName: 'Esquiva y Gancho Blindado (214+P)'
    }),
    createFighterTemplate({
        id: 'ramon', name: 'RAMON', teamId: 'agents2000', teamName: 'TEAM 2000 AGENTS', title: 'El Diablo Amarillo (Lucha Libre)',
        hp: 980, speed: 5.4, atk: 1.0,
        bodyType: 'athletic', hairStyle: 'eyepatch_lucha', hairColor: '#facc15', outfitStyle: 'bare_chest_pants',
        primaryColor: '#15803d', secondaryColor: '#facc15', pantsColor: '#15803d', skinColor: '#d99b66', energyColor: '#4ade80',
        qcfName: 'Tiger Neck Chancery', dpName: 'Flying Body Attack', qcbName: 'Rolling Sobat', dmName: 'Tiger Spin / El Diablo Amarillo',
        sigArchetype: 'GRAB', sigName: 'Quebradora Tigre Lucha (214+P)'
    }),
    createFighterTemplate({
        id: 'seth', name: 'SETH', teamId: 'agents2000', teamName: 'TEAM 2000 AGENTS', title: 'Agente Táctico de Defensa',
        hp: 1060, speed: 4.4, atk: 1.08, def: 1.06,
        bodyType: 'muscular_heavy', hairStyle: 'mohawk_agent', hairColor: '#cbd5e1', outfitStyle: 'suspenders_boxer',
        primaryColor: '#334155', secondaryColor: '#f8fafc', pantsColor: '#0f172a', skinColor: '#8d5524', energyColor: '#38bdf8',
        qcfName: 'Sho-Getsu', dpName: 'Antiair Upper', qcbName: 'Kensetsu / Kakugetsu', dmName: 'Sou-Sho-Getsu / Iriomote',
        sigArchetype: 'COUNTER', sigName: 'Atemi de Redirección (214+P)'
    }),

    // =========================================================================
    // 11. TEAM 2001 NESTS (K', Maxima, Whip)
    // =========================================================================
    createFighterTemplate({
        id: 'kdash', name: "K'", teamId: 'nests2001', teamName: 'TEAM 2001 NESTS', title: 'Guantelete Carmesí Rebelde',
        hp: 1000, speed: 5.2, atk: 1.08,
        bodyType: 'athletic', hairStyle: 'spiky_white', hairColor: '#f8fafc', outfitStyle: 'jacket_pants',
        primaryColor: '#111827', secondaryColor: '#dc2626', pantsColor: '#111827', skinColor: '#c28254', energyColor: '#ff2a00',
        qcfName: 'Ein Trigger -> Second Shoot', dpName: 'Crow Bites', qcbName: 'Blackout Teleport / Minute Spike', dmName: 'Chain Drive / Heat Drive!',
        sigArchetype: 'PILLAR', sigName: 'Llamarada Volcánica Blackout (214+P)'
    }),
    createFighterTemplate({
        id: 'maxima', name: 'MAXIMA', teamId: 'nests2001', teamName: 'TEAM 2001 NESTS', title: 'Soldado Cyborg Tipo-M',
        hp: 1160, speed: 3.7, atk: 1.18, def: 1.14,
        bodyType: 'muscular_heavy', hairStyle: 'cyborg_pompadour', hairColor: '#291d16', outfitStyle: 'armor_boss',
        primaryColor: '#1d4ed8', secondaryColor: '#facc15', pantsColor: '#1e3a8a', skinColor: '#d99b66', energyColor: '#38bdf8',
        qcfName: 'M4 Vapor Cannon!', dpName: 'M11 Dangerous Arch', qcbName: 'M19 Blitz Cannon', dmName: 'Bunker Buster / Maxima Revenger!',
        sigArchetype: 'CHARGE', sigName: 'Maxima Bunker Blindado (214+P)'
    }),
    createFighterTemplate({
        id: 'whip', name: 'WHIP', teamId: 'nests2001', teamName: 'TEAM 2001 NESTS', title: 'Maestra del Látigo Voodoo',
        hp: 950, speed: 4.9, atk: 1.02,
        bodyType: 'female', hairStyle: 'long_flowing', hairColor: '#78350f', outfitStyle: 'military_camo',
        primaryColor: '#14532d', secondaryColor: '#f59e0b', pantsColor: '#166534', skinColor: '#f3c6a0', energyColor: '#f43f5e',
        qcfName: 'Boomerang Shot "SC"', dpName: 'Crescent Swatter', qcbName: 'Hook Shot / Desert Eagle', dmName: 'Sonic Slaughter "KW"!',
        sigArchetype: 'SLIDE', sigName: 'Barrida con Látigo Strings (214+P)'
    }),

    // =========================================================================
    // 12. PERSONAJES EDIT / SUELTOS (Iori, Kula, K9999, Angel, Shingo, Blue Mary, Lin/Rin, Jhun Hoon)
    // =========================================================================
    createFighterTemplate({
        id: 'iori', name: 'IORI YAGAMI', teamId: 'edit', teamName: 'EDIT CHARACTERS', title: 'Llama Púrpura del Eclipse',
        hp: 1000, speed: 5.0, atk: 1.10,
        bodyType: 'athletic', hairStyle: 'bangs_over_eye', hairColor: '#dc2626', outfitStyle: 'jacket_pants',
        primaryColor: '#111827', secondaryColor: '#f8fafc', pantsColor: '#dc2626', skinColor: '#e5b085', energyColor: '#a855f7',
        qcfName: '108 Shiki: Yami Barai', dpName: '100 Shiki: Oniyaki', qcbName: '127 Shiki: Aoi Hana (3 Hits)', dmName: 'Kin 1211 Shiki: Ya Otome!',
        sigArchetype: 'PILLAR', sigName: 'Pilar de Llamas Oscuras (214+P)'
    }),
    createFighterTemplate({
        id: 'kula', name: 'KULA DIAMOND', teamId: 'edit', teamName: 'EDIT CHARACTERS', title: 'Muñeca de Hielo Anti-K',
        hp: 950, speed: 5.3, atk: 1.02,
        bodyType: 'female', hairStyle: 'long_flowing', hairColor: '#38bdf8', outfitStyle: 'jacket_pants',
        primaryColor: '#991b1b', secondaryColor: '#7dd3fc', pantsColor: '#7f1d1d', skinColor: '#f8d8be', energyColor: '#00f5ff',
        qcfName: 'Diamond Breath', dpName: 'Crow Bites Ice', qcbName: 'Counter Shell / Ray Spin', dmName: 'Diamond Edge / Freeze Execution!',
        sigArchetype: 'COUNTER', sigName: 'Escudo de Cristal de Hielo (214+P)'
    }),
    createFighterTemplate({
        id: 'k9999', name: 'K9999', teamId: 'edit', teamName: 'EDIT CHARACTERS', title: 'Experimento Mutante #9999',
        hp: 980, speed: 5.0, atk: 1.10,
        bodyType: 'athletic', hairStyle: 'blue_spiky_cape', hairColor: '#2563eb', outfitStyle: 'jacket_pants',
        primaryColor: '#dc2626', secondaryColor: '#3b82f6', pantsColor: '#1e3a8a', skinColor: '#e2a778', energyColor: '#ff0055',
        qcfName: 'Get Out of Here! (Taladro)', dpName: 'Break Into Pieces!', qcbName: 'Split Second Slash', dmName: 'You Give Display! / Power Gushing!',
        sigArchetype: 'PILLAR', sigName: 'Erupción de Brazo Biomecánico (214+P)'
    }),
    createFighterTemplate({
        id: 'angel', name: 'ANGEL', teamId: 'edit', teamName: 'EDIT CHARACTERS', title: 'Cadena Unchain de NESTS',
        hp: 970, speed: 5.4, atk: 1.04,
        bodyType: 'female', hairStyle: 'short_bob', hairColor: '#f8fafc', outfitStyle: 'skirt_jacket',
        primaryColor: '#1e293b', secondaryColor: '#f8fafc', pantsColor: '#1e293b', skinColor: '#e2a778', energyColor: '#f43f5e',
        qcfName: 'Unchain Circle Starter', dpName: 'Red Sky of Japonesque', qcbName: 'Beyond the Flames', dmName: 'Loyalty Test for theists',
        sigArchetype: 'TELEPORT', sigName: 'Paso Furtivo Unchain (214+P)'
    }),
    createFighterTemplate({
        id: 'shingo', name: 'SHINGO YABUKI', teamId: 'edit', teamName: 'EDIT CHARACTERS', title: 'Discípulo Entusiasta de Kyo',
        hp: 1020, speed: 4.7, atk: 1.06,
        bodyType: 'athletic', hairStyle: 'spiky_headband', hairColor: '#291d16', outfitStyle: 'jacket_pants',
        primaryColor: '#1e3a8a', secondaryColor: '#f8fafc', pantsColor: '#1e3a8a', skinColor: '#e2a778', energyColor: '#fbbf24',
        qcfName: '114 Shiki: Aragami Mikansei', dpName: '100 Shiki: Oniyaki Mikansei', qcbName: 'Shingo Kick!!', dmName: 'Burning Shingo / Kakehou Rin!',
        sigArchetype: 'CHARGE', sigName: 'Embestida Imprudente Shingo (214+P)'
    }),
    createFighterTemplate({
        id: 'bluemary', name: 'BLUE MARY', teamId: 'edit', teamName: 'EDIT CHARACTERS', title: 'Agente Comando Sambo',
        hp: 970, speed: 5.2, atk: 1.02,
        bodyType: 'female', hairStyle: 'short_bob', hairColor: '#facc15', outfitStyle: 'skirt_jacket',
        primaryColor: '#dc2626', secondaryColor: '#2563eb', pantsColor: '#1d4ed8', skinColor: '#f3c6a0', energyColor: '#f43f5e',
        qcfName: 'Spin Fall', dpName: 'Vertical Arrow -> Snatch', qcbName: 'Straight Slicer', dmName: 'M. Typhoon / M. Dynamite Swing!',
        sigArchetype: 'COUNTER', sigName: 'Palanca Defensiva Mary (214+P)'
    }),
    createFighterTemplate({
        id: 'rin', name: 'LIN (RIN)', teamId: 'edit', teamName: 'EDIT CHARACTERS', title: 'Asesino del Clan Hizoku',
        hp: 980, speed: 5.5, atk: 1.04,
        bodyType: 'slender_tall', hairStyle: 'ponytail_sleek', hairColor: '#18181b', outfitStyle: 'karate_gi',
        primaryColor: '#1f2937', secondaryColor: '#f8fafc', pantsColor: '#111827', skinColor: '#d1d5db', energyColor: '#10b981',
        qcfName: 'Jatotsusen (Mano Venenosa)', dpName: 'Hiten Kyaku', qcbName: 'Mueiasshu Teleport', dmName: 'Senshukourai: Doku蛾 (Veneno)',
        sigArchetype: 'TELEPORT', sigName: 'Neblina Venenosa Hizoku (214+P)'
    }),
    createFighterTemplate({
        id: 'jhun', name: 'JHUN HOON', teamId: 'edit', teamName: 'EDIT CHARACTERS', title: 'Rival Estilizado del Taekwondo',
        hp: 1000, speed: 5.1, atk: 1.04,
        bodyType: 'athletic', hairStyle: 'long_flowing', hairColor: '#94a3b8', outfitStyle: 'karate_gi',
        primaryColor: '#3b82f6', secondaryColor: '#f8fafc', pantsColor: '#f8fafc', skinColor: '#e5b085', energyColor: '#38bdf8',
        qcfName: 'Manrikyou Stance Kick', dpName: 'Kuusajin Antiaéreo', qcbName: 'Kouryuukyaku', dmName: 'Houou Ressoukyaku / HikoGeki!',
        sigArchetype: 'DIVE', sigName: 'Hacha Voladora de la Garza (214+P)'
    }),

    // =========================================================================
    // 13. JEFE FINAL (BOSS): OMEGA RUGAL
    // =========================================================================
    createFighterTemplate({
        id: 'rugal', name: 'OMEGA RUGAL', teamId: 'boss', teamName: 'FINAL BOSS', title: 'Dios de la Destrucción (Jefe Final)',
        isBoss: true, hp: 1450, speed: 5.1, atk: 1.28, def: 1.18, meter: 1.45, projSpeed: 11.4,
        bodyType: 'boss_rugal', hairStyle: 'boss_rugal', hairColor: '#e2e8f0', outfitStyle: 'armor_boss',
        primaryColor: '#b8001f', secondaryColor: '#e2e8f0', pantsColor: '#140812', skinColor: '#c98a63', energyColor: '#ff0044',
        qcfName: 'Kaiser Reppuken (236+P)', dpName: 'Genocide Cutter! (623+P)', qcbName: 'God Press! (214+K)',
        dmName: 'Gigantic Pressure! (236236+P)', sdmName: 'Kaiser Phoenix Omega (MAX)',
        sigArchetype: 'PILLAR', sigName: 'Genocide Pillar Apocalíptico (214+P)'
    })
];

const BOSS_RUGAL_TEMPLATE = CHARACTER_ROSTER.find(c => c.id === 'rugal');

/**
 * Grupos de Equipos Oficiales para selección rápida o individual en la pantalla de Selección de Personajes.
 */
const OFFICIAL_TEAMS = [
    { id: 'japan', name: 'EQUIPO JAPÓN', memberIds: ['kyo', 'benimaru', 'daimon'] },
    { id: 'fatalfury', name: 'EQUIPO FATAL FURY', memberIds: ['terry', 'andy', 'joe'] },
    { id: 'aof', name: 'EQUIPO ART OF FIGHTING', memberIds: ['ryo', 'robert', 'takuma'] },
    { id: 'ikari', name: 'EQUIPO IKARI WARRIORS', memberIds: ['leona', 'ralf', 'clark'] },
    { id: 'psycho', name: 'EQUIPO PSYCHO SOLDIER', memberIds: ['athena', 'kensou', 'chin'] },
    { id: 'women', name: 'EQUIPO MUJERES LUCHADORAS', memberIds: ['mai', 'yuri', 'maylee'] },
    { id: 'korea', name: 'EQUIPO COREA', memberIds: ['kim', 'chang', 'choi'] },
    { id: 'boss96', name: "EQUIPO JEFES '96", memberIds: ['geese', 'krauser', 'mrbig'] },
    { id: 'orochi97', name: "EQUIPO ESPECIAL '97 (OROCHI)", memberIds: ['yashiro', 'shermie', 'chris'] },
    { id: 'agents2000', name: 'EQUIPO 2000 (AGENTES)', memberIds: ['vanessa', 'ramon', 'seth'] },
    { id: 'nests2001', name: 'EQUIPO 2001 (NESTS)', memberIds: ['kdash', 'maxima', 'whip'] }
];

/**
 * Escalera de 12 Niveles del Modo Arcade ("THE KING OF AZTLAN - TORNEO DE 12 NIVELES"):
 * Niveles 1 al 11 enfrentan a los 11 Equipos Oficiales de KOF 2002;
 * el Nivel 12 enfrenta al Jefe Final OMEGA RUGAL.
 */
const ARCADE_12_STAGES = [
    { stage: 1, name: 'NIVEL 1: VS EQUIPO JAPÓN (ESAKA)', skyTint: '#242854', aiLevel: 0.45, teamIds: ['kyo', 'benimaru', 'daimon'] },
    { stage: 2, name: 'NIVEL 2: VS EQUIPO FATAL FURY (SOUTH TOWN)', skyTint: '#1e325c', aiLevel: 0.50, teamIds: ['terry', 'andy', 'joe'] },
    { stage: 3, name: 'NIVEL 3: VS EQUIPO ART OF FIGHTING (DOJO)', skyTint: '#3a1f54', aiLevel: 0.55, teamIds: ['ryo', 'robert', 'takuma'] },
    { stage: 4, name: 'NIVEL 4: VS EQUIPO PSYCHO SOLDIER', skyTint: '#4a2434', aiLevel: 0.60, teamIds: ['athena', 'kensou', 'chin'] },
    { stage: 5, name: 'NIVEL 5: VS EQUIPO MUJERES LUCHADORAS', skyTint: '#251a4a', aiLevel: 0.65, teamIds: ['mai', 'yuri', 'maylee'] },
    { stage: 6, name: 'NIVEL 6: VS EQUIPO COREA', skyTint: '#1b3b3b', aiLevel: 0.70, teamIds: ['kim', 'chang', 'choi'] },
    { stage: 7, name: 'NIVEL 7: VS EQUIPO IKARI WARRIORS', skyTint: '#162848', aiLevel: 0.75, teamIds: ['leona', 'ralf', 'clark'] },
    { stage: 8, name: 'NIVEL 8: VS EQUIPO 2000 (AGENTES)', skyTint: '#3b1538', aiLevel: 0.80, teamIds: ['vanessa', 'ramon', 'seth'] },
    { stage: 9, name: "NIVEL 9: VS EQUIPO ESPECIAL '97 (OROCHI)", skyTint: '#482018', aiLevel: 0.85, teamIds: ['yashiro', 'shermie', 'chris'] },
    { stage: 10, name: "NIVEL 10: VS EQUIPO JEFES '96", skyTint: '#1f244d', aiLevel: 0.90, teamIds: ['geese', 'krauser', 'mrbig'] },
    { stage: 11, name: 'NIVEL 11: VS EQUIPO 2001 (NESTS)', skyTint: '#2d1238', aiLevel: 0.95, teamIds: ['kdash', 'maxima', 'whip'] },
    { stage: 12, name: 'NIVEL 12 (JEFE FINAL): OMEGA RUGAL', skyTint: '#3a0814', aiLevel: 1.00, isBossStage: true, teamIds: ['iori', 'k9999', 'rugal'] }
];

window.CHARACTER_ROSTER = CHARACTER_ROSTER;
window.OFFICIAL_TEAMS = OFFICIAL_TEAMS;
window.BOSS_RUGAL_TEMPLATE = BOSS_RUGAL_TEMPLATE;
window.ARCADE_12_STAGES = ARCADE_12_STAGES;
window.buildCharacterMoveset = buildCharacterMoveset;
