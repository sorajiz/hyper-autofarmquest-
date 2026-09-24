import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Rust Engine files...');
assert.ok(fs.existsSync('rust-engine/Cargo.toml'), 'Cargo.toml must exist');
assert.ok(fs.existsSync('rust-engine/src/main.rs'), 'src/main.rs must exist');
assert.ok(fs.existsSync('rust-engine/src/sleeper.rs'), 'src/sleeper.rs must exist');
assert.ok(fs.existsSync('rust-engine/src/extractor.rs'), 'src/extractor.rs must exist');

const cargo = fs.readFileSync('rust-engine/Cargo.toml', 'utf8');
assert.ok(cargo.includes('hyper-rust-engine'), 'Crate name should be hyper-rust-engine');

const extractorRs = fs.readFileSync('rust-engine/src/extractor.rs', 'utf8');
assert.ok(extractorRs.includes('RustDiscordParser'), 'Must define RustDiscordParser');
console.log('✔ Rust Engine file structure verified!');
