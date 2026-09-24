import assert from 'node:assert';
import { DiscordRemoteBot } from '../src/remote/discordBot';

console.log('Testing DiscordRemoteBot state...');
const botWithoutToken = new DiscordRemoteBot('');
assert.strictEqual(botWithoutToken.isEnabled(), false, 'Bot should be disabled if token is empty');

const botWithToken = new DiscordRemoteBot('dummy_token_12345678901234567890');
assert.strictEqual(botWithToken.isEnabled(), true, 'Bot should report enabled when token is provided');

console.log('✔ DiscordRemoteBot state tests passed!');
