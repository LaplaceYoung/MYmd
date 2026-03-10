use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::OnceLock,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Emitter, Manager, Window};
use tauri_plugin_dialog::DialogExt;

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
    alias_text: String,
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
struct KnowledgeTagHit {
    file_path: String,
    document_title: String,
    tag: String,
}

#[derive(Debug, Serialize)]
struct KnowledgeSearchResponse {
    documents: Vec<KnowledgeDocumentHit>,
    headings: Vec<KnowledgeHeadingHit>,
    tags: Vec<KnowledgeTagHit>,
}

#[derive(Debug, Serialize)]
struct KnowledgeBacklinkItem {
    from_file_path: String,
    from_title: String,
    raw_text: String,
    to_heading_slug: String,
    snippet: String,
    matched_heading_text: String,
    updated_at: i64,
}

#[derive(Debug, Serialize)]
struct KnowledgeUnlinkedMentionItem {
    from_file_path: String,
    from_title: String,
    mention_text: String,
    snippet: String,
    updated_at: i64,
}

#[derive(Debug, Serialize)]
struct KnowledgeGraphNode {
    id: String,
    title: String,
    file_path: String,
}

#[derive(Debug, Serialize)]
struct KnowledgeGraphEdge {
    from: String,
    to: String,
    raw_text: String,
}

#[derive(Debug, Serialize)]
struct KnowledgeGraphResponse {
    nodes: Vec<KnowledgeGraphNode>,
    edges: Vec<KnowledgeGraphEdge>,
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
            alias_text TEXT NOT NULL DEFAULT '',
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

    match conn.execute(
        "ALTER TABLE wikilinks ADD COLUMN alias_text TEXT NOT NULL DEFAULT ''",
        [],
    ) {
        Ok(_) => {}
        Err(err) => {
            let msg = err.to_string();
            if !msg.contains("duplicate column name") {
                return Err(format!("Migrate wikilinks.alias_text failed: {}", err));
            }
        }
    }

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

fn trim_non_empty(input: Option<String>) -> Option<String> {
    input
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
}

fn configure_markdown_save_dialog<R: tauri::Runtime>(
    mut dialog: tauri_plugin_dialog::FileDialogBuilder<R>,
    default_file_name: Option<String>,
    current_path: Option<String>,
) -> tauri_plugin_dialog::FileDialogBuilder<R> {
    dialog = dialog.add_filter("Markdown", &["md", "markdown", "txt"]);

    if let Some(path_text) = trim_non_empty(current_path) {
        let path = PathBuf::from(path_text);
        if path.is_dir() {
            dialog = dialog.set_directory(path);
        } else {
            if let Some(parent) = path.parent() {
                if parent.exists() {
                    dialog = dialog.set_directory(parent);
                }
            }
            if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
                dialog = dialog.set_file_name(file_name);
            }
        }
    } else if let Some(file_name) = trim_non_empty(default_file_name) {
        dialog = dialog.set_file_name(file_name);
    }

    dialog
}

#[tauri::command]
fn write_text_file_to_path(path: String, content: String) -> Result<(), String> {
    let target = path.trim();
    if target.is_empty() {
        return Err("Path is empty".to_string());
    }

    log::info!("Attempting to write file to: {}", target);
    fs::write(target, content).map_err(|err| {
        let msg = format!("Failed to write '{}': {}", target, err);
        log::error!("{}", msg);
        msg
    })?;
    log::info!("Successfully wrote file to: {}", target);
    Ok(())
}

#[tauri::command]
fn save_markdown_via_dialog(
    app: tauri::AppHandle,
    window: Window,
    default_file_name: Option<String>,
    current_path: Option<String>,
    content: String,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file();
    #[cfg(desktop)]
    {
        dialog = dialog.set_parent(&window);
    }
    dialog = configure_markdown_save_dialog(dialog, default_file_name, current_path);

    let selected = dialog.blocking_save_file();
    let Some(target) = selected else {
        log::info!("Save dialog cancelled by user");
        return Ok(None);
    };

    let target_path = target.into_path().map_err(|err| {
        let msg = format!("Invalid save path: {}", err);
        log::error!("{}", msg);
        msg
    })?;

    let path_str = target_path.to_string_lossy().to_string();
    log::info!("Dialog selected path: {}", path_str);

    fs::write(&target_path, content).map_err(|err| {
        let msg = format!("Failed to write '{}': {}", path_str, err);
        log::error!("{}", msg);
        msg
    })?;

    log::info!("Successfully saved via dialog to: {}", path_str);
    Ok(Some(path_str))
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

        tx.execute(
            "DELETE FROM headings WHERE document_id = ?1",
            params![doc_id],
        )
        .map_err(|err| format!("Cleanup headings failed: {}", err))?;
        tx.execute(
            "DELETE FROM wikilinks WHERE from_doc_id = ?1",
            params![doc_id],
        )
        .map_err(|err| format!("Cleanup wikilinks failed: {}", err))?;
        tx.execute(
            "DELETE FROM document_tags WHERE document_id = ?1",
            params![doc_id],
        )
        .map_err(|err| format!("Cleanup document tags failed: {}", err))?;

        for heading in payload.headings {
            tx.execute(
                "
                INSERT INTO headings (document_id, level, text, slug, line_no)
                VALUES (?1, ?2, ?3, ?4, ?5)
                ",
                params![
                    doc_id,
                    heading.level,
                    heading.text,
                    heading.slug,
                    heading.line_no
                ],
            )
            .map_err(|err| format!("Insert heading failed: {}", err))?;
        }

        for link in payload.wikilinks {
            let to_doc_key = normalize_path_key(&link.to_doc_path);
            tx.execute(
                "
                INSERT INTO wikilinks (from_doc_id, to_doc_path, to_doc_key, to_heading_slug, alias_text, raw_text)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                ",
                params![
                    doc_id,
                    link.to_doc_path,
                    to_doc_key,
                    link.to_heading_slug,
                    link.alias_text,
                    link.raw_text
                ],
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
            tags: vec![],
        });
    }

    let q = format!("%{}%", query);
    let limit = limit.unwrap_or(30).clamp(1, 100);
    let offset = offset.unwrap_or(0).max(0);

    with_conn(|conn| {
        let mut documents = Vec::new();
        let mut headings = Vec::new();
        let mut tags = Vec::new();

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

        {
            let mut stmt = conn
                .prepare(
                    "
                    SELECT d.file_path, d.title, t.name
                    FROM tags t
                    JOIN document_tags dt ON dt.tag_id = t.id
                    JOIN documents d ON d.id = dt.document_id
                    WHERE t.name LIKE ?1
                    ORDER BY d.updated_at DESC
                    LIMIT ?2 OFFSET ?3
                    ",
                )
                .map_err(|err| format!("Prepare tag query failed: {}", err))?;

            let rows = stmt
                .query_map(params![q, limit, offset], |row| {
                    Ok(KnowledgeTagHit {
                        file_path: row.get(0)?,
                        document_title: row.get(1)?,
                        tag: row.get(2)?,
                    })
                })
                .map_err(|err| format!("Run tag query failed: {}", err))?;

            for row in rows {
                tags.push(row.map_err(|err| format!("Read tag row failed: {}", err))?);
            }
        }

        Ok(KnowledgeSearchResponse {
            documents,
            headings,
            tags,
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
                SELECT
                    d.file_path,
                    d.title,
                    w.raw_text,
                    w.to_heading_slug,
                    CASE
                        WHEN instr(lower(d.content), lower(w.raw_text)) > 0
                            THEN substr(
                                d.content,
                                max(instr(lower(d.content), lower(w.raw_text)) - 40, 1),
                                180
                            )
                        ELSE substr(d.content, 1, 180)
                    END AS snippet,
                    COALESCE(target_heading.text, '') AS matched_heading_text,
                    d.updated_at
                FROM wikilinks w
                JOIN documents d ON d.id = w.from_doc_id
                LEFT JOIN documents target_doc ON target_doc.file_key = w.to_doc_key
                LEFT JOIN headings target_heading
                    ON target_heading.document_id = target_doc.id
                    AND target_heading.slug = w.to_heading_slug
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
                    snippet: row.get(4)?,
                    matched_heading_text: row.get(5)?,
                    updated_at: row.get(6)?,
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

fn file_stem_for_wikilink(path: &str) -> String {
    Path::new(path)
        .file_stem()
        .and_then(|v| v.to_str())
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| "Untitled".to_string())
}

#[tauri::command]
fn knowledge_get_unlinked_mentions(file_path: String) -> Result<Vec<KnowledgeUnlinkedMentionItem>, String> {
    let target_key = normalize_path_key(&file_path);

    with_conn(|conn| {
        let target_title = conn
            .query_row(
                "SELECT title FROM documents WHERE file_key = ?1",
                params![target_key],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .map_err(|err| format!("Load target document failed: {}", err))?
            .unwrap_or_else(|| file_stem_for_wikilink(&file_path));

        let mention_text = target_title.trim().to_string();
        if mention_text.is_empty() {
            return Ok(Vec::new());
        }

        let q = format!("%{}%", mention_text);
        let mut stmt = conn
            .prepare(
                "
                SELECT
                    d.file_path,
                    d.title,
                    ?2 AS mention_text,
                    CASE
                        WHEN instr(lower(d.content), lower(?2)) > 0
                            THEN substr(
                                d.content,
                                max(instr(lower(d.content), lower(?2)) - 40, 1),
                                180
                            )
                        ELSE substr(d.content, 1, 180)
                    END AS snippet,
                    d.updated_at
                FROM documents d
                WHERE d.file_key != ?1
                  AND d.content LIKE ?3
                  AND NOT EXISTS (
                      SELECT 1
                      FROM wikilinks w
                      WHERE w.from_doc_id = d.id
                        AND w.to_doc_key = ?1
                  )
                ORDER BY d.updated_at DESC
                LIMIT 120
                ",
            )
            .map_err(|err| format!("Prepare unlinked mentions query failed: {}", err))?;

        let rows = stmt
            .query_map(params![target_key, mention_text, q], |row| {
                Ok(KnowledgeUnlinkedMentionItem {
                    from_file_path: row.get(0)?,
                    from_title: row.get(1)?,
                    mention_text: row.get(2)?,
                    snippet: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            })
            .map_err(|err| format!("Run unlinked mentions query failed: {}", err))?;

        let mut items = Vec::new();
        for row in rows {
            items.push(row.map_err(|err| format!("Read unlinked mentions row failed: {}", err))?);
        }

        Ok(items)
    })
}

#[tauri::command]
fn knowledge_link_unlinked_mention(
    from_file_path: String,
    target_file_path: String,
    mention_text: String,
) -> Result<bool, String> {
    let mention = mention_text.trim();
    if mention.is_empty() {
        return Ok(false);
    }

    let target_title = file_stem_for_wikilink(&target_file_path);
    let replacement = if mention.eq_ignore_ascii_case(&target_title) {
        format!("[[{}]]", target_title)
    } else {
        format!("[[{}|{}]]", target_title, mention)
    };

    let source_content = fs::read(&from_file_path)
        .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
        .map_err(|err| format!("Read source file failed '{}': {}", from_file_path, err))?;

    if !source_content.contains(mention) {
        return Ok(false);
    }

    let updated_content = source_content.replacen(mention, &replacement, 1);
    if updated_content == source_content {
        return Ok(false);
    }

    fs::write(&from_file_path, updated_content)
        .map_err(|err| format!("Write source file failed '{}': {}", from_file_path, err))?;

    Ok(true)
}

#[tauri::command]
fn knowledge_graph(filter_text: String, limit: Option<i64>) -> Result<KnowledgeGraphResponse, String> {
    let filter = filter_text.trim().to_string();
    let pattern = format!("%{}%", filter);
    let limit = limit.unwrap_or(300).clamp(1, 2000);

    with_conn(|conn| {
        let mut nodes = Vec::new();
        let mut edges = Vec::new();

        {
            let mut stmt = conn
                .prepare(
                    "
                    SELECT file_key, title, file_path
                    FROM documents
                    WHERE (?1 = '' OR title LIKE ?2 OR file_path LIKE ?2)
                    ORDER BY updated_at DESC
                    LIMIT ?3
                    ",
                )
                .map_err(|err| format!("Prepare graph node query failed: {}", err))?;

            let rows = stmt
                .query_map(params![filter, pattern, limit], |row| {
                    Ok(KnowledgeGraphNode {
                        id: row.get(0)?,
                        title: row.get(1)?,
                        file_path: row.get(2)?,
                    })
                })
                .map_err(|err| format!("Run graph node query failed: {}", err))?;

            for row in rows {
                nodes.push(row.map_err(|err| format!("Read graph node row failed: {}", err))?);
            }
        }

        {
            let mut stmt = conn
                .prepare(
                    "
                    SELECT
                        from_doc.file_key,
                        COALESCE(to_doc.file_key, ''),
                        w.raw_text
                    FROM wikilinks w
                    JOIN documents from_doc ON from_doc.id = w.from_doc_id
                    LEFT JOIN documents to_doc ON to_doc.file_key = w.to_doc_key
                    WHERE (?1 = ''
                           OR from_doc.title LIKE ?2
                           OR from_doc.file_path LIKE ?2
                           OR COALESCE(to_doc.title, '') LIKE ?2
                           OR w.raw_text LIKE ?2)
                    LIMIT ?3
                    ",
                )
                .map_err(|err| format!("Prepare graph edge query failed: {}", err))?;

            let rows = stmt
                .query_map(params![filter, pattern, limit * 4], |row| {
                    Ok(KnowledgeGraphEdge {
                        from: row.get(0)?,
                        to: row.get(1)?,
                        raw_text: row.get(2)?,
                    })
                })
                .map_err(|err| format!("Run graph edge query failed: {}", err))?;

            for row in rows {
                let edge = row.map_err(|err| format!("Read graph edge row failed: {}", err))?;
                if edge.to.is_empty() {
                    continue;
                }
                edges.push(edge);
            }
        }

        Ok(KnowledgeGraphResponse { nodes, edges })
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
            write_text_file_to_path,
            save_markdown_via_dialog,
            knowledge_upsert_document,
            knowledge_query,
            knowledge_get_backlinks,
            knowledge_get_unlinked_mentions,
            knowledge_link_unlinked_mention,
            knowledge_graph,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
