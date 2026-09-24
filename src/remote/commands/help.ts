import { BotCommand, CommandContext } from './index';

export function buildHelpEmbedV2() {
	return {
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
					{ type: 2, style: 3, custom_id: 'btn_autofarm', label: '[+] Auto Farm' },
					{ type: 2, style: 1, custom_id: 'btn_claim', label: '[*] Claim All' },
					{ type: 2, style: 2, custom_id: 'btn_proxy', label: '[~] Xoay Proxy' },
					{ type: 2, style: 2, custom_id: 'btn_rescan', label: '[?] Quét Nhiệm Vụ' },
				],
			},
		],
	};
}

export const helpCommand: BotCommand = {
	name: 'help',
	description: '📖 Hướng dẫn chi tiết tất cả các lệnh Slash & Chat Messages',
	async executeSlash(_interaction, _api, _context: CommandContext) {
		return buildHelpEmbedV2();
	},
	async executeMessage(_message, _args, _api, _context: CommandContext) {
		return buildHelpEmbedV2();
	},
};
