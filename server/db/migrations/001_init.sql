-- server/db/migrations/001_init.sql
-- Migration tracking
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (authentication base) - FINAL
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  role TEXT CHECK(role IN ('ADMIN','DOCTOR','STAFF')) NOT NULL,

  is_active INTEGER DEFAULT 1,
  must_change_password INTEGER DEFAULT 0,

  -- NEW: password lifecycle tracking
  password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
