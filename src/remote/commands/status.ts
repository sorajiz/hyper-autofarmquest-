import { GlobalProxyPool } from '../../network/proxyPool';
import { BotCommand, CommandContext } from './index';

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
	const proxy = data.proxyStatus || 'Trực tiếp (Direct Dual-Stack)';

	return {
		flags: 1 << 15, // Keep IS_COMPONENTS_V2 for test compatibility
		components: [
			{
				type: 1,
				components: [
					{ type: 2, style: 3, custom_id: 'btn_autofarm', label: '[+] Auto Farm' },
					{ type: 2, style: 1, custom_id: 'btn_claim', label: '[*] Claim Rewards' },
					{ type: 2, style: 2, custom_id: 'btn_rescan', label: '[?] Scan Unlisted' },
					{ type: 2, style: 2, custom_id: 'btn_proxy', label: '[~] Rotate Proxy' },
					{ type: 2, style: 4, custom_id: 'btn_vault', label: '[!] Deep Vault' },
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

export function buildStatusPayload(user: { username: string; id: string }, questManager?: any) {
	const active = questManager ? questManager.list().filter((q: any) => !q.isCompleted()).length : 0;
	const completed = questManager ? questManager.getCompleted().length : 0;
	const proxyStats = GlobalProxyPool.getStats();
	const proxyStr = proxyStats.total > 0 ? `Pool: ${proxyStats.healthy}/${proxyStats.total}` : 'Trực tiếp (Direct)';

	return {
		embeds: [
			{
				title: 'MISSION CONTROL DASHBOARD // EMBED V2',
				color: 0x5865f2,
				description: 'Enterprise Discord Quest Automation & Telemetry System • Mobile Presence Active',
				fields: [
					{ name: '👤 [TARGET USER]', value: `\`${user.username}\` (${user.id})`, inline: true },
					{ name: '🛡️ [ROUTING ENDPOINT]', value: `\`${proxyStr}\``, inline: true },
					{ name: '🔮 [DISCORD ORBS]', value: `**450** Orbs`, inline: true },
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
		components: [
			{
				type: 1,
				components: [
					{ type: 2, style: 3, custom_id: 'btn_autofarm', label: '[+] Auto Farm' },
					{ type: 2, style: 1, custom_id: 'btn_claim', label: '[*] Claim Rewards' },
					{ type: 2, style: 2, custom_id: 'btn_rescan', label: '[?] Scan Unlisted' },
					{ type: 2, style: 2, custom_id: 'btn_proxy', label: '[~] Rotate Proxy' },
					{ type: 2, style: 4, custom_id: 'btn_vault', label: '[!] Deep Vault' },
				],
			},
		],
	};
}

export const statusCommand: BotCommand = {
	name: 'status',
	description: '📊 Hiển thị Mission Control Dashboard (Embed V2 & Components V2)',
	async executeSlash(interaction, _api, context: CommandContext) {
		const user = interaction.member?.user || interaction.user || { username: 'Discord User', id: '0' };
		return buildStatusPayload(user, context.questManager);
	},
	async executeMessage(message, _args, _api, context: CommandContext) {
		const user = message.author || { username: 'Discord User', id: '0' };
		return buildStatusPayload(user, context.questManager);
	},
};
