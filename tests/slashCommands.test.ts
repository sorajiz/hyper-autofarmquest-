import assert from 'node:assert';
import {
	BOT_SLASH_COMMANDS,
	buildFarmEmbedV2,
	buildHypeSquadEmbedV2,
	buildClaimEmbedV2,
	buildProxyEmbedV2,
	buildVaultEmbedV2,
	buildHelpEmbedV2,
	DiscordRemoteBot,
} from '../src/remote/discordBot';

console.log('Testing Bot Slash Commands, Messages & Anti-Dupe Engine...');

// 1. Verify BOT_SLASH_COMMANDS list
const cmdNames = BOT_SLASH_COMMANDS.map((c) => c.name);
assert.ok(cmdNames.includes('farm'), 'Should include /farm command');
assert.ok(cmdNames.includes('status'), 'Should include /status command');
assert.ok(cmdNames.includes('claim'), 'Should include /claim command');
assert.ok(cmdNames.includes('hypesquad'), 'Should include /hypesquad command');
assert.ok(cmdNames.includes('proxy'), 'Should include /proxy command');
assert.ok(cmdNames.includes('vault'), 'Should include /vault command');
assert.ok(cmdNames.includes('scan'), 'Should include /scan command');
assert.ok(cmdNames.includes('help'), 'Should include /help command');

// 2. Verify /hypesquad options
const hypesquadCmd = BOT_SLASH_COMMANDS.find((c) => c.name === 'hypesquad');
assert.ok(hypesquadCmd && hypesquadCmd.options, '/hypesquad must have options');
const houseOpt = hypesquadCmd.options.find((o) => o.name === 'house');
assert.ok(houseOpt && houseOpt.required, 'house option must be required');
assert.strictEqual(houseOpt.choices?.length, 4, 'house option should have 4 choices (Bravery, Brilliance, Balance, Leave)');

// 3. Test buildFarmEmbedV2
const farmPayload = buildFarmEmbedV2();
assert.ok(farmPayload.flags && (farmPayload.flags & (1 << 15)) !== 0, 'Farm payload should have IS_COMPONENTS_V2 flag');
assert.ok(farmPayload.embeds && farmPayload.embeds.length > 0, 'Farm payload should have Embed V2');
assert.strictEqual(farmPayload.embeds[0].color, 0x00f0ff, 'Farm embed color should be cyan (0x00f0ff)');

// 4. Test buildHypeSquadEmbedV2 for all houses
const braveryEmbed = buildHypeSquadEmbedV2(1, true, 'Test Bravery');
assert.strictEqual(braveryEmbed.embeds[0].color, 0x9b59b6, 'Bravery house color must be Purple (0x9b59b6)');
assert.ok(braveryEmbed.embeds[0].title.includes('BRAVERY'), 'Bravery embed title should include BRAVERY');

const brillianceEmbed = buildHypeSquadEmbedV2(2, true, 'Test Brilliance');
assert.strictEqual(brillianceEmbed.embeds[0].color, 0xf1c40f, 'Brilliance house color must be Gold (0xf1c40f)');

const balanceEmbed = buildHypeSquadEmbedV2(3, true, 'Test Balance');
assert.strictEqual(balanceEmbed.embeds[0].color, 0x2ecc71, 'Balance house color must be Emerald (0x2ecc71)');

// 5. Test buildClaimEmbedV2 & Proxy & Vault & Help
const claimEmbed = buildClaimEmbedV2(5);
assert.strictEqual(claimEmbed.embeds[0].color, 0xeb459e, 'Claim embed color must be Fuchsia (0xeb459e)');

const proxyEmbed = buildProxyEmbedV2({ healthy: 4, total: 4, ipv6Count: 2 }, '127.0.0.1:8080');
assert.ok(proxyEmbed.embeds[0].description.includes('Dual-Stack'), 'Proxy embed should mention Dual-Stack');

const vaultEmbed = buildVaultEmbedV2({ totalDiscoveredQuests: 10, entitlements: [1, 2], experimentsCount: 5 });
assert.ok(vaultEmbed.embeds[0].title.includes('VAULT'), 'Vault embed title should include VAULT');

const helpEmbed = buildHelpEmbedV2();
assert.ok(helpEmbed.embeds[0].title.includes('HƯỚNG DẪN') || helpEmbed.embeds[0].title.includes('ĐIỀU KHIỂN'), 'Help embed title should include guide');

// 6. Verify DiscordRemoteBot method signatures and Anti-Dupe
const remoteBot = new DiscordRemoteBot('dummy_token_for_test_1234567890123456', '123456789012345678');
assert.strictEqual(typeof remoteBot.deploySlashCommands, 'function', 'remoteBot must expose deploySlashCommands method');
assert.strictEqual(typeof remoteBot.logBotEvent, 'function', 'remoteBot must expose logBotEvent method');

// Test anti-dupe duplicate check
const isDupe1 = (remoteBot as any).isDuplicateInteraction('interaction_test_123');
assert.strictEqual(isDupe1, false, 'First interaction should not be marked as dupe');
const isDupe2 = (remoteBot as any).isDuplicateInteraction('interaction_test_123');
assert.strictEqual(isDupe2, true, 'Second identical interaction ID must be blocked as duplicate');

// Test user debounce check
const isDebounced1 = (remoteBot as any).isUserDebounced('user_123', 'click_farm', 500);
assert.strictEqual(isDebounced1, false, 'First click should not be debounced');
const isDebounced2 = (remoteBot as any).isUserDebounced('user_123', 'click_farm', 500);
assert.strictEqual(isDebounced2, true, 'Immediate rapid click must be debounced');

console.log('✔ Bot Slash Commands, Messages & Anti-Dupe Engine tests passed successfully!');
