// Keeps release builds from opening a console window beside the app on Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    init_desktop::run();
}
