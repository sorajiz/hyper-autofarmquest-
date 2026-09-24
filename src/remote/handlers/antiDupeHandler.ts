import chalk from 'chalk';

export class AntiDupeHandler {
	private static instance: AntiDupeHandler;
	private handledInteractions = new Map<string, number>(); // interactionId -> timestamp
	private userCooldowns = new Map<string, number>(); // userId:action -> timestamp
	private deployedFingerprints = new Map<string, string>(); // guildId -> fingerprint

	public static getInstance(): AntiDupeHandler {
		if (!AntiDupeHandler.instance) {
			AntiDupeHandler.instance = new AntiDupeHandler();
		}
		return AntiDupeHandler.instance;
	}

	/**
	 * Checks if an interaction ID was already processed within the last 60 seconds.
	 * If not, marks it as handled and returns false. If yes, returns true (duplicate).
	 */
	public isDuplicateInteraction(id: string): boolean {
		const now = Date.now();
		// Cleanup stale entries
		for (const [key, ts] of this.handledInteractions.entries()) {
			if (now - ts > 60000) {
				this.handledInteractions.delete(key);
			}
		}

		if (this.handledInteractions.has(id)) {
			return true;
		}
		this.handledInteractions.set(id, now);
		return false;
	}

	/**
	 * Prevents user spam clicking or rapid command firing within a short window (default 500ms).
	 */
	public isUserDebounced(userId: string, action: string, windowMs: number = 500): boolean {
		const key = `${userId}:${action}`;
		const now = Date.now();
		const last = this.userCooldowns.get(key) || 0;
		if (now - last < windowMs) {
			return true;
		}
		this.userCooldowns.set(key, now);
		return false;
	}

	/**
	 * Determines if commands need deployment to avoid redundant PUT calls and Discord command duplication.
	 */
	public shouldDeploy(target: string, fingerprint: string): boolean {
		return this.deployedFingerprints.get(target) !== fingerprint;
	}

	public markDeployed(target: string, fingerprint: string): void {
		this.deployedFingerprints.set(target, fingerprint);
	}
}

export const GlobalAntiDupe = AntiDupeHandler.getInstance();
