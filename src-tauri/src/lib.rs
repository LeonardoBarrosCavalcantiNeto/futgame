use tauri_plugin_sql::{Migration, MigrationKind};

const QUANTIDADE_SLOTS: u32 = 3;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn migracoes() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "schema_inicial",
            sql: include_str!("../migrations/001_schema_inicial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "clube_competicao",
            sql: include_str!("../migrations/002_clube_competicao.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "atributos_opcionais",
            sql: include_str!("../migrations/003_atributos_opcionais.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut sql = tauri_plugin_sql::Builder::new();
    for slot in 1..=QUANTIDADE_SLOTS {
        sql = sql.add_migrations(&format!("sqlite:futgame-slot{slot}.db"), migracoes());
    }

    tauri::Builder::default()
        .plugin(sql.build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
