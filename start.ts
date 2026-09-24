import readline from 'node:readline';
import { spawn } from 'node:child_process';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { renderBanner } from './src/ui/banner';
import { ClientQuest } from './src/client';
import { UltraDiscordExtractor } from './src/core/ultraExtractor';
import { TokenValidator } from './src/auth/tokenValidator';

const tsxCli = require.resolve('tsx/cli');

async function promptUser(questionText: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise((resolve) => {
		rl.question(questionText, (answer) => {
			rl.close();
			try {
				if (process.stdin.isTTY && typeof process.stdin.setRawMode === 'function') {
					process.stdin.setRawMode(false);
				}
			} catch {}
			try {
				process.stdin.pause();
			} catch {}
			resolve(answer.trim());
		});
	});
}

function openBrowser(url: string) {
	const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
	try {
		spawn(startCmd, [url], { shell: true, stdio: 'ignore' }).unref();
	} catch {}
}

async function main() {
	console.clear();
	// Signature ASCII Banner: Auto Hyper - Farm Orb
	renderBanner();

	const sep = chalk.hex('#1E293B')('─'.repeat(70));
	console.log(sep);
	console.log(chalk.hex('#00F0FF').bold('  [SYSTEM CONTROL]  ') + chalk.hex('#F8FAFC').bold('UNIVERSAL MISSION CONTROL // V3.2.0'));
	console.log(chalk.hex('#64748B')('  Architectural Polyglot Matrix • Dynamic Native Engine • Dual-Stack'));
	console.log(sep + '\n');

	// Parse command line arguments for non-interactive / headless / container runs
	const args = process.argv.slice(2);
	let selectedMode = '';
	for (const arg of args) {
		if (arg.startsWith('--mode=')) selectedMode = arg.split('=')[1];
		else if (arg === '--bot' || arg === '-b') selectedMode = '1';
		else if (arg === '--terminal' || arg === '--tui' || arg === '-t') selectedMode = '2';
		else if (arg === '--web' || arg === '--localhost' || arg === '-w') selectedMode = '3';
		else if (arg === '--headless') selectedMode = '2';
	}

	if (!selectedMode) {
		console.log(chalk.hex('#94A3B8').bold('SELECT RUNTIME TARGET:'));
		console.log(
			chalk.hex('#5865F2').bold('  [1] Discord Remote Bot') + 
			chalk.hex('#64748B')('     (Slash Commands & Components V2 Container Interface)')
		);
		console.log(
			chalk.hex('#00F0FF').bold('  [2] Terminal Interactive') + 
			chalk.hex('#64748B')('   (Real-time TUI Matrix, Live Telemetry & Quick Hotkeys)')
		);
		console.log(
			chalk.hex('#00D26A').bold('  [3] Localhost Web Dashboard') + 
			chalk.hex('#64748B')(' (Adaptive Browser UI, WebSocket Stream & Orbs Counter)')
		);
		console.log(
			chalk.hex('#EC4899').bold('  [4] Ultra Deep API Extractor') + 
			chalk.hex('#64748B')('(Multi-Platform Vault Probe, Entitlements & Experiments)')
		);
		console.log('');

		const choice = await promptUser(
			chalk.hex('#F8FAFC').bold('▸ Input target selection [1, 2, 3, 4] (Default: 2): ')
		);
		selectedMode = choice.trim() || '2';
	}

	if (selectedMode === '1') {
		// ==========================================
		// CHẾ ĐỘ 1: DISCORD REMOTE BOT
		// ==========================================
		console.log(chalk.hex('#5865F2').bold('\n[MODE 1: DISCORD REMOTE BOT INITIALIZING]'));
		let botToken = process.env.DISCORD_BOT_TOKEN?.trim();

		if (!botToken || botToken.length < 20) {
			const candidate = TokenValidator.sanitizeToken(process.env.TOKEN || '');
			const check = await TokenValidator.verifyToken(candidate);
			if (check.type === 'BOT') {
				botToken = check.token;
				TokenValidator.syncTokenToEnv('DISCORD_BOT_TOKEN', botToken);
				console.log(chalk.hex('#00D26A')(`[AUTO-DETECT] Đã tự động nhận diện Bot "${check.user?.username}" (ID: ${check.user?.id})!`));
			} else {
				console.log(chalk.hex('#F59E0B')('[CONFIG] DISCORD_BOT_TOKEN not detected in environment.'));
				botToken = await promptUser(chalk.hex('#00F0FF')('▸ Enter Discord Bot Token: '));
				if (!botToken) {
					console.log(chalk.hex('#EF4444')('[ERROR] Bot Token is required to continue.'));
					process.exit(1);
				}
				botToken = TokenValidator.sanitizeToken(botToken);
				TokenValidator.syncTokenToEnv('DISCORD_BOT_TOKEN', botToken);
			}
			process.env.DISCORD_BOT_TOKEN = botToken;
		}

		// Prompt for optional Guild ID for 0-second instant slash command deployment
		let guildId = process.env.DISCORD_GUILD_ID?.trim() || '';
		console.log(chalk.hex('#00F0FF')('\n[INSTANT DEPLOYMENT] Guild ID (Tùy chọn - Đăng ký Slash Commands ngay lập tức 0s):'));
		console.log(chalk.hex('#64748B')('▸ Nhập Guild ID (Server ID) để lệnh xuất hiện NGAY LẬP TỨC trong server đó.'));
		console.log(chalk.hex('#64748B')('▸ Hoặc nhấn Enter để bỏ qua (sẽ đăng ký Global cho mọi server).'));
		const guildInput = await promptUser(
			chalk.hex('#F8FAFC').bold(`▸ Enter Target Guild ID [Nhấn Enter để bỏ qua] ${guildId ? `(Hiện tại: ${guildId})` : ''}: `)
		);
		if (guildInput) {
			guildId = guildInput.trim();
			process.env.DISCORD_GUILD_ID = guildId;
			TokenValidator.syncTokenToEnv('DISCORD_GUILD_ID', guildId);
			console.log(chalk.hex('#00D26A')(`✔ Đã lưu Guild ID: ${guildId} -> Slash commands sẽ deploy NGAY LẬP TỨC (0s delay)!`));
		} else if (guildId) {
			console.log(chalk.hex('#00D26A')(`✔ Tiếp tục dùng Guild ID cấu hình sẵn: ${guildId}`));
		} else {
			console.log(chalk.hex('#94A3B8')('ℹ Bỏ qua Guild ID -> Slash commands sẽ deploy chế độ Global.'));
		}

		console.log(chalk.hex('#00D26A')('[OK] Bot credentials loaded. Launching Discord Gateway service...'));
		const botProcess = spawn(process.execPath, [tsxCli, 'bot.ts', '--remote-only'], {
			stdio: 'inherit',
			env: { ...process.env, DISCORD_BOT_TOKEN: botToken, DISCORD_GUILD_ID: guildId },
		});
		botProcess.on('exit', (code) => {
			process.exitCode = code ?? 0;
		});
	} else if (selectedMode === '3') {
		// ==========================================
		// CHẾ ĐỘ 3: LOCALHOST WEB DASHBOARD
		// ==========================================
		console.log(chalk.hex('#00D26A').bold('\n[MODE 3: LOCALHOST WEB DASHBOARD INITIALIZING]'));
		const port = process.env.PORT || '3000';
		const targetUrl = `http://localhost:${port}`;
		console.log(chalk.hex('#94A3B8')(`[NETWORK] Target Web Interface: ${chalk.hex('#00F0FF').underline(targetUrl)}`));

		const webDir = path.resolve(process.cwd(), 'web-dashboard');
		const runner = fs.existsSync(webDir)
			? spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
					cwd: webDir,
					stdio: 'inherit',
					shell: true,
				})
			: spawn(process.execPath, [tsxCli, 'bot.ts', '--headless'], {
					stdio: 'inherit',
				});

		setTimeout(() => {
			console.log(chalk.hex('#00D26A')(`[DISPATCH] Opening default web browser at ${targetUrl}...`));
			openBrowser(targetUrl);
		}, 2500);

		runner.on('exit', (code: any) => {
			process.exitCode = code ?? 0;
		});
	} else if (selectedMode === '4') {
		// ==========================================
		// CHẾ ĐỘ 4: ULTRA DEEP API EXTRACTOR & VAULT DUMP
		// ==========================================
		console.log(chalk.hex('#EC4899').bold('\n[MODE 4: ULTRA DEEP DISCORD API HARVESTER]'));
		let userToken = process.env.TOKEN?.trim();

		if (!userToken || userToken === 'your_discord_token_here' || userToken === 'your_discord_user_token') {
			userToken = await promptUser(chalk.hex('#00F0FF')('▸ Enter Discord User Token to extract vault: '));
			if (!userToken) {
				console.log(chalk.hex('#EF4444')('[ERROR] User token is required.'));
				process.exit(1);
			}
		}

		console.log(chalk.hex('#00F0FF')('⚡ Connecting to Discord API with multi-platform matrix & TLS spoofing...'));
		const client = new ClientQuest(userToken);
		const extractor = new UltraDiscordExtractor(client);

		try {
			console.log(chalk.hex('#5865F2')('🔍 Probing Quests, Entitlements, Experiments, and Console Matrix...'));
			const report = await extractor.extractAll();
			const savedPath = await extractor.exportVaultAudit(report);

			console.log(chalk.hex('#00D26A').bold('\n✔ ULTRA HARVEST COMPLETED SUCCESSFULLY!'));
			console.log(chalk.hex('#1E293B')('─'.repeat(70)));
			console.log(chalk.hex('#F8FAFC').bold(`  [TARGET USER]       : `) + chalk.hex('#00F0FF')(`${report.user.username} (${report.user.id})`));
			console.log(chalk.hex('#F8FAFC').bold(`  [ACTIVE QUESTS]     : `) + chalk.hex('#5865F2')(`${report.activeQuests.length}`));
			console.log(chalk.hex('#F8FAFC').bold(`  [HIDDEN / UNLISTED] : `) + chalk.hex('#F59E0B')(`${report.hiddenQuests.length}`));
			console.log(chalk.hex('#F8FAFC').bold(`  [ENTITLEMENTS KEYS] : `) + chalk.hex('#EC4899')(`${report.entitlements.length} keys/rewards acquired`));
			console.log(chalk.hex('#F8FAFC').bold(`  [EXPERIMENTS FOUND] : `) + chalk.hex('#00D26A')(`${report.experimentsCount} feature flags`));
			console.log(chalk.hex('#F8FAFC').bold(`  [RISK TIER]         : `) + chalk.hex(report.security.riskTier === 'LOW' ? '#00D26A' : '#EF4444')(`${report.security.riskTier}`));
			console.log(chalk.hex('#F8FAFC').bold(`  [LATENCY / TIME]    : `) + chalk.hex('#94A3B8')(`${report.scanDurationMs}ms`));
			console.log(chalk.hex('#1E293B')('─'.repeat(70)));
			console.log(chalk.hex('#00F0FF')(`💾 Full Vault Audit written to: ${path.resolve(savedPath)}\n`));
		} catch (err: any) {
			console.error(chalk.hex('#EF4444')('❌ Extraction failed:'), err?.message || err);
		}
		process.exit(0);
	} else {
		// ==========================================
		// CHẾ ĐỘ 2: TERMINAL INTERACTIVE TUI
		// ==========================================
		console.log(chalk.hex('#00F0FF').bold('\n[MODE 2: TERMINAL INTERACTIVE TUI INITIALIZING]'));
		let rawUserToken = process.env.TOKEN?.trim() || '';
		let userToken = TokenValidator.sanitizeToken(rawUserToken);

		if (userToken && userToken.length > 20) {
			const check = await TokenValidator.verifyToken(userToken);
			if (check.type === 'BOT') {
				TokenValidator.syncTokenToEnv('DISCORD_BOT_TOKEN', check.token);
				console.log(chalk.hex('#F59E0B').bold(`\n🤖 PHÁT HIỆN: Token trong .env là DISCORD BOT TOKEN (Bot "${check.user?.username}" - ID: ${check.user?.id})`));
				console.log(chalk.hex('#00D26A')(`✔ Đã tự động đồng bộ sang DISCORD_BOT_TOKEN trong file .env!`));
				console.log(chalk.hex('#94A3B8')('LƯU Ý: Bot dùng để nhận lệnh Slash Commands ở Chế độ 1.'));
				console.log(chalk.hex('#94A3B8')('Để cày nhiệm vụ Discord Quests (nhận quà game/Nitro/Orbs về nick cá nhân), Discord yêu cầu USER TOKEN.\n'));
				console.log(chalk.hex('#00F0FF').bold('BẠN MUỐN:'));
				console.log(chalk.hex('#5865F2').bold('  [1] Khởi chạy ngay Chế độ 1 (Discord Remote Bot "SR")'));
				console.log(chalk.hex('#00D26A').bold('  [2] Nhập User Token (Lấy nhanh trong 1 giây) để cày quest'));
				console.log('');
				const subChoice = await promptUser(chalk.hex('#F8FAFC').bold('▸ Nhập lựa chọn [1 hoặc 2] (Default: 1): '));
				if (subChoice.trim() !== '2') {
					console.log(chalk.hex('#00D26A')('[OK] Khởi chạy Chế độ 1: Discord Remote Bot...'));
					const botProcess = spawn(process.execPath, [tsxCli, 'bot.ts', '--remote-only'], {
						stdio: 'inherit',
						env: { ...process.env, DISCORD_BOT_TOKEN: check.token },
					});
					botProcess.on('exit', (code) => {
						process.exitCode = code ?? 0;
					});
					return;
				}
				userToken = '';
			}
		}

		if (!userToken || userToken === 'your_discord_token_here' || userToken === 'your_discord_user_token') {
			console.log(chalk.hex('#F59E0B')('[CONFIG] User TOKEN chưa được cấu hình.'));
			console.log(chalk.hex('#00F0FF')('💡 LẤY USER TOKEN TRONG 1 GIÂY ĐỂ CÀY NHIỆM VỤ:'));
			console.log(chalk.hex('#94A3B8')('1. Mở Discord Web hoặc Desktop, nhấn Ctrl + Shift + I mở Console.'));
			console.log(chalk.hex('#94A3B8')('2. Dán mã sau vào Console:\n'));
			console.log(chalk.hex('#00D26A').bold('   (webpackChunkdiscord_app.push([[\'\'],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()\n'));
			userToken = await promptUser(chalk.hex('#00F0FF')('▸ Dán User Token vừa copy vào đây: '));
			if (!userToken) {
				console.log(chalk.hex('#EF4444')('[ERROR] User token is required.'));
				process.exit(1);
			}
			userToken = TokenValidator.sanitizeToken(userToken);
			TokenValidator.syncTokenToEnv('TOKEN', userToken);
			process.env.TOKEN = userToken;
		}

		console.log(chalk.hex('#00D26A')('[OK] User authenticated. Initializing TUI telemetry console...'));
		const tuiProcess = spawn(process.execPath, [tsxCli, 'bot.ts'], {
			stdio: 'inherit',
			env: { ...process.env, TOKEN: userToken },
		});
		tuiProcess.on('exit', (code) => {
			process.exitCode = code ?? 0;
		});
	}
}

main().catch((err) => {
	console.error(chalk.hex('#EF4444')('\n[FATAL] Startup failure:'), err);
	process.exit(1);
});
