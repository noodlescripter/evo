import { useState } from 'react'

export default function NewChatSelector({
    skills,
    currentSkillId,
    onSelectSkill,
    onSend,
    onCapture,
    customPrompt,
    setCustomPrompt,
    isStreaming
}) {
    const [filter, setFilter] = useState('')

    const filteredSkills = skills.filter(s =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.prompt.toLowerCase().includes(filter.toLowerCase())
    )

    const getSkillIcon = (skill) => {
        // Map skill IDs to icons
        const icons = {
            'assistant': '💬',
            'coder': '💻',
            'explainer': '🧒',
            'reviewer': '🔍',
            'debug': '🐛',
            'writer': '✍️',
            'translator': '🌐',
            'tutor': '📚',
            'java-mcq': '☕',
            'python-mcq': '🐍',
            'sql-mcq': '🗃️',
            'javascript-mcq': '🟨',
            'typescript-mcq': '🔷',
        }
        return icons[skill.id] || (skill.custom ? '⭐' : '🤖')
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="text-center p-4 border-b border-white/10">
                <h2 className="text-lg font-medium text-white">New Chat</h2>
                <p className="text-sm text-white/50 mt-1">Select a skill</p>
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b border-white/10">
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full px-3 py-1.5 text-sm text-white bg-white/10 rounded
                               placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
            </div>

            {/* Skills grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-2">
                    {filteredSkills.map(skill => (
                        <button
                            key={skill.id}
                            onClick={() => onSelectSkill(skill.id)}
                            className={`
                                relative p-3 rounded-lg border text-left transition-all
                                ${currentSkillId === skill.id
                                    ? 'border-indigo-500 bg-indigo-500/20'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                }
                            `}
                        >
                            <div className="text-xl mb-1">{getSkillIcon(skill)}</div>
                            <div className="text-sm font-medium text-white truncate">{skill.name}</div>
                            <div className="text-xs text-white/50 mt-0.5 line-clamp-2">
                                {skill.prompt.slice(0, 60)}...
                            </div>
                            {skill.custom && (
                                <span className="absolute top-1 right-1 px-1 py-0.5 text-[9px] bg-indigo-500/30 rounded text-white/70">
                                    custom
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {filteredSkills.length === 0 && (
                    <div className="text-center text-white/50 py-8">
                        No skills match "{filter}"
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-white/10 space-y-2">
                <div className="flex gap-2 items-end">
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !isStreaming && customPrompt.trim()) {
                                e.preventDefault()
                                onSend()
                            }
                        }}
                        placeholder="Type a message..."
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 px-3 py-2 rounded border border-white/10 bg-black/30
                                   text-white text-sm placeholder-neutral-500 resize-none
                                   focus:outline-none focus:border-indigo-500/50
                                   disabled:opacity-50"
                    />
                    <button
                        onClick={onSend}
                        disabled={isStreaming || !customPrompt.trim()}
                        className="px-3 py-2 rounded border border-white/10 bg-neutral-800
                                   text-white text-sm shrink-0
                                   hover:bg-neutral-700 hover:border-white/20
                                   disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-colors"
                        title="Send message"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>

                <button
                    onClick={onCapture}
                    disabled={isStreaming}
                    className="w-full px-4 py-2 rounded border border-white/10 bg-neutral-800
                               text-white text-sm font-medium flex items-center justify-center gap-2
                               hover:bg-neutral-700 hover:border-white/20
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Capture Screen
                </button>
            </div>
        </div>
    )
}
