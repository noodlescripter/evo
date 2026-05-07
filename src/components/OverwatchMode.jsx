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
    maxHeight = 300,
    autoCollapseDelay = 8000
}) {
    const [expanded, setExpanded] = useState(false)
    const [showSkills, setShowSkills] = useState(false)
    const [pulseCapture, setPulseCapture] = useState(false)
    const collapseTimer = useRef(null)
    const contentRef = useRef(null)
    const scrollRef = useRef(null)

    const currentSkill = skills.find(s => s.id === currentSkillId)

    // Auto-expand when response comes in
    useEffect(() => {
        if (response && response.length > 0) {
            setExpanded(true)
            setShowSkills(false)

            // Reset collapse timer
            if (collapseTimer.current) clearTimeout(collapseTimer.current)
            collapseTimer.current = setTimeout(() => {
                if (!isStreaming) {
                    setExpanded(false)
                }
            }, autoCollapseDelay)
        }
    }, [response, isStreaming, autoCollapseDelay])

    // Expand window when showing skills
    useEffect(() => {
        if (showSkills && window.electronAPI?.overwatch) {
            window.electronAPI.overwatch.expand(250)
        } else if (!showSkills && !expanded && window.electronAPI?.overwatch) {
            window.electronAPI.overwatch.expand(70)
        }
    }, [showSkills, expanded])

    // Keep expanded while streaming
    useEffect(() => {
        if (isStreaming) {
            setExpanded(true)
            if (collapseTimer.current) clearTimeout(collapseTimer.current)
        }
    }, [isStreaming])

    // Auto-scroll as response streams
    useEffect(() => {
        if (scrollRef.current) {
            requestAnimationFrame(() => {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            })
        }
    }, [response])

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (collapseTimer.current) clearTimeout(collapseTimer.current)
        }
    }, [])

    // Pulse animation on capture
    const handleCapture = () => {
        setPulseCapture(true)
        setTimeout(() => setPulseCapture(false), 300)
        onCapture()
    }

    // Keyboard shortcut hint
    useEffect(() => {
        const handleKey = (e) => {
            // Ctrl+Shift+S for screenshot
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault()
                handleCapture()
            }
            // Escape to exit
            if (e.key === 'Escape') {
                onExit()
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onCapture, onExit])

    const getSkillIcon = (skillId) => {
        const icons = {
            'assistant': '💬', 'coder': '💻', 'explainer': '🧒', 'reviewer': '🔍',
            'debug': '🐛', 'writer': '✍️', 'translator': '🌐', 'tutor': '📚',
            'java-mcq': '☕', 'python-mcq': '🐍', 'sql-mcq': '🗃️',
            'javascript-mcq': '🟨', 'typescript-mcq': '🔷',
        }
        return icons[skillId] || '🤖'
    }

    return (
        <div className="flex flex-col items-center w-full h-full select-none">
            {/* Main orb/pill */}
            <div
                className={`
                    relative flex flex-col
                    bg-gradient-to-b from-neutral-800/95 to-neutral-900/95
                    border border-white/20 backdrop-blur-xl
                    transition-all duration-300 ease-out
                    ${expanded ? 'rounded-3xl w-full h-full' : 'rounded-full'}
                    ${pulseCapture ? 'scale-95' : 'scale-100'}
                `}
                style={{
                    boxShadow: `
                        0 0 20px rgba(99, 102, 241, 0.3),
                        0 0 40px rgba(99, 102, 241, 0.1),
                        inset 0 1px 0 rgba(255,255,255,0.1)
                    `
                }}
            >
                {/* Compact bar */}
                <div className="flex items-center gap-2 p-2 drag-region">
                    {/* Skill selector */}
                    <button
                        onClick={() => setShowSkills(!showSkills)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full
                            bg-white/10 hover:bg-white/20 transition-all
                            text-sm text-white no-drag
                            ${showSkills ? 'ring-2 ring-indigo-500/50' : ''}
                        `}
                    >
                        <span>{getSkillIcon(currentSkillId)}</span>
                        <span className="max-w-[80px] truncate">{currentSkill?.name || 'Select'}</span>
                        <svg className={`w-3 h-3 transition-transform ${showSkills ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Capture button */}
                    <button
                        onClick={handleCapture}
                        disabled={isStreaming}
                        className={`
                            relative p-2.5 rounded-full no-drag
                            bg-gradient-to-br from-indigo-500 to-purple-600
                            hover:from-indigo-400 hover:to-purple-500
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200
                            ${isStreaming ? 'animate-pulse' : ''}
                        `}
                        title="Capture (Ctrl+Shift+S)"
                    >
                        {isStreaming ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                                <circle cx="12" cy="13" r="3" strokeWidth={2} />
                            </svg>
                        )}

                        {/* Pulse ring on capture */}
                        {pulseCapture && (
                            <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                        )}
                    </button>

                    {/* Exit button */}
                    <button
                        onClick={onExit}
                        className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all no-drag"
                        title="Exit Overwatch (Esc)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Skills dropdown */}
                {showSkills && (
                    <div className="w-full px-3 pb-2 animate-fade-in">
                        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-black/40 max-h-40 overflow-y-auto">
                            {skills.map(skill => (
                                <button
                                    key={skill.id}
                                    onClick={() => { onSelectSkill(skill.id); setShowSkills(false); }}
                                    className={`
                                        flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs
                                        ${currentSkillId === skill.id
                                            ? 'bg-indigo-500/50 text-white ring-1 ring-indigo-400'
                                            : 'bg-white/10 text-white/80 hover:bg-white/20'}
                                    `}
                                >
                                    <span>{getSkillIcon(skill.id)}</span>
                                    <span>{skill.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Response area */}
                {expanded && response && (
                    <div className="flex-1 w-full px-3 pb-3 animate-fade-in flex flex-col min-h-0">
                        <div
                            ref={scrollRef}
                            className="flex-1 p-4 rounded-2xl bg-black/30 border border-white/10 overflow-y-auto [&>div]:max-w-none min-h-0"
                        >
                            <Message
                                content={response}
                                role="assistant"
                                isStreaming={isStreaming}
                            />
                        </div>

                        {/* Collapse hint */}
                        {!isStreaming && (
                            <div className="text-center mt-2 flex-shrink-0">
                                <button
                                    onClick={() => setExpanded(false)}
                                    className="text-[10px] text-white/40 hover:text-white/60"
                                >
                                    click to collapse
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Shortcut hint */}
            {!expanded && !showSkills && (
                <div className="mt-2 text-[10px] text-white/30 animate-fade-in">
                    Ctrl+Shift+S to capture • Esc to exit
                </div>
            )}
        </div>
    )
}
