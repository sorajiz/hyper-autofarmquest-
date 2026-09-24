import { ClientQuest } from '../client';
import { Quest } from '../quest';
import { PLATFORM_MATRIX } from './scanner';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ExtractedEntitlement {
	id: string;
	sku_id?: string;
	application_id?: string;
	promotion_id?: string;
	type?: number;
	consumed?: boolean;
	deleted?: boolean;
}

export interface ExtractedQuestSummary {
	id: string;
	name: string;
	publisher: string;
	taskType: string;
	progressSeconds: number;
	targetSeconds: number;
	percentCompleted: number;
	claimable: boolean;
	completed: boolean;
	expiresAt: string;
	rewardName?: string;
}

export interface AccountAuditReport {
	user: {
		id: string;
		username: string;
		discriminator?: string;
		flags?: number;
	};
	scanTimestamp: string;
	scanDurationMs: number;
	totalDiscoveredQuests: number;
	activeQuests: ExtractedQuestSummary[];
	hiddenQuests: ExtractedQuestSummary[];
	claimableRewards: ExtractedQuestSummary[];
	entitlements: ExtractedEntitlement[];
	experimentsCount: number;
	connections: Array<{ type: string; name: string }>;
	security: {
		isBlocked: boolean;
		blockedUntil?: string;
		isSuspended: boolean;
		suspendedUntil?: string;
		riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
	};
}

export class UltraDiscordExtractor {
	private readonly client: ClientQuest;

	constructor(client: ClientQuest) {
		this.client = client;
	}

	public async extractAll(): Promise<AccountAuditReport> {
		const startTime = Date.now();

		// 1. Concurrent core endpoints fetch
		const [userRes, questsRes, entitlementsRes, experimentsRes, connectionsRes] = await Promise.allSettled([
			this.client.rest.get('/users/@me') as Promise<any>,
			this.client.rest.get('/quests/@me') as Promise<any>,
			this.client.rest.get('/users/@me/entitlements') as Promise<any>,
			this.client.rest.get('/experiments') as Promise<any>,
			this.client.rest.get('/users/@me/connections') as Promise<any>,
		]);

		const user = userRes.status === 'fulfilled' ? userRes.value : { id: 'unknown', username: 'Unknown User' };
		const questsData = questsRes.status === 'fulfilled' ? questsRes.value : { quests: [] };
		const entitlements = entitlementsRes.status === 'fulfilled' && Array.isArray(entitlementsRes.value) ? entitlementsRes.value : [];
		const experiments = experimentsRes.status === 'fulfilled' && experimentsRes.value?.assignments ? experimentsRes.value.assignments : [];
		const connections = connectionsRes.status === 'fulfilled' && Array.isArray(connectionsRes.value) ? connectionsRes.value : [];

		// 2. Parse active quests
		const rawQuests: any[] = Array.isArray(questsData.quests) ? questsData.quests : [];
		const activeQuests: ExtractedQuestSummary[] = [];
		const claimableRewards: ExtractedQuestSummary[] = [];

		for (const raw of rawQuests) {
			const q = Quest.create(raw);
			const primary = q.getPrimaryTask();
			const target = primary?.target ?? 900;
			const current = q.getCurrentProgress(primary?.name);
			const percent = target > 0 ? Number(((current / target) * 100).toFixed(1)) : 0;
			const isCompleted = q.isCompleted();
			const isClaimable = isCompleted && !q.hasClaimedRewards();

			const summary: ExtractedQuestSummary = {
				id: q.id,
				name: q.config.messages.quest_name || 'Discord Quest',
				publisher: q.config.messages.game_publisher || 'Discord Partner',
				taskType: primary?.name || 'STREAM_OR_PLAY',
				progressSeconds: Math.floor(current),
				targetSeconds: target,
				percentCompleted: Math.min(100, percent),
				claimable: isClaimable,
				completed: isCompleted,
				expiresAt: q.config.expires_at,
				rewardName: q.config.rewards_config?.rewards?.[0]?.messages?.name,
			};

			activeQuests.push(summary);
			if (isClaimable) {
				claimableRewards.push(summary);
			}
		}

		// 3. Multi-platform & multi-locale deep matrix sweep for unlisted/hidden quests
		const discoveredHiddenMap = new Map<string, ExtractedQuestSummary>();
		const existingIds = new Set(activeQuests.map((q) => q.id));

		await Promise.allSettled(
			PLATFORM_MATRIX.map(async (profile) => {
				try {
					const superPropsBase64 = Buffer.from(JSON.stringify(profile.superProperties)).toString('base64');
					const res = (await this.client.rest.get('/quests/@me', {
						headers: {
							'x-super-properties': superPropsBase64,
							'x-discord-locale': profile.locale,
						},
					})) as any;

					if (res && Array.isArray(res.quests)) {
						for (const raw of res.quests) {
							if (!existingIds.has(raw.id) && !discoveredHiddenMap.has(raw.id)) {
								const q = Quest.create(raw);
								const primary = q.getPrimaryTask();
								const target = primary?.target ?? 900;
								discoveredHiddenMap.set(raw.id, {
									id: q.id,
									name: q.config.messages.quest_name || 'Hidden / Unlisted Quest',
									publisher: q.config.messages.game_publisher || 'Partner',
									taskType: primary?.name || 'SPECIAL_PROMO',
									progressSeconds: 0,
									targetSeconds: target,
									percentCompleted: 0,
									claimable: false,
									completed: false,
									expiresAt: q.config.expires_at,
									rewardName: q.config.rewards_config?.rewards?.[0]?.messages?.name,
								});
							}
						}
					}
				} catch {}
			}),
		);

		const hiddenQuests = Array.from(discoveredHiddenMap.values());

		// 4. Security risk assessment
		const isBlocked = Boolean(questsData.quest_enrollment_blocked_until);
		const isSuspended = Boolean(questsData.quest_access_suspended_until);
		let riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
		if (isSuspended) riskTier = 'CRITICAL';
		else if (isBlocked) riskTier = 'HIGH';

		const durationMs = Date.now() - startTime;

		const report: AccountAuditReport = {
			user: {
				id: user.id || 'unknown',
				username: user.username || 'unknown',
				discriminator: user.discriminator,
				flags: user.flags,
			},
			scanTimestamp: new Date().toISOString(),
			scanDurationMs: durationMs,
			totalDiscoveredQuests: activeQuests.length + hiddenQuests.length,
			activeQuests,
			hiddenQuests,
			claimableRewards,
			entitlements: entitlements.map((e: any) => ({
				id: e.id,
				sku_id: e.sku_id,
				application_id: e.application_id,
				promotion_id: e.promotion_id,
				type: e.type,
				consumed: e.consumed,
				deleted: e.deleted,
			})),
			experimentsCount: Array.isArray(experiments) ? experiments.length : 0,
			connections: connections.map((c: any) => ({
				type: c.type || 'unknown',
				name: c.name || 'unknown',
			})),
			security: {
				isBlocked,
				blockedUntil: questsData.quest_enrollment_blocked_until || undefined,
				isSuspended,
				suspendedUntil: questsData.quest_access_suspended_until || undefined,
				riskTier,
			},
		};

		return report;
	}

	public async exportVaultAudit(report: AccountAuditReport, outputDir: string = './vault'): Promise<string> {
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}
		const filePath = path.join(outputDir, 'discord_vault_audit.json');
		fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
		return filePath;
	}
}
