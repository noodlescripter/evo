const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('./index');

function createMemory({ content, category = 'general', priority = 0 }) {
    const db = getDatabase();
    const id = uuidv4();

    db.prepare(`
        INSERT INTO memories (id, content, category, priority)
        VALUES (?, ?, ?, ?)
    `).run(id, content, category, priority);

    return getMemory(id);
}

function getMemory(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
}

function listMemories({ active_only = false, category = null, limit = 100, offset = 0 } = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM memories WHERE 1=1';
    const params = [];

    if (active_only) {
        query += ' AND is_active = 1';
    }
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    query += ' ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
}

function updateMemory(id, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.content !== undefined) {
        fields.push('content = ?');
        values.push(updates.content);
    }
    if (updates.category !== undefined) {
        fields.push('category = ?');
        values.push(updates.category);
    }
    if (updates.is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(updates.is_active ? 1 : 0);
    }
    if (updates.priority !== undefined) {
        fields.push('priority = ?');
        values.push(updates.priority);
    }

    if (fields.length === 0) return getMemory(id);

    values.push(id);
    db.prepare(`UPDATE memories SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return getMemory(id);
}

function deleteMemory(id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM memories WHERE id = ?').run(id);
}

function toggleMemory(id) {
    const db = getDatabase();
    const memory = getMemory(id);
    if (!memory) return null;

    db.prepare('UPDATE memories SET is_active = ? WHERE id = ?')
        .run(memory.is_active ? 0 : 1, id);

    return getMemory(id);
}

function getActiveMemoriesPrompt() {
    const db = getDatabase();
    const memories = db.prepare(`
        SELECT content, category FROM memories
        WHERE is_active = 1
        ORDER BY priority DESC, created_at DESC
    `).all();

    if (memories.length === 0) return null;

    const grouped = {};
    for (const m of memories) {
        if (!grouped[m.category]) grouped[m.category] = [];
        grouped[m.category].push(m.content);
    }

    let prompt = '\n\n## User Context';
    for (const [category, items] of Object.entries(grouped)) {
        if (category !== 'general') {
            prompt += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)}`;
        }
        for (const item of items) {
            prompt += `\n- ${item}`;
        }
    }

    return prompt;
}

module.exports = {
    createMemory,
    getMemory,
    listMemories,
    updateMemory,
    deleteMemory,
    toggleMemory,
    getActiveMemoriesPrompt
};
