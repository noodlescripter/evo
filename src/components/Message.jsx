import { useMemo } from 'react'

function Message({ content, role, isStreaming }) {
  const formatted = useMemo(() => {
    if (!content) return null
    return parseContent(content)
  }, [content])

  const baseClass = `px-3 py-2 rounded-lg text-sm leading-relaxed break-words max-w-[90%]`
  const roleClass = role === 'user'
    ? 'bg-indigo-600/30 text-white self-end'
    : role === 'error'
    ? 'bg-red-500/30 text-red-300 self-center'
    : 'bg-white/10 text-neutral-200 self-start'

  return (
    <div className={`${baseClass} ${roleClass}`}>
      {formatted || (isStreaming ? '...' : '')}
    </div>
  )
}

function parseContent(text) {
  const parts = []
  let remaining = text
  let key = 0

  // Match code blocks: ```lang\ncode\n```
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g

  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index)
      parts.push(<TextBlock key={key++} text={before} />)
    }

    // Code block
    const lang = match[1] || 'text'
    const code = match[2].trim()
    parts.push(<CodeBlock key={key++} code={code} lang={lang} />)

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(<TextBlock key={key++} text={text.slice(lastIndex)} />)
  }

  return parts.length > 0 ? parts : text
}

function TextBlock({ text }) {
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/)

  return (
    <div className="space-y-2">
      {paragraphs.map((para, i) => (
        <Paragraph key={i} text={para} />
      ))}
    </div>
  )
}

function Paragraph({ text }) {
  // Check if it's a list
  const lines = text.split('\n')
  const isListBlock = lines.every(line =>
    line.trim() === '' ||
    line.trim().startsWith('- ') ||
    line.trim().startsWith('* ') ||
    /^\d+\.\s/.test(line.trim())
  )

  if (isListBlock) {
    const items = lines.filter(line => line.trim() !== '')
    return (
      <ul className="list-disc list-inside space-y-1 ml-2">
        {items.map((item, i) => {
          const content = item.replace(/^[\s]*[-*]\s*/, '').replace(/^\d+\.\s*/, '')
          return (
            <li key={i}>
              <InlineText text={content} />
            </li>
          )
        })}
      </ul>
    )
  }

  // Check if it's a header
  const headerMatch = text.match(/^(#{1,3})\s+(.+)$/)
  if (headerMatch) {
    const level = headerMatch[1].length
    const content = headerMatch[2]
    const className = level === 1
      ? 'text-base font-bold'
      : level === 2
      ? 'text-sm font-semibold'
      : 'text-sm font-medium'
    return (
      <div className={className}>
        <InlineText text={content} />
      </div>
    )
  }

  // Regular paragraph - handle line breaks
  return (
    <p>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          <InlineText text={line} />
        </span>
      ))}
    </p>
  )
}

function InlineText({ text }) {
  // Handle inline formatting: **bold**, `code`, *italic*
  const parts = []
  let remaining = text
  let key = 0

  // Combined regex for inline elements
  const inlineRegex = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\*[^*]+\*)/g
  let lastIndex = 0
  let match

  while ((match = inlineRegex.exec(text)) !== null) {
    // Plain text before match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
    }

    const matched = match[0]
    if (matched.startsWith('**') && matched.endsWith('**')) {
      // Bold
      parts.push(<strong key={key++}>{matched.slice(2, -2)}</strong>)
    } else if (matched.startsWith('`') && matched.endsWith('`')) {
      // Inline code
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-xs">
          {matched.slice(1, -1)}
        </code>
      )
    } else if (matched.startsWith('*') && matched.endsWith('*')) {
      // Italic
      parts.push(<em key={key++}>{matched.slice(1, -1)}</em>)
    }

    lastIndex = match.index + matched.length
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? <>{parts}</> : <>{text}</>
}

function CodeBlock({ code, lang }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="my-2 rounded overflow-hidden bg-black/50 border border-white/10">
      <div className="flex items-center justify-between px-3 py-1 bg-white/5 border-b border-white/10">
        <span className="text-xs text-neutral-500">{lang}</span>
        <button
          onClick={copyToClipboard}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-xs font-mono text-green-400 whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  )
}

export default Message
