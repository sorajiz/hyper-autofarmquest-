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
