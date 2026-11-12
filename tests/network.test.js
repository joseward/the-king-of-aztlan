const test = require('node:test');
const assert = require('node:assert/strict');
const { makeLoop } = require('./test-helper');

test('Network: Serialization roundtrip preserves essential state properties', () => {
  const { loop } = makeLoop();
  loop.startMatch3v3();

  const f1 = loop.fighter1;
  f1.stunTimer = 18;
  f1.guardGauge = 650;
  f1.chainStepCount = 2;
  f1.invulnerableTimer = 12;
  f1.lastCancelType = 'SUPER_CANCEL';
  f1.powerGauge = 2100;

  const serialized = loop.networkManager._serializeFighter(f1);
  assert.equal(serialized.stunTimer, 18);
  assert.equal(serialized.guardGauge, 650);
  assert.equal(serialized.chainStepCount, 2);
  assert.equal(serialized.invulnerableTimer, 12);
  assert.equal(serialized.lastCancelType, 'SUPER_CANCEL');
  assert.equal(serialized.power, 2100);

  // Apply to remote fighter
  const f2 = loop.fighter2;
  loop.networkManager._applyFighterSync(f2, serialized);

  assert.equal(f2.stunTimer, 18);
  assert.equal(f2.guardGauge, 650);
  assert.equal(f2.chainStepCount, 2);
  assert.equal(f2.invulnerableTimer, 12);
  assert.equal(f2.lastCancelType, 'SUPER_CANCEL');
  assert.equal(f2.powerGauge, 2100);
});

test('Network: Input delay buffer queues and applies with target frame delay', () => {
  const { loop } = makeLoop();
  loop.startMatch3v3();
  const net = loop.networkManager;

  assert.equal(net.inputDelay, 2, 'Default input delay is 2 frames');

  // Push an input into local queue Map
  net.localInputQueue.set(10, { LP: true, right: true });

  // Query frame 9 (should not be in map for 9)
  assert.equal(net.localInputQueue.get(9), undefined);

  // Query frame 10 (target frame ready)
  const f10 = net.localInputQueue.get(10);
  assert.ok(f10);
  assert.equal(f10.LP, true);
  assert.equal(f10.right, true);
});
