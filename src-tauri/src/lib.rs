// Spec: AR-001, AR-009, AR-010, DS-001, DS-004
use std::path::PathBuf;

use tauri::Manager;
use tauri_plugin_fs::FsExt;

/// Effective data directory: `ARCHTRACKER_DATA_DIR` if set, else the app data dir (AR-009).
struct DataDir(PathBuf);

#[tauri::command]
fn get_data_dir(state: tauri::State<'_, DataDir>) -> String {
    state.0.to_string_lossy().into_owned()
}

fn resolve_data_dir(app: &tauri::App) -> Result<PathBuf, Box<dyn std::error::Error>> {
    match std::env::var_os("ARCHTRACKER_DATA_DIR") {
        Some(dir) if !dir.is_empty() => Ok(PathBuf::from(dir)),
        _ => Ok(app.path().app_data_dir()?),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = resolve_data_dir(app)?;
            std::fs::create_dir_all(data_dir.join("documents"))?;
            // Allow the frontend fs plugin to read/write documents under the effective data dir (DS-004).
            app.fs_scope().allow_directory(&data_dir, true)?;
            app.manage(DataDir(data_dir));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_data_dir])
        .run(tauri::generate_context!())
        .expect("error while running Architecture Project Tracker");
}
