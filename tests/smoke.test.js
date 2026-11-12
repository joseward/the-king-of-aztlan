const test = require('node:test');
const assert = require('node:assert/strict');
const { makeLoop } = require('./test-helper');

test('Smoke test: Engine boots, cycles through all GamePhases and renders without exceptions', () => {
  const { loop, GamePhase } = makeLoop();
  assert.ok(loop, 'GameLoop instance created');

  const allPhases = Object.values(GamePhase);
  assert.ok(allPhases.length >= 8, `Expected at least 8 GamePhases, found ${allPhases.length}`);

  for (const phase of allPhases) {
    if (
      phase === GamePhase.FIGHTING ||
      phase === GamePhase.ROUND_INTRO ||
      phase === GamePhase.KO_TRANSITION ||
      phase === GamePhase.MATCH_OVER
    ) {
      if (!loop.fighter1) loop.startMatch3v3();
    }
    loop.phase = phase;
    for (let i = 0; i < 3; i++) {
      loop.updateFixedStep();
      loop.render();
    }
  }

  assert.ok(true, 'Completed step and render cycles across all phases');
});
