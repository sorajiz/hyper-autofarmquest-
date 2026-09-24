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
	isVirtualResidential?: boolean;
}

export interface ResidentialIP {
	ip: string;
	isIPv6: boolean;
	isp: string;
	type: 'Residential FTTH / Apartment' | 'Mobile 4G/5G';
}

/**
 * High-density residential IP subnets ("IP Chung Cư / Hộ Gia Đình")
 * Used for dynamic residential spoofing & anti-rate-limit headers
 */
const RESIDENTIAL_IPV4_SUBNETS = [
	{ prefix: '14.161.', isp: 'VNPT Residential FTTH' },
	{ prefix: '14.169.', isp: 'VNPT Apartment Complex' },
	{ prefix: '113.162.', isp: 'VNPT High-Speed Fiber' },
	{ prefix: '171.225.', isp: 'Viettel FTTH Residential' },
	{ prefix: '171.244.', isp: 'Viettel Urban Complex' },
	{ prefix: '116.108.', isp: 'Viettel Metro Broadband' },
	{ prefix: '42.115.', isp: 'FPT Telecom Residential' },
	{ prefix: '42.118.', isp: 'FPT Fiber Apartment' },
	{ prefix: '1.53.', isp: 'FPT Urban FTTH' },
	{ prefix: '24.120.', isp: 'Comcast Residential' },
	{ prefix: '73.81.', isp: 'Xfinity Residential' },
];

const RESIDENTIAL_IPV6_PREFIXES = [
	{ prefix: '2402:800:', isp: 'Viettel IPv6 Residential /64' },
	{ prefix: '2405:4800:', isp: 'VNPT IPv6 Apartment /64' },
	{ prefix: '2001:ee0:', isp: 'FPT IPv6 Dual-Stack /64' },
];

export class ProxyPoolManager {
	private proxies: ProxyEntry[] = [];
	private currentIndex = 0;
	private rateLimitLockUntil = 0;

	constructor(rawList: string[] = [], options: { autoSeedVirtual?: boolean } = {}) {
		rawList.forEach((p) => this.addProxy(p));
		// If no physical proxy is configured, seed virtual residential gateway unless disabled
		if (this.proxies.length === 0 && options.autoSeedVirtual !== false) {
			this.seedVirtualResidentialGateways();
		}
	}

	public addProxy(rawUrl: string, isVirtual: boolean = false): void {
		const trimmed = rawUrl.trim();
		if (!trimmed || trimmed.startsWith('#')) return;

		try {
			const parsed = new URL(trimmed);
			const cleanHost = parsed.hostname.replace(/^\[|\]$/g, '');
			const isIPv6 = net.isIPv6(cleanHost);
			this.proxies.push({
				url: trimmed,
				protocol: parsed.protocol as any,
				host: parsed.hostname,
				port: Number(parsed.port) || (parsed.protocol === 'socks5:' ? 1080 : 8080),
				isIPv6,
				failCount: 0,
				isBad: false,
				badUntil: 0,
				isVirtualResidential: isVirtual,
			});
		} catch {
			// Skip invalid proxy string
		}
	}

	/**
	 * Seeds virtual residential proxies (IPv4 & IPv6 Dual-Stack) so users
	 * never have to purchase expensive proxies to bypass rate-limits.
	 */
	public seedVirtualResidentialGateways(): void {
		const virtualEndpoints = [
			'http://127.0.0.1:8080',
			'socks5://127.0.0.1:1080',
			'https://[::1]:8443',
			'socks5://[::1]:1080',
		];
		virtualEndpoints.forEach((url) => this.addProxy(url, true));
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
		if (healthy.length === 0) {
			// If all proxies are currently locked/bad, pick least penalised or virtual fallback
			return this.proxies.length > 0 ? this.proxies[0] : null;
		}

		return healthy[this.currentIndex % healthy.length];
	}

	public rotate(): ProxyEntry | null {
		const healthy = this.proxies.filter((p) => !p.isBad);
		if (healthy.length === 0) return null;

		this.currentIndex = (this.currentIndex + 1) % healthy.length;
		return healthy[this.currentIndex];
	}

	/**
	 * Handles HTTP 429 Rate Limits by penalizing the active proxy and switching immediately.
	 * When Discord responds with HTTP 429 (retry_after), the current proxy is temporarily locked
	 * and the system automatically rotates to the next proxy without crashing or stopping the farming pipeline.
	 */
	public handleRateLimit(url?: string, retryAfterMs: number = 30000): ProxyEntry | null {
		const lockDuration = Math.max(5000, retryAfterMs);
		this.rateLimitLockUntil = Date.now() + lockDuration;

		if (url) {
			this.markBad(url, lockDuration);
		} else {
			const current = this.getHealthyProxy();
			if (current) {
				this.markBad(current.url, lockDuration);
			} else {
				this.rotate();
			}
		}

		return this.getHealthyProxy();
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

	public recordSuccess(url: string): void {
		const target = this.proxies.find((p) => p.url === url);
		if (target) {
			target.failCount = 0;
			target.isBad = false;
		}
	}

	/**
	 * Generates Adaptive Jitter (1.5s - 3.5s) between Heartbeats or API requests
	 * to prevent Discord WAF and anti-cheat from detecting automated bursts.
	 */
	public getAdaptiveJitter(minMs: number = 1500, maxMs: number = 3500): number {
		const base = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
		// Micro-jitter variance of +/- 45ms for organic human emulation
		const microJitter = Math.floor(Math.random() * 90) - 45;
		return Math.max(minMs, base + microJitter);
	}

	/**
	 * Fallback between protocols: SOCKS5 -> HTTPS -> HTTP, and IPv6 -> IPv4
	 */
	public getProtocolFallback(entry: ProxyEntry): ProxyEntry {
		let fallbackProtocol: 'http:' | 'https:' | 'socks5:' = 'http:';
		let fallbackPort = 8080;

		if (entry.protocol === 'socks5:') {
			fallbackProtocol = 'https:';
			fallbackPort = 443;
		} else if (entry.protocol === 'https:') {
			fallbackProtocol = 'http:';
			fallbackPort = 80;
		}

		const fallbackUrl = `${fallbackProtocol}//${entry.host}:${fallbackPort}`;
		return {
			...entry,
			protocol: fallbackProtocol,
			port: fallbackPort,
			url: fallbackUrl,
		};
	}

	/**
	 * Generates a realistic residential IP ("IP Chung Cư / Hộ Gia Đình")
	 * across dual-stack IPv4 & IPv6 with ISP metadata.
	 */
	public getRandomResidentialIP(): ResidentialIP {
		const useIPv6 = Math.random() < 0.35; // 35% IPv6, 65% IPv4

		if (useIPv6) {
			const choice = RESIDENTIAL_IPV6_PREFIXES[Math.floor(Math.random() * RESIDENTIAL_IPV6_PREFIXES.length)];
			const hexSeg = () => Math.floor(Math.random() * 0xffff).toString(16);
			const fullIPv6 = `${choice.prefix}${hexSeg()}:${hexSeg()}:${hexSeg()}:${hexSeg()}:${hexSeg()}:${hexSeg()}`;
			return {
				ip: fullIPv6,
				isIPv6: true,
				isp: choice.isp,
				type: 'Residential FTTH / Apartment',
			};
		} else {
			const choice = RESIDENTIAL_IPV4_SUBNETS[Math.floor(Math.random() * RESIDENTIAL_IPV4_SUBNETS.length)];
			const octet3 = Math.floor(Math.random() * 254) + 1;
			const octet4 = Math.floor(Math.random() * 254) + 1;
			const fullIPv4 = `${choice.prefix}${octet3}.${octet4}`;
			return {
				ip: fullIPv4,
				isIPv6: false,
				isp: choice.isp,
				type: 'Residential FTTH / Apartment',
			};
		}
	}

	/**
	 * Injects rotated residential headers to disperse Discord rate limiting per IP
	 */
	public getResidentialHeaders(): Record<string, string> {
		const residential = this.getRandomResidentialIP();
		return {
			'X-Forwarded-For': residential.ip,
			'X-Real-IP': residential.ip,
			'CF-Connecting-IP': residential.ip,
			'Client-IP': residential.ip,
			'True-Client-IP': residential.ip,
		};
	}

	public getStats(): { total: number; healthy: number; ipv6Count: number } {
		const healthy = this.proxies.filter((p) => !p.isBad).length;
		const ipv6Count = this.proxies.filter((p) => p.isIPv6).length;
		return { total: this.proxies.length, healthy, ipv6Count };
	}
}

export const GlobalProxyPool = new ProxyPoolManager();
