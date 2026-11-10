/**
 * @file main.js
 * @description Punto de entrada de "THE KING OF AZTLAN".
 * Inicializa el motor 2D en el Canvas HTML5 y conecta la marquesina limpia estilo Gabinete Arcade,
 * el modo de Multijugador en Línea P2P por Código de Sala y el detector de mandos USB/Bluetooth.
 */

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const engine = new window.GameLoop(canvas);
    window.gameEngine = engine;
    engine.start();

    // Controles de Marquesina Arcade
    const btnTitleScreen = document.getElementById('btnTitleScreen');
    const btnOnlineLobby = document.getElementById('btnOnlineLobby');
    const btnToggleAudio = document.getElementById('btnToggleAudio');
    const btnFullscreen = document.getElementById('btnFullscreen');
    const cabinetScreen = document.getElementById('cabinetScreen');

    // Elementos del Panel de Sala Online P2P
    const onlineLobbyPanel = document.getElementById('onlineLobbyPanel');
    const btnCloseOnline = document.getElementById('btnCloseOnline');
    const btnHostRoom = document.getElementById('btnHostRoom');
    const roomCodeBadge = document.getElementById('roomCodeBadge');
    const roomCodeValue = document.getElementById('roomCodeValue');
    const btnCopyCode = document.getElementById('btnCopyCode');
    const inputRoomCode = document.getElementById('inputRoomCode');
    const btnJoinRoom = document.getElementById('btnJoinRoom');
    const btnDisconnectRoom = document.getElementById('btnDisconnectRoom');
    const onlineStatusText = document.getElementById('onlineStatusText');
    const onlineDot = document.getElementById('onlineDot');
    const gamepadBadge = document.getElementById('gamepadBadge');

    if (btnTitleScreen) {
        btnTitleScreen.addEventListener('click', () => {
            engine.openTitleScreen();
            canvas.focus();
        });
    }

    if (btnOnlineLobby && onlineLobbyPanel) {
        btnOnlineLobby.addEventListener('click', () => {
            onlineLobbyPanel.classList.toggle('hidden');
            btnOnlineLobby.classList.toggle('active', !onlineLobbyPanel.classList.contains('hidden'));
        });
    }

    if (btnCloseOnline && onlineLobbyPanel) {
        btnCloseOnline.addEventListener('click', () => {
            onlineLobbyPanel.classList.add('hidden');
            if (btnOnlineLobby) btnOnlineLobby.classList.remove('active');
            canvas.focus();
        });
    }

    // Configurar callbacks de estado del Multijugador en Línea P2P
    if (engine.networkManager) {
        engine.networkManager.onStatusChange((info) => {
            if (onlineStatusText) {
                onlineStatusText.textContent = info.message;
            }
            if (onlineDot) {
                onlineDot.className = 'online-dot';
                if (info.state === 'WAITING' || info.state === 'CONNECTING') {
                    onlineDot.classList.add('waiting');
                } else if (info.state === 'CONNECTED') {
                    onlineDot.classList.add('connected');
                }
            }
            if (btnDisconnectRoom) {
                btnDisconnectRoom.classList.toggle('hidden', info.state !== 'CONNECTED' && info.state !== 'WAITING');
            }
        });
    }

    if (btnHostRoom && engine.networkManager) {
        btnHostRoom.addEventListener('click', async () => {
            const code = await engine.networkManager.hostRoom();
            if (roomCodeValue) roomCodeValue.textContent = code;
            if (roomCodeBadge) roomCodeBadge.classList.remove('hidden');
            canvas.focus();
        });
    }

    if (btnCopyCode && roomCodeValue) {
        btnCopyCode.addEventListener('click', () => {
            if (navigator.clipboard && roomCodeValue.textContent) {
                navigator.clipboard.writeText(roomCodeValue.textContent);
                btnCopyCode.textContent = '¡Copiado!';
                setTimeout(() => {
                    btnCopyCode.textContent = 'Copiar';
                }, 1500);
            }
        });
    }

    if (btnJoinRoom && engine.networkManager) {
        btnJoinRoom.addEventListener('click', async () => {
            const code = inputRoomCode ? inputRoomCode.value : '';
            await engine.networkManager.joinRoom(code);
            canvas.focus();
        });
    }

    if (btnDisconnectRoom && engine.networkManager) {
        btnDisconnectRoom.addEventListener('click', () => {
            engine.networkManager.disconnect();
            if (roomCodeBadge) roomCodeBadge.classList.add('hidden');
            if (onlineStatusText) onlineStatusText.textContent = 'Sesión en línea finalizada.';
            if (onlineDot) onlineDot.className = 'online-dot';
            btnDisconnectRoom.classList.add('hidden');
            canvas.focus();
        });
    }

    if (btnToggleAudio) {
        btnToggleAudio.addEventListener('click', () => {
            window.AudioSynth.enabled = !window.AudioSynth.enabled;
            if (!window.AudioSynth.enabled) {
                window.AudioSynth.stopBGM();
            } else {
                const track = engine.phase === 'TITLE_SCREEN'
                    ? 'title'
                    : (engine.currentStageNumber === 12 ? 'boss_rugal' : 'stage');
                window.AudioSynth.playBGM(track);
            }
            btnToggleAudio.classList.toggle('active', window.AudioSynth.enabled);
            btnToggleAudio.textContent = window.AudioSynth.enabled
                ? '🔊 Sonido: ON'
                : '🔇 Sonido: OFF';
            canvas.focus();
        });
    }

    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            const target = cabinetScreen || canvas;
            if (!document.fullscreenElement) {
                if (target.requestFullscreen) target.requestFullscreen();
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            canvas.focus();
        });
    }

    // Actualizar indicador visual de mando conectado cada 300ms
    setInterval(() => {
        if (!gamepadBadge) return;
        const p1Pad = engine.inputHandler.getPlayer(1).gamepadConnected;
        const p2Pad = engine.inputHandler.getPlayer(2).gamepadConnected;
        if (p1Pad || p2Pad) {
            const count = (p1Pad ? 1 : 0) + (p2Pad ? 1 : 0);
            gamepadBadge.textContent = `✓ ${count} Mando(s) Activo(s)`;
            gamepadBadge.classList.add('connected');
        } else {
            gamepadBadge.textContent = 'Conecta tu mando USB/BT';
            gamepadBadge.classList.remove('connected');
        }
    }, 300);
});
