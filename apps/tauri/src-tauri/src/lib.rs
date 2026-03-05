mod app;

use app::invoke::clear_cache_and_restart;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_single_instance::init(|app, _args, _cwd| {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }),
        )
        .invoke_handler(tauri::generate_handler![clear_cache_and_restart])
        .setup(|app| {
            let config = app::config::AppConfig::load(app.handle());

            // Set up system tray
            app::setup::setup_system_tray(app.handle())?;

            // Register global activation shortcut if configured
            if let Some(ref shortcut) = config.activation_shortcut {
                app::setup::setup_global_shortcut(app.handle(), shortcut)?;
            }

            // Set up macOS menu
            #[cfg(target_os = "macos")]
            {
                let menu = app::menu::build_menu(app.handle(), &config)?;
                app.set_menu(menu)?;
            }

            // Store config for use in window event handler
            app.manage(config);

            Ok(())
        });

    // Handle macOS menu events
    #[cfg(target_os = "macos")]
    {
        builder = builder.on_menu_event(|app, event| {
            app::menu::handle_menu_event(app, event.id().as_ref());
        });
    }

    builder
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    let config = window.state::<app::config::AppConfig>();
                    if config.hide_on_close {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
