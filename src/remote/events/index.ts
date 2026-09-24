import { handleReady } from './ready';
import { handleInteractionCreate } from './interactionCreate';
import { handleMessageCreate } from './messageCreate';
import { DiscordRemoteBot } from '../discordBot';

export function registerEvents(bot: DiscordRemoteBot, client: any, questManager?: any) {
	client.on('ready' as any, ({ data }: any) => {
		handleReady(bot, data);
	});

	client.on('interactionCreate' as any, ({ data, api }: any) => {
		handleInteractionCreate(bot, { data, api }, questManager);
	});

	client.on('messageCreate' as any, ({ data, api }: any) => {
		handleMessageCreate(bot, { data, api }, questManager);
	});
}

export { handleReady, handleInteractionCreate, handleMessageCreate };
