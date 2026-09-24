import chalk from 'chalk';
import { COMMAND_MAP } from '../commands';
import { DiscordRemoteBot } from '../discordBot';

export async function handleMessageCreate(bot: DiscordRemoteBot, { data, api }: any, questManager?: any) {
	// Ignore bots
	if (data.author?.bot) return;

	const content = (data.content || '').trim();
	if (!content) return;

	const botId = bot.botUser?.id || '';
	const mentionPrefix = `<@${botId}>`;
	const mentionNickPrefix = `<@!${botId}>`;

	let commandStr = '';
	if (content.startsWith('!') || content.startsWith('.')) {
		commandStr = content.slice(1).trim();
	} else if (botId && content.startsWith(mentionPrefix)) {
		commandStr = content.slice(mentionPrefix.length).trim();
	} else if (botId && content.startsWith(mentionNickPrefix)) {
		commandStr = content.slice(mentionNickPrefix.length).trim();
	} else {
		return; // Not a command
	}

	if (!commandStr) return;

	const parts = commandStr.split(/\s+/);
	const cmd = parts[0].toLowerCase();
	const args = parts.slice(1);
	const startTime = Date.now();

	bot.logBotEvent('MESSAGE CMD', `Chat Command: ${chalk.hex('#5865F2').bold(`!${cmd}`)} bởi ${chalk.white.bold(data.author.username)} (${data.author.id})`, '#5865F2');

	try {
		const command = COMMAND_MAP.get(cmd);
		if (command) {
			const payload = await command.executeMessage(data, args, api, { questManager });
			if (payload) {
				await api.channels.createMessage(data.channel_id, {
					...payload,
					message_reference: { message_id: data.id },
				});
				const latency = Date.now() - startTime;
				bot.logBotEvent('MESSAGE OK', `Phản hồi !${cmd} thành công trong ${latency}ms ✔`, '#00D26A');
			}
		}
	} catch (err: any) {
		bot.logBotEvent('MESSAGE ERR', `Lỗi xử lý !${cmd}: ${err?.message || err}`, '#EF4444');
	}
}
