import assert from 'node:assert';
import fs from 'node:fs';
import { DiscordQuestSchema, AllQuestsResponseSchema } from '../src/types/schemas';
import { createAxiosDiscordClient } from '../src/network/axiosClient';

console.log('Testing integration of most popular language modules...');

// 1. Test TypeScript Zod schema validation
const rawValidQuest = {
	id: 'quest_zod_test_123',
	config: {
		expires_at: '2026-12-31T23:59:59Z',
		messages: {
			quest_name: 'Zod Validated Quest',
			game_publisher: 'Discord Nitro Partner',
		},
	},
	user_status: {
		enrolled_at: '2026-09-24T00:00:00Z',
		completed_at: null,
		claimed_at: null,
		progress: {
			PLAY_ON_DESKTOP: { value: 600 },
		},
	},
};

const validated = DiscordQuestSchema.parse(rawValidQuest);
assert.strictEqual(validated.id, 'quest_zod_test_123');
assert.strictEqual(validated.config.messages.quest_name, 'Zod Validated Quest');

// 2. Test TypeScript Axios Client integration
const axiosClient = createAxiosDiscordClient('test_token_xyz');
assert.ok(axiosClient, 'Axios client must be initialized');
assert.strictEqual(axiosClient.defaults.baseURL, 'https://discord.com/api/v9');

// 3. Test Python Popular Modules in requirements.txt & app.py
const pyReqs = fs.readFileSync('python-service/requirements.txt', 'utf8');
assert.ok(pyReqs.includes('httpx'), 'Python requirements must include httpx');
assert.ok(pyReqs.includes('rich'), 'Python requirements must include rich');
assert.ok(pyReqs.includes('loguru'), 'Python requirements must include loguru');
assert.ok(pyReqs.includes('tenacity'), 'Python requirements must include tenacity');

const pyApp = fs.readFileSync('python-service/app.py', 'utf8');
assert.ok(pyApp.includes('httpx'), 'Python app.py must import httpx');
assert.ok(pyApp.includes('network_probe'), 'Python app.py must have network_probe endpoint');

// 4. Test Rust Popular Crates in Cargo.toml
const rustCargo = fs.readFileSync('rust-engine/Cargo.toml', 'utf8');
assert.ok(rustCargo.includes('tokio'), 'Rust Cargo.toml must include tokio');
assert.ok(rustCargo.includes('reqwest'), 'Rust Cargo.toml must include reqwest');
assert.ok(rustCargo.includes('colored'), 'Rust Cargo.toml must include colored');
assert.ok(rustCargo.includes('log'), 'Rust Cargo.toml must include log');

// 5. Test Go Popular Packages in go.mod
const goMod = fs.readFileSync('go-worker/go.mod', 'utf8');
assert.ok(goMod.includes('github.com/go-resty/resty/v2'), 'Go go.mod must include resty');
assert.ok(goMod.includes('go.uber.org/zap'), 'Go go.mod must include zap');
assert.ok(goMod.includes('github.com/fatih/color'), 'Go go.mod must include color');

// 6. Test C# Popular Packages in HyperQuestRunner.csproj
const csProj = fs.readFileSync('csharp-runner/HyperQuestRunner.csproj', 'utf8');
assert.ok(csProj.includes('Spectre.Console'), 'C# project must include Spectre.Console');
assert.ok(csProj.includes('Microsoft.Extensions.Logging'), 'C# project must include Microsoft.Extensions.Logging');

console.log('✔ All popular language modules verified successfully across TS, Python, Rust, Go, and C#!');
