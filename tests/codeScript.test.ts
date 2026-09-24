import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing code.js syntax and completeness...');
const script = fs.readFileSync('code.js', 'utf8');
assert.ok(script.length > 1000, 'code.js should have content');
assert.ok(script.includes('Auto Hyper') || script.includes('Discord Quest'), 'code.js should have signature header');
assert.doesNotThrow(() => new Function(script), 'code.js must have valid JavaScript syntax');
console.log('✔ code.js syntax test passed!');
