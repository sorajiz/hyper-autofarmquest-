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
		return true;
	}
}
