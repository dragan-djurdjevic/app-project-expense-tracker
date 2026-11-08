// Spec: AR-001, AR-009, AR-010, AR-013, DS-001, DS-004, UI-003
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};
use tauri_plugin_fs::FsExt;

const PROFILE_FILE: &str = "profile.json";
const DEMO_DIR: &str = "demo";
const RESET_MARKER: &str = ".reset";
const DOCUMENTS_DIR: &str = "documents";
/// UI-003: window title in the demo profile.
const DEMO_TITLE: &str = "Architecture Project Tracker — Demo";

/// AR-013: the active data profile, fixed for the lifetime of the process.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Profile {
    Live,
    Demo,
}

impl Profile {
    fn parse(value: &str) -> Option<Profile> {
        match value {
            "live" => Some(Profile::Live),
            "demo" => Some(Profile::Demo),
            _ => None,
        }
    }

    fn as_str(self) -> &'static str {
        match self {
            Profile::Live => "live",
            Profile::Demo => "demo",
        }
    }
}

/// AR-013: data root `<root>` (`ARCHTRACKER_DATA_DIR` or the app data dir), active profile and its data dir.
struct DataState {
    root: PathBuf,
    profile: Profile,
    data_dir: PathBuf,
}

/// AR-013: the active profile's data dir.
#[tauri::command]
fn get_data_dir(state: tauri::State<'_, DataState>) -> String {
    state.data_dir.to_string_lossy().into_owned()
}

/// AR-013: `"live" | "demo"`.
#[tauri::command]
fn get_profile(state: tauri::State<'_, DataState>) -> String {
    state.profile.as_str().to_string()
}

/// AR-013: writes `<root>/profile.json`, then restarts the app.
#[tauri::command]
fn switch_profile(app: AppHandle, state: tauri::State<'_, DataState>, profile: String) -> Result<(), String> {
    let target = Profile::parse(&profile).ok_or_else(|| format!("Unknown profile: {profile}"))?;
    let content = serde_json::json!({ "profile": target.as_str() }).to_string();
    std::fs::write(state.root.join(PROFILE_FILE), content).map_err(|error| error.to_string())?;
    app.restart();
}

/// AR-013: only in `demo` — creates `<root>/demo/.reset`, then restarts; the folder is deleted at the next start.
#[tauri::command]
fn reset_demo(app: AppHandle, state: tauri::State<'_, DataState>) -> Result<(), String> {
    if state.profile != Profile::Demo {
        return Err("Reset is only available in demo mode".to_string());
    }
    std::fs::write(state.data_dir.join(RESET_MARKER), "").map_err(|error| error.to_string())?;
    app.restart();
}

fn resolve_root(app: &tauri::App) -> Result<PathBuf, Box<dyn std::error::Error>> {
    match std::env::var_os("ARCHTRACKER_DATA_DIR") {
        Some(dir) if !dir.is_empty() => Ok(PathBuf::from(dir)),
        _ => Ok(app.path().app_data_dir()?),
    }
}

/// AR-013: a missing, unreadable or invalid `profile.json` means `live`.
fn read_profile(root: &Path) -> Profile {
    std::fs::read_to_string(root.join(PROFILE_FILE))
        .ok()
        .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok())
        .and_then(|value| value.get("profile").and_then(|p| p.as_str()).and_then(Profile::parse))
        .unwrap_or(Profile::Live)
}

fn profile_dir(root: &Path, profile: Profile) -> PathBuf {
    match profile {
        Profile::Live => root.to_path_buf(),
        Profile::Demo => root.join(DEMO_DIR),
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
            // AR-013 steps 1–4, before the frontend opens any DB.
            let root = resolve_root(app)?;
            let profile = read_profile(&root);
            let data_dir = profile_dir(&root, profile);
            if profile == Profile::Demo && data_dir.join(RESET_MARKER).exists() {
                std::fs::remove_dir_all(&data_dir)?;
            }
            let documents = data_dir.join(DOCUMENTS_DIR);
            std::fs::create_dir_all(&documents)?;
            app.fs_scope().allow_directory(&documents, true)?;
            if profile == Profile::Demo {
                if let Some(window) = app.get_webview_window("main") {
                    window.set_title(DEMO_TITLE)?;
                }
            }
            app.manage(DataState { root, profile, data_dir });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_data_dir, get_profile, switch_profile, reset_demo])
        .run(tauri::generate_context!())
        .expect("error while running Architecture Project Tracker");
}
