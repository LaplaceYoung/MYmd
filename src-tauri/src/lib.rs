use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::OnceLock,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Emitter, Manager};

static KNOWLEDGE_DB_PATH: OnceLock<PathBuf> = OnceLock::new();

#[derive(Debug, Deserialize)]
struct UpsertHeadingInput {
    level: i64,
    text: String,
    slug: String,
    line_no: i64,
}

#[derive(Debug, Deserialize)]
struct UpsertWikiLinkInput {
    raw_text: String,
    to_doc_path: String,
    to_heading_slug: String,
}

#[derive(Debug, Deserialize)]
struct KnowledgeUpsertPayload {
    file_path: String,
    title: String,
    content: String,
    mtime: i64,
    headings: Vec<UpsertHeadingInput>,
    wikilinks: Vec<UpsertWikiLinkInput>,
    tags: Vec<String>,
}

#[derive(Debug, Serialize)]
struct KnowledgeDocumentHit {
    file_path: String,
    title: String,
    preview: String,
}

#[derive(Debug, Serialize)]
struct KnowledgeHeadingHit {
    file_path: String,
    document_title: String,
    heading_text: String,
    heading_slug: String,
    level: i64,
}

#[derive(Debug, Serialize)]
struct KnowledgeSearchResponse {
    documents: Vec<KnowledgeDocumentHit>,
    headings: Vec<KnowledgeHeadingHit>,
}

#[derive(Debug, Serialize)]
struct KnowledgeBacklinkItem {
    from_file_path: String,
    from_title: String,
    raw_text: String,
    to_heading_slug: String,
    updated_at: i64,
}

fn normalize_path_key(path: &str) -> String {
    path.trim().replace('\\', "/").to_lowercase()
}

fn unix_now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn ensure_parent_dir(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|err| format!("Failed to create data dir '{}': {}", parent.display(), err))?;
    }
    Ok(())
}

fn db_path() -> Result<&'static PathBuf, String> {
    KNOWLEDGE_DB_PATH
        .get()
        .ok_or_else(|| "Knowledge DB path is not initialized".to_string())
}

fn with_conn<T, F>(f: F) -> Result<T, String>
where
    F: FnOnce(&Connection) -> Result<T, String>,
{
    let conn = Connection::open(db_path()?).map_err(|err| format!("Open DB failed: {}", err))?;
    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        ",
    )
    .map_err(|err| format!("Apply DB pragmas failed: {}", err))?;

    f(&conn)
}

fn init_knowledge_db(path: &Path) -> Result<(), String> {
    ensure_parent_dir(path)?;
    let conn = Connection::open(path).map_err(|err| format!("Init DB open failed: {}", err))?;

    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            file_key TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            mtime INTEGER NOT NULL,
            word_count INTEGER NOT NULL DEFAULT 0,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS headings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            level INTEGER NOT NULL,
            text TEXT NOT NULL,
            slug TEXT NOT NULL,
            line_no INTEGER NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS wikilinks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_doc_id INTEGER NOT NULL,
            to_doc_path TEXT NOT NULL,
            to_doc_key TEXT NOT NULL,
            to_heading_slug TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            FOREIGN KEY (from_doc_id) REFERENCES documents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS document_tags (
            document_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (document_id, tag_id),
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            block_key TEXT NOT NULL,
            line_no INTEGER NOT NULL,
            text_preview TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_documents_file_key ON documents(file_key);
        CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
        CREATE INDEX IF NOT EXISTS idx_headings_doc ON headings(document_id);
        CREATE INDEX IF NOT EXISTS idx_headings_slug ON headings(slug);
        CREATE INDEX IF NOT EXISTS idx_wikilinks_from_doc ON wikilinks(from_doc_id);
        CREATE INDEX IF NOT EXISTS idx_wikilinks_to_doc_key ON wikilinks(to_doc_key);
        ",
    )
    .map_err(|err| format!("Create tables failed: {}", err))?;

    Ok(())
}

#[tauri::command]
fn get_cli_args() -> Vec<String> {
    std::env::args().collect()
}

#[tauri::command]
fn read_text_file_from_path(path: String) -> Result<String, String> {
    std::fs::read(&path)
        .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
        .map_err(|err| format!("Failed to read '{}': {}", path, err))
}

#[tauri::command]
fn knowledge_upsert_document(payload: KnowledgeUpsertPayload) -> Result<(), String> {
    with_conn(|conn| {
        let tx = conn
            .unchecked_transaction()
            .map_err(|err| format!("Begin transaction failed: {}", err))?;

        let file_key = normalize_path_key(&payload.file_path);
        let word_count = payload.content.split_whitespace().count() as i64;
        let now = unix_now();

        tx.execute(
            "
            INSERT INTO documents (file_path, file_key, title, content, mtime, word_count, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ON CONFLICT(file_key) DO UPDATE SET
                file_path = excluded.file_path,
                title = excluded.title,
                content = excluded.content,
                mtime = excluded.mtime,
                word_count = excluded.word_count,
                updated_at = excluded.updated_at
            ",
            params![
                payload.file_path,
                file_key,
                payload.title,
                payload.content,
                payload.mtime,
                word_count,
                now,
            ],
        )
        .map_err(|err| format!("Upsert document failed: {}", err))?;

        let doc_id: i64 = tx
            .query_row(
                "SELECT id FROM documents WHERE file_key = ?1",
                params![file_key],
                |row| row.get(0),
            )
            .map_err(|err| format!("Load document id failed: {}", err))?;

        tx.execute("DELETE FROM headings WHERE document_id = ?1", params![doc_id])
            .map_err(|err| format!("Cleanup headings failed: {}", err))?;
        tx.execute("DELETE FROM wikilinks WHERE from_doc_id = ?1", params![doc_id])
            .map_err(|err| format!("Cleanup wikilinks failed: {}", err))?;
        tx.execute("DELETE FROM document_tags WHERE document_id = ?1", params![doc_id])
            .map_err(|err| format!("Cleanup document tags failed: {}", err))?;

        for heading in payload.headings {
            tx.execute(
                "
                INSERT INTO headings (document_id, level, text, slug, line_no)
                VALUES (?1, ?2, ?3, ?4, ?5)
                ",
                params![doc_id, heading.level, heading.text, heading.slug, heading.line_no],
            )
            .map_err(|err| format!("Insert heading failed: {}", err))?;
        }

        for link in payload.wikilinks {
            let to_doc_key = normalize_path_key(&link.to_doc_path);
            tx.execute(
                "
                INSERT INTO wikilinks (from_doc_id, to_doc_path, to_doc_key, to_heading_slug, raw_text)
                VALUES (?1, ?2, ?3, ?4, ?5)
                ",
                params![doc_id, link.to_doc_path, to_doc_key, link.to_heading_slug, link.raw_text],
            )
            .map_err(|err| format!("Insert wikilink failed: {}", err))?;
        }

        for tag in payload.tags {
            let tag_name = tag.trim();
            if tag_name.is_empty() {
                continue;
            }

            tx.execute(
                "INSERT INTO tags (name) VALUES (?1) ON CONFLICT(name) DO NOTHING",
                params![tag_name],
            )
            .map_err(|err| format!("Upsert tag failed: {}", err))?;

            let tag_id: Option<i64> = tx
                .query_row(
                    "SELECT id FROM tags WHERE name = ?1",
                    params![tag_name],
                    |row| row.get(0),
                )
                .optional()
                .map_err(|err| format!("Load tag id failed: {}", err))?;

            if let Some(tag_id) = tag_id {
                tx.execute(
                    "
                    INSERT INTO document_tags (document_id, tag_id)
                    VALUES (?1, ?2)
                    ON CONFLICT(document_id, tag_id) DO NOTHING
                    ",
                    params![doc_id, tag_id],
                )
                .map_err(|err| format!("Link document-tag failed: {}", err))?;
            }
        }

        tx.commit()
            .map_err(|err| format!("Commit transaction failed: {}", err))
    })
}

#[tauri::command]
fn knowledge_query(
    search_text: String,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<KnowledgeSearchResponse, String> {
    let query = search_text.trim();
    if query.is_empty() {
        return Ok(KnowledgeSearchResponse {
            documents: vec![],
            headings: vec![],
        });
    }

    let q = format!("%{}%", query);
    let limit = limit.unwrap_or(30).clamp(1, 100);
    let offset = offset.unwrap_or(0).max(0);

    with_conn(|conn| {
        let mut documents = Vec::new();
        let mut headings = Vec::new();

        {
            let mut stmt = conn
                .prepare(
                    "
                    SELECT file_path, title, substr(content, 1, 160)
                    FROM documents
                    WHERE title LIKE ?1 OR content LIKE ?1 OR file_path LIKE ?1
                    ORDER BY updated_at DESC
                    LIMIT ?2 OFFSET ?3
                    ",
                )
                .map_err(|err| format!("Prepare document query failed: {}", err))?;

            let rows = stmt
                .query_map(params![q, limit, offset], |row| {
                    Ok(KnowledgeDocumentHit {
                        file_path: row.get(0)?,
                        title: row.get(1)?,
                        preview: row.get(2)?,
                    })
                })
                .map_err(|err| format!("Run document query failed: {}", err))?;

            for row in rows {
                documents.push(row.map_err(|err| format!("Read document row failed: {}", err))?);
            }
        }

        {
            let mut stmt = conn
                .prepare(
                    "
                    SELECT d.file_path, d.title, h.text, h.slug, h.level
                    FROM headings h
                    JOIN documents d ON d.id = h.document_id
                    WHERE h.text LIKE ?1
                    ORDER BY d.updated_at DESC, h.level ASC
                    LIMIT ?2 OFFSET ?3
                    ",
                )
                .map_err(|err| format!("Prepare heading query failed: {}", err))?;

            let rows = stmt
                .query_map(params![q, limit, offset], |row| {
                    Ok(KnowledgeHeadingHit {
                        file_path: row.get(0)?,
                        document_title: row.get(1)?,
                        heading_text: row.get(2)?,
                        heading_slug: row.get(3)?,
                        level: row.get(4)?,
                    })
                })
                .map_err(|err| format!("Run heading query failed: {}", err))?;

            for row in rows {
                headings.push(row.map_err(|err| format!("Read heading row failed: {}", err))?);
            }
        }

        Ok(KnowledgeSearchResponse {
            documents,
            headings,
        })
    })
}

#[tauri::command]
fn knowledge_get_backlinks(file_path: String) -> Result<Vec<KnowledgeBacklinkItem>, String> {
    let target_key = normalize_path_key(&file_path);

    with_conn(|conn| {
        let mut stmt = conn
            .prepare(
                "
                SELECT d.file_path, d.title, w.raw_text, w.to_heading_slug, d.updated_at
                FROM wikilinks w
                JOIN documents d ON d.id = w.from_doc_id
                WHERE w.to_doc_key = ?1
                ORDER BY d.updated_at DESC
                LIMIT 200
                ",
            )
            .map_err(|err| format!("Prepare backlinks query failed: {}", err))?;

        let rows = stmt
            .query_map(params![target_key], |row| {
                Ok(KnowledgeBacklinkItem {
                    from_file_path: row.get(0)?,
                    from_title: row.get(1)?,
                    raw_text: row.get(2)?,
                    to_heading_slug: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            })
            .map_err(|err| format!("Run backlinks query failed: {}", err))?;

        let mut items = Vec::new();
        for row in rows {
            items.push(row.map_err(|err| format!("Read backlinks row failed: {}", err))?);
        }

        Ok(items)
    })
}

#[tauri::command]
fn exit_app() {
    std::process::exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            let _ = app.emit("mymd://open-files", args.clone());

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|err| format!("Resolve app data dir failed: {}", err))?;
            let db_path = app_data_dir.join("knowledge.db");
            init_knowledge_db(&db_path)?;
            let _ = KNOWLEDGE_DB_PATH.set(db_path);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exit_app,
            get_cli_args,
            read_text_file_from_path,
            knowledge_upsert_document,
            knowledge_query,
            knowledge_get_backlinks,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
