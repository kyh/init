use serde::Deserialize;
use tauri::{command, AppHandle, Manager};
use tauri_plugin_http::reqwest;
use tauri_plugin_notification::NotificationExt;

#[derive(Deserialize)]
pub struct DownloadFileParams {
    url: String,
    filename: String,
}

#[derive(Deserialize)]
pub struct BinaryDownloadParams {
    filename: String,
    binary: Vec<u8>,
}

#[derive(Deserialize)]
pub struct NotificationParams {
    title: String,
    body: String,
}

fn get_downloads_dir(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .download_dir()
        .map_err(|e| format!("Could not find downloads directory: {}", e))
}

fn deduplicate_filename(file_path: &str) -> String {
    let path = std::path::Path::new(file_path);
    if !path.exists() {
        return file_path.to_string();
    }

    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    let ext = path
        .extension()
        .map(|e| format!(".{}", e.to_string_lossy()))
        .unwrap_or_default();
    let parent = path.parent().unwrap_or(std::path::Path::new(""));

    let mut counter = 1;
    loop {
        let new_name = format!("{}-{}{}", stem, counter, ext);
        let new_path = parent.join(&new_name);
        if !new_path.exists() {
            return new_path.to_string_lossy().to_string();
        }
        counter += 1;
    }
}

#[command]
pub async fn download_file(app: AppHandle, params: DownloadFileParams) -> Result<(), String> {
    let downloads = get_downloads_dir(&app)?;
    let file_path = downloads.join(&params.filename);
    let final_path = deduplicate_filename(&file_path.to_string_lossy());

    let response = reqwest::get(&params.url)
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    std::fs::write(&final_path, &bytes).map_err(|e| format!("Failed to save file: {}", e))?;

    Ok(())
}

#[command]
pub async fn download_file_by_binary(
    app: AppHandle,
    params: BinaryDownloadParams,
) -> Result<(), String> {
    let downloads = get_downloads_dir(&app)?;
    let file_path = downloads.join(&params.filename);
    let final_path = deduplicate_filename(&file_path.to_string_lossy());

    std::fs::write(&final_path, &params.binary)
        .map_err(|e| format!("Failed to save file: {}", e))?;

    Ok(())
}

#[command]
pub fn send_notification(app: AppHandle, params: NotificationParams) -> Result<(), String> {
    app.notification()
        .builder()
        .title(&params.title)
        .body(&params.body)
        .show()
        .map_err(|e| format!("Notification failed: {}", e))?;

    Ok(())
}

#[command]
pub async fn update_theme_mode(app: AppHandle, mode: String) {
    #[cfg(target_os = "macos")]
    {
        use tauri::Theme;
        if let Some(window) = app.get_webview_window("main") {
            let theme = if mode == "dark" {
                Theme::Dark
            } else {
                Theme::Light
            };
            let _ = window.set_theme(Some(theme));
        }
    }
}

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
