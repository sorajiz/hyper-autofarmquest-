import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { MarkterenceCompleter } from '../src/native/markterenceCompleter';

console.log('Testing MarkterenceCompleter module...');

// 1. Resolve Exe Name
const valExe = MarkterenceCompleter.resolveExeName('1098679090623692880', 'Valorant');
assert.strictEqual(valExe, 'VALORANT.exe', 'Should resolve Valorant executable');

const genshinExe = MarkterenceCompleter.resolveExeName('934278453472010260', 'Genshin Impact');
assert.strictEqual(genshinExe, 'GenshinImpact.exe', 'Should resolve Genshin executable');

// 2. Prepare Dummy Game Folder & Exe
const dummy = MarkterenceCompleter.prepareDummyGame('1098679090623692880', 'Valorant');
assert.ok(fs.existsSync(dummy.dir), 'Game folder must exist');
assert.ok(fs.existsSync(dummy.exePath), 'Dummy exe/script must exist');
assert.strictEqual(path.basename(dummy.exePath), 'VALORANT.exe', 'Executable name must match');

// 3. Launch and kill process safely
const { kill } = MarkterenceCompleter.launchDummyGame('1098679090623692880', 'Valorant', 5);
assert.strictEqual(typeof kill, 'function', 'Kill handle must be returned');
kill();

// 4. Cleanup
MarkterenceCompleter.cleanupGamesFolder();
console.log('✔ MarkterenceCompleter unit tests passed!');
