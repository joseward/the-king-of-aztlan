const test = require('node:test');
const assert = require('node:assert/strict');
const { createSandbox } = require('./test-helper');

test('AI: Mulberry32 deterministic PRNG generates reproducible sequences', () => {
  const { sandbox } = createSandbox();
  const AIController = sandbox.window.AIController;

  const ai1 = new AIController();
  ai1.setSeed(424242);
  const seq1 = [];
  for (let i = 0; i < 50; i++) {
    seq1.push(ai1.random());
  }

  const ai2 = new AIController();
  ai2.setSeed(424242);
  const seq2 = [];
  for (let i = 0; i < 50; i++) {
    seq2.push(ai2.random());
  }

  assert.deepEqual(seq1, seq2, 'Same seed produces bit-identical sequences');

  const ai3 = new AIController();
  ai3.setSeed(999999);
  const seq3 = [];
  for (let i = 0; i < 50; i++) {
    seq3.push(ai3.random());
  }
  assert.notDeepEqual(seq1, seq3, 'Different seed produces different sequence');
});

test('AI: Difficulty tiers have progressively sharper block, cancel, super and anti-air rates', () => {
  const { sandbox } = createSandbox();
  const { AIDifficulty, AIController } = sandbox.window;

  const ai = new AIController();
  const facil = ai.getDifficultyRates(AIDifficulty.FACIL);
  const normal = ai.getDifficultyRates(AIDifficulty.NORMAL);
  const dificil = ai.getDifficultyRates(AIDifficulty.DIFICIL);
  const maestro = ai.getDifficultyRates(AIDifficulty.MAESTRO);

  assert.ok(facil.blockRate < normal.blockRate, 'Normal blocks more than Facil');
  assert.ok(normal.blockRate < dificil.blockRate, 'Dificil blocks more than Normal');
  assert.ok(dificil.blockRate < maestro.blockRate, 'Maestro blocks more than Dificil');

  assert.ok(facil.superRate < normal.superRate, 'Normal supers more than Facil');
  assert.ok(normal.superRate < dificil.superRate, 'Dificil supers more than Normal');
  assert.ok(dificil.superRate < maestro.superRate, 'Maestro supers more than Dificil');

  assert.ok(facil.antiAirRate < maestro.antiAirRate, 'Maestro has much higher anti-air DP rate');
});

test('AI: Dummy modes cycle properly through all 6 practice behaviors', () => {
  const { sandbox } = createSandbox();
  const { DummyMode, AIController } = sandbox.window;

  const ai = new AIController();
  ai.setDummyMode(DummyMode.QUIETO);

  assert.equal(ai.dummyMode, DummyMode.QUIETO);
  assert.equal(ai.cycleDummyMode(), DummyMode.AGACHADO);
  assert.equal(ai.cycleDummyMode(), DummyMode.SALTAR);
  assert.equal(ai.cycleDummyMode(), DummyMode.BLOQUEAR_TODO);
  assert.equal(ai.cycleDummyMode(), DummyMode.BLOQUEAR_TRAS_GOLPE);
  assert.equal(ai.cycleDummyMode(), DummyMode.CPU);
  assert.equal(ai.cycleDummyMode(), DummyMode.QUIETO);
});
