const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('./index');

function createConversation({ title = 'New Conversation', model = null, provider = null } = {}) {
    const db = getDatabase();
    const id = uuidv4();

    db.prepare(`
        INSERT INTO conversations (id, title, model, provider)
        VALUES (?, ?, ?, ?)
    `).run(id, title, model, provider);

    return getConversation(id);
}

function getConversation(id) {
    const db = getDatabase();
    return db.prepare(`
        SELECT * FROM conversations WHERE id = ?
    `).get(id);
}

function listConversations({ archived = false, limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    return db.prepare(`
        SELECT * FROM conversations
        WHERE is_archived = ?
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
    `).all(archived ? 1 : 0, limit, offset);
}

function updateConversation(id, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
    }
    if (updates.model !== undefined) {
        fields.push('model = ?');
        values.push(updates.model);
    }
    if (updates.provider !== undefined) {
        fields.push('provider = ?');
        values.push(updates.provider);
    }
    if (updates.is_archived !== undefined) {
        fields.push('is_archived = ?');
        values.push(updates.is_archived ? 1 : 0);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`
        UPDATE conversations SET ${fields.join(', ')} WHERE id = ?
    `).run(...values);

    return getConversation(id);
}

function deleteConversation(id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
}

function archiveConversation(id, archived = true) {
    return updateConversation(id, { is_archived: archived });
}

function touchConversation(id) {
    const db = getDatabase();
    db.prepare(`
        UPDATE conversations SET updated_at = datetime('now') WHERE id = ?
    `).run(id);
}

module.exports = {
    createConversation,
    getConversation,
    listConversations,
    updateConversation,
    deleteConversation,
    archiveConversation,
    touchConversation
};
