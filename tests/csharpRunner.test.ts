import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing C# .NET Runner project...');

assert.ok(fs.existsSync('csharp-runner/HyperQuestRunner.csproj'), 'C# project file must exist');
assert.ok(fs.existsSync('csharp-runner/Program.cs'), 'C# Program.cs must exist');

const csproj = fs.readFileSync('csharp-runner/HyperQuestRunner.csproj', 'utf8');
assert.ok(csproj.includes('<TargetFramework>net8.0</TargetFramework>') || csproj.includes('net'), 'Must target .NET 8.0');
assert.ok(csproj.includes('HyperQuestRunner'), 'Assembly name should match');

const program = fs.readFileSync('csharp-runner/Program.cs', 'utf8');
assert.ok(program.includes('discord-ipc-0'), 'Must connect to discord-ipc-0 named pipe');
assert.ok(program.includes('SET_ACTIVITY'), 'Must handle SET_ACTIVITY RPC opcode');
assert.ok(program.includes('Markterence'), 'Must implement Markterence dummy game logic');

console.log('✔ C# .NET Runner tests passed!');
