import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Go Worker daemon...');
assert.ok(fs.existsSync('go-worker/go.mod'), 'go.mod must exist');
assert.ok(fs.existsSync('go-worker/main.go'), 'main.go must exist');

const mainGo = fs.readFileSync('go-worker/main.go', 'utf8');
assert.ok(mainGo.includes('package main'), 'Must be main package');
assert.ok(mainGo.includes('sendHeartbeat'), 'Must define sendHeartbeat logic');
console.log('✔ Go Worker tests passed!');
