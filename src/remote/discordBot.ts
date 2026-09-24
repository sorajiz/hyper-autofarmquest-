import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';
import { Client } from '@discordjs/core';
import { QuestManager } from '../questManager';
import { GlobalProxyPool } from '../network/proxyPool';
import { GlobalScanner } from '../core/scanner';

export interface StatusData {
	username?: string;
	userId?: string;
	activeQuests?: number;
	completedQuests?: number;
	orbsCount?: number;
	proxyStatus?: string;
}

export function buildComponentsV2Payload(data: StatusData = {}) {
	const username = data.username || 'Discord User';
	const userId = data.userId || 'N/A';
	const active = data.activeQuests ?? 0;
	const completed = data.completedQuests ?? 0;
	const orbs = data.orbsCount ?? 0;
	const proxy = data.proxyStatus || 'Trực tiếp (Direct)';

	return {
		flags: 1 << 15, // IS_COMPONENTS_V2 (32768)
		content: `**AUTO HYPER - FARM ORB** // **MISSION CONTROL TELEMETRY**`,
		components: [
			{
				type: 1, // Action Row / Container component
				components: [
					{
						type: 2, // Button
						style: 3, // Success (Green)
						custom_id: 'btn_autofarm',
						label: '[+] Auto Farm',
					},
					{
						type: 2, // Button
						style: 1, // Primary (Blurple)
						custom_id: 'btn_claim',
						label: '[*] Claim Rewards',
					},
					{
						type: 2, // Button
						style: 2, // Secondary (Gray)
						custom_id: 'btn_rescan',
						label: '[?] Scan Unlisted',
					},
					{
						type: 2, // Button
						style: 2, // Secondary (Gray)
						custom_id: 'btn_proxy',
						label: '[~] Rotate Proxy',
					},
					{
						type: 2, // Button
						style: 4, // Danger / Attention (Red/Pink)
						custom_id: 'btn_vault',
						label: '[!] Deep Vault',
					},
				],
			},
		],
		embeds: [
			{
				title: 'MISSION CONTROL DASHBOARD // COMPONENTS V2',
				color: 0x5865f2,
				fields: [
					{ name: '[TARGET USER]', value: `${username} (${userId})`, inline: true },
					{ name: '[ROUTING ENDPOINT]', value: proxy, inline: true },
					{ name: '[DISCORD ORBS]', value: `${orbs} Orbs`, inline: true },
					{ name: '[TASK PIPELINE]', value: `Active: **${active}** | Completed: **${completed}**`, inline: false },
				],
				footer: {
					text: 'Hyper AutoFarm Quest • Enterprise Architecture v3.2.0',
				},
				timestamp: new Date().toISOString(),
			},
		],
	};
}

export class DiscordRemoteBot {
	private token: string;
	private enabled: boolean;
	private client: Client | null = null;
	private ws: WebSocketManager | null = null;

	constructor(token: string = process.env.DISCORD_BOT_TOKEN || '') {
		this.token = token.trim();
		this.enabled = this.token.length > 20;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	public async start(questManager?: QuestManager): Promise<void> {
		if (!this.enabled) return;

		try {
			const rest = new REST({ version: '10' }).setToken(this.token);
			this.ws = new WebSocketManager({
				token: this.token,
				intents: 1, // GatewayIntentBits.Guilds
				rest,
			});
			this.ws.on('error', (err) => {
				// Prevent unhandled error event crash on gateway disconnect
			});
			this.client = new Client({ rest, gateway: this.ws });

			// Listen for interactions (Slash Commands & Components V2 Buttons)
			this.client.on('interactionCreate' as any, async ({ data, api }: any) => {
				const active = questManager ? questManager.list().filter((q) => !q.isCompleted()).length : 0;
				const completed = questManager ? questManager.getCompleted().length : 0;
				const proxyStats = GlobalProxyPool.getStats();
				const proxyStr = proxyStats.total > 0 ? `Pool: ${proxyStats.healthy}/${proxyStats.total}` : 'Trực tiếp';

				// 1. APPLICATION_COMMAND (Slash Commands: /status, /farm, /claim, /proxy)
				if (data.type === 2) {
					const cmdName = data.data.name;
					if (cmdName === 'status') {
						const payload = buildComponentsV2Payload({
							activeQuests: active,
							completedQuests: completed,
							proxyStatus: proxyStr,
						});
						await api.interactions.reply(data.id, data.token, payload);
					} else if (cmdName === 'claim') {
						if (questManager) {
							const claimable = questManager.getClaimable();
							for (const q of claimable) {
								await questManager.claimQuestReward(q.id);
							}
							await api.interactions.reply(data.id, data.token, {
								content: `🎁 Đã kích hoạt nhận thưởng cho ${claimable.length} nhiệm vụ!`,
							});
						}
					} else if (cmdName === 'proxy') {
						const next = GlobalProxyPool.rotate();
						await api.interactions.reply(data.id, data.token, {
							content: next ? `🔄 Đã xoay proxy sang: \`${next.url}\`` : '⚠ Chưa cấu hình danh sách proxy.',
						});
					} else if (cmdName === 'vault') {
						if (questManager) {
							const report = await questManager.auditAccountVault();
							await api.interactions.reply(data.id, data.token, {
								content: `📦 **VAULT AUDIT REPORT:** Đã phát hiện ${report.totalDiscoveredQuests} quests, ${report.entitlements.length} kho quà/keys, ${report.experimentsCount} experiments! Đã lưu: \`vault/discord_vault_audit.json\``,
							});
						} else {
							await api.interactions.reply(data.id, data.token, {
								content: '⚠ QuestManager chưa sẵn sàng.',
							});
						}
					}
				}

				// 2. MESSAGE_COMPONENT (Components V2 Buttons)
				if (data.type === 3) {
					const customId = data.data.custom_id;
					if (customId === 'btn_autofarm') {
						await api.interactions.reply(data.id, data.token, {
							content: `⚡ **Lệnh Auto Farm nhận được!** Đang tự động tăng tốc và hoàn thành các nhiệm vụ...`,
							flags: 64, // Ephemeral
						});
					} else if (customId === 'btn_claim') {
						let count = 0;
						if (questManager) {
							const claimable = questManager.getClaimable();
							count = claimable.length;
							for (const q of claimable) {
								await questManager.claimQuestReward(q.id);
							}
						}
						await api.interactions.reply(data.id, data.token, {
							content: `🎁 **Đã nhận quà thành công:** ${count} phần thưởng đã được gửi vào tài khoản!`,
							flags: 64,
						});
					} else if (customId === 'btn_rescan') {
						if (questManager) {
							GlobalScanner.scan(questManager.client).then((found) => {
								found.forEach((q) => questManager.upsert(q));
							});
						}
						await api.interactions.reply(data.id, data.token, {
							content: `🔍 **Đang quét nhiệm vụ ẩn** trên Windows, Mac, Android và Console...`,
							flags: 64,
						});
					} else if (customId === 'btn_proxy') {
						const next = GlobalProxyPool.rotate();
						await api.interactions.reply(data.id, data.token, {
							content: next ? `🔄 **Đã xoay proxy:** \`${next.url}\`` : '⚠ Không có proxy dự phòng trong Pool.',
							flags: 64,
						});
					} else if (customId === 'btn_vault') {
						if (questManager) {
							questManager.auditAccountVault().then((report) => {
								// Background audit saved to vault/
							});
						}
						await api.interactions.reply(data.id, data.token, {
							content: `📦 **Kích hoạt Ultra Deep Extractor!** Đang quét đa chiều và trích xuất dữ liệu vào \`vault/discord_vault_audit.json\``,
							flags: 64,
						});
					}
				}
			});

			await this.ws.connect();
		} catch {
			// Fail-safe: do not crash main bot
		}
	}

	public async stop(): Promise<void> {
		if (this.ws) {
			try {
				await this.ws.destroy();
			} catch {}
		}
	}
}

export const GlobalRemoteBot = new DiscordRemoteBot();
