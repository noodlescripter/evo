function TitleBar({
  onSettings,
  showSettings,
  onClear,
  onToggleHistory,
  showHistory,
  onSearch,
  onToggleMemories,
  showMemories,
  onEnterOverwatch
}) {
  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow()
    }
  }

  const btnBase = "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150"
  const btnInactive = "text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
  const btnActive = "bg-white/[0.1] text-white/90"

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] drag-region select-none">
      <div className="flex items-center gap-2 no-drag">
        {/* History toggle */}
        <button
          onClick={onToggleHistory}
          className={`${btnBase} ${showHistory ? btnActive : btnInactive}`}
          title="Chat history"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        <h1 className="text-sm font-medium text-white/80 tracking-tight">Evo</h1>
      </div>

      <div className="flex gap-1.5 no-drag">
        {/* Overwatch Mode */}
        <button
          onClick={onEnterOverwatch}
          className={`${btnBase} text-violet-400/80 hover:text-violet-300 hover:bg-violet-500/10`}
          title="Overwatch Mode"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        {/* Search */}
        <button
          onClick={onSearch}
          className={`${btnBase} ${btnInactive}`}
          title="Search (Ctrl+K)"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* Memories */}
        <button
          onClick={onToggleMemories}
          className={`${btnBase} ${showMemories ? btnActive : btnInactive}`}
          title="Memories"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </button>

        {/* New chat */}
        <button
          onClick={onClear}
          className={`${btnBase} ${btnInactive}`}
          title="New chat"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Settings */}
        <button
          onClick={onSettings}
          className={`${btnBase} ${showSettings ? btnActive : btnInactive}`}
          title="Settings"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className={`${btnBase} text-white/40 hover:text-white hover:bg-red-500/80`}
          title="Close"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TitleBar
