use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

use super::window::open_new_window;

pub fn setup_system_tray(app: &AppHandle) -> tauri::Result<()> {
    let new_window = MenuItemBuilder::with_id("new_window", "New Window").build(app)?;
    let hide = MenuItemBuilder::with_id("hide_app", "Hide").build(app)?;
    let show = MenuItemBuilder::with_id("show_app", "Show").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[&new_window, &hide, &show, &quit])
        .build()?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .icon_as_template(false)
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "new_window" => {
                let _ = open_new_window(app);
            }
            "hide_app" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "show_app" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

pub fn setup_global_shortcut(app: &AppHandle, shortcut_str: &str) -> tauri::Result<()> {
    use tauri_plugin_global_shortcut::ShortcutState;

    let shortcut: tauri_plugin_global_shortcut::Shortcut = shortcut_str
        .parse()
        .map_err(|e| {
            tauri::Error::Anyhow(
                format!("Invalid shortcut '{}': {}", shortcut_str, e).into(),
            )
        })?;

    let last_trigger = Arc::new(Mutex::new(Instant::now()));

    app.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, _key, event| {
                if event.state == ShortcutState::Pressed {
                    let mut last = last_trigger.lock().unwrap();
                    if last.elapsed().as_millis() < 300 {
                        return;
                    }
                    *last = Instant::now();

                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            })
            .build(),
    )?;

    app.global_shortcut().register(shortcut).map_err(|e| {
        tauri::Error::Anyhow(format!("Failed to register shortcut: {}", e).into())
    })?;

    Ok(())
}
