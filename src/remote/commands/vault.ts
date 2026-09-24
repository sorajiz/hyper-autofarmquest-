import { BotCommand, CommandContext } from './index';

export function buildVaultEmbedV2(report: any) {
	return {
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

export const vaultCommand: BotCommand = {
	name: 'vault',
	description: '📦 Khởi chạy Ultra Deep Extractor trích xuất kho quà & dữ liệu ẩn',
	async executeSlash(_interaction, _api, context: CommandContext) {
		if (context.questManager) {
			const report = await context.questManager.auditAccountVault();
			return buildVaultEmbedV2(report);
		}
		return {
			content: '⚠ QuestManager chưa sẵn sàng hoặc bot đang chạy chế độ Remote Only.',
		};
	},
	async executeMessage(_message, _args, _api, context: CommandContext) {
		if (context.questManager) {
			const report = await context.questManager.auditAccountVault();
			return buildVaultEmbedV2(report);
		}
		return {
			content: '⚠ QuestManager chưa sẵn sàng hoặc bot đang chạy chế độ Remote Only.',
		};
	},
};
