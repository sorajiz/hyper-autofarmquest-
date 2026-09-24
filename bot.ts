import chalk from 'chalk';
import Table from 'cli-table3';
import figlet from 'figlet';
import { ClientQuest, globalDispatcher } from './src/client';
import { Quest } from './src/quest';
import { GlobalTraffic } from './src/traffic';
import { renderBanner } from './src/ui/banner';
import { TUIDashboard } from './src/ui/tui';
import { DynamicNativeLoader } from './src/native/nativeLoader';
import { GlobalProxyPool } from './src/network/proxyPool';
import { GlobalRemoteBot } from './src/remote/discordBot';
import { MarkterenceCompleter } from './src/native/markterenceCompleter';

const rawToken = process.env.TOKEN || '';
const token = rawToken.trim().replace(/^["']|["']$/g, '');

if (!token) {
	console.error(chalk.red('\n❌ LỖI: Chưa cấu hình Discord TOKEN trong file .env!'));
	console.log(chalk.yellow('Vui lòng mở file .env và nhập: TOKEN=token_cua_ban'));
	process.exit(1);
}

const config = {
	autoEnroll: process.env.AUTO_ENROLL !== 'false',
	autoClaim: process.env.AUTO_CLAIM !== 'false',
	playSound: process.env.PLAY_SOUND !== 'false',
	heartbeatInterval: Math.max(25, Number(process.env.HEARTBEAT_INTERVAL) || 30),
	proxyConfigured: Boolean(globalDispatcher),
};

const client = new ClientQuest(token);

interface RunningQuestState {
	quest: Quest;
	taskType: string;
	targetSeconds: number;
	currentSeconds: number;
	status: 'ENROLLING' | 'RUNNING' | 'COMPLETED' | 'CLAIMED' | 'FAILED' | 'SKIPPED';
	statusMessage?: string;
}

let activeStates: RunningQuestState[] = [];
let activityLogs: string[] = [];
let isShuttingDown = false;
let updateTimer: NodeJS.Timeout | null = null;
let currentUser: { username: string; id: string } | null = null;

const isHeadless = process.argv.includes('--headless');
export const tuiDashboard = new TUIDashboard({ isHeadless });

export async function gracefulShutdown(reason: string = 'Người dùng yêu cầu') {
	if (isShuttingDown) return;
	isShuttingDown = true;
	tuiDashboard.cleanup();
	if (updateTimer) clearInterval(updateTimer);
	GlobalTraffic.shutdown();

	console.log(chalk.yellow(`\n\n🛑 Đang dừng bot an toàn (${reason})...`));
	MarkterenceCompleter.cleanupGamesFolder();
	await GlobalRemoteBot.stop();
	const manager = client.questManager;
	if (manager) {
		const running = activeStates.filter((s) => s.status === 'RUNNING');
		for (const state of running) {
			try {
				await manager.sendHeartbeat(state.quest, true);
			} catch {}
		}
	}
	console.log(chalk.green('✔ Đã lưu tiến độ an toàn. Tạm biệt!\n'));
	process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('Ctrl+C'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

tuiDashboard.bindHotkeys({
	onQuit: () => gracefulShutdown('Phím q bấm bởi người dùng'),
	onRescan: async () => {
		logActivity('Đang quét nhiệm vụ ẩn (Hidden Quests Scanner)...', 'info');
		if (client.questManager) {
			const found = await client.questManager.scanHiddenQuests();
			logActivity(`Đã quét xong: tìm thấy ${found.length} nhiệm vụ mới.`, 'info');
		}
	},
	onRotateProxy: () => {
		const next = GlobalProxyPool.rotate();
		logActivity(next ? `Đã xoay proxy sang: ${next.url}` : 'Chưa cấu hình danh sách proxy để xoay', 'info');
	},
	onCheckCaptcha: () => {
		logActivity('Kiểm tra Captcha Pipeline: Sẵn sàng tự động nhận diện và giải challenge.', 'info');
	},
});

function playAlertSound() {
	if (config.playSound) {
		process.stdout.write('\x07');
	}
}

function logActivity(message: string, level: 'info' | 'warn' | 'error' = 'info') {
	const now = new Date();
	const timeStr = now.toTimeString().split(' ')[0];
	let prefix = chalk.gray(`[${timeStr}]`);

	if (level === 'warn') {
		prefix = chalk.yellow(`[${timeStr}] ⚠`);
	} else if (level === 'error') {
		prefix = chalk.red(`[${timeStr}] ✖`);
	}

	const entry = `${prefix} ${message}`;
	activityLogs.push(entry);
	if (activityLogs.length > 6) {
		activityLogs.shift();
	}
	if (currentUser) {
		renderDashboard(currentUser, false);
	}
}

GlobalTraffic.setLogger((msg, level) => {
	logActivity(chalk.yellow(msg), level);
});

function formatDuration(seconds: number): string {
	if (seconds <= 0) return chalk.bold.green('✔ XONG');
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m > 0 ? `${m}m ` : ''}${s}s`;
}

function renderProgressBar(current: number, total: number, width: number = 8): string {
	if (total <= 0) return chalk.green('[████████] 100%');
	const ratio = Math.min(1, Math.max(0, current / total));
	const filled = Math.round(ratio * width);
	const empty = width - filled;
	const bar = '█'.repeat(filled) + '░'.repeat(empty);
	const percent = Math.floor(ratio * 100);
	return `${chalk.cyan(bar)} ${chalk.yellow(`${percent}%`)}`;
}

let lastRenderTime = 0;
function renderDashboard(user: { username: string; id: string }, force: boolean = true) {
	const now = Date.now();
	if (!force && now - lastRenderTime < 900) return;
	lastRenderTime = now;

	process.stdout.write('\x1Bc');

	console.log(renderBanner());

	const manager = client.questManager;
	const restrictions = manager?.getAccountRestrictions();

	const userCard = new Table({
		head: [
			chalk.white('Tài khoản Discord'),
			chalk.white('Bảo vệ IP & Rate Limit'),
			chalk.white('Nhiệm vụ đang chạy'),
		],
		colWidths: [26, 32, 24],
		style: { border: ['cyan'] },
	});

	const proxyStats = GlobalProxyPool.getStats();
	const proxyBadge = proxyStats.total > 0
		? chalk.green.bold(`🛡️ Proxy Pool: ${proxyStats.healthy}/${proxyStats.total} (IPv6: ${proxyStats.ipv6Count})`)
		: (config.proxyConfigured ? chalk.green.bold('🛡️ Proxy: Đang bật') : chalk.blue('🛡️ Trực tiếp'));

	const runningCount = activeStates.filter((s) => s.status === 'RUNNING').length;
	userCard.push([
		chalk.yellow.bold(user.username) + chalk.gray(` (${user.id.slice(-4)})`),
		`${proxyBadge}\n${chalk.gray(`Native: ${DynamicNativeLoader.getStatusInfo()}`)}\n${chalk.gray(`Gửi: ${GlobalTraffic.stats.requestsSent} | 429: ${GlobalTraffic.stats.rateLimitsEncountered}`)}`,
		chalk.green.bold(`${runningCount} active / ${activeStates.length} tổng`),
	]);
	console.log(userCard.toString());

	if (restrictions?.isBlocked) {
		console.log(
			chalk.bgYellow.black(
				` ⚠ CẢNH BÁO: Discord tạm khóa ghi danh nhiệm vụ đến ${restrictions.blockedUntil?.toLocaleTimeString()}. Bot sẽ chỉ chạy các nhiệm vụ đã ghi danh sẵn. `,
			),
		);
	}

	console.log(chalk.bold.white('\n📋 TIẾN ĐỘ NHIỆM VỤ THỰC TẾ'));

	const questTable = new Table({
		head: [
			chalk.white('#'),
			chalk.white('Tên nhiệm vụ'),
			chalk.white('Game / App'),
			chalk.white('Tiến độ'),
			chalk.white('Thời gian'),
			chalk.white('Phần thưởng'),
			chalk.white('Trạng thái'),
		],
		colWidths: [4, 26, 18, 18, 13, 18, 16],
		colAligns: ['center', 'left', 'left', 'left', 'center', 'left', 'center'],
		style: { border: ['white'] },
	});

	activeStates.forEach((state, index) => {
		const remaining = Math.max(0, state.targetSeconds - state.currentSeconds);

		let statusBadge: string;
		switch (state.status) {
			case 'COMPLETED':
				statusBadge = chalk.green.bold('✔ Hoàn thành');
				break;
			case 'CLAIMED':
				statusBadge = chalk.magenta.bold('🎁 Đã nhận');
				break;
			case 'RUNNING':
				statusBadge =
					state.taskType === 'WATCH_VIDEO' || state.taskType === 'WATCH_VIDEO_ON_MOBILE'
						? chalk.cyan('⚡ Xem video')
						: chalk.blue('▶ Đang chơi');
				break;
			case 'ENROLLING':
				statusBadge = chalk.yellow('⏳ Ghi danh');
				break;
			case 'SKIPPED':
				statusBadge = chalk.gray('⏭ Bỏ qua');
				break;
			default:
				statusBadge = chalk.red('✖ ' + (state.statusMessage || 'Lỗi'));
		}

		questTable.push([
			index + 1,
			chalk.bold.cyan(
				state.quest.getName().length > 23
					? `${state.quest.getName().substring(0, 20)}...`
					: state.quest.getName(),
			),
			chalk.white(
				state.quest.getApplicationName().length > 16
					? `${state.quest.getApplicationName().substring(0, 13)}...`
					: state.quest.getApplicationName(),
			),
			renderProgressBar(state.currentSeconds, state.targetSeconds, 6),
			remaining <= 0 ? chalk.green.bold('HOÀN TẤT') : chalk.yellow(formatDuration(remaining)),
			chalk.magenta(
				state.quest.getRewardName().length > 16
					? `${state.quest.getRewardName().substring(0, 13)}...`
					: state.quest.getRewardName(),
			),
			statusBadge,
		]);
	});

	console.log(questTable.toString());

	console.log(chalk.bold.white('\n📡 NHẬT KÝ HOẠT ĐỘNG'));
	if (activityLogs.length === 0) {
		console.log(chalk.gray('  Đang khởi tạo hệ thống...'));
	} else {
		activityLogs.forEach((log) => console.log(`  ${log}`));
	}

	if (tuiDashboard.isInteractive()) {
		console.log(chalk.gray('\n⌨ Phím tắt: [r] Quét ẩn | [p] Đổi Proxy | [c] Captcha | [q] Thoát'));
	} else {
		console.log(chalk.gray('\n>> Nhấn Ctrl+C để dừng bot an toàn (sẽ tự động lưu tiến độ hiện tại).'));
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function rnd(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function startBot() {
	try {
		console.log(chalk.cyan('Đang đăng nhập vào Discord...'));
		const user = await client.fetchCurrentUser();
		currentUser = user;
		console.log(chalk.green(`✔ Đăng nhập thành công: ${user.username} (${user.id})`));

		logActivity(`Đăng nhập thành công: ${chalk.yellow(user.username)}`);

		console.log(chalk.cyan('Đang tải danh sách nhiệm vụ...'));
		await client.fetchQuests();

		const manager = client.questManager;
		if (!manager) {
			console.log(chalk.red('Không thể khởi tạo Quest Manager.'));
			return;
		}

		// Kiểm tra hạn chế tài khoản
		const restrictions = manager.getAccountRestrictions();
		if (restrictions.isSuspended) {
			console.log(
				chalk.red.bold(
					`\n❌ Tài khoản của bạn đang bị Discord tạm khóa nhiệm vụ đến: ${restrictions.suspendedUntil?.toLocaleString()}`,
				),
			);
			console.log(chalk.yellow('Vui lòng đợi hết thời gian khóa trước khi chạy lại bot.'));
			return;
		}

		if (GlobalRemoteBot.isEnabled()) {
			logActivity('Đang kích hoạt Discord Remote Controller Bot (Slash Commands)...');
			GlobalRemoteBot.start(manager).catch(() => {});
		}

		// Tự động nhận thưởng các quest đã hoàn thành trước đó
		if (config.autoClaim) {
			const claimable = manager.getClaimable();
			if (claimable.length > 0) {
				logActivity(`Phát hiện ${claimable.length} nhiệm vụ đã xong cần nhận thưởng...`);
				for (const q of claimable) {
					const claimResult = await manager.claimQuestReward(q.id);
					logActivity(`[Nhận quà] ${q.getName()}: ${claimResult.message}`);
				}
			}
		}

		const validQuests = manager.filterQuestsValid();
		if (validQuests.length === 0) {
			console.log(chalk.green('\n🎉 Bạn không có nhiệm vụ nào cần làm hoặc tất cả đã hoàn thành!'));
			return;
		}

		activeStates = validQuests.map((quest) => {
			const primary = quest.getPrimaryTask();
			const target = primary?.target ?? 900;
			const current = quest.getCurrentProgress(primary?.name);
			const isDone = quest.isCompleted() || current >= target;

			return {
				quest,
				taskType: primary?.name || 'PLAY_ON_DESKTOP',
				targetSeconds: target,
				currentSeconds: current,
				status: isDone ? (quest.hasClaimedRewards() ? 'CLAIMED' : 'COMPLETED') : 'ENROLLING',
			};
		});

		renderDashboard(user, true);

		// Bước 1: Ghi danh (Enroll)
		if (config.autoEnroll && !restrictions.isBlocked) {
			for (const state of activeStates) {
				if (state.status === 'COMPLETED' || state.status === 'CLAIMED') continue;

				if (!state.quest.isEnrolledQuest()) {
					logActivity(`Đang ghi danh: "${state.quest.getName()}"...`);
					renderDashboard(user, false);
					const enrolled = await manager.acceptQuest(state.quest.id);
					if (enrolled) {
						state.status = 'RUNNING';
						logActivity(chalk.green(`✔ Ghi danh thành công "${state.quest.getName()}"`));
					} else {
						state.status = 'FAILED';
						state.statusMessage = 'Hết hạn nhận';
						logActivity(chalk.gray(`⏭ "${state.quest.getName()}" đã hết hạn nhận`));
					}
				} else {
					state.status = 'RUNNING';
				}
				renderDashboard(user, false);
			}
		} else {
			activeStates.forEach((s) => {
				if (s.quest.isEnrolledQuest() && s.status !== 'COMPLETED' && s.status !== 'CLAIMED') {
					s.status = 'RUNNING';
				}
			});
		}
		renderDashboard(user, true);

		const runnable = activeStates.filter((s) => s.status === 'RUNNING');
		if (runnable.length === 0) {
			logActivity(chalk.yellow('Không còn nhiệm vụ khả dụng để chạy.'));
			renderDashboard(user, true);
			return;
		}

		// Bước 2: Xem video (WATCH_VIDEO) với nhịp 7s-9.5s mô phỏng người thật
		const videoQuests = runnable.filter(
			(s) => s.taskType === 'WATCH_VIDEO' || s.taskType === 'WATCH_VIDEO_ON_MOBILE',
		);
		for (const vState of videoQuests) {
			logActivity(`Bắt đầu xem video: "${vState.quest.getName()}"...`);
			renderDashboard(user, true);

			await manager.spoofVideoProgress(vState.quest, (current, total) => {
				vState.currentSeconds = current;
				renderDashboard(user, false);
			});

			vState.status = 'COMPLETED';
			playAlertSound();
			logActivity(chalk.green(`✔ Đã xem xong video: "${vState.quest.getName()}"`));

			if (config.autoClaim) {
				const claim = await manager.claimQuestReward(vState.quest.id);
				if (claim.success) {
					vState.status = 'CLAIMED';
				}
				logActivity(`[Nhận quà] ${claim.message}`);
			}
			renderDashboard(user, true);
		}

		// Bước 3: Chạy song song Desktop Quests với nhịp Heartbeat so le (Staggered Heartbeats)
		const desktopQuests = runnable.filter(
			(s) => s.taskType !== 'WATCH_VIDEO' && s.taskType !== 'WATCH_VIDEO_ON_MOBILE',
		);

		if (desktopQuests.length > 0) {
			logActivity(`Chạy song song ${desktopQuests.length} game desktop (Heartbeat so le & Dummy Game Sleeper)...`);
			renderDashboard(user, true);

			// Khởi chạy tiến trình giả lập Game Sleeper & Discord RPC (kế thừa markterence)
			for (const dState of desktopQuests) {
				MarkterenceCompleter.launchDummyGame(
					dState.quest.getApplicationId(),
					dState.quest.getApplicationName(),
					dState.targetSeconds - dState.currentSeconds
				);
			}

			// Gửi heartbeat mở đầu (so le 1.5s - 2.5s để chống spike API)
			for (const dState of desktopQuests) {
				const res = await manager.sendHeartbeat(dState.quest, false);
				if (res?.progress) {
					dState.currentSeconds = dState.quest.getCurrentProgress(dState.taskType);
				}
				await sleep(rnd(1500, 2500));
			}
			renderDashboard(user, true);

			while (!isShuttingDown) {
				const activeDesktop = desktopQuests.filter((s) => s.status === 'RUNNING');
				if (activeDesktop.length === 0) break;

				logActivity(chalk.cyan(`Đồng bộ nhịp Heartbeat cho ${activeDesktop.length} game...`));
				renderDashboard(user, false);

				for (const dState of activeDesktop) {
					if (isShuttingDown) break;

					const res = await manager.sendHeartbeat(dState.quest, false);
					if (res?.progress) {
						const progressVal = dState.quest.getCurrentProgress(dState.taskType);
						const diff = progressVal - dState.currentSeconds;
						dState.currentSeconds = progressVal;
						if (diff > 0) {
							logActivity(
								`[${dState.quest.getApplicationName()}] +${diff}s -> ${progressVal}/${dState.targetSeconds}s`,
							);
						}
					}

					// Kiểm tra hoàn thành
					if (dState.currentSeconds >= dState.targetSeconds || dState.quest.isCompleted()) {
						// Gửi terminal heartbeat chốt số liệu
						await manager.sendHeartbeat(dState.quest, true);
						dState.status = 'COMPLETED';
						playAlertSound();
						logActivity(chalk.bold.green(`🎉 HOÀN THÀNH: ${dState.quest.getName()}!`));

						if (config.autoClaim) {
							const claimRes = await manager.claimQuestReward(dState.quest.id);
							if (claimRes.success) {
								dState.status = 'CLAIMED';
							}
							logActivity(`[Nhận quà] ${claimRes.message}`);
						}
					}

					// Độ trễ so le giữa từng game để không gửi dồn dập
					await sleep(rnd(1500, 2500));
				}

				renderDashboard(user, true);

				const stillRunning = desktopQuests.filter((s) => s.status === 'RUNNING');
				if (stillRunning.length === 0) break;

				await sleep(config.heartbeatInterval * 1000);
			}
		}

		renderDashboard(user, true);
		console.log(chalk.bold.green('\n🎉 TẤT CẢ NHIỆM VỤ ĐÃ HOÀN TẤT THÀNH CÔNG!'));
		console.log(chalk.cyan('Cảm ơn bạn đã sử dụng Discord Quest Bot.\n'));
	} catch (err: any) {
		if (err?.status === 401 || String(err).includes('401')) {
			console.error(chalk.red.bold('\n🔑 LỖI XÁC THỰC: 401 Unauthorized (Token không hợp lệ hoặc đã hết hạn)'));
			console.log(chalk.yellow('Token Discord hiện tại trong file .env không còn hiệu lực.'));
			console.log(chalk.white('\n💡 CÁCH LẤY TOKEN MỚI NHANH NHẤT (1 GIÂY):'));
			console.log(chalk.cyan('1. Mở Discord Desktop hoặc Discord trên trình duyệt, nhấn Ctrl + Shift + I để mở Console.'));
			console.log(chalk.cyan('2. Dán đoạn mã sau vào Console và nhấn Enter:\n'));
			console.log(chalk.green.bold('   (webpackChunkdiscord_app.push([[\'\'],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()\n'));
			console.log(chalk.cyan('3. Copy chuỗi Token hiển thị trong dấu ngoặc kép và cập nhật vào file .env:'));
			console.log(chalk.white('   TOKEN=chuoi_token_vua_copy\n'));
			process.exit(1);
		}

		console.error(chalk.red(`\n❌ Đã xảy ra lỗi: ${err?.message || err}`));
		if (err?.stack) {
			console.error(chalk.gray(err.stack));
		}
	}
}

startBot();
