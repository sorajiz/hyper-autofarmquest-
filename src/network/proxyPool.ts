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
