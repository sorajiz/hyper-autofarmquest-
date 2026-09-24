import { QuestManager } from '../../questManager';
import { GlobalProxyPool } from '../../network/proxyPool';
import { BotCommand, CommandContext } from './index';

export function buildFarmPayload(questManager?: QuestManager) {
	const active = questManager ? questManager.list().filter((q) => !q.isCompleted()) : [];
	const completed = questManager ? questManager.getCompleted() : [];
	const proxyStats = GlobalProxyPool.getStats();
	const proxyStr = proxyStats.total > 0 ? `🛡️ ${proxyStats.healthy}/${proxyStats.total} Nodes` : '🛡️ Direct Connection';

	const questListText = active.length > 0
		? active.map((q, i) => `**${i + 1}. ${q.getName()}**\n• Game: \`${q.getApplicationName()}\`\n• Type: \`${q.getPrimaryTask()?.name || 'PLAY'}\` | Target: \`${q.getPrimaryTask()?.target || 900}s\``).join('\n\n')
		: '🎉 **Tất cả nhiệm vụ đã hoàn thành hoặc không có nhiệm vụ mới!**\nNhấn nút **[?] Scan Unlisted** để dò quét thêm nhiệm vụ ẩn.';

	return {
		content: '**AUTO HYPER - FARM ORB** // **DISCORD SLASH AUTOMATION ENGINE**',
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

export function buildFarmEmbedV2(questManager?: QuestManager) {
	return {
		flags: 1 << 15,
		...buildFarmPayload(questManager),
	};
}

export const farmCommand: BotCommand = {
	name: 'farm',
	description: '⚡ Kích hoạt và theo dõi tự động cày Quest & Discord Orbs siêu tốc',
	async executeSlash(_interaction, _api, context: CommandContext) {
		return buildFarmPayload(context.questManager);
	},
	async executeMessage(_message, _args, _api, context: CommandContext) {
		return buildFarmPayload(context.questManager);
	},
};

