const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

// Database imports
const { initDatabase, closeDatabase } = require('./database')
const conversations = require('./database/conversations')
const messages = require('./database/messages')
const memories = require('./database/memories')
const search = require('./database/search')

let mainWindow
let savedBounds = null // Store bounds before overwatch mode

// Config file path for storing opacity
const configPath = path.join(app.getPath('userData'), 'evo-config.json')

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('Failed to load config:', err)
  }
  return { opacity: 1 }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (err) {
    console.error('Failed to save config:', err)
  }
}

function createWindow() {
  const config = loadConfig()
  const opacity = config.opacity || 1

  // Windows has issues with fully transparent windows
  const isWindows = process.platform === 'win32'

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false, // Start hidden, show when ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Apply opacity after window loads
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Window finished loading')
    mainWindow.setOpacity(opacity)
    mainWindow.show()
  })

  // Fallback: show after timeout if did-finish-load doesn't fire
  setTimeout(() => {
    if (!mainWindow.isVisible()) {
      console.log('Fallback: showing window after timeout')
      mainWindow.show()
    }
  }, 3000)

  // Dev or prod URL
  if (app.isPackaged) {
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading:', indexPath)
    mainWindow.loadFile(indexPath)
  } else {
    mainWindow.loadURL('http://localhost:5173')
  }

  // Open DevTools only in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // Debug: open devtools in packaged app if needed
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer:', message)
  })
}

// Suppress GPU warning logs
app.commandLine.appendSwitch('log-level', '3')

app.whenReady().then(() => {
  initDatabase()
  createWindow()
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Screenshot handler
ipcMain.handle('take-screenshot', async () => {
  return new Promise((resolve, reject) => {
    // Hide window before screenshot
    mainWindow.hide()

    // Small delay for window to hide
    setTimeout(() => {
      // Handle ASAR unpacked path in production
      let pythonScript = path.join(__dirname, '../python/screenshot.py')
      if (app.isPackaged) {
        pythonScript = pythonScript.replace('app.asar', 'app.asar.unpacked')
      }
      // Windows uses 'python', Linux typically 'python3'
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
      const proc = spawn(pythonCmd, [pythonScript])

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        // Show window after screenshot
        mainWindow.show()

        if (code !== 0) {
          reject(new Error(stderr || `Python exited with code ${code}`))
          return
        }

        const imagePath = stdout.trim()
        if (!imagePath || !fs.existsSync(imagePath)) {
          reject(new Error('Screenshot path not returned'))
          return
        }

        // Read image as base64
        const imageBuffer = fs.readFileSync(imagePath)
        const base64 = imageBuffer.toString('base64')

        // Cleanup temp file
        fs.unlinkSync(imagePath)

        resolve(base64)
      })

      proc.on('error', (err) => {
        mainWindow.show()
        reject(err)
      })
    }, 200)
  })
})

// Window controls
ipcMain.on('minimize-window', () => {
  mainWindow.minimize()
})

ipcMain.on('close-window', () => {
  mainWindow.close()
})

// Set opacity - also saves to config
ipcMain.handle('set-opacity', (_, opacity) => {
  const config = loadConfig()
  config.opacity = opacity
  saveConfig(config)
  mainWindow.setOpacity(opacity)
})

// Get current opacity from config
ipcMain.handle('get-opacity', () => {
  const config = loadConfig()
  return config.opacity || 1
})

ipcMain.on('restart-app', () => {
  app.relaunch()
  app.exit(0)
})

// Ollama Cloud API - fetch models
ipcMain.handle('fetch-ollama-models', async (_, apiKey) => {
  try {
    const response = await fetch('https://ollama.com/api/tags', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = await response.json()
    return { success: true, models: data.models || [] }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Ollama Cloud API - streaming chat
ipcMain.handle('ollama-chat-stream', async (event, apiKey, body) => {
  try {
    // Enable streaming
    body.stream = true

    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(err)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          // Send chunk to renderer
          mainWindow.webContents.send('ollama-chunk', parsed)
        } catch {}
      }
    }

    // Signal completion
    mainWindow.webContents.send('ollama-done')
    return { success: true }
  } catch (err) {
    mainWindow.webContents.send('ollama-error', err.message)
    return { success: false, error: err.message }
  }
})

// ============ Database IPC Handlers ============

// Conversations
ipcMain.handle('db:conversation:create', (_, opts) => conversations.createConversation(opts))
ipcMain.handle('db:conversation:get', (_, id) => conversations.getConversation(id))
ipcMain.handle('db:conversation:list', (_, opts) => conversations.listConversations(opts))
ipcMain.handle('db:conversation:update', (_, id, updates) => conversations.updateConversation(id, updates))
ipcMain.handle('db:conversation:delete', (_, id) => conversations.deleteConversation(id))
ipcMain.handle('db:conversation:archive', (_, id, archived) => conversations.archiveConversation(id, archived))

// Messages
ipcMain.handle('db:message:create', (_, msg) => messages.createMessage(msg))
ipcMain.handle('db:message:list', (_, conversationId, opts) => messages.listMessages(conversationId, opts))
ipcMain.handle('db:message:delete', (_, id) => messages.deleteMessage(id))

// Memories
ipcMain.handle('db:memory:create', (_, mem) => memories.createMemory(mem))
ipcMain.handle('db:memory:get', (_, id) => memories.getMemory(id))
ipcMain.handle('db:memory:list', (_, opts) => memories.listMemories(opts))
ipcMain.handle('db:memory:update', (_, id, updates) => memories.updateMemory(id, updates))
ipcMain.handle('db:memory:delete', (_, id) => memories.deleteMemory(id))
ipcMain.handle('db:memory:toggle', (_, id) => memories.toggleMemory(id))
ipcMain.handle('db:memory:getActivePrompt', () => memories.getActiveMemoriesPrompt())

// Search
ipcMain.handle('db:search', (_, query, opts) => search.search(query, opts))

// ============ Overwatch Mode ============

ipcMain.handle('enter-overwatch', () => {
  // Save current bounds
  savedBounds = mainWindow.getBounds()

  // Get primary display
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth } = primaryDisplay.workAreaSize

  // Overwatch dimensions - wide for readability
  const overwatchWidth = 960
  const overwatchHeight = 80

  // Center at top
  const x = Math.round((screenWidth - overwatchWidth) / 2)
  const y = 16

  mainWindow.setBounds({ x, y, width: overwatchWidth, height: overwatchHeight }, true)
  mainWindow.setResizable(false)

  return { success: true }
})

ipcMain.handle('exit-overwatch', () => {
  // Restore saved bounds
  if (savedBounds) {
    mainWindow.setBounds(savedBounds, true)
    savedBounds = null
  } else {
    // Fallback
    mainWindow.setBounds({ width: 400, height: 600 }, true)
    mainWindow.center()
  }
  mainWindow.setResizable(true)

  return { success: true }
})

ipcMain.handle('expand-overwatch', (_, height) => {
  if (!savedBounds) return // Not in overwatch mode

  const primaryDisplay = screen.getPrimaryDisplay()
  const screenHeight = primaryDisplay.workAreaSize.height

  const bounds = mainWindow.getBounds()
  // Allow up to 80% of screen height
  const maxHeight = Math.floor(screenHeight * 0.8)
  const newHeight = Math.min(Math.max(70, height), maxHeight)
  mainWindow.setBounds({ ...bounds, height: newHeight }, true)

  return { success: true }
})

// Global shortcut for screenshot (registered when entering overwatch)
ipcMain.handle('register-screenshot-shortcut', () => {
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow.webContents.send('shortcut-screenshot')
  })
  return { success: true }
})

ipcMain.handle('unregister-screenshot-shortcut', () => {
  globalShortcut.unregister('CommandOrControl+Shift+S')
  return { success: true }
})
