//! The one window, on the web app's URL: the dev server under `tauri dev`, `frontendDist` in a build.

use tauri::utils::config::FrontendDist;
use tauri::webview::{NewWindowResponse, PermissionResponse};
use tauri::{
    AppHandle, Config, Manager, Runtime, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};
use tauri_plugin_opener::OpenerExt;

use crate::navigation::{self, Verdict};

pub const MAIN: &str = "main";

/// The URL `WebviewUrl::default()` resolves to, read the same way Tauri reads it.
fn app_url(config: &Config) -> Option<Url> {
    if tauri::is_dev() {
        config.build.dev_url.clone()
    } else {
        match &config.build.frontend_dist {
            Some(FrontendDist::Url(url)) => Some(url.clone()),
            _ => None,
        }
    }
}

fn open_externally<R: Runtime>(app: &AppHandle<R>, url: &Url) {
    if let Err(error) = app.opener().open_url(url.as_str(), None::<&str>) {
        eprintln!("[desktop] could not open {url} in the browser: {error}");
    }
}

pub fn create_main<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<WebviewWindow<R>> {
    let Some(app_url) = app_url(app.config()) else {
        return Err(tauri::Error::InvalidWebviewUrl(
            "the web app's URL is not set: devUrl, or a URL as frontendDist",
        ));
    };
    let title = if tauri::is_dev() {
        "Init (Dev)"
    } else {
        "Init"
    };
    let allowed = navigation::allowed_origins(&app_url, navigation::emulator_url().as_deref());
    let navigating = app.clone();
    let opening = app.clone();

    WebviewWindowBuilder::new(app, MAIN, WebviewUrl::default())
        .title(title)
        .inner_size(1200.0, 800.0)
        .min_inner_size(800.0, 600.0)
        // WebKit asks about a frame's navigations too, so an iframe from an origin `classify`
        // does not allow is refused here; name its origin there if the web app embeds one
        .on_navigation(move |url| match navigation::classify(url, &allowed) {
            Verdict::Allow => true,
            Verdict::OpenExternally => {
                open_externally(&navigating, url);
                false
            }
            Verdict::Deny => false,
        })
        // `window.open` and `target="_blank"`: never a second window, a web page in the browser
        .on_new_window(move |url, _features| {
            if navigation::is_web_url(&url) {
                open_externally(&opening, &url);
            }
            NewWindowResponse::Deny
        })
        // the web app uses no camera or microphone, and WebKit grants a page either unless told not to
        .on_permission_request(|_, _| PermissionResponse::Deny)
        .build()
}

/// Brings the window forward, for a second launch or a menu item that needs the page.
pub fn show_main<R: Runtime>(app: &AppHandle<R>) -> Option<WebviewWindow<R>> {
    let window = app.get_webview_window(MAIN)?;
    let shown = window
        .unminimize()
        .and_then(|()| window.show())
        .and_then(|()| window.set_focus());
    if let Err(error) = shown {
        eprintln!("[desktop] could not bring the window forward: {error}");
    }
    Some(window)
}
