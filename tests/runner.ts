import { execSync } from 'node:child_process';

const testFiles = [
	'tests/banner.test.ts',
	'tests/nativeLoader.test.ts',
	'tests/proxyPool.test.ts',
	'tests/captcha.test.ts',
	'tests/scanner.test.ts',
	'tests/tui.test.ts',
	'tests/discordBot.test.ts',
	'tests/codeScript.test.ts',
	'tests/componentsV2.test.ts',
	'tests/rustEngine.test.ts',
	'tests/goWorker.test.ts',
	'tests/pythonService.test.ts',
	'tests/webDashboard.test.ts',
	'tests/markterence.test.ts',
];

console.log('🚀 Chạy toàn bộ 14 bộ Test Suite của Hyper AutoFarm Quest Polyglot...\n');
for (const file of testFiles) {
	console.log(`▶ Executing ${file}...`);
	execSync(`npx tsx ${file}`, { stdio: 'inherit' });
}
console.log('\n✨ TẤT CẢ 14 BỘ TEST ĐÃ HOÀN TOÀN VƯỢT QUA 100%!');
