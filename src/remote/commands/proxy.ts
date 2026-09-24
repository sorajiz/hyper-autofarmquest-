import { GlobalProxyPool } from '../../network/proxyPool';
import { BotCommand, CommandContext } from './index';

export function buildProxyEmbedV2(stats: any, currentProxy?: string) {
	return {
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

export const proxyCommand: BotCommand = {
	name: 'proxy',
	description: '🔄 Xoay vòng và kiểm tra trạng thái Proxy Pool Dual-Stack IPv4/IPv6',
	async executeSlash(_interaction, _api, _context: CommandContext) {
		const next = GlobalProxyPool.rotate();
		const stats = GlobalProxyPool.getStats();
		return buildProxyEmbedV2(stats, next?.url);
	},
	async executeMessage(_message, _args, _api, _context: CommandContext) {
		const next = GlobalProxyPool.rotate();
		const stats = GlobalProxyPool.getStats();
		return buildProxyEmbedV2(stats, next?.url);
	},
};
