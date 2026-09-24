export interface TrafficStats {
	requestsSent: number;
	rateLimitsEncountered: number;
	retriesCount: number;
	lastRateLimitReset?: number;
}

export class TrafficEngine {
	private queue: Array<{
		task: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
		attempts: number;
	}> = [];
	private processing = false;
	private isRunning = true;
	private onLogCallback?: (msg: string, level: 'info' | 'warn' | 'error') => void;

	public stats: TrafficStats = {
		requestsSent: 0,
		rateLimitsEncountered: 0,
		retriesCount: 0,
	};

	constructor(onLog?: (msg: string, level: 'info' | 'warn' | 'error') => void) {
		this.onLogCallback = onLog;
	}

	public setLogger(logger: (msg: string, level: 'info' | 'warn' | 'error') => void) {
		this.onLogCallback = logger;
	}

	private log(msg: string, level: 'info' | 'warn' | 'error' = 'info') {
		if (this.onLogCallback) {
			this.onLogCallback(msg, level);
		}
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private randomBetween(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	public enqueue<T>(task: () => Promise<T>): Promise<T> {
		if (!this.isRunning) {
			return Promise.reject(new Error('TrafficEngine đã dừng hoạt động.'));
		}
		return new Promise<T>((resolve, reject) => {
			this.queue.push({
				task,
				resolve,
				reject,
				attempts: 0,
			});
			this.process();
		});
	}

	private async process() {
		if (this.processing || this.queue.length === 0) return;
		this.processing = true;

		while (this.queue.length > 0) {
			if (!this.isRunning) {
				const remaining = this.queue.splice(0);
				remaining.forEach((r) => r.reject(new Error('TrafficEngine Shutdown')));
				break;
			}

			const req = this.queue.shift();
			if (!req) break;

			try {
				const result = await req.task();
				this.stats.requestsSent++;
				req.resolve(result);
			} catch (error: any) {
				const status = error?.status ?? error?.statusCode ?? error?.rawError?.code;
				const is429 = status === 429 || error?.message?.includes('429');
				const is5xx = status >= 500 && status < 600;

				if ((is429 || is5xx) && req.attempts < 3) {
					req.attempts++;
					this.stats.retriesCount++;
					if (is429) this.stats.rateLimitsEncountered++;

					let retryAfterSec = 2;
					if (error?.rawError?.retry_after != null) {
						retryAfterSec = Number(error.rawError.retry_after);
					} else if (error?.body?.retry_after != null) {
						retryAfterSec = Number(error.body.retry_after);
					} else {
						retryAfterSec = Math.pow(2, req.attempts);
					}

					const jitterMs = this.randomBetween(300, 800);
					const totalWaitMs = Math.round(retryAfterSec * 1000) + jitterMs;

					this.log(
						`[RateLimit/Network] Gặp HTTP ${status || 429}. Chờ ${(totalWaitMs / 1000).toFixed(1)}s (lần thử ${req.attempts}/3)...`,
						'warn',
					);

					// Đóng băng hàng đợi và đưa request lại đầu hàng đợi
					this.queue.unshift(req);
					await this.sleep(totalWaitMs);
					continue;
				} else {
					req.reject(error);
				}
			}

			// Thêm khoảng nghỉ tự nhiên giữa các request (1000ms - 1600ms) để chống spam
			const spacing = this.randomBetween(1000, 1600);
			await this.sleep(spacing);
		}

		this.processing = false;
	}

	public shutdown() {
		this.isRunning = false;
		const remaining = this.queue.splice(0);
		remaining.forEach((r) => r.reject(new Error('TrafficEngine Shutdown')));
	}
}

export const GlobalTraffic = new TrafficEngine();
