/**
 * @file NetworkManager.js
 * @description Gestor de Multijugador en Línea Peer-to-Peer (P2P) por Código de Sala para "THE KING OF AZTLAN".
 * - Soporta conexión a través de Internet en Vercel (HTTPS) mediante WebRTC DataChannels (PeerJS + Servidores STUN de Google).
 * - Incluye canal local instantáneo (BroadcastChannel) para pruebas rápidas entre 2 pestañas o ventanas en la misma PC.
 * - Sincroniza Selección de Equipos 3 vs 3 (P1 elige Equipo 1, P2 elige Equipo 2), cursores en tiempo real,
 *   inputs a 60 FPS y estado autoritativo de combate a 20 Hz (cada 3 frames) para cero desincronización.
 */

const EMPTY_HELD = {
    up: false,
    down: false,
    left: false,
    right: false,
    LP: false,
    LK: false,
    HP: false,
    HK: false,
    EVADE: false,
    MAX: false
};

const PEER_ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' }
    ]
};

class NetworkManager {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.isOnline = false;
        this.role = null; // 'HOST' (Jugador 1) | 'GUEST' (Jugador 2)
        this.roomCode = '';
        this.peer = null;
        this.conn = null;
        this.localChannel = null;
        this.statusCallback = null;
        this.pingMs = 0;
        this._lastPingSent = 0;

        // Búfer de retardo de entradas (Delay-Based Netcode) para eliminar tirones y desincronizaciones
        this.inputDelay = 2; // 2 frames de búfer estándar en juegos de lucha online
        this.localInputQueue = new Map();
        this.remoteInputQueue = new Map();
        this.lastKnownRemoteHeld = { ...EMPTY_HELD };
    }

    onStatusChange(cb) {
        this.statusCallback = cb;
    }

    _notifyStatus(state, message) {
        if (this.statusCallback) {
            this.statusCallback({
                state,
                message,
                roomCode: this.roomCode,
                role: this.role,
                pingMs: this.pingMs
            });
        }
    }

    /**
     * Genera un código corto de sala estilo Arcade (ej. AZT-4829).
     */
    _generateRoomCode() {
        const num = Math.floor(1000 + Math.random() * 9000);
        return `AZT-${num}`;
    }

    /**
     * Carga PeerJS dinámicamente si aún no está presente en el navegador para habilitar WebRTC P2P en Internet.
     */
    _ensurePeerJSLoaded() {
        return new Promise((resolve) => {
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                resolve(false);
                return;
            }
            if (window.Peer) {
                resolve(true);
                return;
            }
            const existing = document.querySelector('script[data-peerjs-loader="1"]');
            if (existing) {
                existing.addEventListener('load', () => resolve(Boolean(window.Peer)));
                existing.addEventListener('error', () => resolve(false));
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
            script.async = true;
            script.setAttribute('data-peerjs-loader', '1');
            script.onload = () => resolve(Boolean(window.Peer));
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    }

    /**
     * Crea una sala como Anfitrión (Jugador 1 - HOST).
     */
    async hostRoom() {
        this.disconnect();
        this.role = 'HOST';
        this.roomCode = this._generateRoomCode();
        this._notifyStatus('WAITING', `Registrando sala ${this.roomCode}...`);

        // 1. Canal local instantáneo (para pruebas entre 2 pestañas o ventanas en la misma PC)
        this._setupBroadcastChannel(this.roomCode);

        // 2. Canal WebRTC P2P en Internet (PeerJS con STUN de Google)
        const hasPeer = await this._ensurePeerJSLoaded();
        if (hasPeer && window.Peer) {
            try {
                const peerId = `king-of-aztlan-room-${this.roomCode.toLowerCase()}`;
                this.peer = new window.Peer(peerId, { config: PEER_ICE_CONFIG });
                this.peer.on('open', () => {
                    if (!this.isOnline) {
                        this._notifyStatus('WAITING', `Sala activa: ${this.roomCode} — Esperando al Jugador 2...`);
                    }
                });
                this.peer.on('connection', (conn) => {
                    this.conn = conn;
                    this._bindWebRTCConnection(conn);
                });
                this.peer.on('error', (err) => {
                    if (err && err.type === 'unavailable-id') {
                        // Regenerar código si hubo colisión
                        this.roomCode = this._generateRoomCode();
                    }
                    if (!this.isOnline) {
                        this._notifyStatus('WAITING', `Sala lista: ${this.roomCode} — Esperando al Jugador 2...`);
                    }
                });
            } catch (e) {
                this._notifyStatus('WAITING', `Sala local activa: ${this.roomCode} — Esperando al Jugador 2...`);
            }
        } else {
            this._notifyStatus('WAITING', `Sala local activa: ${this.roomCode} — Esperando al Jugador 2...`);
        }

        return this.roomCode;
    }

    /**
     * Se une a una sala existente como Invitado (Jugador 2 - GUEST).
     * @param {string} rawCode
     */
    async joinRoom(rawCode) {
        const cleanCode = String(rawCode || '').trim().toUpperCase();
        if (!cleanCode) {
            this._notifyStatus('ERROR', 'Ingresa un código de sala válido (ej. AZT-1234).');
            return;
        }

        this.disconnect();
        this.role = 'GUEST';
        this.roomCode = cleanCode.startsWith('AZT-') ? cleanCode : `AZT-${cleanCode}`;
        this._notifyStatus('CONNECTING', `Conectando a la sala ${this.roomCode}...`);

        // 1. Intentar conexión instantánea por BroadcastChannel (misma PC / pestañas)
        this._setupBroadcastChannel(this.roomCode);
        this._sendPacket({ type: 'HELLO_JOIN', roomCode: this.roomCode });

        // 2. Intentar conexión WebRTC P2P por Internet (PeerJS)
        const hasPeer = await this._ensurePeerJSLoaded();
        if (hasPeer && window.Peer) {
            try {
                this.peer = new window.Peer(undefined, { config: PEER_ICE_CONFIG });
                this.peer.on('open', () => {
                    if (this.isOnline) return; // Ya conectó vía BroadcastChannel
                    const hostPeerId = `king-of-aztlan-room-${this.roomCode.toLowerCase()}`;
                    const conn = this.peer.connect(hostPeerId, { reliable: true });
                    this.conn = conn;
                    this._bindWebRTCConnection(conn);
                });
                this.peer.on('error', () => {
                    if (!this.isOnline) {
                        this._notifyStatus('ERROR', `No se encontró la sala ${this.roomCode}. Verifica que el Jugador 1 la haya creado.`);
                    }
                });
            } catch (e) {
                // Ignorar si ya conectó por BroadcastChannel
            }
        }
    }

    _setupBroadcastChannel(code) {
        if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') {
            return;
        }
        try {
            this.localChannel = new window.BroadcastChannel(`aztlan_net_${code}`);
            this.localChannel.onmessage = (ev) => {
                this._handleIncomingPacket(ev.data);
            };
        } catch (e) {
            this.localChannel = null;
        }
    }

    _bindWebRTCConnection(conn) {
        conn.on('open', () => {
            this._onConnectionEstablished();
            if (this.role === 'GUEST') {
                this._sendPacket({ type: 'HELLO_JOIN', roomCode: this.roomCode });
            } else if (this.role === 'HOST') {
                this._sendPacket({ type: 'HELLO_ACK', roomCode: this.roomCode });
            }
        });
        conn.on('data', (data) => {
            this._handleIncomingPacket(data);
        });
        conn.on('close', () => {
            this.disconnect();
            this._notifyStatus('DISCONNECTED', 'El rival se ha desconectado de la sala.');
        });
    }

    _onConnectionEstablished() {
        if (this.isOnline) return;
        this.isOnline = true;
        const playerLabel = this.role === 'HOST' ? 'JUGADOR 1 (Anfitrión)' : 'JUGADOR 2 (Invitado)';
        this._notifyStatus('CONNECTED', `¡Conectado en línea como ${playerLabel}! Sala: ${this.roomCode}`);

        // Configurar el motor en modo Versus 2 Jugadores Online y abrir Selección de Equipos sincronizada
        if (this.engine) {
            const p1Raw = this.engine.inputHandler.getPlayer(1);
            const p2Raw = this.engine.inputHandler.getPlayer(2);
            // Aislar entradas locales y remotas desde el primer frame
            p1Raw.remoteHeld = { ...EMPTY_HELD };
            p2Raw.remoteHeld = { ...EMPTY_HELD };

            this.engine.gameMode = 'VERSUS_2P';
            this.engine.aiController.enabled = false;
            this.engine.openTeamSelect();
        }
    }

    _sendPacket(packet) {
        if (this.conn && this.conn.open) {
            try {
                this.conn.send(packet);
            } catch (e) {}
        }
        if (this.localChannel) {
            try {
                this.localChannel.postMessage(packet);
            } catch (e) {}
        }
    }

    /**
     * Envía actualización inmediata de Selección de Equipos (P1 o P2) al otro jugador.
     */
    sendTeamUpdate() {
        if (!this.isOnline || !this.engine) return;
        if (this.role === 'HOST') {
            this._sendPacket({
                type: 'TEAM_SELECT_SYNC',
                role: 'HOST',
                teamIds: this.engine.team1.map(c => c.id),
                cursor: this.engine.selectCursor
            });
        } else if (this.role === 'GUEST') {
            this._sendPacket({
                type: 'TEAM_SELECT_SYNC',
                role: 'GUEST',
                teamIds: this.engine.team2.map(c => c.id),
                cursor: this.engine.selectCursorP2
            });
        }
    }

    /**
     * Envía limpieza de equipos en la sala online.
     */
    sendClearTeam() {
        if (!this.isOnline || !this.engine) return;
        this.sendTeamUpdate();
    }

    /**
     * Inicia la pelea 3v3 sincronizada en ambos navegadores con exactamente los mismos equipos.
     */
    sendMatchStart() {
        if (!this.isOnline || !this.engine) return;
        if (this.role === 'GUEST') {
            // Si el Invitado presiona Iniciar o completa el segundo equipo, solicita al Host arrancar la partida
            this._sendPacket({
                type: 'REQUEST_MATCH_START',
                team2Ids: this.engine.team2.map(c => c.id)
            });
            return;
        }

        // El HOST asegura que ambos equipos tengan 3 integrantes y difunde el arranque oficial
        while (this.engine.team1.length < 3) {
            const candidate = this.engine.roster.find(r => !this.engine.team1.includes(r)) || this.engine.roster[0];
            this.engine.team1.push(candidate);
        }
        while (this.engine.team2.length < 3) {
            const reversed = [...this.engine.roster].reverse();
            const candidate = reversed.find(r => !this.engine.team2.includes(r)) || this.engine.roster[1];
            this.engine.team2.push(candidate);
        }

        const payload = {
            type: 'MATCH_START_ONLINE',
            team1Ids: this.engine.team1.map(c => c.id),
            team2Ids: this.engine.team2.map(c => c.id),
            stageNumber: this.engine.currentStageNumber
        };
        this._sendPacket(payload);
        this.engine._startOnlineMatchFromNetwork(payload.team1Ids, payload.team2Ids, payload.stageNumber);
    }

    /**
     * Llamado en cada frame por GameLoop para intercambiar inputs con delay netcode (60 FPS) y estado autoritativo a 30 Hz.
     */
    syncFrame() {
        if (!this.isOnline || !this.engine) return;

        const currentFrame = this.engine.globalFrame || 0;
        const targetFrame = currentFrame + this.inputDelay;
        const localPlayerIndex = this.role === 'HOST' ? 1 : 2;
        const remotePlayerIndex = this.role === 'HOST' ? 2 : 1;
        const p1Raw = this.engine.inputHandler.getPlayer(1);
        const p2Raw = this.engine.inputHandler.getPlayer(2);

        // Tanto el Anfitrión (P1) como el Invitado (P2) pueden usar cómodamente WASD+U/I/O/P, Flechas+Numpad o su Mando #1 en su propia PC
        const heldSnapshot = {};
        const keys = ['up', 'down', 'left', 'right', 'LP', 'LK', 'HP', 'HK', 'EVADE', 'MAX'];
        for (const k of keys) {
            heldSnapshot[k] = Boolean(
                p1Raw.keyboardHeld[k] ||
                p1Raw.gamepadHeld[k] ||
                p2Raw.keyboardHeld[k] ||
                p2Raw.gamepadHeld[k]
            );
        }

        // Registrar en el búfer local para ejecución en targetFrame
        this.localInputQueue.set(targetFrame, heldSnapshot);

        // Enviar al oponente indicando el frame de destino
        this._sendPacket({
            type: 'INPUT_FRAME',
            playerIndex: localPlayerIndex,
            frame: targetFrame,
            held: heldSnapshot,
            cursor: this.role === 'HOST' ? this.engine.selectCursor : this.engine.selectCursorP2
        });

        // Obtener la entrada local programada para el frame actual (o el snapshot inmediato si arranca)
        const activeLocalHeld = this.localInputQueue.get(currentFrame) || heldSnapshot;
        this.localInputQueue.delete(currentFrame - 15);

        // Obtener la entrada remota programada para el frame actual (o la última conocida si hay latencia de red)
        if (this.remoteInputQueue.has(currentFrame)) {
            this.lastKnownRemoteHeld = this.remoteInputQueue.get(currentFrame);
            this.remoteInputQueue.delete(currentFrame);
        }
        this.remoteInputQueue.delete(currentFrame - 15);

        if (this.role === 'HOST') {
            p1Raw.remoteHeld = activeLocalHeld;
            p2Raw.remoteHeld = this.lastKnownRemoteHeld;
        } else {
            p1Raw.remoteHeld = this.lastKnownRemoteHeld;
            p2Raw.remoteHeld = activeLocalHeld;
        }
    }

    /**
     * Llamado al finalizar el cálculo físico del frame en GameLoop para que el HOST envíe el estado exacto post-colisiones.
     */
    syncPostFrame() {
        if (!this.isOnline || !this.engine) return;

        // Cada 2 frames (30 veces por segundo), el HOST envía estado autoritativo post-física para 0% desincronización
        if (
            this.role === 'HOST' &&
            this.engine.globalFrame % 2 === 0 &&
            this.engine.fighter1 &&
            this.engine.fighter2 &&
            this.engine.phase !== 'TITLE_SCREEN' &&
            this.engine.phase !== 'MODE_SELECT' &&
            this.engine.phase !== 'TEAM_SELECT'
        ) {
            this._lastPingSent = performance.now();
            this._sendPacket({
                type: 'STATE_SYNC',
                phase: this.engine.phase,
                phaseTimer: this.engine.phaseTimer,
                timerSeconds: this.engine.timerSeconds,
                roundNumber: this.engine.roundNumber,
                team1Index: this.engine.team1Index,
                team2Index: this.engine.team2Index,
                hitstopTimer: this.engine.hitstopTimer,
                superFreezeTimer: this.engine.superFreezeTimer,
                announcement: this.engine.announcement,
                f1: this._serializeFighter(this.engine.fighter1),
                f2: this._serializeFighter(this.engine.fighter2),
                projectiles: this.engine.projectiles.map(p => ({
                    ownerIndex: p.ownerIndex,
                    x: p.x,
                    y: p.y,
                    vx: p.vx,
                    facing: p.facing,
                    damage: p.damage,
                    chipDamage: p.chipDamage,
                    color: p.color,
                    isSuper: p.isSuper
                }))
            });
        }
    }

    _serializeFighter(f) {
        return {
            id: f.template ? f.template.id : (f.id || f.name),
            x: f.x,
            y: f.y,
            vx: f.vx,
            vy: f.vy,
            grounded: typeof f.isGrounded === 'function' ? f.isGrounded() : Boolean(f.grounded),
            facing: f.facing,
            hp: f.hp,
            redHp: f.recoverableRedHp,
            power: f.powerGauge,
            guardGauge: f.guardGauge,
            isMaxMode: f.isMaxMode,
            maxModeTimer: f.maxModeTimer,
            state: f.state,
            stateFrame: f.stateFrame,
            moveKey: f.currentMoveKey,
            moveHitsLanded: f.moveHitsLanded || 0,
            chainStepCount: f.chainStepCount || 0,
            stunTimer: f.stunTimer || 0,
            comboCount: f.comboHitsTaken || 0,
            invulnerableTimer: f.invulnerableTimer || 0,
            lastCancelType: f.lastCancelType || ''
        };
    }

    _applyFighterSync(fighter, snap) {
        if (!fighter || !snap) return;
        fighter.x = snap.x;
        fighter.y = snap.y;
        fighter.vx = snap.vx;
        fighter.vy = snap.vy;
        fighter.facing = snap.facing;
        fighter.hp = snap.hp;
        fighter.recoverableRedHp = snap.redHp;
        fighter.powerGauge = snap.power;
        if (typeof snap.guardGauge === 'number') fighter.guardGauge = snap.guardGauge;
        fighter.isMaxMode = snap.isMaxMode;
        fighter.maxModeTimer = snap.maxModeTimer;
        fighter.stunTimer = typeof snap.stunTimer === 'number' ? snap.stunTimer : (snap.hitstunTimer || 0);
        fighter.comboHitsTaken = snap.comboCount || 0;
        if (typeof snap.chainStepCount === 'number') fighter.chainStepCount = snap.chainStepCount;
        if (typeof snap.invulnerableTimer === 'number') fighter.invulnerableTimer = snap.invulnerableTimer;
        if (snap.lastCancelType !== undefined) fighter.lastCancelType = snap.lastCancelType;

        if (fighter.state !== snap.state || fighter.currentMoveKey !== snap.moveKey) {
            fighter.state = snap.state;
            fighter.stateFrame = snap.stateFrame;
            fighter.currentMoveKey = snap.moveKey;
            fighter.currentMove = snap.moveKey ? (fighter.moveset[snap.moveKey] || null) : null;
            fighter.moveHitsLanded = snap.moveHitsLanded || 0;
            fighter.updateBoxesForCurrentState();
        }
    }

    _handleIncomingPacket(packet) {
        if (!packet || typeof packet !== 'object') return;

        if (packet.type === 'HELLO_JOIN' && this.role === 'HOST') {
            this._onConnectionEstablished();
            this._sendPacket({ type: 'HELLO_ACK', roomCode: this.roomCode });
            this.sendTeamUpdate();
            return;
        }

        if (packet.type === 'HELLO_ACK' && this.role === 'GUEST') {
            this._onConnectionEstablished();
            this.sendTeamUpdate();
            return;
        }

        if (!this.isOnline || !this.engine) return;

        if (packet.type === 'INPUT_FRAME') {
            const remotePlayerIndex = this.role === 'HOST' ? 2 : 1;
            if (packet.playerIndex === remotePlayerIndex && packet.held) {
                const targetFrame = typeof packet.frame === 'number' ? packet.frame : (this.engine.globalFrame || 0);
                this.remoteInputQueue.set(targetFrame, packet.held);
                this.lastKnownRemoteHeld = { ...EMPTY_HELD, ...packet.held };
                const remoteInput = this.engine.inputHandler.getPlayer(remotePlayerIndex);
                remoteInput.remoteHeld = this.lastKnownRemoteHeld;
                if (typeof packet.cursor === 'number') {
                    if (remotePlayerIndex === 1) {
                        this.engine.selectCursor = packet.cursor;
                    } else {
                        this.engine.selectCursorP2 = packet.cursor;
                    }
                }
            }
            return;
        }

        if (packet.type === 'TEAM_SELECT_SYNC') {
            const mapIdsToTemplates = (ids) =>
                (ids || [])
                    .map(id => id === 'rugal' ? window.BOSS_RUGAL_TEMPLATE : this.engine.roster.find(r => r.id === id))
                    .filter(Boolean);

            if (packet.role === 'HOST' && this.role === 'GUEST') {
                this.engine.team1 = mapIdsToTemplates(packet.teamIds);
                if (typeof packet.cursor === 'number') {
                    this.engine.selectCursor = packet.cursor;
                }
                if (window.AudioSynth) window.AudioSynth.play('select');
            } else if (packet.role === 'GUEST' && this.role === 'HOST') {
                this.engine.team2 = mapIdsToTemplates(packet.teamIds);
                if (typeof packet.cursor === 'number') {
                    this.engine.selectCursorP2 = packet.cursor;
                }
                if (window.AudioSynth) window.AudioSynth.play('select');
                // Si ambos equipos ya tienen 3 integrantes, el Host arranca la pelea automáticamente
                if (this.engine.phase === 'TEAM_SELECT' && this.engine.team1.length === 3 && this.engine.team2.length === 3) {
                    this.sendMatchStart();
                }
            }
            return;
        }

        if (packet.type === 'REQUEST_MATCH_START' && this.role === 'HOST') {
            if (Array.isArray(packet.team2Ids) && packet.team2Ids.length > 0) {
                this.engine.team2 = packet.team2Ids
                    .map(id => id === 'rugal' ? window.BOSS_RUGAL_TEMPLATE : this.engine.roster.find(r => r.id === id))
                    .filter(Boolean);
            }
            this.sendMatchStart();
            return;
        }

        if (packet.type === 'MATCH_START_ONLINE' && this.role === 'GUEST') {
            this.engine._startOnlineMatchFromNetwork(packet.team1Ids, packet.team2Ids, packet.stageNumber || 1);
            return;
        }

        if (packet.type === 'STATE_SYNC' && this.role === 'GUEST') {
            this._sendPacket({ type: 'PONG' });

            // Si cambió el índice del peleador activo (ej. siguiente miembro tras K.O.), instanciar el nuevo peleador
            if (
                typeof packet.team1Index === 'number' &&
                packet.team1Index !== this.engine.team1Index &&
                this.engine.team1[packet.team1Index]
            ) {
                this.engine.team1Index = packet.team1Index;
                this.engine.fighter1 = new window.Fighter({
                    playerIndex: 1,
                    template: this.engine.team1[this.engine.team1Index],
                    x: packet.f1 ? packet.f1.x : this.engine.width * 0.26,
                    groundY: this.engine.groundY,
                    facing: 1,
                    initialPower: packet.f1 ? packet.f1.power : 1000
                });
            }

            if (
                typeof packet.team2Index === 'number' &&
                packet.team2Index !== this.engine.team2Index &&
                this.engine.team2[packet.team2Index]
            ) {
                this.engine.team2Index = packet.team2Index;
                this.engine.fighter2 = new window.Fighter({
                    playerIndex: 2,
                    template: this.engine.team2[this.engine.team2Index],
                    x: packet.f2 ? packet.f2.x : this.engine.width * 0.74,
                    groundY: this.engine.groundY,
                    facing: -1,
                    initialPower: packet.f2 ? packet.f2.power : 1000
                });
            }

            this.engine.phase = packet.phase || this.engine.phase;
            this.engine.phaseTimer = typeof packet.phaseTimer === 'number' ? packet.phaseTimer : this.engine.phaseTimer;
            this.engine.timerSeconds = typeof packet.timerSeconds === 'number' ? packet.timerSeconds : this.engine.timerSeconds;
            this.engine.roundNumber = packet.roundNumber || this.engine.roundNumber;
            if (packet.announcement) {
                this.engine.announcement = packet.announcement;
            }

            if (this.engine.fighter1 && packet.f1) {
                this._applyFighterSync(this.engine.fighter1, packet.f1);
            }
            if (this.engine.fighter2 && packet.f2) {
                this._applyFighterSync(this.engine.fighter2, packet.f2);
            }

            if (Array.isArray(packet.projectiles)) {
                this.engine.projectiles = packet.projectiles.map(p => new window.Projectile(p));
            }
            return;
        }

        if (packet.type === 'PONG' && this.role === 'HOST') {
            this.pingMs = Math.max(1, Math.round(performance.now() - this._lastPingSent));
            this._notifyStatus(
                'CONNECTED',
                `¡Conectado en línea como JUGADOR 1 (Anfitrión)! Sala: ${this.roomCode} • Ping: ${this.pingMs} ms`
            );
        }
    }

    disconnect() {
        this.isOnline = false;
        this.role = null;
        this.localInputQueue.clear();
        this.remoteInputQueue.clear();
        this.lastKnownRemoteHeld = { ...EMPTY_HELD };
        if (this.conn) {
            try { this.conn.close(); } catch (e) {}
            this.conn = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }
        if (this.localChannel) {
            try { this.localChannel.close(); } catch (e) {}
            this.localChannel = null;
        }
        if (this.engine) {
            this.engine.inputHandler.getPlayer(1).remoteHeld = null;
            this.engine.inputHandler.getPlayer(2).remoteHeld = null;
        }
    }
}

window.NetworkManager = NetworkManager;
