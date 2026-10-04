//! The Init desktop shell: one window on the web app, an application menu, and the update flow
//! the web app drives through three commands.

mod menu;
mod navigation;
mod updater;
mod window;

pub fn run() {
    let context = tauri::generate_context!();
    // the updater is configured by adding `plugins.updater` to tauri.conf.json; until then
    // there is nothing to check against, so neither the plugin nor its menu item exists
    let updater_configured = context.config().plugins.0.contains_key("updater");

    // single-instance first: a second launch must reach it before anything else starts
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            window::show_main(app);
        }))
        // only Rust opens links (window.rs): the plugin's own script would catch a `_blank`
        // click and ask for a command the page is not granted, so the link would do nothing
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        );
    if updater_configured {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    let result = builder
        .manage(updater::Updates::new(
            updater_configured && !tauri::is_dev(),
        ))
        .invoke_handler(tauri::generate_handler![
            updater::check_for_updates,
            updater::download_update,
            updater::install_update,
        ])
        .menu(menu::build)
        .on_menu_event(|app, event| menu::on_event(app, &event))
        .setup(|app| {
            window::create_main(app.handle())?;
            updater::check_after_launch(app.handle());
            Ok(())
        })
        .run(context);

    if let Err(error) = result {
        eprintln!("[desktop] Init failed to start: {error}");
        std::process::exit(1);
    }
}
