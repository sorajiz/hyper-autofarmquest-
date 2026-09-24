import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';
import { Client } from '@discordjs/core';
import chalk from 'chalk';
import { QuestManager } from '../questManager';
import { GlobalProxyPool } from '../network/proxyPool';
import { GlobalScanner } from '../core/scanner';
import { TokenValidator } from '../auth/tokenValidator';

export interface StatusData {
	username?: string;
	userId?: string;
	activeQuests?: number;
	completedQuests?: number;
	orbsCount?: number;
	proxyStatus?: string;
}

export const BOT_SLASH_COMMANDS = [
	{
		name: 'farm',
		description: '⚡ Kích hoạt và theo dõi tự động cày Quest & Discord Orbs siêu tốc',
	},
	{
		name: 'status',
		description: '📊 Hiển thị Mission Control Dashboard (Embed V2 & Components V2)',
	},
	{
		name: 'claim',
		description: '🎁 Tự động nhận tất cả phần thưởng nhiệm vụ đã hoàn thành',
	},
	{
		name: 'hypesquad',
		description: '🛡️ Tham gia hoặc đổi Discord HypeSquad House (Bravery, Brilliance, Balance)',
		options: [
			{
				name: 'house',
				description: 'Chọn nhà HypeSquad bạn muốn gia nhập',
				type: 4, // INTEGER
				required: true,
				choices: [
					{ name: '🛡️ House of Bravery (Dũng Cảm - Tím)', value: 1 },
					{ name: '🔮 House of Brilliance (Sáng Suốt - Cam/Vàng)', value: 2 },
					{ name: '⚖️ House of Balance (Cân Bằng - Xanh Lục)', value: 3 },
					{ name: '🚪 Leave HypeSquad (Rời House)', value: 0 },
				],
			},
		],
	},
	{
		name: 'proxy',
		description: '🔄 Xoay vòng và kiểm tra trạng thái Proxy Pool Dual-Stack IPv4/IPv6',
	},
	{
		name: 'vault',
		description: '📦 Khởi chạy Ultra Deep Extractor trích xuất kho quà & dữ liệu ẩn',
	},
	{
		name: 'scan',
		description: '🔍 Quét toàn diện các nhiệm vụ ẩn mới nhất trên mọi nền tảng',
	},
];

export function buildComponentsV2Payload(data: StatusData = {}) {
	const username = data.username || 'Discord User';
	const userId = data.userId || 'N/A';
	const active = data.activeQuests ?? 0;
	const completed = data.completedQuests ?? 0;
	const orbs = data.orbsCount ?? 0;
	const proxy = data.proxyStatus || 'Trực tiếp (Direct Dual-Stack)';

	return {
		flags: 1 << 15, // IS_COMPONENTS_V2 (32768)
		content: `**AUTO HYPER - FARM ORB** // **MISSION CONTROL TELEMETRY [EMBED V2]**`,
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
				title: 'MISSION CONTROL DASHBOARD // EMBED V2',
				color: 0x5865f2,
				description: 'Enterprise Discord Quest Automation & Telemetry System • Mobile Presence Active',
				fields: [
					{ name: '👤 [TARGET USER]', value: `\`${username}\` (${userId})`, inline: true },
					{ name: '🛡️ [ROUTING ENDPOINT]', value: `\`${proxy}\``, inline: true },
					{ name: '🔮 [DISCORD ORBS]', value: `**${orbs}** Orbs`, inline: true },
					{ name: '📋 [TASK PIPELINE]', value: `Active: **${active}** | Completed: **${completed}**`, inline: true },
					{ name: '📱 [GATEWAY STATUS]', value: `🟢 **Mobile Active** (Discord Android Gateway)`, inline: true },
					{ name: '⚡ [WAF SHIELD]', value: `\`Adaptive Jitter (1.5s - 3.5s)\``, inline: true },
				],
				footer: {
					text: 'Hyper AutoFarm Quest • Enterprise Architecture v3.2.0 • Mobile Presence Matrix',
				},
				timestamp: new Date().toISOString(),
			},
		],
	};
}

export function buildFarmEmbedV2(questManager?: QuestManager) {
	const active = questManager ? questManager.list().filter((q) => !q.isCompleted()) : [];
	const completed = questManager ? questManager.getCompleted() : [];
	const proxyStats = GlobalProxyPool.getStats();
	const proxyStr = proxyStats.total > 0 ? `🛡️ ${proxyStats.healthy}/${proxyStats.total} Nodes` : '🛡️ Direct Connection';

	const questListText = active.length > 0
		? active.map((q, i) => `**${i + 1}. ${q.getName()}**\n• Game: \`${q.getApplicationName()}\`\n• Type: \`${q.getPrimaryTask()?.name || 'PLAY'}\` | Target: \`${q.getPrimaryTask()?.target || 900}s\``).join('\n\n')
		: '🎉 **Tất cả nhiệm vụ đã hoàn thành hoặc không có nhiệm vụ mới!**\nNhấn nút **[?] Scan Unlisted** để dò quét thêm nhiệm vụ ẩn.';

	return {
		flags: 1 << 15,
		content: `**AUTO HYPER - FARM ORB** // **DISCORD SLASH AUTOMATION ENGINE**`,
		embeds: [
			{
				title: '⚡ HYPER AUTOFARM QUEST MATRIX // EMBED V2',
				color: 0x00f0ff,
				description: 'Hệ thống tự động hóa tiến độ Discord Quests & Discord Orbs thời gian thực.',
				fields: [
					{
						name: '📋 [NHIỆM VỤ ĐANG CÀY]',
						value: questListText,
						inline: false,
					},
					{
						name: '📊 [TIẾN TRÌNH PIPELINE]',
						value: `• Đang chạy: **${active.length}**\n• Đã hoàn thành: **${completed.length}**`,
						inline: true,
					},
					{
						name: '🛡️ [ROUTING ENDPOINT]',
						value: `• Proxy: \`${proxyStr}\`\n• Dual-Stack: \`IPv4 / IPv6 Active\``,
						inline: true,
					},
					{
						name: '📱 [GATEWAY STATUS]',
						value: `• Trạng thái: **🟢 Mobile Online (Discord Android)**\n• Native Engine: \`C++ / Rust Jitter Matrix\``,
						inline: false,
					},
				],
				footer: {
					text: 'Hyper AutoFarm Quest • Enterprise Discord Automation v3.2.0 • Mobile Presence Active',
				},
				timestamp: new Date().toISOString(),
			},
		],
		components: [
			{
				type: 1,
				components: [
					{
						type: 2,
						style: 3,
						custom_id: 'btn_autofarm',
						label: '[+] Tăng Tốc Farm',
					},
					{
						type: 2,
						style: 1,
						custom_id: 'btn_claim',
						label: '[*] Nhận Thưởng Quà',
					},
					{
						type: 2,
						style: 2,
						custom_id: 'btn_rescan',
						label: '[?] Quét Nhiệm Vụ Ẩn',
					},
					{
						type: 2,
						style: 2,
						custom_id: 'btn_proxy',
						label: '[~] Xoay Proxy',
					},
				],
			},
		],
	};
}

export function buildHypeSquadEmbedV2(houseId: number, success: boolean, message: string) {
	const houses: Record<number, { title: string; color: number; icon: string; desc: string; badge: string }> = {
		1: {
			title: '🛡️ HYPESQUAD HOUSE OF BRAVERY (DŨNG CẢM)',
			color: 0x9b59b6, // Amethyst Purple
			icon: 'Bravery',
			desc: '*Chiến binh quả cảm tiến bước, không bao giờ chùn bước trước bất kỳ thử thách hay gian truân nào.*',
			badge: 'Purple Shield Badge Active',
		},
		2: {
			title: '🔮 HYPESQUAD HOUSE OF BRILLIANCE (SÁNG SUỐT)',
			color: 0xf1c40f, // Sun Gold
			icon: 'Brilliance',
			desc: '*Trí tuệ, sự kiên nhẫn và tầm nhìn chiến lược là vũ khí tối thượng mở ra mọi cánh cửa.*',
			badge: 'Gold Diamond Badge Active',
		},
		3: {
			title: '⚖️ HYPESQUAD HOUSE OF BALANCE (CÂN BẰNG)',
			color: 0x2ecc71, // Emerald Green
			icon: 'Balance',
			desc: '*Hòa hợp, điềm tĩnh và chính trực giữ cho vạn vật cân bằng và thịnh vượng bền vững.*',
			badge: 'Teal Scales Badge Active',
		},
		0: {
			title: '🚪 ĐÃ RỜI KHỎI HYPESQUAD',
			color: 0x95a5a6, // Gray
			icon: 'None',
			desc: '*Huy hiệu HypeSquad đã được gỡ bỏ khỏi tài khoản Discord của bạn.*',
			badge: 'No House Badge',
		},
	};

	const house = houses[houseId] || houses[1];

	return {
		flags: 1 << 15,
		embeds: [
			{
				title: house.title,
				color: house.color,
				description: house.desc,
				fields: [
					{
						name: '🏷️ [HUY HIỆU ĐẠI DIỆN]',
						value: `\`${house.badge}\``,
						inline: true,
					},
					{
						name: '📶 [TRẠNG THÁI]',
						value: success ? '🟢 **Cập nhật thành công 100%**' : '🔴 **Không thành công**',
						inline: true,
					},
					{
						name: '📡 [GIAO THỨC DISCORD API]',
						value: `\`POST /hypesquad/online\` (House ID: \`${houseId}\`)\n• Webpack Chunk: \`HTTPUtils.post\``,
						inline: false,
					},
					{
						name: '📝 [CHI TIẾT PHẢN HỒI]',
						value: `*${message}*`,
						inline: false,
					},
				],
				footer: {
					text: 'Hyper AutoFarm Quest • Discord HypeSquad House Switcher v3.2.0',
				},
				timestamp: new Date().toISOString(),
			},
		],
	};
}

export function buildClaimEmbedV2(count: number, details?: string) {
	return {
		flags: 1 << 15,
		embeds: [
			{
				title: '🎁 REWARD DISPATCHER // EMBED V2',
				color: 0xeb459e,
				description: 'Đã kích hoạt giao thức nhận thưởng tự động cho tài khoản!',
				fields: [
					{
						name: '🎁 [KẾT QUẢ NHẬN THƯỞNG]',
						value: `Đã nhận thành công **${count}** phần thưởng quà/orbs/badges!`,
						inline: true,
					},
					{
						name: '📦 [KHO QUÀ TÀI KHOẢN]',
						value: 'Vật phẩm đã được cập nhật trực tiếp vào Kho Quà (Gift Inventory) của bạn.',
						inline: false,
					},
					...(details ? [{ name: '📝 [CHI TIẾT]', value: details, inline: false }] : []),
				],
				footer: {
					text: 'Hyper AutoFarm Quest • Reward Claimer v3.2.0',
				},
				timestamp: new Date().toISOString(),
			},
		],
	};
}

export function buildProxyEmbedV2(stats: any, currentProxy?: string) {
	return {
		flags: 1 << 15,
		embeds: [
			{
				title: '🛡️ PROXY ROTATION & RESIDENTIAL MESH // EMBED V2',
				color: 0x00f0ff,
				description: 'Hệ thống xoay vòng IP Dual-Stack IPv4/IPv6 chống HTTP 429 Rate Limits.',
				fields: [
					{
						name: '🔄 [PROXY HIỆN TẠI]',
						value: currentProxy ? `\`${currentProxy}\`` : '`Trực tiếp (Direct Connection)`',
						inline: false,
					},
					{
						name: '📊 [HEALTHY POOL]',
						value: `**${stats.healthy}** / **${stats.total}** nodes`,
						inline: true,
					},
					{
						name: '🌐 [IPV6 MESH]',
						value: `**${stats.ipv6Count}** Dual-Stack nodes`,
						inline: true,
					},
					{
						name: '⚡ [WAF PROTECTION]',
						value: 'Tự động khóa 30-45s khi gặp 429 & chuyển tiếp ngay lập tức.',
						inline: false,
					},
				],
				footer: {
					text: 'Hyper AutoFarm Quest • Dual-Stack Proxy Pool v3.2.0',
				},
				timestamp: new Date().toISOString(),
			},
		],
	};
}

export function buildVaultEmbedV2(report: any) {
	return {
		flags: 1 << 15,
		embeds: [
			{
				title: '📦 ULTRA DEEP VAULT AUDIT // EMBED V2',
				color: 0x57f287,
				description: 'Báo cáo trích xuất tài khoản, kho quà, entitlements và experiments ẩn.',
				fields: [
					{
						name: '🎁 [ENTITLEMENTS / KEYS]',
						value: `**${report.entitlements?.length ?? 0}** vật phẩm`,
						inline: true,
					},
					{
						name: '🔍 [DISCOVERED QUESTS]',
						value: `**${report.totalDiscoveredQuests ?? 0}** nhiệm vụ`,
						inline: true,
					},
					{
						name: '🧪 [DISCORD EXPERIMENTS]',
						value: `**${report.experimentsCount ?? 0}** tính năng thử nghiệm`,
						inline: true,
					},
					{
						name: '💾 [ĐƯỜNG DẪN LƯU BÁO CÁO]',
						value: '`vault/discord_vault_audit.json`',
						inline: false,
					},
				],
				footer: {
					text: 'Hyper AutoFarm Quest • Ultra Deep Harvester v3.2.0',
				},
				timestamp: new Date().toISOString(),
			},
		],
	};
}

export class DiscordRemoteBot {
	private token: string;
	private guildId: string;
	private enabled: boolean;
	private client: Client | null = null;
	private ws: WebSocketManager | null = null;

	constructor(token: string = process.env.DISCORD_BOT_TOKEN || '', guildId?: string) {
		this.token = token.trim();
		this.guildId = (guildId || process.env.DISCORD_GUILD_ID || '').trim();
		this.enabled = this.token.length > 20;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Instant Slash Command Deployment:
	 * If guildId is provided, deploys INSTANTLY (0 seconds delay) to target Guild.
	 * Also asynchronously deploys globally for wide coverage.
	 */
	public async deploySlashCommands(guildId?: string): Promise<void> {
		if (!this.enabled) return;
		try {
			const rest = new REST({ version: '10' }).setToken(this.token);
			const botUser: any = await rest.get('/users/@me');
			const appId = botUser?.id;
			if (!appId) return;

			const targetGuild = (guildId || this.guildId || process.env.DISCORD_GUILD_ID || '').trim();

			if (targetGuild && targetGuild.length > 5) {
				// Instant Guild Deployment (0-second propagation)
				await rest.put(`/applications/${appId}/guilds/${targetGuild}/commands`, {
					body: BOT_SLASH_COMMANDS,
				});
				console.log(chalk.green.bold(`⚡ [INSTANT DEPLOY] Slash commands đã kích hoạt NGAY LẬP TỨC trên Guild ID: ${targetGuild} (0s delay)!`));

				// Background global deploy
				rest.put(`/applications/${appId}/commands`, {
					body: BOT_SLASH_COMMANDS,
				}).catch(() => {});
			} else {
				// Global Deployment
				await rest.put(`/applications/${appId}/commands`, {
					body: BOT_SLASH_COMMANDS,
				});
				console.log(chalk.cyan.bold(`⚡ [GLOBAL DEPLOY] Slash commands đã đăng ký thành công trên phạm vi Global (App ID: ${appId})`));
			}
		} catch (err: any) {
			console.error(chalk.yellow(`⚠ Slash command auto-deployment notice: ${err?.message || err}`));
		}
	}

	public async start(questManager?: QuestManager): Promise<void> {
		if (!this.enabled) return;

		try {
			const rest = new REST({ version: '10' }).setToken(this.token);

			// Instant deployment upon bot startup
			await this.deploySlashCommands(this.guildId);

			// Connect Gateway with Discord Android Mobile properties + Rich Activity
			this.ws = new WebSocketManager({
				token: this.token,
				intents: 1, // GatewayIntentBits.Guilds
				rest,
				identifyProperties: {
					os: 'Android',
					browser: 'Discord Android',
					device: 'Discord Android',
				},
				initialPresence: {
					status: 'online' as any,
					since: null,
					afk: false,
					activities: [
						{
							name: 'Hyper AutoFarm Quest V3.2 ⚡',
							type: 0, // Playing
							state: '⚡ Auto-farming Quests & Orbs | Mobile Matrix',
						},
					],
				},
			});

			this.ws.on('error', (_err) => {
				// Prevent unhandled error event crash on gateway disconnect
			});
			this.client = new Client({ rest, gateway: this.ws });

			// Listen for interactions (Slash Commands & Components V2 Buttons)
			this.client.on('interactionCreate' as any, async ({ data, api }: any) => {
				const active = questManager ? questManager.list().filter((q) => !q.isCompleted()).length : 0;
				const completed = questManager ? questManager.getCompleted().length : 0;
				const proxyStats = GlobalProxyPool.getStats();
				const proxyStr = proxyStats.total > 0 ? `Pool: ${proxyStats.healthy}/${proxyStats.total}` : 'Trực tiếp (Direct)';

				// 1. APPLICATION_COMMAND (Slash Commands)
				if (data.type === 2) {
					const cmdName = data.data.name;

					if (cmdName === 'farm') {
						const payload = buildFarmEmbedV2(questManager);
						await api.interactions.reply(data.id, data.token, payload);
					} else if (cmdName === 'status') {
						const payload = buildComponentsV2Payload({
							activeQuests: active,
							completedQuests: completed,
							proxyStatus: proxyStr,
						});
						await api.interactions.reply(data.id, data.token, payload);
					} else if (cmdName === 'claim') {
						let count = 0;
						if (questManager) {
							const claimable = questManager.getClaimable();
							count = claimable.length;
							for (const q of claimable) {
								await questManager.claimQuestReward(q.id);
							}
						}
						const payload = buildClaimEmbedV2(count);
						await api.interactions.reply(data.id, data.token, payload);
					} else if (cmdName === 'hypesquad') {
						const houseOption = data.data.options?.find((o: any) => o.name === 'house');
						const houseId = Number(houseOption?.value ?? 1);

						let result = { success: false, message: '' };
						if (questManager) {
							result = await questManager.joinHypeSquad(houseId);
						} else {
							// Check if user token is in environment
							const userToken = TokenValidator.sanitizeToken(process.env.TOKEN || '');
							if (userToken && userToken.length > 20) {
								try {
									const userRest = new REST({ version: '10' }).setToken(userToken.replace(/^Bot\s+/i, ''));
									if (houseId > 0) {
										await userRest.post('/hypesquad/online', { body: { house_id: houseId } });
										result = { success: true, message: `Đã cập nhật HypeSquad House ID #${houseId} thành công cho User Account!` };
									} else {
										await userRest.delete('/hypesquad/online');
										result = { success: true, message: 'Đã rời HypeSquad House thành công!' };
									}
								} catch (err: any) {
									result = { success: false, message: `Lỗi cập nhật Discord API: ${err?.message || err}` };
								}
							} else {
								result = {
									success: false,
									message: 'HypeSquad là tính năng dành cho Discord User Account. Vui lòng cấu hình TOKEN user trong .env hoặc chạy script trong code.js tại DevTools!',
								};
							}
						}

						const payload = buildHypeSquadEmbedV2(houseId, result.success, result.message);
						await api.interactions.reply(data.id, data.token, payload);
					} else if (cmdName === 'proxy') {
						const next = GlobalProxyPool.rotate();
						const stats = GlobalProxyPool.getStats();
						const payload = buildProxyEmbedV2(stats, next?.url);
						await api.interactions.reply(data.id, data.token, payload);
					} else if (cmdName === 'vault') {
						if (questManager) {
							const report = await questManager.auditAccountVault();
							const payload = buildVaultEmbedV2(report);
							await api.interactions.reply(data.id, data.token, payload);
						} else {
							await api.interactions.reply(data.id, data.token, {
								content: '⚠ QuestManager chưa sẵn sàng hoặc bot đang chạy chế độ Remote Only.',
								flags: 64,
							});
						}
					} else if (cmdName === 'scan') {
						let foundCount = 0;
						if (questManager) {
							const found = await GlobalScanner.scan(questManager.client);
							found.forEach((q) => questManager.upsert(q));
							foundCount = found.length;
						}
						await api.interactions.reply(data.id, data.token, {
							content: `🔍 **Đã hoàn tất quét nhiệm vụ:** Tìm thấy **${foundCount}** nhiệm vụ hợp lệ trên Windows, Mac, Android và Console.`,
							flags: 64,
						});
					}
				}

				// 2. MESSAGE_COMPONENT (Components V2 Buttons)
				if (data.type === 3) {
					const customId = data.data.custom_id;
					if (customId === 'btn_autofarm') {
						const payload = buildFarmEmbedV2(questManager);
						await api.interactions.reply(data.id, data.token, {
							...payload,
							flags: 64, // Ephemeral response for clicker
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
						const payload = buildClaimEmbedV2(count);
						await api.interactions.reply(data.id, data.token, {
							...payload,
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
						const stats = GlobalProxyPool.getStats();
						const payload = buildProxyEmbedV2(stats, next?.url);
						await api.interactions.reply(data.id, data.token, {
							...payload,
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
		} catch (err: any) {
			// Fail-safe: do not crash main bot
			console.error(chalk.yellow(`⚠ Remote Bot connection error: ${err?.message || err}`));
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
