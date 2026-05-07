const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  setOpacity: (opacity) => {
    // Use CSS opacity for Linux compatibility
    document.documentElement.style.opacity = opacity
    // Also save to config via IPC
    ipcRenderer.invoke('set-opacity', opacity)
  },
  getOpacity: () => ipcRenderer.invoke('get-opacity'),
  restartApp: () => ipcRenderer.send('restart-app'),
  fetchOllamaModels: (apiKey) => ipcRenderer.invoke('fetch-ollama-models', apiKey),
  ollamaChatStream: (apiKey, body) => ipcRenderer.invoke('ollama-chat-stream', apiKey, body),
  onOllamaChunk: (callback) => {
    ipcRenderer.on('ollama-chunk', (_, data) => callback(data))
  },
  onOllamaDone: (callback) => {
    ipcRenderer.on('ollama-done', () => callback())
  },
  onOllamaError: (callback) => {
    ipcRenderer.on('ollama-error', (_, error) => callback(error))
  },
  removeOllamaListeners: () => {
    ipcRenderer.removeAllListeners('ollama-chunk')
    ipcRenderer.removeAllListeners('ollama-done')
    ipcRenderer.removeAllListeners('ollama-error')
  },

  // Database API
  db: {
    // Conversations
    createConversation: (opts) => ipcRenderer.invoke('db:conversation:create', opts),
    getConversation: (id) => ipcRenderer.invoke('db:conversation:get', id),
    listConversations: (opts) => ipcRenderer.invoke('db:conversation:list', opts),
    updateConversation: (id, updates) => ipcRenderer.invoke('db:conversation:update', id, updates),
    deleteConversation: (id) => ipcRenderer.invoke('db:conversation:delete', id),
    archiveConversation: (id, archived) => ipcRenderer.invoke('db:conversation:archive', id, archived),

    // Messages
    createMessage: (msg) => ipcRenderer.invoke('db:message:create', msg),
    listMessages: (conversationId, opts) => ipcRenderer.invoke('db:message:list', conversationId, opts),
    deleteMessage: (id) => ipcRenderer.invoke('db:message:delete', id),

    // Memories
    createMemory: (mem) => ipcRenderer.invoke('db:memory:create', mem),
    getMemory: (id) => ipcRenderer.invoke('db:memory:get', id),
    listMemories: (opts) => ipcRenderer.invoke('db:memory:list', opts),
    updateMemory: (id, updates) => ipcRenderer.invoke('db:memory:update', id, updates),
    deleteMemory: (id) => ipcRenderer.invoke('db:memory:delete', id),
    toggleMemory: (id) => ipcRenderer.invoke('db:memory:toggle', id),
    getActiveMemoriesPrompt: () => ipcRenderer.invoke('db:memory:getActivePrompt'),

    // Search
    search: (query, opts) => ipcRenderer.invoke('db:search', query, opts)
  },

  // Overwatch Mode
  overwatch: {
    enter: () => ipcRenderer.invoke('enter-overwatch'),
    exit: () => ipcRenderer.invoke('exit-overwatch'),
    expand: (height) => ipcRenderer.invoke('expand-overwatch', height),
    registerShortcut: () => ipcRenderer.invoke('register-screenshot-shortcut'),
    unregisterShortcut: () => ipcRenderer.invoke('unregister-screenshot-shortcut'),
    onScreenshotShortcut: (callback) => {
      ipcRenderer.on('shortcut-screenshot', () => callback())
    },
    removeScreenshotListener: () => {
      ipcRenderer.removeAllListeners('shortcut-screenshot')
    }
  }
})
