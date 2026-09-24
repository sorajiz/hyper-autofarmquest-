use std::fs;
use std::path::Path;
use std::process::{Child, Command};
use std::thread;
use std::time::Duration;

pub struct GameSleeper {
    pub game_name: String,
    pub exe_name: String,
    pub duration_seconds: u64,
}

impl GameSleeper {
    pub fn new(game_name: &str, exe_name: &str, duration_seconds: u64) -> Self {
        Self {
            game_name: game_name.to_string(),
            exe_name: exe_name.to_string(),
            duration_seconds,
        }
    }

    /// Creates a lightweight dummy executable mimicking the verified game
    pub fn prepare_dummy_executable(&self, target_dir: &Path) -> std::io::Result<std::path::PathBuf> {
        fs::create_dir_all(target_dir)?;
        let exe_path = target_dir.join(&self.exe_name);

        // On Windows or Unix, create a lightweight script/executable if it doesn't exist
        if !exe_path.exists() {
            #[cfg(windows)]
            {
                // Write a tiny loop runner
                let script_content = format!("@echo off\ntitle {}\n:loop\ntimeout /t 10 >nul\ngoto loop\n", self.game_name);
                let bat_path = target_dir.join(format!("{}.bat", self.exe_name.trim_end_matches(".exe")));
                fs::write(&bat_path, script_content)?;
            }

            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let script_content = format!("#!/bin/sh\nwhile true; do sleep 10; done\n");
                fs::write(&exe_path, script_content)?;
                let mut perms = fs::metadata(&exe_path)?.permissions();
                perms.set_mode(0o755);
                fs::set_permissions(&exe_path, perms)?;
            }
        }

        Ok(exe_path)
    }

    /// Runs the simulation loop
    pub fn run_simulation(&self) {
        println!("🎮 [Rust Sleeper] Simulating active game: {} ({})", self.game_name, self.exe_name);
        println!("⏳ [Rust Sleeper] Target duration: {} seconds", self.duration_seconds);

        let step_seconds = 10;
        let mut elapsed = 0;

        while elapsed < self.duration_seconds {
            thread::sleep(Duration::from_secs(step_seconds));
            elapsed += step_seconds;
            println!("⏱ [Rust Sleeper] Progress: {}/{}s ({}%)", elapsed, self.duration_seconds, (elapsed * 100) / self.duration_seconds);
        }

        println!("✨ [Rust Sleeper] Game simulation completed successfully!");
    }
}
