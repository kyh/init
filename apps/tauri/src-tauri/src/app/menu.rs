#![cfg(target_os = "macos")]

use tauri::menu::{
    AboutMetadataBuilder, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder,
};
use tauri::{AppHandle, Manager, Wry};

use super::config::AppConfig;

pub fn build_menu(app: &AppHandle, config: &AppConfig) -> tauri::Result<tauri::menu::Menu<Wry>> {
    let app_menu = SubmenuBuilder::new(app, "Init")
        .about(Some(
            AboutMetadataBuilder::new()
                .name(Some("Init"))
                .version(Some("0.1.0"))
                .build(),
        ))
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let close_window = PredefinedMenuItem::close_window(app, None)?;

    let file_menu = {
        let mut builder = SubmenuBuilder::new(app, "File").item(&close_window);

        if config.show_clear_cache {
            let clear_cache =
                MenuItemBuilder::with_id("clear_cache_restart", "Clear Cache & Restart")
                    .accelerator("CmdOrCtrl+Shift+Backspace")
                    .build(app)?;
            builder = builder.separator().item(&clear_cache);
        }

        builder.build()?
    };

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .separator()
        .select_all()
        .build()?;

    let fullscreen = PredefinedMenuItem::fullscreen(app, None)?;

    let view_menu = {
        let mut builder = SubmenuBuilder::new(app, "View").item(&fullscreen);

        #[cfg(debug_assertions)]
        {
            let toggle_devtools =
                MenuItemBuilder::with_id("toggle_devtools", "Toggle Developer Tools")
                    .accelerator("CmdOrCtrl+Option+I")
                    .build(app)?;
            builder = builder.separator().item(&toggle_devtools);
        }

        builder.build()?
    };

    let always_on_top = MenuItemBuilder::with_id("always_on_top", "Toggle Always on Top")
        .build(app)?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .maximize()
        .separator()
        .item(&always_on_top)
        .separator()
        .close_window()
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&window_menu)
        .build()?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle, event_id: &str) {
    match event_id {
        #[cfg(debug_assertions)]
        "toggle_devtools" => {
            if let Some(window) = app.get_webview_window("main") {
                if window.is_devtools_open() {
                    window.close_devtools();
                } else {
                    window.open_devtools();
                }
            }
        }
        "clear_cache_restart" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.clear_all_browsing_data();
                app.restart();
            }
        }
        "always_on_top" => {
            if let Some(window) = app.get_webview_window("main") {
                let is_on_top = window.is_always_on_top().unwrap_or(false);
                let _ = window.set_always_on_top(!is_on_top);
            }
        }
        _ => {}
    }
}
