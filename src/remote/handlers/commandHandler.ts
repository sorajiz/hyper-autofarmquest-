import { REST } from '@discordjs/rest';
import chalk from 'chalk';
import { BOT_SLASH_COMMANDS } from '../commands';
import { GlobalAntiDupe } from './antiDupeHandler';
import { DiscordRemoteBot } from '../discordBot';

export class CommandHandler {
	public static async deploySlashCommands(
		token: string,
		guildId?: string,
		bot?: DiscordRemoteBot
	): Promise<void> {
		if (!token || token.length < 20) return;
		try {
			const rest = new REST({ version: '10' }).setToken(token);
			const botUser: any = await rest.get('/users/@me');
			const appId = botUser?.id;
			if (!appId) return;

			if (bot) bot.botUser = botUser;

			const targetGuild = (guildId || process.env.DISCORD_GUILD_ID || '').trim();
			const fingerprint = `${targetGuild}:${BOT_SLASH_COMMANDS.length}:${BOT_SLASH_COMMANDS.map((c) => c.name).join(',')}`;

			// Anti-Dupe Check: Prevent duplicate PUT registrations
			if (!GlobalAntiDupe.shouldDeploy(targetGuild || 'global', fingerprint)) {
				if (bot) {
					bot.logBotEvent('ANTI-DUPE', 'Bỏ qua re-deploy: Danh sách slash commands đã đồng bộ tuyệt đối!', '#EAB308');
				}
				return;
			}

			if (targetGuild && targetGuild.length > 5) {
				// Instant Guild Deployment (0-second propagation)
				await rest.put(`/applications/${appId}/guilds/${targetGuild}/commands`, {
					body: BOT_SLASH_COMMANDS,
				});
				GlobalAntiDupe.markDeployed(targetGuild, fingerprint);
				if (bot) {
					bot.logBotEvent(
						'INSTANT DEPLOY',
						`Slash commands deploy NGAY LẬP TỨC vào Guild ID: ${chalk.white.bold(targetGuild)} (0s delay, chống dupe 100%)`,
						'#00D26A'
					);
				}

				// Background global deploy
				rest.put(`/applications/${appId}/commands`, {
					body: BOT_SLASH_COMMANDS,
				}).catch(() => {});
			} else {
				// Global Deployment
				await rest.put(`/applications/${appId}/commands`, {
					body: BOT_SLASH_COMMANDS,
				});
				GlobalAntiDupe.markDeployed('global', fingerprint);
				if (bot) {
					bot.logBotEvent(
						'GLOBAL DEPLOY',
						`Slash commands deploy Global cho Application ID: ${chalk.white.bold(appId)} (${BOT_SLASH_COMMANDS.length} lệnh)`,
						'#00F0FF'
					);
				}
			}
		} catch (err: any) {
			if (bot) {
				bot.logBotEvent('DEPLOY NOTICE', `Thông báo deploy slash: ${err?.message || err}`, '#EAB308');
			}
		}
	}
}
