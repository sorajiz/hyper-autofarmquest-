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
			chars: {
				'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
				'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
				'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
				'right': '│', 'right-mid': '┤', 'middle': '│'
			},
			head: [
				chalk.hex('#00F0FF').bold('TARGET ACCOUNT'),
				chalk.hex('#5865F2').bold('NATIVE TIER'),
				chalk.hex('#F59E0B').bold('PROXY / ROUTING'),
				chalk.hex('#00D26A').bold('PIPELINE METRICS'),
			],
		});

		table.push([
			`${chalk.hex('#F8FAFC').bold(ctx.user.username)}\n${chalk.hex('#64748B')(ctx.user.id)}`,
			chalk.hex('#5865F2').bold(ctx.nativeTier),
			chalk.hex('#F59E0B')(ctx.proxyStatus),
			`Active:  ${chalk.hex('#00F0FF').bold(ctx.activeQuestsCount)}\nClaimed: ${chalk.hex('#00D26A').bold(ctx.completedQuestsCount)}`,
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

		console.log(chalk.hex('#94A3B8').bold('\n[TELEMETRY STREAM // RECENT EVENTS]'));
		const sep = chalk.hex('#1E293B')('─'.repeat(70));
		console.log(sep);
		logs.slice(-5).forEach((log) => console.log(log));
		console.log(sep);

		if (this.interactive) {
			console.log(
				chalk.hex('#64748B')('KEYBINDS: ') +
				chalk.hex('#00F0FF').bold('[R] ') + chalk.hex('#94A3B8')('Rescan Unlisted  │  ') +
				chalk.hex('#F59E0B').bold('[P] ') + chalk.hex('#94A3B8')('Rotate Proxy  │  ') +
				chalk.hex('#00D26A').bold('[C] ') + chalk.hex('#94A3B8')('Captcha Diagnostics  │  ') +
				chalk.hex('#EF4444').bold('[Q] ') + chalk.hex('#94A3B8')('Graceful Exit')
			);
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
