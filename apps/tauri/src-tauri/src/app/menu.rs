#![cfg(target_os = "macos")]

use tauri::menu::{
    AboutMetadataBuilder, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder,
};
use tauri::{AppHandle, Manager, Wry};

use super::window::open_new_window;

pub fn build_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Menu<Wry>> {
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

    let new_window = MenuItemBuilder::with_id("new_window", "New Window")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let close_window = PredefinedMenuItem::close_window(app, None)?;
    let clear_cache = MenuItemBuilder::with_id("clear_cache_restart", "Clear Cache & Restart")
        .accelerator("CmdOrCtrl+Shift+Backspace")
        .build(app)?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_window)
        .item(&close_window)
        .separator()
        .item(&clear_cache)
        .build()?;

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

    let zoom_in = MenuItemBuilder::with_id("zoom_in", "Zoom In")
        .accelerator("CmdOrCtrl+=")
        .build(app)?;
    let zoom_out = MenuItemBuilder::with_id("zoom_out", "Zoom Out")
        .accelerator("CmdOrCtrl+-")
        .build(app)?;
    let zoom_reset = MenuItemBuilder::with_id("zoom_reset", "Actual Size")
        .accelerator("CmdOrCtrl+0")
        .build(app)?;
    let fullscreen = PredefinedMenuItem::fullscreen(app, None)?;

    let view_menu = {
        let mut builder = SubmenuBuilder::new(app, "View")
            .item(&zoom_in)
            .item(&zoom_out)
            .item(&zoom_reset)
            .separator()
            .item(&fullscreen);

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
        "new_window" => {
            let _ = open_new_window(app);
        }
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
        "zoom_in" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval(
                    r#"
                    (() => {
                        let zoom = parseFloat(localStorage.getItem('initZoom') || '100');
                        zoom = Math.min(200, zoom + 10);
                        localStorage.setItem('initZoom', zoom.toString());
                        document.body.style.zoom = zoom + '%';
                    })()
                    "#,
                );
            }
        }
        "zoom_out" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval(
                    r#"
                    (() => {
                        let zoom = parseFloat(localStorage.getItem('initZoom') || '100');
                        zoom = Math.max(30, zoom - 10);
                        localStorage.setItem('initZoom', zoom.toString());
                        document.body.style.zoom = zoom + '%';
                    })()
                    "#,
                );
            }
        }
        "zoom_reset" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval(
                    r#"
                    (() => {
                        localStorage.setItem('initZoom', '100');
                        document.body.style.zoom = '100%';
                    })()
                    "#,
                );
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
