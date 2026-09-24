import { BotCommand, CommandContext } from './index';

export function buildClaimEmbedV2(count: number, details?: string) {
	return {
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

export const claimCommand: BotCommand = {
	name: 'claim',
	description: '🎁 Tự động nhận tất cả phần thưởng nhiệm vụ đã hoàn thành',
	async executeSlash(_interaction, _api, context: CommandContext) {
		let count = 0;
		if (context.questManager) {
			const claimable = context.questManager.getClaimable();
			count = claimable.length;
			for (const q of claimable) {
				await context.questManager.claimQuestReward(q.id);
			}
		}
		return buildClaimEmbedV2(count);
	},
	async executeMessage(_message, _args, _api, context: CommandContext) {
		let count = 0;
		if (context.questManager) {
			const claimable = context.questManager.getClaimable();
			count = claimable.length;
			for (const q of claimable) {
				await context.questManager.claimQuestReward(q.id);
			}
		}
		return buildClaimEmbedV2(count);
	},
};
