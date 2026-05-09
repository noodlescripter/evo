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
        const iconClass = "w-5 h-5 text-white/60"
        const icons = {
            'assistant': (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            'coder': (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ),
            'explainer': (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            'reviewer': (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            'debug': (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            'writer': (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            'translator': (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
            ),
            'tutor': (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
        }

        const defaultIcon = skill.custom ? (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ) : (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        )

        return icons[skill.id] || defaultIcon
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06]">
                <h2 className="text-base font-medium text-white/90">New conversation</h2>
                <p className="text-sm text-white/40 mt-0.5">Choose a mode to get started</p>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full px-4 py-2 text-sm text-white bg-white/[0.04] rounded-xl
                               border border-white/[0.06]
                               placeholder-white/30 focus:outline-none focus:bg-white/[0.06]
                               focus:border-white/[0.12] focus:ring-2 focus:ring-white/[0.04]
                               transition-all duration-200"
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
                                group relative p-4 rounded-xl text-left transition-all duration-200
                                ${currentSkillId === skill.id
                                    ? 'bg-white/[0.08] border border-white/[0.15] ring-1 ring-white/[0.05]'
                                    : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
                                }
                                active:scale-[0.98]
                            `}
                        >
                            <div className={`mb-3 p-2 rounded-lg w-fit ${currentSkillId === skill.id ? 'bg-white/[0.1]' : 'bg-white/[0.04] group-hover:bg-white/[0.08]'} transition-colors`}>
                                {getSkillIcon(skill)}
                            </div>
                            <div className="text-[13px] font-medium text-white/90 truncate">{skill.name}</div>
                            <div className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">
                                {skill.prompt.slice(0, 50)}...
                            </div>
                            {skill.custom && (
                                <span className="absolute top-3 right-3 px-1.5 py-0.5 text-[10px] font-medium bg-white/[0.06] rounded text-white/50">
                                    Custom
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
            <div className="p-4 border-t border-white/[0.06] space-y-3">
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
                        className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]
                                   text-white text-sm placeholder-white/30 resize-none
                                   focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.15]
                                   disabled:opacity-50 transition-all duration-150"
                    />
                    <button
                        onClick={onSend}
                        disabled={isStreaming || !customPrompt.trim()}
                        className="p-2.5 rounded-lg bg-white/90 text-neutral-900 shrink-0
                                   hover:bg-white active:scale-95
                                   disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-all duration-150"
                        title="Send message"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <button
                    onClick={onCapture}
                    disabled={isStreaming}
                    className="w-full px-4 py-2 rounded-lg
                               bg-white/[0.04] border border-white/[0.08]
                               text-white/70 text-sm font-medium flex items-center justify-center gap-2
                               hover:bg-white/[0.08] hover:text-white/90
                               active:scale-[0.99]
                               disabled:opacity-40 disabled:cursor-not-allowed
                               transition-all duration-150"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Capture screen
                </button>
            </div>
        </div>
    )
}
