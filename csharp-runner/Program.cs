using System;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace HyperQuestRunner
{
    public class Program
    {
        [DllImport("kernel32.dll")]
        private static extern bool SetProcessWorkingSetSize(IntPtr process, UIntPtr minimumWorkingSetSize, UIntPtr maximumWorkingSetSize);

        [DllImport("psapi.dll")]
        private static extern int EmptyWorkingSet(IntPtr hwProc);

        public static async Task Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine("============================================================");
            Console.WriteLine("   ⚡ HYPER AUTO FARM QUEST - C# .NET RUNNER v3.0.0 ⚡   ");
            Console.WriteLine("    Markterence Dummy Game Engine & Windows Named Pipe IPC  ");
            Console.WriteLine("============================================================");

            string appId = "1098679090623692880"; // Valorant App ID
            string gameName = "Valorant";
            string exeName = "VALORANT.exe";
            int durationSeconds = 900;

            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--app-id" && i + 1 < args.Length) appId = args[++i];
                else if (args[i] == "--game" && i + 1 < args.Length) gameName = args[++i];
                else if (args[i] == "--exe" && i + 1 < args.Length) exeName = args[++i];
                else if (args[i] == "--duration" && i + 1 < args.Length && int.TryParse(args[++i], out int d)) durationSeconds = d;
            }

            Console.WriteLine($"🎯 Target App ID : {appId}");
            Console.WriteLine($"🎮 Target Game   : {gameName}");
            Console.WriteLine($"📦 Executable    : {exeName}");
            Console.WriteLine($"⏱  Target Duration: {durationSeconds} seconds");

            // 1. Prepare Markterence Dummy Game Structure: games/<appId>/<exeName>
            string baseGamesDir = Path.Combine(Directory.GetCurrentDirectory(), "games", appId);
            Directory.CreateDirectory(baseGamesDir);
            string targetExePath = Path.Combine(baseGamesDir, exeName);

            if (!File.Exists(targetExePath))
            {
                // Write a lightweight runner script or dummy executable
                string batPath = Path.Combine(baseGamesDir, $"{Path.GetFileNameWithoutExtension(exeName)}.bat");
                string batScript = $"@echo off\r\ntitle {gameName}\r\n:loop\r\ntimeout /t 10 >nul\r\ngoto loop\r\n";
                File.WriteAllText(batPath, batScript);
                File.WriteAllBytes(targetExePath, new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00 });
                Console.WriteLine($"📁 [Markterence] Dummy game structure created at: {baseGamesDir}");
            }

            // 2. Connect to Discord IPC Named Pipe: \\.\pipe\discord-ipc-0
            Task pipeTask = Task.Run(async () =>
            {
                try
                {
                    Console.WriteLine("🔌 [Discord IPC] Connecting to Windows Named Pipe: discord-ipc-0...");
                    using NamedPipeClientStream pipe = new NamedPipeClientStream(".", "discord-ipc-0", PipeDirection.InOut, PipeOptions.Asynchronous);
                    using CancellationTokenSource cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                    await pipe.ConnectAsync(cts.Token);

                    Console.WriteLine("✅ [Discord IPC] Named Pipe connected!");

                    // Opcode 0: Handshake
                    string handshake = JsonSerializer.Serialize(new { v = 1, client_id = appId });
                    await SendIpcFrameAsync(pipe, 0, handshake);
                    Console.WriteLine($"🤝 [Discord IPC] Handshake dispatched for {appId}");

                    await Task.Delay(500);

                    // Opcode 1: Frame SET_ACTIVITY
                    string activity = JsonSerializer.Serialize(new
                    {
                        cmd = "SET_ACTIVITY",
                        args = new
                        {
                            pid = Environment.ProcessId,
                            activity = new
                            {
                                details = $"Farming {gameName}",
                                state = "In Game",
                                timestamps = new { start = DateTimeOffset.UtcNow.ToUnixTimeSeconds() }
                            }
                        },
                        nonce = "hyper-csharp-token"
                    });
                    await SendIpcFrameAsync(pipe, 1, activity);
                    Console.WriteLine($"📡 [Discord IPC] SET_ACTIVITY broadcast active!");
                }
                catch
                {
                    Console.WriteLine("ℹ️  [Discord IPC] Discord Desktop client not running locally. Continuing background simulation.");
                }
            });

            // 3. Memory optimization (keep memory footprint minimal)
            try
            {
                EmptyWorkingSet(Process.GetCurrentProcess().Handle);
            }
            catch { }

            // 4. Run Game Sleeper Simulation Loop
            Console.WriteLine($"🚀 [C# Sleeper] Simulating game activity for {durationSeconds} seconds...");
            int step = 10;
            int elapsed = 0;
            while (elapsed < durationSeconds)
            {
                await Task.Delay(step * 1000);
                elapsed += step;
                int percent = (elapsed * 100) / durationSeconds;
                Console.WriteLine($"⏱ [C# Sleeper] Progress: {elapsed}/{durationSeconds}s ({percent}%)");

                // Periodically trim memory
                if (elapsed % 30 == 0)
                {
                    try { EmptyWorkingSet(Process.GetCurrentProcess().Handle); } catch { }
                }
            }

            Console.WriteLine("✨ [C# Sleeper] Markterence simulation completed successfully!");
        }

        private static async Task SendIpcFrameAsync(Stream stream, int opcode, string payload)
        {
            byte[] payloadBytes = Encoding.UTF8.GetBytes(payload);
            byte[] header = new byte[8];
            BitConverter.GetBytes(opcode).CopyTo(header, 0);
            BitConverter.GetBytes(payloadBytes.Length).CopyTo(header, 4);

            await stream.WriteAsync(header, 0, 8);
            await stream.WriteAsync(payloadBytes, 0, payloadBytes.Length);
            await stream.FlushAsync();
        }
    }
}
