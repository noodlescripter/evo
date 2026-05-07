import { useState } from 'react'

export default function ConversationList({
    conversations,
    currentId,
    onSelect,
    onDelete,
    onNew
}) {
    const [confirmDelete, setConfirmDelete] = useState(null)

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now - date

        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        if (diff < 604800000) {
            return date.toLocaleDateString([], { weekday: 'short' })
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    const handleDelete = (e, id) => {
        e.stopPropagation()
        if (confirmDelete === id) {
            onDelete(id)
            setConfirmDelete(null)
        } else {
            setConfirmDelete(id)
            setTimeout(() => setConfirmDelete(null), 3000)
        }
    }

    return (
        <div className="flex flex-col h-full bg-neutral-900/95">
            <div className="p-2 border-b border-white/10">
                <button
                    onClick={onNew}
                    className="w-full px-3 py-2 text-sm text-white bg-white/10 hover:bg-white/20 rounded transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-white/60 text-sm">
                        No conversations yet
                    </div>
                ) : (
                    conversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`
                                group px-3 py-2 cursor-pointer border-b border-white/5
                                hover:bg-white/10 transition-colors
                                ${currentId === conv.id ? 'bg-white/15' : ''}
                            `}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm truncate text-white">
                                        {conv.title}
                                    </div>
                                    <div className="text-xs text-white/60 mt-0.5">
                                        {formatDate(conv.updated_at)}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, conv.id)}
                                    className={`
                                        p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                                        ${confirmDelete === conv.id
                                            ? 'bg-red-500/50 opacity-100'
                                            : 'hover:bg-white/20'
                                        }
                                    `}
                                    title={confirmDelete === conv.id ? 'Click again to delete' : 'Delete'}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
