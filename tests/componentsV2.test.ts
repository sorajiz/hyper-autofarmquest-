import assert from 'node:assert';
import { buildComponentsV2Payload } from '../src/remote/discordBot';

console.log('Testing Discord Components V2 Payload Builder...');
const payload = buildComponentsV2Payload({
	username: 'HyperUser',
	userId: '123456789',
	activeQuests: 2,
	completedQuests: 1,
	orbsCount: 150,
	proxyStatus: '1.2.3.4:8080 (IPv4)',
});

assert.ok(payload.flags && (payload.flags & (1 << 15)) !== 0, 'Payload must include IS_COMPONENTS_V2 flag (1 << 15)');
assert.ok(Array.isArray(payload.components), 'Payload must contain components array');
assert.ok(payload.components.length > 0, 'Components array should not be empty');

console.log('✔ Discord Components V2 Payload test passed!');
