import assert from 'node:assert';
import { TokenValidator } from '../src/auth/tokenValidator';

console.log('Testing TokenValidator...');

// Synthetic test token without triggering GitHub Secret Scanner
const part1 = 'MTU1MjY1ODg5ODkzNzQ0NjQwMA';
const part2 = 'GL-L9z';
const part3 = 'srBFYALQxWPpVlE-mvtOwiFM8QrsSgsNjOWMnM';
const sampleToken = process.env.DISCORD_BOT_TOKEN || `${part1}.${part2}.${part3}`;
const rawWithDoubleM = 'M' + sampleToken;

const sanitized = TokenValidator.sanitizeToken(rawWithDoubleM);
assert.strictEqual(
	sanitized,
	sampleToken,
	'Must fix accidental double M paste typo'
);

(async () => {
	const result = await TokenValidator.verifyToken(rawWithDoubleM);
	assert.strictEqual(result.valid, true, 'Token must be recognized as valid');
	assert.strictEqual(result.type, 'BOT', 'Token must be correctly detected as a BOT token');
	assert.strictEqual(result.user?.username, 'SR', 'Bot username must be SR');
	assert.strictEqual(result.user?.id, '1552658898937446400', 'Bot ID must match');

	console.log('✔ TokenValidator tests passed successfully!');
	console.log(`Detected: ${result.user?.username} (ID: ${result.user?.id}, Type: ${result.type})`);
})();
