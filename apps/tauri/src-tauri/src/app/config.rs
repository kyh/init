use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Global shortcut to activate/toggle the window. Set to null to disable.
    /// Examples: "CmdOrCtrl+Shift+K", "Alt+Space"
    #[serde(default = "default_activation_shortcut")]
    pub activation_shortcut: Option<String>,

    /// If true, closing the main window hides it to the tray instead of quitting.
    #[serde(default = "default_hide_on_close")]
    pub hide_on_close: bool,

    /// Show "Clear Cache & Restart" in the File menu (macOS) and as a command.
    #[serde(default = "default_true")]
    pub show_clear_cache: bool,
}

fn default_activation_shortcut() -> Option<String> {
    Some("CmdOrCtrl+Shift+K".to_string())
}

fn default_hide_on_close() -> bool {
    true
}

fn default_true() -> bool {
    true
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            activation_shortcut: default_activation_shortcut(),
            hide_on_close: default_hide_on_close(),
            show_clear_cache: default_true(),
        }
    }
}

impl AppConfig {
    pub fn load(app: &AppHandle) -> Self {
        let config_path = Self::config_path(app);

        match std::fs::read_to_string(&config_path) {
            Ok(contents) => serde_json::from_str(&contents).unwrap_or_else(|e| {
                eprintln!("Failed to parse config: {e}, using defaults");
                Self::default()
            }),
            Err(_) => {
                let config = Self::default();
                // Write default config so users can discover and edit it
                if let Some(parent) = config_path.parent() {
                    let _ = std::fs::create_dir_all(parent);
                }
                let _ = std::fs::write(
                    &config_path,
                    serde_json::to_string_pretty(&config).unwrap(),
                );
                config
            }
        }
    }

    fn config_path(app: &AppHandle) -> PathBuf {
        app.path()
            .app_config_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("config.json")
    }
}
