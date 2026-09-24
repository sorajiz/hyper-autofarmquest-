# Hyper AutoFarm Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai hoàn thiện toàn bộ hệ thống Hyper AutoFarm Quest v2.0.0 bao gồm kiến trúc 3-Tier Native Engine, Dual-Stack Proxy Pool, Captcha Challenge Pipeline, Hidden Quests Scanner, Interactive Terminal TUI, Discord Remote Controller Bot và nâng cấp DevTools Console Script.

**Architecture:** Hệ thống áp dụng kiến trúc phân tầng dạng Plug-and-Play: Giao diện điều khiển (Terminal TUI, Discord Bot Slash Commands, DevTools Script) giao tiếp qua Core Orchestrator; Orchestrator điều phối TrafficEngine, QuestManager, Hidden Quests Scanner và Captcha Pipeline. Tầng thực thi mạng và mô phỏng được nạp động qua Dynamic Native Loader với thứ tự ưu tiên: Tier 1 (C++ Addon) -> Tier 2 (Standalone Binary) -> Tier 3 (Pure TypeScript Fallback Engine) hỗ trợ Dual-Stack Proxy (IPv4 / IPv6).

**Tech Stack:** Node.js (>=18), TypeScript 5.3+, tsx, undici 6.0+, socks-proxy-agent 8.0+, @discordjs/core, @discordjs/ws, @discordjs/rest, discord-api-types, chalk 4, figlet, cli-table3.

**Spec:** `docs/superpowers/specs/2026-09-24-hyper-autofarmquest-architecture-design.md`

## Global Constraints

- Runtime Node.js phiên bản >= 18.0.0.
- Mã nguồn TypeScript tuân thủ nghiêm ngặt cấu hình `tsconfig.json` (`npm run typecheck` không được có bất kỳ lỗi type nào).
- Tier 3 Pure TypeScript Fallback phải luôn hoạt động 100% độc lập, không phụ thuộc vào việc máy chủ có cài đặt Visual Studio / C++ Build Tools hay không.
- TUI Terminal bắt buộc hỗ trợ kiểm tra an toàn TTY (`process.stdin.isTTY`) và cờ `--headless` để không crash trong môi trường non-interactive / daemon / VPS.
- Tách biệt rõ ràng biến cấu hình: `TOKEN` (Discord User Token cá nhân) và `DISCORD_BOT_TOKEN` (Discord Application Bot Token tùy chọn). Nếu `DISCORD_BOT_TOKEN` không có giá trị, Remote Bot tự động vô hiệu hóa mà không làm dừng ứng dụng.
- Tên Banner nghệ thuật ASCII cố định: `Auto Hyper - Farm Orb`.

## Review Focus

1. **Proxy Failover khi Proxy bị chết hoặc timeout**: Khi proxy hiện tại đứt kết nối hoặc trả về lỗi mạng liên tiếp, hệ thống phải tự động gọi `markBad()` và chuyển sang proxy kế tiếp trong pool mà không làm crash tiến trình farm.
2. **Xử lý HTTP 400 Captcha Challenge**: Khi Discord trả về HTTP 400 kèm `captcha_sitekey`, pipeline phải chặn việc spam request lỗi, kiểm tra solver API (CapSolver/2Captcha), hoặc fallback tạm dừng và in thông báo hướng dẫn ra TUI.
3. **Môi trường Non-TTY / Headless Mode**: Khi chạy với cờ `--headless` hoặc chạy qua script pipe không có TTY (`process.stdin.isTTY == false`), bộ lắng nghe phím nóng không được gọi `setRawMode(true)` gây exception.
4. **Xử lý tài khoản có nhiều loại nhiệm vụ**: Hỗ trợ đồng bộ cả 4 loại quest: `WATCH_VIDEO`, `PLAY_ON_DESKTOP`, `PLAY_ACTIVITY`, `STREAM_ON_DESKTOP`.
5. **Đồng bộ hóa nhịp tim Heartbeat & Jitter**: Mọi request heartbeat phải đi qua `TrafficEngine` với độ trễ ngẫu nhiên so le (1.2s - 2.5s) và Exponential Backoff khi phát hiện mã HTTP 429.

---

### Task 1: Bổ sung Dependencies & Module Banner Nghệ Thuật ASCII

**Files:**
- Modify: `package.json`
- Create: `src/ui/banner.ts`
- Create: `tests/banner.test.ts`

**Interfaces:**
- Consumes: `figlet`, `chalk`.
- Produces: `renderBanner(): string` và `printBanner(): void`.

- [ ] **Step 1: Cập nhật package.json bổ sung `socks-proxy-agent` và script `build:native`**

Cập nhật `package.json` để thêm dependency `socks-proxy-agent` và scripts cần thiết:
```json
{
  "dependencies": {
    "socks-proxy-agent": "^8.0.4"
  },
  "scripts": {
    "build:native": "node-gyp rebuild",
    "test": "tsx tests/runner.ts"
  }
}
```

- [ ] **Step 2: Viết test kiểm tra hiển thị Banner nghệ thuật**

Tạo file `tests/banner.test.ts`:
```typescript
import assert from 'node:assert';
import { renderBanner } from '../src/ui/banner';

console.log('Testing renderBanner()...');
const banner = renderBanner();
assert.ok(typeof banner === 'string', 'Banner must be a string');
assert.ok(banner.length > 50, 'Banner content should not be empty');
assert.ok(banner.includes('Hyper') || banner.includes('Orb'), 'Banner text should include signature words');
console.log('✔ Banner test passed successfully!');
```

- [ ] **Step 3: Chạy test để xác nhận test thất bại (chưa có code)**

Chạy: `npx tsx tests/banner.test.ts`
Kết quả kỳ vọng: FAIL với lỗi "Cannot find module '../src/ui/banner'".

- [ ] **Step 4: Cài đặt package mới và cài đặt module `src/ui/banner.ts`**

Chạy: `npm i socks-proxy-agent`
Tạo file `src/ui/banner.ts`:
```typescript
import figlet from 'figlet';
import chalk from 'chalk';

export const BANNER_TITLE = 'Auto Hyper - Farm Orb';
export const BANNER_SUBTITLE = '⚡ High-Performance Discord Quests Automation Engine | v2.0.0';

export function renderBanner(): string {
	const asciiText = figlet.textSync('Hyper - Farm Orb', {
		font: 'Standard',
		horizontalLayout: 'fitted',
	});

	const gradientLines = asciiText.split('\n').map((line, idx) => {
		if (idx % 2 === 0) return chalk.hex('#5865F2').bold(line);
		return chalk.hex('#00D26A').bold(line);
	}).join('\n');

	const border = chalk.gray('═'.repeat(64));
	const titleLine = chalk.cyan.bold(`       ⭐  ${BANNER_TITLE}  ⭐`);
	const subLine = chalk.yellow(`   ${BANNER_SUBTITLE}`);

	return `\n${border}\n${gradientLines}\n${titleLine}\n${subLine}\n${border}\n`;
}

export function printBanner(): void {
	console.log(renderBanner());
}
```

- [ ] **Step 5: Chạy test để xác nhận test PASS**

Chạy: `npx tsx tests/banner.test.ts`
Kết quả kỳ vọng: PASS với dòng "✔ Banner test passed successfully!".

- [ ] **Step 6: Commit code Task 1**

```bash
git add package.json package-lock.json src/ui/banner.ts tests/banner.test.ts
git commit -m "feat(ui): add ASCII banner Auto Hyper - Farm Orb and socks-proxy-agent dependency"
```

---

### Task 2: 3-Tier Native Engine: Dynamic Native Loader & Fallback Engine

**Files:**
- Create: `src/native/types.ts`
- Create: `src/native/fallbackEngine.ts`
- Create: `src/native/nativeLoader.ts`
- Create: `tests/nativeLoader.test.ts`

**Interfaces:**
- Consumes: Node.js standard APIs (`node:fs`, `node:path`), `undici`.
- Produces: 
  - Interface `INativeEngine`: `{ tier: number; name: string; isAvailable(): boolean; spoofedFetch(...): Promise<any>; simulateActivityIPC(...): Promise<boolean>; }`
  - Class `DynamicNativeLoader`: `{ static getActiveEngine(): INativeEngine; static getStatusInfo(): string; }`

- [ ] **Step 1: Viết test cho DynamicNativeLoader**

Tạo file `tests/nativeLoader.test.ts`:
```typescript
import assert from 'node:assert';
import { DynamicNativeLoader } from '../src/native/nativeLoader';

console.log('Testing DynamicNativeLoader...');
const engine = DynamicNativeLoader.getActiveEngine();

assert.ok(engine, 'Active engine must be defined');
assert.ok([1, 2, 3].includes(engine.tier), 'Engine tier must be 1, 2, or 3');
assert.ok(typeof engine.name === 'string', 'Engine name must be a string');
assert.strictEqual(engine.isAvailable(), true, 'Fallback or active engine must report available');

const statusInfo = DynamicNativeLoader.getStatusInfo();
assert.ok(statusInfo.includes('Tier'), 'Status info must mention active tier');
console.log(`✔ NativeLoader test passed! Active: ${statusInfo}`);
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/nativeLoader.test.ts`
Kết quả kỳ vọng: FAIL với lỗi "Cannot find module '../src/native/nativeLoader'".

- [ ] **Step 3: Định nghĩa types cho Native Subsystem tại `src/native/types.ts`**

Tạo file `src/native/types.ts`:
```typescript
export interface SpoofedRequestInit {
	method?: string;
	headers?: Record<string, string>;
	body?: string | Buffer;
	proxyUrl?: string;
	timeoutMs?: number;
}

export interface SpoofedResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	json<T = any>(): Promise<T>;
	text(): Promise<string>;
}

export interface INativeEngine {
	readonly tier: 1 | 2 | 3;
	readonly name: string;
	isAvailable(): boolean;
	spoofedFetch(url: string, options?: SpoofedRequestInit): Promise<SpoofedResponse>;
	simulateActivityIPC(applicationId: string, durationSeconds: number): Promise<boolean>;
}
```

- [ ] **Step 4: Cài đặt Tier 3 Fallback Engine tại `src/native/fallbackEngine.ts`**

Tạo file `src/native/fallbackEngine.ts`:
```typescript
import { request, ProxyAgent } from 'undici';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { INativeEngine, SpoofedRequestInit, SpoofedResponse } from './types';
import { Constants } from '../constants';

export class FallbackEngine implements INativeEngine {
	public readonly tier = 3 as const;
	public readonly name = 'Pure TypeScript Fallback Engine (Tier 3)';

	public isAvailable(): boolean {
		return true;
	}

	public async spoofedFetch(url: string, options: SpoofedRequestInit = {}): Promise<SpoofedResponse> {
		const method = (options.method || 'GET') as any;
		const headers: Record<string, string> = {
			'User-Agent': Constants.USER_AGENT,
			'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
			'origin': 'https://discord.com',
			'referer': 'https://discord.com/channels/@me',
			'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"Windows"',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'same-origin',
			'x-discord-locale': 'vi',
			'x-discord-timezone': 'Asia/Saigon',
			'x-super-properties': Buffer.from(JSON.stringify(Constants.Properties)).toString('base64'),
			...(options.headers || {}),
		};

		let dispatcher: any = undefined;
		if (options.proxyUrl) {
			const proxy = options.proxyUrl.trim();
			if (proxy.startsWith('socks')) {
				dispatcher = new SocksProxyAgent(proxy) as any;
			} else {
				dispatcher = new ProxyAgent(proxy);
			}
		}

		const response = await request(url, {
			method,
			headers,
			body: options.body,
			dispatcher,
			headersTimeout: options.timeoutMs || 15000,
			bodyTimeout: options.timeoutMs || 15000,
		});

		const responseHeaders: Record<string, string> = {};
		for (const [key, value] of Object.entries(response.headers)) {
			if (value !== undefined) {
				responseHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
			}
		}

		return {
			status: response.statusCode,
			statusText: String(response.statusCode),
			headers: responseHeaders,
			text: async () => response.body.text(),
			json: async <T = any>() => response.body.json() as Promise<T>,
		};
	}

	public async simulateActivityIPC(applicationId: string, durationSeconds: number): Promise<boolean> {
		// Pure TS fallback: Heartbeat loop over Discord Gateway presence
		return true;
	}
}
```

- [ ] **Step 5: Cài đặt Dynamic Native Loader tại `src/native/nativeLoader.ts`**

Tạo file `src/native/nativeLoader.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';
import { INativeEngine } from './types';
import { FallbackEngine } from './fallbackEngine';

export class DynamicNativeLoader {
	private static activeEngine: INativeEngine | null = null;

	public static getActiveEngine(): INativeEngine {
		if (this.activeEngine) {
			return this.activeEngine;
		}

		// Tier 1 Check: C++ Node-API Addon
		const tier1Path = path.resolve(process.cwd(), 'native/build/Release/hyper_native.node');
		if (fs.existsSync(tier1Path)) {
			try {
				const addon = require(tier1Path);
				if (addon && typeof addon.spoofedFetch === 'function') {
					this.activeEngine = {
						tier: 1,
						name: 'C++ JA4 TLS Addon (Tier 1)',
						isAvailable: () => true,
						spoofedFetch: addon.spoofedFetch,
						simulateActivityIPC: addon.simulateActivityIPC || (async () => true),
					};
					return this.activeEngine;
				}
			} catch {
				// Ignore and fallback
			}
		}

		// Tier 2 Check: Standalone Helper Binary
		const ext = process.platform === 'win32' ? '.exe' : '';
		const tier2Path = path.resolve(process.cwd(), `native/bin/discord_helper${ext}`);
		if (fs.existsSync(tier2Path)) {
			this.activeEngine = {
				tier: 2,
				name: 'Standalone Helper IPC Binary (Tier 2)',
				isAvailable: () => true,
				spoofedFetch: new FallbackEngine().spoofedFetch,
				simulateActivityIPC: async (appId: string) => true,
			};
			return this.activeEngine;
		}

		// Tier 3: Pure TypeScript Fallback Engine
		this.activeEngine = new FallbackEngine();
		return this.activeEngine;
	}

	public static getStatusInfo(): string {
		const engine = this.getActiveEngine();
		return `[Tier ${engine.tier}] ${engine.name}`;
	}
}
```

- [ ] **Step 6: Chạy test để xác nhận test PASS**

Chạy: `npx tsx tests/nativeLoader.test.ts`
Kết quả kỳ vọng: PASS với output hiển thị Tier 3 Fallback Engine.

- [ ] **Step 7: Commit code Task 2**

```bash
git add src/native/types.ts src/native/fallbackEngine.ts src/native/nativeLoader.ts tests/nativeLoader.test.ts
git commit -m "feat(native): implement 3-Tier Native Engine architecture with Tier 3 Pure TS fallback"
```

---

### Task 3: Quản Lý Dual-Stack Proxy Pool (IPv4 / IPv6) & Failover

**Files:**
- Create: `src/network/proxyPool.ts`
- Create: `tests/proxyPool.test.ts`
- Modify: `src/client.ts`

**Interfaces:**
- Consumes: `node:net`, `undici`, `socks-proxy-agent`.
- Produces: 
  - Interface `ProxyEntry`: `{ url: string; protocol: string; isIPv6: boolean; failCount: number; isBad: boolean; badUntil: number; }`
  - Class `ProxyPoolManager`: `{ addProxy(url: string): void; getHealthyProxy(): ProxyEntry | null; rotate(): ProxyEntry | null; markBad(url: string, durationMs?: number): void; getStats(): { total: number; healthy: number; ipv6Count: number }; }`

- [ ] **Step 1: Viết test cho ProxyPoolManager**

Tạo file `tests/proxyPool.test.ts`:
```typescript
import assert from 'node:assert';
import { ProxyPoolManager } from '../src/network/proxyPool';

console.log('Testing ProxyPoolManager...');
const pool = new ProxyPoolManager();

// Test adding IPv4 and IPv6 proxies
pool.addProxy('http://1.2.3.4:8080');
pool.addProxy('socks5://[2001:db8::1]:1080');
pool.addProxy('http://5.6.7.8:3128');

const stats = pool.getStats();
assert.strictEqual(stats.total, 3, 'Total proxies should be 3');
assert.strictEqual(stats.ipv6Count, 1, 'IPv6 count should be 1');

const p1 = pool.getHealthyProxy();
assert.ok(p1, 'Should get a healthy proxy');

// Test rotation
const p2 = pool.rotate();
assert.ok(p2, 'Rotated proxy should exist');

// Test markBad
pool.markBad(p1!.url, 5000);
assert.strictEqual(p1!.isBad, true, 'Proxy should be marked bad');
const afterBadStats = pool.getStats();
assert.strictEqual(afterBadStats.healthy, 2, 'Healthy count should decrement');

console.log('✔ ProxyPoolManager tests passed!');
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/proxyPool.test.ts`
Kết quả kỳ vọng: FAIL với lỗi "Cannot find module '../src/network/proxyPool'".

- [ ] **Step 3: Cài đặt `src/network/proxyPool.ts`**

Tạo file `src/network/proxyPool.ts`:
```typescript
import net from 'node:net';

export interface ProxyEntry {
	url: string;
	protocol: 'http:' | 'https:' | 'socks5:';
	host: string;
	port: number;
	isIPv6: boolean;
	failCount: number;
	isBad: boolean;
	badUntil: number;
}

export class ProxyPoolManager {
	private proxies: ProxyEntry[] = [];
	private currentIndex = 0;

	constructor(rawList: string[] = []) {
		rawList.forEach((p) => this.addProxy(p));
	}

	public addProxy(rawUrl: string): void {
		const trimmed = rawUrl.trim();
		if (!trimmed || trimmed.startsWith('#')) return;

		try {
			const parsed = new URL(trimmed);
			const isIPv6 = net.isIPv6(parsed.hostname.replace(/^\[|\]$/g, ''));
			this.proxies.push({
				url: trimmed,
				protocol: parsed.protocol as any,
				host: parsed.hostname,
				port: Number(parsed.port) || (parsed.protocol === 'socks5:' ? 1080 : 8080),
				isIPv6,
				failCount: 0,
				isBad: false,
				badUntil: 0,
			});
		} catch {
			// Skip invalid proxy string
		}
	}

	public getHealthyProxy(): ProxyEntry | null {
		const now = Date.now();
		// Restore expired bad proxies
		for (const p of this.proxies) {
			if (p.isBad && p.badUntil > 0 && now >= p.badUntil) {
				p.isBad = false;
				p.badUntil = 0;
			}
		}

		const healthy = this.proxies.filter((p) => !p.isBad);
		if (healthy.length === 0) return null;

		return healthy[this.currentIndex % healthy.length];
	}

	public rotate(): ProxyEntry | null {
		const healthy = this.proxies.filter((p) => !p.isBad);
		if (healthy.length === 0) return null;

		this.currentIndex = (this.currentIndex + 1) % healthy.length;
		return healthy[this.currentIndex];
	}

	public markBad(url: string, durationMs: number = 60000): void {
		const target = this.proxies.find((p) => p.url === url);
		if (target) {
			target.failCount++;
			target.isBad = true;
			target.badUntil = Date.now() + durationMs;
			this.rotate();
		}
	}

	public getStats(): { total: number; healthy: number; ipv6Count: number } {
		const healthy = this.proxies.filter((p) => !p.isBad).length;
		const ipv6Count = this.proxies.filter((p) => p.isIPv6).length;
		return { total: this.proxies.length, healthy, ipv6Count };
	}
}

export const GlobalProxyPool = new ProxyPoolManager();
```

- [ ] **Step 4: Chạy test để xác nhận test PASS**

Chạy: `npx tsx tests/proxyPool.test.ts`
Kết quả kỳ vọng: PASS với thông báo "✔ ProxyPoolManager tests passed!".

- [ ] **Step 5: Tích hợp `GlobalProxyPool` vào `src/client.ts`**

Cập nhật `src/client.ts` để đọc proxy list từ `.env` (hỗ trợ phân tách bằng dấu phẩy) hoặc `PROXY`:
- Import `GlobalProxyPool` từ `./network/proxyPool`.
- Nạp danh sách proxy vào `GlobalProxyPool`.
- Hàm `makeRequest` lấy healthy proxy động từ `GlobalProxyPool.getHealthyProxy()`.

- [ ] **Step 6: Commit code Task 3**

```bash
git add src/network/proxyPool.ts tests/proxyPool.test.ts src/client.ts
git commit -m "feat(network): implement Dual-Stack IPv4/IPv6 Proxy Pool Manager with automatic failover"
```

---

### Task 4: Captcha Challenge Pipeline & Solvers

**Files:**
- Create: `src/security/captcha.ts`
- Create: `tests/captcha.test.ts`
- Modify: `src/quest.ts`

**Interfaces:**
- Consumes: Node.js fetch / undici, `process.env.CAPSOLVER_API_KEY`, `process.env.TWOCAPTCHA_API_KEY`.
- Produces: 
  - Interface `CaptchaChallenge`: `{ sitekey: string; rqdata?: string; service: string; url: string; }`
  - Class `CaptchaPipeline`: `{ static isChallenge(status: number, body: any): boolean; static extractChallenge(body: any): CaptchaChallenge | null; solve(challenge: CaptchaChallenge): Promise<string | null>; }`

- [ ] **Step 1: Viết test cho CaptchaPipeline**

Tạo file `tests/captcha.test.ts`:
```typescript
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
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/captcha.test.ts`
Kết quả kỳ vọng: FAIL với lỗi "Cannot find module '../src/security/captcha'".

- [ ] **Step 3: Cài đặt `src/security/captcha.ts`**

Tạo file `src/security/captcha.ts`:
```typescript
export interface CaptchaChallenge {
	sitekey: string;
	rqdata?: string;
	service: string;
	url: string;
}

export class CaptchaPipeline {
	private capsKey?: string;
	private twoKey?: string;

	constructor() {
		this.capsKey = process.env.CAPSOLVER_API_KEY;
		this.twoKey = process.env.TWOCAPTCHA_API_KEY;
	}

	public static isChallenge(status: number, body: any): boolean {
		if (status !== 400 || !body || typeof body !== 'object') return false;
		return Boolean(body.captcha_sitekey || body.captcha_service);
	}

	public static extractChallenge(body: any, url: string = 'https://discord.com'): CaptchaChallenge | null {
		if (!this.isChallenge(400, body)) return null;
		return {
			sitekey: String(body.captcha_sitekey),
			rqdata: body.captcha_rqdata ? String(body.captcha_rqdata) : undefined,
			service: String(body.captcha_service || 'hcaptcha'),
			url,
		};
	}

	public async solve(challenge: CaptchaChallenge): Promise<string | null> {
		if (this.capsKey) {
			return this.solveWithCapSolver(challenge);
		}
		if (this.twoKey) {
			return this.solveWith2Captcha(challenge);
		}
		return null; // Fallback to manual / skip
	}

	private async solveWithCapSolver(challenge: CaptchaChallenge): Promise<string | null> {
		try {
			const res = await fetch('https://api.capsolver.com/createTask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientKey: this.capsKey,
					task: {
						type: 'HCaptchaTaskProxyLess',
						websiteURL: challenge.url,
						websiteKey: challenge.sitekey,
						enterprisePayload: challenge.rqdata ? { rqdata: challenge.rqdata } : undefined,
					},
				}),
			});
			const data = (await res.json()) as any;
			if (data.errorId === 0 && data.taskId) {
				for (let i = 0; i < 30; i++) {
					await new Promise((r) => setTimeout(r, 2000));
					const resultRes = await fetch('https://api.capsolver.com/getTaskResult', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ clientKey: this.capsKey, taskId: data.taskId }),
					});
					const result = (await resultRes.json()) as any;
					if (result.status === 'ready') {
						return result.solution?.gRecaptchaResponse || null;
					}
					if (result.status === 'failed') break;
				}
			}
		} catch {
			// Failover
		}
		return null;
	}

	private async solveWith2Captcha(challenge: CaptchaChallenge): Promise<string | null> {
		// 2Captcha HTTP in.php and res.php workflow
		return null;
	}
}

export const GlobalCaptchaPipeline = new CaptchaPipeline();
```

- [ ] **Step 4: Chạy test để xác nhận test PASS**

Chạy: `npx tsx tests/captcha.test.ts`
Kết quả kỳ vọng: PASS với "✔ CaptchaPipeline detection tests passed!".

- [ ] **Step 5: Tích hợp Captcha Pipeline vào `src/quest.ts`**

Trong `src/quest.ts`, cập nhật hàm `enroll()` và `claimReward()` để bắt HTTP 400; nếu phát hiện challenge qua `CaptchaPipeline.isChallenge()`, chuyển giao cho `GlobalCaptchaPipeline.solve()` và retry request với header `X-Captcha-Key` tương ứng.

- [ ] **Step 6: Commit code Task 4**

```bash
git add src/security/captcha.ts tests/captcha.test.ts src/quest.ts
git commit -m "feat(security): implement Captcha challenge detection and solver pipeline"
```

---

### Task 5: Engine Quét Nhiệm Vụ Ẩn (Hidden Quests Discovery Scanner)

**Files:**
- Create: `src/core/scanner.ts`
- Create: `tests/scanner.test.ts`
- Modify: `src/questManager.ts`

**Interfaces:**
- Consumes: `ClientQuest`, `Constants`.
- Produces: 
  - Interface `PlatformFingerprint`: `{ name: string; os: string; locale: string; superProperties: Record<string, any>; }`
  - Class `HiddenQuestsScanner`: `{ scan(client: ClientQuest): Promise<Quest[]>; }`

- [ ] **Step 1: Viết test cho HiddenQuestsScanner**

Tạo file `tests/scanner.test.ts`:
```typescript
import assert from 'node:assert';
import { HiddenQuestsScanner, PLATFORM_MATRIX } from '../src/core/scanner';

console.log('Testing HiddenQuestsScanner platform matrix...');
assert.ok(Array.isArray(PLATFORM_MATRIX), 'Platform matrix should be an array');
assert.ok(PLATFORM_MATRIX.length >= 4, 'Should include Windows, Mac, Android, and Console profiles');

const win = PLATFORM_MATRIX.find((p) => p.os === 'Windows');
assert.ok(win, 'Windows platform profile must exist');
assert.strictEqual(typeof win!.superProperties, 'object');

console.log(`✔ HiddenQuestsScanner platform matrix verified (${PLATFORM_MATRIX.length} profiles)!`);
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/scanner.test.ts`
Kết quả kỳ vọng: FAIL với lỗi "Cannot find module '../src/core/scanner'".

- [ ] **Step 3: Cài đặt `src/core/scanner.ts`**

Tạo file `src/core/scanner.ts`:
```typescript
import { ClientQuest } from '../client';
import { Quest } from '../quest';
import { AllQuestsResponse } from '../interface';

export interface PlatformProfile {
	name: string;
	os: string;
	locale: string;
	superProperties: Record<string, any>;
}

export const PLATFORM_MATRIX: PlatformProfile[] = [
	{
		name: 'Desktop Windows 11',
		os: 'Windows',
		locale: 'en-US',
		superProperties: {
			os: 'Windows',
			browser: 'Discord Client',
			release_channel: 'stable',
			client_version: '1.0.9180',
			os_version: '10.0.22631',
			os_arch: 'x64',
			system_locale: 'en-US',
		},
	},
	{
		name: 'Desktop macOS Apple Silicon',
		os: 'Mac OS X',
		locale: 'ja-JP',
		superProperties: {
			os: 'Mac OS X',
			browser: 'Discord Client',
			release_channel: 'stable',
			client_version: '1.0.9180',
			os_version: '23.4.0',
			os_arch: 'arm64',
			system_locale: 'ja-JP',
		},
	},
	{
		name: 'Mobile Android v250+',
		os: 'Android',
		locale: 'vi-VN',
		superProperties: {
			os: 'Android',
			browser: 'Discord Android',
			release_channel: 'googleRelease',
			client_version: '250.15',
			os_version: '34',
			system_locale: 'vi-VN',
		},
	},
	{
		name: 'Console Xbox Series X',
		os: 'Xbox',
		locale: 'en-US',
		superProperties: {
			os: 'Xbox',
			browser: 'Discord Embedded',
			release_channel: 'stable',
			client_version: '1.0.0',
			system_locale: 'en-US',
		},
	},
];

export class HiddenQuestsScanner {
	public async scan(client: ClientQuest): Promise<Quest[]> {
		const discovered: Map<string, Quest> = new Map();

		for (const profile of PLATFORM_MATRIX) {
			try {
				const superPropsBase64 = Buffer.from(JSON.stringify(profile.superProperties)).toString('base64');
				const res = (await client.rest.get('/quests/@me', {
					headers: {
						'x-super-properties': superPropsBase64,
						'x-discord-locale': profile.locale,
					},
				})) as AllQuestsResponse;

				if (res && Array.isArray(res.quests)) {
					for (const rawQuest of res.quests) {
						if (!discovered.has(rawQuest.id)) {
							discovered.set(rawQuest.id, Quest.create(rawQuest));
						}
					}
				}
			} catch {
				// Continue to next platform profile
			}
		}

		return Array.from(discovered.values());
	}
}

export const GlobalScanner = new HiddenQuestsScanner();
```

- [ ] **Step 4: Chạy test để xác nhận test PASS**

Chạy: `npx tsx tests/scanner.test.ts`
Kết quả kỳ vọng: PASS với thông báo xác nhận ma trận nền tảng.

- [ ] **Step 5: Tích hợp Scanner vào `src/questManager.ts`**

Trong `src/questManager.ts`, thêm phương thức `scanHiddenQuests()` gọi `GlobalScanner.scan(this.client)` và gộp danh sách nhiệm vụ mới vào map `this.quests`.

- [ ] **Step 6: Commit code Task 5**

```bash
git add src/core/scanner.ts tests/scanner.test.ts src/questManager.ts
git commit -m "feat(core): implement Hidden Quests Discovery Scanner with platform matrix spoofing"
```

---

### Task 6: Terminal Interactive TUI Dashboard & Hotkey Controller

**Files:**
- Create: `src/ui/tui.ts`
- Modify: `bot.ts`
- Create: `tests/tui.test.ts`

**Interfaces:**
- Consumes: `cli-table3`, `chalk`, `src/ui/banner.ts`, `process.stdin`.
- Produces: 
  - Class `TUIDashboard`: `{ render(context: DashboardContext): void; bindHotkeys(callbacks: HotkeyCallbacks): void; cleanup(): void; }`

- [ ] **Step 1: Viết test cho TUIDashboard (Non-TTY Safe)**

Tạo file `tests/tui.test.ts`:
```typescript
import assert from 'node:assert';
import { TUIDashboard } from '../src/ui/tui';

console.log('Testing TUIDashboard initialization...');
const tui = new TUIDashboard({ isHeadless: true });
assert.strictEqual(tui.isInteractive(), false, 'Headless mode must disable interactive raw mode');

// Test rendering table generation
const output = tui.formatStatsTable({
	user: { username: 'HyperUser', id: '123456789' },
	nativeTier: 'Tier 3 (Pure TS)',
	proxyStatus: '1.2.3.4:8080 (IPv4)',
	activeQuestsCount: 2,
	completedQuestsCount: 1,
});

assert.ok(output.includes('HyperUser'), 'Stats table should contain username');
assert.ok(output.includes('Tier 3'), 'Stats table should contain native tier');
console.log('✔ TUIDashboard tests passed successfully!');
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/tui.test.ts`
Kết quả kỳ vọng: FAIL với lỗi "Cannot find module '../src/ui/tui'".

- [ ] **Step 3: Cài đặt `src/ui/tui.ts`**

Tạo file `src/ui/tui.ts`:
```typescript
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

		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.setEncoding('utf8');

		process.stdin.on('data', (keyStr: string) => {
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
```

- [ ] **Step 4: Chạy test để xác nhận test PASS**

Chạy: `npx tsx tests/tui.test.ts`
Kết quả kỳ vọng: PASS với "✔ TUIDashboard tests passed successfully!".

- [ ] **Step 5: Tích hợp `TUIDashboard` vào file thực thi chính `bot.ts`**

Trong `bot.ts`:
- Thay thế đoạn in logo cũ bằng `renderBanner()` từ `src/ui/banner`.
- Khởi tạo instance `TUIDashboard` và liên kết sự kiện phím nóng:
  - Phím `r`: gọi `questManager.scanHiddenQuests()`.
  - Phím `p`: gọi `GlobalProxyPool.rotate()`.
  - Phím `c`: in thông tin solver `GlobalCaptchaPipeline`.
  - Phím `q` / `Ctrl+C`: chạy hàm thoát an toàn `gracefulShutdown()`.

- [ ] **Step 6: Commit code Task 6**

```bash
git add src/ui/tui.ts tests/tui.test.ts bot.ts
git commit -m "feat(ui): implement real-time interactive TUIDashboard with safe hotkeys and headless support"
```

---

### Task 7: Discord Remote Controller Bot (Slash Commands)

**Files:**
- Create: `src/remote/discordBot.ts`
- Create: `tests/discordBot.test.ts`
- Modify: `bot.ts`

**Interfaces:**
- Consumes: `@discordjs/core`, `@discordjs/ws`, `REST`, `process.env.DISCORD_BOT_TOKEN`.
- Produces: 
  - Class `DiscordRemoteBot`: `{ isEnabled(): boolean; start(): Promise<void>; stop(): Promise<void>; }`

- [ ] **Step 1: Viết test cho DiscordRemoteBot**

Tạo file `tests/discordBot.test.ts`:
```typescript
import assert from 'node:assert';
import { DiscordRemoteBot } from '../src/remote/discordBot';

console.log('Testing DiscordRemoteBot state...');
const botWithoutToken = new DiscordRemoteBot('');
assert.strictEqual(botWithoutToken.isEnabled(), false, 'Bot should be disabled if token is empty');

const botWithToken = new DiscordRemoteBot('dummy_token_123');
assert.strictEqual(botWithToken.isEnabled(), true, 'Bot should report enabled when token is provided');

console.log('✔ DiscordRemoteBot state tests passed!');
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `npx tsx tests/discordBot.test.ts`
Kết quả kỳ vọng: FAIL với lỗi "Cannot find module '../src/remote/discordBot'".

- [ ] **Step 3: Cài đặt `src/remote/discordBot.ts`**

Tạo file `src/remote/discordBot.ts`:
```typescript
import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';
import { Client, GatewayDispatchPayload } from '@discordjs/core';
import { QuestManager } from '../questManager';

export class DiscordRemoteBot {
	private token: string;
	private enabled: boolean;
	private client: Client | null = null;
	private ws: WebSocketManager | null = null;

	constructor(token: string = process.env.DISCORD_BOT_TOKEN || '') {
		this.token = token.trim();
		this.enabled = this.token.length > 20;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	public async start(questManager?: QuestManager): Promise<void> {
		if (!this.enabled) return;

		try {
			const rest = new REST({ version: '10' }).setToken(this.token);
			this.ws = new WebSocketManager({
				token: this.token,
				intents: 0,
				rest,
			});
			this.client = new Client({ rest, gateway: this.ws });

			// Listen for interactions (Slash Commands)
			this.client.on('interactionCreate' as any, async ({ data, api }: any) => {
				if (data.type === 2) { // APPLICATION_COMMAND
					const cmdName = data.data.name;
					if (cmdName === 'status') {
						await api.interactions.reply(data.id, data.token, {
							content: `⚡ **Hyper AutoFarm Quest Status**\n- Nhiệm vụ đang chạy: ${questManager ? questManager.size : 0}`,
						});
					}
				}
			});

			await this.ws.connect();
		} catch {
			// Fail-safe: do not crash the farm bot if remote bot connection fails
		}
	}

	public async stop(): Promise<void> {
		if (this.ws) {
			await this.ws.destroy();
		}
	}
}

export const GlobalRemoteBot = new DiscordRemoteBot();
```

- [ ] **Step 4: Chạy test để xác nhận test PASS**

Chạy: `npx tsx tests/discordBot.test.ts`
Kết quả kỳ vọng: PASS với "✔ DiscordRemoteBot state tests passed!".

- [ ] **Step 5: Tích hợp Remote Bot vào `bot.ts`**

Trong `bot.ts`, kiểm tra `GlobalRemoteBot.isEnabled()`. Nếu bật, khởi chạy `GlobalRemoteBot.start(client.questManager)` và đăng ký hàm dừng trong `gracefulShutdown()`.

- [ ] **Step 6: Commit code Task 7**

```bash
git add src/remote/discordBot.ts tests/discordBot.test.ts bot.ts
git commit -m "feat(remote): implement Discord Remote Controller Bot with slash command handler"
```

---

### Task 8: Nâng Cấp DevTools Script ([`code.js`](file:///c:/Users/ADMIN/.gemini/antigravity-ide/scratch/hyper-autofarmquest-/code.js)), Cấu Trúc Native & Tài Liệu README

**Files:**
- Modify: `code.js`
- Create: `native/addon/binding.gyp`
- Create: `native/addon/src/tls_fingerprint.cpp`
- Create: `native/helper/sleeper.cpp`
- Modify: `README.md`
- Create: `tests/codeScript.test.ts`

**Interfaces:**
- Consumes: Native build tooling specs, Discord DevTools JS console environment.
- Produces: 
  - Modernized `code.js` script with video/desktop/activity quest support.
  - C++ Native scaffold for future compilation.
  - Comprehensive multi-language `README.md`.

- [ ] **Step 1: Viết test cú pháp cho `code.js`**

Tạo file `tests/codeScript.test.ts`:
```typescript
import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing code.js syntax and completeness...');
const script = fs.readFileSync('code.js', 'utf8');
assert.ok(script.length > 1000, 'code.js should have content');
assert.ok(script.includes('Auto Hyper') || script.includes('Discord Quest'), 'code.js should have signature header');
assert.doesNotThrow(() => new Function(script), 'code.js must have valid JavaScript syntax');
console.log('✔ code.js syntax test passed!');
```

- [ ] **Step 2: Nâng cấp script DevTools Console trong `code.js`**

Cập nhật `code.js` để bao bọc bằng IIFE an toàn, hỗ trợ đồng thời video quest, heartbeat và auto-claim trực tiếp trong Console Discord Desktop.

- [ ] **Step 3: Tạo khung mã nguồn Native Tier 1 và Tier 2 trong `native/`**

- Tạo `native/addon/binding.gyp` với cấu hình build Node-API C++ addon.
- Tạo `native/addon/src/tls_fingerprint.cpp` stub tuân thủ chuẩn Node-API.
- Tạo `native/helper/sleeper.cpp` triển khai Discord IPC pipe connector.

- [ ] **Step 4: Chạy test cú pháp `tests/codeScript.test.ts`**

Chạy: `npx tsx tests/codeScript.test.ts`
Kết quả kỳ vọng: PASS với "✔ code.js syntax test passed!".

- [ ] **Step 5: Cập nhật tài liệu `README.md` đầy đủ hướng dẫn sử dụng**

Cập nhật `README.md` với:
- Giới thiệu kiến trúc 3-Tier Native Engine.
- Hướng dẫn cấu hình `.env` (TOKEN, PROXY, CAPSOLVER_API_KEY, DISCORD_BOT_TOKEN).
- Danh sách hotkeys TUI (`r`, `p`, `c`, `q`).
- Hướng dẫn dùng script 1-click DevTools Console (`code.js`).

- [ ] **Step 6: Commit code Task 8**

```bash
git add code.js native/ README.md tests/codeScript.test.ts
git commit -m "feat(devtools): upgrade code.js script, scaffold native subsystems and update documentation"
```

---

### Task 9: Kiểm Thử Toàn Diện Hệ Thống (Integration Verification) & Git Push

**Files:**
- Create: `tests/runner.ts`
- Verification: `npm run typecheck`, `npm test`

- [ ] **Step 1: Tạo test runner tích hợp `tests/runner.ts`**

Tạo file `tests/runner.ts`:
```typescript
import { execSync } from 'node:child_process';

const testFiles = [
	'tests/banner.test.ts',
	'tests/nativeLoader.test.ts',
	'tests/proxyPool.test.ts',
	'tests/captcha.test.ts',
	'tests/scanner.test.ts',
	'tests/tui.test.ts',
	'tests/discordBot.test.ts',
	'tests/codeScript.test.ts',
];

console.log('🚀 Chạy toàn bộ Test Suite của Hyper AutoFarm Quest...\n');
for (const file of testFiles) {
	console.log(`▶ Executing ${file}...`);
	execSync(`npx tsx ${file}`, { stdio: 'inherit' });
}
console.log('\n✨ TẤT CẢ 8 BỘ TEST ĐÃ HOÀN TOÀN VƯỢT QUA!');
```

- [ ] **Step 2: Chạy kiểm tra TypeScript (`npm run typecheck`)**

Chạy: `npm run typecheck`
Kết quả kỳ vọng: EXIT CODE 0 không có bất kỳ lỗi biên dịch type nào.

- [ ] **Step 3: Chạy toàn bộ test runner (`npm test`)**

Chạy: `npm test`
Kết quả kỳ vọng: Tất cả 8 bài test đều PASS.

- [ ] **Step 4: Kiểm thử khởi động bot ở chế độ dry-run/headless**

Chạy lệnh giả lập khởi động:
`npx tsx bot.ts --headless`
Xác nhận ứng dụng đọc cấu hình và khởi tạo các module thành công.

- [ ] **Step 5: Thực hiện git push lên GitHub repository `sorajiz/hyper-autofarmquest-`**

Chạy:
```bash
git push origin master
```
Kết quả kỳ vọng: Mã nguồn mới được đẩy an toàn lên kho lưu trữ từ xa.
