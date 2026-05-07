const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('./index');
const { touchConversation } = require('./conversations');

function createMessage({ conversation_id, role, content, has_image = false }) {
    const db = getDatabase();
    const id = uuidv4();

    db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content, has_image)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, conversation_id, role, content, has_image ? 1 : 0);

    touchConversation(conversation_id);

    return getMessage(id);
}

function getMessage(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
}

function listMessages(conversation_id, { limit = 100, offset = 0 } = {}) {
    const db = getDatabase();
    return db.prepare(`
        SELECT * FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT ? OFFSET ?
    `).all(conversation_id, limit, offset);
}

function deleteMessage(id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}

function deleteConversationMessages(conversation_id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversation_id);
}

function getMessageCount(conversation_id) {
    const db = getDatabase();
    const result = db.prepare(`
        SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?
    `).get(conversation_id);
    return result.count;
}

module.exports = {
    createMessage,
    getMessage,
    listMessages,
    deleteMessage,
    deleteConversationMessages,
    getMessageCount
};
