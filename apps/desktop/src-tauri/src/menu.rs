//! The application menu. Two items reach past the native roles: Settings…, which the web app
//! routes as a `menu-action` event, and Check for Updates…, once the updater is configured.

use tauri::menu::{
    AboutMetadata, Menu, MenuBuilder, MenuEvent, MenuItemBuilder, Submenu, SubmenuBuilder,
};
use tauri::{AppHandle, Emitter, Manager, Runtime};

use crate::updater::{self, Updates};
use crate::window::{self, MAIN};

/// The event the web app listens for (`apps/web/src/lib/desktop-bridge.ts`).
const MENU_ACTION_EVENT: &str = "menu-action";
const OPEN_SETTINGS: &str = "open-settings";
const CHECK_FOR_UPDATES: &str = "check-for-updates";

/// macOS keeps the app's own verbs in a menu named after it; elsewhere they live under File.
fn app_submenu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let info = app.package_info();
    let about = AboutMetadata {
        name: Some(info.name.clone()),
        version: Some(info.version.to_string()),
        ..AboutMetadata::default()
    };
    let settings = MenuItemBuilder::with_id(OPEN_SETTINGS, "Settings…")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let title = if cfg!(target_os = "macos") {
        info.name.as_str()
    } else {
        "File"
    };

    let mut menu = SubmenuBuilder::new(app, title).about(Some(about));
    if app.state::<Updates>().enabled() {
        menu = menu.text(CHECK_FOR_UPDATES, "Check for Updates…");
    }
    menu = menu.separator().item(&settings).separator();
    #[cfg(target_os = "macos")]
    {
        menu = menu
            .services()
            .separator()
            .hide()
            .hide_others()
            .show_all()
            .separator();
    }
    #[cfg(not(target_os = "macos"))]
    {
        menu = menu.close_window().separator();
    }
    menu.quit().build()
}

pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let edit = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;
    let view = SubmenuBuilder::new(app, "View").fullscreen().build()?;
    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .maximize()
        .separator()
        .bring_all_to_front()
        .build()?;

    let menu = MenuBuilder::new(app).item(&app_submenu(app)?);
    #[cfg(target_os = "macos")]
    let menu = menu.item(&SubmenuBuilder::new(app, "File").close_window().build()?);
    menu.items(&[&edit, &view, &window_menu]).build()
}

pub fn on_event<R: Runtime>(app: &AppHandle<R>, event: &MenuEvent) {
    match event.id().as_ref() {
        OPEN_SETTINGS => {
            if window::show_main(app).is_some()
                && let Err(error) = app.emit_to(MAIN, MENU_ACTION_EVENT, OPEN_SETTINGS)
            {
                eprintln!("[desktop] could not send {OPEN_SETTINGS} to the window: {error}");
            }
        }
        CHECK_FOR_UPDATES => {
            let app = app.clone();
            tauri::async_runtime::spawn(async move {
                updater::check(&app).await;
            });
        }
        _ => {}
    }
}
