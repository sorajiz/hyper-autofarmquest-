import { ClientQuest } from '../client';
import { Quest } from '../quest';
import { AllQuestsResponse } from '../interface';

export interface PlatformProfile {
	name: string;
	os: string;
	locale: string;
	superProperties: Record<string, any>;
}

export const PLATFORM_MATRIX: PlatformProfile[] = [
	{
		name: 'Desktop Windows 11',
		os: 'Windows',
		locale: 'en-US',
		superProperties: {
			os: 'Windows',
			browser: 'Discord Client',
			release_channel: 'stable',
			client_version: '1.0.9180',
			os_version: '10.0.22631',
			os_arch: 'x64',
			system_locale: 'en-US',
		},
	},
	{
		name: 'Desktop macOS Apple Silicon',
		os: 'Mac OS X',
		locale: 'ja-JP',
		superProperties: {
			os: 'Mac OS X',
			browser: 'Discord Client',
			release_channel: 'stable',
			client_version: '1.0.9180',
			os_version: '23.4.0',
			os_arch: 'arm64',
			system_locale: 'ja-JP',
		},
	},
	{
		name: 'Mobile Android v250+',
		os: 'Android',
		locale: 'vi-VN',
		superProperties: {
			os: 'Android',
			browser: 'Discord Android',
			release_channel: 'googleRelease',
			client_version: '250.15',
			os_version: '34',
			system_locale: 'vi-VN',
		},
	},
	{
		name: 'Console Xbox Series X',
		os: 'Xbox',
		locale: 'en-US',
		superProperties: {
			os: 'Xbox',
			browser: 'Discord Embedded',
			release_channel: 'stable',
			client_version: '1.0.0',
			system_locale: 'en-US',
		},
	},
];

export class HiddenQuestsScanner {
	public async scan(client: ClientQuest): Promise<Quest[]> {
		const discovered: Map<string, Quest> = new Map();

		for (const profile of PLATFORM_MATRIX) {
			try {
				const superPropsBase64 = Buffer.from(JSON.stringify(profile.superProperties)).toString('base64');
				const res = (await client.rest.get('/quests/@me', {
					headers: {
						'x-super-properties': superPropsBase64,
						'x-discord-locale': profile.locale,
					},
				})) as AllQuestsResponse;

				if (res && Array.isArray(res.quests)) {
					for (const rawQuest of res.quests) {
						if (!discovered.has(rawQuest.id)) {
							discovered.set(rawQuest.id, Quest.create(rawQuest));
						}
					}
				}
			} catch {
				// Continue to next platform profile
			}
		}

		return Array.from(discovered.values());
	}
}

export const GlobalScanner = new HiddenQuestsScanner();
