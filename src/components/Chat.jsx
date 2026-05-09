import { useRef, useEffect, useState } from 'react'
import Message from './Message'

function ThinkingIndicator({ isCapture }) {
  const [elapsed, setElapsed] = useState(0)
  const [showSlow, setShowSlow] = useState(false)

  useEffect(() => {
    // Reset on mount
    setElapsed(0)
    setShowSlow(false)

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    // Show slow message after 10 seconds
    const timeout = setTimeout(() => {
      setShowSlow(true)
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  const dots = '.'.repeat((elapsed % 3) + 1)

  return (
    <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 self-start max-w-[90%]">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm">
          {isCapture ? 'Analyzing' : 'Thinking'}{dots}
        </span>
      </div>
      {showSlow && (
        <div className="text-xs text-white/30 mt-2">
          Taking longer than usual...
        </div>
      )}
    </div>
  )
}

function Chat({ messages, onCapture, onSend, isStreaming, isCapturing, customPrompt, setCustomPrompt }) {
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, [customPrompt])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
      e.preventDefault()
      if (customPrompt.trim()) {
        onSend()
      }
    }
  }

  // Check if last message is empty assistant (still streaming)
  const lastMsg = messages[messages.length - 1]
  const showThinking = isStreaming && (!lastMsg || lastMsg.role !== 'assistant' || lastMsg.content === '')

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 && !isStreaming && (
          <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/40 text-sm">
            Type a message or capture screen to start.
          </div>
        )}
        {messages.map((msg, i) => {
          // Skip empty assistant messages (we'll show thinking instead)
          if (msg.role === 'assistant' && msg.content === '' && isStreaming) {
            return null
          }
          return (
            <Message
              key={i}
              content={msg.content}
              role={msg.role}
              isStreaming={isStreaming && i === messages.length - 1}
            />
          )
        })}
        {showThinking && <ThinkingIndicator isCapture={isCapturing} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-white/[0.06] space-y-3">
        {/* Input row */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
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

        {/* Screenshot button */}
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
          {isStreaming ? 'Processing...' : 'Capture screen'}
        </button>
      </div>
    </div>
  )
}

export default Chat
