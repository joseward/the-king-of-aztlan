/**
 * @file NetworkManager.js
 * @description Gestor de Multijugador en Línea Peer-to-Peer (P2P) por Código de Sala para "THE KING OF AZTLAN".
 * - Soporta conexión a través de Internet mediante WebRTC DataChannels (PeerJS CDN bajo demanda).
 * - Incluye canal local instantáneo (BroadcastChannel) para pruebas rápidas entre 2 pestañas o ventanas en la misma PC sin requerir internet.
 */

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
    }

    onStatusChange(cb) {
        this.statusCallback = cb;
    }

    _notifyStatus(state, message) {
        if (this.statusCallback) {
            this.statusCallback({ state, message, roomCode: this.roomCode, role: this.role, pingMs: this.pingMs });
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
            if (typeof window === 'undefined') {
                resolve(false);
                return;
            }
            if (window.Peer) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
            script.async = true;
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
        this._notifyStatus('WAITING', `Sala creada: ${this.roomCode} — Esperando al Jugador 2...`);

        // 1. Canal local instantáneo (por si el usuario prueba con otra pestaña/ventana en su misma PC)
        this._setupBroadcastChannel(this.roomCode);

        // 2. Canal WebRTC P2P en Internet (PeerJS)
        const hasPeer = await this._ensurePeerJSLoaded();
        if (hasPeer && window.Peer) {
            try {
                const peerId = `king-of-aztlan-room-${this.roomCode.toLowerCase()}`;
                this.peer = new window.Peer(peerId);
                this.peer.on('connection', (conn) => {
                    this.conn = conn;
                    this._bindWebRTCConnection(conn);
                });
                this.peer.on('error', () => {
                    // Si estamos sin internet, BroadcastChannel sigue activo para red local/pestañas
                });
            } catch (e) {
                // Fallback silencioso a BroadcastChannel
            }
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
                this.peer = new window.Peer();
                this.peer.on('open', () => {
                    if (this.isOnline) return; // Ya conectó vía BroadcastChannel
                    const hostPeerId = `king-of-aztlan-room-${this.roomCode.toLowerCase()}`;
                    const conn = this.peer.connect(hostPeerId, { reliable: false });
                    this.conn = conn;
                    this._bindWebRTCConnection(conn);
                });
                this.peer.on('error', () => {
                    if (!this.isOnline) {
                        this._notifyStatus('ERROR', `No se encontró la sala ${this.roomCode}. Verifica el código.`);
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

        // Configurar el motor en modo Versus 2 Jugadores y abrir Selección de Equipos sincronizada
        if (this.engine) {
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
     * Llamado en cada frame por GameLoop para intercambiar inputs y sincronizar estado a 60 FPS.
     */
    syncFrame() {
        if (!this.isOnline || !this.engine) return;

        const localPlayerIndex = this.role === 'HOST' ? 1 : 2;
        const p1Raw = this.engine.inputHandler.getPlayer(1);
        const p2Raw = this.engine.inputHandler.getPlayer(2);

        // Permitir que el Invitado (Jugador 2 en otra PC) use cómodamente WASD+U/I/O/P o su Mando #1 además de Flechas
        const heldSnapshot = {};
        const keys = ['up', 'down', 'left', 'right', 'LP', 'LK', 'HP', 'HK', 'EVADE', 'MAX'];
        for (const k of keys) {
            if (this.role === 'HOST') {
                heldSnapshot[k] = Boolean(p1Raw.keyboardHeld[k] || p1Raw.gamepadHeld[k]);
            } else {
                heldSnapshot[k] = Boolean(
                    p2Raw.keyboardHeld[k] ||
                    p2Raw.gamepadHeld[k] ||
                    p1Raw.keyboardHeld[k] ||
                    p1Raw.gamepadHeld[k]
                );
                p2Raw.remoteHeld = heldSnapshot;
            }
        }

        this._sendPacket({
            type: 'INPUT_FRAME',
            playerIndex: localPlayerIndex,
            held: heldSnapshot,
            selectCursor: this.engine.selectCursor
        });

        // Cada 15 frames, el HOST envía un paquete ligero de corrección de posición/salud para evitar desincronización
        if (this.role === 'HOST' && this.engine.globalFrame % 15 === 0 && this.engine.fighter1 && this.engine.fighter2) {
            this._lastPingSent = performance.now();
            this._sendPacket({
                type: 'STATE_SYNC',
                phase: this.engine.phase,
                timerSeconds: this.engine.timerSeconds,
                f1: {
                    x: this.engine.fighter1.x,
                    y: this.engine.fighter1.y,
                    hp: this.engine.fighter1.hp,
                    power: this.engine.fighter1.powerGauge
                },
                f2: {
                    x: this.engine.fighter2.x,
                    y: this.engine.fighter2.y,
                    hp: this.engine.fighter2.hp,
                    power: this.engine.fighter2.powerGauge
                }
            });
        }
    }

    _handleIncomingPacket(packet) {
        if (!packet || typeof packet !== 'object') return;

        if (packet.type === 'HELLO_JOIN' && this.role === 'HOST') {
            this._onConnectionEstablished();
            this._sendPacket({ type: 'HELLO_ACK', roomCode: this.roomCode });
            return;
        }

        if (packet.type === 'HELLO_ACK' && this.role === 'GUEST') {
            this._onConnectionEstablished();
            return;
        }

        if (!this.isOnline || !this.engine) return;

        if (packet.type === 'INPUT_FRAME') {
            const remotePlayerIndex = this.role === 'HOST' ? 2 : 1;
            if (packet.playerIndex === remotePlayerIndex && packet.held) {
                const remoteInput = this.engine.inputHandler.getPlayer(remotePlayerIndex);
                remoteInput.remoteHeld = packet.held;
            }
            return;
        }

        if (packet.type === 'STATE_SYNC' && this.role === 'GUEST') {
            this._sendPacket({ type: 'PONG' });
            if (this.engine.fighter1 && this.engine.fighter2 && packet.f1 && packet.f2) {
                // Corrección suave si existe deriva de posición
                if (Math.abs(this.engine.fighter1.x - packet.f1.x) > 12) {
                    this.engine.fighter1.x = packet.f1.x;
                    this.engine.fighter1.y = packet.f1.y;
                }
                if (Math.abs(this.engine.fighter2.x - packet.f2.x) > 12) {
                    this.engine.fighter2.x = packet.f2.x;
                    this.engine.fighter2.y = packet.f2.y;
                }
                this.engine.fighter1.hp = packet.f1.hp;
                this.engine.fighter2.hp = packet.f2.hp;
                this.engine.fighter1.powerGauge = packet.f1.power;
                this.engine.fighter2.powerGauge = packet.f2.power;
                this.engine.timerSeconds = packet.timerSeconds;
            }
            return;
        }

        if (packet.type === 'PONG' && this.role === 'HOST') {
            this.pingMs = Math.max(1, Math.round(performance.now() - this._lastPingSent));
        }
    }

    disconnect() {
        this.isOnline = false;
        this.role = null;
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
