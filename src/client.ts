import { Client, APIGatewayBotInfo } from '@discordjs/core';
import { RequestInit, ProxyAgent } from 'undici';
import { REST, DefaultRestOptions, ResponseLike } from '@discordjs/rest';
import { WebSocketManager, WebSocketShard } from '@discordjs/ws';
import { GatewaySendPayload, GatewayOpcodes } from 'discord-api-types/v10';
import { QuestManager } from './questManager';
import { AllQuestsResponse } from './interface';
import { Constants } from './constants';

import { SocksProxyAgent } from 'socks-proxy-agent';
import { GlobalProxyPool } from './network/proxyPool';

// Initialize proxy pool from environment variables
const rawProxies = (process.env.PROXIES || process.env.PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '')
	.split(',')
	.map((p) => p.trim())
	.filter(Boolean);

rawProxies.forEach((p) => GlobalProxyPool.addProxy(p));

export function getActiveDispatcher(): any {
	const currentProxy = GlobalProxyPool.getHealthyProxy();
	if (!currentProxy || currentProxy.isVirtualResidential) return undefined;

	if (currentProxy.protocol === 'socks5:') {
		return new SocksProxyAgent(currentProxy.url);
	}
	return new ProxyAgent(currentProxy.url);
}

export const globalDispatcher = getActiveDispatcher();

async function makeRequest(
	url: string,
	init: RequestInit,
): Promise<ResponseLike> {
	const dispatcher = getActiveDispatcher();
	if (dispatcher) {
		(init as any).dispatcher = dispatcher;
	}
	if (init.headers) {
		const myHeaders = new Headers(init.headers as any);
		if (myHeaders.has('User-Agent')) {
			myHeaders.set('User-Agent', Constants.USER_AGENT);
		}
		if (myHeaders.has('Authorization')) {
			myHeaders.set(
				'Authorization',
				myHeaders.get('Authorization')!.replace('Bot ', ''),
			);
		}
		myHeaders.append('accept-language', 'vi,en-US;q=0.9,en;q=0.8');
		myHeaders.append('origin', 'https://discord.com');
		myHeaders.append('pragma', 'no-cache');
		myHeaders.append('priority', 'u=1, i');
		myHeaders.append('referer', 'https://discord.com/channels/@me');
		myHeaders.append(
			'sec-ch-ua',
			'"Not)A;Brand";v="8", "Chromium";v="138"',
		);
		myHeaders.append('sec-ch-ua-mobile', '?0');
		myHeaders.append('sec-ch-ua-platform', '"Windows"');
		myHeaders.append('sec-fetch-dest', 'empty');
		myHeaders.append('sec-fetch-mode', 'cors');
		myHeaders.append('sec-fetch-site', 'same-origin');
		myHeaders.append('x-debug-options', 'bugReporterEnabled');
		myHeaders.append('x-discord-locale', 'vi');
		myHeaders.append('x-discord-timezone', 'Asia/Saigon');
		myHeaders.append(
			'x-super-properties',
			Buffer.from(JSON.stringify(Constants.Properties)).toString(
				'base64',
			),
		);

		// Injects dynamic residential IP headers ("IP Chung Cư / FTTH") to disperse IP rate limiting
		const residentialHeaders = GlobalProxyPool.getResidentialHeaders();
		for (const [key, val] of Object.entries(residentialHeaders)) {
			if (!myHeaders.has(key)) {
				myHeaders.set(key, val);
			}
		}

		init.headers = myHeaders;
	}

	const activeProxy = GlobalProxyPool.getHealthyProxy();
	try {
		const res = await DefaultRestOptions.makeRequest(url, init);

		// Handle HTTP 429 Rate Limits
		if (res.status === 429) {
			const retryHeader = res.headers.get('retry-after');
			const retryAfterMs = retryHeader ? Math.ceil(Number(retryHeader) * 1000) : 30000;
			GlobalProxyPool.handleRateLimit(activeProxy?.url, retryAfterMs);
		} else if (res.status >= 200 && res.status < 400) {
			if (activeProxy) {
				GlobalProxyPool.recordSuccess(activeProxy.url);
			}
		}

		return res;
	} catch (err) {
		// Connection failed - mark active proxy and fallback immediately
		if (activeProxy) {
			GlobalProxyPool.handleRateLimit(activeProxy.url, 45000);
		}
		throw err;
	}
}

const originalSend = WebSocketShard.prototype.send;
WebSocketShard.prototype.send = async function (payload: GatewaySendPayload) {
	if (payload.op === GatewayOpcodes.Identify) {
		const rawD = payload.d as any;
		// If intents are provided (Discord Bot), ensure Discord Android Mobile status + rich presence
		if (rawD?.intents !== undefined && rawD.intents > 0) {
			rawD.properties = {
				...(rawD.properties || {}),
				os: 'Android',
				browser: 'Discord Android',
				device: 'Discord Android',
				$os: 'Android',
				$browser: 'Discord Android',
				$device: 'Discord Android',
			};
			if (!rawD.presence?.activities?.length) {
				rawD.presence = {
					status: 'online',
					since: null,
					afk: false,
					activities: [
						{
							name: "Sora's Station",
							type: 0,
							state: 'Mua hàng ở ticket nha các bạn',
						},
					],
				};
			}
			return originalSend.call(this, payload);
		}
		payload.d = {
			token: payload.d.token,
			properties: {
				...Constants.Properties,
				is_fast_connect: false,
				gateway_connect_reasons: 'AppSkeleton',
			},
			capabilities: 0,
			presence: payload.d.presence,
			compress: payload.d.compress,
			client_state: {
				guild_versions: {},
			},
		} as any;
	}
	return originalSend.call(this, payload);
};

export class ClientQuest extends Client {
	public questManager: QuestManager | null = null;
	public websocketManager: WebSocketManager;
	constructor(token: string) {
		const rest = new REST({ version: '10', makeRequest }).setToken(token);
		const gateway = new WebSocketManager({
			token: token,
			intents: 0,
			rest,
		});
		gateway.fetchGatewayInformation = (
			force?: boolean,
		): Promise<APIGatewayBotInfo> => {
			return Promise.resolve({
				url: 'wss://gateway.discord.gg',
				shards: 1,
				session_start_limit: {
					total: 1000,
					remaining: 1000,
					reset_after: 14400000,
					max_concurrency: 1,
				},
			});
		};
		super({ rest, gateway });
		this.websocketManager = gateway;
	}
	connect() {
		return this.websocketManager.connect();
	}
	fetchCurrentUser() {
		return this.rest.get('/users/@me') as Promise<{ id: string; username: string; global_name?: string }>;
	}
	fetchQuests() {
		return this.rest.get('/quests/@me').then((response) => {
			this.questManager = QuestManager.fromResponse(
				this,
				response as AllQuestsResponse,
			);
			return this.questManager;
		});
	}
}
