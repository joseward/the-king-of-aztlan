const test = require('node:test');
const assert = require('node:assert/strict');
const { createSandbox } = require('./test-helper');

test('Movesets: All 42 fighters in CHARACTER_ROSTER have special_SIG configured', () => {
  const { sandbox } = createSandbox();
  const roster = sandbox.window.CHARACTER_ROSTER;

  assert.equal(roster.length, 42, 'Roster has 42 characters (including Omega Rugal)');

  const VALID_ARCHETYPES = ['PILLAR', 'GRAB', 'TELEPORT', 'CHARGE', 'COUNTER', 'SLIDE', 'DIVE'];

  for (const f of roster) {
    assert.ok(f.moveset, `Fighter ${f.name} (${f.id}) has moveset object`);
    assert.ok(f.moveset.special_SIG, `Fighter ${f.name} (${f.id}) has special_SIG`);

    const sig = f.moveset.special_SIG;
    assert.ok(sig.name, `Fighter ${f.name} special_SIG has name`);
    assert.ok(VALID_ARCHETYPES.includes(sig.archetype), `Fighter ${f.name} archetype '${sig.archetype}' is valid`);
    assert.ok(sig.startup > 0, `Fighter ${f.name} special_SIG startup > 0`);
    assert.ok(sig.active > 0, `Fighter ${f.name} special_SIG active > 0`);
    assert.ok(sig.recovery >= 0, `Fighter ${f.name} special_SIG recovery >= 0`);
  }
});

test('Movesets: Archetypes distribution covers all 7 archetypes across roster', () => {
  const { sandbox } = createSandbox();
  const roster = sandbox.window.CHARACTER_ROSTER;

  const counts = {};
  for (const f of roster) {
    const arch = f.moveset.special_SIG.archetype;
    counts[arch] = (counts[arch] || 0) + 1;
  }

  const VALID_ARCHETYPES = ['PILLAR', 'GRAB', 'TELEPORT', 'CHARGE', 'COUNTER', 'SLIDE', 'DIVE'];
  for (const arch of VALID_ARCHETYPES) {
    assert.ok((counts[arch] || 0) >= 3, `Archetype ${arch} has at least 3 representative fighters (found ${counts[arch]})`);
  }
});

test('Movesets: Counter and Armor mechanics trigger properly on Fighter', () => {
  const { sandbox } = createSandbox();
  const Fighter = sandbox.window.Fighter;
  const FighterState = sandbox.window.FighterState;
  const roster = sandbox.window.CHARACTER_ROSTER;

  const counterFighterTemplate = roster.find(r => r.moveset.special_SIG.archetype === 'COUNTER');
  assert.ok(counterFighterTemplate, 'Found a counter fighter');

  const f1 = new Fighter({
    playerIndex: 1,
    template: counterFighterTemplate,
    x: 200,
    groundY: 400,
    facing: 1
  });

  // Manually enter counter signature move
  f1._startMove('special_SIG', FighterState.SPECIAL);
  assert.equal(f1.state, FighterState.SPECIAL);
  assert.equal(f1.isCounterStance, true, 'Counter stance is active during active frames of COUNTER');

  // Attack coming into counter stance
  const dummyAttack = {
    damage: 100,
    hitstun: 20,
    blockstun: 15,
    knockbackX: 4,
    knockbackY: 0,
    hitType: 'MID'
  };

  const incomingAttacker = new Fighter({
    playerIndex: 2,
    template: roster[0],
    x: 230,
    groundY: 400,
    facing: -1
  });

  const result = f1.receiveAttack(dummyAttack, incomingAttacker, null, 1);
  assert.equal(result.parried, true, 'Incoming attack was successfully parried');
});
