import type {
	Quest as QuestShape,
} from './interface';

export class Quest {
	private readonly data: QuestShape;

	private constructor(data: QuestShape) {
		this.data = data;
	}

	static create(data: QuestShape): Quest {
		return new Quest(data);
	}

	get id() {
		return this.data.id;
	}

	get config() {
		return this.data.config;
	}

	get userStatus(){
		return this.data.user_status;
	}

	get targetedContent() {
		return this.data.targeted_content;
	}

	get preview(): boolean {
		return this.data.preview;
	}

	isExpired(reference: Date = new Date()): boolean {
		return reference.getTime() > new Date(this.data.config.expires_at).getTime();
	}

	isCompleted(): boolean {
		const status: any = (this.userStatus as any)?.user_status || this.userStatus;
		if (status?.completed_at) return true;
		const primary = this.getPrimaryTask();
		if (primary && primary.target > 0) {
			const current = this.getCurrentProgress(primary.name);
			if (current >= primary.target) return true;
		}
		return false;
	}

	isEnrolledQuest(): boolean {
		const status: any = (this.userStatus as any)?.user_status || this.userStatus;
		return Boolean(status?.enrolled_at);
	}

	hasClaimedRewards(): boolean {
		const status: any = (this.userStatus as any)?.user_status || this.userStatus;
		return Boolean(status?.claimed_at);
	}

	updateUserStatus(userStatus: any) {
		if (!userStatus) return;
		if (userStatus.user_status) {
			this.data.user_status = userStatus.user_status;
		} else {
			this.data.user_status = userStatus;
		}
	}

	getName(): string {
		return this.data.config?.messages?.quest_name?.trim() || this.id;
	}

	getApplicationName(): string {
		return this.data.config?.application?.name || this.getName();
	}

	getApplicationId(): string {
		const primary = this.getPrimaryTask();
		if (primary?.applicationId) return primary.applicationId;
		return this.data.config?.application?.id || '';
	}

	getTasksMap(): Record<string, { target: number; applications?: { id: string }[] }> {
		const v2Tasks = this.data.config?.task_config_v2?.tasks;
		if (v2Tasks && Object.keys(v2Tasks).length > 0) {
			return v2Tasks;
		}
		const v1Tasks = this.data.config?.task_config?.tasks;
		if (v1Tasks && Object.keys(v1Tasks).length > 0) {
			return v1Tasks as any;
		}
		return {};
	}

	getTrafficMetadataSealed(): string | null {
		return this.data.traffic_metadata_sealed ?? null;
	}

	getPrimaryTask(): { name: string; target: number; applicationId: string; applicationName: string } | null {
		const tasks = this.getTasksMap();
		const keys = Object.keys(tasks);

		// Comprehensive priority order from A-Z:
		// 1. Instant Video quests (fastest completion)
		// 2. Desktop Game / Activity play quests
		// 3. Streaming quests
		// 4. Console play quests (Xbox, PlayStation)
		// 5. Any other dynamic or unlisted task type
		const priorityList = [
			'WATCH_VIDEO',
			'WATCH_VIDEO_ON_MOBILE',
			'PLAY_ON_DESKTOP',
			'PLAY',
			'PLAY_ACTIVITY',
			'STREAM_ON_DESKTOP',
			'STREAM',
			'PLAY_ON_XBOX',
			'PLAY_ON_PLAYSTATION',
			'WATCH_STREAM',
			'STREAM_TO_FRIENDS',
		];

		let foundName: string | null = null;
		for (const key of priorityList) {
			if (tasks[key]) {
				foundName = key;
				break;
			}
		}

		if (!foundName && keys.length > 0) {
			foundName = keys[0];
		}

		if (!foundName) {
			if (this.data.config?.application?.id) {
				foundName = 'PLAY_ON_DESKTOP';
			} else {
				return null;
			}
		}

		const taskData = tasks[foundName];
		const target = taskData?.target ?? 900;
		const applicationId = taskData?.applications?.[0]?.id || this.data.config?.application?.id || '';
		const applicationName = this.data.config?.application?.name || this.getName();

		return {
			name: foundName,
			target,
			applicationId,
			applicationName,
		};
	}

	getCurrentProgress(taskName?: string): number {
		const status: any = (this.userStatus as any)?.user_status || this.userStatus;
		if (!status?.progress) {
			if (status?.stream_progress_seconds) {
				return Number(status.stream_progress_seconds) || 0;
			}
			return 0;
		}

		if (taskName && status.progress[taskName]?.value != null) {
			return status.progress[taskName].value;
		}

		// Look for any progress value
		for (const key in status.progress) {
			if (status.progress[key]?.value != null) {
				return status.progress[key].value;
			}
		}

		return 0;
	}

	getRewardName(): string {
		const rewards = this.data.config?.rewards_config?.rewards;
		if (rewards && rewards.length > 0) {
			const first = rewards[0];
			if (first.messages?.name) {
				return first.messages.name.trim();
			}
			if (first.orb_quantity) {
				return `${first.orb_quantity} Orbs`;
			}
		}
		return 'Reward';
	}
}
