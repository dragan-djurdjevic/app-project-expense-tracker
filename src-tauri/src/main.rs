// Spec: AR-001, OV-003
// Prevents an additional console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    archtracker_lib::run()
}
