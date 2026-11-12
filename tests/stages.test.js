const test = require('node:test');
const assert = require('node:assert/strict');
const { createSandbox } = require('./test-helper');

test('Stages: StageRenderer renders all 12 stages without throwing', () => {
  const { sandbox, canvas } = createSandbox();
  const StageRenderer = sandbox.window.StageRenderer;
  assert.ok(StageRenderer, 'StageRenderer exists');

  const dummyCtx = canvas.getContext('2d');

  for (let stageNum = 1; stageNum <= 12; stageNum++) {
    assert.doesNotThrow(() => {
      StageRenderer.drawStage(dummyCtx, stageNum, 60, 960, 540, 472);
    }, `Stage ${stageNum} renders cleanly`);
  }
});

test('Fullscreen: 16:9 mathematical scaling fits edge-to-edge without overflow on various display ratios', () => {
  const testDisplays = [
    { name: '1080p (16:9)', vw: 1920, vh: 1080, expectedW: 1920, expectedH: 1080 },
    { name: '720p (16:9)', vw: 1280, vh: 720, expectedW: 1280, expectedH: 720 },
    { name: '1440p (16:9)', vw: 2560, vh: 1440, expectedW: 2560, expectedH: 1440 },
    { name: '4K UHD (16:9)', vw: 3840, vh: 2160, expectedW: 3840, expectedH: 2160 },
    { name: '16:10 Laptop (1920x1200)', vw: 1920, vh: 1200, expectedW: 1920, expectedH: 1080 },
    { name: 'Ultrawide 21:9 (2560x1080)', vw: 2560, vh: 1080, expectedW: 1920, expectedH: 1080 }
  ];

  for (const d of testDisplays) {
    const scale = Math.min(d.vw / 960, d.vh / 540);
    const w = Math.floor(960 * scale);
    const h = Math.floor(540 * scale);

    assert.equal(w, d.expectedW, `${d.name} width matches expected`);
    assert.equal(h, d.expectedH, `${d.name} height matches expected`);
    assert.ok(w <= d.vw, `${d.name} does not overflow screen width`);
    assert.ok(h <= d.vh, `${d.name} does not overflow screen height`);
  }
});
