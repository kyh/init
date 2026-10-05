//! The Init desktop shell: one window on the web app, the macOS menu, and the update flow the
//! web app drives through three commands.

mod menu;
mod navigation;
mod updater;
mod window;

pub fn run() {
    let context = tauri::generate_context!();
    // `plugins.updater` in tauri.conf.json turns updates on; until then there is no feed to read,
    // and under `tauri dev` there is no bundle to replace
    let updates = context.config().plugins.0.contains_key("updater") && !tauri::is_dev();

    let mut builder = tauri::Builder::default()
        // only Rust opens links (window.rs): the plugin's own script would catch a `_blank`
        // click and ask for a command the page is not granted, so the link would do nothing
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        );
    if updates {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    let result = builder
        .manage(updater::Updates::new(updates))
        .invoke_handler(tauri::generate_handler![
            updater::check_for_updates,
            updater::download_update,
            updater::install_update,
        ])
        .on_menu_event(|app, event| menu::on_event(app, &event))
        .setup(|app| {
            menu::install(app.handle())?;
            window::create_main(app.handle())?;
            Ok(())
        })
        .run(context);

    if let Err(error) = result {
        eprintln!("[desktop] Init failed to start: {error}");
        std::process::exit(1);
    }
}
