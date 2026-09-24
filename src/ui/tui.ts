import Table from 'cli-table3';
import chalk from 'chalk';
import { renderBanner } from './banner';

export interface DashboardContext {
	user: { username: string; id: string };
	nativeTier: string;
	proxyStatus: string;
	activeQuestsCount: number;
	completedQuestsCount: number;
}

export interface HotkeyCallbacks {
	onRescan: () => void;
	onRotateProxy: () => void;
	onCheckCaptcha: () => void;
	onQuit: () => void;
}

export class TUIDashboard {
	private isHeadless: boolean;
	private interactive: boolean;

	constructor(options: { isHeadless?: boolean } = {}) {
		this.isHeadless = options.isHeadless ?? process.argv.includes('--headless');
		this.interactive = Boolean(process.stdin.isTTY && !this.isHeadless);
	}

	public isInteractive(): boolean {
		return this.interactive;
	}

	public formatStatsTable(ctx: DashboardContext): string {
		const table = new Table({
			chars: { 'top-mid': '┬', 'bottom-mid': '┴', 'mid-mid': '┼' },
			head: [chalk.cyan('Tài khoản'), chalk.magenta('Native Tier'), chalk.yellow('Proxy Hiện Tại'), chalk.green('Tiến Độ')],
		});

		table.push([
			`${chalk.bold(ctx.user.username)}\n${chalk.gray(ctx.user.id)}`,
			chalk.bold.blue(ctx.nativeTier),
			chalk.yellow(ctx.proxyStatus),
			`Đang chạy: ${chalk.cyan(ctx.activeQuestsCount)}\nĐã xong: ${chalk.green(ctx.completedQuestsCount)}`,
		]);

		return table.toString();
	}

	public bindHotkeys(callbacks: HotkeyCallbacks): void {
		if (!this.interactive) return;

		try {
			process.stdin.setRawMode(true);
			process.stdin.resume();
			process.stdin.setEncoding('utf8');

			process.stdin.on('data', (keyBuffer: Buffer | string) => {
				const keyStr = String(keyBuffer);
				if (keyStr === '\u0003' || keyStr === 'q') {
					callbacks.onQuit();
				} else if (keyStr === 'r') {
					callbacks.onRescan();
				} else if (keyStr === 'p') {
					callbacks.onRotateProxy();
				} else if (keyStr === 'c') {
					callbacks.onCheckCaptcha();
				}
			});
		} catch {
			this.interactive = false;
		}
	}

	public renderFull(ctx: DashboardContext, logs: string[]): void {
		if (this.isHeadless) return;
		process.stdout.write('\x1Bc');
		console.log(renderBanner());
		console.log(this.formatStatsTable(ctx));

		console.log(chalk.bold.white('\n📋 NHẬT KÝ HOẠT ĐỘNG (LIVE ACTIVITY STREAM):'));
		logs.slice(-5).forEach((log) => console.log(log));

		if (this.interactive) {
			console.log(chalk.gray('\n⌨ Phím tắt: [r] Quét ẩn | [p] Đổi Proxy | [c] Captcha | [q] Thoát'));
		}
	}

	public cleanup(): void {
		if (this.interactive) {
			try {
				process.stdin.setRawMode(false);
			} catch {}
			process.stdin.pause();
		}
	}
}
