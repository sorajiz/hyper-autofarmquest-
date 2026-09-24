import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing C++ Native Subsystem...');

assert.ok(fs.existsSync('native/helper/sleeper.cpp'), 'sleeper.cpp must exist');
assert.ok(fs.existsSync('native/addon/src/tls_fingerprint.cpp'), 'tls_fingerprint.cpp must exist');
assert.ok(fs.existsSync('native/addon/binding.gyp'), 'binding.gyp must exist');

const sleeperCpp = fs.readFileSync('native/helper/sleeper.cpp', 'utf8');
assert.ok(sleeperCpp.includes('discord-ipc-0'), 'sleeper.cpp must reference discord-ipc-0 named pipe');
assert.ok(sleeperCpp.includes('SET_ACTIVITY'), 'sleeper.cpp must implement SET_ACTIVITY opcode');

const addonCpp = fs.readFileSync('native/addon/src/tls_fingerprint.cpp', 'utf8');
assert.ok(addonCpp.includes('SpoofedFetch'), 'Must implement SpoofedFetch');
assert.ok(addonCpp.includes('TestProxySocket'), 'Must implement TestProxySocket');

console.log('✔ C++ Native Subsystem tests passed!');
