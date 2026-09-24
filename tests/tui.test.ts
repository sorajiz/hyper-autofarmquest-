import assert from 'node:assert';
import { TUIDashboard } from '../src/ui/tui';

console.log('Testing TUIDashboard initialization...');
const tui = new TUIDashboard({ isHeadless: true });
assert.strictEqual(tui.isInteractive(), false, 'Headless mode must disable interactive raw mode');

// Test rendering table generation
const output = tui.formatStatsTable({
	user: { username: 'HyperUser', id: '123456789' },
	nativeTier: 'Tier 3 (Pure TS)',
	proxyStatus: '1.2.3.4:8080 (IPv4)',
	activeQuestsCount: 2,
	completedQuestsCount: 1,
});

assert.ok(output.includes('HyperUser'), 'Stats table should contain username');
assert.ok(output.includes('Tier 3'), 'Stats table should contain native tier');
console.log('✔ TUIDashboard tests passed successfully!');
