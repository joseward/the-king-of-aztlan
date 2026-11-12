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
