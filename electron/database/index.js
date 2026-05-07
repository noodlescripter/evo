const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { runMigrations } = require('./schema');

let db = null;

function getDbPath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'evo.db');
}

function initDatabase() {
    if (db) return db;

    const dbPath = getDbPath();
    console.log('Initializing database at:', dbPath);

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    runMigrations(db);

    console.log('Database initialized successfully');
    return db;
}

function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('Database closed');
    }
}

module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase,
    getDbPath
};
