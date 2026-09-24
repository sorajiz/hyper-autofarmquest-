import assert from 'node:assert';
import { startWebServer, generateDashboardHtml } from '../src/server/webServer';

console.log('Testing Standalone Localhost Web Server & Persistent Lifecycle...');

// 1. Test HTML generation
const html = generateDashboardHtml(3000);
assert.ok(html.includes('Auto Hyper - Farm Orb'), 'HTML must include title');
assert.ok(html.includes('QUEST MATRIX'), 'HTML must contain Quest Matrix');
assert.ok(html.includes('HYPESQUAD HOUSE SWITCHER'), 'HTML must contain HypeSquad switcher');

// 2. Test Server Startup and endpoints
(async () => {
	const testPort = 13000 + Math.floor(Math.random() * 500);
	const web = await startWebServer(testPort);

	assert.strictEqual(web.port, testPort, 'Server should listen on assigned port');
	assert.ok(web.url.includes(String(testPort)), 'Server URL should match assigned port');

	// Test GET /
	const resIndex = await fetch(web.url);
	assert.strictEqual(resIndex.status, 200, 'GET / should return 200 OK');
	const indexText = await resIndex.text();
	assert.ok(indexText.includes('MISSION CONTROL'), 'Response should be Dashboard HTML');

	// Test GET /api/status
	const resStatus = await fetch(`${web.url}/api/status`);
	assert.strictEqual(resStatus.status, 200, 'GET /api/status should return 200 OK');
	const statusJson = await resStatus.json();
	assert.strictEqual(statusJson.status, 'ONLINE', 'API status should be ONLINE');

	// Test POST /api/farm
	const resFarm = await fetch(`${web.url}/api/farm`, { method: 'POST' });
	assert.strictEqual(resFarm.status, 200, 'POST /api/farm should return 200 OK');

	// Clean shutdown
	await web.stop();
	console.log('✔ Standalone Localhost Web Server tests passed successfully!');
})();
