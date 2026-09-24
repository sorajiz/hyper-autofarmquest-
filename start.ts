import readline from 'node:readline';
import { spawn } from 'node:child_process';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { renderBanner } from './src/ui/banner';

async function promptUser(questionText: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise((resolve) => {
		rl.question(questionText, (answer) => {
			rl.close();
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
		console.log('');

		const choice = await promptUser(
			chalk.hex('#F8FAFC').bold('▸ Input target selection [1, 2, 3] (Default: 2): ')
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
			console.log(chalk.hex('#F59E0B')('[CONFIG] DISCORD_BOT_TOKEN not detected in environment.'));
			botToken = await promptUser(chalk.hex('#00F0FF')('▸ Enter Discord Bot Token: '));
			if (!botToken) {
				console.log(chalk.hex('#EF4444')('[ERROR] Bot Token is required to continue.'));
				process.exit(1);
			}
			process.env.DISCORD_BOT_TOKEN = botToken;
		}

		console.log(chalk.hex('#00D26A')('[OK] Bot credentials loaded. Launching Discord Gateway service...'));
		const botProcess = spawn('npx', ['tsx', 'bot.ts', '--remote-only'], {
			stdio: 'inherit',
			shell: true,
			env: { ...process.env, DISCORD_BOT_TOKEN: botToken },
		});
		botProcess.on('exit', (code) => process.exit(code ?? 0));
	} else if (selectedMode === '3') {
		// ==========================================
		// CHẾ ĐỘ 3: LOCALHOST WEB DASHBOARD
		// ==========================================
		console.log(chalk.hex('#00D26A').bold('\n[MODE 3: LOCALHOST WEB DASHBOARD INITIALIZING]'));
		const port = process.env.PORT || '3000';
		const targetUrl = `http://localhost:${port}`;
		console.log(chalk.hex('#94A3B8')(`[NETWORK] Target Web Interface: ${chalk.hex('#00F0FF').underline(targetUrl)}`));

		const webDir = path.resolve(process.cwd(), 'web-dashboard');
		let runner: any;
		if (fs.existsSync(webDir)) {
			runner = spawn('npm', ['run', 'dev'], {
				cwd: webDir,
				stdio: 'inherit',
				shell: true,
			});
		} else {
			runner = spawn('npx', ['tsx', 'bot.ts', '--headless'], {
				stdio: 'inherit',
				shell: true,
			});
		}

		setTimeout(() => {
			console.log(chalk.hex('#00D26A')(`[DISPATCH] Opening default web browser at ${targetUrl}...`));
			openBrowser(targetUrl);
		}, 2500);

		runner.on('exit', (code: any) => process.exit(code ?? 0));
	} else {
		// ==========================================
		// CHẾ ĐỘ 2: TERMINAL INTERACTIVE TUI
		// ==========================================
		console.log(chalk.hex('#00F0FF').bold('\n[MODE 2: TERMINAL INTERACTIVE TUI INITIALIZING]'));
		let userToken = process.env.TOKEN?.trim();

		if (!userToken || userToken === 'your_discord_token_here' || userToken === 'your_discord_user_token') {
			console.log(chalk.hex('#F59E0B')('[CONFIG] User TOKEN not detected in environment.'));
			userToken = await promptUser(chalk.hex('#00F0FF')('▸ Enter Discord User Token to authenticate: '));
			if (!userToken) {
				console.log(chalk.hex('#EF4444')('[ERROR] User token is required.'));
				process.exit(1);
			}
			process.env.TOKEN = userToken;
		}

		console.log(chalk.hex('#00D26A')('[OK] User authenticated. Initializing TUI telemetry console...'));
		const tuiProcess = spawn('npx', ['tsx', 'bot.ts'], {
			stdio: 'inherit',
			shell: true,
			env: { ...process.env, TOKEN: userToken },
		});
		tuiProcess.on('exit', (code) => process.exit(code ?? 0));
	}
}

main().catch((err) => {
	console.error(chalk.hex('#EF4444')('\n[FATAL] Startup failure:'), err);
	process.exit(1);
});
