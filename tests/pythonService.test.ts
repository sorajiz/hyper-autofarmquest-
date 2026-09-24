import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Python Service files...');
assert.ok(fs.existsSync('python-service/requirements.txt'), 'requirements.txt must exist');
assert.ok(fs.existsSync('python-service/app.py'), 'app.py must exist');

const appPy = fs.readFileSync('python-service/app.py', 'utf8');
assert.ok(appPy.includes('FastAPI'), 'Must use FastAPI');
assert.ok(appPy.includes('/api/quests'), 'Must expose /api/quests');
assert.ok(appPy.includes('/ws/live'), 'Must expose /ws/live WebSocket');
console.log('✔ Python Service tests passed!');
