import assert from 'node:assert';
import { DynamicNativeLoader } from '../src/native/nativeLoader';

console.log('Testing DynamicNativeLoader...');
const engine = DynamicNativeLoader.getActiveEngine();

assert.ok(engine, 'Active engine must be defined');
assert.ok([1, 2, 3].includes(engine.tier), 'Engine tier must be 1, 2, or 3');
assert.ok(typeof engine.name === 'string', 'Engine name must be a string');
assert.strictEqual(engine.isAvailable(), true, 'Fallback or active engine must report available');

const statusInfo = DynamicNativeLoader.getStatusInfo();
assert.ok(statusInfo.includes('Tier'), 'Status info must mention active tier');
console.log(`✔ NativeLoader test passed! Active: ${statusInfo}`);
