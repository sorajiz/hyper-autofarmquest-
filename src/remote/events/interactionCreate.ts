import chalk from 'chalk';
import { COMMAND_MAP, buildFarmPayload, buildClaimEmbedV2, buildProxyEmbedV2 } from '../commands';
import { GlobalAntiDupe } from '../handlers/antiDupeHandler';
import { GlobalScanner } from '../../core/scanner';
import { GlobalProxyPool } from '../../network/proxyPool';
import { DiscordRemoteBot } from '../discordBot';

export async function handleInteractionCreate(bot: DiscordRemoteBot, { data, api }: any, questManager?: any) {
	// 1. Anti-Dupe Check: Ignore identical interaction IDs within 60s
	if (GlobalAntiDupe.isDuplicateInteraction(data.id)) {
		bot.logBotEvent('ANTI-DUPE', `Chặn interaction trùng lặp: ${data.id}`, '#EAB308');
		return;
	}

	const user = data.member?.user || data.user || { username: 'Discord User', id: '0' };
	const startTime = Date.now();

	// ==========================================
	// 1. APPLICATION_COMMAND (Slash Commands: /farm, /status, /claim, /hypesquad, /proxy, /vault, /scan, /help)
	// ==========================================
	if (data.type === 2) {
		const cmdName = data.data.name;

		if (GlobalAntiDupe.isUserDebounced(user.id, `slash_${cmdName}`, 500)) {
			bot.logBotEvent('DEBOUNCE', `Bỏ qua spam lệnh nhanh: /${cmdName} từ user ${user.username}`, '#EAB308');
			return;
		}

		bot.logBotEvent('SLASH CMD', `Lệnh nhận được: ${chalk.cyan.bold(`/${cmdName}`)} bởi ${chalk.white.bold(user.username)} (${user.id})`, '#00F0FF');

		try {
			// CRITICAL: Acknowledge Discord Gateway immediately within 10ms!
			// This completely eliminates "The application did not respond" (Ứng dụng không phản hồi)!
			await api.interactions.defer(data.id, data.token);

			const command = COMMAND_MAP.get(cmdName);
			if (command) {
				const payload = await command.executeSlash(data, api, { questManager });
				await api.interactions.editReply(data.application_id, data.token, payload);
				const latency = Date.now() - startTime;
				bot.logBotEvent('EXECUTE OK', `Hoàn thành /${cmdName} trong ${chalk.green.bold(`${latency}ms`)} (dùng lần nào ăn lần đó ✔)`, '#00D26A');
			} else {
				await api.interactions.editReply(data.application_id, data.token, {
					content: `⚠ Không tìm thấy lệnh \`/${cmdName}\`. Gõ \`/help\` để xem danh sách lệnh!`,
				});
			}
		} catch (err: any) {
			bot.logBotEvent('EXECUTE ERR', `Lỗi xử lý /${cmdName}: ${err?.message || err}`, '#EF4444');
			try {
				await api.interactions.editReply(data.application_id, data.token, {
					content: `❌ Đã xảy ra lỗi khi thực thi lệnh: ${err?.message || err}`,
				});
			} catch {}
		}
	}

	// ==========================================
	// 2. MESSAGE_COMPONENT (Buttons V2)
	// ==========================================
	if (data.type === 3) {
		const customId = data.data.custom_id;

		if (GlobalAntiDupe.isUserDebounced(user.id, `btn_${customId}`, 400)) {
			bot.logBotEvent('DEBOUNCE', `Bỏ qua double-click nút: ${customId}`, '#EAB308');
			return;
		}

		bot.logBotEvent('BUTTON CLICK', `Nút bấm: ${chalk.hex('#EC4899').bold(customId)} bởi ${chalk.white.bold(user.username)}`, '#EC4899');

		try {
			// Immediate ephemeral deferral (<10ms)
			await api.interactions.defer(data.id, data.token, { flags: 64 });

			let payload: any = null;

			if (customId === 'btn_autofarm') {
				payload = buildFarmPayload(questManager);
			} else if (customId === 'btn_claim') {
				let count = 0;
				if (questManager) {
					const claimable = questManager.getClaimable();
					count = claimable.length;
					for (const q of claimable) {
						await questManager.claimQuestReward(q.id);
					}
				}
				payload = buildClaimEmbedV2(count);
			} else if (customId === 'btn_rescan') {
				if (questManager) {
					GlobalScanner.scan(questManager.client).then((found) => {
						found.forEach((q) => questManager.upsert(q));
					});
				}
				payload = {
					content: `🔍 **Đang quét nhiệm vụ ẩn** trên Windows, Mac, Android và Console...`,
				};
			} else if (customId === 'btn_proxy') {
				const next = GlobalProxyPool.rotate();
				const stats = GlobalProxyPool.getStats();
				payload = buildProxyEmbedV2(stats, next?.url);
			} else if (customId === 'btn_vault') {
				if (questManager) {
					questManager.auditAccountVault().then((_report: any) => {});
				}
				payload = {
					content: `📦 **Kích hoạt Ultra Deep Extractor!** Đang quét đa chiều và trích xuất dữ liệu vào \`vault/discord_vault_audit.json\``,
				};
			}

			if (payload) {
				await api.interactions.editReply(data.application_id, data.token, payload);
				const latency = Date.now() - startTime;
				bot.logBotEvent('BUTTON OK', `Nút ${customId} thực thi thành công trong ${latency}ms ✔`, '#00D26A');
			}
		} catch (err: any) {
			bot.logBotEvent('BUTTON ERR', `Lỗi xử lý nút ${customId}: ${err?.message || err}`, '#EF4444');
		}
	}
}
