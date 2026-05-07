import { useState, useEffect, useCallback } from 'react'

export function useConversations() {
    const [conversations, setConversations] = useState([])
    const [currentConversation, setCurrentConversation] = useState(null)
    const [loading, setLoading] = useState(true)

    const loadConversations = useCallback(async () => {
        const list = await window.electronAPI.db.listConversations()
        setConversations(list)
        setLoading(false)
    }, [])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    const createConversation = useCallback(async (opts = {}) => {
        const conv = await window.electronAPI.db.createConversation(opts)
        setConversations(prev => [conv, ...prev])
        setCurrentConversation(conv)
        return conv
    }, [])

    const selectConversation = useCallback(async (id) => {
        const conv = await window.electronAPI.db.getConversation(id)
        setCurrentConversation(conv)
        return conv
    }, [])

    const updateConversation = useCallback(async (id, updates) => {
        const conv = await window.electronAPI.db.updateConversation(id, updates)
        setConversations(prev => prev.map(c => c.id === id ? conv : c))
        if (currentConversation?.id === id) {
            setCurrentConversation(conv)
        }
        return conv
    }, [currentConversation])

    const deleteConversation = useCallback(async (id) => {
        await window.electronAPI.db.deleteConversation(id)
        setConversations(prev => prev.filter(c => c.id !== id))
        if (currentConversation?.id === id) {
            setCurrentConversation(null)
        }
    }, [currentConversation])

    const archiveConversation = useCallback(async (id, archived = true) => {
        await window.electronAPI.db.archiveConversation(id, archived)
        setConversations(prev => prev.filter(c => c.id !== id))
        if (currentConversation?.id === id) {
            setCurrentConversation(null)
        }
    }, [currentConversation])

    const newConversation = useCallback(() => {
        setCurrentConversation(null)
    }, [])

    return {
        conversations,
        currentConversation,
        loading,
        createConversation,
        selectConversation,
        updateConversation,
        deleteConversation,
        archiveConversation,
        newConversation,
        refresh: loadConversations
    }
}
