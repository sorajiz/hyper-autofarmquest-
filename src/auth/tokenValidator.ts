import fs from 'node:fs';
import path from 'node:path';
import { Constants } from '../constants';

export interface TokenVerificationResult {
	valid: boolean;
	type: 'USER' | 'BOT' | 'INVALID';
	token: string;
	user?: {
		id: string;
		username: string;
		global_name?: string;
		bot: boolean;
	};
	error?: string;
}

export class TokenValidator {
	/**
	 * Sanitizes raw token input, stripping quotes, whitespace, and common paste typos
	 * (such as accidental double leading characters 'MM' instead of 'M').
	 */
	public static sanitizeToken(raw: string): string {
		let token = raw.trim().replace(/^["']|["']$/g, '');

		// Fix common paste typo: accidental double 'M' at start of base64 snowflake
		if (token.startsWith('MM') && token.length > 50) {
			const candidate = token.slice(1);
			const firstPart = candidate.split('.')[0];
			try {
				const decoded = Buffer.from(firstPart, 'base64').toString('utf8');
				if (/^\d{17,20}$/.test(decoded)) {
					token = candidate;
				}
			} catch {}
		}

		return token;
	}

	/**
	 * Proactively verifies token against Discord REST API to detect
	 * whether it is a User Token, Bot Token, or Invalid.
	 */
	public static async verifyToken(rawToken: string): Promise<TokenVerificationResult> {
		const token = this.sanitizeToken(rawToken);
		if (!token || token.length < 20) {
			return { valid: false, type: 'INVALID', token, error: 'Token quá ngắn hoặc chưa nhập.' };
		}

		// 1. Check as User Token (Personal Discord Account)
		try {
			const res = await fetch('https://discord.com/api/v9/users/@me', {
				headers: {
					Authorization: token,
					'User-Agent': Constants.USER_AGENT,
					'Accept-Language': 'vi,en-US;q=0.9',
				},
			});

			if (res.status === 200) {
				const data = (await res.json()) as any;
				return {
					valid: true,
					type: data.bot ? 'BOT' : 'USER',
					token,
					user: {
						id: data.id,
						username: data.username,
						global_name: data.global_name,
						bot: Boolean(data.bot),
					},
				};
			}
		} catch {}

		// 2. Check as Bot Token (Discord Developer Portal Bot)
		try {
			const res = await fetch('https://discord.com/api/v9/users/@me', {
				headers: {
					Authorization: `Bot ${token}`,
					'User-Agent': Constants.USER_AGENT,
				},
			});

			if (res.status === 200) {
				const data = (await res.json()) as any;
				return {
					valid: true,
					type: 'BOT',
					token,
					user: {
						id: data.id,
						username: data.username,
						global_name: data.global_name,
						bot: true,
					},
				};
			}
		} catch {}

		return {
			valid: false,
			type: 'INVALID',
			token,
			error: '401 Unauthorized: Token không hợp lệ hoặc đã bị Discord thu hồi.',
		};
	}

	/**
	 * Updates the .env file automatically when a new token or setting is validated
	 */
	public static syncTokenToEnv(key: 'TOKEN' | 'DISCORD_BOT_TOKEN' | 'DISCORD_GUILD_ID' | string, value: string): void {
		const envPath = path.resolve(process.cwd(), '.env');
		if (!fs.existsSync(envPath)) return;

		try {
			let content = fs.readFileSync(envPath, 'utf8');
			const regex = new RegExp(`^${key}=.*$`, 'm');
			if (regex.test(content)) {
				content = content.replace(regex, `${key}=${value}`);
			} else {
				content += `\n${key}=${value}`;
			}
			fs.writeFileSync(envPath, content, 'utf8');
		} catch {}
	}
}
