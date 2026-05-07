import { useState, useEffect } from 'react'
import { DEFAULT_SKILLS, getAllSkills } from '../data/skills'

function Settings({ settings, setSettings }) {
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillPrompt, setNewSkillPrompt] = useState('')
  const [cloudModels, setCloudModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelError, setModelError] = useState('')

  // Fetch Ollama Cloud models when API key is set
  useEffect(() => {
    if (settings.provider === 'ollama-cloud' && settings.ollamaApiKey) {
      fetchCloudModels()
    }
  }, [settings.provider, settings.ollamaApiKey])

  const fetchCloudModels = async () => {
    if (!window.electronAPI) {
      setModelError('Electron API not available')
      return
    }
    setLoadingModels(true)
    setModelError('')
    try {
      const result = await window.electronAPI.fetchOllamaModels(settings.ollamaApiKey)
      if (result.success) {
        setCloudModels(result.models)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      setModelError(err.message)
      setCloudModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  // Get custom skills from settings
  const customSkills = settings.customSkills || []
  const allSkills = getAllSkills(customSkills)

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSkillChange = (skillId) => {
    const skill = allSkills.find(s => s.id === skillId)
    if (skill) {
      update('systemPrompt', skill.prompt)
      update('skill', skillId)
    }
  }

  const handleAddSkill = () => {
    if (!newSkillName.trim() || !newSkillPrompt.trim()) return

    const newSkill = {
      id: `custom_${Date.now()}`,
      name: newSkillName.trim(),
      prompt: newSkillPrompt.trim(),
      custom: true
    }

    const updatedSkills = [...customSkills, newSkill]
    update('customSkills', updatedSkills)
    update('skill', newSkill.id)
    update('systemPrompt', newSkill.prompt)

    setNewSkillName('')
    setNewSkillPrompt('')
    setShowAddSkill(false)
  }

  const handleDeleteSkill = (skillId) => {
    const updatedSkills = customSkills.filter(s => s.id !== skillId)
    update('customSkills', updatedSkills)
    if (settings.skill === skillId) {
      update('skill', 'assistant')
      update('systemPrompt', DEFAULT_SKILLS[0].prompt)
    }
  }

  const handleSave = () => {
    if (window.electronAPI) {
      window.electronAPI.restartApp()
    }
  }

  const inputClass = `w-full px-3 py-2 rounded border border-white/10 bg-black/30
                      text-white text-sm focus:outline-none focus:border-indigo-500/50`

  const labelClass = "block text-xs text-neutral-400 mb-1.5"

  const currentSkill = allSkills.find(s => s.id === settings.skill)
  const isCustomSkill = currentSkill?.custom

  return (
    <div className="flex-1 p-4 overflow-y-auto flex flex-col min-h-0">
      <h2 className="text-base font-medium text-white mb-4">Settings</h2>

      <div className="space-y-4 flex-1">
        <div>
          <label className={labelClass}>Provider</label>
          <select
            value={settings.provider}
            onChange={(e) => update('provider', e.target.value)}
            className={inputClass}
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="ollama-cloud">Ollama (Cloud)</option>
          </select>
        </div>

        {/* Anthropic */}
        {settings.provider === 'anthropic' && (
          <>
            <div>
              <label className={labelClass}>API Key</label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="sk-ant-..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Model</label>
              <select
                value={settings.model}
                onChange={(e) => update('model', e.target.value)}
                className={inputClass}
              >
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                <option value="claude-opus-4-20250514">Claude Opus 4</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
              </select>
            </div>
          </>
        )}

        {/* Ollama Local */}
        {settings.provider === 'ollama' && (
          <>
            <div>
              <label className={labelClass}>Ollama URL</label>
              <input
                type="text"
                value={settings.ollamaUrl}
                onChange={(e) => update('ollamaUrl', e.target.value)}
                placeholder="http://localhost:11434"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Model</label>
              <select
                value={settings.model}
                onChange={(e) => update('model', e.target.value)}
                className={inputClass}
              >
                <optgroup label="Qwen Vision">
                  <option value="qwen2.5-vl:72b">Qwen2.5 VL 72B</option>
                  <option value="qwen2.5-vl:32b">Qwen2.5 VL 32B</option>
                  <option value="qwen2.5-vl:7b">Qwen2.5 VL 7B</option>
                </optgroup>
                <optgroup label="LLaVA">
                  <option value="llava:34b">LLaVA 34B</option>
                  <option value="llava:13b">LLaVA 13B</option>
                  <option value="llava:7b">LLaVA 7B</option>
                </optgroup>
                <optgroup label="Other Vision">
                  <option value="llama3.2-vision:90b">Llama 3.2 Vision 90B</option>
                  <option value="llama3.2-vision:11b">Llama 3.2 Vision 11B</option>
                  <option value="minicpm-v:8b">MiniCPM-V 8B</option>
                  <option value="moondream:1.8b">Moondream 1.8B</option>
                </optgroup>
              </select>
              <input
                type="text"
                value={settings.model}
                onChange={(e) => update('model', e.target.value)}
                placeholder="Or type custom model..."
                className={`${inputClass} mt-2`}
              />
            </div>
          </>
        )}

        {/* Ollama Cloud */}
        {settings.provider === 'ollama-cloud' && (
          <>
            <div>
              <label className={labelClass}>API Key</label>
              <input
                type="password"
                value={settings.ollamaApiKey || ''}
                onChange={(e) => update('ollamaApiKey', e.target.value)}
                placeholder="Ollama API key..."
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-neutral-400">Model</label>
                {settings.ollamaApiKey && (
                  <button
                    onClick={fetchCloudModels}
                    disabled={loadingModels}
                    className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                  >
                    {loadingModels ? 'Loading...' : 'Refresh'}
                  </button>
                )}
              </div>

              {modelError && (
                <div className="text-xs text-red-400 mb-2">{modelError}</div>
              )}

              {!settings.ollamaApiKey ? (
                <div className="text-xs text-neutral-500 p-2 border border-white/10 rounded bg-black/20">
                  Enter API key to load models
                </div>
              ) : loadingModels ? (
                <div className="text-xs text-neutral-400 p-2 border border-white/10 rounded bg-black/20">
                  Loading models...
                </div>
              ) : cloudModels.length > 0 ? (
                <select
                  value={settings.model}
                  onChange={(e) => update('model', e.target.value)}
                  className={inputClass}
                >
                  {cloudModels.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-neutral-500 p-2 border border-white/10 rounded bg-black/20">
                  No models found. Click Refresh.
                </div>
              )}

              <input
                type="text"
                value={settings.model}
                onChange={(e) => update('model', e.target.value)}
                placeholder="Or type model name..."
                className={`${inputClass} mt-2`}
              />
            </div>
          </>
        )}

        {/* Skill selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-neutral-400">Skill</label>
            <button
              onClick={() => setShowAddSkill(!showAddSkill)}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              {showAddSkill ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {showAddSkill ? (
            <div className="space-y-2 p-3 rounded border border-white/10 bg-black/20">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Skill name..."
                className={inputClass}
              />
              <textarea
                value={newSkillPrompt}
                onChange={(e) => setNewSkillPrompt(e.target.value)}
                placeholder="System prompt..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
              <button
                onClick={handleAddSkill}
                disabled={!newSkillName.trim() || !newSkillPrompt.trim()}
                className="w-full px-3 py-1.5 rounded border border-white/10 bg-indigo-600
                           text-white text-xs font-medium
                           hover:bg-indigo-500 disabled:opacity-50
                           transition-colors"
              >
                Add Skill
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={settings.skill || 'assistant'}
                onChange={(e) => handleSkillChange(e.target.value)}
                className={`${inputClass} flex-1`}
              >
                <optgroup label="Default">
                  {DEFAULT_SKILLS.map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </optgroup>
                {customSkills.length > 0 && (
                  <optgroup label="Custom">
                    {customSkills.map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {isCustomSkill && (
                <button
                  onClick={() => handleDeleteSkill(settings.skill)}
                  className="px-2 rounded border border-red-500/30 bg-red-500/10
                             text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                  title="Delete skill"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>System Prompt</label>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => update('systemPrompt', e.target.value)}
            placeholder="System instructions..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Window Opacity: {Math.round(settings.opacity * 100)}%</label>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={settings.opacity}
            onChange={(e) => {
              const newOpacity = parseFloat(e.target.value)
              update('opacity', newOpacity)
              // Apply immediately via IPC
              if (window.electronAPI) {
                window.electronAPI.setOpacity(newOpacity)
              }
            }}
            className="w-full h-2 bg-white/10 rounded appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-indigo-500
                       [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="text-xs text-neutral-500 mt-1">
            Changes apply immediately
          </div>
        </div>

        <div>
          <label className={labelClass}>Overwatch Auto-Collapse: {settings.overwatchCollapseDelay || 10}s</label>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={settings.overwatchCollapseDelay || 10}
            onChange={(e) => update('overwatchCollapseDelay', parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-indigo-500
                       [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="text-xs text-neutral-500 mt-1">
            Time before Overwatch response auto-collapses (0 = never)
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 w-full px-4 py-2 rounded border border-white/10 bg-neutral-700
                   text-white text-sm font-medium
                   hover:bg-neutral-600
                   transition-colors"
      >
        Restart App
      </button>
    </div>
  )
}

export default Settings
