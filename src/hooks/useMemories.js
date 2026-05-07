import { useState, useEffect, useCallback } from 'react'

export function useMemories() {
    const [memories, setMemories] = useState([])
    const [loading, setLoading] = useState(true)

    const loadMemories = useCallback(async () => {
        const list = await window.electronAPI.db.listMemories()
        setMemories(list)
        setLoading(false)
    }, [])

    useEffect(() => {
        loadMemories()
    }, [loadMemories])

    const createMemory = useCallback(async ({ content, category = 'general', priority = 0 }) => {
        const mem = await window.electronAPI.db.createMemory({ content, category, priority })
        setMemories(prev => [mem, ...prev])
        return mem
    }, [])

    const updateMemory = useCallback(async (id, updates) => {
        const mem = await window.electronAPI.db.updateMemory(id, updates)
        setMemories(prev => prev.map(m => m.id === id ? mem : m))
        return mem
    }, [])

    const deleteMemory = useCallback(async (id) => {
        await window.electronAPI.db.deleteMemory(id)
        setMemories(prev => prev.filter(m => m.id !== id))
    }, [])

    const toggleMemory = useCallback(async (id) => {
        const mem = await window.electronAPI.db.toggleMemory(id)
        setMemories(prev => prev.map(m => m.id === id ? mem : m))
        return mem
    }, [])

    const getActivePrompt = useCallback(async () => {
        return window.electronAPI.db.getActiveMemoriesPrompt()
    }, [])

    return {
        memories,
        loading,
        createMemory,
        updateMemory,
        deleteMemory,
        toggleMemory,
        getActivePrompt,
        refresh: loadMemories
    }
}
