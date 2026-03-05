use tauri::{command, AppHandle, Manager};

#[command]
pub fn clear_cache_and_restart(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .clear_all_browsing_data()
            .map_err(|e| format!("Failed to clear cache: {}", e))?;
        app.restart();
    }
    Err("Main window not found".to_string())
}
