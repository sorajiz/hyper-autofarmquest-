import assert from 'node:assert';
import { HiddenQuestsScanner, PLATFORM_MATRIX } from '../src/core/scanner';

console.log('Testing HiddenQuestsScanner platform matrix...');
assert.ok(Array.isArray(PLATFORM_MATRIX), 'Platform matrix should be an array');
assert.ok(PLATFORM_MATRIX.length >= 4, 'Should include Windows, Mac, Android, and Console profiles');

const win = PLATFORM_MATRIX.find((p) => p.os === 'Windows');
assert.ok(win, 'Windows platform profile must exist');
assert.strictEqual(typeof win!.superProperties, 'object');

console.log(`✔ HiddenQuestsScanner platform matrix verified (${PLATFORM_MATRIX.length} profiles)!`);
