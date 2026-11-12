const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = process.env.AZTLAN_ROOT || path.resolve(__dirname, '..');

function createSandbox() {
  const ctxCanvas = new Proxy({ globalAlpha: 1, fillStyle: '#000000', strokeStyle: '#ffffff', lineWidth: 1 }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop: () => {} });
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      return () => {};
    },
    set(target, prop, value) { target[prop] = value; return true; }
  });

  const canvas = {
    width: 960, height: 540, style: {},
    getContext: () => ctxCanvas,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
    addEventListener: () => {},
    focus: () => {}
  };

  const storage = {};
  const sandbox = {
    window: {
      innerWidth: 1920,
      innerHeight: 1080,
      addEventListener: () => {},
      requestAnimationFrame: () => {}
    },
    document: {
      getElementById: (id) => ({
        id,
        addEventListener: () => {},
        classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
        textContent: '',
        innerHTML: '',
        style: {},
        appendChild: () => {},
        focus: () => {}
      }),
      createElement: () => ({
        width: 64,
        height: 64,
        style: {},
        getContext: () => ctxCanvas,
        setAttribute: () => {},
        appendChild: () => {},
        addEventListener: () => {}
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
      fullscreenElement: null
    },
    localStorage: {
      getItem: (k) => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; }
    },
    navigator: { getGamepads: () => [] },
    performance: { now: () => Date.now() },
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    Audio: function () {
      return { play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {}, volume: 1, currentTime: 0 };
    },
    AudioContext: undefined,
    Math, console, parseInt, parseFloat, Set, Map, Array, Object, String, Number, Boolean, JSON, Date, Uint8ClampedArray, Float32Array, Promise, Proxy
  };

  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.window.navigator = sandbox.navigator;
  vm.createContext(sandbox);

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scriptPaths = [...html.matchAll(/<script\s+src="([^"]+)"/g)]
    .map(m => m[1])
    .filter(src => !src.startsWith('http') && src !== 'src/main.js');

  for (const s of scriptPaths) {
    const code = fs.readFileSync(path.join(ROOT, s), 'utf8');
    vm.runInContext(code, sandbox, { filename: s });
  }

  return { sandbox, canvas };
}

function makeLoop() {
  const { sandbox, canvas } = createSandbox();
  const loop = new sandbox.window.GameLoop(canvas);
  return {
    sandbox,
    loop,
    GamePhase: sandbox.window.GamePhase,
    FighterState: sandbox.window.FighterState
  };
}

module.exports = { createSandbox, makeLoop, ROOT };
