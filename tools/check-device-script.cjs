// Exercise the actual Swift-embedded JavaScript, including pre-DOM injection.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../native/CogniCode/App/DeviceIntelligence.swift'), 'utf8');
const template = source.match(/let js = """([\s\S]*?)"""/)[1];
for (const modelName of ['iPhone 16 Pro', 'iPhone Pro Max (6.9")', 'Future "Phone" \\ test']) {
  for (const ready of [true, false]) {
    const device = { modelName, hardwareId: 'test', screenClass: 'large-max',
      isPro: true, isMax: true, hasDynamicIsland: true, hasNotch: false,
      isProMotion: true, iOSVersion: '26.0' };
    const classes = new Set();
    const properties = new Map();
    const root = { classList: { add: c => classes.add(c) },
      style: { setProperty: (k, v) => properties.set(k, v) } };
    let onReady;
    const context = { window: {}, document: { documentElement: ready ? root : null,
      addEventListener: (event, callback) => { assert.equal(event, 'DOMContentLoaded'); onReady = callback; } } };
    vm.runInNewContext(template.replace('\\(json)', JSON.stringify(device)), context);
    if (!ready) { context.document.documentElement = root; onReady(); }
    assert.equal(context.window.__cogniDevice.modelName, modelName);
    assert.equal(properties.get('--device-model'), modelName);
    for (const c of ['ios-26', 'screen-large-max', 'device-max', 'has-dynamic-island', 'is-promotion']) {
      assert.ok(classes.has(c), c);
    }
    assert.ok(!classes.has('has-notch'));
  }
}
console.log('PASS device script: quoted model names and both DOM injection timings (6 cases)');
