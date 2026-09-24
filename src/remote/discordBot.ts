import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';
import { Client } from '@discordjs/core';
import { QuestManager } from '../questManager';

export class DiscordRemoteBot {
	private token: string;
	private enabled: boolean;
	private client: Client | null = null;
	private ws: WebSocketManager | null = null;

	constructor(token: string = process.env.DISCORD_BOT_TOKEN || '') {
		this.token = token.trim();
		this.enabled = this.token.length > 20;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	public async start(questManager?: QuestManager): Promise<void> {
		if (!this.enabled) return;

		try {
			const rest = new REST({ version: '10' }).setToken(this.token);
			this.ws = new WebSocketManager({
				token: this.token,
				intents: 0,
				rest,
			});
			this.client = new Client({ rest, gateway: this.ws });

			// Listen for interactions (Slash Commands)
			this.client.on('interactionCreate' as any, async ({ data, api }: any) => {
				if (data.type === 2) {
					// APPLICATION_COMMAND
					const cmdName = data.data.name;
					if (cmdName === 'status') {
						await api.interactions.reply(data.id, data.token, {
							content: `⚡ **Hyper AutoFarm Quest Status**\n- Nhiệm vụ đang quản lý: ${questManager ? questManager.size : 0}`,
						});
					}
				}
			});

			await this.ws.connect();
		} catch {
			// Fail-safe: do not crash the farm bot if remote bot connection fails
		}
	}

	public async stop(): Promise<void> {
		if (this.ws) {
			try {
				await this.ws.destroy();
			} catch {}
		}
	}
}

export const GlobalRemoteBot = new DiscordRemoteBot();
