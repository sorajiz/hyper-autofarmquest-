import assert from 'node:assert';
import { ProxyPoolManager, GlobalProxyPool } from '../src/network/proxyPool';

console.log('Testing ProxyPoolManager...');

// 1. Test clean pool with IPv4 and IPv6 proxies
const pool = new ProxyPoolManager([], { autoSeedVirtual: false });
pool.addProxy('http://1.2.3.4:8080');
pool.addProxy('socks5://[2001:db8::1]:1080');
pool.addProxy('http://5.6.7.8:3128');

const stats = pool.getStats();
assert.strictEqual(stats.total, 3, 'Total proxies should be 3');
assert.strictEqual(stats.ipv6Count, 1, 'IPv6 count should be 1');

const p1 = pool.getHealthyProxy();
assert.ok(p1, 'Should get a healthy proxy');

// 2. Test rotation
const p2 = pool.rotate();
assert.ok(p2, 'Rotated proxy should exist');

// 3. Test markBad
pool.markBad(p1!.url, 5000);
assert.strictEqual(p1!.isBad, true, 'Proxy should be marked bad');
const afterBadStats = pool.getStats();
assert.strictEqual(afterBadStats.healthy, 2, 'Healthy count should decrement');

// 4. Test handleRateLimit (HTTP 429)
const activeBeforeRateLimit = pool.getHealthyProxy();
assert.ok(activeBeforeRateLimit, 'Should have active proxy before 429');
const nextProxy = pool.handleRateLimit(activeBeforeRateLimit!.url, 15000);
assert.ok(nextProxy, 'Should immediately rotate to next proxy upon 429');
assert.strictEqual(activeBeforeRateLimit!.isBad, true, 'Rate-limited proxy must be temporarily locked');

// 5. Test Adaptive Jitter (1.5s - 3.5s)
for (let i = 0; i < 50; i++) {
	const jitter = pool.getAdaptiveJitter(1500, 3500);
	assert.ok(jitter >= 1500, `Jitter ${jitter} must be >= 1500ms`);
	assert.ok(jitter <= 3600, `Jitter ${jitter} must be <= 3600ms`);
}

// 6. Test Protocol Fallback (SOCKS5 -> HTTPS -> HTTP)
const socksEntry = {
	url: 'socks5://1.1.1.1:1080',
	protocol: 'socks5:' as const,
	host: '1.1.1.1',
	port: 1080,
	isIPv6: false,
	failCount: 0,
	isBad: false,
	badUntil: 0,
};
const httpsFallback = pool.getProtocolFallback(socksEntry);
assert.strictEqual(httpsFallback.protocol, 'https:', 'SOCKS5 must fallback to HTTPS');
const httpFallback = pool.getProtocolFallback(httpsFallback);
assert.strictEqual(httpFallback.protocol, 'http:', 'HTTPS must fallback to HTTP');

// 7. Test Residential IP ("IP Chung Cư") & Headers Generator
const resIP = pool.getRandomResidentialIP();
assert.ok(resIP.ip, 'Residential IP must be generated');
assert.ok(resIP.isp, 'ISP must be identified');

const resHeaders = pool.getResidentialHeaders();
assert.ok(resHeaders['X-Forwarded-For'], 'Must generate X-Forwarded-For header');
assert.ok(resHeaders['X-Real-IP'], 'Must generate X-Real-IP header');
assert.ok(resHeaders['Client-IP'], 'Must generate Client-IP header');

const cfHeaders = pool.getResidentialHeaders(true);
assert.ok(cfHeaders['CF-Connecting-IP'], 'Must generate CF-Connecting-IP header when enabled');

// 8. Test GlobalProxyPool auto-seeded fallback (so users don't need to buy proxies)
const globalStats = GlobalProxyPool.getStats();
assert.ok(globalStats.total > 0, 'GlobalProxyPool should have auto-seeded gateways');
assert.ok(GlobalProxyPool.getHealthyProxy(), 'GlobalProxyPool must provide ready-to-use proxy');

console.log('✔ ProxyPoolManager tests passed!');
