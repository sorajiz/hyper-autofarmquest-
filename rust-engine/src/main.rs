mod sleeper;

use std::env;
use std::io::{self, Read, Write};
use std::path::PathBuf;
use std::thread;
use std::time::Duration;
use sleeper::GameSleeper;

#[cfg(windows)]
use std::fs::OpenOptions;

const DEFAULT_APP_ID: &str = "1098679090623692880"; // Example Game / Quest App ID
const DEFAULT_GAME_NAME: &str = "Valorant";
const DEFAULT_EXE_NAME: &str = "VALORANT.exe";
const DEFAULT_DURATION: u64 = 900; // 15 minutes default

fn main() -> io::Result<()> {
    println!("============================================================");
    println!("   🔥 HYPER AUTO FARM QUEST - RUST NATIVE ENGINE v3.0.0 🔥   ");
    println!("     High Performance Process Sleeper & Discord RPC IPC     ");
    println!("============================================================");

    let args: Vec<String> = env::args().collect();
    let mut app_id = DEFAULT_APP_ID.to_string();
    let mut game_name = DEFAULT_GAME_NAME.to_string();
    let mut exe_name = DEFAULT_EXE_NAME.to_string();
    let mut duration_seconds = DEFAULT_DURATION;

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--app-id" => {
                if i + 1 < args.len() {
                    app_id = args[i + 1].clone();
                    i += 1;
                }
            }
            "--game-name" => {
                if i + 1 < args.len() {
                    game_name = args[i + 1].clone();
                    i += 1;
                }
            }
            "--exe" => {
                if i + 1 < args.len() {
                    exe_name = args[i + 1].clone();
                    i += 1;
                }
            }
            "--duration" => {
                if i + 1 < args.len() {
                    if let Ok(dur) = args[i + 1].parse::<u64>() {
                        duration_seconds = dur;
                    }
                    i += 1;
                }
            }
            _ => {}
        }
        i += 1;
    }

    println!("🎯 Target App ID : {}", app_id);
    println!("🎮 Target Game   : {}", game_name);
    println!("📦 Executable    : {}", exe_name);
    println!("⏱  Duration       : {} seconds", duration_seconds);

    // 1. Prepare dummy executable sleeper
    let target_dir = PathBuf::from("./temp_dummy_games");
    let sleeper = GameSleeper::new(&game_name, &exe_name, duration_seconds);
    if let Ok(exe_path) = sleeper.prepare_dummy_executable(&target_dir) {
        println!("🚀 [Dummy Process] Prepared runner at: {:?}", exe_path);
    }

    // 2. Connect to Discord IPC Named Pipe if available
    #[cfg(windows)]
    {
        let pipe_name = r"\\.\pipe\discord-ipc-0";
        println!("🔌 [Discord IPC] Connecting to Windows Named Pipe: {}", pipe_name);
        match OpenOptions::new().read(true).write(true).open(pipe_name) {
            Ok(mut pipe) => {
                println!("✅ [Discord IPC] Connected successfully!");

                // Opcode 0: Handshake
                let handshake_json = format!(r#"{{"v":1,"client_id":"{}"}}"#, app_id);
                if send_ipc_frame(&mut pipe, 0, &handshake_json).is_ok() {
                    println!("🤝 [Discord IPC] Handshake sent for App ID: {}", app_id);
                    thread::sleep(Duration::from_millis(500));

                    // Opcode 1: Frame SET_ACTIVITY
                    let activity_json = format!(
                        r#"{{"cmd":"SET_ACTIVITY","args":{{"pid":{},"activity":{{"details":"Farming Quest","state":"In Game","timestamps":{{"start":{}}}}},"nonce":"{}"}}}}"#,
                        std::process::id(),
                        chrono::Utc::now().timestamp(),
                        "hyper-quest-token"
                    );
                    if send_ipc_frame(&mut pipe, 1, &activity_json).is_ok() {
                        println!("📡 [Discord IPC] SET_ACTIVITY broadcast active!");
                    }
                }
            }
            Err(_) => {
                println!("⚠️  [Discord IPC] Discord Desktop client not running locally. Falling back to background process simulation.");
            }
        }
    }

    #[cfg(not(windows))]
    {
        println!("ℹ️  [Discord IPC] Unix environment detected. Running sleeper process loop.");
    }

    // 3. Run simulation loop
    sleeper.run_simulation();

    Ok(())
}

#[cfg(windows)]
fn send_ipc_frame(pipe: &mut std::fs::File, opcode: u32, payload: &str) -> io::Result<()> {
    let payload_bytes = payload.as_bytes();
    let length = payload_bytes.len() as u32;

    pipe.write_all(&opcode.to_le_bytes())?;
    pipe.write_all(&length.to_le_bytes())?;
    pipe.write_all(payload_bytes)?;
    pipe.flush()?;
    Ok(())
}
