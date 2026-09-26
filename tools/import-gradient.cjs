// Adapt the supplied TypeScript engine to this dependency-free web application.
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const input = fs.readFileSync(process.argv[2], 'utf8');
let source = input.slice(input.indexOf('function normalizeColor'), input.indexOf('interface GradientWaveProps'));
source = source.replace(/\.join\("\r?\n"\)/g, '.join("\\n")');
source = source.replace('antialias: true', 'antialias: false, depth: false, alpha: false');
source = source.replace('if (this.target === context.ARRAY_BUFFER) {', 'if (this.target === context.ARRAY_BUFFER && n >= 0) {');
source = source.replace('if (this.target === context.ARRAY_BUFFER) {', 'if (this.target === context.ARRAY_BUFFER && e >= 0) {');
source = source.replace('window.addEventListener("resize", () => this.resize());', '');
source = source.replace('position.y + tilt + incline + noise - offset', 'position.y');
// Preserve the supplied simplex-noise color waves but cover the full viewport.
source = source.replace('context.linkProgram(material.program);', `context.linkProgram(material.program);
        (context.getAttachedShaders(material.program) || []).forEach(shader => {
          context.detachShader(material.program, shader);
          context.deleteShader(shader);
        });`);
source = source.replace('Math.ceil(width * 0.02)', 'Math.min(48, Math.ceil(width * 0.025))');
source = source.replace('Math.ceil(height * 0.05)', 'Math.min(64, Math.ceil(height * 0.04))');
source = source.replace('this.isPlaying = true;', 'if (this.isPlaying) return;\n    this.last = performance.now();\n    this.isPlaying = true;');
fs.writeFileSync('gradient-wave.js', '/* Adapted from the user-supplied GradientWave / MiniGl component. */\n' + stripTypeScriptTypes(source));
