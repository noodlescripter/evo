const { getDatabase } = require('./index');

function search(query, { type = 'all', limit = 50 } = {}) {
    const db = getDatabase();
    const results = { messages: [], memories: [] };
    const searchTerm = query.split(/\s+/).map(t => `"${t}"`).join(' OR ');

    if (type === 'all' || type === 'messages') {
        const messageResults = db.prepare(`
            SELECT m.*, c.title as conversation_title,
                   snippet(messages_fts, 0, '**', '**', '...', 32) as snippet
            FROM messages_fts
            JOIN messages m ON messages_fts.rowid = m.rowid
            JOIN conversations c ON m.conversation_id = c.id
            WHERE messages_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        `).all(searchTerm, limit);

        results.messages = messageResults;
    }

    if (type === 'all' || type === 'memories') {
        const memoryResults = db.prepare(`
            SELECT mem.*,
                   snippet(memories_fts, 0, '**', '**', '...', 32) as snippet
            FROM memories_fts
            JOIN memories mem ON memories_fts.rowid = mem.rowid
            WHERE memories_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        `).all(searchTerm, limit);

        results.memories = memoryResults;
    }

    return results;
}

function searchMessages(query, { conversation_id = null, limit = 50 } = {}) {
    const db = getDatabase();
    const searchTerm = query.split(/\s+/).map(t => `"${t}"`).join(' OR ');

    let sql = `
        SELECT m.*, c.title as conversation_title,
               snippet(messages_fts, 0, '**', '**', '...', 32) as snippet
        FROM messages_fts
        JOIN messages m ON messages_fts.rowid = m.rowid
        JOIN conversations c ON m.conversation_id = c.id
        WHERE messages_fts MATCH ?
    `;
    const params = [searchTerm];

    if (conversation_id) {
        sql += ' AND m.conversation_id = ?';
        params.push(conversation_id);
    }

    sql += ' ORDER BY rank LIMIT ?';
    params.push(limit);

    return db.prepare(sql).all(...params);
}

function searchMemories(query, { category = null, limit = 50 } = {}) {
    const db = getDatabase();
    const searchTerm = query.split(/\s+/).map(t => `"${t}"`).join(' OR ');

    let sql = `
        SELECT mem.*,
               snippet(memories_fts, 0, '**', '**', '...', 32) as snippet
        FROM memories_fts
        JOIN memories mem ON memories_fts.rowid = mem.rowid
        WHERE memories_fts MATCH ?
    `;
    const params = [searchTerm];

    if (category) {
        sql += ' AND mem.category = ?';
        params.push(category);
    }

    sql += ' ORDER BY rank LIMIT ?';
    params.push(limit);

    return db.prepare(sql).all(...params);
}

module.exports = {
    search,
    searchMessages,
    searchMemories
};
