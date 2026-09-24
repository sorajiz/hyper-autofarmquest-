import figlet from 'figlet';
import chalk from 'chalk';

export const BANNER_TITLE = 'Auto Hyper - Farm Orb';
export const BANNER_SUBTITLE = '⚡ High-Performance Discord Quests Automation Engine | v2.0.0';

export function renderBanner(): string {
	const asciiText = figlet.textSync('Hyper - Farm Orb', {
		font: 'Standard',
		horizontalLayout: 'fitted',
	});

	const gradientLines = asciiText
		.split('\n')
		.map((line, idx) => {
			if (idx % 2 === 0) return chalk.hex('#5865F2').bold(line);
			return chalk.hex('#00D26A').bold(line);
		})
		.join('\n');

	const border = chalk.gray('═'.repeat(64));
	const titleLine = chalk.cyan.bold(`       ⭐  ${BANNER_TITLE}  ⭐`);
	const subLine = chalk.yellow(`   ${BANNER_SUBTITLE}`);

	return `\n${border}\n${gradientLines}\n${titleLine}\n${subLine}\n${border}\n`;
}

export function printBanner(): void {
	console.log(renderBanner());
}
