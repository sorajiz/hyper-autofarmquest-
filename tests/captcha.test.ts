import assert from 'node:assert';
import { CaptchaPipeline } from '../src/security/captcha';

console.log('Testing CaptchaPipeline...');
const sampleDiscord400 = {
	captcha_key: ['response_is_invalid'],
	captcha_sitekey: 'f5561ba9-8f1e-40ca-9b5b-a0b3f719ef34',
	captcha_service: 'hcaptcha',
	captcha_rqdata: 'dGVzdF9ycWRhdGE=',
};

assert.strictEqual(CaptchaPipeline.isChallenge(400, sampleDiscord400), true, 'Should detect captcha challenge on HTTP 400');
assert.strictEqual(CaptchaPipeline.isChallenge(200, sampleDiscord400), false, 'Should ignore HTTP 200');

const challenge = CaptchaPipeline.extractChallenge(sampleDiscord400);
assert.ok(challenge, 'Challenge should be extracted');
assert.strictEqual(challenge!.sitekey, 'f5561ba9-8f1e-40ca-9b5b-a0b3f719ef34');
assert.strictEqual(challenge!.service, 'hcaptcha');

console.log('✔ CaptchaPipeline detection tests passed!');
