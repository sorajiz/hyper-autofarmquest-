import assert from 'node:assert';
import { renderBanner } from '../src/ui/banner';

console.log('Testing renderBanner()...');
const banner = renderBanner();
assert.ok(typeof banner === 'string', 'Banner must be a string');
assert.ok(banner.length > 50, 'Banner content should not be empty');
assert.ok(banner.includes('Hyper') || banner.includes('Orb'), 'Banner text should include signature words');
console.log('✔ Banner test passed successfully!');
