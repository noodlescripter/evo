import { useState, useEffect, useCallback } from 'react'
import TitleBar from './components/TitleBar'
import Chat from './components/Chat'
import Settings from './components/Settings'
import Footer from './components/Footer'
import ConversationList from './components/ConversationList'
import MemoryPanel from './components/MemoryPanel'
import SearchModal from './components/SearchModal'
import { useConversations } from './hooks/useConversations'
import { useMemories } from './hooks/useMemories'
import NewChatSelector from './components/NewChatSelector'
import OverwatchMode from './components/OverwatchMode'
import { getAllSkills, getSkillById } from './data/skills'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMemories, setShowMemories] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [tokens, setTokens] = useState({ input: 0, output: 0 })
  const [overwatchMode, setOverwatchMode] = useState(false)
  const [overwatchResponse, setOverwatchResponse] = useState('')

  const {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    updateConversation,
    deleteConversation,
    newConversation
  } = useConversations()

  const {
    memories,
    createMemory,
    updateMemory,
    deleteMemory,
    toggleMemory,
    getActivePrompt
  } = useMemories()
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('overlay-settings')
    return saved ? JSON.parse(saved) : {
      apiKey: '',
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      ollamaUrl: 'http://localhost:11434',
      opacity: 1,
      skill: 'assistant',
      systemPrompt: 'You are a helpful assistant. Be concise and helpful.',
      overwatchCollapseDelay: 10
    }
  })

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('overlay-settings', JSON.stringify(settings))
  }, [settings])

  // Sync opacity from main process config on mount
  useEffect(() => {
    if (window.electronAPI?.getOpacity) {
      window.electronAPI.getOpacity().then(opacity => {
        // Apply CSS opacity
        document.documentElement.style.opacity = opacity
        if (opacity !== settings.opacity) {
          setSettings(prev => ({ ...prev, opacity }))
        }
      })
    }
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      window.electronAPI.db.listMessages(currentConversation.id).then(msgs => {
        setMessages(msgs.map(m => ({ role: m.role, content: m.content, id: m.id })))
        setTokens({ input: 0, output: 0 })
      })
    } else {
      setMessages([])
      setTokens({ input: 0, output: 0 })
    }
  }, [currentConversation])

  // Get system prompt with memory injection
  const getSystemPromptWithMemories = useCallback(async () => {
    const memoryPrompt = await getActivePrompt()
    return memoryPrompt ? settings.systemPrompt + memoryPrompt : settings.systemPrompt
  }, [settings.systemPrompt, getActivePrompt])

  // Save message to DB
  const saveMessage = useCallback(async (conversationId, role, content, hasImage = false) => {
    return window.electronAPI.db.createMessage({
      conversation_id: conversationId,
      role,
      content,
      has_image: hasImage
    })
  }, [])

  // Ensure conversation exists before sending
  const ensureConversation = useCallback(async (firstMessage) => {
    if (currentConversation) return currentConversation

    // Create new conversation with title from first message
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
    const conv = await createConversation({
      title,
      model: settings.model,
      provider: settings.provider
    })
    return conv
  }, [currentConversation, createConversation, settings.model, settings.provider])

  // Send text message (no screenshot)
  const handleSend = async () => {
    const prompt = customPrompt.trim()
    if (!prompt) return

    try {
      const conv = await ensureConversation(prompt)
      await saveMessage(conv.id, 'user', prompt)

      setMessages(prev => [...prev, { role: 'user', content: prompt }])
      setIsStreaming(true)
      setIsCapturing(false)
      setCustomPrompt('')

      const response = await streamApiCall(null, prompt)
      if (response) {
        await saveMessage(conv.id, 'assistant', response)
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: err.message }])
    } finally {
      setIsStreaming(false)
    }
  }

  // Capture screenshot and send
  const handleCapture = async () => {
    if (!window.electronAPI) {
      setMessages(prev => [...prev, { role: 'error', content: 'Electron API not available' }])
      return
    }

    const prompt = customPrompt.trim() || 'Describe what you see in this screenshot.'
    const userContent = `[Screenshot] ${prompt}`

    try {
      const conv = await ensureConversation(prompt)
      await saveMessage(conv.id, 'user', userContent, true)

      setMessages(prev => [...prev, { role: 'user', content: userContent }])
      setIsStreaming(true)
      setIsCapturing(true)
      setCustomPrompt('')

      const base64Image = await window.electronAPI.takeScreenshot()
      const response = await streamApiCall(base64Image, prompt)
      if (response) {
        await saveMessage(conv.id, 'assistant', response)
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: err.message }])
    } finally {
      setIsCapturing(false)
      setIsStreaming(false)
    }
  }

  const streamApiCall = async (base64Image, prompt) => {
    let response = ''
    if (settings.provider === 'anthropic') {
      response = await streamAnthropic(base64Image, prompt)
    } else if (settings.provider === 'ollama-cloud') {
      response = await streamOllamaCloud(base64Image, prompt)
    } else {
      response = await streamOllama(base64Image, prompt)
    }
    return response
  }

  const streamAnthropic = async (base64Image, prompt) => {
    // Build message content
    const content = []
    if (base64Image) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64Image
        }
      })
    }
    content.push({ type: 'text', text: prompt })

    const systemPrompt = await getSystemPromptWithMemories()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`API error: ${err}`)
    }

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)

            // Track input tokens from message_start
            if (parsed.type === 'message_start' && parsed.message?.usage) {
              setTokens(prev => ({
                ...prev,
                input: prev.input + (parsed.message.usage.input_tokens || 0)
              }))
            }

            // Track output tokens from message_delta
            if (parsed.type === 'message_delta' && parsed.usage) {
              setTokens(prev => ({
                ...prev,
                output: prev.output + (parsed.usage.output_tokens || 0)
              }))
            }

            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullResponse += parsed.delta.text
              setMessages(prev => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: updated[lastIdx].content + parsed.delta.text
                  }
                }
                return updated
              })
            }
          } catch {}
        }
      }
    }
    return fullResponse
  }

  const streamOllama = async (base64Image, prompt) => {
    const systemPrompt = await getSystemPromptWithMemories()
    const body = {
      model: settings.model,
      system: systemPrompt,
      prompt: prompt,
      stream: true
    }
    if (base64Image) {
      body.images = [base64Image]
    }

    const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`)
    }

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          if (parsed.response) {
            fullResponse += parsed.response
            setMessages(prev => {
              const updated = [...prev]
              const lastIdx = updated.length - 1
              if (updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: updated[lastIdx].content + parsed.response
                }
              }
              return updated
            })
          }
          // Ollama returns token counts in final response
          if (parsed.done && parsed.prompt_eval_count !== undefined) {
            setTokens(prev => ({
              input: prev.input + (parsed.prompt_eval_count || 0),
              output: prev.output + (parsed.eval_count || 0)
            }))
          }
        } catch {}
      }
    }
    return fullResponse
  }

  const streamOllamaCloud = async (base64Image, prompt) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }

    const systemPrompt = await getSystemPromptWithMemories()

    // Build message content for chat API
    const userMessage = {
      role: 'user',
      content: prompt
    }
    if (base64Image) {
      userMessage.images = [base64Image]
    }

    const body = {
      model: settings.model,
      messages: [userMessage]
    }
    if (systemPrompt) {
      body.system = systemPrompt
    }

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    return new Promise((resolve, reject) => {
      let fullResponse = ''

      // Clean up previous listeners
      window.electronAPI.removeOllamaListeners()

      // Handle streaming chunks
      window.electronAPI.onOllamaChunk((data) => {
        if (data.message?.content) {
          fullResponse += data.message.content
          setMessages(prev => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            if (updated[lastIdx]?.role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + data.message.content
              }
            }
            return updated
          })
        }

        // Token counts on completion
        if (data.done && data.prompt_eval_count !== undefined) {
          setTokens(prev => ({
            input: prev.input + (data.prompt_eval_count || 0),
            output: prev.output + (data.eval_count || 0)
          }))
        }
      })

      // Handle completion
      window.electronAPI.onOllamaDone(() => {
        window.electronAPI.removeOllamaListeners()
        resolve(fullResponse)
      })

      // Handle error
      window.electronAPI.onOllamaError((error) => {
        window.electronAPI.removeOllamaListeners()
        reject(new Error(`Ollama Cloud error: ${error}`))
      })

      // Start streaming
      window.electronAPI.ollamaChatStream(settings.ollamaApiKey, body)
    })
  }

  const clearChat = () => {
    newConversation()
  }

  const handleSelectConversation = async (id) => {
    await selectConversation(id)
    setShowHistory(false)
  }

  const handleSelectSkill = (skillId) => {
    const skill = getSkillById(skillId, settings.customSkills || [])
    if (skill) {
      setSettings(prev => ({ ...prev, skill: skillId, systemPrompt: skill.prompt }))
    }
  }

  // Get all available skills
  const allSkills = getAllSkills(settings.customSkills || [])

  // Overwatch mode handlers
  const enterOverwatch = async () => {
    if (window.electronAPI?.overwatch) {
      await window.electronAPI.overwatch.enter()
      await window.electronAPI.overwatch.registerShortcut()

      // Listen for global shortcut
      window.electronAPI.overwatch.onScreenshotShortcut(() => {
        handleOverwatchCapture()
      })

      setOverwatchMode(true)
      setOverwatchResponse('')
    }
  }

  const exitOverwatch = async () => {
    if (window.electronAPI?.overwatch) {
      window.electronAPI.overwatch.removeScreenshotListener()
      await window.electronAPI.overwatch.unregisterShortcut()
      await window.electronAPI.overwatch.exit()
      setOverwatchMode(false)
      setOverwatchResponse('')
    }
  }

  const handleOverwatchCapture = async () => {
    if (!window.electronAPI || isStreaming) return

    try {
      setIsStreaming(true)
      setOverwatchResponse('')

      const base64Image = await window.electronAPI.takeScreenshot()

      // Expand window for response (80% of typical screen)
      window.electronAPI.overwatch.expand(900)

      // Stream directly to overwatch response
      await streamOverwatch(base64Image)
    } catch (err) {
      console.error('Overwatch capture error:', err)
      setOverwatchResponse(`Error: ${err.message}`)
    } finally {
      setIsStreaming(false)
    }
  }

  // Dedicated streaming for overwatch mode (no message history)
  const streamOverwatch = async (base64Image) => {
    const systemPrompt = await getSystemPromptWithMemories()
    const prompt = 'Analyze this screenshot and provide helpful information.'

    console.log('Overwatch streaming with provider:', settings.provider)

    if (settings.provider === 'anthropic') {
      const content = [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64Image } },
        { type: 'text', text: prompt }
      ]

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: 1024,
          stream: true,
          system: systemPrompt,
          messages: [{ role: 'user', content }]
        })
      })

      if (!response.ok) throw new Error(`API error: ${await response.text()}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                setOverwatchResponse(prev => prev + parsed.delta.text)
              }
            } catch {}
          }
        }
      }
    } else if (settings.provider === 'ollama-cloud') {
      // Ollama Cloud - use IPC for auth
      const body = {
        model: settings.model,
        messages: [{ role: 'user', content: prompt, images: [base64Image] }],
        system: systemPrompt
      }

      return new Promise((resolve, reject) => {
        window.electronAPI.removeOllamaListeners()

        window.electronAPI.onOllamaChunk((data) => {
          if (data.message?.content) {
            setOverwatchResponse(prev => prev + data.message.content)
          }
        })

        window.electronAPI.onOllamaDone(() => {
          window.electronAPI.removeOllamaListeners()
          resolve()
        })

        window.electronAPI.onOllamaError((error) => {
          window.electronAPI.removeOllamaListeners()
          reject(new Error(error))
        })

        window.electronAPI.ollamaChatStream(settings.ollamaApiKey, body)
      })
    } else {
      // Ollama Local
      const body = {
        model: settings.model,
        system: systemPrompt,
        prompt,
        images: [base64Image],
        stream: true
      }

      const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            if (parsed.response) {
              setOverwatchResponse(prev => prev + parsed.response)
            }
          } catch {}
        }
      }
    }
  }

  // Show skill selector for new chats without messages
  const showNewChatSelector = !currentConversation && messages.length === 0 && !showSettings

  // Render Overwatch mode
  if (overwatchMode) {
    return (
      <div className="h-screen w-full p-1 overflow-hidden">
        <OverwatchMode
          skills={allSkills}
          currentSkillId={settings.skill || 'assistant'}
          onSelectSkill={handleSelectSkill}
          onCapture={handleOverwatchCapture}
          onExit={exitOverwatch}
          isStreaming={isStreaming}
          response={overwatchResponse}
          autoCollapseDelay={(settings.overwatchCollapseDelay || 10) * 1000}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen m-1 bg-neutral-900/95 rounded-xl border border-white/10 overflow-hidden">
      {/* History sidebar */}
      {showHistory && (
        <div className="w-48 border-r border-white/10 flex-shrink-0">
          <ConversationList
            conversations={conversations}
            currentId={currentConversation?.id}
            onSelect={handleSelectConversation}
            onDelete={deleteConversation}
            onNew={() => { newConversation(); setShowHistory(false); }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TitleBar
          onSettings={() => setShowSettings(!showSettings)}
          showSettings={showSettings}
          onClear={clearChat}
          onToggleHistory={() => setShowHistory(!showHistory)}
          showHistory={showHistory}
          onSearch={() => setShowSearch(true)}
          onToggleMemories={() => setShowMemories(!showMemories)}
          showMemories={showMemories}
          onEnterOverwatch={enterOverwatch}
        />

        {showSettings ? (
          <Settings settings={settings} setSettings={setSettings} />
        ) : showNewChatSelector ? (
          <NewChatSelector
            skills={allSkills}
            currentSkillId={settings.skill || 'assistant'}
            onSelectSkill={handleSelectSkill}
            onSend={handleSend}
            onCapture={handleCapture}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            isStreaming={isStreaming}
          />
        ) : (
          <Chat
            messages={messages}
            onCapture={handleCapture}
            onSend={handleSend}
            isStreaming={isStreaming}
            isCapturing={isCapturing}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
          />
        )}

        <Footer tokens={tokens} />
      </div>

      {/* Memory panel */}
      {showMemories && (
        <div className="w-56 border-l border-white/10 flex-shrink-0">
          <MemoryPanel
            memories={memories}
            onAdd={createMemory}
            onUpdate={updateMemory}
            onDelete={deleteMemory}
            onToggle={toggleMemory}
            onClose={() => setShowMemories(false)}
          />
        </div>
      )}

      {/* Search modal */}
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onSelectConversation={handleSelectConversation}
        />
      )}
    </div>
  )
}

export default App
