import { ClientQuest } from './client';
import type { AllQuestsResponse } from './interface';
import { Quest } from './quest';
import { GlobalTraffic } from './traffic';

export class QuestManager implements Iterable<Quest> {
	private readonly quests = new Map<string, Quest>();
	public readonly client: ClientQuest;
	public questEnrollmentBlockedUntil: Date | null = null;
	public questAccessSuspendedUntil: Date | null = null;

	constructor(
		client: ClientQuest,
		quests: Quest[] = [],
		enrollmentBlockedUntil?: string | null,
		accessSuspendedUntil?: string | null,
	) {
		this.client = client;
		quests.forEach((quest) => this.quests.set(quest.id, quest));

		if (enrollmentBlockedUntil) {
			const d = new Date(enrollmentBlockedUntil);
			if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
				this.questEnrollmentBlockedUntil = d;
			}
		}
		if (accessSuspendedUntil) {
			const d = new Date(accessSuspendedUntil);
			if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
				this.questAccessSuspendedUntil = d;
			}
		}
	}

	static fromResponse(
		client: ClientQuest,
		response: AllQuestsResponse,
	): QuestManager {
		return new QuestManager(
			client,
			(response.quests || []).map((quest) => Quest.create(quest)),
			response.quest_enrollment_blocked_until,
			response.quest_access_suspended_until,
		);
	}

	[Symbol.iterator](): IterableIterator<Quest> {
		return this.quests.values();
	}

	get size(): number {
		return this.quests.size;
	}

	list(): Quest[] {
		return Array.from(this.quests.values());
	}

	get(id: string): Quest | undefined {
		return this.quests.get(id);
	}

	upsert(quest: Quest): void {
		this.quests.set(quest.id, quest);
	}

	remove(id: string): boolean {
		return this.quests.delete(id);
	}

	clear(): void {
		this.quests.clear();
	}

	getExpired(date: Date = new Date()): Quest[] {
		return this.list().filter((quest) => quest.isExpired(date));
	}

	getCompleted(): Quest[] {
		return this.list().filter((quest) => quest.isCompleted());
	}

	getClaimable(): Quest[] {
		return this.list().filter(
			(quest) => quest.isCompleted() && !quest.hasClaimedRewards(),
		);
	}

	hasQuest(id: string): boolean {
		return this.quests.has(id);
	}

	filterQuestsValid(): Quest[] {
		return this.list().filter((quest) => {
			if (quest.id === '1412491570820812933') return false; // Known blacklisted/broken quest
			if (quest.isExpired()) return false;
			// Skip if already completed and reward claimed
			if (quest.isCompleted() && quest.hasClaimedRewards()) return false;
			// Skip if no runnable task
			const primary = quest.getPrimaryTask();
			if (!primary) return false;
			return true;
		});
	}

	getAccountRestrictions(): { isBlocked: boolean; blockedUntil?: Date; isSuspended: boolean; suspendedUntil?: Date } {
		const now = Date.now();
		const isBlocked = Boolean(this.questEnrollmentBlockedUntil && this.questEnrollmentBlockedUntil.getTime() > now);
		const isSuspended = Boolean(this.questAccessSuspendedUntil && this.questAccessSuspendedUntil.getTime() > now);
		return {
			isBlocked,
			blockedUntil: this.questEnrollmentBlockedUntil ?? undefined,
			isSuspended,
			suspendedUntil: this.questAccessSuspendedUntil ?? undefined,
		};
	}

	async acceptQuest(questId: string): Promise<boolean> {
		const quest = this.get(questId);
		const trafficSealed = quest?.getTrafficMetadataSealed() ?? null;

		try {
			const res = await GlobalTraffic.enqueue(() =>
				this.client.rest.post(`/quests/${questId}/enroll`, {
					body: {
						location: 11, // QUEST_HOME_DESKTOP
						is_targeted: false,
						metadata_sealed: null,
						traffic_metadata_sealed: trafficSealed,
					},
				}),
			);
			if (quest && res) {
				quest.updateUserStatus(res as any);
			}
			return true;
		} catch (err: any) {
			return false;
		}
	}

	async claimQuestReward(questId: string): Promise<{ success: boolean; message: string }> {
		const quest = this.get(questId);
		const trafficSealed = quest?.getTrafficMetadataSealed() ?? null;

		try {
			const res = await GlobalTraffic.enqueue(() =>
				this.client.rest.post(`/quests/${questId}/claim-reward`, {
					body: {
						platform: 0,
						location: 11,
						is_targeted: false,
						metadata_sealed: null,
						traffic_metadata_sealed: trafficSealed,
					},
				}),
			);
			if (quest && res) {
				quest.updateUserStatus(res as any);
			}
			return { success: true, message: 'Đã nhận thưởng thành công!' };
		} catch (err: any) {
			const rawMsg = err?.message || String(err);
			if (rawMsg.includes('captcha') || err?.rawError?.captcha_key) {
				return {
					success: false,
					message: 'Discord yêu cầu Captcha. Vui lòng bấm Nhận quà trên Discord app.',
				};
			}
			return { success: false, message: rawMsg };
		}
	}

	async sendHeartbeat(quest: Quest, terminal: boolean = false): Promise<any> {
		const appId = quest.getApplicationId();
		if (!appId) return null;

		try {
			const res = await GlobalTraffic.enqueue(() =>
				this.client.rest.post(`/quests/${quest.id}/heartbeat`, {
					body: {
						application_id: appId,
						terminal,
					},
				}),
			);
			if (res) {
				quest.updateUserStatus(res as any);
			}
			return res;
		} catch (err) {
			return null;
		}
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private rnd(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	async spoofVideoProgress(
		quest: Quest,
		onProgress?: (done: number, total: number) => void,
	): Promise<boolean> {
		const primary = quest.getPrimaryTask();
		const secondsNeeded = primary?.target ?? 30;
		let cur = quest.getCurrentProgress(primary?.name);

		while (cur < secondsNeeded) {
			// Chu kỳ mô phỏng xem video thực tế 7s - 9.5s như người xem thật (tránh bị Discord anti-cheat flag)
			const delayMs = this.rnd(7000, 9500);
			await this.sleep(delayMs);

			const elapsedSec = delayMs / 1000 + (Math.random() * 0.02 - 0.01);
			cur += elapsedSec;

			// Format dấu phẩy động 6 số thập phân chuẩn Discord client
			const payloadTs = Number(Math.min(secondsNeeded, cur).toFixed(6));

			try {
				const res = (await GlobalTraffic.enqueue(() =>
					this.client.rest.post(`/quests/${quest.id}/video-progress`, {
						body: {
							timestamp: payloadTs,
						},
					}),
				)) as any;

				if (res) {
					quest.updateUserStatus(res);
					const serverVal = res?.progress?.[primary?.name || 'WATCH_VIDEO']?.value;
					if (serverVal != null && serverVal > cur) {
						cur = Math.min(secondsNeeded, serverVal);
					}
					if (res.completed_at) break;
				}

				if (onProgress) onProgress(Math.floor(cur), secondsNeeded);
			} catch (err: any) {
				break;
			}
		}

		// Đảm bảo hoàn thành mốc cuối
		if (!quest.isCompleted()) {
			try {
				const finalRes = await GlobalTraffic.enqueue(() =>
					this.client.rest.post(`/quests/${quest.id}/video-progress`, {
						body: { timestamp: secondsNeeded },
					}),
				);
				if (finalRes) quest.updateUserStatus(finalRes as any);
			} catch {}
		}

		return true;
	}
}
