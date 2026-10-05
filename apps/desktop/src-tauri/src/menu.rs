//! Tauri's default macOS menu, plus Settings… (⌘,), which the web app routes as a `menu-action`
//! event, and Check for Updates… once the updater is configured.

use tauri::menu::{Menu, MenuEvent, MenuItem, MenuItemKind, PredefinedMenuItem};
use tauri::{AppHandle, Emitter, Manager, Runtime};

use crate::updater::{self, Updates};
use crate::window::{self, MAIN};

/// The event the web app listens for (`apps/web/src/lib/desktop-bridge.ts`).
const MENU_ACTION_EVENT: &str = "menu-action";
const OPEN_SETTINGS: &str = "open-settings";
const CHECK_FOR_UPDATES: &str = "check-for-updates";

/// Windows and Linux draw a menu as a bar across the web app, so there the window has none.
pub fn install<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if cfg!(target_os = "macos") {
        app.set_menu(build(app)?)?;
    }
    Ok(())
}

fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = Menu::default(app)?;
    // the first menu is the app's, opening with About: its own verbs follow it
    if let Some(MenuItemKind::Submenu(app_menu)) = menu.items()?.first() {
        let settings =
            MenuItem::with_id(app, OPEN_SETTINGS, "Settings…", true, Some("CmdOrCtrl+,"))?;
        app_menu.insert_items(&[&PredefinedMenuItem::separator(app)?, &settings], 1)?;
        if app.state::<Updates>().enabled() {
            let check = MenuItem::with_id(
                app,
                CHECK_FOR_UPDATES,
                "Check for Updates…",
                true,
                None::<&str>,
            )?;
            app_menu.insert(&check, 1)?;
        }
    }
    Ok(menu)
}

pub fn on_event<R: Runtime>(app: &AppHandle<R>, event: &MenuEvent) {
    match event.id().as_ref() {
        OPEN_SETTINGS => {
            if window::show_main(app)
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
