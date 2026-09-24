import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Web Dashboard structure...');
assert.ok(fs.existsSync('web-dashboard/package.json'), 'package.json must exist');
assert.ok(fs.existsSync('web-dashboard/src/app/page.tsx'), 'page.tsx must exist');
assert.ok(fs.existsSync('web-dashboard/src/app/globals.css'), 'globals.css must exist');

const page = fs.readFileSync('web-dashboard/src/app/page.tsx', 'utf8');
assert.ok(page.includes('Auto Hyper - Farm Orb'), 'Page must contain signature title');
assert.ok(page.includes('Orbs'), 'Page must feature Orbs counter');
console.log('✔ Web Dashboard tests passed!');
