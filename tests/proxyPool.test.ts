import assert from 'node:assert';
import { ProxyPoolManager } from '../src/network/proxyPool';

console.log('Testing ProxyPoolManager...');
const pool = new ProxyPoolManager();

// Test adding IPv4 and IPv6 proxies
pool.addProxy('http://1.2.3.4:8080');
pool.addProxy('socks5://[2001:db8::1]:1080');
pool.addProxy('http://5.6.7.8:3128');

const stats = pool.getStats();
assert.strictEqual(stats.total, 3, 'Total proxies should be 3');
assert.strictEqual(stats.ipv6Count, 1, 'IPv6 count should be 1');

const p1 = pool.getHealthyProxy();
assert.ok(p1, 'Should get a healthy proxy');

// Test rotation
const p2 = pool.rotate();
assert.ok(p2, 'Rotated proxy should exist');

// Test markBad
pool.markBad(p1!.url, 5000);
assert.strictEqual(p1!.isBad, true, 'Proxy should be marked bad');
const afterBadStats = pool.getStats();
assert.strictEqual(afterBadStats.healthy, 2, 'Healthy count should decrement');

console.log('✔ ProxyPoolManager tests passed!');
