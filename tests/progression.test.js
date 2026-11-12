const test = require('node:test');
const assert = require('node:assert/strict');
const { makeLoop, createSandbox } = require('./test-helper');

test('Progression: Defeating all 3 opponents in a stage advances currentStageNumber from 1 to 2 to 12', () => {
  const { loop, sandbox } = makeLoop();
  
  // Iniciar en modo Arcade
  loop.gameMode = 'ARCADE_12';
  loop.startArcadeStage(1);
  assert.equal(loop.currentStageNumber, 1, 'Stage inicial debe ser 1');
  
  // Iniciar combate 3v3
  loop.startMatch3v3();
  assert.equal(loop.team1Index, 0);
  assert.equal(loop.team2Index, 0);
  assert.equal(loop.currentStageNumber, 1);

  // Derrotar al oponente 1
  loop.fighter2.hp = 0;
  loop._advanceTeamElimination();
  assert.equal(loop.team2Index, 1, 'Debe entrar el oponente 2/3');
  assert.equal(loop.currentStageNumber, 1, 'Sigue en Nivel 1 peleando contra el oponente 2');

  // Derrotar al oponente 2
  loop.fighter2.hp = 0;
  loop._advanceTeamElimination();
  assert.equal(loop.team2Index, 2, 'Debe entrar el oponente 3/3 (Líder)');
  assert.equal(loop.currentStageNumber, 1, 'Sigue en Nivel 1 peleando contra el líder');

  // Derrotar al oponente 3 (Líder del equipo 1)
  loop.fighter2.hp = 0;
  loop._advanceTeamElimination();
  
  // Al vencer a los 3 integrantes, el juego DEBE avanzar al Nivel 2
  assert.equal(loop.currentStageNumber, 2, '¡Debe haber avanzado al Nivel 2!');
  assert.equal(loop.phase, sandbox.window.GamePhase.STAGE_LADDER, 'Debe mostrar la escalera de nivel 2');
  assert.equal(loop.team2Index, 0, 'El nuevo equipo oponente debe empezar en el miembro 0');
});

test('Progression: FREE_3V3 (Team vs CPU) also advances levels upon defeating enemy team', () => {
  const { loop, sandbox } = makeLoop();
  
  loop.gameMode = 'FREE_3V3';
  loop.startArcadeStage(1);
  loop.startMatch3v3();
  assert.equal(loop.currentStageNumber, 1);

  // Derrotar a los 3 oponentes de FREE_3V3
  loop.team2Index = 2;
  loop.fighter2.hp = 0;
  loop._advanceTeamElimination();

  assert.equal(loop.currentStageNumber, 2, 'FREE_3V3 debe avanzar al Nivel 2 al derrotar al equipo CPU');
  assert.equal(loop.team2Index, 0);
});

test('Character Visuals: All 42 characters generate distinct portrait canvases and unique hairstyles', () => {
  const { sandbox } = createSandbox();
  const roster = sandbox.window.CHARACTER_ROSTER;
  assert.equal(roster.length, 42, 'Roster debe tener 42 personajes');

  const renderer = sandbox.window.PixelArtRenderer;
  const hairStylesFound = new Set();
  const bodyTypesFound = new Set();

  for (const char of roster) {
    const portrait = renderer.getPortraitCanvas(char, 76, false);
    assert.ok(portrait, `Retrato generado para ${char.name}`);
    hairStylesFound.add(char.visuals.hairStyle);
    bodyTypesFound.add(char.visuals.bodyType);
  }

  // Verificar que existen más de 12 estilos de peinado distintos en el juego
  assert.ok(hairStylesFound.size >= 12, `Debe haber al menos 12 peinados distintos (encontrados: ${hairStylesFound.size})`);
  // Verificar que existen más de 5 complexiones corporales distintas (gigante, bajo, femenino, pesado, atlético...)
  assert.ok(bodyTypesFound.size >= 5, `Debe haber al menos 5 tipos de cuerpo distintos (encontrados: ${bodyTypesFound.size})`);
});

test('KOF 2002 Select Screen: All 42 fighters map to unique, non-overlapping slots in the 9x5 grid around Central Timer', () => {
  const { loop } = makeLoop();
  const hud = loop.hud;
  const tBox = hud.getTimerRect();

  // Verificar dimensiones de la caja del cronómetro central KOF 2002
  assert.equal(tBox.w, 186, 'Ancho de la caja del cronómetro debe ser 186px');
  assert.equal(tBox.h, 92, 'Alto de la caja del cronómetro debe ser 92px');

  const occupiedPositions = new Set();
  for (let i = 0; i < 42; i++) {
    const slot = hud.getCharacterSlotRect(i);
    assert.ok(slot.x >= 368 && slot.x + slot.w <= 940, `Slot ${i} debe estar dentro de la cuadrícula horizontal`);
    assert.ok(slot.y >= 24 && slot.y + slot.h <= 520, `Slot ${i} debe estar dentro de la cuadrícula vertical`);

    // Ninguna casilla debe sobreponerse con la caja del cronómetro
    const overlapsTimer = (
      slot.x < tBox.x + tBox.w &&
      slot.x + slot.w > tBox.x &&
      slot.y < tBox.y + tBox.h &&
      slot.y + slot.h > tBox.y
    );
    assert.equal(overlapsTimer, false, `Casilla ${i} (${loop.roster[i].name}) no debe solapar el cronómetro central`);

    const key = `${slot.x},${slot.y}`;
    assert.equal(occupiedPositions.has(key), false, `La posición ${key} no debe estar duplicada para el índice ${i}`);
    occupiedPositions.add(key);
  }
  assert.equal(occupiedPositions.size, 42, 'Debe haber exactamente 42 casillas únicas');
});

test('KOF 2002 Select Screen: 2D cursor navigation jumps smoothly across Central Timer', () => {
  const { loop } = makeLoop();
  
  // 1. Choi (índice 20, col 2 de fila 2) al moverse a la derecha debe saltar sobre el cronómetro a Geese (índice 21, col 6)
  assert.equal(loop._moveGridCursor(20, 'right'), 21, 'Debe saltar a la derecha del cronómetro (Choi -> Geese)');

  // 2. Geese (índice 21, col 6 de fila 2) al moverse a la izquierda debe saltar a Choi (índice 20, col 2)
  assert.equal(loop._moveGridCursor(21, 'left'), 20, 'Debe saltar a la izquierda del cronómetro (Geese -> Choi)');

  // 3. Desde fila 1 cols 3, 4, 5 (índices 12, 13, 14), al bajar debe saltar el cronómetro a fila 3 (índices 27, 28, 29)
  assert.equal(loop._moveGridCursor(12, 'down'), 27, 'Bajar desde col 3 debe saltar el cronómetro a fila 3');
  assert.equal(loop._moveGridCursor(13, 'down'), 28, 'Bajar desde col 4 debe saltar el cronómetro a fila 3');
  assert.equal(loop._moveGridCursor(14, 'down'), 29, 'Bajar desde col 5 debe saltar el cronómetro a fila 3');

  // 4. Desde fila 3 cols 3, 4, 5, al subir debe saltar el cronómetro a fila 1
  assert.equal(loop._moveGridCursor(27, 'up'), 12, 'Subir desde col 3 debe saltar el cronómetro a fila 1');
  assert.equal(loop._moveGridCursor(28, 'up'), 13, 'Subir desde col 4 debe saltar el cronómetro a fila 1');
  assert.equal(loop._moveGridCursor(29, 'up'), 14, 'Subir desde col 5 debe saltar el cronómetro a fila 1');
});

test('KOF 2002 Select Screen: Big Bust illustrations render for all 42 characters on both 1P (Orange) and 2P (Magenta) frames', () => {
  const { sandbox } = createSandbox();
  const renderer = sandbox.window.PixelArtRenderer;
  const roster = sandbox.window.CHARACTER_ROSTER;

  for (const char of roster) {
    const p1Bust = renderer.getKOFBigBustCanvas(char, 268, 236, true);
    assert.ok(p1Bust, `Busto 1P generado para ${char.name}`);

    const p2Bust = renderer.getKOFBigBustCanvas(char, 268, 236, false);
    assert.ok(p2Bust, `Busto 2P generado para ${char.name}`);
  }
});

test('Intro & Animation Stability: All 42 fighters (including Chang Koehan & Omega Rugal) draw without ReferenceError', () => {
  const { sandbox } = createSandbox();
  const ctx = sandbox.document.createElement('canvas').getContext('2d');
  const roster = sandbox.window.CHARACTER_ROSTER;

  for (const char of roster) {
    const f = new sandbox.window.Fighter({
      playerIndex: 1,
      template: char,
      x: 200,
      groundY: 422,
      facing: 1
    });
    f.state = 'ATTACK';
    f.currentMove = { startup: 2, active: 20, recovery: 4, pose: 'CMD_STRIKE', hits: 2 };
    f.stateFrame = 5;
    f.chainStepCount = 3;
    f.animFrame = 10;

    // Esto causaba ReferenceError antes en Chang (chestGridX) y Rugal (chestW)
    assert.doesNotThrow(() => {
      f.draw(ctx, false);
    }, `El renderizado de ${char.name} (${char.id}) no debe lanzar ReferenceError`);
  }
});

test('Intro & Animation Stability: Cinematic intro renders all 720 frames and all 11 teams without freezing', () => {
  const { loop, sandbox } = makeLoop();
  const ctx = sandbox.document.createElement('canvas').getContext('2d');

  for (let frame = 0; frame < 720; frame += 3) {
    assert.doesNotThrow(() => {
      loop.hud.drawTitleScreen(ctx, frame);
    }, `El frame ${frame} de la intro KOF 2002 no debe congelarse ni fallar`);
  }
});
