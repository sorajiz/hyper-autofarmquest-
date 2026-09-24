import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { UltraDiscordExtractor, AccountAuditReport } from '../src/core/ultraExtractor';
import { ClientQuest } from '../src/client';

console.log('Testing Ultra Discord API Extractor & Vault Harvester...');

// 1. Verify file structures
assert.ok(fs.existsSync('src/core/ultraExtractor.ts'), 'src/core/ultraExtractor.ts must exist');
assert.ok(fs.existsSync('go-worker/extractor.go'), 'go-worker/extractor.go must exist');
assert.ok(fs.existsSync('rust-engine/src/extractor.rs'), 'rust-engine/src/extractor.rs must exist');

// 2. Verify Go Harvester content
const goExtractor = fs.readFileSync('go-worker/extractor.go', 'utf8');
assert.ok(goExtractor.includes('DeepDiscordHarvester'), 'Go must declare DeepDiscordHarvester');
assert.ok(goExtractor.includes('ExecuteDeepHarvest'), 'Go must implement ExecuteDeepHarvest');
assert.ok(goExtractor.includes('/users/@me/entitlements'), 'Go must probe entitlements');
assert.ok(goExtractor.includes('/experiments'), 'Go must probe experiments');

// 3. Verify Rust Parser content
const rustExtractor = fs.readFileSync('rust-engine/src/extractor.rs', 'utf8');
assert.ok(rustExtractor.includes('RustDiscordParser'), 'Rust must declare RustDiscordParser');
assert.ok(rustExtractor.includes('VaultAuditReport'), 'Rust must define VaultAuditReport');
assert.ok(rustExtractor.includes('audit_vault'), 'Rust must implement audit_vault');

// 4. Test UltraDiscordExtractor with mock ClientQuest
const mockClient = new ClientQuest('mock_test_token_123456');

// Mock rest.get responses
(mockClient.rest as any).get = async (endpoint: string, options?: any) => {
	if (endpoint === '/users/@me') {
		return { id: '998877665544', username: 'HyperTester', discriminator: '0001', flags: 64 };
	}
	if (endpoint === '/quests/@me') {
		return {
			quests: [
				{
					id: 'quest_test_active_1',
					config: {
						expires_at: '2026-10-01T00:00:00Z',
						messages: {
							quest_name: 'Super Nitro Boost Quest',
							game_publisher: 'Discord Inc',
						},
						task_config: {
							tasks: {
								STREAM_ON_DESKTOP: {
									target: 900,
								},
							},
						},
						rewards_config: {
							rewards: [
								{ messages: { name: 'Exclusive Avatar Decoration' } },
							],
						},
					},
					user_status: {
						enrolled_at: '2026-09-20T00:00:00Z',
						completed_at: null,
						claimed_at: null,
						progress: {
							STREAM_ON_DESKTOP: { value: 450 },
						},
					},
				},
				{
					id: 'quest_test_claimable_2',
					config: {
						expires_at: '2026-10-01T00:00:00Z',
						messages: {
							quest_name: 'Valorant Champions Claim Quest',
							game_publisher: 'Riot Games',
						},
						task_config: {
							tasks: {
								PLAY_ON_DESKTOP: {
									target: 900,
								},
							},
						},
						rewards_config: {
							rewards: [
								{ messages: { name: 'Valorant Gun Buddy Code' } },
							],
						},
					},
					user_status: {
						enrolled_at: '2026-09-20T00:00:00Z',
						completed_at: '2026-09-21T00:00:00Z',
						claimed_at: null, // Ready to claim!
						progress: {
							PLAY_ON_DESKTOP: { value: 900 },
						},
					},
				},
			],
			quest_enrollment_blocked_until: null,
			quest_access_suspended_until: null,
		};
	}
	if (endpoint === '/users/@me/entitlements') {
		return [
			{ id: 'ent_1', sku_id: 'sku_nitro_1', type: 1, consumed: false },
			{ id: 'ent_2', promotion_id: 'promo_xbox_gamepass', type: 2, consumed: true },
		];
	}
	if (endpoint === '/experiments') {
		return {
			assignments: [
				['quest_orb_harvesting_v2', 1],
				['quest_video_reward_pipeline', 2],
			],
		};
	}
	if (endpoint === '/users/@me/connections') {
		return [
			{ type: 'xbox', name: 'GamerTag123' },
			{ type: 'playstation', name: 'PSN_ID_456' },
		];
	}
	return {};
};

async function runTest() {
	const extractor = new UltraDiscordExtractor(mockClient);
	const report: AccountAuditReport = await extractor.extractAll();

	assert.strictEqual(report.user.username, 'HyperTester');
	assert.strictEqual(report.user.id, '998877665544');
	assert.strictEqual(report.activeQuests.length, 2, 'Should have 2 active quests');
	assert.strictEqual(report.claimableRewards.length, 1, 'Should have 1 claimable reward');
	assert.strictEqual(report.claimableRewards[0].id, 'quest_test_claimable_2');
	assert.strictEqual(report.entitlements.length, 2, 'Should have 2 entitlements');
	assert.strictEqual(report.experimentsCount, 2, 'Should have 2 experiments');
	assert.strictEqual(report.connections.length, 2, 'Should have 2 connections');
	assert.strictEqual(report.security.riskTier, 'LOW', 'Risk tier should be LOW');

	// Test exportVaultAudit
	const testVaultDir = './test_vault_tmp';
	const savedPath = await extractor.exportVaultAudit(report, testVaultDir);
	assert.ok(fs.existsSync(savedPath), 'Saved vault file must exist');

	const savedContent = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
	assert.strictEqual(savedContent.user.username, 'HyperTester');
	assert.strictEqual(savedContent.entitlements.length, 2);

	// Cleanup test folder
	fs.rmSync(testVaultDir, { recursive: true, force: true });

	console.log('✔ Ultra Discord API Extractor & Vault tests passed successfully!');
}

runTest().catch((err) => {
	console.error('Test failed:', err);
	process.exit(1);
});
