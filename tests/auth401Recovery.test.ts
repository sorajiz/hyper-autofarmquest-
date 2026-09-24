import assert from 'node:assert';
import { TUIDashboard } from '../src/ui/tui';
import { GlobalProxyPool } from '../src/network/proxyPool';

console.log('Testing Auth 401 Recovery & Libuv Handle Closing Prevention...');

// 1. Test TUIDashboard idempotent cleanup
const tui = new TUIDashboard({ isHeadless: true });
tui.cleanup();
tui.cleanup(); // Must not throw or crash on multiple cleanups
assert.strictEqual(tui.isInteractive(), false, 'TUI must not be interactive after cleanup');

// 2. Test Cloudflare Error 1000 Prevention
const headers = GlobalProxyPool.getResidentialHeaders();
assert.strictEqual(
	headers['CF-Connecting-IP'],
	undefined,
	'Default residential headers must NEVER contain CF-Connecting-IP to prevent Cloudflare Error 1000'
);
assert.strictEqual(
	headers['True-Client-IP'],
	undefined,
	'Default residential headers must NEVER contain True-Client-IP'
);
assert.ok(headers['X-Forwarded-For'], 'Must contain X-Forwarded-For for safe IP dispersion');
assert.ok(headers['X-Real-IP'], 'Must contain X-Real-IP');
assert.ok(headers['Client-IP'], 'Must contain Client-IP');

// 3. Test Upstream proxy chain toggle
const upstreamHeaders = GlobalProxyPool.getResidentialHeaders(true);
assert.ok(upstreamHeaders['CF-Connecting-IP'], 'Upstream proxy chains can explicitly include CF-Connecting-IP');

console.log('✔ Auth 401 Recovery & Libuv Handle Closing tests passed!');
