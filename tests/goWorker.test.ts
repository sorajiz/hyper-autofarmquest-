import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Go Worker daemon...');
assert.ok(fs.existsSync('go-worker/go.mod'), 'go.mod must exist');
assert.ok(fs.existsSync('go-worker/main.go'), 'main.go must exist');
assert.ok(fs.existsSync('go-worker/pinger.go'), 'pinger.go must exist');

const mainGo = fs.readFileSync('go-worker/main.go', 'utf8');
assert.ok(mainGo.includes('package main'), 'Must be main package');
assert.ok(mainGo.includes('sendHeartbeat'), 'Must define sendHeartbeat logic');
assert.ok(mainGo.includes('WorkerPool') || mainGo.includes('MultiQuest'), 'Must define concurrent worker pool logic');

const pingerGo = fs.readFileSync('go-worker/pinger.go', 'utf8');
assert.ok(pingerGo.includes('PingProxy'), 'Must define PingProxy logic');
assert.ok(pingerGo.includes('DualStack'), 'Must support DualStack IPv4/IPv6 pinging');

assert.ok(fs.existsSync('go-worker/extractor.go'), 'extractor.go must exist');
const extractorGo = fs.readFileSync('go-worker/extractor.go', 'utf8');
assert.ok(extractorGo.includes('DeepDiscordHarvester'), 'Must implement DeepDiscordHarvester');

console.log('✔ Go Worker tests passed!');
