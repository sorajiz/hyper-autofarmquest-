import readline from 'node:readline';
import { spawn } from 'node:child_process';
import chalk from 'chalk';
import figlet from 'figlet';
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

	console.log(chalk.bold.cyan('========================================================================'));
	console.log(chalk.bold.white('      ⚡ HYPER AUTO FARM QUEST - UNIVERSAL MISSION CONTROL v3.2.0 ⚡   '));
	console.log(chalk.gray('       Auto-Load • Multi-Mode Engine • Zero-Config Adaptive Launcher    '));
	console.log(chalk.bold.cyan('========================================================================\n'));

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
		console.log(chalk.bold.yellow('Vui lòng chọn phương thức khởi chạy:'));
		console.log(chalk.green('  [1] 🤖 Discord Remote Bot') + chalk.gray(' (Điều khiển qua Slash Commands & Discord Components V2)'));
		console.log(chalk.cyan('  [2] 🖥️  Terminal Interactive') + chalk.gray(' (Dashboard TUI trực tiếp với ASCII Art & Live Matrix)'));
		console.log(chalk.magenta('  [3] 🌐 Localhost Web Dashboard') + chalk.gray(' (Tự động thích nghi PC, mở Web Control & WebSocket)'));
		console.log('');

		const choice = await promptUser(chalk.bold.white('👉 Nhập lựa chọn của bạn (1, 2, hoặc 3) [Mặc định: 2]: '));
		selectedMode = choice.trim() || '2';
	}

	if (selectedMode === '1') {
		// ==========================================
		// CHẾ ĐỘ 1: DISCORD REMOTE BOT
		// ==========================================
		console.log(chalk.bold.green('\n🤖 Khởi chạy chế độ [1] Discord Remote Controller Bot...'));
		let botToken = process.env.DISCORD_BOT_TOKEN?.trim();

		if (!botToken || botToken.length < 20) {
			console.log(chalk.yellow('\nChưa phát hiện DISCORD_BOT_TOKEN trong file .env.'));
			botToken = await promptUser(chalk.bold.cyan('👉 Vui lòng nhập Discord Bot Token của bạn: '));
			if (!botToken) {
				console.log(chalk.red('❌ Bot Token không được để trống!'));
				process.exit(1);
			}
			process.env.DISCORD_BOT_TOKEN = botToken;
		}

		console.log(chalk.green('✔ Đã nạp Bot Token thành công. Khởi chạy Discord Bot...'));
		// Spawn bot runner with Discord Bot mode enabled
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
		console.log(chalk.bold.magenta('\n🌐 Khởi chạy chế độ [3] Localhost Web Control...'));
		const port = process.env.PORT || '3000';
		const targetUrl = `http://localhost:${port}`;
		console.log(chalk.cyan(`🚀 Đang khởi động Web Dashboard tại: ${chalk.bold.underline(targetUrl)}`));

		// Check if web-dashboard or python-service exists
		const webDir = path.resolve(process.cwd(), 'web-dashboard');
		let runner: any;
		if (fs.existsSync(webDir)) {
			runner = spawn('npm', ['run', 'dev'], {
				cwd: webDir,
				stdio: 'inherit',
				shell: true,
			});
		} else {
			// Fallback: spawn main bot in headless mode
			runner = spawn('npx', ['tsx', 'bot.ts', '--headless'], {
				stdio: 'inherit',
				shell: true,
			});
		}

		setTimeout(() => {
			console.log(chalk.green(`\n✨ Đang tự động mở trình duyệt đến ${targetUrl}...`));
			openBrowser(targetUrl);
		}, 2500);

		runner.on('exit', (code: any) => process.exit(code ?? 0));
	} else {
		// ==========================================
		// CHẾ ĐỘ 2: TERMINAL INTERACTIVE TUI
		// ==========================================
		console.log(chalk.bold.cyan('\n🖥️  Khởi chạy chế độ [2] Terminal Interactive Dashboard...'));
		let userToken = process.env.TOKEN?.trim();

		if (!userToken || userToken === 'your_discord_token_here' || userToken === 'your_discord_user_token') {
			console.log(chalk.yellow('\nChưa phát hiện Discord User TOKEN trong file .env.'));
			userToken = await promptUser(chalk.bold.yellow('👉 Nhập Discord User Token của bạn để bắt đầu cày Quests: '));
			if (!userToken) {
				console.log(chalk.red('❌ Token không được để trống!'));
				process.exit(1);
			}
			process.env.TOKEN = userToken;
		}

		console.log(chalk.green('✔ Đã nạp User Token. Đang tải bảng điều khiển TUI...'));
		const tuiProcess = spawn('npx', ['tsx', 'bot.ts'], {
			stdio: 'inherit',
			shell: true,
			env: { ...process.env, TOKEN: userToken },
		});
		tuiProcess.on('exit', (code) => process.exit(code ?? 0));
	}
}

main().catch((err) => {
	console.error(chalk.red('\n❌ Lỗi khởi chạy:'), err);
	process.exit(1);
});
