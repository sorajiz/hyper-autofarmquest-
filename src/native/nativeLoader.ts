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
				simulateActivityIPC: async () => true,
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
