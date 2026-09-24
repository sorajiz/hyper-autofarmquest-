import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Vue 3 Dashboard (VUT) project...');

assert.ok(fs.existsSync('vue-dashboard/package.json'), 'package.json must exist in vue-dashboard');
assert.ok(fs.existsSync('vue-dashboard/index.html'), 'index.html must exist in vue-dashboard');
assert.ok(fs.existsSync('vue-dashboard/src/App.vue'), 'App.vue must exist in vue-dashboard');

const pkg = JSON.parse(fs.readFileSync('vue-dashboard/package.json', 'utf8'));
assert.ok(pkg.dependencies.vue, 'Must depend on vue');
assert.ok(pkg.devDependencies.vite, 'Must depend on vite');

const appVue = fs.readFileSync('vue-dashboard/src/App.vue', 'utf8');
assert.ok(appVue.includes('Auto Hyper - Farm Orb'), 'App.vue must include signature title');
assert.ok(appVue.includes('Orbs'), 'App.vue must include Orbs counter');
assert.ok(appVue.includes('Markterence'), 'App.vue must include Markterence integration');

console.log('✔ Vue 3 Dashboard (VUT) tests passed!');
