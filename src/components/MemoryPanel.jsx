import { useState } from 'react'

const CATEGORIES = ['general', 'preference', 'fact', 'instruction']

export default function MemoryPanel({
    memories,
    onAdd,
    onUpdate,
    onDelete,
    onToggle,
    onClose
}) {
    const [newContent, setNewContent] = useState('')
    const [newCategory, setNewCategory] = useState('general')
    const [editingId, setEditingId] = useState(null)
    const [editContent, setEditContent] = useState('')

    const handleAdd = () => {
        if (!newContent.trim()) return
        onAdd({ content: newContent.trim(), category: newCategory })
        setNewContent('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleAdd()
        }
    }

    const startEdit = (mem) => {
        setEditingId(mem.id)
        setEditContent(mem.content)
    }

    const saveEdit = (id) => {
        if (editContent.trim()) {
            onUpdate(id, { content: editContent.trim() })
        }
        setEditingId(null)
    }

    const categoryColor = (cat) => {
        switch (cat) {
            case 'preference': return 'bg-blue-500/30'
            case 'fact': return 'bg-green-500/30'
            case 'instruction': return 'bg-yellow-500/30'
            default: return 'bg-white/20'
        }
    }

    return (
        <div className="flex flex-col h-full bg-neutral-900/95">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h2 className="text-sm font-medium text-white">Memories</h2>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Add new memory */}
            <div className="p-3 border-b border-white/10">
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a memory..."
                    className="w-full px-2 py-1.5 text-sm text-white bg-white/10 rounded resize-none focus:outline-none focus:ring-1 focus:ring-white/30 placeholder-white/50"
                    rows={2}
                />
                <div className="flex items-center gap-2 mt-2">
                    <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="px-2 py-1 text-xs text-white bg-white/10 rounded focus:outline-none"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-gray-900">
                                {cat}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAdd}
                        disabled={!newContent.trim()}
                        className="px-3 py-1 text-xs text-white bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:hover:bg-white/20 rounded transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Memory list */}
            <div className="flex-1 overflow-y-auto">
                {memories.length === 0 ? (
                    <div className="p-4 text-center text-white/60 text-sm">
                        No memories yet. Add facts or preferences that the AI should remember.
                    </div>
                ) : (
                    memories.map(mem => (
                        <div
                            key={mem.id}
                            className={`
                                p-3 border-b border-white/5
                                ${mem.is_active ? '' : 'opacity-50'}
                            `}
                        >
                            {editingId === mem.id ? (
                                <div>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full px-2 py-1 text-sm text-white bg-white/10 rounded resize-none focus:outline-none"
                                        rows={2}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => saveEdit(mem.id)}
                                            className="px-2 py-0.5 text-xs text-white bg-green-500/30 hover:bg-green-500/50 rounded"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-2 py-0.5 text-xs text-white bg-white/10 hover:bg-white/20 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start gap-2">
                                        <button
                                            onClick={() => onToggle(mem.id)}
                                            className={`
                                                mt-0.5 w-4 h-4 rounded border flex-shrink-0
                                                ${mem.is_active
                                                    ? 'bg-white/30 border-white/50'
                                                    : 'border-white/30'
                                                }
                                            `}
                                        >
                                            {mem.is_active && (
                                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white">{mem.content}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-1.5 py-0.5 text-[10px] rounded text-white ${categoryColor(mem.category)}`}>
                                                    {mem.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => startEdit(mem)}
                                                className="p-1 hover:bg-white/20 rounded"
                                                title="Edit"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onDelete(mem.id)}
                                                className="p-1 hover:bg-red-500/30 rounded"
                                                title="Delete"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
