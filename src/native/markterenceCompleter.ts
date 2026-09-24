import fs from 'node:fs';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import net from 'node:net';

export interface DummyGameInfo {
	appId: string;
	gameName: string;
	exeName: string;
	exePath: string;
	dir: string;
}

export class MarkterenceCompleter {
	// Database of verified Discord Quests games and their primary Windows executable names
	private static readonly KNOWN_EXECUTABLES: Record<string, string> = {
		'1098679090623692880': 'VALORANT.exe',
		'934278453472010260': 'GenshinImpact.exe',
		'1107567530467545168': 'StarRail.exe',
		'432980957394370572': 'FortniteClient-Win64-Shipping.exe',
		'892694125868843058': 'LeagueClient.exe',
		'1099238318853738546': 'r5apex.exe',
		'1142517596001030206': 'ZenlessZoneZero.exe',
		'1173873400591323146': 'Client-Win64-Shipping.exe',
		'1118464673629761596': 'Overwatch.exe',
		'1202271879344590858': 'Warframe.x64.exe',
		'952875883838840882': 'DeadByDaylight-Win64-Shipping.exe',
	};

	private static readonly RUNNING_PROCESSES = new Map<string, ChildProcess>();

	/**
	 * Resolves the primary executable name for a given Discord App ID or game name.
	 */
	public static resolveExeName(appId: string, gameName: string): string {
		if (this.KNOWN_EXECUTABLES[appId]) {
			return this.KNOWN_EXECUTABLES[appId];
		}
		// Fallback: sanitize game name to Windows exe format
		const sanitized = gameName.replace(/[^a-zA-Z0-9_-]/g, '');
		return `${sanitized || 'DiscordGame'}.exe`;
	}

	/**
	 * Prepares dummy game folder structure matching markterence/discord-quest-completer:
	 * games/<app-id>/<exe-name>
	 */
	public static prepareDummyGame(appId: string, gameName: string, baseDir: string = process.cwd()): DummyGameInfo {
		const exeName = this.resolveExeName(appId, gameName);
		const gameDir = path.join(baseDir, 'games', appId);
		fs.mkdirSync(gameDir, { recursive: true });

		const exePath = path.join(gameDir, exeName);

		// If dummy executable doesn't exist, create a lightweight runner
		if (!fs.existsSync(exePath)) {
			if (process.platform === 'win32') {
				const batPath = path.join(gameDir, `${path.parse(exeName).name}.bat`);
				const batScript = `@echo off\r\ntitle ${gameName}\r\n:loop\r\ntimeout /t 10 >nul\r\ngoto loop\r\n`;
				fs.writeFileSync(batPath, batScript, 'utf8');

				// Write a placeholder binary file if needed
				const placeholderBytes = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00', 'binary');
				fs.writeFileSync(exePath, placeholderBytes);
			} else {
				const shScript = `#!/bin/sh\nwhile true; do sleep 10; done\n`;
				fs.writeFileSync(exePath, shScript, { mode: 0o755 });
			}
		}

		return {
			appId,
			gameName,
			exeName,
			exePath,
			dir: gameDir,
		};
	}

	/**
	 * Launches the dummy game process and connects to Discord IPC Named Pipe
	 */
	public static launchDummyGame(
		appId: string,
		gameName: string,
		durationSeconds: number = 900
	): { info: DummyGameInfo; kill: () => void } {
		const info = this.prepareDummyGame(appId, gameName);

		// Launch the background process
		let child: ChildProcess;
		if (process.platform === 'win32') {
			const batPath = path.join(info.dir, `${path.parse(info.exeName).name}.bat`);
			child = spawn('cmd.exe', ['/c', batPath], {
				detached: true,
				stdio: 'ignore',
				windowsHide: true,
			});
		} else {
			child = spawn('/bin/sh', [info.exePath], {
				detached: true,
				stdio: 'ignore',
			});
		}

		child.unref();
		this.RUNNING_PROCESSES.set(appId, child);

		// Concurrently send Discord IPC Named Pipe handshake if on Windows
		this.sendDiscordNamedPipeHandshake(appId, gameName);

		const kill = () => {
			const proc = this.RUNNING_PROCESSES.get(appId);
			if (proc && !proc.killed) {
				try {
					if (process.platform === 'win32' && proc.pid) {
						spawn('taskkill', ['/pid', proc.pid.toString(), '/f', '/t']);
					} else {
						proc.kill();
					}
				} catch {}
			}
			this.RUNNING_PROCESSES.delete(appId);
		};

		// Auto kill after duration
		if (durationSeconds > 0) {
			setTimeout(() => {
				kill();
			}, durationSeconds * 1000).unref();
		}

		return { info, kill };
	}

	/**
	 * Directly transmits Discord RPC Handshake and SET_ACTIVITY over Windows Named Pipe \\.\pipe\discord-ipc-0
	 */
	public static sendDiscordNamedPipeHandshake(appId: string, gameName: string): void {
		if (process.platform !== 'win32') return;

		const pipePath = '\\\\.\\pipe\\discord-ipc-0';
		const client = net.connect(pipePath, () => {
			try {
				// Opcode 0: HANDSHAKE
				const handshake = JSON.stringify({ v: 1, client_id: appId });
				const buf0 = Buffer.alloc(8 + Buffer.byteLength(handshake));
				buf0.writeUInt32LE(0, 0); // Opcode 0
				buf0.writeUInt32LE(Buffer.byteLength(handshake), 4);
				buf0.write(handshake, 8);
				client.write(buf0);

				// Opcode 1: FRAME SET_ACTIVITY
				setTimeout(() => {
					try {
						const activity = JSON.stringify({
							cmd: 'SET_ACTIVITY',
							args: {
								pid: process.pid,
								activity: {
									details: `Playing ${gameName}`,
									state: 'In Quest',
									timestamps: { start: Math.floor(Date.now() / 1000) },
								},
							},
							nonce: 'hyper-markterence-quest',
						});
						const buf1 = Buffer.alloc(8 + Buffer.byteLength(activity));
						buf1.writeUInt32LE(1, 0); // Opcode 1
						buf1.writeUInt32LE(Buffer.byteLength(activity), 4);
						buf1.write(activity, 8);
						client.write(buf1);
					} catch {}
				}, 500);
			} catch {}
		});

		client.on('error', () => {
			// Discord Desktop client is not running locally; dummy process continues as fallback
		});
	}

	/**
	 * Clean up created dummy files
	 */
	public static cleanupGamesFolder(baseDir: string = process.cwd()): void {
		const gamesDir = path.join(baseDir, 'games');
		if (fs.existsSync(gamesDir)) {
			try {
				fs.rmSync(gamesDir, { recursive: true, force: true });
			} catch {}
		}
	}
}
