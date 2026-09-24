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
	{
		name: 'help',
		description: '📖 Hướng dẫn chi tiết tất cả các lệnh Slash & Chat Messages',
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
						value: `• Trạng thái: **🟢 Mobile Online (Discord Android)**\n• Anti-Dupe Engine: \`Active (100% Reliable)\``,
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

export function buildHelpEmbedV2() {
	return {
		flags: 1 << 15,
		embeds: [
			{
				title: '📖 HYPER AUTOFARM QUEST // HƯỚNG DẪN & HỆ THỐNG ĐIỀU KHIỂN V3.2.0',
				color: 0x5865f2,
				description: 'Hệ thống hỗ trợ đồng thời cả **Slash Commands (/)**, **Chat Messages (!)** và **Components V2 Buttons**.',
				fields: [
					{
						name: '⚡ [BỘ LỆNH ĐIỀU KHIỂN / SLASH & MESSAGE]',
						value: [
							'• `/farm` hoặc `!farm` : Kích hoạt & kiểm tra tự động cày Quest & Orbs siêu tốc',
							'• `/status` hoặc `!status` : Xem Telemetry Dashboard & trạng thái viễn trắc',
							'• `/claim` hoặc `!claim` : Nhận tất cả phần thưởng nhiệm vụ và orbs về tài khoản',
							'• `/hypesquad` hoặc `!hypesquad [1|2|3|0]` : Đổi huy hiệu HypeSquad House tức thì',
							'• `/proxy` hoặc `!proxy` : Xoay vòng & kiểm tra Proxy Pool Dual-Stack IPv4/IPv6',
							'• `/vault` hoặc `!vault` : Ultra Deep Extractor trích xuất kho quà & experiments',
							'• `/scan` hoặc `!scan` : Quét nhiệm vụ ẩn mới nhất trên mọi nền tảng',
							'• `/help` hoặc `!help` : Mở bảng hướng dẫn này',
						].join('\n'),
						inline: false,
					},
					{
						name: '🛡️ [HYPESQUAD HOUSE IDS]',
						value: '`1`: Bravery (🛡️ Tím) | `2`: Brilliance (🔮 Vàng) | `3`: Balance (⚖️ Xanh) | `0`: Rời House',
						inline: false,
					},
					{
						name: '📱 [GATEWAY & CHỐNG DUPE]',
						value: '• Gateway: `Discord Android (Mobile Status Active 🟢)`\n• Anti-Dupe Engine: `Idempotent Lock + 60s TTL Cache`\n• Độ tin cậy: `100% Reliable Execution (Dùng lần nào ăn lần đó)`',
						inline: false,
					},
				],
				footer: {
					text: 'Hyper AutoFarm Quest • Enterprise Discord Architecture v3.2.0',
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
						label: '[+] Auto Farm',
					},
					{
						type: 2,
						style: 1,
						custom_id: 'btn_claim',
						label: '[*] Claim All',
					},
					{
						type: 2,
						style: 2,
						custom_id: 'btn_proxy',
						label: '[~] Xoay Proxy',
					},
					{
						type: 2,
						style: 2,
						custom_id: 'btn_rescan',
						label: '[?] Quét Nhiệm Vụ',
					},
				],
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
	public botUser: any = null;

	// Anti-Dupe tracking maps
	private handledInteractions = new Map<string, number>(); // interactionId -> timestamp
	private userCooldowns = new Map<string, number>(); // userId:action -> timestamp
	private lastDeployFingerprint: string = '';

	constructor(token: string = process.env.DISCORD_BOT_TOKEN || '', guildId?: string) {
		this.token = token.trim();
		this.guildId = (guildId || process.env.DISCORD_GUILD_ID || '').trim();
		this.enabled = this.token.length > 20;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Colorful, timestamped terminal telemetry logger
	 */
	public logBotEvent(category: string, message: string, color: string = '#00F0FF') {
		const now = new Date();
		const timeStr = chalk.gray(`[${now.toTimeString().split(' ')[0]}]`);
		const tag = chalk.hex(color).bold(`[${category.toUpperCase()}]`);
		console.log(`${timeStr} ${tag} ${message}`);
	}

	/**
	 * Anti-dupe check: Ensures each interaction is processed exactly once
	 */
	private isDuplicateInteraction(id: string): boolean {
		const now = Date.now();
		// Purge entries older than 60 seconds
		for (const [key, ts] of this.handledInteractions.entries()) {
			if (now - ts > 60000) this.handledInteractions.delete(key);
		}

		if (this.handledInteractions.has(id)) {
			return true;
		}
		this.handledInteractions.set(id, now);
		return false;
	}

	/**
	 * Debounces user spam: prevents rapid duplicate executions within 500ms
	 */
	private isUserDebounced(userId: string, action: string, windowMs: number = 500): boolean {
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
	 * "Dùng lần nào ăn lần đó": Idempotent, fail-safe reply wrapper.
	 * If reply fails (e.g. already acknowledged or gateway latency), automatically falls back to followUp/editReply.
	 */
	private async safeInteractionReply(api: any, interaction: any, payload: any): Promise<void> {
		try {
			await api.interactions.reply(interaction.id, interaction.token, payload);
		} catch (err: any) {
			try {
				await api.interactions.followUp(interaction.id, interaction.token, payload);
			} catch (err2: any) {
				try {
					await api.interactions.editReply(interaction.id, interaction.token, payload);
				} catch (err3: any) {
					this.logBotEvent('FALLBACK ERR', `Interaction reply failed: ${err3?.message || err3}`, '#EF4444');
				}
			}
		}
	}

	/**
	 * Instant Slash Command Deployment with Anti-Dupe protection:
	 * De-duplicates command lists and avoids re-deploying identical fingerprints.
	 */
	public async deploySlashCommands(guildId?: string): Promise<void> {
		if (!this.enabled) return;
		try {
			const rest = new REST({ version: '10' }).setToken(this.token);
			if (!this.botUser) {
				this.botUser = (await rest.get('/users/@me')) as any;
			}
			const appId = this.botUser?.id;
			if (!appId) return;

			const targetGuild = (guildId || this.guildId || process.env.DISCORD_GUILD_ID || '').trim();
			const fingerprint = `${targetGuild}:${BOT_SLASH_COMMANDS.length}:${BOT_SLASH_COMMANDS.map((c) => c.name).join(',')}`;

			if (this.lastDeployFingerprint === fingerprint) {
				this.logBotEvent('ANTI-DUPE', 'Bỏ qua re-deploy: Danh sách slash commands đã đồng bộ tuyệt đối!', '#EAB308');
				return;
			}

			if (targetGuild && targetGuild.length > 5) {
				// Instant Guild Deployment (0-second propagation)
				// PUT replaces all guild commands atomically, preventing duplicates!
				await rest.put(`/applications/${appId}/guilds/${targetGuild}/commands`, {
					body: BOT_SLASH_COMMANDS,
				});
				this.lastDeployFingerprint = fingerprint;
				this.logBotEvent('INSTANT DEPLOY', `Slash commands deploy NGAY LẬP TỨC vào Guild ID: ${chalk.white.bold(targetGuild)} (0s delay, chống dupe 100%)`, '#00D26A');

				// Background global deploy
				rest.put(`/applications/${appId}/commands`, {
					body: BOT_SLASH_COMMANDS,
				}).catch(() => {});
			} else {
				// Global Deployment
				await rest.put(`/applications/${appId}/commands`, {
					body: BOT_SLASH_COMMANDS,
				});
				this.lastDeployFingerprint = fingerprint;
				this.logBotEvent('GLOBAL DEPLOY', `Slash commands deploy Global cho Application ID: ${chalk.white.bold(appId)} (${BOT_SLASH_COMMANDS.length} lệnh)`, '#00F0FF');
			}
		} catch (err: any) {
			this.logBotEvent('DEPLOY NOTICE', `Thông báo deploy slash: ${err?.message || err}`, '#EAB308');
		}
	}

	public async start(questManager?: QuestManager): Promise<void> {
		if (!this.enabled) return;

		try {
			const rest = new REST({ version: '10' }).setToken(this.token);

			// Instant deployment upon bot startup
			await this.deploySlashCommands(this.guildId);

			// Connect Gateway with Discord Android Mobile properties + Rich Activity + Message intents
			this.ws = new WebSocketManager({
				token: this.token,
				intents: 1 | 512 | 4096 | 32768, // Guilds | GuildMessages | DirectMessages | MessageContent
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

			this.ws.on('error', (err: any) => {
				this.logBotEvent('GATEWAY ERR', `Gateway error: ${err?.message || err}`, '#EF4444');
			});

			this.client = new Client({ rest, gateway: this.ws });

			// Listen for Gateway Ready event
			this.client.on('ready' as any, async ({ data }: any) => {
				this.botUser = data.user;
				this.logBotEvent(
					'GATEWAY READY',
					`Bot "${chalk.green.bold(data.user.username)}" (ID: ${data.user.id}) đã kết nối Gateway thành công! (Mobile: Android 🟢)`,
					'#00D26A'
				);
			});

			// ==========================================
			// 1. INTERACTION CREATE (Slash & Buttons)
			// ==========================================
			this.client.on('interactionCreate' as any, async ({ data, api }: any) => {
				// Anti-Dupe Guard: Drop duplicated interaction packets immediately
				if (this.isDuplicateInteraction(data.id)) {
					this.logBotEvent('ANTI-DUPE', `Đã chặn duplicate interaction ID: ${data.id}`, '#EAB308');
					return;
				}

				const user = data.member?.user || data.user || { username: 'Discord User', id: '0' };
				const startTime = Date.now();

				// 1.1 APPLICATION_COMMAND (Slash Commands: /farm, /status, /claim, /hypesquad, /proxy, /vault, /scan, /help)
				if (data.type === 2) {
					const cmdName = data.data.name;

					if (this.isUserDebounced(user.id, `slash_${cmdName}`, 600)) {
						this.logBotEvent('DEBOUNCE', `Bỏ qua spam lệnh nhanh: /${cmdName} từ user ${user.username}`, '#EAB308');
						return;
					}

					this.logBotEvent('SLASH CMD', `Lệnh nhận được: ${chalk.cyan.bold(`/${cmdName}`)} bởi ${chalk.white.bold(user.username)} (${user.id})`, '#00F0FF');

					try {
						if (cmdName === 'farm') {
							const payload = buildFarmEmbedV2(questManager);
							await this.safeInteractionReply(api, data, payload);
						} else if (cmdName === 'status') {
							const active = questManager ? questManager.list().filter((q) => !q.isCompleted()).length : 0;
							const completed = questManager ? questManager.getCompleted().length : 0;
							const proxyStats = GlobalProxyPool.getStats();
							const proxyStr = proxyStats.total > 0 ? `Pool: ${proxyStats.healthy}/${proxyStats.total}` : 'Trực tiếp (Direct)';

							const payload = buildComponentsV2Payload({
								username: user.username,
								userId: user.id,
								activeQuests: active,
								completedQuests: completed,
								proxyStatus: proxyStr,
							});
							await this.safeInteractionReply(api, data, payload);
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
							await this.safeInteractionReply(api, data, payload);
						} else if (cmdName === 'hypesquad') {
							const houseOption = data.data.options?.find((o: any) => o.name === 'house');
							const houseId = Number(houseOption?.value ?? 1);

							let result = { success: false, message: '' };
							if (questManager) {
								result = await questManager.joinHypeSquad(houseId);
							} else {
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
							this.logBotEvent('HYPESQUAD', `Kết quả House #${houseId}: ${result.message}`, result.success ? '#00D26A' : '#EF4444');
							const payload = buildHypeSquadEmbedV2(houseId, result.success, result.message);
							await this.safeInteractionReply(api, data, payload);
						} else if (cmdName === 'proxy') {
							const next = GlobalProxyPool.rotate();
							const stats = GlobalProxyPool.getStats();
							this.logBotEvent('PROXY ROTATE', `Xoay proxy sang: ${next?.url || 'Direct'}`, '#2ECC71');
							const payload = buildProxyEmbedV2(stats, next?.url);
							await this.safeInteractionReply(api, data, payload);
						} else if (cmdName === 'vault') {
							if (questManager) {
								const report = await questManager.auditAccountVault();
								this.logBotEvent('VAULT AUDIT', `Trích xuất xong: ${report.totalDiscoveredQuests} quests, ${report.entitlements.length} keys`, '#3B82F6');
								const payload = buildVaultEmbedV2(report);
								await this.safeInteractionReply(api, data, payload);
							} else {
								await this.safeInteractionReply(api, data, {
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
							this.logBotEvent('SCAN', `Quét tìm thấy ${foundCount} nhiệm vụ mới`, '#00F0FF');
							await this.safeInteractionReply(api, data, {
								content: `🔍 **Đã hoàn tất quét nhiệm vụ:** Tìm thấy **${foundCount}** nhiệm vụ hợp lệ trên Windows, Mac, Android và Console.`,
								flags: 64,
							});
						} else if (cmdName === 'help') {
							const payload = buildHelpEmbedV2();
							await this.safeInteractionReply(api, data, payload);
						}

						const latency = Date.now() - startTime;
						this.logBotEvent('EXECUTE OK', `Hoàn thành /${cmdName} trong ${chalk.green.bold(`${latency}ms`)} (dùng lần nào ăn lần đó ✔)`, '#00D26A');
					} catch (err: any) {
						this.logBotEvent('EXECUTE ERR', `Lỗi xử lý /${cmdName}: ${err?.message || err}`, '#EF4444');
					}
				}

				// 1.2 MESSAGE_COMPONENT (Components V2 Buttons)
				if (data.type === 3) {
					const customId = data.data.custom_id;

					if (this.isUserDebounced(user.id, `btn_${customId}`, 400)) {
						this.logBotEvent('DEBOUNCE', `Bỏ qua double-click nút: ${customId}`, '#EAB308');
						return;
					}

					this.logBotEvent('BUTTON CLICK', `Nút bấm: ${chalk.hex('#EC4899').bold(customId)} bởi ${chalk.white.bold(user.username)}`, '#EC4899');

					try {
						if (customId === 'btn_autofarm') {
							const payload = buildFarmEmbedV2(questManager);
							await this.safeInteractionReply(api, data, { ...payload, flags: 64 });
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
							await this.safeInteractionReply(api, data, { ...payload, flags: 64 });
						} else if (customId === 'btn_rescan') {
							if (questManager) {
								GlobalScanner.scan(questManager.client).then((found) => {
									found.forEach((q) => questManager.upsert(q));
								});
							}
							await this.safeInteractionReply(api, data, {
								content: `🔍 **Đang quét nhiệm vụ ẩn** trên Windows, Mac, Android và Console...`,
								flags: 64,
							});
						} else if (customId === 'btn_proxy') {
							const next = GlobalProxyPool.rotate();
							const stats = GlobalProxyPool.getStats();
							const payload = buildProxyEmbedV2(stats, next?.url);
							await this.safeInteractionReply(api, data, { ...payload, flags: 64 });
						} else if (customId === 'btn_vault') {
							if (questManager) {
								questManager.auditAccountVault().then((_report) => {});
							}
							await this.safeInteractionReply(api, data, {
								content: `📦 **Kích hoạt Ultra Deep Extractor!** Đang quét đa chiều và trích xuất dữ liệu vào \`vault/discord_vault_audit.json\``,
								flags: 64,
							});
						}

						const latency = Date.now() - startTime;
						this.logBotEvent('BUTTON OK', `Nút ${customId} thực thi thành công trong ${latency}ms ✔`, '#00D26A');
					} catch (err: any) {
						this.logBotEvent('BUTTON ERR', `Lỗi xử lý nút ${customId}: ${err?.message || err}`, '#EF4444');
					}
				}
			});

			// ==========================================
			// 2. MESSAGE CREATE (Prefix Chat Commands: !farm, !status, !claim, !hypesquad, etc.)
			// ==========================================
			this.client.on('messageCreate' as any, async ({ data, api }: any) => {
				// Ignore bots
				if (data.author?.bot) return;

				const content = (data.content || '').trim();
				if (!content) return;

				const botId = this.botUser?.id || '';
				const mentionPrefix = `<@${botId}>`;
				const mentionNickPrefix = `<@!${botId}>`;

				let commandStr = '';
				if (content.startsWith('!') || content.startsWith('.')) {
					commandStr = content.slice(1).trim();
				} else if (botId && content.startsWith(mentionPrefix)) {
					commandStr = content.slice(mentionPrefix.length).trim();
				} else if (botId && content.startsWith(mentionNickPrefix)) {
					commandStr = content.slice(mentionNickPrefix.length).trim();
				} else {
					return; // Not a bot command
				}

				if (!commandStr) return;

				const parts = commandStr.split(/\s+/);
				const cmd = parts[0].toLowerCase();
				const args = parts.slice(1);
				const startTime = Date.now();

				this.logBotEvent('MESSAGE CMD', `Chat Command: ${chalk.hex('#5865F2').bold(`!${cmd}`)} bởi ${chalk.white.bold(data.author.username)} (${data.author.id})`, '#5865F2');

				try {
					let payload: any = null;

					if (cmd === 'farm' || cmd === 'autofarm') {
						payload = buildFarmEmbedV2(questManager);
					} else if (cmd === 'status') {
						const active = questManager ? questManager.list().filter((q) => !q.isCompleted()).length : 0;
						const completed = questManager ? questManager.getCompleted().length : 0;
						const proxyStats = GlobalProxyPool.getStats();
						const proxyStr = proxyStats.total > 0 ? `Pool: ${proxyStats.healthy}/${proxyStats.total}` : 'Trực tiếp (Direct)';

						payload = buildComponentsV2Payload({
							username: data.author.username,
							userId: data.author.id,
							activeQuests: active,
							completedQuests: completed,
							proxyStatus: proxyStr,
						});
					} else if (cmd === 'claim') {
						let count = 0;
						if (questManager) {
							const claimable = questManager.getClaimable();
							count = claimable.length;
							for (const q of claimable) {
								await questManager.claimQuestReward(q.id);
							}
						}
						payload = buildClaimEmbedV2(count);
					} else if (cmd === 'hypesquad' || cmd === 'hs') {
						const houseId = Number(args[0] ?? 1);
						let result = { success: false, message: '' };
						if (questManager) {
							result = await questManager.joinHypeSquad(houseId);
						} else {
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
									message: 'HypeSquad là tính năng dành cho User Account. Cần TOKEN trong .env hoặc dùng DevTools code.js!',
								};
							}
						}
						payload = buildHypeSquadEmbedV2(houseId, result.success, result.message);
					} else if (cmd === 'proxy') {
						const next = GlobalProxyPool.rotate();
						const stats = GlobalProxyPool.getStats();
						payload = buildProxyEmbedV2(stats, next?.url);
					} else if (cmd === 'vault') {
						if (questManager) {
							const report = await questManager.auditAccountVault();
							payload = buildVaultEmbedV2(report);
						} else {
							payload = { content: '⚠ QuestManager chưa sẵn sàng.' };
						}
					} else if (cmd === 'scan') {
						let foundCount = 0;
						if (questManager) {
							const found = await GlobalScanner.scan(questManager.client);
							found.forEach((q) => questManager.upsert(q));
							foundCount = found.length;
						}
						payload = {
							content: `🔍 **Đã quét xong:** Tìm thấy **${foundCount}** nhiệm vụ hợp lệ trên Windows, Mac, Android và Console.`,
						};
					} else if (cmd === 'help' || cmd === 'h') {
						payload = buildHelpEmbedV2();
					}

					if (payload) {
						await api.channels.createMessage(data.channel_id, {
							...payload,
							message_reference: { message_id: data.id },
						});
						const latency = Date.now() - startTime;
						this.logBotEvent('MESSAGE OK', `Phản hồi !${cmd} thành công trong ${latency}ms ✔`, '#00D26A');
					}
				} catch (err: any) {
					this.logBotEvent('MESSAGE ERR', `Lỗi xử lý !${cmd}: ${err?.message || err}`, '#EF4444');
				}
			});

			await this.ws.connect();
		} catch (err: any) {
			this.logBotEvent('CONNECTION ERR', `Lỗi kết nối Remote Bot: ${err?.message || err}`, '#EF4444');
		}
	}

	public async stop(): Promise<void> {
		if (this.ws) {
			try {
				await this.ws.destroy();
				this.logBotEvent('STOP', 'Discord Remote Bot Gateway đã ngắt kết nối an toàn.', '#EAB308');
			} catch {}
		}
	}
}

export const GlobalRemoteBot = new DiscordRemoteBot();
