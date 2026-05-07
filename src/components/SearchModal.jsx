import { useState, useEffect, useRef } from 'react'

export default function SearchModal({ onClose, onSelectConversation }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState({ messages: [], memories: [] })
    const [searching, setSearching] = useState(false)
    const [activeTab, setActiveTab] = useState('all')
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    useEffect(() => {
        if (!query.trim()) {
            setResults({ messages: [], memories: [] })
            return
        }

        const timeout = setTimeout(async () => {
            setSearching(true)
            try {
                const type = activeTab === 'all' ? 'all' : activeTab
                const res = await window.electronAPI.db.search(query, { type })
                setResults(res)
            } catch (err) {
                console.error('Search error:', err)
            }
            setSearching(false)
        }, 300)

        return () => clearTimeout(timeout)
    }, [query, activeTab])

    const highlightMatch = (text) => {
        return text.replace(/\*\*(.*?)\*\*/g, '<mark class="bg-yellow-500/50 text-white">$1</mark>')
    }

    const handleMessageClick = (msg) => {
        onSelectConversation(msg.conversation_id)
        onClose()
    }

    const totalResults = results.messages.length + results.memories.length

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-start justify-center pt-16 z-50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-gray-900/95 rounded-lg shadow-xl border border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="p-3 border-b border-white/10">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search messages and memories..."
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                        />
                        {searching && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-3 py-2 border-b border-white/10">
                    {['all', 'messages', 'memories'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-3 py-1 text-xs rounded transition-colors
                                ${activeTab === tab ? 'bg-white/20' : 'hover:bg-white/10'}
                            `}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                    {!query.trim() ? (
                        <div className="p-4 text-center text-white/40 text-sm">
                            Type to search
                        </div>
                    ) : totalResults === 0 && !searching ? (
                        <div className="p-4 text-center text-white/40 text-sm">
                            No results found
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            {(activeTab === 'all' || activeTab === 'messages') && results.messages.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-xs text-white/50 bg-white/5">
                                        Messages ({results.messages.length})
                                    </div>
                                    {results.messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            onClick={() => handleMessageClick(msg)}
                                            className="px-3 py-2 hover:bg-white/10 cursor-pointer border-b border-white/5"
                                        >
                                            <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                                                <span className={msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}>
                                                    {msg.role}
                                                </span>
                                                <span>in</span>
                                                <span className="truncate">{msg.conversation_title}</span>
                                            </div>
                                            <div
                                                className="text-sm text-white/80 line-clamp-2"
                                                dangerouslySetInnerHTML={{ __html: highlightMatch(msg.snippet || msg.content) }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Memories */}
                            {(activeTab === 'all' || activeTab === 'memories') && results.memories.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-xs text-white/50 bg-white/5">
                                        Memories ({results.memories.length})
                                    </div>
                                    {results.memories.map(mem => (
                                        <div
                                            key={mem.id}
                                            className="px-3 py-2 border-b border-white/5"
                                        >
                                            <div className="flex items-center gap-2 text-xs mb-1">
                                                <span className={`px-1.5 py-0.5 rounded ${
                                                    mem.category === 'preference' ? 'bg-blue-500/30' :
                                                    mem.category === 'fact' ? 'bg-green-500/30' :
                                                    mem.category === 'instruction' ? 'bg-yellow-500/30' :
                                                    'bg-white/20'
                                                }`}>
                                                    {mem.category}
                                                </span>
                                                {!mem.is_active && (
                                                    <span className="text-white/40">(inactive)</span>
                                                )}
                                            </div>
                                            <div
                                                className="text-sm text-white/80"
                                                dangerouslySetInnerHTML={{ __html: highlightMatch(mem.snippet || mem.content) }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 text-xs text-white/40 border-t border-white/10">
                    Press <kbd className="px-1 py-0.5 bg-white/10 rounded">Esc</kbd> to close
                </div>
            </div>
        </div>
    )
}
