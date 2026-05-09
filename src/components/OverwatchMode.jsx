import { useState, useEffect, useRef } from 'react'
import Message from './Message'

export default function OverwatchMode({
    skills,
    currentSkillId,
    onSelectSkill,
    onCapture,
    onExit,
    isStreaming,
    response,
    collapseDelay = 10000
}) {
    const [showSkills, setShowSkills] = useState(false)
    const scrollRef = useRef(null)

    const currentSkill = skills.find(s => s.id === currentSkillId)

    // Auto-scroll as response streams
    useEffect(() => {
        if (scrollRef.current) {
            requestAnimationFrame(() => {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            })
        }
    }, [response])

    // Expand/collapse window when showing skills
    useEffect(() => {
        if (window.electronAPI?.overwatch) {
            if (showSkills) {
                window.electronAPI.overwatch.expand(350)
            } else if (!response) {
                window.electronAPI.overwatch.expand(80)
            }
        }
    }, [showSkills, response])

    // Close skills and expand window when streaming starts
    const collapseTimerRef = useRef(null)
    useEffect(() => {
        if (isStreaming) {
            setShowSkills(false)
            if (collapseTimerRef.current) {
                clearTimeout(collapseTimerRef.current)
            }
            if (window.electronAPI?.overwatch) {
                window.electronAPI.overwatch.expand(550)
            }
        } else if (response) {
            collapseTimerRef.current = setTimeout(() => {
                if (window.electronAPI?.overwatch) {
                    window.electronAPI.overwatch.expand(80)
                }
            }, collapseDelay)
        }

        return () => {
            if (collapseTimerRef.current) {
                clearTimeout(collapseTimerRef.current)
            }
        }
    }, [isStreaming, response, collapseDelay])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault()
                onCapture()
            }
            if (e.key === 'Escape') {
                if (showSkills) {
                    setShowSkills(false)
                } else {
                    onExit()
                }
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onCapture, onExit, showSkills])

    const isCollapsed = !showSkills && !response

    return (
        <div className="h-full p-2">
        <div className={`flex flex-col h-full bg-gradient-to-b from-[#131316] to-[#0c0c0e] rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/50 ${isCollapsed ? 'justify-center' : ''}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-4 drag-region ${isCollapsed ? '' : 'py-3'}`}>
                <div className="flex items-center gap-3 no-drag">
                    {/* Skill selector */}
                    <button
                        onClick={() => setShowSkills(!showSkills)}
                        className={`
                            group flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-xl
                            text-[13px] transition-all duration-200
                            ${showSkills
                                ? 'bg-white/[0.12] text-white shadow-lg shadow-black/20'
                                : 'bg-white/[0.05] text-white/80 hover:bg-white/[0.1] hover:text-white'}
                        `}
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                        <span className="max-w-[160px] truncate font-medium">{currentSkill?.name || 'Select Mode'}</span>
                        <svg className={`w-4 h-4 opacity-40 transition-transform duration-200 ${showSkills ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center gap-2 no-drag">
                    {/* Capture button */}
                    <button
                        onClick={onCapture}
                        disabled={isStreaming}
                        className={`
                            flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold
                            transition-all duration-200
                            ${isStreaming
                                ? 'bg-white/10 text-white/70'
                                : 'bg-gradient-to-b from-white to-white/90 text-[#0c0c0e] shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]'}
                            disabled:cursor-not-allowed
                        `}
                    >
                        {isStreaming ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Analyzing</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                </svg>
                                <span>Capture</span>
                            </>
                        )}
                    </button>

                    {/* Exit button */}
                    <button
                        onClick={onExit}
                        className="p-2 rounded-xl text-white/30 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-200"
                        title="Exit (Esc)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Skills dropdown */}
            {showSkills && skills && skills.length > 0 && (
                <div className="mx-4 mb-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] max-h-56 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                            <button
                                key={skill.id}
                                onClick={() => { onSelectSkill(skill.id); setShowSkills(false); }}
                                className={`
                                    px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-150
                                    ${currentSkillId === skill.id
                                        ? 'bg-white text-[#0c0c0e] shadow-md'
                                        : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.1] hover:text-white'}
                                `}
                            >
                                {skill.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Response area - only render when not collapsed */}
            {!isCollapsed && (
                <div className="flex-1 overflow-hidden mx-4 mb-3">
                    {response ? (
                        <div
                            ref={scrollRef}
                            className="h-full p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-y-auto"
                        >
                            <Message
                                content={response}
                                role="assistant"
                                isStreaming={isStreaming}
                            />
                        </div>
                    ) : !showSkills && (
                        <div className="h-full flex items-center justify-center">
                            {isStreaming ? (
                                <div className="flex items-center gap-3 text-white/50">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full border-2 border-white/10" />
                                        <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-transparent border-t-white/60 animate-spin" />
                                    </div>
                                    <span className="text-sm font-medium">Analyzing screen...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-white/30">
                                    <div className="p-3 rounded-2xl bg-white/[0.03]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                            />
                                        </svg>
                                    </div>
                                    <span className="text-sm">Press Capture to analyze screen</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Footer - only show when expanded */}
            {(showSkills || response) && (
                <div className="px-4 py-2.5 flex items-center justify-center gap-6 text-[11px] text-white/25">
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded-lg bg-white/[0.04] text-white/40 font-medium tracking-wide">⌘⇧S</kbd>
                        <span>capture</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded-lg bg-white/[0.04] text-white/40 font-medium">ESC</kbd>
                        <span>exit</span>
                    </div>
                </div>
            )}
        </div>
        </div>
    )
}
