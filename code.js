/**
 * ⭐ Auto Hyper - Farm Orb | 1-Click Discord Console Script v2.0.0
 * Run directly in Discord Desktop App Console (Ctrl + Shift + I -> Console)
 */

console.log('%c⭐ Auto Hyper - Farm Orb | DevTools Console Edition ⭐', 'color: #5865F2; font-size: 16px; font-weight: bold;');

delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, (r) => r]);
webpackChunkdiscord_app.pop();

let ApplicationStreamingStore = Object.values(wpRequire.c).find(
	(x) => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata,
).exports.Z;
let RunningGameStore = Object.values(wpRequire.c).find(
	(x) => x?.exports?.ZP?.getRunningGames,
).exports.ZP;
let QuestsStore = Object.values(wpRequire.c).find(
	(x) => x?.exports?.Z?.__proto__?.getQuest,
).exports.Z;
let ChannelStore = Object.values(wpRequire.c).find(
	(x) => x?.exports?.Z?.__proto__?.getAllThreadsForParent,
).exports.Z;
let GuildChannelStore = Object.values(wpRequire.c).find(
	(x) => x?.exports?.ZP?.getSFWDefaultChannel,
).exports.ZP;
let FluxDispatcher = Object.values(wpRequire.c).find(
	(x) => x?.exports?.Z?.__proto__?.flushWaitQueue,
).exports.Z;
let api = Object.values(wpRequire.c).find((x) => x?.exports?.tn?.get).exports
	.tn;

(async () => {
	// Auto-enroll into available un-enrolled quests first
	for (const q of QuestsStore.quests.values()) {
		if (
			q.id !== '1412491570820812933' &&
			!q.userStatus?.enrolledAt &&
			!q.userStatus?.completedAt &&
			new Date(q.config.expiresAt).getTime() > Date.now()
		) {
			try {
				await api.post({ url: `/quests/${q.id}/enroll`, body: { location: 11 } });
				console.log(`%c✔ Auto-enrolled into: ${q.config.messages.questName}`, 'color: #00D26A;');
			} catch {}
		}
	}

	let quest = [...QuestsStore.quests.values()].find(
		(x) =>
			x.id !== '1412491570820812933' &&
			!x.userStatus?.completedAt &&
			new Date(x.config.expiresAt).getTime() > Date.now(),
	);

	let isApp = typeof DiscordNative !== 'undefined';
	if (!quest) {
		console.log('%c🎉 You do not have any uncompleted quests!', 'color: #00D26A; font-weight: bold;');
		return;
	}

	const pid = Math.floor(Math.random() * 30000) + 1000;
	const applicationId = quest.config.application?.id;
	const applicationName = quest.config.application?.name || quest.config.messages.questName;
	const questName = quest.config.messages.questName;
	const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2 ?? quest.config.task_config ?? quest.config.task_config_v2;
	const tasksObj = taskConfig?.tasks ?? {};
	const taskName = [
		'WATCH_VIDEO',
		'WATCH_VIDEO_ON_MOBILE',
		'PLAY_ON_DESKTOP',
		'PLAY',
		'STREAM_ON_DESKTOP',
		'STREAM',
		'PLAY_ACTIVITY',
	].find((x) => tasksObj[x] != null) || Object.keys(tasksObj)[0] || 'PLAY_ON_DESKTOP';

	const secondsNeeded = tasksObj[taskName]?.target ?? 900;
	let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

	const claimReward = async () => {
		try {
			await api.post({ url: `/quests/${quest.id}/claim-reward`, body: { platform: 0, location: 11 } });
			console.log(`%c🎁 AUTO-CLAIM SUCCESS: Reward for "${questName}" claimed!`, 'color: #FF007F; font-weight: bold;');
		} catch (e) {
			console.log('%cℹ️ Reward ready to claim in Discord User Settings -> Quests tab.', 'color: #F59E0B;');
		}
	};

	if (taskName === 'WATCH_VIDEO' || taskName === 'WATCH_VIDEO_ON_MOBILE') {
		const maxFuture = 10,
			speed = 7,
			interval = 1;
		const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
		let completed = false;
		let fn = async () => {
			while (true) {
				const maxAllowed =
					Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
				const diff = maxAllowed - secondsDone;
				const timestamp = secondsDone + speed;
				if (diff >= speed) {
					const res = await api.post({
						url: `/quests/${quest.id}/video-progress`,
						body: {
							timestamp: Math.min(
								secondsNeeded,
								timestamp + Math.random(),
							),
						},
					});
					completed = res.body.completed_at != null;
					secondsDone = Math.min(secondsNeeded, timestamp);
				}

				if (timestamp >= secondsNeeded || completed) {
					break;
				}
				await new Promise((resolve) =>
					setTimeout(resolve, interval * 1000),
				);
			}
			if (!completed) {
				await api.post({
					url: `/quests/${quest.id}/video-progress`,
					body: { timestamp: secondsNeeded },
				});
			}
			console.log(`%c✔ Quest "${questName}" completed!`, 'color: #00D26A; font-weight: bold;');
			await claimReward();
		};
		fn();
		console.log(`⚡ Fast-spoofing video for ${questName}...`);
	} else if (taskName === 'PLAY_ON_DESKTOP' || taskName === 'PLAY') {
		if (!isApp) {
			console.log(
				'⚠ This requires the Discord Desktop App for non-video quests. Use Desktop app or Hyper Quest Bot CLI!',
				questName,
			);
		} else {
			api.get({
				url: `/applications/public?application_ids=${applicationId}`,
			}).then((res) => {
				const appData = res.body[0];
				const exeName = (appData.executables?.find((x) => x.os === 'win32') || { name: `${applicationName}.exe` })
					.name.replace('>', '');

				const fakeGame = {
					cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
					exeName,
					exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
					hidden: false,
					isLauncher: false,
					id: applicationId,
					name: appData.name,
					pid: pid,
					pidPath: [pid],
					processName: appData.name,
					start: Date.now(),
				};
				const realGames = RunningGameStore.getRunningGames();
				const fakeGames = [fakeGame];
				const realGetRunningGames = RunningGameStore.getRunningGames;
				const realGetGameForPID = RunningGameStore.getGameForPID;
				RunningGameStore.getRunningGames = () => fakeGames;
				RunningGameStore.getGameForPID = (p) =>
					fakeGames.find((x) => x.pid === p);
				FluxDispatcher.dispatch({
					type: 'RUNNING_GAMES_CHANGE',
					removed: realGames,
					added: [fakeGame],
					games: fakeGames,
				});

				let fn = async (data) => {
					let progress =
						quest.config.configVersion === 1
							? data.userStatus.streamProgressSeconds
							: Math.floor(
									data.userStatus.progress.PLAY_ON_DESKTOP?.value ??
									data.userStatus.progress.PLAY?.value ?? 0
							  );
					console.log(`⏱ Quest progress: ${progress}/${secondsNeeded}`);

					if (progress >= secondsNeeded) {
						console.log(`%c✔ Quest "${questName}" completed!`, 'color: #00D26A; font-weight: bold;');

						RunningGameStore.getRunningGames = realGetRunningGames;
						RunningGameStore.getGameForPID = realGetGameForPID;
						FluxDispatcher.dispatch({
							type: 'RUNNING_GAMES_CHANGE',
							removed: [fakeGame],
							added: [],
							games: [],
						});
						FluxDispatcher.unsubscribe(
							'QUESTS_SEND_HEARTBEAT_SUCCESS',
							fn,
						);
						await claimReward();
					}
				};
				FluxDispatcher.subscribe('QUESTS_SEND_HEARTBEAT_SUCCESS', fn);

				console.log(
					`🎮 Spoofed game to ${applicationName}. Remaining: ~${Math.ceil(
						(secondsNeeded - secondsDone) / 60,
					)} minutes.`,
				);
			});
		}
	} else if (taskName === 'STREAM_ON_DESKTOP' || taskName === 'STREAM') {
		if (!isApp) {
			console.log('⚠ Streaming quests require Discord Desktop app.');
		} else {
			let realFunc =
				ApplicationStreamingStore.getStreamerActiveStreamMetadata;
			ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
				id: applicationId,
				pid,
				sourceName: null,
			});

			let fn = async (data) => {
				let progress =
					quest.config.configVersion === 1
						? data.userStatus.streamProgressSeconds
						: Math.floor(
								data.userStatus.progress.STREAM_ON_DESKTOP?.value ??
								data.userStatus.progress.STREAM?.value ?? 0
						  );
				console.log(`⏱ Quest progress: ${progress}/${secondsNeeded}`);

				if (progress >= secondsNeeded) {
					console.log(`%c✔ Stream quest "${questName}" completed!`, 'color: #00D26A; font-weight: bold;');

					ApplicationStreamingStore.getStreamerActiveStreamMetadata =
						realFunc;
					FluxDispatcher.unsubscribe(
						'QUESTS_SEND_HEARTBEAT_SUCCESS',
						fn,
					);
					await claimReward();
				}
			};
			FluxDispatcher.subscribe('QUESTS_SEND_HEARTBEAT_SUCCESS', fn);

			console.log(
				`📡 Spoofed stream to ${applicationName}. Stream any window in VC for ~${Math.ceil(
					(secondsNeeded - secondsDone) / 60,
				)} minutes.`,
			);
		}
	} else if (taskName === 'PLAY_ACTIVITY') {
		const channelId =
			ChannelStore.getSortedPrivateChannels()[0]?.id ??
			Object.values(GuildChannelStore.getAllGuilds()).find(
				(x) => x != null && x.VOCAL?.length > 0,
			)?.VOCAL?.[0]?.channel?.id ?? '0';
		const streamKey = `call:${channelId}:1`;

		let fn = async () => {
			console.log('Completing activity quest:', questName);

			while (true) {
				const res = await api.post({
					url: `/quests/${quest.id}/heartbeat`,
					body: { stream_key: streamKey, terminal: false },
				});
				const progress = res.body.progress?.PLAY_ACTIVITY?.value ?? 0;
				console.log(`⏱ Activity progress: ${progress}/${secondsNeeded}`);

				if (progress >= secondsNeeded) {
					await api.post({
						url: `/quests/${quest.id}/heartbeat`,
						body: { stream_key: streamKey, terminal: true },
					});
					console.log(`%c✔ Activity quest "${questName}" completed!`, 'color: #00D26A; font-weight: bold;');
					await claimReward();
					break;
				}

				await new Promise((resolve) => setTimeout(resolve, 20 * 1000));
			}
		};
		fn();
	}
})();
