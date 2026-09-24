import chalk from 'chalk';
import { DiscordRemoteBot } from '../discordBot';

export function handleReady(bot: DiscordRemoteBot, data: any) {
	bot.botUser = data.user;
	bot.logBotEvent(
		'GATEWAY READY',
		`Bot "${chalk.green.bold(data.user.username)}" (ID: ${data.user.id}) đã kết nối Gateway thành công! (Mobile: Android 🟢)`,
		'#00D26A'
	);
}
