import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';
import { Client } from '@discordjs/core';
import chalk from 'chalk';
import { QuestManager } from '../questManager';
import {
	BOT_SLASH_COMMANDS,
	buildFarmEmbedV2,
	buildFarmPayload,
	buildStatusPayload,
	buildComponentsV2Payload,
	buildHypeSquadEmbedV2,
	buildClaimEmbedV2,
	buildProxyEmbedV2,
	buildVaultEmbedV2,
	buildHelpEmbedV2,
	StatusData,
} from './commands';
import { registerEvents } from './events';
import { CommandHandler } from './handlers/commandHandler';
import { GlobalAntiDupe } from './handlers/antiDupeHandler';

export class DiscordRemoteBot {
	private token: string;
	private guildId: string;
	private enabled: boolean;
	public client: Client | null = null;
	public ws: WebSocketManager | null = null;
	public botUser: any = null;

	constructor(token: string = process.env.DISCORD_BOT_TOKEN || '', guildId?: string) {
		this.token = token.trim();
		this.guildId = (guildId || process.env.DISCORD_GUILD_ID || '').trim();
		this.enabled = this.token.length > 20;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Colorful, timestamped terminal telemetry logger for all bot actions
	 */
	public logBotEvent(category: string, message: string, color: string = '#00F0FF') {
		const now = new Date();
		const timeStr = chalk.gray(`[${now.toTimeString().split(' ')[0]}]`);
		const tag = chalk.hex(color).bold(`[${category.toUpperCase()}]`);
		console.log(`${timeStr} ${tag} ${message}`);
	}

	/**
	 * Anti-dupe check: delegates to GlobalAntiDupe
	 */
	public isDuplicateInteraction(id: string): boolean {
		return GlobalAntiDupe.isDuplicateInteraction(id);
	}

	/**
	 * Debounces user spam: delegates to GlobalAntiDupe
	 */
	public isUserDebounced(userId: string, action: string, windowMs: number = 500): boolean {
		return GlobalAntiDupe.isUserDebounced(userId, action, windowMs);
	}

	/**
	 * Deploy Slash Commands using modular CommandHandler with anti-dupe fingerprinting
	 */
	public async deploySlashCommands(guildId?: string): Promise<void> {
		if (!this.enabled) return;
		await CommandHandler.deploySlashCommands(this.token, guildId || this.guildId, this);
	}

	/**
	 * Connect Gateway with Discord Android Mobile identity + Rich Activity + Full Events
	 */
	public async start(questManager?: QuestManager): Promise<void> {
		if (!this.enabled) return;

		try {
			const rest = new REST({ version: '10' }).setToken(this.token);

			// Instant deployment upon bot startup
			await this.deploySlashCommands(this.guildId);

			// Connect Gateway with Discord Android Mobile properties + Rich Activity + Message intents
			this.ws = new WebSocketManager({
				token: this.token,
				intents: 1 | 512 | 4096 | 32768, // Guilds | GuildMessages | DirectMessages | MessageContent
				rest,
				identifyProperties: {
					os: 'Android',
					browser: 'Discord Android',
					device: 'Discord Android',
				},
				initialPresence: {
					status: 'online' as any,
					since: null,
					afk: false,
					activities: [
						{
							name: "Sora's Station",
							type: 0, // Playing
							state: 'Mua hàng ở ticket nha các bạn',
						},
					],
				},
			});

			this.ws.on('error', (err: any) => {
				this.logBotEvent('GATEWAY ERR', `Gateway error: ${err?.message || err}`, '#EF4444');
			});

			this.client = new Client({ rest, gateway: this.ws });

			// Modular event registration (ready, interactionCreate, messageCreate)
			registerEvents(this, this.client, questManager);

			await this.ws.connect();
		} catch (err: any) {
			this.logBotEvent('CONNECTION ERR', `Lỗi kết nối Remote Bot: ${err?.message || err}`, '#EF4444');
		}
	}

	public async stop(): Promise<void> {
		if (this.ws) {
			try {
				await this.ws.destroy();
				this.logBotEvent('STOP', 'Discord Remote Bot Gateway đã ngắt kết nối an toàn.', '#EAB308');
			} catch {}
		}
	}
}

export const GlobalRemoteBot = new DiscordRemoteBot();

// Re-export command list, types and builders for backward compatibility
export {
	BOT_SLASH_COMMANDS,
	buildFarmEmbedV2,
	buildFarmPayload,
	buildStatusPayload,
	buildComponentsV2Payload,
	buildHypeSquadEmbedV2,
	buildClaimEmbedV2,
	buildProxyEmbedV2,
	buildVaultEmbedV2,
	buildHelpEmbedV2,
	StatusData,
};
