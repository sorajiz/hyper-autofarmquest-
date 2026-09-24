import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { GlobalProxyPool } from './proxyPool';

/**
 * High-performance Axios client with built-in proxy rotation and rate-limit interceptors
 */
export function createAxiosDiscordClient(token: string): AxiosInstance {
	const instance = axios.create({
		baseURL: 'https://discord.com/api/v9',
		timeout: 10000,
		headers: {
			'Authorization': token.replace('Bot ', ''),
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
			'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
		},
	});

	// Request Interceptor: Injects dynamic residential IP headers ("IP Chung Cư")
	instance.interceptors.request.use((config) => {
		const residentialHeaders = GlobalProxyPool.getResidentialHeaders();
		for (const [key, val] of Object.entries(residentialHeaders)) {
			config.headers.set(key, val);
		}
		return config;
	});

	// Response Interceptor: Catches HTTP 429 and triggers auto-rotation
	instance.interceptors.response.use(
		(response) => {
			const active = GlobalProxyPool.getHealthyProxy();
			if (active) GlobalProxyPool.recordSuccess(active.url);
			return response;
		},
		(error) => {
			if (error.response?.status === 429) {
				const retryAfter = error.response.headers['retry-after'];
				const retryMs = retryAfter ? Math.ceil(Number(retryAfter) * 1000) : 30000;
				const active = GlobalProxyPool.getHealthyProxy();
				GlobalProxyPool.handleRateLimit(active?.url, retryMs);
			}
			return Promise.reject(error);
		}
	);

	return instance;
}
