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
		if (this.userStatus?.completed_at) return true;
		const primary = this.getPrimaryTask();
		if (primary && primary.target > 0) {
			const current = this.getCurrentProgress(primary.name);
			if (current >= primary.target) return true;
		}
		return false;
	}

	isEnrolledQuest(): boolean {
		return Boolean(this.userStatus?.enrolled_at);
	}

	hasClaimedRewards(): boolean {
		return Boolean(this.userStatus?.claimed_at);
	}

	updateUserStatus(userStatus: QuestShape["user_status"]) {
		this.data.user_status = userStatus;
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
		const CONSOLE_KEYS = new Set(['PLAY_ON_XBOX', 'PLAY_ON_PLAYSTATION']);
		const keys = Object.keys(tasks);

		if (keys.length > 0 && keys.every((k) => CONSOLE_KEYS.has(k))) {
			return null;
		}

		// Thứ tự ưu tiên mô phỏng từ nyxxbit: video nhanh nhất -> game desktop -> activity -> stream
		const priorityList = [
			'WATCH_VIDEO',
			'WATCH_VIDEO_ON_MOBILE',
			'PLAY_ON_DESKTOP',
			'PLAY_ACTIVITY',
			'STREAM_ON_DESKTOP',
		];

		let foundName: string | null = null;
		for (const key of priorityList) {
			if (tasks[key]) {
				foundName = key;
				break;
			}
		}

		if (!foundName) {
			const nonConsole = keys.filter((k) => !CONSOLE_KEYS.has(k) && k !== 'ACHIEVEMENT_IN_GAME');
			if (nonConsole.length > 0) foundName = nonConsole[0];
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
		if (!this.userStatus?.progress) {
			if (this.userStatus?.stream_progress_seconds) {
				return Number(this.userStatus.stream_progress_seconds) || 0;
			}
			return 0;
		}

		if (taskName && this.userStatus.progress[taskName]?.value != null) {
			return this.userStatus.progress[taskName].value;
		}

		// Look for any progress value
		for (const key in this.userStatus.progress) {
			if (this.userStatus.progress[key]?.value != null) {
				return this.userStatus.progress[key].value;
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
