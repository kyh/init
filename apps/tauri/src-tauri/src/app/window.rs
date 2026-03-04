use std::sync::Mutex;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub struct AppState {
    next_window_index: Mutex<u32>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            next_window_index: Mutex::new(1),
        }
    }

    fn next_window_label(&self) -> String {
        let mut index = self.next_window_index.lock().unwrap();
        let label = format!("init-{}", *index);
        *index += 1;
        label
    }
}

pub fn open_new_window(app: &AppHandle) -> tauri::Result<()> {
    let state = app.state::<AppState>();
    let label = state.next_window_label();

    let window = WebviewWindowBuilder::new(app, &label, WebviewUrl::default())
        .title("Init")
        .inner_size(1200.0, 800.0)
        .min_inner_size(800.0, 600.0)
        .build()?;

    window.show()?;
    Ok(())
}
