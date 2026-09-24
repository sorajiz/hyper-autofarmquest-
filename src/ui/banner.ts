import figlet from 'figlet';
import chalk from 'chalk';

export const BANNER_TITLE = 'Auto Hyper - Farm Orb';
export const BANNER_SUBTITLE = 'HIGH-PERFORMANCE DISCORD QUESTS & ORBS ENGINE // v3.2.0';

export function renderBanner(): string {
	const asciiText = figlet.textSync('Hyper - Farm Orb', {
		font: 'Standard',
		horizontalLayout: 'fitted',
	});

	// Refined dual-gradient text rendering
	const gradientLines = asciiText
		.split('\n')
		.map((line, idx) => {
			if (idx % 2 === 0) return chalk.hex('#5865F2').bold(line);
			return chalk.hex('#00F0FF').bold(line);
		})
		.join('\n');

	const width = 68;
	const bar = '─'.repeat(width);
	const topBorder = chalk.hex('#334155')(`┌${bar}┐`);
	const botBorder = chalk.hex('#334155')(`└${bar}┘`);
	const sepBorder = chalk.hex('#1E293B')(`├${bar}┤`);

	const titleBadge = chalk.hex('#00F0FF').bold('  [SYSTEM]  ') + chalk.hex('#F8FAFC').bold(BANNER_TITLE);
	const subtitle = chalk.hex('#64748B')(`  ${BANNER_SUBTITLE}`);
	const statusRow = chalk.hex('#00D26A')('  ● ENGINE: ONLINE') + 
	                  chalk.hex('#64748B')('  │  ') + 
	                  chalk.hex('#5865F2')('ARCH: POLYGLOT MATRIX') + 
	                  chalk.hex('#64748B')('  │  ') + 
	                  chalk.hex('#F59E0B')('MODE: DUAL-STACK');

	return `\n${topBorder}\n${gradientLines}\n${sepBorder}\n${titleBadge}\n${subtitle}\n${statusRow}\n${botBorder}\n`;
}

export function printBanner(): void {
	console.log(renderBanner());
}
