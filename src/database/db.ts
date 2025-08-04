import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const db = new Database("fiendBets.db");

// Create migrations table to track which migrations have been run
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const getMigrationStmt = db.prepare(
  "SELECT * FROM migrations WHERE filename = ?",
);
const insertMigrationStmt = db.prepare(
  "INSERT INTO migrations (filename) VALUES (?)",
);

export function runMigrations() {
  const migrationsDir = "db_migrations";

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir);
    console.log("Created migrations directory");
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort(); // Important: run in alphabetical order

  for (const filename of migrationFiles) {
    const existingMigration = getMigrationStmt.get(filename);

    if (existingMigration) {
      console.log(`Migration ${filename} already applied, skipping...`);
      continue;
    }

    console.log(`Running migration: ${filename}`);

    const migrationPath = path.join(migrationsDir, filename);
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    try {
      // Run migration in a transaction
      db.transaction(() => {
        db.exec(migrationSQL);
        insertMigrationStmt.run(filename);
      })();

      console.log(`Migration ${filename} completed successfully`);
    } catch (error) {
      console.error(`Migration ${filename} failed:`, error);
      throw error;
    }
  }
}

// Run migrations on startup
runMigrations();

export default db;
