import Database from "@tauri-apps/plugin-sql";

let conexao: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!conexao) {
    conexao = Database.load("sqlite:futgame.db");
  }
  return conexao;
}
