import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing 1-Command Universal Launcher...');

assert.ok(fs.existsSync('start.ts'), 'start.ts must exist');
assert.ok(fs.existsSync('start.bat'), 'start.bat for Windows must exist');
assert.ok(fs.existsSync('start.sh'), 'start.sh for Linux/macOS must exist');

const startTs = fs.readFileSync('start.ts', 'utf8');
assert.ok(startTs.includes('Auto Hyper - Farm Orb'), 'start.ts must feature signature banner');
assert.ok(startTs.includes('1. Discord Remote Bot') || startTs.includes('Discord Remote Bot'), 'Must offer Option 1: Discord Remote Bot');
assert.ok(startTs.includes('2. Terminal') || startTs.includes('Terminal Interactive'), 'Must offer Option 2: Terminal Interactive');
assert.ok(startTs.includes('3. Localhost') || startTs.includes('Localhost Web'), 'Must offer Option 3: Localhost Web Control');

console.log('✔ Universal Launcher structure tests passed!');
