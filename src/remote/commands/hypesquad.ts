import { REST } from '@discordjs/rest';
import { TokenValidator } from '../../auth/tokenValidator';
import { BotCommand, CommandContext } from './index';

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

async function executeHypeSquadSwitch(houseId: number, context: CommandContext) {
	if (context.questManager) {
		return context.questManager.joinHypeSquad(houseId);
	}
	const userToken = TokenValidator.sanitizeToken(process.env.TOKEN || '');
	if (userToken && userToken.length > 20) {
		try {
			const userRest = new REST({ version: '10' }).setToken(userToken.replace(/^Bot\s+/i, ''));
			if (houseId > 0) {
				await userRest.post('/hypesquad/online', { body: { house_id: houseId } });
				return { success: true, message: `Đã cập nhật HypeSquad House ID #${houseId} thành công cho User Account!` };
			} else {
				await userRest.delete('/hypesquad/online');
				return { success: true, message: 'Đã rời HypeSquad House thành công!' };
			}
		} catch (err: any) {
			return { success: false, message: `Lỗi cập nhật Discord API: ${err?.message || err}` };
		}
	}
	return {
		success: false,
		message: 'HypeSquad là tính năng dành cho User Account. Cần cấu hình TOKEN trong .env hoặc dùng script DevTools trong code.js!',
	};
}

export const hypesquadCommand: BotCommand = {
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
	async executeSlash(interaction, _api, context: CommandContext) {
		const houseOption = interaction.data.options?.find((o: any) => o.name === 'house');
		const houseId = Number(houseOption?.value ?? 1);
		const result = await executeHypeSquadSwitch(houseId, context);
		return buildHypeSquadEmbedV2(houseId, result.success, result.message);
	},
	async executeMessage(_message, args, _api, context: CommandContext) {
		const houseId = Number(args[0] ?? 1);
		const result = await executeHypeSquadSwitch(houseId, context);
		return buildHypeSquadEmbedV2(houseId, result.success, result.message);
	},
};
