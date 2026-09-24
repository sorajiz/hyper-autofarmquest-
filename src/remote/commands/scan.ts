import { GlobalScanner } from '../../core/scanner';
import { BotCommand, CommandContext } from './index';

export const scanCommand: BotCommand = {
	name: 'scan',
	description: '🔍 Quét toàn diện các nhiệm vụ ẩn mới nhất trên mọi nền tảng',
	async executeSlash(_interaction, _api, context: CommandContext) {
		let foundCount = 0;
		if (context.questManager) {
			const found = await GlobalScanner.scan(context.questManager.client);
			found.forEach((q) => context.questManager!.upsert(q));
			foundCount = found.length;
		}
		return {
			content: `🔍 **Đã hoàn tất quét nhiệm vụ:** Tìm thấy **${foundCount}** nhiệm vụ hợp lệ trên Windows, Mac, Android và Console.`,
		};
	},
	async executeMessage(_message, _args, _api, context: CommandContext) {
		let foundCount = 0;
		if (context.questManager) {
			const found = await GlobalScanner.scan(context.questManager.client);
			found.forEach((q) => context.questManager!.upsert(q));
			foundCount = found.length;
		}
		return {
			content: `🔍 **Đã hoàn tất quét nhiệm vụ:** Tìm thấy **${foundCount}** nhiệm vụ hợp lệ trên Windows, Mac, Android và Console.`,
		};
	},
};
