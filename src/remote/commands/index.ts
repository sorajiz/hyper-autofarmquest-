import { QuestManager } from '../../questManager';
import { farmCommand, buildFarmPayload, buildFarmEmbedV2 } from './farm';
import { statusCommand, buildStatusPayload, buildComponentsV2Payload, StatusData } from './status';
import { claimCommand, buildClaimEmbedV2 } from './claim';
import { hypesquadCommand, buildHypeSquadEmbedV2 } from './hypesquad';
import { proxyCommand, buildProxyEmbedV2 } from './proxy';
import { vaultCommand, buildVaultEmbedV2 } from './vault';
import { scanCommand } from './scan';
import { helpCommand, buildHelpEmbedV2 } from './help';

export interface CommandContext {
	questManager?: QuestManager;
	token?: string;
}

export interface BotCommand {
	name: string;
	description: string;
	options?: any[];
	executeSlash: (interaction: any, api: any, context: CommandContext) => Promise<any>;
	executeMessage: (message: any, args: string[], api: any, context: CommandContext) => Promise<any>;
}

export const ALL_COMMANDS: BotCommand[] = [
	farmCommand,
	statusCommand,
	claimCommand,
	hypesquadCommand,
	proxyCommand,
	vaultCommand,
	scanCommand,
	helpCommand,
];

export const COMMAND_MAP = new Map<string, BotCommand>();
ALL_COMMANDS.forEach((cmd) => {
	COMMAND_MAP.set(cmd.name, cmd);
});

export const BOT_SLASH_COMMANDS = ALL_COMMANDS.map((cmd) => ({
	name: cmd.name,
	description: cmd.description,
	...(cmd.options ? { options: cmd.options } : {}),
}));

export {
	farmCommand,
	statusCommand,
	claimCommand,
	hypesquadCommand,
	proxyCommand,
	vaultCommand,
	scanCommand,
	helpCommand,
	buildFarmPayload,
	buildFarmEmbedV2,
	buildStatusPayload,
	buildComponentsV2Payload,
	buildClaimEmbedV2,
	buildHypeSquadEmbedV2,
	buildProxyEmbedV2,
	buildVaultEmbedV2,
	buildHelpEmbedV2,
	StatusData,
};
