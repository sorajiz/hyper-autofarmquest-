declare module 'socks-proxy-agent' {
	import { Agent } from 'node:http';
	export class SocksProxyAgent extends Agent {
		constructor(input: string | URL, options?: any);
	}
}
